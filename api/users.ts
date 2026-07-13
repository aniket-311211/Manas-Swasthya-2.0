import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from './_lib/prisma';
import { ok, parseBody, methodGuard, withErrors } from './_lib/http';
import { UserUpsert } from './_lib/schemas';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!methodGuard(req, res, ['POST'])) return;
  const body = parseBody(req, res, UserUpsert);
  if (!body) return;
  await withErrors(res, async () => {
    const user = await prisma.user.upsert({
      where: { clerkId: body.clerkId },
      update: {
        email: body.email,
        firstName: body.firstName ?? undefined,
        lastName: body.lastName ?? undefined,
        university: body.university ?? undefined,
      },
      create: {
        clerkId: body.clerkId,
        email: body.email,
        firstName: body.firstName ?? null,
        lastName: body.lastName ?? null,
        university: body.university ?? null,
      },
    });
    ok(res, user);
  });
}
