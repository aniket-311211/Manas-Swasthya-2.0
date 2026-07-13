import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../_lib/prisma';
import { ok, fail, parseBody, methodGuard, queryStr, withErrors } from '../_lib/http';
import { MoodSave } from '../_lib/schemas';
import { requireUser } from '../_lib/users';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!methodGuard(req, res, ['GET', 'POST'])) return;
  await withErrors(res, async () => {
    if (req.method === 'POST') {
      const body = parseBody(req, res, MoodSave);
      if (!body) return;
      const user = await requireUser(body.clerkId);
      const entry = await prisma.moodEntry.create({
        data: {
          userId: user.id,
          mood: body.mood,
          notes: body.notes ?? null,
          stress: body.stress ?? null,
          anxiety: body.anxiety ?? null,
          sleep: body.sleep ?? null,
        },
      });
      ok(res, entry, 201);
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
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const entries = await prisma.moodEntry.findMany({
      where: { userId: user.id, createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
    });
    ok(res, entries);
  });
}
