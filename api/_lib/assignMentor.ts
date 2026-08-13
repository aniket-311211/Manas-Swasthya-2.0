import { prisma } from './prisma';
import { LOCKED_PASSWORD } from './mentorAuth';

/**
 * Every student gets one mentor from the moment they sign up, so nobody lands
 * on an empty "find someone" screen at the point they most need a person.
 *
 * Chosen by lightest current load, tie-broken by rating, so new students spread
 * across mentors instead of piling onto whoever sorts first.
 *
 * Idempotent: an existing open thread is returned untouched, so calling this on
 * every login is safe and never creates duplicates.
 */
export async function ensureAssignedMentor(userId: string): Promise<string | null> {
  const existing = await prisma.chatRoom.findFirst({
    where: { type: 'mentor', studentId: userId, status: { not: 'closed' } },
    orderBy: { createdAt: 'asc' },
  });
  if (existing) return existing.id;

  const mentors = await prisma.mentor.findMany({
    where: { password: { not: LOCKED_PASSWORD } },
    select: { id: true, name: true, rating: true },
  });
  if (mentors.length === 0) return null;

  const loads = await prisma.chatRoom.groupBy({
    by: ['mentorId'],
    where: { type: 'mentor', status: { not: 'closed' } },
    _count: { _all: true },
  });
  const loadById = new Map(loads.map((l) => [l.mentorId, l._count._all]));

  const pick = [...mentors].sort((a, b) => {
    const la = loadById.get(a.id) ?? 0;
    const lb = loadById.get(b.id) ?? 0;
    if (la !== lb) return la - lb;
    if (b.rating !== a.rating) return b.rating - a.rating;
    return a.id.localeCompare(b.id);
  })[0];

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const studentName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || 'a student';

  try {
    const room = await prisma.chatRoom.create({
      data: {
        type: 'mentor',
        name: `${pick.name} and ${studentName}`,
        mentorId: pick.id,
        studentId: userId,
        status: 'active',
        tags: ['auto-assigned'],
      },
    });
    return room.id;
  } catch {
    // A concurrent call won the race and the unique index rejected this one.
    // That is the correct outcome: return the thread that exists.
    const won = await prisma.chatRoom.findFirst({
      where: { type: 'mentor', studentId: userId, status: { not: 'closed' } },
      orderBy: { createdAt: 'asc' },
    });
    return won?.id ?? null;
  }
}
