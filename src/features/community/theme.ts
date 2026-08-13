/**
 * The community page: surface tokens, plus the pure parts of the group chat.
 *
 * Pure — no React, no network, no module-level clock read. Anything that needs
 * "now" takes it as an argument, so every branch below is testable in the node
 * vitest env (tests/communityHelpers.test.ts).
 *
 * CONTRAST — measured, not eyeballed. The field is #e46cea, a bright
 * pink-magenta with a relative luminance of 0.332:
 *   · black on it   7.6:1  ✓
 *   · white on it   2.8:1  ✗  — unreadable on its own
 * So nothing here is plain white text on the bare shader, and every card is
 * dark ink on frosted light. Behind `bg-white/70` the field flattens to about
 * rgb(247,211,249), L≈0.731 — that is the surface the card ratios are against.
 */

import type { CommunityMessage } from '@/types/api';

/* ---------------------------------------------------------------------------
 * Surface
 * ------------------------------------------------------------------------- */

export const CARD = 'rounded-[20px] border border-white/50 bg-white/70 backdrop-blur-xl';
/** 13.1:1 on the card, 6.4:1 straight on #e46cea. */
export const INK = 'text-[#2B0B2E]';
/** 6.1:1 on the card. Card copy only — it is 3.0:1 on the bare pink. */
export const MUTED = 'text-[#6A3F70]';
/**
 * Copy that sits directly on the Silk. White alone is 2.8:1 here, so the black
 * outline is not decoration — it is what makes the glyph edges legible against
 * a moving gradient. Same treatment as the resources catalogue.
 */
export const ON_SILK =
  'text-white [text-shadow:0_1px_0_rgba(0,0,0,0.75),0_0_2px_rgba(0,0,0,0.9),0_0_10px_rgba(0,0,0,0.55)]';
export const ON_SILK_MUTED = `${ON_SILK} opacity-90`;
/** Dark ring: a white one dissolves into the pink. */
export const FOCUS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B0B2E] focus-visible:ring-offset-2 focus-visible:ring-offset-white';
export const BTN =
  `inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${FOCUS}`;
export const BTN_SOLID = `${BTN} bg-[#2B0B2E] text-white hover:bg-[#43164A]`;
export const BTN_QUIET = `${BTN} border border-[#2B0B2E]/25 bg-white/70 text-[#2B0B2E] hover:bg-white`;
/** 6.1:1 on the card. Never the only signal — always next to an icon and a sentence. */
export const BAD = 'text-[#9B1C1C]';
/**
 * Mentor green, near-complementary to the page so it cannot be mistaken for the
 * background: 7.0:1 as text on the card, 9.4:1 carrying white as a fill. Colour
 * is the last of four mentor signals, never the only one.
 */
export const MENTOR_INK = 'text-[#0F5132]';
export const MENTOR_RAIL = 'border-l-4 border-[#0F5132]';
export const MENTOR_PILL =
  'inline-flex items-center gap-1 rounded-full bg-[#0F5132] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-white';

/** Monogram tiles. Dark enough that white initials sit at 7:1 or better. */
const TILES: [string, string][] = [
  ['#2F4858', '#4A6E7E'],
  ['#3A3F58', '#5A5F80'],
  ['#1F4B43', '#356F63'],
  ['#4A3350', '#6E4E76'],
  ['#4A3A28', '#71583C'],
  ['#243C5A', '#3C5D85'],
];
/** Mentors get the one tile nobody else can be assigned. */
export const MENTOR_TILE: [string, string] = ['#0F5132', '#1C7A4B'];

/** Stable per-name tile, so the same person keeps the same colour down the thread. */
export function monogramTile(name: string): [string, string] {
  let sum = 0;
  for (const ch of name ?? '') sum += ch.charCodeAt(0);
  return TILES[sum % TILES.length];
}

/** Already written for the booking monograms; a second copy would only drift. */
export { initials } from '@/features/booking/booking';

/* ---------------------------------------------------------------------------
 * Time
 * ------------------------------------------------------------------------- */

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Which local day a moment falls on. Empty string for an unreadable date. */
const dayKey = (d: Date): string =>
  Number.isNaN(d.getTime()) ? '' : `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

/** "9:30 am", built by hand so it does not depend on ICU data being present. */
export function clockTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const h = d.getHours();
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(d.getMinutes()).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;
}

/**
 * How long ago a message was posted. Anything older than a day falls back to
 * the clock, because the day divider above it already carries the date.
 *
 * A timestamp in the future is a clock disagreeing with the server, not a
 * message from tomorrow, so it reads as "just now" rather than "-3 min ago".
 */
export function relativeTime(iso: string, now: Date = new Date()): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const secs = Math.round((now.getTime() - t) / 1000);
  if (secs < 45) return 'just now';
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  return clockTime(iso);
}

/** "Today" / "Yesterday" / "Fri, 14 Aug". Empty string for an unreadable date. */
export function dayLabel(iso: string, now: Date = new Date()): string {
  const d = new Date(iso);
  const key = dayKey(d);
  if (key === '') return '';
  if (key === dayKey(now)) return 'Today';
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (key === dayKey(yesterday)) return 'Yesterday';
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/* ---------------------------------------------------------------------------
 * Threading
 * ------------------------------------------------------------------------- */

export interface MessageBlock {
  /** The first message's id — a stable React key that survives a poll. */
  id: string;
  authorName: string;
  isMentor: boolean;
  badge: string | null;
  /** Set only when this block opens a new day: the divider to draw above it. */
  dayLabel: string | null;
  messages: CommunityMessage[];
}

/**
 * Consecutive messages from one person on one day, collapsed into a block, so
 * the name and the avatar are shown once rather than on every line.
 *
 * `isMentor` breaks a block even when the name matches: a student who happens
 * to share a name with a mentor must never end up under the mentor's badge.
 * Order is the server's order (oldest first) and is never re-sorted here.
 */
export function groupMessages(
  messages: CommunityMessage[],
  now: Date = new Date(),
): MessageBlock[] {
  const out: MessageBlock[] = [];
  if (!Array.isArray(messages)) return out;
  let lastDay: string | null = null;

  for (const m of messages) {
    if (!m || typeof m !== 'object') continue;
    const key = dayKey(new Date(m.timestamp));
    const newDay = key !== lastDay;
    const open = out[out.length - 1];
    // Normalise BEFORE comparing, or a nameless author never matches the block
    // they just opened. The server's own fallback is this same word.
    const author = m.authorName || 'Someone';
    const isMentor = Boolean(m.isMentor);

    if (!newDay && open && open.authorName === author && open.isMentor === isMentor) {
      open.messages.push(m);
      continue;
    }

    const label = newDay ? dayLabel(m.timestamp, now) : '';
    out.push({
      id: m.id,
      authorName: author,
      isMentor,
      badge: m.badge ?? null,
      dayLabel: label === '' ? null : label,
      messages: [m],
    });
    lastDay = key;
  }

  return out;
}
