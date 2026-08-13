import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

/**
 * Seeds test mentor accounts with bcrypt-hashed passwords, and repairs any row
 * still holding a plaintext password from the old login.
 *
 * Passwords are read from the environment so they never enter the repository:
 *   MENTOR_SEED_PASSWORD=... node scripts/seed-mentors.mjs
 * Falls back to a generated password which it prints once, so a seeded account
 * is never left with a guessable default.
 */

// Same driver adapter the API uses; this client needs one too.
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const MENTORS = [
  {
    email: 'asha.iyer@manasswasthya.app',
    name: 'Asha Iyer',
    specialization: 'Exam stress and academic pressure',
    badge: 'Certified Peer Counsellor',
    bio: 'Supports undergraduates through placement season and backlog anxiety.',
  },
  {
    email: 'vikram.rao@manasswasthya.app',
    name: 'Vikram Rao',
    specialization: 'Sleep, routine and burnout',
    badge: 'Clinical Psychologist',
    bio: 'Works with students on rebuilding a sustainable daily rhythm.',
  },
  {
    email: 'neha.bansal@manasswasthya.app',
    name: 'Neha Bansal',
    specialization: 'Anxiety and social confidence',
    badge: 'Counselling Psychologist',
    bio: 'Helps students who find hostel and campus life overwhelming.',
  },
  {
    email: 'imran.qureshi@manasswasthya.app',
    name: 'Imran Qureshi',
    specialization: 'Family expectations and identity',
    badge: 'Peer Support Lead',
    bio: 'Talks through the pull between what you want and what is expected.',
  },
  {
    email: 'meera.nair@manasswasthya.app',
    name: 'Meera Nair',
    specialization: 'Low mood, grief and loss',
    badge: 'Counselling Psychologist',
    bio: 'Sits with students through bereavement and the flat stretches after it.',
  },
];

/** Must match LOCKED_PASSWORD in api/_lib/mentorAuth.ts. */
const LOCKED = 'locked:no-login';

const generated = () => Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6).toUpperCase();

async function main() {
  const password = process.env.MENTOR_SEED_PASSWORD || generated();
  const fromEnv = Boolean(process.env.MENTOR_SEED_PASSWORD);
  const hash = await bcrypt.hash(password, 10);

  for (const m of MENTORS) {
    await prisma.mentor.upsert({
      where: { email: m.email },
      update: { password: hash, name: m.name, specialization: m.specialization, badge: m.badge, bio: m.bio },
      create: { ...m, password: hash, status: 'offline' },
    });
  }

  // Anything not bcrypt-shaped is a leftover plaintext password. Those accounts
  // are locked rather than left usable: an unusable hash can never verify.
  const all = await prisma.mentor.findMany({ select: { id: true, email: true, password: true } });
  let locked = 0;
  for (const m of all) {
    if (!m.password.startsWith('$2')) {
      await prisma.mentor.update({ where: { id: m.id }, data: { password: LOCKED } });
      locked += 1;
      console.log(`Locked legacy plaintext account: ${m.email}`);
    }
  }

  // Anything outside this list is a leftover from an earlier seed. Retiring it
  // was not enough: the row stayed in the directory under the same name as its
  // replacement, so the list read as duplicate people. These go for good.
  //
  // Except when somebody actually wrote in the conversation. A mentor thread
  // with messages in it is someone's history, and no seed script gets to bin
  // that — those accounts are retired instead and named in the output.
  const keep = MENTORS.map((m) => m.email);
  const strays = await prisma.mentor.findMany({
    where: { email: { notIn: keep } },
    select: { id: true, name: true, email: true },
  });

  let deleted = 0;
  const spared = [];
  for (const stray of strays) {
    // ChatRoom.mentorId is a plain column with no foreign key, so deleting the
    // mentor would leave rooms pointing at nothing. Clear them first.
    const rooms = await prisma.chatRoom.findMany({
      where: { type: 'mentor', mentorId: stray.id },
      select: { id: true },
    });
    const roomIds = rooms.map((r) => r.id);
    const written = roomIds.length
      ? await prisma.chatMessage.count({ where: { roomId: { in: roomIds } } })
      : 0;

    if (written > 0) {
      await prisma.mentor.update({ where: { id: stray.id }, data: { password: LOCKED, status: 'offline' } });
      spared.push(`${stray.name} <${stray.email}> — ${written} message(s) kept`);
      continue;
    }

    await prisma.chatRoom.deleteMany({ where: { id: { in: roomIds } } });
    await prisma.mentor.delete({ where: { id: stray.id } });
    deleted += 1;
  }

  console.log(`\nSeeded ${MENTORS.length} mentors. Locked ${locked} legacy, deleted ${deleted} empty leftover(s).`);
  if (spared.length) {
    console.log('Retired rather than deleted, because they hold real conversations:');
    for (const line of spared) console.log(`  ${line}`);
  }
  console.log('Emails:');
  for (const m of MENTORS) console.log(`  ${m.email}`);
  if (!fromEnv) {
    console.log(`\nGenerated password (shown once, not stored anywhere): ${password}`);
    console.log('Re-run with MENTOR_SEED_PASSWORD=... to choose your own.');
  } else {
    console.log('\nPassword taken from MENTOR_SEED_PASSWORD.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
