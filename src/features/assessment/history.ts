/**
 * Past assessments, read back safely.
 *
 * The `answers` column is `unknown` for a reason: it has held at least three
 * different things over this app's life — the v2 `StoredAnswers` shape, the old
 * `{responses, domainScores, riskLevel, summary, recommendations}` blob, and
 * whatever a driver hands back for a JSON column (sometimes a string, sometimes
 * a double-encoded string, sometimes null). Everything here is written on the
 * assumption that the JSON is hostile. Nothing throws; a row we cannot fully
 * read degrades to the parts we can.
 *
 * `overall` NEVER comes out of that JSON. It is always recomputed with
 * `wellnessScore` from the three integer columns, which is the exact formula the
 * dashboard's WellnessScoreCard uses. That is the one guarantee that stops this
 * screen and the dashboard from ever showing two different headline numbers.
 *
 * Pure: no React, no clock, no network. Node-testable.
 */

import type { Assessment } from '@/types/api';
import { wellnessScore } from '@/lib/wellness';
import { DOMAINS, DOMAIN_META, type Domain } from './domain';

export interface PastAssessment {
  id: string;
  createdAt: string;
  stress: number;
  anxiety: number;
  sleep: number;
  /** Via `wellnessScore`, so it matches the dashboard. */
  overall: number;
  domainScores: Partial<Record<Domain, number>>;
  riskLevel?: 'low' | 'moderate' | 'high';
  summary?: string;
}

export interface DomainDelta {
  domain: Domain;
  now: number;
  before: number;
  delta: number;
}

export interface Comparison {
  current: PastAssessment;
  previous: PastAssessment | null;
  overallDelta: number;
  domains: DomainDelta[];
  /** Biggest gain first. */
  improved: DomainDelta[];
  /** Biggest drop first. */
  slipped: DomainDelta[];
  headline: string;
  narrative: string;
}

const RISKS = ['low', 'moderate', 'high'] as const;

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** 0–100 integer. Anything unreadable reads as 0 rather than NaN. */
function pct(v: unknown): number {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
  return Number.isFinite(n) ? Math.min(100, Math.max(0, Math.round(n))) : 0;
}

/**
 * `answers` → a plain bag of fields, or `{}`.
 * Two unwraps because JSON columns come back double-encoded often enough to be
 * worth the extra loop, and never more than that.
 */
function asBag(raw: unknown): Record<string, unknown> {
  let v = raw;
  for (let i = 0; i < 2 && typeof v === 'string'; i++) {
    try {
      v = JSON.parse(v);
    } catch {
      return {};
    }
  }
  return isRecord(v) ? v : {};
}

/**
 * v2 and the old shape both keep domain wellbeing under `domainScores`, both
 * 0–100 and both "higher is better", so one reader covers them. Unknown keys are
 * dropped; a domain we cannot read is simply absent rather than a fake zero.
 */
function readDomainScores(bag: Record<string, unknown>): Partial<Record<Domain, number>> {
  const raw = bag.domainScores;
  if (!isRecord(raw)) return {};
  const out: Partial<Record<Domain, number>> = {};
  for (const d of DOMAINS) {
    const v = raw[d];
    const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
    if (Number.isFinite(n)) out[d] = Math.min(100, Math.max(0, Math.round(n)));
  }
  return out;
}

function readRisk(bag: Record<string, unknown>): PastAssessment['riskLevel'] {
  const r = bag.riskLevel;
  return typeof r === 'string' && (RISKS as readonly string[]).includes(r)
    ? (r as PastAssessment['riskLevel'])
    : undefined;
}

function readSummary(bag: Record<string, unknown>): string | undefined {
  const s = bag.summary;
  return typeof s === 'string' && s.trim() !== '' ? s.trim() : undefined;
}

/**
 * Newest first. Rows without a parseable `createdAt` are dropped — they cannot
 * be placed on a timeline, and every consumer here is a timeline. Everything
 * else survives: a row with usable stress/anxiety/sleep is still a data point
 * even when its `answers` blob is unreadable.
 */
