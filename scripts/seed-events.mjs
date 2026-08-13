import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

/**
 * Puts the activity board back in the future.
 *
 * Every seeded event was dated July 2026 and had quietly slid into the past, so
 * the board rendered five cards all saying "This one has finished" and nothing
 * could be joined. The join flow was never broken — there was simply nothing
 * left to join.
 *
 * Dates here are offsets from the moment the script runs, not fixed timestamps,
 * so re-running it always produces a board with one session live, several
 * upcoming and one already over. It will drift into the past again; re-run it:
 *
 *   node scripts/seed-events.mjs
 *
 * Matched on title, so re-running moves the existing rows rather than piling up
 * duplicates — and registrations, which hang off the event id, survive.
 */

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const HOUR = 3_600_000;

/**
 * `startsInHours` is relative to now. `duration` is the free text the card
 * parses to decide whether something is live, so it has to stay machine-legible
 * ("2 hours", "90 min") — a duration the parser cannot read shows no badge.
 */
const EVENTS = [
  {
    title: 'Group Meditation & Breathwork',
    description:
      'Twenty minutes of guided breathing, then quiet company. Cameras off, nobody has to speak, and you can leave whenever you like.',
    category: 'Mindfulness',
    host: 'Asha Iyer',
    image: '🧘',
    startsInHours: -0.5,
    duration: '2 hours',
    location: 'Online',
    maxParticipants: 60,
  },
  {
    title: 'Managing Placement Anxiety — AMA',
    description:
      'An open hour on interviews, rejections and the pressure of watching a batchmate get placed first. Ask anything, anonymously if you prefer.',
    category: 'Career',
    host: 'Vikram Rao',
    image: '💼',
    startsInHours: 30,
    duration: '90 min',
    location: 'Online',
    maxParticipants: 100,
  },
  {
    title: 'Art for the Anxious Mind',
    description:
      'Making something with your hands when your head will not slow down. No skill needed and nothing gets shown to anyone.',
    category: 'Art',
    host: 'Neha Bansal',
    image: '🎨',
    startsInHours: 74,
    duration: '2 hours',
    location: 'Studio 2, Student Centre',
    maxParticipants: 40,
  },
  {
    title: 'Sleep Hygiene Workshop',
    description:
      'Why 3am scrolling wins every night, and what actually helps. Practical, unpreachy, and built around hostel timetables.',
    category: 'Wellness',
    host: 'Meera Nair',
    image: '🌙',
    startsInHours: 122,
    duration: '75 min',
    location: 'Online',
    maxParticipants: 80,
  },
  {
    title: 'Open Mic: Stories of Getting Better',
    description:
      'Students read five minutes of whatever they want about a hard year. Listening is a full and welcome way to take part.',
    category: 'Community',
    host: 'Imran Qureshi',
    image: '🎤',
    startsInHours: 194,
    duration: '2 hours',
    location: 'Amphitheatre',
    maxParticipants: 120,
  },
  {
    title: 'Exam Season Study Hall',
    description:
      'A quiet shared room with fifty-minute timers and a break every hour. Turn up, work alongside people, leave when you are done.',
    category: 'Study',
    host: 'Asha Iyer',
    image: '📚',
    startsInHours: 8,
    duration: '3 hours',
    location: 'Online',
    maxParticipants: 50,
  },
  {
    title: 'Sunday Reset Walk',
    description:
      'Forty minutes around the lake at an easy pace. Conversation optional — plenty of people come to walk in silence.',
    category: 'Movement',
    host: 'Vikram Rao',
    image: '🚶',
    startsInHours: 50,
    duration: '45 min',
    location: 'Main gate, meet by the notice board',
    maxParticipants: 30,
  },
];

async function main() {
  const now = Date.now();
  let created = 0;
  let moved = 0;

  for (const e of EVENTS) {
    const { startsInHours, ...rest } = e;
    const date = new Date(now + startsInHours * HOUR);
    // Round to the half hour so the board does not read "7:43 pm".
    date.setMinutes(date.getMinutes() < 30 ? 0 : 30, 0, 0);

    const existing = await prisma.event.findFirst({ where: { title: e.title }, select: { id: true } });
    if (existing) {
      await prisma.event.update({ where: { id: existing.id }, data: { ...rest, date } });
      moved += 1;
    } else {
      await prisma.event.create({ data: { ...rest, date } });
      created += 1;
    }
  }

  const all = await prisma.event.findMany({
    orderBy: { date: 'asc' },
    include: { _count: { select: { registrations: true } } },
  });
  console.log(`\n${created} created, ${moved} rescheduled. Board now reads:\n`);
  for (const ev of all) {
    const when = ev.date.getTime();
    const state = when > now ? 'upcoming' : 'live/past';
    console.log(
      `  ${state.padEnd(10)} ${ev.date.toISOString()}  ${String(ev._count.registrations).padStart(3)}/${ev.maxParticipants}  ${ev.title}`,
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
