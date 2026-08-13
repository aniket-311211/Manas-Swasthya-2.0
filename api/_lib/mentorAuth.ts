import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { prisma } from './prisma';

/**
 * Mentor authentication.
 *
 * WHAT WAS WRONG BEFORE: `api/mentors/index.ts` compared `mentor.password !==
 * body.password` — a plaintext string comparison, despite the schema comment
 * calling the column "Hashed password". Anyone with read access to the database
 * had every mentor's password, and the comparison was also timing-variable.
 *
 * There was no session either. Login returned the mentor object and the client
 * kept it, so every "mentor-only" action was really "anyone who can type a
 * mentor id into a fetch call".
 *
 * Now: bcrypt hashes, and a random opaque token checked against MentorSession
 * on every privileged request.
 */

const ROUNDS = 10;
const SESSION_DAYS = 7;

/**
 * Written into `Mentor.password` to retire an account. It is not a bcrypt hash,
 * so `verifyPassword` can never match it — the row survives for its history but
 * the account can never be signed into, and the directory filters it out.
 */
export const LOCKED_PASSWORD = 'locked:no-login';

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

/**
 * bcrypt.compare is constant-time for a given hash, so a wrong password costs
 * the same as a right one. A row that somehow still holds a plaintext password
 * is rejected outright rather than falling back to `===`.
 */
export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  if (!stored.startsWith('$2')) return false;
  return bcrypt.compare(plain, stored);
}

export function newToken(): string {
  return randomBytes(32).toString('hex');
}

export async function createSession(mentorId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = newToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000);
  await prisma.mentorSession.create({ data: { token, mentorId, expiresAt } });
  return { token, expiresAt };
}

export interface MentorIdentity {
  id: string;
  name: string;
  email: string;
  specialization: string | null;
  badge: string | null;
}

/** The mentor behind a token, or null. Expired tokens are deleted on sight. */
export async function mentorFromToken(token: string | undefined | null): Promise<MentorIdentity | null> {
  if (!token || typeof token !== 'string' || token.length < 32) return null;
  const session = await prisma.mentorSession.findUnique({ where: { token }, include: { mentor: true } });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.mentorSession.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  const m = session.mentor;
  return { id: m.id, name: m.name, email: m.email, specialization: m.specialization, badge: m.badge };
}

export async function destroySession(token: string): Promise<void> {
  await prisma.mentorSession.deleteMany({ where: { token } });
}

/** Housekeeping so expired rows do not accumulate forever. */
export async function pruneExpiredSessions(): Promise<number> {
  const { count } = await prisma.mentorSession.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  return count;
}
