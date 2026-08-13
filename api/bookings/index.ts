import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../_lib/prisma';
import { ok, fail, parseBody, methodGuard, queryStr, withErrors } from '../_lib/http';
import { BookingCreate, BookingUpdate } from '../_lib/schemas';
import { requireVerifiedUser } from '../_lib/clerkAuth';

/**
 * Consultation bookings.
 *
 * WHERE THE COUPON CODES LIVE, AND WHY: here, on the server, and nowhere else.
 * A code "embedded in the frontend" is not embedded, it is published — Vite
 * bundles it into a JS file any student can open in devtools, and all five
 * would be public within a day. Redemption is therefore a server decision: the
 * client posts a code, this file says yes or no, and the client is never told
 * what the valid codes are.
 *
 * Same for the student waiver. The browser sends a registration number, the
 * server decides. A client that could set `feeWaived` itself would make the
 * fee optional for anyone who can open a network tab.
 */

/**
 * Waiver codes, read from the environment.
 *
 * These were literals in this file. That was fine while the repository was
 * private and wrong the moment it became public: a code in a public source tree
 * is a code anyone can read and redeem, and this one waives a real fee. They
 * now come from BOOKING_COUPON_CODES — comma-separated, optionally `CODE:Label`
 * — so rotating them is a deploy variable rather than a commit.
 *
 * Empty by default. No codes configured means no code works, which is the
 * correct behaviour for a fresh clone: nobody should inherit a working discount
 * from someone else's deployment.
 *
 * Format: `DEMOCODE55:Campus drive,DEMOCODE66:Peer support week`
 */
function loadCoupons(): Record<string, { label: string; active: boolean }> {
  const raw = process.env.BOOKING_COUPON_CODES ?? '';
  const out: Record<string, { label: string; active: boolean }> = {};
  for (const entry of raw.split(',')) {
    const [code, ...rest] = entry.split(':');
    const key = code.trim().toUpperCase().replace(/[\s-]/g, '');
    if (!key) continue;
    out[key] = { label: rest.join(':').trim() || 'Waiver', active: true };
  }
  return out;
}

const COUPONS = loadCoupons();

/** Overridable so a deployment can price in its own currency terms. */
const STANDARD_FEE_PAISE = Number(process.env.BOOKING_FEE_PAISE ?? 49_900);

/** Registration numbers look like 2 digits, 2-6 letters, 3-6 digits. */
const REGISTRATION_RE = /^[0-9]{2}[A-Z]{2,6}[0-9]{3,6}$/i;

export function normaliseCoupon(raw: string): string {
  return raw.trim().toUpperCase().replace(/[\s-]/g, '');
}

export function couponIsValid(raw: string): boolean {
  const code = normaliseCoupon(raw);
  return COUPONS[code]?.active === true;
}

export function registrationIsValid(raw: string): boolean {
  return REGISTRATION_RE.test(raw.trim());
}

/** The single source of truth for what a booking costs. */
export function priceBooking(input: { couponCode?: string | null; registrationNo?: string | null }): {
  feePaise: number;
  feeWaived: boolean;
  waiverReason: 'coupon' | 'student' | null;
  couponCode: string | null;
} {
  if (input.couponCode && couponIsValid(input.couponCode)) {
    return {
      feePaise: 0,
      feeWaived: true,
      waiverReason: 'coupon',
      couponCode: normaliseCoupon(input.couponCode),
    };
  }
  if (input.registrationNo && registrationIsValid(input.registrationNo)) {
    return { feePaise: 0, feeWaived: true, waiverReason: 'student', couponCode: null };
  }
  return { feePaise: STANDARD_FEE_PAISE, feeWaived: false, waiverReason: null, couponCode: null };
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!methodGuard(req, res, ['GET', 'POST', 'PATCH', 'DELETE'])) return;

  await withErrors(res, async () => {
    if (req.method === 'POST') {
      const body = parseBody(req, res, BookingCreate);
      if (!body) return;

      const when = new Date(body.scheduledAt);
      if (Number.isNaN(when.getTime())) {
        fail(res, 'That appointment time could not be read.', 422);
        return;
      }
      if (when.getTime() < Date.now() - 60_000) {
        fail(res, 'That time is already in the past.', 422);
        return;
      }

      const user = await requireVerifiedUser(req, res);
      if (!user) return;

      // A code that was sent but is not valid is worth saying out loud —
      // silently charging someone who thought they had a discount is worse
      // than refusing the booking.
      if (body.couponCode && !couponIsValid(body.couponCode)) {
        fail(res, 'That coupon code is not valid.', 422);
        return;
      }

      const pricing = priceBooking(body);

      const booking = await prisma.booking.create({
        data: {
          userId: user.id,
          mentorId: body.mentorId,
          mentorName: body.mentorName,
          mode: body.mode ?? 'video',
          scheduledAt: when,
          durationMin: body.durationMin ?? 45,
          note: body.note ?? null,
          registrationNo: body.registrationNo ?? null,
          ...pricing,
        },
      });
      ok(res, booking, 201);
      return;
    }

    if (req.method === 'PATCH') {
      const body = parseBody(req, res, BookingUpdate);
      if (!body) return;
      const user = await requireVerifiedUser(req, res);
      if (!user) return;
      const existing = await prisma.booking.findFirst({ where: { id: body.id, userId: user.id } });
      if (!existing) {
        fail(res, 'Booking not found', 404);
        return;
      }
      const booking = await prisma.booking.update({
        where: { id: body.id },
        data: {
          status: body.status ?? existing.status,
          scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : existing.scheduledAt,
          note: body.note ?? existing.note,
        },
      });
      ok(res, booking);
      return;
    }

    if (req.method === 'DELETE') {
      const id = queryStr(req, 'id');
      if (!id) {
        fail(res, 'id query parameter required', 422);
        return;
      }
      const user = await requireVerifiedUser(req, res);
      if (!user) return;
      const existing = await prisma.booking.findFirst({ where: { id, userId: user.id } });
      if (!existing) {
        fail(res, 'Booking not found', 404);
        return;
      }
      // Cancel rather than delete: the appointment happened as a fact even if
      // it will not take place, and the mentor's side needs to know.
      const booking = await prisma.booking.update({ where: { id }, data: { status: 'cancelled' } });
      ok(res, booking);
      return;
    }

    const user = await requireVerifiedUser(req, res);
    if (!user) return;
    const bookings = await prisma.booking.findMany({
      where: { userId: user.id },
      orderBy: { scheduledAt: 'asc' },
    });
    ok(res, bookings);
  });
}
