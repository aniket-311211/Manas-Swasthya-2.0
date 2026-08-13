import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../_lib/prisma';
import { ok, parseBody, methodGuard, withErrors } from '../_lib/http';
import { MoodSave } from '../_lib/schemas';
import { requireVerifiedUser } from '../_lib/clerkAuth';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!methodGuard(req, res, ['GET', 'POST'])) return;
  await withErrors(res, async () => {
    // Identity comes from the verified Clerk token, never from the request.
    // A `clerkId` in the body or query is a claim anyone can make; this file
    // used to believe it, which handed out ninety days of anyone's mood notes to whoever asked.
    const user = await requireVerifiedUser(req, res);
    if (!user) return;

    if (req.method === 'POST') {
      const body = parseBody(req, res, MoodSave);
      if (!body) return;
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
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const entries = await prisma.moodEntry.findMany({
      where: { userId: user.id, createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
    });
    ok(res, entries);
  });
}
