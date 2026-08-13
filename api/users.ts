import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClerkClient } from '@clerk/backend';
import { prisma } from './_lib/prisma';
import { ok, fail, parseBody, methodGuard, withErrors } from './_lib/http';
import { UserUpsert } from './_lib/schemas';
import { verifiedClerkId } from './_lib/clerkAuth';
import { ensureAssignedMentor } from './_lib/assignMentor';

/**
 * Sync the signed-in Clerk account into our own users table.
 *
 * WHY THE IDENTITY COMES FROM THE TOKEN: this endpoint used to take `clerkId`
 * and `email` from the request body and trust both. Because it adopts an
 * existing row when the email matches, an unauthenticated caller could post
 * their own invented `clerkId` with a victim's email address and have the
 * victim's row rebound to an id they controlled — every other endpoint then
 * treated them as that person, and the real user was locked out. That is an
 * account takeover, and it was reachable by anyone who could guess an email.
 *
 * The adoption path itself is still needed: Clerk reissues an id when an
 * account is deleted and recreated, and without it the user hits a unique
 * constraint on `email` and can never write anything again. So it stays — but
 * it now asks Clerk whether the caller actually owns that address first.
 */

/** Only consulted on the rare adoption path, so the usual case stays one query. */
async function clerkOwnsEmail(clerkId: string, email: string): Promise<boolean> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) return false;
  try {
    const clerk = createClerkClient({ secretKey });
    const account = await clerk.users.getUser(clerkId);
    return account.emailAddresses.some(
      (e) =>
        e.emailAddress.toLowerCase() === email.toLowerCase() &&
        e.verification?.status === 'verified',
    );
  } catch (err) {
    console.error('Could not confirm email ownership with Clerk', err);
    return false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!methodGuard(req, res, ['POST'])) return;

  const clerkId = await verifiedClerkId(req);
  if (!clerkId) {
    fail(res, 'Sign in to continue.', 401);
    return;
  }

  const body = parseBody(req, res, UserUpsert);
  if (!body) return;

  await withErrors(res, async () => {
    const email = body.email.trim().toLowerCase();

    let existing = await prisma.user.findUnique({ where: { clerkId } });

    if (!existing) {
      const byEmail = await prisma.user.findUnique({ where: { email } });
      if (byEmail) {
        // Someone else's row already holds this address. Rebinding it is only
        // legitimate if Clerk agrees the address belongs to the caller.
        if (!(await clerkOwnsEmail(clerkId, email))) {
          fail(res, 'That email address belongs to a different account.', 409);
          return;
        }
        existing = byEmail;
      }
    }

    const user = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: {
            clerkId,
            email,
            firstName: body.firstName ?? undefined,
            lastName: body.lastName ?? undefined,
            university: body.university ?? undefined,
          },
        })
      : await prisma.user.create({
          data: {
            clerkId,
            email,
            firstName: body.firstName ?? null,
            lastName: body.lastName ?? null,
            university: body.university ?? null,
          },
        });

    // Every student gets a mentor from the moment they exist, so the mentor
    // space is never an empty room. Idempotent, and a failure here must not
    // break sign-in — a missing thread is recoverable, a broken login is not.
    await ensureAssignedMentor(user.id).catch(() => null);

    ok(res, user);
  });
}
