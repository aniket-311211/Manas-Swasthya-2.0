import { describe, it, expect } from 'vitest';
import type { Booking } from '@/types/api';
import {
  SLOT_HOURS,
  formatFee,
  formatWhen,
  groupBookings,
  initials,
  nextNDays,
  slotsForDay,
} from '@/features/booking/booking';

/** Local midnight, so every assertion here lives in one timezone: the test's. */
const day = (y: number, m: number, d: number, h = 0, min = 0) => new Date(y, m - 1, d, h, min, 0, 0);

function booking(over: Partial<Booking> & { scheduledAt: string }): Booking {
  return {
    id: 'b1',
    userId: 'u1',
    mentorId: 'm1',
    mentorName: 'Dr Test',
    mode: 'video',
    durationMin: 45,
    status: 'scheduled',
    note: null,
    feePaise: 49_900,
    feeWaived: false,
    waiverReason: null,
    couponCode: null,
    registrationNo: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...over,
  };
}

describe('formatFee', () => {
  it('renders the standard fee in whole rupees', () => {
    expect(formatFee(49_900)).toBe('₹499');
    expect(formatFee(100)).toBe('₹1');
  });

  it('says Free rather than ₹0, because a waived fee is not a price', () => {
    expect(formatFee(0)).toBe('Free');
  });

  it('says Free for a waived booking, which is what the server sends back', () => {
    const waived = booking({ scheduledAt: '2026-05-01T09:00:00.000Z', feePaise: 0, feeWaived: true });
    expect(formatFee(waived.feePaise)).toBe('Free');
  });

  it('keeps paise when they exist rather than rounding money away', () => {
    expect(formatFee(49_950)).toBe('₹499.50');
    expect(formatFee(1)).toBe('₹0.01');
  });

  it('never renders a negative or unreadable amount as a charge', () => {
    expect(formatFee(-500)).toBe('Free');
    expect(formatFee(NaN)).toBe('Free');
    expect(formatFee(undefined as unknown as number)).toBe('Free');
  });
});

describe('nextNDays', () => {
  it('starts on the day it is given and runs consecutively', () => {
    const days = nextNDays(14, day(2026, 8, 6));
    expect(days).toHaveLength(14);
    expect(days[0].getDate()).toBe(6);
    expect(days[13].getDate()).toBe(19);
    expect(days.every((d) => d.getHours() === 0 && d.getMinutes() === 0)).toBe(true);
  });

  it('rolls across a month boundary instead of producing day 32', () => {
    const days = nextNDays(4, day(2026, 1, 30));
    expect(days.map((d) => [d.getMonth() + 1, d.getDate()])).toEqual([
      [1, 30],
      [1, 31],
      [2, 1],
      [2, 2],
    ]);
  });

  it('rolls across a leap-year February and across a year end', () => {
    expect(nextNDays(3, day(2028, 2, 28)).map((d) => d.getDate())).toEqual([28, 29, 1]);
    expect(nextNDays(3, day(2027, 2, 28)).map((d) => d.getDate())).toEqual([28, 1, 2]);

    const newYear = nextNDays(3, day(2026, 12, 31));
    expect(newYear.map((d) => d.getFullYear())).toEqual([2026, 2027, 2027]);
    expect(newYear.map((d) => d.getMonth())).toEqual([11, 0, 0]);
  });

  it('returns nothing for zero, negative and unreadable inputs', () => {
    expect(nextNDays(0, day(2026, 8, 6))).toEqual([]);
    expect(nextNDays(-5, day(2026, 8, 6))).toEqual([]);
    expect(nextNDays(3, new Date('not a date'))).toEqual([]);
  });
});

describe('slotsForDay', () => {
  it('offers every slot on a day that has not started yet', () => {
    const slots = slotsForDay(day(2026, 8, 10), day(2026, 8, 6, 12));
    expect(slots).toHaveLength(SLOT_HOURS.length);
    expect(slots.map((s) => s.getHours())).toEqual(SLOT_HOURS);
    expect(slots.every((s) => s.getDate() === 10)).toBe(true);
  });

  it('drops the slots that have already started today', () => {
    const slots = slotsForDay(day(2026, 8, 6), day(2026, 8, 6, 11, 30));
    expect(slots.map((s) => s.getHours())).toEqual([14, 15, 16, 17]);
  });

  it('treats a slot starting exactly now as gone, since the server would refuse it', () => {
    const slots = slotsForDay(day(2026, 8, 6), day(2026, 8, 6, 9, 0));
    expect(slots.map((s) => s.getHours())).toEqual([10, 11, 14, 15, 16, 17]);
  });

  it('returns nothing once the last slot of the day has passed', () => {
    expect(slotsForDay(day(2026, 8, 6), day(2026, 8, 6, 18))).toEqual([]);
  });

  it('returns nothing for a day in the past or an unreadable date', () => {
    expect(slotsForDay(day(2026, 8, 1), day(2026, 8, 6, 9))).toEqual([]);
    expect(slotsForDay(new Date('nope'), day(2026, 8, 6))).toEqual([]);
  });
});

