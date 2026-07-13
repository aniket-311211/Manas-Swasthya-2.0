import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../_lib/prisma';
import { ok, parseBody, methodGuard, withErrors } from '../_lib/http';
import { GroupJoin } from '../_lib/schemas';
import { requireUser } from '../_lib/users';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!methodGuard(req, res, ['POST'])) return;
  const body = parseBody(req, res, GroupJoin);
  if (!body) return;
  await withErrors(res, async () => {
    const user = await requireUser(body.clerkId);
    await prisma.chatRoom.update({
      where: { id: body.groupId },
      data: { participants: { connect: { id: user.id } } },
    });
    ok(res, { joined: true });
  });
}
