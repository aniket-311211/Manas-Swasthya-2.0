import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../_lib/prisma';
import { ok, parseBody, methodGuard, queryStr, withErrors } from '../_lib/http';
import { RoomCreate } from '../_lib/schemas';
import { requireVerifiedUser } from '../_lib/clerkAuth';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!methodGuard(req, res, ['GET', 'POST'])) return;
  await withErrors(res, async () => {
    if (req.method === 'POST') {
      const body = parseBody(req, res, RoomCreate);
      if (!body) return;
      // The creator is the caller, proven. `mentorId`/`studentId` used to be
      // whatever the request said, so anyone could manufacture a "mentor" room
      // between two people they chose. Mentor threads are created by
      // api/mentors/threads.ts, which checks both sides; this route only makes
      // rooms the caller is in.
      const user = await requireVerifiedUser(req, res);
      if (!user) return;
      const room = await prisma.chatRoom.create({
        data: {
          type: body.type === 'mentor' ? 'group' : body.type,
          name: body.name ?? null,
          description: body.description ?? null,
          mentorId: null,
          studentId: body.type === 'private' ? user.id : null,
          topic: body.topic ?? null,
          tags: body.tags,
          status: 'active',
          participants: { connect: [{ id: user.id }] },
        },
        include: { participants: { select: { id: true, firstName: true, lastName: true } } },
      });
      ok(res, room, 201);
      return;
    }
    // Was: an empty `where` when no clerkId was supplied, so a bare GET
    // returned EVERY room in the system with its last message and the full
    // participant list — Clerk ids and real names included. That single request
    // enumerated the user base and previewed every conversation.
    const user = await requireVerifiedUser(req, res);
    if (!user) return;

    const type = queryStr(req, 'type');
    const rooms = await prisma.chatRoom.findMany({
      where: {
        ...(type ? { type } : {}),
        // Always scoped to the caller. Not optional any more.
        participants: { some: { id: user.id } },
      },
      include: {
        messages: { orderBy: { timestamp: 'desc' }, take: 1 },
        participants: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    ok(res, rooms);
  });
}
