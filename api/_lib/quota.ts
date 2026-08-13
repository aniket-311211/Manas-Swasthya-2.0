import { prisma } from './prisma';

/**
 * A daily allowance for a metered AI feature, counted in Postgres.
 *
 * Reserve-then-refund rather than count-then-call: the reservation happens
 * before the model is asked anything, so a user who fires ten requests at once
 * cannot slip past the cap in the window between reading a count and writing
 * it. The upsert-with-increment is a single atomic statement, so concurrent
 * requests queue on the row rather than racing on a number held in memory.
 *
 * A refund is issued only when the call fails on our side — a Gemini timeout
 * should not cost a student one of five. A refusal we chose (unreadable photo,
 * output we would not show) is still a real API call and stays charged, so
 * retrying junk cannot be used to grind through the key for free.
 */

export const MEDICINE_DAILY_LIMIT = 5;

/**
 * 'YYYY-MM-DD' in Asia/Kolkata.
 *
 * The users are in India; the functions may not be. Deriving the day from UTC
 * would roll the allowance over at 5:30am local, which reads as a bug to
 * everyone experiencing it. `en-CA` because it formats as ISO.
 */
export function istDay(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export interface Allowance {
  /** Whether this request may proceed. */
  allowed: boolean;
  /** Uses left AFTER this one, floored at zero. */
  remaining: number;
  limit: number;
  /** When the allowance refills, for the message shown to the user. */
  resetsAt: string;
}

/** Midnight IST after `now`, as an ISO instant. */
export function nextResetAt(now: Date = new Date()): string {
  // IST is a fixed UTC+5:30 with no daylight saving, so this is exact
  // arithmetic rather than a guess about a local calendar.
  const IST_OFFSET_MS = 5.5 * 3_600_000;
  const istNow = now.getTime() + IST_OFFSET_MS;
  const istMidnight = Math.floor(istNow / 86_400_000) * 86_400_000 + 86_400_000;
  return new Date(istMidnight - IST_OFFSET_MS).toISOString();
}

/**
 * Takes one use if any are left. Call this BEFORE the expensive work.
 */
export async function reserve(
  userId: string,
  feature: string,
  limit: number,
  now: Date = new Date(),
): Promise<Allowance> {
  const day = istDay(now);
  const where = { userId_feature_day: { userId, feature, day } };

  const existing = await prisma.aiUsage.findUnique({ where });
  if ((existing?.count ?? 0) >= limit) {
    return { allowed: false, remaining: 0, limit, resetsAt: nextResetAt(now) };
  }

  const row = await prisma.aiUsage.upsert({
    where,
    update: { count: { increment: 1 } },
    create: { userId, feature, day, count: 1 },
  });

  // Re-checked after the write. Two requests can both pass the read above; the
  // increments still serialise, so whichever one lands past the limit sees it
  // here and hands the use straight back.
  if (row.count > limit) {
    await refund(userId, feature, now);
    return { allowed: false, remaining: 0, limit, resetsAt: nextResetAt(now) };
  }

  return {
    allowed: true,
    remaining: Math.max(0, limit - row.count),
    limit,
    resetsAt: nextResetAt(now),
  };
}

/** Hands a reserved use back. Never throws — a failed refund must not mask the
 *  error that caused it. */
export async function refund(userId: string, feature: string, now: Date = new Date()): Promise<void> {
  try {
    await prisma.aiUsage.updateMany({
      where: { userId, feature, day: istDay(now), count: { gt: 0 } },
      data: { count: { decrement: 1 } },
    });
  } catch (err) {
    console.error('Failed to refund an AI use', err);
  }
}

/** What is left, without spending anything. */
export async function peek(
  userId: string,
  feature: string,
  limit: number,
  now: Date = new Date(),
): Promise<Allowance> {
  const row = await prisma.aiUsage.findUnique({
    where: { userId_feature_day: { userId, feature, day: istDay(now) } },
  });
  const used = row?.count ?? 0;
  return {
    allowed: used < limit,
    remaining: Math.max(0, limit - used),
    limit,
    resetsAt: nextResetAt(now),
  };
}
