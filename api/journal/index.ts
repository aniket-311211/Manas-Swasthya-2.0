import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../_lib/prisma';
import { ok, fail, parseBody, methodGuard, queryStr, withErrors } from '../_lib/http';
import { JournalSave, JournalUpdate } from '../_lib/schemas';
import { requireUser } from '../_lib/users';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!methodGuard(req, res, ['GET', 'POST', 'PUT', 'DELETE'])) return;
  await withErrors(res, async () => {
    if (req.method === 'POST') {
      const body = parseBody(req, res, JournalSave);
      if (!body) return;
      const user = await requireUser(body.clerkId);
      const entry = await prisma.journalEntry.create({
        data: {
          userId: user.id,
          title: body.title ?? null,
          content: body.content,
          mood: body.mood ?? null,
          tags: body.tags,
        },
      });
      ok(res, entry, 201);
      return;
    }
    if (req.method === 'PUT') {
      const body = parseBody(req, res, JournalUpdate);
      if (!body) return;
      const user = await requireUser(body.clerkId);
      const existing = await prisma.journalEntry.findFirst({ where: { id: body.id, userId: user.id } });
      if (!existing) {
        fail(res, 'Journal entry not found', 404);
        return;
      }
      const entry = await prisma.journalEntry.update({
        where: { id: body.id },
        data: {
          title: body.title ?? existing.title,
          content: body.content ?? existing.content,
          mood: body.mood ?? existing.mood,
          tags: body.tags ?? existing.tags,
        },
      });
      ok(res, entry);
      return;
    }
    if (req.method === 'DELETE') {
      const id = queryStr(req, 'id');
      const clerkId = queryStr(req, 'clerkId');
      if (!id || !clerkId) {
        fail(res, 'id and clerkId query parameters required', 422);
        return;
      }
      const user = await requireUser(clerkId);
      const existing = await prisma.journalEntry.findFirst({ where: { id, userId: user.id } });
      if (!existing) {
        fail(res, 'Journal entry not found', 404);
        return;
      }
      await prisma.journalEntry.delete({ where: { id } });
      ok(res, { deleted: true });
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
    const entries = await prisma.journalEntry.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    ok(res, entries);
  });
}