describe('groupBookings', () => {
  const now = day(2026, 8, 6, 12);
  const iso = (d: Date) => d.toISOString();

  it('splits by the clock', () => {
    const g = groupBookings(
      [
        booking({ id: 'later', scheduledAt: iso(day(2026, 8, 9, 10)) }),
        booking({ id: 'earlier', scheduledAt: iso(day(2026, 8, 2, 10)) }),
      ],
      now,
    );
    expect(g.upcoming.map((b) => b.id)).toEqual(['later']);
    expect(g.past.map((b) => b.id)).toEqual(['earlier']);
    expect(g.cancelled).toEqual([]);
  });

  it('counts a booking starting at exactly now as upcoming, not past', () => {
    const g = groupBookings([booking({ id: 'right-now', scheduledAt: iso(now) })], now);
    expect(g.upcoming.map((b) => b.id)).toEqual(['right-now']);
    expect(g.past).toEqual([]);
  });

  it('never puts a cancelled booking in upcoming, however far in the future it is', () => {
    const g = groupBookings(
      [
        booking({ id: 'dead', status: 'cancelled', scheduledAt: iso(day(2026, 12, 25, 10)) }),
        booking({ id: 'dead-now', status: 'cancelled', scheduledAt: iso(now) }),
        booking({ id: 'dead-past', status: 'cancelled', scheduledAt: iso(day(2026, 1, 1, 10)) }),
        booking({ id: 'live', scheduledAt: iso(day(2026, 9, 1, 10)) }),
      ],
      now,
    );
    expect(g.upcoming.map((b) => b.id)).toEqual(['live']);
    expect(g.cancelled.map((b) => b.id)).toEqual(['dead', 'dead-now', 'dead-past']);
    expect(g.past).toEqual([]);
    expect(g.upcoming.some((b) => b.status === 'cancelled')).toBe(false);
  });

  it('treats a completed session as past even if its time has not arrived', () => {
    const g = groupBookings(
      [booking({ id: 'done', status: 'completed', scheduledAt: iso(day(2026, 9, 1, 10)) })],
      now,
    );
    expect(g.past.map((b) => b.id)).toEqual(['done']);
    expect(g.upcoming).toEqual([]);
  });

  it('orders upcoming soonest-first and everything else most-recent-first', () => {
    const g = groupBookings(
      [
        booking({ id: 'u2', scheduledAt: iso(day(2026, 9, 1, 10)) }),
        booking({ id: 'u1', scheduledAt: iso(day(2026, 8, 7, 10)) }),
        booking({ id: 'p1', scheduledAt: iso(day(2026, 8, 5, 10)) }),
        booking({ id: 'p2', scheduledAt: iso(day(2026, 1, 5, 10)) }),
      ],
      now,
    );
    expect(g.upcoming.map((b) => b.id)).toEqual(['u1', 'u2']);
    expect(g.past.map((b) => b.id)).toEqual(['p1', 'p2']);
  });

  it('files an unreadable date behind us instead of showing it as an appointment', () => {
    const g = groupBookings([booking({ id: 'junk', scheduledAt: 'sometime soon' })], now);
    expect(g.past.map((b) => b.id)).toEqual(['junk']);
    expect(g.upcoming).toEqual([]);
  });

  it('survives an empty or non-array input', () => {
    expect(groupBookings([], now)).toEqual({ upcoming: [], past: [], cancelled: [] });
    expect(groupBookings(null as unknown as Booking[], now)).toEqual({
      upcoming: [],
      past: [],
      cancelled: [],
    });
  });
});

describe('formatWhen', () => {
  it('reads as a day and a time', () => {
    expect(formatWhen(day(2026, 8, 14, 15, 0).toISOString())).toBe('Fri, 14 Aug · 3:00 pm');
    expect(formatWhen(day(2026, 8, 14, 9, 30).toISOString())).toBe('Fri, 14 Aug · 9:30 am');
  });

  it('says 12 rather than 0 at both ends of the day', () => {
    expect(formatWhen(day(2026, 8, 14, 0, 5).toISOString())).toContain('12:05 am');
    expect(formatWhen(day(2026, 8, 14, 12, 0).toISOString())).toContain('12:00 pm');
  });

  it('says so plainly when the date cannot be read', () => {
    expect(formatWhen('not a date')).toBe('Time to be confirmed');
    expect(formatWhen('')).toBe('Time to be confirmed');
  });
});

describe('initials', () => {
  it('takes first and last, dropping the title', () => {
    expect(initials('Dr. Ashish Mohanty')).toBe('AM');
    expect(initials('Priya Ramesh Mehta')).toBe('PM');
    expect(initials('Kavitha')).toBe('K');
  });

  it('never returns an empty tile', () => {
    expect(initials('')).toBe('?');
    expect(initials('   ')).toBe('?');
    expect(initials(undefined as unknown as string)).toBe('?');
  });
});
