import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import 'dotenv/config';
import users from '../api/users';
import events from '../api/events/index';
import { prisma } from '../api/_lib/prisma';
import type { CommunityEvent } from '@/types/api';
import { mockReq, mockRes } from './helpers/mockRes';

/**
 * Taking a place in an activity.
 *
 * The two things worth pinning down are that a place cannot be claimed for an
 * account that does not exist, and that a room with one seat left hands it to
 * exactly one person.
 */

const STUDENT = 'TEST_event_student';
const RIVAL = 'TEST_event_rival';
const TITLE = 'TEST_event_one_seat';

let eventId = '';

interface Envelope<T = unknown> { ok: boolean; data?: T; error?: string }

const call = (method: string, opts: { body?: unknown; query?: Record<string, string> } = {}) => {
  const r = mockRes();
  return events(mockReq({ method, body: opts.body, query: opts.query }), r.res).then(() => r.captured);
};

const register = (clerkId: string) =>
  call('POST', { body: { action: 'register', eventId, clerkId } });
const unregister = (clerkId: string) =>
  call('POST', { body: { action: 'unregister', eventId, clerkId } });

const listFor = async (clerkId: string) =>
  ((await call('GET', { query: { clerkId } })).body as Envelope<CommunityEvent[]>).data!;

const mine = async (clerkId: string) => (await listFor(clerkId)).find((e) => e.id === eventId)!;

beforeAll(async () => {
  for (const clerkId of [STUDENT, RIVAL]) {
    const u = mockRes();
    await users(
      mockReq({ method: 'POST', body: { clerkId, email: `${clerkId}@test.app`, firstName: 'T' } }),
      u.res,
    );
  }
  // One seat, so the capacity path is reachable without seeding a crowd.
  const event = await prisma.event.create({
    data: {
      title: TITLE,
      description: 'Fixture.',
      category: 'Test',
      host: 'Test',
      date: new Date(Date.now() + 86_400_000),
      duration: '1 hour',
      location: 'Online',
      maxParticipants: 1,
    },
  });
  eventId = event.id;
});

afterAll(async () => {
  await prisma.eventRegistration.deleteMany({ where: { eventId } });
  await prisma.event.deleteMany({ where: { id: eventId } });
  await prisma.user.deleteMany({ where: { clerkId: { in: [STUDENT, RIVAL] } } });
  await prisma.$disconnect();
});

describe('joining an activity', () => {
  it('takes a place and says so on the way back out', async () => {
    expect((await register(STUDENT)).statusCode).toBe(201);
    const e = await mine(STUDENT);
    expect(e.isRegistered).toBe(true);
    expect(e.participantCount).toBe(1);
  });

  it('does not double-book someone who presses join twice', async () => {
    expect((await register(STUDENT)).statusCode).toBe(201);
    expect((await mine(STUDENT)).participantCount).toBe(1);
  });

  it('keeps one student\'s place private from another\'s view', async () => {
    expect((await mine(RIVAL)).isRegistered).toBe(false);
    // The headcount is public even when the membership is not.
    expect((await mine(RIVAL)).participantCount).toBe(1);
  });
});

describe('the last seat goes to one person', () => {
  it('turns away the next person once the room is full', async () => {
    const res = await register(RIVAL);
    expect(res.statusCode).toBe(409);
    // And the refusal must not leave a phantom registration behind.
    expect((await mine(RIVAL)).participantCount).toBe(1);
    expect((await mine(RIVAL)).isRegistered).toBe(false);
  });

  it('frees the seat when the first student cancels', async () => {
    expect((await unregister(STUDENT)).statusCode).toBe(200);
    expect((await mine(STUDENT)).isRegistered).toBe(false);
    expect((await register(RIVAL)).statusCode).toBe(201);
    expect((await mine(RIVAL)).isRegistered).toBe(true);
  });
});

describe('a place cannot be claimed for an account that does not exist', () => {
  it('refuses an unknown clerk id rather than inventing a participant', async () => {
    const res = await call('POST', {
      body: { action: 'register', eventId, clerkId: 'TEST_event_nobody' },
    });
    expect(res.statusCode).toBe(401);
    const count = await prisma.eventRegistration.count({ where: { eventId } });
    expect(count).toBe(1);
  });

  it('refuses an unknown event', async () => {
    const res = await call('POST', {
      body: { action: 'register', eventId: 'no-such-event', clerkId: STUDENT },
    });
    expect(res.statusCode).toBe(404);
  });
});
