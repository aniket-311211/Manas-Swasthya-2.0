import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../_lib/prisma';
import { ok, fail, parseBody, methodGuard, queryStr, withErrors } from '../_lib/http';
import { EventAction } from '../_lib/schemas';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!methodGuard(req, res, ['GET', 'POST'])) return;
  await withErrors(res, async () => {
    if (req.method === 'POST') {
      const body = parseBody(req, res, EventAction);
      if (!body) return;
      if (body.action === 'register') {
        const event = await prisma.event.findUnique({
          where: { id: body.eventId },
          include: { _count: { select: { registrations: true } } },
        });
        if (!event) {
          fail(res, 'Event not found', 404);
          return;
        }
        if (event._count.registrations >= event.maxParticipants) {
          fail(res, 'Event is full', 400);
          return;
        }
        const registration = await prisma.eventRegistration.upsert({
          where: { userId_eventId: { userId: body.clerkId, eventId: body.eventId } },
          update: { status: 'registered' },
          create: { userId: body.clerkId, eventId: body.eventId, status: 'registered' },
        });
        ok(res, registration, 201);
        return;
      }
      await prisma.eventRegistration.deleteMany({
        where: { userId: body.clerkId, eventId: body.eventId },
      });
      ok(res, { unregistered: true });
      return;
    }
    const clerkId = queryStr(req, 'clerkId');
    const events = await prisma.event.findMany({
      include: { registrations: true, _count: { select: { registrations: true } } },
      orderBy: { date: 'asc' },
    });
    const shaped = events.map((e) => ({
      ...e,
      participantCount: e._count.registrations,
      isRegistered: clerkId ? e.registrations.some((r) => r.userId === clerkId) : false,
    }));
    ok(res, shaped);
  });
}
