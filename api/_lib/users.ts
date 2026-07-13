import { prisma } from './prisma';

export async function requireUser(clerkId: string) {
  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) throw new Error(`User not found for clerkId ${clerkId}`);
  return user;
}
