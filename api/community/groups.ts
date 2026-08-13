import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../_lib/prisma';
import { ok, methodGuard, withErrors } from '../_lib/http';
import { verifiedUser } from '../_lib/clerkAuth';

/**
 * The peer circles, and whether you are in them.
 *
 * WHAT IS NO LONGER RETURNED: this used to `include` the full participant list
 * — every member's Clerk id and real name — and spread it into the response.
 * Anyone loading the community page received the roster of every circle,
 * including ones they had not joined. On a mental-health service the
 * membership list of an anxiety circle IS the sensitive data; the count is
 * all the UI ever needed.
 */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!methodGuard(req, res, ['GET'])) return;
  await withErrors(res, async () => {
    // Anonymous callers still see the circles — that is the browse experience —
    // they just never see who is in them, and `joined` is false.
    const me = await verifiedUser(req);

    const groups = await prisma.chatRoom.findMany({
      where: { type: 'group' },
      include: {
        messages: { orderBy: { timestamp: 'desc' }, take: 1 },
        participants: { select: { id: true } },
        _count: { select: { participants: true } },
      },
    });

    ok(
      res,
      groups.map((g) => ({
        id: g.id,
        type: g.type,
        name: g.name,
        description: g.description,
        topic: g.topic,
        tags: g.tags,
        maxParticipants: g.maxParticipants,
        createdAt: g.createdAt,
        updatedAt: g.updatedAt,
        messages: g.messages,
        memberCount: g._count.participants,
        joined: me ? g.participants.some((p) => p.id === me.id) : false,
      })),
    );
  });
}
