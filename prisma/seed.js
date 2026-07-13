import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    // Create test mentor
    const mentor = await prisma.mentor.upsert({
        where: { email: 'mentor@nexus.com' },
        update: {},
        create: {
            email: 'mentor@nexus.com',
            password: 'mentor123', // In production, use bcrypt
            name: 'Arjun Patel',
            avatar: '👨‍🎓',
            bio: 'Final year psychology student with training in peer counseling. Here to listen and support.',
            specialization: 'Anxiety & Stress Management',
            badge: 'Certified Peer Counselor',
            status: 'online',
            totalSessions: 45,
            rating: 4.8
        }
    });

    console.log('Created mentor:', mentor.name);

    // Create default community groups
    const group1 = await prisma.chatRoom.upsert({
        where: { id: 'group-1' },
        update: {},
        create: {
            id: 'group-1',
            type: 'group',
            name: 'Managing Academic Stress',
            description: 'A safe space to discuss study-related anxiety and stress management techniques.',
            topic: 'Managing Academic Stress',
            tags: ['stress', 'academic', 'support'],
            maxParticipants: 15
        }
    });

    const group2 = await prisma.chatRoom.upsert({
        where: { id: 'group-2' },
        update: {},
        create: {
            id: 'group-2',
            type: 'group',
            name: 'Mindfulness & Meditation',
            description: 'Learn and practice mindfulness together in this supportive group environment.',
            topic: 'Mindfulness & Meditation',
            tags: ['mindfulness', 'meditation', 'wellness'],
            maxParticipants: 12
        }
    });

    const group3 = await prisma.chatRoom.upsert({
        where: { id: 'group-3' },
        update: {},
        create: {
            id: 'group-3',
            type: 'group',
            name: 'Anxiety Support Circle',
            description: 'Connect with others who understand anxiety and share coping strategies.',
            topic: 'Anxiety Support',
            tags: ['anxiety', 'support', 'mental-health'],
            maxParticipants: 10
        }
    });

    console.log('Created groups:', { group1, group2, group3 });
    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
