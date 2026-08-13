import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../_lib/prisma';
import { ok, fail, parseBody, methodGuard, withErrors } from '../_lib/http';
import { EventAction } from '../_lib/schemas';
import { requireVerifiedUser, verifiedClerkId } from '../_lib/clerkAuth';

/**
 * Activities, and taking a place in one.
 *
 * `EventRegistration.userId` holds a Clerk id rather than our own user id and
 * carries no foreign key — a quirk of the original schema that the rest of this
 * file has to work around.
 */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!methodGuard(req, res, ['GET', 'POST'])) return;

  await withErrors(res, async () => {
    if (req.method === 'POST') {
      const body = parseBody(req, res, EventAction);
      if (!body) return;

      // Identity from the token. The body's `clerkId` used to be trusted, which
      // let anyone invent participants to fill a session, or free somebody
      // else's seat.
      const user = await requireVerifiedUser(req, res);
      if (!user) return;
      const clerkId = user.clerkId;

      if (body.action === 'unregister') {
        await prisma.eventRegistration.deleteMany({ where: { userId: clerkId, eventId: body.eventId } });
        ok(res, { unregistered: true });
        return;
      }

      const event = await prisma.event.findUnique({ where: { id: body.eventId } });
      if (!event) {
        fail(res, 'Event not found', 404);
        return;
      }

      const registration = await prisma.eventRegistration.upsert({
        where: { userId_eventId: { userId: clerkId, eventId: body.eventId } },
        update: { status: 'registered' },
        create: { userId: clerkId, eventId: body.eventId, status: 'registered' },
      });

      // Capacity is settled AFTER the write, not before. Counting first and
      // inserting second is a race two people hit on the last seat and both
      // pass. Writing first and then counting who got in ahead of you gives a
      // deterministic winner — the earlier row keeps the place, the later one
      // hands it back — instead of overselling the room.
      const ahead = await prisma.eventRegistration.count({
        where: { eventId: event.id, createdAt: { lt: registration.createdAt } },
      });
      if (ahead >= event.maxParticipants) {
        await prisma.eventRegistration.delete({ where: { id: registration.id } });
        fail(res, 'That last place went to someone else.', 409);
        return;
      }

      ok(res, registration, 201);
      return;
    }

    // Browsing the board does not require an account; knowing whether YOU have
    // a place does.
    const clerkId = await verifiedClerkId(req);

    const events = await prisma.event.findMany({
      include: { registrations: { select: { userId: true } }, _count: { select: { registrations: true } } },
      orderBy: { date: 'asc' },
    });

    // The registrations array is destructured out rather than spread. It used
    // to go over the wire whole, so the list of everyone signed up for every
    // wellbeing session — each row carrying a Clerk id — reached any caller.
    ok(
      res,
      events.map(({ registrations, _count, ...event }) => ({
        ...event,
        participantCount: _count.registrations,
        isRegistered: clerkId ? registrations.some((r) => r.userId === clerkId) : false,
      })),
    );
  });
}
