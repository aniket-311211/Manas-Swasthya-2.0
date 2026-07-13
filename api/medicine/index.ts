import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Prisma } from '@prisma/client';
import { prisma } from '../_lib/prisma';
import { ok, fail, parseBody, methodGuard, queryStr, withErrors } from '../_lib/http';
import { MedicineSave } from '../_lib/schemas';
import { requireUser } from '../_lib/users';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!methodGuard(req, res, ['GET', 'POST'])) return;
  await withErrors(res, async () => {
    if (req.method === 'POST') {
      const body = parseBody(req, res, MedicineSave);
      if (!body) return;
      const user = await requireUser(body.clerkId);
      const a = body.analysis;
      const saved = await prisma.medicineAnalysis.create({
        data: {
          userId: user.id,
          name: a.name,
          uses: a.uses,
          dosage: a.dosage as Prisma.InputJsonValue,
          sideEffects: a.sideEffects,
          warnings: a.warnings,
          safetyVerdict: a.safetyVerdict,
          confidence: a.confidence,
          imageUrl: a.imageUrl ?? null,
          medicineName: a.medicineName ?? null,
        },
      });
      ok(res, saved, 201);
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
    const history = await prisma.medicineAnalysis.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    ok(res, history);
  });
}
