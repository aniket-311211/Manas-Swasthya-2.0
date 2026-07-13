import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const mentors = [
  { email: 'arjun.mentor@manasswasthya.app', password: 'demo-mentor-2026', name: 'Arjun Patel', avatar: '🧑🏽‍🎓', bio: 'Final-year psychology student who has been where you are. Ask me anything about exam anxiety.', specialization: 'Exam stress & anxiety', badge: 'Certified Peer Counselor', rating: 4.9, totalSessions: 132 },
  { email: 'priya.mentor@manasswasthya.app', password: 'demo-mentor-2026', name: 'Priya Sharma', avatar: '👩🏽‍💼', bio: 'Placement-season survivor. I help juniors handle rejection, interviews, and self-doubt.', specialization: 'Career pressure', badge: 'Trained Peer Mentor', rating: 4.8, totalSessions: 98 },
  { email: 'rahul.mentor@manasswasthya.app', password: 'demo-mentor-2026', name: 'Rahul Verma', avatar: '🧑🏽‍💻', bio: 'Hostel life, homesickness, and finding your people — that is my lane.', specialization: 'Homesickness & belonging', badge: 'Trained Peer Mentor', rating: 4.7, totalSessions: 74 },
  { email: 'sneha.mentor@manasswasthya.app', password: 'demo-mentor-2026', name: 'Sneha Iyer', avatar: '👩🏽‍🔬', bio: 'Listener first, advisor second. Relationships, family expectations, and boundaries.', specialization: 'Relationships & family', badge: 'Certified Peer Counselor', rating: 4.9, totalSessions: 156 },
];

const groups = [
  { name: 'Exam Warriors', description: 'Study pressure, backlogs, and burnout — vent and get strategies.', topic: 'Academic stress', tags: ['exams', 'stress', 'study'] },
  { name: 'Midnight Overthinkers', description: 'For the 2 AM thoughts that will not switch off.', topic: 'Anxiety & overthinking', tags: ['anxiety', 'sleep'] },
  { name: 'Hostel Homies', description: 'Homesickness, roommates, mess food, and making a hostel feel like home.', topic: 'Hostel life', tags: ['hostel', 'homesickness'] },
  { name: 'Placement Panic Room', description: 'Rejections, interviews, imposter syndrome — we have all been there.', topic: 'Career pressure', tags: ['placements', 'career'] },
  { name: 'Mindful Mornings', description: 'Daily meditation, gratitude, and gentle habit building.', topic: 'Mindfulness', tags: ['meditation', 'habits'] },
  { name: 'Creative Corner', description: 'Art, music, writing — express what words alone cannot.', topic: 'Creative expression', tags: ['art', 'music', 'writing'] },
];

const now = new Date();
const daysFromNow = (d, hour = 18) => {
  const dt = new Date(now);
  dt.setDate(dt.getDate() + d);
  dt.setHours(hour, 0, 0, 0);
  return dt;
};

const events = [
  { title: 'Group Meditation & Breathwork', description: 'A guided 45-minute session to reset before exam week. No experience needed.', category: 'Mindfulness', host: 'Sneha Iyer', image: '🧘🏽', date: daysFromNow(3), duration: '45 min', location: 'Online', maxParticipants: 60 },
  { title: 'Managing Placement Anxiety — AMA', description: 'Open Q&A with seniors who cracked placements after multiple rejections.', category: 'Career', host: 'Priya Sharma', image: '💼', date: daysFromNow(6, 19), duration: '1 hour', location: 'Online', maxParticipants: 100 },
  { title: 'Art for the Anxious Mind', description: 'Bring paper and colors. We draw what we feel — badly, and that is the point.', category: 'Art', host: 'Creative Corner', image: '🎨', date: daysFromNow(9, 17), duration: '90 min', location: 'Online', maxParticipants: 40 },
  { title: 'Sleep Hygiene Workshop', description: 'Evidence-based fixes for revenge bedtime procrastination.', category: 'Wellness', host: 'Arjun Patel', image: '😴', date: daysFromNow(12, 20), duration: '1 hour', location: 'Online', maxParticipants: 80 },
  { title: 'Open Mic: Stories of Getting Better', description: 'Students share what helped them through their lowest semester.', category: 'Community', host: 'ManasSwasthya Team', image: '🎤', date: daysFromNow(15, 18), duration: '2 hours', location: 'Online', maxParticipants: 120 },
];

for (const m of mentors) {
  await prisma.mentor.upsert({ where: { email: m.email }, update: { ...m }, create: m });
}
console.log(`mentors: ${mentors.length} upserted`);

for (const g of groups) {
  const existing = await prisma.chatRoom.findFirst({ where: { type: 'group', name: g.name } });
  if (!existing) {
    await prisma.chatRoom.create({ data: { type: 'group', status: 'active', ...g } });
  }
}
console.log(`groups: ensured ${groups.length}`);

for (const e of events) {
  const existing = await prisma.event.findFirst({ where: { title: e.title } });
  if (existing) {
    await prisma.event.update({ where: { id: existing.id }, data: { date: e.date } });
  } else {
    await prisma.event.create({ data: e });
  }
}
console.log(`events: ensured ${events.length}`);

await prisma.$disconnect();
console.log('Seed complete');
