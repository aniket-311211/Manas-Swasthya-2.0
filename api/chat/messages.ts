import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../_lib/prisma';
import { ok, fail, parseBody, methodGuard, queryStr, withErrors } from '../_lib/http';
import { ChatMessageSave } from '../_lib/schemas';
import { requireVerifiedUser } from '../_lib/clerkAuth';

/**
 * Messages inside a room the caller belongs to.
 *
 * WHAT WAS WRONG: the membership check lived inside `if (clerkId) { … }`. Omit
 * the parameter and there was no check at all — `GET /api/chat/messages?roomId=`
 * returned up to two hundred messages of ANY room, private student-to-mentor
 * threads included, each with the author's Clerk id and name. The same hole on
 * DELETE let an anonymous caller wipe a whole conversation.
 *
 * Membership is now established before anything else happens, from the token.
 */

const MAX_STORED_MESSAGES = 50;

/** The room, only if the caller is in it. */
async function roomForCaller(roomId: string, userId: string) {
  return prisma.chatRoom.findFirst({
    where: { id: roomId, participants: { some: { id: userId } } },
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!methodGuard(req, res, ['GET', 'POST', 'DELETE'])) return;

  await withErrors(res, async () => {
    const user = await requireVerifiedUser(req, res);
    if (!user) return;

    if (req.method === 'POST') {
      const body = parseBody(req, res, ChatMessageSave);
      if (!body) return;

      if (!(await roomForCaller(body.roomId, user.id))) {
        // Not 403: confirming the room exists is itself a disclosure.
        fail(res, 'Chat room not found', 404);
        return;
      }

      // Authorship is decided here, not requested. `role` used to come from the
      // body, so anyone could plant a message attributed to the assistant —
      // fabricated advice under Manas's name, on a mental-health service.
      const message = await prisma.chatMessage.create({
        data: { roomId: body.roomId, userId: user.id, content: body.content, role: 'user' },
        include: { user: { select: { id: true, firstName: true, lastName: true } } },
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
    if (!(await roomForCaller(roomId, user.id))) {
      fail(res, 'Chat room not found', 404);
      return;
    }

    if (req.method === 'DELETE') {
      const clear = queryStr(req, 'clear') === '1';
      const deleted = clear
        ? await prisma.chatMessage.deleteMany({ where: { roomId } })
        : await pruneMessages(roomId);
      ok(res, { deleted: deleted.count });
      return;
    }

    const limit = Math.min(Math.max(Number(queryStr(req, 'limit')) || 50, 1), 200);
    const before = queryStr(req, 'before');
    const beforeAt = before ? new Date(before) : null;

    const messages = await prisma.chatMessage.findMany({
      where: {
        roomId,
        // An unparseable cursor is ignored rather than passed to Prisma as an
        // Invalid Date, which throws.
        ...(beforeAt && !Number.isNaN(beforeAt.getTime()) ? { timestamp: { lt: beforeAt } } : {}),
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    });
    ok(res, messages.reverse());
  });
}

async function pruneMessages(roomId: string) {
  const stale = await prisma.chatMessage.findMany({
    where: { roomId },
    orderBy: { timestamp: 'desc' },
    skip: MAX_STORED_MESSAGES,
    select: { id: true },
  });
  if (stale.length === 0) return { count: 0 };
  return prisma.chatMessage.deleteMany({ where: { id: { in: stale.map((message) => message.id) } } });
}
