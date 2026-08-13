import { describe, it, expect, afterAll } from 'vitest';
import 'dotenv/config';
import users from '../api/users';
import bookings, {
  couponIsValid,
  normaliseCoupon,
  priceBooking,
  registrationIsValid,
} from '../api/bookings/index';
import { prisma } from '../api/_lib/prisma';
import { mockReq, mockRes } from './helpers/mockRes';
import type { Booking } from '@/types/api';

const ID = 'TEST_booking_e2e';
interface Envelope<T = unknown> { ok: boolean; data?: T; error?: string }

const soon = () => new Date(Date.now() + 3 * 86400000).toISOString();

afterAll(async () => {
  const user = await prisma.user.findUnique({ where: { clerkId: ID } });
  if (user) {
    await prisma.booking.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  }
  await prisma.$disconnect();
});

async function ensureUser() {
  const u = mockRes();
  await users(
    mockReq({ method: 'POST', body: { clerkId: ID, email: 'booking@test.manasswasthya.app', firstName: 'Bo' } }),
    u.res,
  );
}

const create = async (body: Record<string, unknown>) => {
  const r = mockRes();
  await bookings(
    mockReq({
      method: 'POST',
      body: { clerkId: ID, mentorId: 'm1', mentorName: 'Dr Test', scheduledAt: soon(), ...body },
    }),
    r.res,
  );
  return r.captured;
};

describe('pricing is decided server-side', () => {
  it('charges the standard fee with no code and no registration number', () => {
    const p = priceBooking({});
    expect(p.feeWaived).toBe(false);
    expect(p.feePaise).toBeGreaterThan(0);
    expect(p.waiverReason).toBeNull();
  });

  it('waives the fee for a valid coupon and records which one', () => {
    const p = priceBooking({ couponCode: 'democode55' });
    expect(p.feeWaived).toBe(true);
    expect(p.feePaise).toBe(0);
    expect(p.waiverReason).toBe('coupon');
    expect(p.couponCode).toBe('DEMOCODE55');
  });

  it('waives the fee for a registered student', () => {
    const p = priceBooking({ registrationNo: '21BCE1234' });
    expect(p.feeWaived).toBe(true);
    expect(p.waiverReason).toBe('student');
  });

  it('does not waive on an unknown code or a malformed registration number', () => {
    expect(priceBooking({ couponCode: 'FREESTUFF1' }).feeWaived).toBe(false);
    for (const bad of ['', 'hello', '12', 'ABCDEF']) {
      expect(priceBooking({ registrationNo: bad }).feeWaived).toBe(false);
    }
  });
});

describe('coupon normalisation', () => {
  it('accepts spacing and case the way a person would type it', () => {
    for (const typed of ['democode55', 'DEMO-CODE-55', ' DemoCode55 ']) {
      expect(normaliseCoupon(typed)).toBe('DEMOCODE55');
      expect(couponIsValid(typed)).toBe(true);
    }
  });

  it('rejects near-misses rather than being generous', () => {
    for (const bad of ['DEMOCODE5', 'DEMOCODE55F', 'XXXXXXXXXX', '']) {
      expect(couponIsValid(bad)).toBe(false);
    }
  });
});

describe('registration number shape', () => {
  it('accepts realistic formats, case-insensitively', () => {
    for (const good of ['21BCE1234', '22cse001', '20MECH12345']) {
      expect(registrationIsValid(good)).toBe(true);
    }
  });
});

describe('bookings endpoint (live db)', () => {
  it('creates a booking, prices it, and lists it back', async () => {
    await ensureUser();
    const made = await create({ note: 'First session', durationMin: 45 });
    expect(made.statusCode).toBe(201);
    const booking = (made.body as Envelope<Booking>).data!;
    expect(booking.feeWaived).toBe(false);
    expect(booking.status).toBe('scheduled');

    const list = mockRes();
    await bookings(mockReq({ method: 'GET', query: { clerkId: ID } }), list.res);
    const rows = (list.captured.body as Envelope<Booking[]>).data ?? [];
    expect(rows.some((b) => b.id === booking.id)).toBe(true);
  });

  it('honours a coupon and never trusts a client-sent price', async () => {
    await ensureUser();
    // feePaise is deliberately not in the schema; if it leaked through, this
    // booking would cost one paisa.
    const made = await create({ couponCode: 'DEMOCODE88', feePaise: 1 });
    const booking = (made.body as Envelope<Booking>).data!;
    expect(booking.feeWaived).toBe(true);
    expect(booking.feePaise).toBe(0);
    expect(booking.couponCode).toBe('DEMOCODE88');
  });

  it('refuses an invalid coupon instead of quietly charging full price', async () => {
    await ensureUser();
    const made = await create({ couponCode: 'NOTAREALCODE' });
    expect(made.statusCode).toBe(422);
  });

  it('refuses a booking in the past', async () => {
    await ensureUser();
    const made = await create({ scheduledAt: new Date(Date.now() - 86400000).toISOString() });
    expect(made.statusCode).toBe(422);
  });

  it('refuses an unreadable date', async () => {
    await ensureUser();
    expect((await create({ scheduledAt: 'next tuesday-ish' })).statusCode).toBe(422);
  });

  it('cancels rather than deletes, so the record survives', async () => {
    await ensureUser();
    const booking = (await create({})).body as Envelope<Booking>;
    const id = booking.data!.id;

    const del = mockRes();
    await bookings(mockReq({ method: 'DELETE', query: { id, clerkId: ID } }), del.res);
    expect((del.captured.body as Envelope<Booking>).data?.status).toBe('cancelled');

    const list = mockRes();
    await bookings(mockReq({ method: 'GET', query: { clerkId: ID } }), list.res);
    const rows = (list.captured.body as Envelope<Booking[]>).data ?? [];
    expect(rows.find((b) => b.id === id)?.status).toBe('cancelled');
  });

  it('will not let one user touch another user\'s booking', async () => {
    await ensureUser();
    const booking = (await create({})).body as Envelope<Booking>;
    const other = mockRes();
    await users(
      mockReq({ method: 'POST', body: { clerkId: `${ID}_other`, email: 'other@test.manasswasthya.app' } }),
      other.res,
    );
    const attempt = mockRes();
    await bookings(
      mockReq({ method: 'DELETE', query: { id: booking.data!.id, clerkId: `${ID}_other` } }),
      attempt.res,
    );
    expect(attempt.captured.statusCode).toBe(404);
    await prisma.user.deleteMany({ where: { clerkId: `${ID}_other` } });
  });

  it('refuses a token for somebody who is not a user here', async () => {
    const r = mockRes();
    await bookings(mockReq({ method: 'GET', query: { clerkId: 'TEST_no_bookings_here' } }), r.res);
    expect(r.captured.statusCode).toBe(401);
  });

  it('will not hand over a booking list to an unauthenticated caller', async () => {
    // Naming the victim used to be enough: mentor, time, private note and
    // registration number all came back.
    const r = mockRes();
    await bookings(mockReq({ method: 'GET', query: { clerkId: ID }, auth: false }), r.res);
    expect(r.captured.statusCode).toBe(401);
  });

  it('rejects a malformed body with 422', async () => {
    const r = mockRes();
    await bookings(mockReq({ method: 'POST', body: { clerkId: ID } }), r.res);
    expect(r.captured.statusCode).toBe(422);
  });
});
