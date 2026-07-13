import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../_lib/prisma';
import { ok, methodGuard, queryStr, withErrors } from '../_lib/http';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!methodGuard(req, res, ['GET'])) return;
  await withErrors(res, async () => {
    const clerkId = queryStr(req, 'clerkId');
    let userId: string | null = null;
    if (clerkId) {
      const user = await prisma.user.findUnique({ where: { clerkId } });
      if (user) userId = user.id;
    }
    const groups = await prisma.chatRoom.findMany({
      where: { type: 'group' },
      include: {
        messages: { orderBy: { timestamp: 'desc' }, take: 1 },
        participants: { select: { id: true, clerkId: true, firstName: true, lastName: true } },
        _count: { select: { participants: true } },
      },
    });
    const withJoined = groups.map((g) => ({
      ...g,
      memberCount: g._count.participants,
      joined: userId ? g.participants.some((p) => p.id === userId) : false,
    }));
    ok(res, withJoined);
  });
}
