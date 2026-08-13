import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../_lib/prisma';
import { ok, fail, parseBody, methodGuard, queryStr, withErrors } from '../_lib/http';
import { JournalSave, JournalUpdate } from '../_lib/schemas';
import { requireVerifiedUser } from '../_lib/clerkAuth';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!methodGuard(req, res, ['GET', 'POST', 'PUT', 'DELETE'])) return;
  await withErrors(res, async () => {
    // Identity comes from the verified Clerk token, never from the request.
    // A `clerkId` in the body or query is a claim anyone can make; this file
    // used to believe it, which handed out every word of anyone's journal, plus the ability to edit and delete it to whoever asked.
    const user = await requireVerifiedUser(req, res);
    if (!user) return;

    if (req.method === 'POST') {
      const body = parseBody(req, res, JournalSave);
      if (!body) return;
      const todayKey = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
      if (body.entryDate && body.entryDate > todayKey) {
        fail(res, 'Journal entries cannot be dated in the future', 422);
        return;
      }
      const entry = await prisma.journalEntry.create({
        data: {
          userId: user.id,
          title: body.title ?? null,
          content: body.content,
          mood: body.mood ?? null,
          tags: body.tags,
          ...(body.entryDate
            ? { createdAt: new Date(`${body.entryDate}T12:00:00.000Z`) }
            : {}),
        },
      });
      ok(res, entry, 201);
      return;
    }
    if (req.method === 'PUT') {
      const body = parseBody(req, res, JournalUpdate);
      if (!body) return;
      const existing = await prisma.journalEntry.findFirst({ where: { id: body.id, userId: user.id } });
      if (!existing) {
        fail(res, 'Journal entry not found', 404);
        return;
      }
      const entry = await prisma.journalEntry.update({
        where: { id: body.id },
        data: {
          // `undefined` means "not sent"; an explicit null means "clear it".
          // `?? existing` collapsed the two, so deleting a title reported saved
          // and then came back on reload.
          title: body.title === undefined ? existing.title : body.title,
          content: body.content ?? existing.content,
          mood: body.mood === undefined ? existing.mood : body.mood,
          tags: body.tags ?? existing.tags,
        },
      });
      ok(res, entry);
      return;
    }
    if (req.method === 'DELETE') {
      const id = queryStr(req, 'id');
      if (!id) {
        fail(res, 'id query parameter required', 422);
        return;
      }
      const existing = await prisma.journalEntry.findFirst({ where: { id, userId: user.id } });
      if (!existing) {
        fail(res, 'Journal entry not found', 404);
        return;
      }
      await prisma.journalEntry.delete({ where: { id } });
      ok(res, { deleted: true });
      return;
    }
    const entries = await prisma.journalEntry.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    ok(res, entries);
  });
}
