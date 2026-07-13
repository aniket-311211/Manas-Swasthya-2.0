import { describe, it, expect, afterAll } from 'vitest';
import 'dotenv/config';
import health from '../api/health';
import users from '../api/users';
import mood from '../api/mood/index';
import { prisma } from '../api/_lib/prisma';
import { mockReq, mockRes } from './helpers/mockRes';

const TEST_CLERK_ID = 'TEST_vitest_user';

interface Envelope {
  ok: boolean;
  data?: Record<string, unknown> & { db?: boolean; id?: string };
  error?: string;
}

afterAll(async () => {
  const user = await prisma.user.findUnique({ where: { clerkId: TEST_CLERK_ID } });
  if (user) {
    await prisma.moodEntry.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  }
  await prisma.$disconnect();
});

describe('api handlers (live db)', () => {
  it('health reports ok with db connectivity', async () => {
    const { res, captured } = mockRes();
    await health(mockReq({ method: 'GET' }), res);
    const body = captured.body as Envelope;
    expect(body.ok).toBe(true);
    expect(body.data?.db).toBe(true);
  });

  it('users POST rejects invalid body with 422', async () => {
    const { res, captured } = mockRes();
    await users(mockReq({ method: 'POST', body: { email: 'not-an-email' } }), res);
    expect(captured.statusCode).toBe(422);
  });

  it('users POST upserts, mood POST saves, mood GET returns entry', async () => {
    const u = mockRes();
    await users(
      mockReq({
        method: 'POST',
        body: { clerkId: TEST_CLERK_ID, email: 'vitest@test.manasswasthya.app', firstName: 'Vi' },
      }),
      u.res,
    );
    expect((u.captured.body as Envelope).ok).toBe(true);

    const m = mockRes();
    await mood(
      mockReq({ method: 'POST', body: { clerkId: TEST_CLERK_ID, mood: '🙂', notes: 'test entry', stress: 3 } }),
      m.res,
    );
    expect(m.captured.statusCode).toBe(201);

    const g = mockRes();
    await mood(mockReq({ method: 'GET', query: { clerkId: TEST_CLERK_ID } }), g.res);
    const list = (g.captured.body as { ok: boolean; data: { notes: string | null }[] }).data;
    expect(list.some((e) => e.notes === 'test entry')).toBe(true);
  });

  it('mood GET without clerkId fails 422', async () => {
    const { res, captured } = mockRes();
    await mood(mockReq({ method: 'GET' }), res);
    expect(captured.statusCode).toBe(422);
  });
});
