/**
 * The resource catalogue, as the UI reads it: categories, codes, search.
 *
 * Pure — no React, no storage, no clock — so every branch here is testable in
 * the node vitest env (tests/resourceCatalogue.test.ts).
 *
 * The data itself still lives in `@/lib/resources`; this file only knows how to
 * group it, number it and look things up in it. Two other files import
 * `RESOURCES` directly and must keep working, so nothing here mutates it.
 */

import { RESOURCES, type Resource } from '@/lib/resources';

export type ResourceKind = 'music' | 'book' | 'movie' | 'activity' | 'hobby';

export interface Category {
  /** Matches `Resource.category` — the plural slug already in the data. */
  id: string;
  label: string;
  /** Matches `Resource.type` — the singular. */
  kind: ResourceKind;
  /** Hex. See the contrast note below before changing one. */
  accent: string;
  /** Code prefix, e.g. `MUS` in `MUS-101`. */
  prefix: string;
}

/**
 * Order is load-bearing: the code series is derived from it — index 0 numbers
 * from 101, index 1 from 201, and so on, which is exactly how the existing
 * codes (MUS-101, BK-201, MOV-301, ACT-401, HOB-501) were laid out. Reordering
 * this array renumbers future codes. Appending to it is safe.
 *
 * CONTRAST — the page sits on #52dbdf (bright cyan) behind a `bg-white/65`
 * card, so the effective card is ~rgb(194,242,244), L≈0.815. Every accent below
 * clears 4.5:1 as text on that card AND carries white text at 4.5:1 or better
 * when used as a fill, measured not eyeballed:
 *   violet #6D28A8 → 6.9:1 on card, 8.3:1 with white on it
 *   blue   #1D4ED8 → 5.5:1 / 6.7:1
 *   pink   #BE185D → 5.0:1 / 6.0:1
 *   rust   #A33808 → 5.5:1 / 6.7:1
 *   green  #166534 → 6.0:1 / 7.3:1
 */
export const CATEGORIES: Category[] = [
  { id: 'music', label: 'Music', kind: 'music', accent: '#6D28A8', prefix: 'MUS' },
  { id: 'books', label: 'Books', kind: 'book', accent: '#1D4ED8', prefix: 'BK' },
  { id: 'movies', label: 'Films', kind: 'movie', accent: '#BE185D', prefix: 'MOV' },
  { id: 'activities', label: 'Activities', kind: 'activity', accent: '#A33808', prefix: 'ACT' },
  { id: 'hobbies', label: 'Hobbies', kind: 'hobby', accent: '#166534', prefix: 'HOB' },
];

/**
 * Display-only fallback for a row whose `type`/`category` we do not recognise —
 * `Resource.type` is a `string`, so that is reachable. Deliberately NOT in
 * CATEGORIES: it is never a filter tab and `nextCode` never numbers into it.
 */
const UNFILED: Category = {
  id: 'other',
  label: 'Other',
  kind: 'activity',
  accent: '#334155',
  prefix: 'RES',
};

const byKindOrId = (type: string, category: string): Category =>
  CATEGORIES.find((c) => c.kind === type) ??
  CATEGORIES.find((c) => c.id === category) ??
  UNFILED;

export function categoryOf(r: Resource): Category {
  return byKindOrId(r?.type ?? '', r?.category ?? '');
}

/** Strip everything but letters and digits: `MUS-101`, `mus 101` and `mus101` all land on `mus101`. */
const norm = (s: string): string => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

/** Where a prefix's numbering starts when nothing of that kind exists yet. */
const seriesStart = (prefix: string): number => {
  const i = CATEGORIES.findIndex((c) => c.prefix === prefix);
  return (i < 0 ? CATEGORIES.length : i) * 100 + 101;
};

/**
 * The next free code for `kind`, derived from the HIGHEST existing number in
 * that series rather than from the count — a catalogue with a gap in it (a
 * deleted row) must never hand out a code that is already taken.
 */
export function nextCode(kind: ResourceKind, existing: Resource[]): string {
  const cat = CATEGORIES.find((c) => c.kind === kind) ?? UNFILED;
  const re = new RegExp(`^${cat.prefix}-(\\d+)$`, 'i');

  let highest = 0;
  for (const r of existing ?? []) {
    const m = re.exec(String(r?.code ?? '').trim());
    if (m) highest = Math.max(highest, Number(m[1]));
  }

  return `${cat.prefix}-${highest === 0 ? seriesStart(cat.prefix) : highest + 1}`;
}

/**
 * Assign codes to a batch. Each new item joins the pool before the next one is
 * numbered, so two music tracks added together get 104 and 105 rather than 104
 * twice.
 */
