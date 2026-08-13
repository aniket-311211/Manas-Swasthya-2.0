import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../_lib/prisma';
import { ok, fail, parseBody, methodGuard, queryStr, withErrors } from '../_lib/http';
import { ThreadCreate, ThreadMessage } from '../_lib/schemas';
import { allow } from '../_lib/ratelimit';
import { LOCKED_PASSWORD, mentorFromToken } from '../_lib/mentorAuth';
import { verifiedUser } from '../_lib/clerkAuth';
import { bearer } from './auth';
import { detectCrisisServer } from '../ai/chat';

/**
 * One-to-one student ↔ mentor threads.
 *
 * A thread is a ChatRoom of type 'mentor' with both `studentId` and `mentorId`
 * set — columns that already existed in the schema for this and were never used.
 *
 * ACCESS IS THE WHOLE POINT. These are private conversations about someone's
 * mental health. A thread is readable and writable by exactly two parties: the
 * assigned student and the assigned mentor. Everyone else gets a 404 — not a
 * 403, because "this thread exists but is not yours" is itself a disclosure.
 */

/**
 * Resolves the caller to one side of a thread, or null.
 *
 * The student side used to be whatever `clerkId` the request named, so passing
 * a victim's id read their private mentor conversation and wrote into it. It is
 * now their verified Clerk token — the same proof the mentor side already had.
 */
