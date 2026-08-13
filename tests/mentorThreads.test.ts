import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import 'dotenv/config';
import users from '../api/users';
import threads from '../api/mentors/threads';
import { prisma } from '../api/_lib/prisma';
import { createSession, hashPassword } from '../api/_lib/mentorAuth';
import { mockReq, mockRes } from './helpers/mockRes';

/**
 * A 1:1 mentor thread is a private conversation about someone's mental health.
 * These tests are mostly about who can NOT see it.
 */

const STUDENT = 'TEST_thread_student';
const OTHER_STUDENT = 'TEST_thread_other';
const MENTOR_A = 'thread.a@manasswasthya.app';
const MENTOR_B = 'thread.b@manasswasthya.app';

let mentorAId = '';
let mentorBId = '';
let tokenA = '';
let tokenB = '';
let roomId = '';

interface Envelope<T = unknown> { ok: boolean; data?: T; error?: string }

const call = (method: string, opts: { body?: unknown; query?: Record<string, string>; token?: string } = {}) => {
  const r = mockRes();
  return threads(
    mockReq({
      method,
      body: opts.body,
      query: opts.query,
      headers: opts.token ? { authorization: `Bearer ${opts.token}` } : {},
    }),
    r.res,
  ).then(() => r.captured);
};

beforeAll(async () => {
  for (const clerkId of [STUDENT, OTHER_STUDENT]) {
    const u = mockRes();
    await users(mockReq({ method: 'POST', body: { clerkId, email: `${clerkId}@test.app`, firstName: 'T' } }), u.res);
  }
  const pw = await hashPassword('x');
  const a = await prisma.mentor.upsert({
    where: { email: MENTOR_A }, update: {}, create: { email: MENTOR_A, password: pw, name: 'Mentor A' },
  });
  const b = await prisma.mentor.upsert({
    where: { email: MENTOR_B }, update: {}, create: { email: MENTOR_B, password: pw, name: 'Mentor B' },
  });
  mentorAId = a.id;
  mentorBId = b.id;
  tokenA = (await createSession(a.id)).token;
  tokenB = (await createSession(b.id)).token;
});

afterAll(async () => {
  const rooms = await prisma.chatRoom.findMany({ where: { type: 'mentor', mentorId: { in: [mentorAId, mentorBId] } } });
  await prisma.chatMessage.deleteMany({ where: { roomId: { in: rooms.map((r) => r.id) } } });
  await prisma.chatRoom.deleteMany({ where: { id: { in: rooms.map((r) => r.id) } } });
  await prisma.mentorSession.deleteMany({ where: { mentorId: { in: [mentorAId, mentorBId] } } });
  await prisma.mentor.deleteMany({ where: { email: { in: [MENTOR_A, MENTOR_B] } } });
  await prisma.user.deleteMany({ where: { clerkId: { in: [STUDENT, OTHER_STUDENT] } } });
  await prisma.$disconnect();
});

describe('starting a thread', () => {
  it('a student opens a conversation with a mentor', async () => {
    const res = await call('POST', { body: { clerkId: STUDENT, mentorId: mentorAId } });
    expect(res.statusCode).toBe(201);
    roomId = (res.body as Envelope<{ id: string }>).data!.id;
    expect(roomId).toBeTruthy();
  });

  it('reuses the open thread instead of fragmenting the history', async () => {
    const again = await call('POST', { body: { clerkId: STUDENT, mentorId: mentorAId } });
    const data = (again.body as Envelope<{ id: string; existing: boolean }>).data!;
    expect(data.existing).toBe(true);
    expect(data.id).toBe(roomId);
  });

  it('refuses an unknown mentor and an unknown student', async () => {
    expect((await call('POST', { body: { clerkId: STUDENT, mentorId: 'nope' } })).statusCode).toBe(404);
    expect((await call('POST', { body: { clerkId: 'nobody', mentorId: mentorAId } })).statusCode).toBe(401);
  });
});

