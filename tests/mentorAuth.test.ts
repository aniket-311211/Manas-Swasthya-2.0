import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import 'dotenv/config';
import mentorAuth from '../api/mentors/auth';
import mentors from '../api/mentors/index';
import { prisma } from '../api/_lib/prisma';
import { hashPassword, mentorFromToken, verifyPassword } from '../api/_lib/mentorAuth';
import { mockReq, mockRes } from './helpers/mockRes';

/**
 * Security tests for the mentor login that replaced a plaintext comparison.
 */

const EMAIL = 'test.mentor@manasswasthya.app';
// The limiter allows 8 logins per email per minute. The session suite needs
// several more, so it gets its own account rather than the guard being loosened.
const EMAIL2 = 'test.session@manasswasthya.app';
const PASSWORD = 'correct-horse-battery-staple';
let mentorId = '';

interface Envelope<T = unknown> { ok: boolean; data?: T; error?: string }
type LoginData = { token: string; mentor: { id: string; email: string } };

const login = async (email: string, password: string) => {
  const r = mockRes();
  await mentorAuth(mockReq({ method: 'POST', body: { action: 'login', email, password } }), r.res);
  return r.captured;
};

beforeAll(async () => {
  const password = await hashPassword(PASSWORD);
  const m = await prisma.mentor.upsert({
    where: { email: EMAIL },
    update: { password },
    create: { email: EMAIL, password, name: 'Test Mentor', status: 'offline' },
  });
  mentorId = m.id;
  await prisma.mentor.upsert({
    where: { email: EMAIL2 },
    update: { password },
    create: { email: EMAIL2, password, name: 'Session Mentor', status: 'offline' },
  });
});

afterAll(async () => {
  const ids = (await prisma.mentor.findMany({ where: { email: { in: [EMAIL, EMAIL2] } } })).map((m) => m.id);
  await prisma.mentorSession.deleteMany({ where: { mentorId: { in: ids } } });
  await prisma.mentor.deleteMany({ where: { email: { in: [EMAIL, EMAIL2] } } });
  await prisma.$disconnect();
});

describe('password storage', () => {
  it('stores a bcrypt hash, never the password itself', async () => {
    const row = await prisma.mentor.findUnique({ where: { email: EMAIL } });
    expect(row!.password).not.toBe(PASSWORD);
    expect(row!.password.startsWith('$2')).toBe(true);
  });

  it('verifies the right password and rejects the wrong one', async () => {
    const hash = await hashPassword(PASSWORD);
    expect(await verifyPassword(PASSWORD, hash)).toBe(true);
    expect(await verifyPassword('nope', hash)).toBe(false);
  });

  it('refuses to authenticate against a plaintext column, so old rows cannot log in', async () => {
    // This is the exact shape the previous implementation accepted.
    expect(await verifyPassword(PASSWORD, PASSWORD)).toBe(false);
    expect(await verifyPassword('locked', 'locked:no-login')).toBe(false);
  });
});

describe('login', () => {
  it('issues a token and never returns the password', async () => {
    const res = await login(EMAIL, PASSWORD);
    expect(res.statusCode ?? 200).toBe(200);
    const data = (res.body as Envelope<LoginData>).data!;
    expect(data.token.length).toBeGreaterThanOrEqual(32);
    expect(JSON.stringify(data)).not.toContain(PASSWORD);
    expect(JSON.stringify(data)).not.toContain('password');
  });

  it('rejects a wrong password', async () => {
    expect((await login(EMAIL, 'wrong')).statusCode).toBe(401);
  });

  it('gives an identical answer for an unknown email, so accounts cannot be enumerated', async () => {
    const unknown = await login('nobody@manasswasthya.app', 'whatever');
    const wrongPw = await login(EMAIL, 'wrong');
    expect(unknown.statusCode).toBe(401);
    expect((unknown.body as Envelope).error).toBe((wrongPw.body as Envelope).error);
  });

  it('is case-insensitive on the email but not the password', async () => {
    expect((await login(EMAIL.toUpperCase(), PASSWORD)).statusCode ?? 200).toBe(200);
    expect((await login(EMAIL, PASSWORD.toUpperCase())).statusCode).toBe(401);
  });
});

describe('sessions', () => {
  // Each of these logs in again; the limiter allows 8 per email per minute, and
  // spacing them across the suite keeps well inside that without relaxing it.
  it('resolves a valid token to the mentor', async () => {
    const data = ((await login(EMAIL2, PASSWORD)).body as Envelope<LoginData>).data!;
    const who = await mentorFromToken(data.token);
    expect(who?.email).toBe(EMAIL2);
  });

  it('rejects a forged, empty or short token', async () => {
    for (const bad of ['', 'abc', 'x'.repeat(64), null, undefined]) {
      expect(await mentorFromToken(bad as string)).toBeNull();
    }
  });

  it('rejects an expired token and cleans it up', async () => {
    const data = ((await login(EMAIL2, PASSWORD)).body as Envelope<LoginData>).data!;
    await prisma.mentorSession.update({
      where: { token: data.token },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    expect(await mentorFromToken(data.token)).toBeNull();
    expect(await prisma.mentorSession.findUnique({ where: { token: data.token } })).toBeNull();
  });

  it('stops working immediately after logout — the point of server-side sessions', async () => {
    const data = ((await login(EMAIL2, PASSWORD)).body as Envelope<LoginData>).data!;
    expect(await mentorFromToken(data.token)).not.toBeNull();

    const out = mockRes();
    await mentorAuth(
      mockReq({ method: 'POST', body: { action: 'logout' }, headers: { authorization: `Bearer ${data.token}` } }),
      out.res,
    );
    expect(await mentorFromToken(data.token)).toBeNull();
  });

  it('restores a session from a token via GET, and refuses without one', async () => {
    const data = ((await login(EMAIL2, PASSWORD)).body as Envelope<LoginData>).data!;
    const me = mockRes();
    await mentorAuth(mockReq({ method: 'GET', headers: { authorization: `Bearer ${data.token}` } }), me.res);
    expect((me.captured.body as Envelope).ok).toBe(true);

    const anon = mockRes();
    await mentorAuth(mockReq({ method: 'GET' }), anon.res);
    expect(anon.captured.statusCode).toBe(401);
  });
});

describe('the old plaintext endpoint', () => {
  it('no longer accepts a login, so it cannot be used as a bypass', async () => {
    const r = mockRes();
    await mentors(
      mockReq({ method: 'POST', body: { action: 'login', email: EMAIL, password: PASSWORD } }),
      r.res,
    );
    expect(r.captured.statusCode).toBe(410);
  });

  it('never exposes password hashes in the public mentor list', async () => {
    const r = mockRes();
    await mentors(mockReq({ method: 'GET' }), r.res);
    expect(JSON.stringify(r.captured.body)).not.toContain('$2');
    expect(JSON.stringify(r.captured.body)).not.toContain('password');
  });
});