export function toPast(rows: Assessment[]): PastAssessment[] {
  if (!Array.isArray(rows)) return [];
  const out: PastAssessment[] = [];

  for (const row of rows as unknown[]) {
    if (!isRecord(row)) continue;
    // Over HTTP this is always a string, but a Date arrives when a handler is
    // called directly (tests, SSR) — dropping the row for that would be silly.
    const createdAt =
      typeof row.createdAt === 'string'
        ? row.createdAt
        : row.createdAt instanceof Date
          ? row.createdAt.toISOString()
          : '';
    if (createdAt === '' || Number.isNaN(Date.parse(createdAt))) continue;

    const stress = pct(row.stress);
    const anxiety = pct(row.anxiety);
    const sleep = pct(row.sleep);
    const bag = asBag(row.answers);

    out.push({
      id: typeof row.id === 'string' && row.id !== '' ? row.id : String(row.id ?? createdAt),
      createdAt,
      stress,
      anxiety,
      sleep,
      // The dashboard's formula, on sanitised columns. Never from the JSON.
      overall: wellnessScore({ stress, anxiety, sleep } as Assessment),
      domainScores: readDomainScores(bag),
      riskLevel: readRisk(bag),
      summary: readSummary(bag),
    });
  }

  return out.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

const label = (d: Domain) => DOMAIN_META[d].label;

function headlineFor(previous: PastAssessment | null, overallDelta: number): string {
  if (!previous) return 'This is your first reflection — from here you will be able to see how things move.';
  if (overallDelta > 0) return `A little more room to breathe than last time, up ${overallDelta}.`;
  if (overallDelta < 0) return 'A heavier stretch than last time — worth knowing, not worth blaming yourself for.';
  return 'Much the same as last time, and steady is its own kind of answer.';
}

function narrativeFor(
  current: PastAssessment,
  previous: PastAssessment | null,
  overallDelta: number,
  domains: DomainDelta[],
  improved: DomainDelta[],
  slipped: DomainDelta[],
): string {
  if (!previous) {
    return (
      `This is the first reflection we have for you, so there is nothing to compare it against yet. ` +
      `Your overall score today is ${current.overall} out of 100. ` +
      `Take another in a week or two and this space will tell you what moved.`
    );
  }

  const parts: string[] = [
    overallDelta > 0
      ? `Your overall score is up ${overallDelta}, from ${previous.overall} to ${current.overall} out of 100.`
      : overallDelta < 0
        ? `Your overall score is ${-overallDelta} lower than last time, ${previous.overall} down to ${current.overall} out of 100.`
        : `Your overall score is holding at ${current.overall} out of 100, the same as last time.`,
  ];

  const up = improved.slice(0, 2);
  if (up.length === 1) parts.push(`${label(up[0].domain)} lifted the most, up ${up[0].delta}.`);
  else if (up.length === 2)
    parts.push(`${label(up[0].domain)} is up ${up[0].delta} and ${label(up[1].domain)} is up ${up[1].delta}.`);

  const down = slipped.slice(0, 2);
  if (down.length === 1) parts.push(`${label(down[0].domain)} is asking for some attention, down ${-down[0].delta}.`);
  else if (down.length === 2)
    parts.push(
      `${label(down[0].domain)} and ${label(down[1].domain)} are asking for some attention, ` +
        `down ${-down[0].delta} and ${-down[1].delta}.`,
    );

  if (parts.length === 1) {
    parts.push(
      domains.length > 0
        ? 'Nothing moved much across the six areas, which is its own kind of steady.'
        : 'We could not read the area-by-area detail this time, so this is the headline number only.',
    );
  }

  return parts.join(' ');
}

/**
 * Newest against the one before it. `history` is expected newest-first, the way
 * `toPast` returns it. Null when there is nothing recorded yet.
 *
 * A domain only appears in `domains` if the CURRENT assessment has a readable
 * score for it — inventing a value to fill the shape would put a number on the
 * radar that nobody ever answered. Where the previous one is missing that
 * domain, `before` mirrors `now` so the delta is an honest zero.
 */
export function compare(history: PastAssessment[]): Comparison | null {
  const current = Array.isArray(history) ? history[0] : undefined;
  if (!current) return null;

  const previous = history[1] ?? null;
  const overallDelta = previous ? current.overall - previous.overall : 0;

  const domains: DomainDelta[] = DOMAINS.filter((d) => current.domainScores[d] !== undefined).map((d) => {
    const now = current.domainScores[d] as number;
    const before = previous?.domainScores[d] ?? now;
    return { domain: d, now, before, delta: now - before };
  });

  const improved = domains.filter((d) => d.delta > 0).sort((a, b) => b.delta - a.delta);
  const slipped = domains.filter((d) => d.delta < 0).sort((a, b) => a.delta - b.delta);

  return {
    current,
    previous,
    overallDelta,
    domains,
    improved,
    slipped,
    headline: headlineFor(previous, overallDelta),
    narrative: narrativeFor(current, previous, overallDelta, domains, improved, slipped),
  };
}

/** Oldest → newest, for a left-to-right chart. Takes the most recent `limit`. */
export function trendSeries(history: PastAssessment[], limit = 12): { at: string; overall: number }[] {
  if (!Array.isArray(history) || limit <= 0) return [];
  return history
    .slice(0, limit)
    .reverse()
    .map((h) => ({ at: h.createdAt, overall: h.overall }));
}
