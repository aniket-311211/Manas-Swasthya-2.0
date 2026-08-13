import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../_lib/prisma';
import { ok, fail, parseBody, methodGuard, queryStr, withErrors } from '../_lib/http';
import { CommunityMessage } from '../_lib/schemas';
import { allow } from '../_lib/ratelimit';
import { mentorFromToken } from '../_lib/mentorAuth';
import { verifiedUser } from '../_lib/clerkAuth';
import { bearer } from '../mentors/auth';
import { detectCrisisServer } from '../ai/chat';

/**
 * Group chat messages.
 *
 * AUTHORSHIP IS DECIDED HERE, NEVER BY THE CLIENT. A request either carries a
 * mentor bearer token or a clerkId; the server resolves it to a real row and
 * stamps the author. A client cannot claim to be a mentor by sending a flag,
 * which is exactly what the previous design allowed.
 *
 * MEMBERSHIP IS ENFORCED. Only someone who has joined a group can post to it,
 * so a group id alone is not a write capability.
 */

const MAX_PER_FETCH = 200;

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!methodGuard(req, res, ['GET', 'POST'])) return;

  await withErrors(res, async () => {
    if (req.method === 'GET') {
      const roomId = queryStr(req, 'roomId');
      if (!roomId) {
        fail(res, 'roomId query parameter required', 422);
        return;
      }
      const room = await prisma.chatRoom.findUnique({
        where: { id: roomId },
        include: { participants: { select: { id: true } } },
      });
      if (!room || room.type !== 'group') {
        fail(res, 'Group not found', 404);
        return;
      }

      // Reading a circle used to be open to anyone with a room id. What people
      // write in a peer support circle is for the circle.
      const mentor = await mentorFromToken(bearer(req));
      const me = mentor ? null : await verifiedUser(req);
      const allowed = Boolean(mentor) || (me ? room.participants.some((p) => p.id === me.id) : false);
      if (!allowed) {
        fail(res, 'Join this circle to read it.', 403);
        return;
      }

      const rows = await prisma.chatMessage.findMany({
        where: { roomId },
        orderBy: { timestamp: 'asc' },
        take: MAX_PER_FETCH,
        include: {
          user: { select: { firstName: true, lastName: true } },
          mentor: { select: { name: true, badge: true } },
        },
      });
      ok(
        res,
        rows.map((m) => ({
          id: m.id,
          roomId: m.roomId,
          content: m.content,
          timestamp: m.timestamp,
          isMentor: Boolean(m.mentorId),
          authorName:
            m.mentor?.name ??
            m.authorName ??
            [m.user?.firstName, m.user?.lastName].filter(Boolean).join(' ').trim() ??
            'Someone',
          badge: m.mentor?.badge ?? null,
        })),
      );
      return;
    }

    const body = parseBody(req, res, CommunityMessage);
    if (!body) return;

    const room = await prisma.chatRoom.findUnique({
      where: { id: body.roomId },
      include: { participants: { select: { id: true } } },
    });
    if (!room || room.type !== 'group') {
      fail(res, 'Group not found', 404);
      return;
    }

    const mentor = await mentorFromToken(bearer(req));

    if (mentor) {
      if (!allow(`community-post:m:${mentor.id}`, 30, 60_000)) {
        fail(res, 'Slow down a moment.', 429);
        return;
      }
      const created = await prisma.chatMessage.create({
        data: {
          roomId: room.id,
          mentorId: mentor.id,
          authorName: mentor.name,
          role: 'user',
          content: body.content,
        },
      });
      ok(res, { id: created.id, crisis: detectCrisisServer(body.content) }, 201);
      return;
    }

    // Was `body.clerkId`, so anyone could post into a circle as anyone else.
    const user = await verifiedUser(req);
    if (!user) {
      fail(res, 'Sign in to post.', 401);
      return;
    }
    if (!room.participants.some((p) => p.id === user.id)) {
      fail(res, 'Join this group before posting.', 403);
      return;
    }
    if (!allow(`community-post:u:${user.id}`, 20, 60_000)) {
      fail(res, 'Slow down a moment.', 429);
      return;
    }

    const created = await prisma.chatMessage.create({
      data: {
        roomId: room.id,
        userId: user.id,
        authorName: [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || 'Student',
        role: 'user',
        content: body.content,
      },
    });

    // Peer spaces are exactly where a student discloses distress. The flag comes
    // back so the client can surface helplines to the author immediately.
    ok(res, { id: created.id, crisis: detectCrisisServer(body.content) }, 201);
  });
}
