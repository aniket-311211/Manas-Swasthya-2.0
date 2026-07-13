import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../_lib/prisma';
import { ok, fail, parseBody, methodGuard, withErrors } from '../_lib/http';
import { MentorAction } from '../_lib/schemas';

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
        const mentor = await prisma.mentor.findUnique({ where: { email: body.email } });
        if (!mentor || mentor.password !== body.password) {
          fail(res, 'Invalid credentials', 401);
          return;
        }
        await prisma.mentor.update({ where: { id: mentor.id }, data: { status: 'online' } });
        const { password: _pw, ...mentorData } = mentor;
        void _pw;
        ok(res, { mentor: { ...mentorData, status: 'online' } });
        return;
      }
      await prisma.mentor.update({ where: { id: body.mentorId }, data: { status: 'offline' } });
      ok(res, { loggedOut: true });
      return;
    }
    const mentors = await prisma.mentor.findMany({ select: MENTOR_SELECT });
    ok(res, mentors);
  });
}
