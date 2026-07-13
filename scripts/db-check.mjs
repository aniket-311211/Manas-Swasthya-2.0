import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const models = ['user', 'assessment', 'moodEntry', 'journalEntry', 'chatRoom', 'mentor', 'event'];
for (const m of models) {
  const n = await prisma[m].count();
  console.log(`${m}: ${n}`);
}
await prisma.$disconnect();
console.log('DB check OK');
