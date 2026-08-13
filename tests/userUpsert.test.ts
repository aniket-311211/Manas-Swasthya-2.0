import { describe, it, expect, afterAll } from 'vitest';
import 'dotenv/config';
import users from '../api/users';
import journal from '../api/journal/index';
import { prisma } from '../api/_lib/prisma';
import { mockReq, mockRes } from './helpers/mockRes';
import { grantVerifiedEmail } from './setup/clerk';

const EMAIL = 'vitest.reissue@test.manasswasthya.app';
const OLD_CLERK = 'TEST_clerk_old';
const NEW_CLERK = 'TEST_clerk_new';

interface Envelope<T = Record<string, unknown>> { ok: boolean; data?: T; error?: string }

afterAll(async () => {
  const rows = await prisma.user.findMany({ where: { email: EMAIL } });
  for (const u of rows) {
    await prisma.journalEntry.deleteMany({ where: { userId: u.id } });
    await prisma.user.delete({ where: { id: u.id } });
  }
  await prisma.$disconnect();
});

const upsert = async (clerkId: string) => {
  const r = mockRes();
  await users(mockReq({ method: 'POST', body: { clerkId, email: EMAIL, firstName: 'Re' } }), r.res);
  return r.captured;
};

describe('user upsert when Clerk reissues an id for the same email', () => {
  it('refuses to adopt a row whose email the caller cannot prove is theirs', async () => {
    // The account-takeover shape: a valid token for MY account, somebody
    // else's email in the body. Before the Clerk check, this rebound their row
    // to my id and locked them out of everything.
    await upsert(OLD_CLERK);
    const attack = await upsert('TEST_clerk_attacker');
    expect(attack.statusCode).toBe(409);
    const row = await prisma.user.findUniqueOrThrow({ where: { email: EMAIL } });
    expect(row.clerkId).toBe(OLD_CLERK);
  });

  it('adopts the existing row instead of failing on the email unique constraint', async () => {
    // Clerk confirms this account really owns the address.
    grantVerifiedEmail(NEW_CLERK, EMAIL);
    const first = await upsert(OLD_CLERK);
    expect((first.body as Envelope).ok).toBe(true);
    const originalId = (first.body as Envelope<{ id: string }>).data!.id;

    // Same person, new Clerk id. Previously: P2002 on `email`.
    const second = await upsert(NEW_CLERK);
    expect((second.body as Envelope).ok).toBe(true);

    const adopted = (second.body as Envelope<{ id: string; clerkId: string }>).data!;
    expect(adopted.clerkId).toBe(NEW_CLERK);
    // Same row, so existing moods/journals stay attached to the account.
    expect(adopted.id).toBe(originalId);
    expect(await prisma.user.count({ where: { email: EMAIL } })).toBe(1);
  });

  it('lets the reissued user write again — the failure this actually caused', async () => {
    const r = mockRes();
    await journal(
      mockReq({ method: 'POST', body: { clerkId: NEW_CLERK, title: 'Intention', content: 'run', tags: ['intention'] } }),
      r.res,
    );
    expect(r.captured.statusCode).toBe(201);
  });
});