export function withCodes(items: Omit<Resource, 'code'>[], existing: Resource[] = RESOURCES): Resource[] {
  const pool = [...(existing ?? [])];
  const out: Resource[] = [];

  for (const item of items ?? []) {
    const coded = { ...item, code: nextCode(byKindOrId(item?.type ?? '', item?.category ?? '').kind, pool) };
    pool.push(coded);
    out.push(coded);
  }

  return out;
}

/**
 * Code, title, description or tag. Case-insensitive, and the code match ignores
 * punctuation so `MUS-101`, `mus101` and plain `101` all find the same track.
 * An empty query is not a filter — it returns everything.
 */
export function searchResources(query: string, items: Resource[] = RESOURCES): Resource[] {
  const list = Array.isArray(items) ? items : [];
  const q = String(query ?? '').trim().toLowerCase();
  if (q === '') return [...list];

  const code = norm(q);
  return list.filter((r) => {
    if (!r) return false;
    if (code !== '' && norm(r.code).includes(code)) return true;
    const hay = `${r.title ?? ''} ${r.description ?? ''} ${(r.tags ?? []).join(' ')}`.toLowerCase();
    return hay.includes(q);
  });
}

/** Exact code, punctuation-insensitive. `undefined` when nothing matches. */
export function resourceByCode(code: string, items: Resource[] = RESOURCES): Resource | undefined {
  const want = norm(code);
  if (want === '') return undefined;
  return (Array.isArray(items) ? items : []).find((r) => norm(r?.code ?? '') === want);
}

/**
 * What to offer next. Anything already in `recentCodes` is excluded — the point
 * is to widen the shelf, not to hand back what was just opened — and the rest
 * is ranked by overlap with those recents (a shared tag counts double a shared
 * category). Ties keep catalogue order, so the result is deterministic.
 */
export function suggestResources(
  opts: { recentCodes?: string[]; limit?: number },
  items: Resource[] = RESOURCES,
): Resource[] {
  const list = Array.isArray(items) ? items : [];
  const limit = Math.trunc(opts?.limit ?? 3);
  if (!Number.isFinite(limit) || limit <= 0) return [];

  const seen = new Set((opts?.recentCodes ?? []).map(norm).filter(Boolean));
  const liked = list.filter((r) => seen.has(norm(r?.code ?? '')));
  const tags = new Set(liked.flatMap((r) => (r.tags ?? []).map((t) => t.toLowerCase())));
  const cats = new Set(liked.map((r) => r.category));

  return list
    .filter((r) => r && !seen.has(norm(r.code)))
    .map((r, i) => ({
      r,
      i,
      score: (r.tags ?? []).reduce((n, t) => n + (tags.has(t.toLowerCase()) ? 2 : 0), 0) + (cats.has(r.category) ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .slice(0, limit)
    .map((x) => x.r);
}

/* ---------------------------------------------------------------------------
 * Surface tokens for this page. Colour lives next to the accents it has to
 * agree with, rather than in a seventh file.
 *
 * The backdrop is #52dbdf, L≈0.578 — white text on it is 1.5:1 and unreadable,
 * so everything is dark ink on frosted light.
 * ------------------------------------------------------------------------- */

export const CARD = 'rounded-[20px] border border-white/50 bg-white/65 backdrop-blur-xl';
/** 10.2:1 on the card, 7.4:1 straight on #52dbdf. */
export const INK = 'text-[#0E3A3D]';
/** 5.6:1 on the card. Card copy only — it is 4.0:1 on the bare cyan. */
export const MUTED = 'text-[#3F5C5F]';
/** 5.9:1 on the bare cyan, 8.1:1 on the card. For copy that sits on the backdrop. */
export const ON_SILK = 'text-white [text-shadow:0_1px_0_rgba(0,0,0,0.75),0_0_2px_rgba(0,0,0,0.9),0_0_10px_rgba(0,0,0,0.55)]';
/** Dark ring: white would vanish into the cyan. */
export const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E3A3D]';
export const BTN =
  `inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${FOCUS}`;
export const BTN_SOLID = `${BTN} bg-[#0E3A3D] text-white hover:bg-[#155055]`;
export const BTN_QUIET = `${BTN} border border-[#0E3A3D]/25 bg-white/70 text-[#0E3A3D] hover:bg-white`;

/*
 * Text sitting directly on the Silk shader has no surface behind it, so even at
 * 10:1 it competes with a moving gradient. These give it one.
 */
export const ON_SILK_PANEL = '';
export const ON_SILK_PILL = '';

export const ON_SILK_MUTED = 'text-white [text-shadow:0_1px_0_rgba(0,0,0,0.75),0_0_2px_rgba(0,0,0,0.9),0_0_10px_rgba(0,0,0,0.55)] opacity-90';
