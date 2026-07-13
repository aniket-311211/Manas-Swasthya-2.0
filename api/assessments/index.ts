import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Prisma } from '@prisma/client';
import { prisma } from '../_lib/prisma';
import { ok, fail, parseBody, methodGuard, queryStr, withErrors } from '../_lib/http';
import { AssessmentSave } from '../_lib/schemas';
import { requireUser } from '../_lib/users';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!methodGuard(req, res, ['GET', 'POST'])) return;
  await withErrors(res, async () => {
    if (req.method === 'POST') {
      const body = parseBody(req, res, AssessmentSave);
      if (!body) return;
      const user = await requireUser(body.clerkId);
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
    const clerkId = queryStr(req, 'clerkId');
    if (!clerkId) {
      fail(res, 'clerkId query parameter required', 422);
      return;
    }
    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      ok(res, []);
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
