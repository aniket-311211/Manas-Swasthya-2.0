import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyToken } from '@clerk/backend';
import { prisma } from './prisma';

/**
 * Proves who is calling, instead of believing them.
 *
 * Every other endpoint in this codebase takes `clerkId` out of the request body
 * and trusts it. For most of them that buys an attacker somebody else's mood
 * entries. For the medicine endpoints it bought two worse things:
 *
 *   1. Free use of our Gemini key. The rate limiter keyed on the same unverified
 *      string, so rotating `clerkId` on each request bypassed it entirely — and
 *      the client sent the literal string 'anonymous' when signed out.
 *   2. Anyone's medicine history, given only their Clerk id.
 *
 * A Clerk session token is signed by Clerk and verified here against
 * CLERK_SECRET_KEY, so the subject claim cannot be chosen by the caller.
 */

/** Reads the token out of `Authorization: Bearer <jwt>`. */
export function bearerToken(req: VercelRequest): string | undefined {
  const header = req.headers.authorization;
  if (typeof header !== 'string') return undefined;
  const [scheme, token] = header.split(' ');
  return scheme?.toLowerCase() === 'bearer' && token ? token : undefined;
}

/**
 * The verified Clerk id, or null. Never throws: callers turn null into a 401.
 *
 * Fails closed. A missing CLERK_SECRET_KEY means we cannot verify anything, so
 * every request is rejected rather than waved through — a deploy that forgets
 * the variable should break loudly, not silently reopen the hole.
 */
export async function verifiedClerkId(req: VercelRequest): Promise<string | null> {
  const token = bearerToken(req);
  if (!token) return null;

  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    console.error('CLERK_SECRET_KEY is not set; refusing to authenticate anyone.');
    return null;
  }

  try {
    const claims = await verifyToken(token, { secretKey });
    return typeof claims.sub === 'string' && claims.sub.length > 0 ? claims.sub : null;
  } catch {
    // Expired, tampered with, or signed by a different Clerk instance. All the
    // same answer, and the reason is not the caller's business.
    return null;
  }
}

/**
 * The verified caller as a row in our own database, or null.
 *
 * A valid token for somebody who has never been synced is still not a user
 * here, and must not be able to spend a quota or read a history.
 */
export async function verifiedUser(req: VercelRequest) {
  const clerkId = await verifiedClerkId(req);
  if (!clerkId) return null;
  return prisma.user.findUnique({ where: { clerkId } });
}

/**
 * The caller as a row in our database, or a 401 already written to `res`.
 *
 * The shape callers want:
 *   const user = await requireVerifiedUser(req, res);
 *   if (!user) return;
 */
export async function requireVerifiedUser(req: VercelRequest, res: VercelResponse) {
  const user = await verifiedUser(req);
  if (!user) {
    res.status(401).json({ ok: false, error: 'Sign in to continue.' });
    return null;
  }
  return user;
}
