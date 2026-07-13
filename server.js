import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});


// Gemini Setup
import { GoogleGenerativeAI } from '@google/generative-ai';
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// --- API Routes ---

// 1. User Management
app.post('/api/users', async (req, res) => {
  try {
    const { clerkId, email, firstName, lastName, imageUrl } = req.body;
    const user = await prisma.user.upsert({
      where: { clerkId },
      update: { email, firstName, lastName },
      create: { clerkId, email, firstName, lastName }
    });
    res.json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// 2. Assessments
app.post('/api/assessments', async (req, res) => {
  try {
    const { userId, stress, anxiety, sleep, answers, activities, games } = req.body;

    // Find user by Clerk ID first
    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const assessment = await prisma.assessment.create({
      data: {
        userId: user.id,
        stress,
        anxiety,
        sleep,
        answers,
        activities,
        games
      }
    });
    res.json(assessment);
  } catch (error) {
    console.error('Error saving assessment:', error);
    res.status(500).json({ error: 'Failed to save assessment' });
  }
});

app.get('/api/assessments/user/:clerkId', async (req, res) => {
  try {
    const { clerkId } = req.params;
    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const assessments = await prisma.assessment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(assessments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assessments' });
  }
});

// 3. Mood Tracking
app.post('/api/mood', async (req, res) => {
  try {
    const { userId, mood, notes, stress, anxiety, sleep } = req.body;
    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const moodEntry = await prisma.moodEntry.create({
      data: {
        userId: user.id,
        mood,
        notes,
        stress,
        anxiety,
        sleep
      }
    });
    res.json(moodEntry);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save mood' });
  }
});

app.get('/api/mood/user/:clerkId', async (req, res) => {
  try {
    const { clerkId } = req.params;
    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const entries = await prisma.moodEntry.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch mood history' });
  }
});

// 4. Chat System
// Create or Get Chat Room (Direct)
app.post('/api/chat/room', async (req, res) => {
  try {
    const { type, participants } = req.body; // participants = [userId1, userId2]

    // Check if room already exists for these participants (for private chat)
    if (type === 'private' && participants.length === 2) {
      const existingRoom = await prisma.chatRoom.findFirst({
        where: {
          type: 'private',
          participants: {
            every: { id: { in: participants } }
          }
        },
        include: { participants: true, messages: true }
      });

      if (existingRoom) return res.json(existingRoom);
    }

    const room = await prisma.chatRoom.create({
      data: {
        type,
        participants: {
          connect: participants.map(id => ({ id }))
        }
      },
      include: { participants: true }
    });
    res.json(room);
  } catch (error) {
    console.error('Error creating chat room:', error);
    res.status(500).json({ error: 'Failed to create chat room' });
  }
});

// Get User's Chat Rooms
app.get('/api/chat/rooms/:clerkId', async (req, res) => {
  try {
    const { clerkId } = req.params;
    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const rooms = await prisma.chatRoom.findMany({
      where: {
        participants: {
          some: { id: user.id }
        }
      },
      include: {
        participants: true,
        messages: {
          orderBy: { timestamp: 'desc' },
          take: 1
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch chat rooms' });
  }
});

// Get Messages for a Room
app.get('/api/chat/room/:roomId/messages', async (req, res) => {
  try {
    const { roomId } = req.params;
    const messages = await prisma.chatMessage.findMany({
      where: { roomId },
      include: { user: true },
      orderBy: { timestamp: 'asc' }
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Save Message
app.post('/api/chat/message', async (req, res) => {
  try {
    const { roomId, userId, content, role } = req.body; // userId is ClerkId
    const user = await prisma.user.findUnique({ where: { clerkId: userId } });

    // Handle system messages or bot messages where user might not exist in same way
    // For now assume valid user or system

    if (!user && role !== 'assistant' && role !== 'system') {
      return res.status(404).json({ error: 'User not found' });
    }

    const message = await prisma.chatMessage.create({
      data: {
        roomId,
        userId: user ? user.id : undefined, // Handle system/bot if needed, currently schema requires userId. 
        // Ideally bot should be a user or schema updated.
        // For this implementation, we assume we have a 'bot' user or similar.
        // FIX: Schema checks for User relation. 
        // If role is assistant, we might need a placeholder AI user for now or relaxing schema.
        // Let's assume for now we use the user's ID for their own messages.
        // For AI responses, usually we just send them back. 
        // But for persistence, we need an ID.
        // Let's rely on finding the user by ID.
        content,
        role: role || 'user'
      },
      include: { user: true }
    });

    // Update room last activity
    await prisma.chatRoom.update({
      where: { id: roomId },
      data: { updatedAt: new Date() }
    });

    res.json(message);
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ error: 'Failed to save message' });
  }
});

// 5. Medicine AI
app.post('/api/medicine/save', async (req, res) => {
  try {
    const { userId, analysis } = req.body;
    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const savedAnalysis = await prisma.medicineAnalysis.create({
      data: {
        userId: user.id,
        name: analysis.name,
        uses: analysis.uses,
        dosage: analysis.dosage,
        sideEffects: analysis.sideEffects,
        warnings: analysis.warnings,
        safetyVerdict: analysis.safetyVerdict,
        confidence: analysis.confidence,
        imageUrl: analysis.imageUrl,
        medicineName: analysis.medicineName
      }
    });
    res.json(savedAnalysis);
  } catch (error) {
    console.error('Error saving medicine analysis:', error);
    res.status(500).json({ error: 'Failed to save analysis' });
  }
});

app.get('/api/medicine/history/:clerkId', async (req, res) => {
  try {
    const { clerkId } = req.params;
    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const history = await prisma.medicineAnalysis.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch medicine history' });
  }
});

// 6. Community Groups
app.get('/api/community/groups', async (req, res) => {
  try {
    // For now, return all groups. Real app might filter by university or interests.
    const groups = await prisma.chatRoom.findMany({
      where: { type: 'group' },
      include: { _count: { select: { participants: true } } }
    });
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch community groups' });
  }
});

app.post('/api/community/join', async (req, res) => {
  try {
    const { userId, groupId } = req.body;
    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    await prisma.chatRoom.update({
      where: { id: groupId },
      data: {
        participants: {
          connect: { id: user.id }
        }
      }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to join group' });
  }
});

app.post('/api/analyze', async (req, res) => {
  try {
    const { prompt } = req.body;
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    res.json({ result: text });
  } catch (error) {
    console.error('AI Error:', error);
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

// ============= COMMUNITY API =============

// --- Mentor Authentication ---
app.post('/api/mentors/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const mentor = await prisma.mentor.findUnique({ where: { email } });
    if (!mentor) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Simple password check (in production, use bcrypt)
    if (mentor.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update status to online
    await prisma.mentor.update({
      where: { id: mentor.id },
      data: { status: 'online' }
    });

    // Don't send password back
    const { password: _, ...mentorData } = mentor;
    res.json({ mentor: mentorData });
  } catch (error) {
    console.error('Mentor login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/mentors/logout', async (req, res) => {
  try {
    const { mentorId } = req.body;
    await prisma.mentor.update({
      where: { id: mentorId },
      data: { status: 'offline' }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Mentor logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

app.get('/api/mentors', async (req, res) => {
  try {
    const mentors = await prisma.mentor.findMany({
      select: {
        id: true,
        name: true,
        avatar: true,
        bio: true,
        specialization: true,
        badge: true,
        status: true,
        totalSessions: true,
        rating: true
      }
    });
    res.json(mentors);
  } catch (error) {
    console.error('Error fetching mentors:', error);
    res.status(500).json({ error: 'Failed to fetch mentors' });
  }
});

// --- Chat Rooms ---
app.get('/api/chat/rooms', async (req, res) => {
  try {
    const { userId, type } = req.query;

    const where = {};
    if (type) where.type = type;

    const rooms = await prisma.chatRoom.findMany({
      where,
      include: {
        messages: {
          orderBy: { timestamp: 'desc' },
          take: 1
        },
        participants: {
          select: { id: true, clerkId: true, firstName: true, lastName: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json(rooms);
  } catch (error) {
    console.error('Error fetching chat rooms:', error);
    res.status(500).json({ error: 'Failed to fetch chat rooms' });
  }
});

app.post('/api/chat/rooms', async (req, res) => {
  try {
    const { type, name, description, mentorId, studentId, topic, tags } = req.body;

    const room = await prisma.chatRoom.create({
      data: {
        type,
        name,
        description,
        mentorId,
        studentId,
        topic,
        tags: tags || [],
        status: 'active'
      }
    });

    res.json(room);
  } catch (error) {
    console.error('Error creating chat room:', error);
    res.status(500).json({ error: 'Failed to create chat room' });
  }
});

app.get('/api/chat/rooms/:roomId/messages', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { limit = 50, before } = req.query;

    const where = { roomId };
    if (before) {
      where.timestamp = { lt: new Date(before) };
    }

    const messages = await prisma.chatMessage.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit),
      include: {
        user: {
          select: { id: true, clerkId: true, firstName: true, lastName: true }
        }
      }
    });

    res.json(messages.reverse());
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.post('/api/chat/rooms/:roomId/messages', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { clerkId, content, role, senderName, senderAvatar } = req.body;

    // Find user by clerkId, or use/create a 'system' user for mentor/system messages
    let userId = null;
    if (clerkId) {
      const user = await prisma.user.findUnique({ where: { clerkId } });
      if (user) userId = user.id;
    }

    // For mentor messages without a Clerk account, ensure a fallback system user exists
    if (!userId) {
      const systemUser = await prisma.user.upsert({
        where: { clerkId: 'system' },
        update: {},
        create: {
          clerkId: 'system',
          email: 'system@manasswasthya.app',
          firstName: senderName || 'System',
          lastName: ''
        }
      });
      userId = systemUser.id;
    }

    const message = await prisma.chatMessage.create({
      data: {
        roomId,
        userId,
        content,
        role: role || 'user'
      }
    });

    // Update room's last activity
    await prisma.chatRoom.update({
      where: { id: roomId },
      data: { updatedAt: new Date() }
    });

    res.json({
      ...message,
      senderName: senderName || 'Unknown',
      senderAvatar: senderAvatar || '👤'
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// --- Discussion Groups ---
app.get('/api/community/groups', async (req, res) => {
  try {
    const groups = await prisma.chatRoom.findMany({
      where: { type: 'group' },
      include: {
        messages: {
          orderBy: { timestamp: 'desc' },
          take: 1
        },
        participants: true
      }
    });

    res.json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

app.post('/api/community/groups/:groupId/join', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { clerkId } = req.body;

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await prisma.chatRoom.update({
      where: { id: groupId },
      data: {
        participants: {
          connect: { id: user.id }
        }
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error joining group:', error);
    res.status(500).json({ error: 'Failed to join group' });
  }
});

// --- Events ---
app.get('/api/events', async (req, res) => {
  try {
    const { userId } = req.query;

    const events = await prisma.event.findMany({
      include: {
        registrations: true,
        _count: {
          select: { registrations: true }
        }
      },
      orderBy: { date: 'asc' }
    });

    // Add registration info for user
    const eventsWithStatus = events.map(event => ({
      ...event,
      participantCount: event._count.registrations,
      isRegistered: userId ? event.registrations.some(r => r.userId === userId) : false
    }));

    res.json(eventsWithStatus);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

app.post('/api/events/:eventId/register', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { clerkId } = req.body;

    // Check event capacity
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { _count: { select: { registrations: true } } }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event._count.registrations >= event.maxParticipants) {
      return res.status(400).json({ error: 'Event is full' });
    }

    const registration = await prisma.eventRegistration.upsert({
      where: {
        userId_eventId: { userId: clerkId, eventId }
      },
      update: { status: 'registered' },
      create: {
        userId: clerkId,
        eventId,
        status: 'registered'
      }
    });

    res.json(registration);
  } catch (error) {
    console.error('Error registering for event:', error);
    res.status(500).json({ error: 'Failed to register for event' });
  }
});

app.delete('/api/events/:eventId/register', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { clerkId } = req.body;

    await prisma.eventRegistration.delete({
      where: {
        userId_eventId: { userId: clerkId, eventId }
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error unregistering from event:', error);
    res.status(500).json({ error: 'Failed to unregister from event' });
  }
});

// Start Server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
});

// Graceful Shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await prisma.$disconnect();
  server.close(() => {
    console.log('HTTP server closed');
  });
});
