import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../_lib/prisma';
import { ok, fail, parseBody, methodGuard, withErrors } from '../_lib/http';
import { GroupJoin } from '../_lib/schemas';
import { requireVerifiedUser } from '../_lib/clerkAuth';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!methodGuard(req, res, ['POST'])) return;
  const body = parseBody(req, res, GroupJoin);
  if (!body) return;
  await withErrors(res, async () => {
    // Was `requireUser(body.clerkId)`: anyone could add or eject anyone from
    // any circle by naming them.
    const user = await requireVerifiedUser(req, res);
    if (!user) return;

    // Scoped to real circles, so a crafted id cannot attach a participant to a
    // private mentor thread.
    const group = await prisma.chatRoom.findFirst({ where: { id: body.groupId, type: 'group' } });
    if (!group) {
      fail(res, 'Circle not found', 404);
      return;
    }
    // `leave` matters: without it, joining is one-way and someone who wants out
    // of a peer space has no way to get out.
    const leaving = body.action === 'leave';
    await prisma.chatRoom.update({
      where: { id: body.groupId },
      data: { participants: leaving ? { disconnect: { id: user.id } } : { connect: { id: user.id } } },
    });
    ok(res, { joined: !leaving });
  });
}
