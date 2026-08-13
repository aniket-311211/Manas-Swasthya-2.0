import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import 'dotenv/config';
import users from '../api/users';
import join from '../api/community/join';
import messages from '../api/community/messages';
import { prisma } from '../api/_lib/prisma';
import { hashPassword, createSession } from '../api/_lib/mentorAuth';
import { mockReq, mockRes } from './helpers/mockRes';

const STUDENT = 'TEST_community_student';
const OUTSIDER = 'TEST_community_outsider';
const MENTOR_EMAIL = 'community.mentor@manasswasthya.app';

let roomId = '';
let mentorId = '';
let mentorToken = '';

interface Envelope<T = unknown> { ok: boolean; data?: T; error?: string }
type Msg = { id: string; content: string; isMentor: boolean; authorName: string };

const post = async (body: Record<string, unknown>, token?: string) => {
  const r = mockRes();
  await messages(
    mockReq({ method: 'POST', body, headers: token ? { authorization: `Bearer ${token}` } : {} }),
    r.res,
  );
  return r.captured;
};

/** Reading a circle is for its members, so a reader has to be named. */
const list = async (clerkId: string = STUDENT) => {
  const r = mockRes();
  await messages(mockReq({ method: 'GET', query: { roomId, clerkId } }), r.res);
  return ((r.captured.body as Envelope<Msg[]>).data ?? []);
};

beforeAll(async () => {
  for (const clerkId of [STUDENT, OUTSIDER]) {
    const u = mockRes();
    await users(mockReq({ method: 'POST', body: { clerkId, email: `${clerkId}@test.app`, firstName: 'T' } }), u.res);
  }
  const room = await prisma.chatRoom.create({
    data: { type: 'group', name: 'Test circle', topic: 'testing', tags: [] },
  });
  roomId = room.id;

  const m = await prisma.mentor.upsert({
    where: { email: MENTOR_EMAIL },
    update: {},
    create: { email: MENTOR_EMAIL, password: await hashPassword('x'), name: 'Community Mentor', badge: 'Counsellor' },
  });
  mentorId = m.id;
  mentorToken = (await createSession(m.id)).token;
});

afterAll(async () => {
  await prisma.chatMessage.deleteMany({ where: { roomId } });
  await prisma.chatRoom.delete({ where: { id: roomId } }).catch(() => undefined);
  await prisma.mentorSession.deleteMany({ where: { mentorId } });
  await prisma.mentor.deleteMany({ where: { email: MENTOR_EMAIL } });
  await prisma.user.deleteMany({ where: { clerkId: { in: [STUDENT, OUTSIDER] } } });
  await prisma.$disconnect();
});

describe('membership is a real gate', () => {
  it('refuses a post from someone who has not joined', async () => {
    expect((await post({ roomId, clerkId: OUTSIDER, content: 'let me in' })).statusCode).toBe(403);
  });

  it('accepts a post once they join, and lets them leave again', async () => {
    const j = mockRes();
    await join(mockReq({ method: 'POST', body: { clerkId: STUDENT, groupId: roomId, action: 'join' } }), j.res);
    expect((await post({ roomId, clerkId: STUDENT, content: 'hello everyone' })).statusCode).toBe(201);

    const l = mockRes();
    await join(mockReq({ method: 'POST', body: { clerkId: STUDENT, groupId: roomId, action: 'leave' } }), l.res);
    expect((l.captured.body as Envelope<{ joined: boolean }>).data?.joined).toBe(false);
    expect((await post({ roomId, clerkId: STUDENT, content: 'back again' })).statusCode).toBe(403);
  });

  it('refuses an anonymous post', async () => {
    expect((await post({ roomId, content: 'who am I' })).statusCode).toBe(401);
  });

  it('refuses a post to a group that does not exist', async () => {
    expect((await post({ roomId: 'nope', clerkId: STUDENT, content: 'hi' })).statusCode).toBe(404);
  });
});

describe('authorship cannot be forged', () => {
  it('lets a mentor post with a valid token, without joining', async () => {
    expect((await post({ roomId, content: 'I am here to help' }, mentorToken)).statusCode).toBe(201);
    const j = mockRes();
    await join(mockReq({ method: 'POST', body: { clerkId: STUDENT, groupId: roomId, action: 'join' } }), j.res);
    const all = await list();
    const mine = all.find((m) => m.content === 'I am here to help')!;
    expect(mine.isMentor).toBe(true);
    expect(mine.authorName).toBe('Community Mentor');
  });

  it('ignores a forged mentor token and falls back to the student path', async () => {
    // A bogus token must not grant mentor authorship; with no membership this
    // is simply refused rather than silently posted as a student.
    expect((await post({ roomId, content: 'pretending' }, 'x'.repeat(64))).statusCode).toBe(401);
  });

  it('never lets a student message be marked as a mentor one', async () => {
    const j = mockRes();
    await join(mockReq({ method: 'POST', body: { clerkId: STUDENT, groupId: roomId, action: 'join' } }), j.res);
    // isMentor is not in the schema; even if sent, it cannot reach the row.
    await post({ roomId, clerkId: STUDENT, content: 'just a student', isMentor: true, mentorId });
    const all = await list();
    expect(all.find((m) => m.content === 'just a student')!.isMentor).toBe(false);
  });
});

describe('reading a group', () => {
  it('returns messages oldest first with author names and no internal ids', async () => {
    const all = await list();
    expect(all.length).toBeGreaterThan(0);
    for (const m of all) {
      expect(typeof m.authorName).toBe('string');
      expect(m.authorName.length).toBeGreaterThan(0);
      expect(JSON.stringify(m)).not.toContain('userId');
    }
  });

  it('404s for an unknown group rather than leaking an empty list', async () => {
    const r = mockRes();
    await messages(mockReq({ method: 'GET', query: { roomId: 'nope', clerkId: STUDENT } }), r.res);
    expect(r.captured.statusCode).toBe(404);
  });

  it('will not read a circle out to someone who has not joined it', async () => {
    // What people write in a peer support circle is for the circle. This used
    // to be open to anyone holding a room id.
    const r = mockRes();
    await messages(mockReq({ method: 'GET', query: { roomId, clerkId: OUTSIDER } }), r.res);
    expect(r.captured.statusCode).toBe(403);
  });

  it('will not read a circle out to an anonymous caller at all', async () => {
    const r = mockRes();
    await messages(mockReq({ method: 'GET', query: { roomId }, auth: false }), r.res);
    expect(r.captured.statusCode).toBe(403);
  });
});

describe('crisis screening', () => {
  it('flags a distressing message so the client can offer helplines', async () => {
    const res = await post({ roomId, clerkId: STUDENT, content: 'I want to end my life' });
    expect((res.body as Envelope<{ crisis: boolean }>).data?.crisis).toBe(true);
  });

  it('does not flag an ordinary message', async () => {
    const res = await post({ roomId, clerkId: STUDENT, content: 'exams went fine today' });
    expect((res.body as Envelope<{ crisis: boolean }>).data?.crisis).toBe(false);
  });
});

describe('validation', () => {
  it('rejects empty and oversized content', async () => {
    expect((await post({ roomId, clerkId: STUDENT, content: '' })).statusCode).toBe(422);
    expect((await post({ roomId, clerkId: STUDENT, content: 'x'.repeat(2001) })).statusCode).toBe(422);
  });
});
