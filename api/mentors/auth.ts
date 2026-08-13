import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../_lib/prisma';
import { ok, fail, parseBody, methodGuard, withErrors } from '../_lib/http';
import { MentorAuth } from '../_lib/schemas';
import { allow } from '../_lib/ratelimit';
import { createSession, destroySession, mentorFromToken, verifyPassword } from '../_lib/mentorAuth';

/** Bearer token from the Authorization header. */
export function bearer(req: VercelRequest): string | null {
  const raw = req.headers.authorization;
  if (typeof raw !== 'string' || !raw.startsWith('Bearer ')) return null;
  return raw.slice(7).trim() || null;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!methodGuard(req, res, ['GET', 'POST'])) return;

  await withErrors(res, async () => {
    // GET = "who am I", used to restore a session on reload.
    if (req.method === 'GET') {
      const mentor = await mentorFromToken(bearer(req));
      if (!mentor) {
        fail(res, 'Not signed in', 401);
        return;
      }
      ok(res, { mentor });
      return;
    }

    const body = parseBody(req, res, MentorAuth);
    if (!body) return;

    if (body.action === 'logout') {
      const token = bearer(req);
      if (token) await destroySession(token);
      ok(res, { loggedOut: true });
      return;
    }

    // Throttle by email so one account cannot be brute-forced quickly. Keyed on
    // the submitted email rather than IP because a shared campus NAT would let
    // one attacker lock out a whole building otherwise.
    if (!allow(`mentor-login:${body.email.toLowerCase()}`, 8, 60_000)) {
      fail(res, 'Too many attempts. Wait a minute and try again.', 429);
      return;
    }

    const mentor = await prisma.mentor.findUnique({ where: { email: body.email.toLowerCase().trim() } });

    // Deliberately identical message and shape whether the email is unknown or
    // the password is wrong — otherwise this endpoint tells an attacker which
    // addresses are registered mentors.
    const okPassword = mentor ? await verifyPassword(body.password, mentor.password) : false;
    if (!mentor || !okPassword) {
      fail(res, 'Those details do not match an account.', 401);
      return;
    }

    const { token, expiresAt } = await createSession(mentor.id);
    await prisma.mentor.update({ where: { id: mentor.id }, data: { status: 'online' } });

    ok(res, {
      token,
      expiresAt: expiresAt.toISOString(),
      mentor: {
        id: mentor.id,
        name: mentor.name,
        email: mentor.email,
        specialization: mentor.specialization,
        badge: mentor.badge,
      },
    });
  });
}
