import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import 'dotenv/config';
import users from '../api/users';
import aiMedicine from '../api/ai/medicine';
import history from '../api/medicine/index';
import { prisma } from '../api/_lib/prisma';
import { MEDICINE_DAILY_LIMIT, istDay, peek, refund, reserve } from '../api/_lib/quota';
import { mockReq, mockRes } from './helpers/mockRes';

/**
 * The medicine endpoints, from the outside.
 *
 * The success path needs a real Clerk session token, which cannot be minted in
 * a unit test — so what is covered here is everything an attacker would try:
 * calling with no token, a forged token, and somebody else's identity in the
 * body. Plus the quota arithmetic against the real database.
 */

const CLERK_ID = 'TEST_medicine_user';
let userId = '';

interface Envelope<T = unknown> { ok: boolean; data?: T; error?: string }

const call = (
  handler: typeof aiMedicine,
  method: string,
  opts: { body?: unknown; headers?: Record<string, string>; auth?: false } = {},
) => {
  const r = mockRes();
  return handler(
    mockReq({ method, body: opts.body, headers: opts.headers ?? {}, auth: opts.auth }),
    r.res,
  ).then(() => r.captured);
};

beforeAll(async () => {
  const u = mockRes();
  await users(
    mockReq({
      method: 'POST',
      body: { clerkId: CLERK_ID, email: 'medicine@test.manasswasthya.app', firstName: 'Med' },
    }),
    u.res,
  );
  userId = (await prisma.user.findUniqueOrThrow({ where: { clerkId: CLERK_ID } })).id;
});

afterAll(async () => {
  await prisma.aiUsage.deleteMany({ where: { userId } });
  await prisma.medicineAnalysis.deleteMany({ where: { userId } });
  await prisma.chatRoom.deleteMany({ where: { studentId: userId } });
  await prisma.user.deleteMany({ where: { clerkId: CLERK_ID } });
  await prisma.$disconnect();
});

describe('nobody analyses anything without proving who they are', () => {
  it('refuses a request with no token', async () => {
    expect((await call(aiMedicine, 'POST', { body: { medicineName: 'Dolo 650' } })).statusCode).toBe(401);
  });

  it('refuses a forged token', async () => {
    const res = await call(aiMedicine, 'POST', {
      body: { medicineName: 'Dolo 650' },
      headers: { authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyXzEifQ.nope' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('ignores a clerkId in the body — it is a claim, not a proof', async () => {
    // This is exactly what the old endpoint accepted, and why anyone could
    // spend our Gemini quota by inventing an id.
    const res = await call(aiMedicine, 'POST', {
      body: { clerkId: CLERK_ID, medicineName: 'Dolo 650' },
      auth: false,
    });
    expect(res.statusCode).toBe(401);
    // And it must not have cost the real user anything.
    const used = await prisma.aiUsage.findFirst({ where: { userId, feature: 'medicine' } });
    expect(used?.count ?? 0).toBe(0);
  });

  it('refuses to read a history without a token', async () => {
    expect((await call(history, 'GET')).statusCode).toBe(401);
  });

  it('offers no way to ask for somebody else\'s history', async () => {
    // The parameter the old handler trusted is simply not read any more.
    const r = mockRes();
    await history(mockReq({ method: 'GET', query: { clerkId: CLERK_ID }, auth: false }), r.res);
    expect(r.captured.statusCode).toBe(401);
  });

  it('rejects the methods it does not serve', async () => {
    expect((await call(history, 'POST', { body: {} })).statusCode).toBe(405);
    expect((await call(aiMedicine, 'DELETE')).statusCode).toBe(405);
  });
});

describe('the daily allowance', () => {
  const FEATURE = 'medicine-test';

  afterAll(async () => {
    await prisma.aiUsage.deleteMany({ where: { userId, feature: FEATURE } });
  });

  it('counts down and then stops', async () => {
    const seen: number[] = [];
    for (let i = 0; i < MEDICINE_DAILY_LIMIT; i += 1) {
      const a = await reserve(userId, FEATURE, MEDICINE_DAILY_LIMIT);
      expect(a.allowed).toBe(true);
      seen.push(a.remaining);
    }
    expect(seen).toEqual([4, 3, 2, 1, 0]);

    const over = await reserve(userId, FEATURE, MEDICINE_DAILY_LIMIT);
    expect(over.allowed).toBe(false);
    expect(over.remaining).toBe(0);
  });

  it('survives a restart, because it lives in the database', async () => {
    // The old cap was a Map in the API process: a cold start handed everyone a
    // fresh five. Nothing in this module holds state, so reading it back is the
    // whole test.
    const row = await prisma.aiUsage.findUnique({
      where: { userId_feature_day: { userId, feature: FEATURE, day: istDay() } },
    });
    expect(row?.count).toBe(MEDICINE_DAILY_LIMIT);
  });

  it('hands a use back when the model call fails', async () => {
    await refund(userId, FEATURE);
    const after = await peek(userId, FEATURE, MEDICINE_DAILY_LIMIT);
    expect(after.remaining).toBe(1);
    expect(after.allowed).toBe(true);
  });

  it('never refunds below zero, however many times it is called', async () => {
    for (let i = 0; i < 12; i += 1) await refund(userId, FEATURE);
    const row = await prisma.aiUsage.findUnique({
      where: { userId_feature_day: { userId, feature: FEATURE, day: istDay() } },
    });
    expect(row?.count).toBe(0);
  });

  it('does not oversell when requests arrive together', async () => {
    await prisma.aiUsage.deleteMany({ where: { userId, feature: FEATURE } });
    const results = await Promise.all(
      Array.from({ length: 10 }, () => reserve(userId, FEATURE, MEDICINE_DAILY_LIMIT)),
    );
    expect(results.filter((r) => r.allowed)).toHaveLength(MEDICINE_DAILY_LIMIT);

    const row = await prisma.aiUsage.findUnique({
      where: { userId_feature_day: { userId, feature: FEATURE, day: istDay() } },
    });
    expect(row?.count).toBeLessThanOrEqual(MEDICINE_DAILY_LIMIT);
  });

  it('keeps one feature\'s allowance out of another\'s', async () => {
    const other = await peek(userId, 'some-other-feature', MEDICINE_DAILY_LIMIT);
    expect(other.remaining).toBe(MEDICINE_DAILY_LIMIT);
  });
});