describe('both sides can talk', () => {
  it('the student sends, and the assigned mentor replies', async () => {
    expect((await call('POST', { body: { roomId, clerkId: STUDENT, content: 'I have been struggling' } })).statusCode).toBe(201);
    expect((await call('POST', { body: { roomId, content: 'Thank you for telling me' }, token: tokenA })).statusCode).toBe(201);

    const msgs = ((await call('GET', { query: { roomId, clerkId: STUDENT } })).body as Envelope<{ isMentor: boolean }[]>).data!;
    expect(msgs).toHaveLength(2);
    expect(msgs[0].isMentor).toBe(false);
    expect(msgs[1].isMentor).toBe(true);
  });

  it('both sides read the same thread', async () => {
    const asStudent = ((await call('GET', { query: { roomId, clerkId: STUDENT } })).body as Envelope<unknown[]>).data!;
    const asMentor = ((await call('GET', { query: { roomId }, token: tokenA })).body as Envelope<unknown[]>).data!;
    expect(asMentor).toHaveLength(asStudent.length);
  });
});

describe('nobody else gets in — the part that matters', () => {
  it('hides the thread from an unrelated student', async () => {
    expect((await call('GET', { query: { roomId, clerkId: OTHER_STUDENT } })).statusCode).toBe(404);
  });

  it('hides the thread from a mentor who is not assigned to it', async () => {
    expect((await call('GET', { query: { roomId }, token: tokenB })).statusCode).toBe(404);
  });

  it('stops an unassigned mentor from replying into it', async () => {
    expect((await call('POST', { body: { roomId, content: 'butting in' }, token: tokenB })).statusCode).toBe(404);
  });

  it('stops an unrelated student from replying into it', async () => {
    expect(
      (await call('POST', { body: { roomId, clerkId: OTHER_STUDENT, content: 'butting in' } })).statusCode,
    ).toBe(404);
  });

  it('refuses anonymous reads and writes', async () => {
    expect((await call('GET', { query: { roomId } })).statusCode).toBe(401);
    expect((await call('POST', { body: { roomId, content: 'hi' } })).statusCode).toBe(401);
  });

  it('says "not found" rather than "forbidden", so the thread is not even confirmed to exist', async () => {
    const res = await call('GET', { query: { roomId }, token: tokenB });
    expect(res.statusCode).toBe(404);
    expect((res.body as Envelope).error).not.toMatch(/forbidden|permission|allowed/i);
  });
});

describe('thread lists are scoped to the caller', () => {
  it('a student sees only their own threads', async () => {
    const mine = ((await call('GET', { query: { clerkId: STUDENT } })).body as Envelope<{ id: string }[]>).data!;
    expect(mine.some((t) => t.id === roomId)).toBe(true);
    const theirs = ((await call('GET', { query: { clerkId: OTHER_STUDENT } })).body as Envelope<{ id: string }[]>).data!;
    expect(theirs.some((t) => t.id === roomId)).toBe(false);
  });

  it('a mentor sees only threads assigned to them', async () => {
    const a = ((await call('GET', { token: tokenA })).body as Envelope<{ id: string }[]>).data!;
    expect(a.some((t) => t.id === roomId)).toBe(true);
    const b = ((await call('GET', { token: tokenB })).body as Envelope<{ id: string }[]>).data!;
    expect(b.some((t) => t.id === roomId)).toBe(false);
  });

  it('carries the other side\'s name so a list is readable', async () => {
    const mine = ((await call('GET', { query: { clerkId: STUDENT } })).body as Envelope<
      { id: string; mentor: { name: string } | null }[]
    >).data!;
    expect(mine.find((t) => t.id === roomId)?.mentor?.name).toBe('Mentor A');
  });
});

describe('crisis screening reaches 1:1 threads too', () => {
  it('flags a distressing message from a student', async () => {
    const res = await call('POST', { body: { roomId, clerkId: STUDENT, content: 'I want to end my life' } });
    expect((res.body as Envelope<{ crisis: boolean }>).data?.crisis).toBe(true);
  });
});

describe('validation', () => {
  it('rejects empty and oversized messages', async () => {
    expect((await call('POST', { body: { roomId, clerkId: STUDENT, content: '' } })).statusCode).toBe(422);
    expect((await call('POST', { body: { roomId, clerkId: STUDENT, content: 'x'.repeat(4001) } })).statusCode).toBe(422);
  });
});
