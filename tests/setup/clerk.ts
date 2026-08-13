import { vi } from 'vitest';

/**
 * Stubs Clerk's signature check — and nothing else.
 *
 * The endpoints now take identity from a signed Clerk session token, which a
 * unit test cannot mint. Rather than punch a hole in the application code, this
 * replaces only the third-party cryptographic step: `verifyToken`. Everything
 * downstream — reading the Authorization header, failing closed on a missing
 * secret, resolving the subject to a row in our own database, the 401s — is the
 * real code path.
 *
 * A test signs in by sending `Authorization: Bearer test:<clerkId>`. Any other
 * token throws exactly as a forged one would, so the "refuses a forged token"
 * assertions still mean something.
 */
/**
 * Which verified email addresses Clerk believes each account owns.
 *
 * api/users.ts consults Clerk before letting a caller adopt an existing row by
 * email — the check that closed the account-takeover hole. Tests declare
 * ownership here so both outcomes can be exercised.
 */
const verifiedEmails = new Map<string, string[]>();

export function grantVerifiedEmail(clerkId: string, email: string): void {
  verifiedEmails.set(clerkId, [...(verifiedEmails.get(clerkId) ?? []), email.toLowerCase()]);
}

vi.mock('@clerk/backend', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@clerk/backend')>();
  return {
    ...actual,
    verifyToken: vi.fn(async (token: string) => {
      if (!token.startsWith('test:')) throw new Error('Token verification failed');
      return { sub: token.slice('test:'.length) };
    }),
    createClerkClient: vi.fn(() => ({
      users: {
        getUser: async (clerkId: string) => ({
          emailAddresses: (verifiedEmails.get(clerkId) ?? []).map((emailAddress) => ({
            emailAddress,
            verification: { status: 'verified' },
          })),
        }),
      },
    })),
  };
});

/** The header a signed-in caller sends. */
export function asUser(clerkId: string): Record<string, string> {
  return { authorization: `Bearer test:${clerkId}` };
}

/*
 * Waiver and invite codes moved out of source when the repository went public,
 * so the suite supplies its own rather than depending on a .env that a fresh
 * clone will not have. Set before any handler module is imported — vitest runs
 * setup files first, and both lists are read at module load.
 */
process.env.BOOKING_COUPON_CODES ??=
  'DEMOCODE55:Campus wellbeing drive,DEMOCODE66:Peer support week,DEMOCODE77:Orientation cohort,DEMOCODE88:Exam season relief,DEMOCODE99:Counsellor referral';
process.env.MENTOR_INVITE_CODES ??= 'DEMO-INVITE-A,DEMO-INVITE-B,DEMO-INVITE-C';