async function partiesFor(req: VercelRequest) {
  const mentor = await mentorFromToken(bearer(req));
  if (mentor) return { mentorId: mentor.id, userId: null as string | null, name: mentor.name };
  const user = await verifiedUser(req);
  if (!user) return null;
  return {
    mentorId: null as string | null,
    userId: user.id,
    name: [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || 'Student',
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!methodGuard(req, res, ['GET', 'POST'])) return;

  await withErrors(res, async () => {
    // ---- Read: list my threads, or the messages in one -------------------
    if (req.method === 'GET') {
      const me = await partiesFor(req);
      if (!me) {
        fail(res, 'Sign in to see your conversations.', 401);
        return;
      }

      const roomId = queryStr(req, 'roomId');
      if (roomId) {
        const room = await prisma.chatRoom.findUnique({ where: { id: roomId } });
        const mine =
          room?.type === 'mentor' &&
          (me.mentorId ? room.mentorId === me.mentorId : room.studentId === me.userId);
        if (!mine) {
          fail(res, 'Conversation not found', 404);
          return;
        }
        const rows = await prisma.chatMessage.findMany({
          where: { roomId },
          orderBy: { timestamp: 'asc' },
          take: 300,
          include: { mentor: { select: { name: true, badge: true } } },
        });
        ok(
          res,
          rows.map((m) => ({
            id: m.id,
            content: m.content,
            timestamp: m.timestamp,
            isMentor: Boolean(m.mentorId),
            authorName: m.mentor?.name ?? m.authorName ?? 'Someone',
            badge: m.mentor?.badge ?? null,
          })),
        );
        return;
      }

      const rooms = await prisma.chatRoom.findMany({
        where: me.mentorId
          ? { type: 'mentor', mentorId: me.mentorId }
          : { type: 'mentor', studentId: me.userId },
        orderBy: { updatedAt: 'desc' },
        include: {
          messages: { orderBy: { timestamp: 'desc' }, take: 1 },
        },
      });

      // Names for the other side of each thread.
      const mentorIds = [...new Set(rooms.map((r) => r.mentorId).filter(Boolean))] as string[];
      const studentIds = [...new Set(rooms.map((r) => r.studentId).filter(Boolean))] as string[];
      const [mentorRows, studentRows] = await Promise.all([
        prisma.mentor.findMany({ where: { id: { in: mentorIds } }, select: { id: true, name: true, badge: true, specialization: true } }),
        prisma.user.findMany({ where: { id: { in: studentIds } }, select: { id: true, firstName: true, lastName: true } }),
      ]);
      const mentorById = new Map(mentorRows.map((m) => [m.id, m]));
      const studentById = new Map(studentRows.map((s) => [s.id, s]));

      ok(
        res,
        rooms.map((r) => {
          const m = r.mentorId ? mentorById.get(r.mentorId) : undefined;
          const s = r.studentId ? studentById.get(r.studentId) : undefined;
          return {
            id: r.id,
            status: r.status ?? 'active',
            updatedAt: r.updatedAt,
            lastMessage: r.messages[0]?.content ?? null,
            lastAt: r.messages[0]?.timestamp ?? r.createdAt,
            mentor: m ? { id: m.id, name: m.name, badge: m.badge, specialization: m.specialization } : null,
            student: s
              ? { id: s.id, name: [s.firstName, s.lastName].filter(Boolean).join(' ').trim() || 'Student' }
              : null,
          };
        }),
      );
      return;
    }

    // ---- Write: start a thread, or send into one -------------------------
    const isSend = typeof (req.body as { roomId?: unknown })?.roomId === 'string';

    if (!isSend) {
      // Only a student opens a thread — a mentor cannot cold-message someone.
      const body = parseBody(req, res, ThreadCreate);
      if (!body) return;

      const user = await verifiedUser(req);
      if (!user) {
        fail(res, 'Sign in to start a conversation.', 401);
        return;
      }
      // A retired account can never sign in to answer, so it must not be
      // possible to open a thread with one from a stale directory listing.
      const mentor = await prisma.mentor.findFirst({
        where: { id: body.mentorId, password: { not: LOCKED_PASSWORD } },
      });
      if (!mentor) {
        fail(res, 'That mentor is not available.', 404);
        return;
      }

      // One open thread per pair, so a student does not fragment their history
      // across duplicates and a mentor sees one continuous conversation.
      const existing = await prisma.chatRoom.findFirst({
        where: { type: 'mentor', mentorId: mentor.id, studentId: user.id, status: { not: 'closed' } },
      });
      if (existing) {
        ok(res, { id: existing.id, existing: true }, 200);
        return;
      }

      if (!allow(`thread-create:${user.id}`, 5, 60_000)) {
        fail(res, 'Too many new conversations. Give it a minute.', 429);
        return;
      }

      const room = await prisma.chatRoom.create({
        data: {
          type: 'mentor',
          name: `${mentor.name} and ${[user.firstName, user.lastName].filter(Boolean).join(' ').trim() || 'a student'}`,
          mentorId: mentor.id,
          studentId: user.id,
          status: 'active',
          tags: [],
        },
      });
      ok(res, { id: room.id, existing: false }, 201);
      return;
    }

    const body = parseBody(req, res, ThreadMessage);
    if (!body) return;

    const me = await partiesFor(req);
    if (!me) {
      fail(res, 'Sign in to reply.', 401);
      return;
    }

    const room = await prisma.chatRoom.findUnique({ where: { id: body.roomId } });
    const mine =
      room?.type === 'mentor' &&
      (me.mentorId ? room.mentorId === me.mentorId : room.studentId === me.userId);
    if (!mine) {
      fail(res, 'Conversation not found', 404);
      return;
    }

    const key = me.mentorId ? `thread:m:${me.mentorId}` : `thread:u:${me.userId}`;
    if (!allow(key, 30, 60_000)) {
      fail(res, 'Slow down a moment.', 429);
      return;
    }

    const created = await prisma.chatMessage.create({
      data: {
        roomId: room!.id,
        mentorId: me.mentorId,
        userId: me.userId,
        authorName: me.name,
        role: 'user',
        content: body.content,
      },
    });
    // Bumped so the thread list sorts by real activity.
    await prisma.chatRoom.update({ where: { id: room!.id }, data: { updatedAt: new Date() } });

    ok(res, { id: created.id, crisis: detectCrisisServer(body.content) }, 201);
  });
}
