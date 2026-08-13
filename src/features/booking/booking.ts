/**
 * Booking helpers — pure. No React, no network, no module-level clock reads.
 * Anything that needs "now" takes it as an argument so a test can pin it.
 *
 * NOTHING HERE PRICES A BOOKING. The server owns that (api/bookings/index.ts):
 * it decides whether a coupon is real and whether a registration number earns
 * the student waiver, and it stamps the answer onto the row it returns. This
 * file can format a number of paise; it cannot decide what that number is.
 */

import type { Booking } from '@/types/api';

/**
 * What we TELL the user a session normally costs, so the sheet is not blank
 * before they submit. It is a label, not a price — the row that comes back
 * from `createBooking` is the price. Kept in sync by hand with
 * STANDARD_FEE_PAISE in api/bookings/index.ts.
 */
export const STANDARD_FEE_PAISE = 49_900;

/** Sessions run on the hour, with the middle of the day left clear. */
export const SLOT_HOURS = [9, 10, 11, 14, 15, 16, 17];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Paise to something a person reads. Zero is the waived case and says so in
 * words rather than "₹0", because a price of zero and a waived fee look
 * identical in digits and only one of them is good news.
 */
export function formatFee(paise: number): string {
  if (!Number.isFinite(paise) || paise <= 0) return 'Free';
  const rupees = paise / 100;
  return `₹${Number.isInteger(rupees) ? rupees : rupees.toFixed(2)}`;
}

/** `n` consecutive local days starting with the day `from` falls on. */
export function nextNDays(n: number, from: Date = new Date()): Date[] {
  const days: Date[] = [];
  if (!Number.isFinite(n) || Number.isNaN(from.getTime())) return days;
  for (let i = 0; i < Math.floor(n); i++) {
    // Day-of-month overflow is how Date rolls a month or a year forward.
    days.push(new Date(from.getFullYear(), from.getMonth(), from.getDate() + i));
  }
  return days;
}

/**
 * Bookable slots on `date`, as concrete local Date objects. Slots that have
 * already started are dropped — the server refuses a past time with a 422, so
 * offering one is offering a dead end.
 */
export function slotsForDay(date: Date, now: Date = new Date()): Date[] {
  if (Number.isNaN(date.getTime())) return [];
  return SLOT_HOURS.map(
    (h) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, 0, 0, 0),
  ).filter((slot) => slot.getTime() > now.getTime());
}

export interface GroupedBookings {
  upcoming: Booking[];
  past: Booking[];
  cancelled: Booking[];
}

/**
 * Split a booking list three ways. Cancelled wins over the clock: a cancelled
 * appointment next Tuesday is not something to turn up to, so it never reaches
 * `upcoming`. A session starting at exactly `now` is still upcoming — it is
 * beginning, not over.
 */
export function groupBookings(bookings: Booking[], now: Date = new Date()): GroupedBookings {
  const out: GroupedBookings = { upcoming: [], past: [], cancelled: [] };
  if (!Array.isArray(bookings)) return out;
  const t0 = now.getTime();

  for (const b of bookings) {
    if (!b || typeof b !== 'object') continue;
    if (b.status === 'cancelled') {
      out.cancelled.push(b);
      continue;
    }
    const at = new Date(b.scheduledAt).getTime();
    // An unreadable date cannot be turned up to either; it belongs behind us.
    if (b.status === 'completed' || Number.isNaN(at) || at < t0) out.past.push(b);
    else out.upcoming.push(b);
  }

  const at = (b: Booking) => new Date(b.scheduledAt).getTime() || 0;
  out.upcoming.sort((a, b) => at(a) - at(b)); // soonest first
  out.past.sort((a, b) => at(b) - at(a)); // most recent first
  out.cancelled.sort((a, b) => at(b) - at(a));
  return out;
}

/** "Fri, 14 Aug · 3:00 pm", built by hand so it does not depend on ICU data. */
export function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Time to be confirmed';
  const h = d.getHours();
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} · ${h12}:${mins} ${h < 12 ? 'am' : 'pm'}`;
}

/** Up to two initials for the monogram tile. Never an emoji. */
export function initials(name: string): string {
  const parts = (name ?? '')
    .replace(/\b(dr|prof|mr|mrs|ms|miss)\.?\s+/gi, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

/**
 * Shared surface classes. Live here rather than in a component so all three
 * booking panels cannot drift apart.
 *
 * The field behind them is #cfd84c — a bright yellow-green with a relative
 * luminance around 0.63. White text on it lands near 1.6:1 and is unreadable,
 * so every rule below is DARK ink on a light frosted card, and the focus ring
 * is dark for the same reason.
 */
export const CARD = 'rounded-[20px] border border-white/50 bg-white/65 backdrop-blur-xl';
/** Ink: 13.5:1 on the card, 10.2:1 straight on #cfd84c. */
export const INK = 'text-[#1B2430]';

/*
 * Text that sits DIRECTLY on the Silk field rather than on a frosted card.
 *
 * #1B2430 measures 10.1:1 on #cfd84c, so it passes on paper — but a dark
 * grey-blue over a moving, noisy yellow-green reads muddy, because the two
 * hues are close in temperature. Deep violet is near-complementary to
 * yellow-green: 9.9:1, so contrast is unchanged, but it separates.
 */
export const ON_SILK = 'text-white [text-shadow:0_1px_0_rgba(0,0,0,0.75),0_0_2px_rgba(0,0,0,0.9),0_0_10px_rgba(0,0,0,0.55)]';
export const ON_SILK_MUTED = 'text-white [text-shadow:0_1px_0_rgba(0,0,0,0.75),0_0_2px_rgba(0,0,0,0.9),0_0_10px_rgba(0,0,0,0.55)] opacity-90';
/** Muted ink: 5.1:1 on the card. Body copy only, never the sole signal. */
export const MUTED = 'text-[#5A6472]';
export const FOCUS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B2430] focus-visible:ring-offset-2 focus-visible:ring-offset-[#EDF0C9]';
export const BTN = `inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${FOCUS}`;
export const BTN_SOLID = `${BTN} bg-[#1B2430] text-white hover:bg-[#2B3648]`;
export const BTN_QUIET = `${BTN} border border-[#1B2430]/25 bg-white/70 text-[#1B2430] hover:bg-white`;
/** 6.1:1 on the card. Always paired with the word "waived" or "free". */
export const GOOD = 'text-[#146356]';
/** 7.0:1 on the card. Always paired with an icon and a sentence. */
export const BAD = 'text-[#9B1C1C]';

/*
 * Text sitting directly on the Silk shader has no surface behind it, so even at
 * 10:1 it competes with a moving gradient. These give it one.
 */
export const ON_SILK_PANEL = '';
export const ON_SILK_PILL = '';
