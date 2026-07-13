import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../_lib/prisma';
import { ok, parseBody, methodGuard, queryStr, withErrors } from '../_lib/http';
import { RoomCreate } from '../_lib/schemas';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!methodGuard(req, res, ['GET', 'POST'])) return;
  await withErrors(res, async () => {
    if (req.method === 'POST') {
      const body = parseBody(req, res, RoomCreate);
      if (!body) return;
      let participantConnect: { id: string }[] = [];
      if (body.clerkId) {
        const user = await prisma.user.findUnique({ where: { clerkId: body.clerkId } });
        if (user) participantConnect = [{ id: user.id }];
      }
      const room = await prisma.chatRoom.create({
        data: {
          type: body.type,
          name: body.name ?? null,
          description: body.description ?? null,
          mentorId: body.mentorId ?? null,
          studentId: body.studentId ?? null,
          topic: body.topic ?? null,
          tags: body.tags,
          status: 'active',
          participants: participantConnect.length > 0 ? { connect: participantConnect } : undefined,
        },
        include: { participants: { select: { id: true, clerkId: true, firstName: true, lastName: true } } },
      });
      ok(res, room, 201);
      return;
    }
    const clerkId = queryStr(req, 'clerkId');
    const type = queryStr(req, 'type');
    const where: { type?: string; participants?: { some: { id: string } } } = {};
    if (type) where.type = type;
    if (clerkId) {
      const user = await prisma.user.findUnique({ where: { clerkId } });
      if (!user) {
        ok(res, []);
        return;
      }
      where.participants = { some: { id: user.id } };
    }
    const rooms = await prisma.chatRoom.findMany({
      where,
      include: {
        messages: { orderBy: { timestamp: 'desc' }, take: 1 },
        participants: { select: { id: true, clerkId: true, firstName: true, lastName: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    ok(res, rooms);
  });
}
