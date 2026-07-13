import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../_lib/prisma';
import { ok, fail, parseBody, methodGuard, queryStr, withErrors } from '../_lib/http';
import { ChatMessageSave } from '../_lib/schemas';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!methodGuard(req, res, ['GET', 'POST'])) return;
  await withErrors(res, async () => {
    if (req.method === 'POST') {
      const body = parseBody(req, res, ChatMessageSave);
      if (!body) return;
      let userId: string | null = null;
      if (body.clerkId) {
        const user = await prisma.user.findUnique({ where: { clerkId: body.clerkId } });
        if (user) userId = user.id;
      }
      if (!userId) {
        const systemUser = await prisma.user.upsert({
          where: { clerkId: 'system' },
          update: {},
          create: {
            clerkId: 'system',
            email: 'system@manasswasthya.app',
            firstName: body.senderName ?? 'Manas',
            lastName: '',
          },
        });
        userId = systemUser.id;
      }
      const message = await prisma.chatMessage.create({
        data: { roomId: body.roomId, userId, content: body.content, role: body.role },
        include: { user: { select: { id: true, clerkId: true, firstName: true, lastName: true } } },
      });
      await prisma.chatRoom.update({ where: { id: body.roomId }, data: { updatedAt: new Date() } });
      ok(res, message, 201);
      return;
    }
    const roomId = queryStr(req, 'roomId');
    if (!roomId) {
      fail(res, 'roomId query parameter required', 422);
      return;
    }
    const limit = Math.min(Number(queryStr(req, 'limit') ?? 50), 200);
    const before = queryStr(req, 'before');
    const messages = await prisma.chatMessage.findMany({
      where: { roomId, ...(before ? { timestamp: { lt: new Date(before) } } : {}) },
      orderBy: { timestamp: 'desc' },
      take: limit,
      include: { user: { select: { id: true, clerkId: true, firstName: true, lastName: true } } },
    });
    ok(res, messages.reverse());
  });
}
