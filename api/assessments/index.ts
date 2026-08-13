import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Prisma } from '@prisma/client';
import { prisma } from '../_lib/prisma';
import { ok, parseBody, methodGuard, withErrors } from '../_lib/http';
import { AssessmentSave } from '../_lib/schemas';
import { requireVerifiedUser } from '../_lib/clerkAuth';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!methodGuard(req, res, ['GET', 'POST'])) return;
  await withErrors(res, async () => {
    // Identity comes from the verified Clerk token, never from the request.
    // A `clerkId` in the body or query is a claim anyone can make; this file
    // used to believe it, which handed out anyone's stress, anxiety and sleep scores to whoever asked.
    const user = await requireVerifiedUser(req, res);
    if (!user) return;

    if (req.method === 'POST') {
      const body = parseBody(req, res, AssessmentSave);
      if (!body) return;
      const assessment = await prisma.assessment.create({
        data: {
          userId: user.id,
          stress: body.stress,
          anxiety: body.anxiety,
          sleep: body.sleep,
          answers: body.answers as Prisma.InputJsonValue,
          activities: body.activities as Prisma.InputJsonValue,
          games: body.games as Prisma.InputJsonValue,
        },
      });
      ok(res, assessment, 201);
      return;
    }
    const assessments = await prisma.assessment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    ok(res, assessments);
  });
}
