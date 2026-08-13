import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../_lib/prisma';
import { ok, fail, parseBody, methodGuard, withErrors } from '../_lib/http';
import { MentorAction } from '../_lib/schemas';
import { LOCKED_PASSWORD } from '../_lib/mentorAuth';

const MENTOR_SELECT = {
  id: true,
  name: true,
  avatar: true,
  bio: true,
  specialization: true,
  badge: true,
  status: true,
  totalSessions: true,
  rating: true,
} as const;

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!methodGuard(req, res, ['GET', 'POST'])) return;
  await withErrors(res, async () => {
    if (req.method === 'POST') {
      const body = parseBody(req, res, MentorAction);
      if (!body) return;
      if (body.action === 'login') {
        // Removed. This compared `mentor.password !== body.password` in
        // plaintext and issued no session. Login lives in api/mentors/auth.ts
        // and uses bcrypt plus a MentorSession token.
        fail(res, 'Use /api/mentors/auth to sign in.', 410);
        return;
      }
      // Was: `prisma.mentor.update` on a caller-supplied id with no session,
      // so an anonymous request could mark any mentor offline in the directory.
      // Real logout revokes the session token in api/mentors/auth.ts.
      fail(res, 'Use /api/mentors/auth to sign out.', 410);
      return;
    }
    // Retired accounts stayed in this list, which is why the directory showed
    // duplicate people — an old row and its replacement under the same name.
    const mentors = await prisma.mentor.findMany({
      where: { password: { not: LOCKED_PASSWORD } },
      orderBy: { name: 'asc' },
      select: MENTOR_SELECT,
    });
    ok(res, mentors);
  });
}
