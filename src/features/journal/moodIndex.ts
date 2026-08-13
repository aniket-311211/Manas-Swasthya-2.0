import { localDayKey } from './doc';
import type { JournalEntryView, MoodKey } from './types';

/**
 * The rolling read of recent entries — one number for how the last stretch of
 * writing sounds, moving as they write.
 *
 * It is a reflection of the pages, not a measurement of the person. Nothing
 * here is a rating, a severity or an assessment, and the copy never implies
 * one. A low number means the recent writing was heavy; it is company, not a
 * verdict.
 *
 * Everything is pure and the clock is injectable, so it tests in the node env.
 */

export type Band = 'low' | 'tender' | 'steady' | 'bright';

export interface MoodPoint {
  dayKey: string;
  mood: MoodKey;
  at: string;
}

export interface MoodIndex {
  /** 0–100, exponentially weighted by recency. */
  score: number;
  band: Band;
  /** Short human phrase, never clinical. */
  label: string;
  /** One sentence describing the recent run. */
  blurb: string;
  /** Entries that actually carried a mood. */
  sampleSize: number;
  /** Direction against the stretch before this one. */
  trend: 'up' | 'down' | 'flat' | 'new';
  /** Signed points against the stretch before this one. */
  delta: number;
}

/**
 * Where each mood sits on the light/heavy axis, 0–1.
 *
 * Calm sits above excited on purpose: both are good days, but this is a read of
 * ease, and excitement carries its own charge.
 */
export const MOOD_VALENCE: Record<MoodKey, number> = {
  happy: 1,
  calm: 0.85,
  excited: 0.78,
  neutral: 0.5,
  anxious: 0.25,
  sad: 0.08,
};

/** Below this there is nothing to read, and a number would be invented. */
export const MIN_POINTS_FOR_INDEX = 2;

/**
 * A day's pull halves every five days, so this week outweighs last week and a
 * new entry visibly moves the number. The weights are relative, so a month of
 * not writing does not drift the number on its own — only writing moves it.
 */
const HALF_LIFE_DAYS = 5;

/** Under a few points of movement is rounding wobble, not a direction. */
const FLAT_POINTS = 3;

const COPY: Record<Band, { label: string; blurb: string }> = {
  low: {
    label: 'Carrying a lot',
    blurb:
      'The last stretch of writing has been heavy going — that is what is on the page, and you do not have to sit with it on your own.',
  },
  tender: {
    label: 'Tender lately',
    blurb: 'These entries read tender — some weight in them, and some ease alongside it.',
  },
  steady: {
    label: 'On an even keel',
    blurb: 'Recent entries sit fairly level, with nothing pulling hard in either direction.',
  },
  bright: {
    label: 'A lighter run',
    blurb: 'There is a lot of light in what you have written lately.',
  },
};

const NOT_YET = {
  label: 'Not enough to read yet',
  blurb:
    'Once a couple of entries carry a mood, this fills in on its own. There is nothing here to read from yet.',
};

/**
 * Whole days since the epoch, from a local day key. Day arithmetic rather than
 * millisecond arithmetic, so a DST shift never counts as part of a day.
 */
function dayNumber(dayKey: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dayKey);
  return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) / 86_400_000 : null;
}

function clampScore(value: number): number {
  return Number.isFinite(value) ? Math.min(100, Math.max(0, Math.round(value))) : 0;
}

function bandOf(score: number): Band {
  if (score < 30) return 'low';
  if (score < 48) return 'tender';
  if (score < 72) return 'steady';
  return 'bright';
}

/**
 * Entries that carry a mood, oldest first. An entry is dated by `createdAt`,
 * the same stamp the shelf and the calendar sort on.
 */
export function toMoodPoints(views: JournalEntryView[]): MoodPoint[] {
  return views
    .flatMap<MoodPoint>((view) => {
      const mood = view.doc?.mood?.mood;
      // `doc` is parsed JSON, so a mood key from an old or hand-edited row can
      // be anything at all. Anything not in the table is not a reading.
      if (typeof mood !== 'string' || !(mood in MOOD_VALENCE)) return [];
      const dayKey = localDayKey(view.createdAt);
      if (dayNumber(dayKey) === null) return [];
      return [{ dayKey, mood: mood as MoodKey, at: view.createdAt }];
    })
    .sort((a, b) => a.dayKey.localeCompare(b.dayKey));
}

export function computeMoodIndex(points: MoodPoint[], now: Date = new Date()): MoodIndex {
  const sampleSize = points.length;
  if (sampleSize < MIN_POINTS_FOR_INDEX) {
    // No score is invented here. `band` only exists so the shape stays whole —
    // `trend: 'new'` is what the card reads to know there is nothing yet.
    return { score: 0, band: 'steady', ...NOT_YET, sampleSize, trend: 'new', delta: 0 };
  }

  // One day, one voice: entries sharing a day are averaged before anything else,
  // so three hard entries in one evening stay one hard evening.
  const byDay = new Map<string, { sum: number; n: number }>();
  for (const p of points) {
    const cell = byDay.get(p.dayKey) ?? { sum: 0, n: 0 };
    cell.sum += MOOD_VALENCE[p.mood] ?? MOOD_VALENCE.neutral;
    cell.n += 1;
    byDay.set(p.dayKey, cell);
  }
  const days = [...byDay]
    .map(([dayKey, { sum, n }]) => ({ dayKey, value: sum / n }))
    .sort((a, b) => a.dayKey.localeCompare(b.dayKey));

  const today = dayNumber(localDayKey(now)) ?? 0;
  let weighted = 0;
  let total = 0;
  for (const day of days) {
    // Future-dated rows weigh the same as today rather than more.
    const age = Math.max(0, today - (dayNumber(day.dayKey) ?? today));
    const w = 2 ** (-age / HALF_LIFE_DAYS);
    weighted += w * day.value;
    total += w;
  }
  const mean = days.reduce((sum, d) => sum + d.value, 0) / days.length;
  // Weights only underflow to zero for years-old writing; the plain mean then.
  const score = clampScore((total > 0 ? weighted / total : mean) * 100);

  // Trend splits the writing days in half — the recent window against the one
  // before it. A split rather than fixed calendar weeks, so it still says
  // something for someone who writes twice a month.
  const mid = Math.floor(days.length / 2);
  const before = days.slice(0, mid);
  const after = days.slice(mid);
  const windowScore = (list: typeof days) =>
    clampScore((list.reduce((sum, d) => sum + d.value, 0) / list.length) * 100);
  const delta = before.length ? windowScore(after) - windowScore(before) : 0;
  const trend = delta > FLAT_POINTS ? 'up' : delta < -FLAT_POINTS ? 'down' : 'flat';

  const band = bandOf(score);
  return { score, band, ...COPY[band], sampleSize, trend, delta };
}
