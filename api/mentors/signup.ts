import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../_lib/prisma';
import { ok, fail, parseBody, methodGuard, withErrors } from '../_lib/http';
import { MentorSignup } from '../_lib/schemas';
import { allow } from '../_lib/ratelimit';
import { createSession, hashPassword } from '../_lib/mentorAuth';

/**
 * Mentor self-signup, gated by an invite code.
 *
 * WHY GATED: without a gate, anyone with an email address could register as a
 * counsellor and immediately receive private messages from students in
 * distress. That is a safeguarding problem, not a product preference. Signup is
 * otherwise exactly as open as asked — any email provider, no admin step.
 *
 * The codes live here and are never sent to the browser, for the same reason as
 * the booking coupons: a code in the bundle is a published code.
 */
/**
 * Read from MENTOR_INVITE_CODES, comma-separated.
 *
 * These were literals here. In a public repository that is not a gate at all —
 * anyone reading the source could register as a counsellor and start receiving
 * private messages from students in distress. That is a safeguarding failure,
 * not a leaked discount.
 *
 * Empty by default, and an empty set means signup is closed rather than open:
 * a clone with no configuration must not accept mentors, because the failure
 * mode of guessing wrong here is somebody vulnerable talking to a stranger.
 */
const INVITE_CODES = new Set(
  (process.env.MENTOR_INVITE_CODES ?? '')
    .split(',')
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean),
);

const MIN_PASSWORD = 10;

export function inviteIsValid(raw: string): boolean {
  // No codes configured means nobody gets in, not everybody.
  if (INVITE_CODES.size === 0) return false;
  return INVITE_CODES.has(raw.trim().toUpperCase());
}

/** Rejects the passwords that actually get used, not a regex maze. */
export function passwordProblem(pw: string): string | null {
  if (pw.length < MIN_PASSWORD) return `Use at least ${MIN_PASSWORD} characters.`;
  if (/^[0-9]+$/.test(pw)) return 'Use more than just numbers.';
  if (['password12', 'mentor1234', '1234567890'].includes(pw.toLowerCase())) {
    return 'That password is too easy to guess.';
  }
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!methodGuard(req, res, ['POST'])) return;

  await withErrors(res, async () => {
    const body = parseBody(req, res, MentorSignup);
    if (!body) return;

    const email = body.email.toLowerCase().trim();

    if (!allow(`mentor-signup:${email}`, 5, 300_000)) {
      fail(res, 'Too many attempts. Try again shortly.', 429);
      return;
    }

    if (!inviteIsValid(body.inviteCode)) {
      fail(res, 'That invite code is not valid.', 403);
      return;
    }

    const problem = passwordProblem(body.password);
    if (problem) {
      fail(res, problem, 422);
      return;
    }

    const existing = await prisma.mentor.findUnique({ where: { email } });
    if (existing) {
      // Not "that email is taken" — this endpoint should not confirm which
      // addresses already belong to mentors.
      fail(res, 'That invite code is not valid.', 403);
      return;
    }

    const mentor = await prisma.mentor.create({
      data: {
        email,
        password: await hashPassword(body.password),
        name: body.name.trim(),
        specialization: body.specialization?.trim() || null,
        badge: 'Peer Mentor',
        status: 'online',
      },
    });

    const { token, expiresAt } = await createSession(mentor.id);
    ok(
      res,
      {
        token,
        expiresAt: expiresAt.toISOString(),
        mentor: {
          id: mentor.id,
          name: mentor.name,
          email: mentor.email,
          specialization: mentor.specialization,
          badge: mentor.badge,
        },
      },
      201,
    );
  });
}
