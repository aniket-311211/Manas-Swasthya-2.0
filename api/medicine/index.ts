import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../_lib/prisma';
import { ok, fail, methodGuard, withErrors } from '../_lib/http';
import { verifiedUser } from '../_lib/clerkAuth';

/**
 * Your own medicine history.
 *
 * Read-only now. The POST that used to live here let the browser write whatever
 * it wanted into a medical record; analyses are saved by api/ai/medicine.ts
 * from the validated model output instead.
 *
 * The old GET took `?clerkId=` and returned that person's history to whoever
 * asked — a straight insecure-direct-object-reference over what medication
 * somebody is looking up. There is no user parameter any more: you get yours.
 */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!methodGuard(req, res, ['GET'])) return;

  await withErrors(res, async () => {
    const user = await verifiedUser(req);
    if (!user) {
      fail(res, 'Sign in to see your history.', 401);
      return;
    }

    const history = await prisma.medicineAnalysis.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    ok(res, history);
  });
}
