import { z } from 'zod';

export const UserUpsert = z.object({
  clerkId: z.string().min(1),
  email: z.string().email(),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  university: z.string().optional().nullable(),
});
export type UserUpsertT = z.infer<typeof UserUpsert>;

export const AssessmentSave = z.object({
  clerkId: z.string().min(1),
  stress: z.number().int().min(0).max(100),
  anxiety: z.number().int().min(0).max(100),
  sleep: z.number().int().min(0).max(100),
  answers: z.unknown(),
  activities: z.unknown().default([]),
  games: z.unknown().default([]),
});
export type AssessmentSaveT = z.infer<typeof AssessmentSave>;

export const MoodSave = z.object({
  clerkId: z.string().min(1),
  mood: z.string().min(1).max(64),
  notes: z.string().max(2000).optional().nullable(),
  stress: z.number().int().min(1).max(10).optional().nullable(),
  anxiety: z.number().int().min(1).max(10).optional().nullable(),
  sleep: z.number().int().min(1).max(10).optional().nullable(),
});
export type MoodSaveT = z.infer<typeof MoodSave>;

export const JournalSave = z.object({
  clerkId: z.string().min(1),
  title: z.string().max(200).optional().nullable(),
  content: z.string().min(1).max(50000),
  mood: z.string().max(64).optional().nullable(),
  tags: z.array(z.string().max(40)).default([]),
});
export type JournalSaveT = z.infer<typeof JournalSave>;

export const JournalUpdate = JournalSave.partial().extend({
  id: z.string().min(1),
  clerkId: z.string().min(1),
});

export const MedicineSave = z.object({
  clerkId: z.string().min(1),
  analysis: z.object({
    name: z.string(),
    uses: z.array(z.string()).default([]),
    dosage: z.unknown(),
    sideEffects: z.array(z.string()).default([]),
    warnings: z.array(z.string()).default([]),
    safetyVerdict: z.string(),
    confidence: z.number().int().min(0).max(100),
    imageUrl: z.string().optional().nullable(),
    medicineName: z.string().optional().nullable(),
  }),
});
export type MedicineSaveT = z.infer<typeof MedicineSave>;

export const RoomCreate = z.object({
  type: z.enum(['group', 'mentor', 'private', 'ai_chat']),
  name: z.string().max(120).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  clerkId: z.string().optional().nullable(),
  mentorId: z.string().optional().nullable(),
  studentId: z.string().optional().nullable(),
  topic: z.string().max(120).optional().nullable(),
  tags: z.array(z.string().max(40)).default([]),
});
export type RoomCreateT = z.infer<typeof RoomCreate>;

export const ChatMessageSave = z.object({
  roomId: z.string().min(1),
  clerkId: z.string().optional().nullable(),
  content: z.string().min(1).max(8000),
  role: z.enum(['user', 'assistant', 'system']).default('user'),
  senderName: z.string().max(120).optional().nullable(),
});
export type ChatMessageSaveT = z.infer<typeof ChatMessageSave>;

export const GroupJoin = z.object({
  clerkId: z.string().min(1),
  groupId: z.string().min(1),
});

export const EventAction = z.object({
  action: z.enum(['register', 'unregister']),
  eventId: z.string().min(1),
  clerkId: z.string().min(1),
});

export const MentorAction = z.discriminatedUnion('action', [
  z.object({ action: z.literal('login'), email: z.string().email(), password: z.string().min(1) }),
  z.object({ action: z.literal('logout'), mentorId: z.string().min(1) }),
]);

const ChatTurn = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(8000),
});

export const AiChat = z.object({
  clerkId: z.string().min(1),
  messages: z.array(ChatTurn).min(1).max(40),
  language: z.string().max(20).optional(),
});
export type AiChatT = z.infer<typeof AiChat>;

export const AiAssessmentNext = z.object({
  clerkId: z.string().min(1),
  previousResponses: z
    .array(
      z.object({
        question: z.string(),
        answer: z.string(),
        domain: z.string(),
      }),
    )
    .default([]),
});
export type AiAssessmentNextT = z.infer<typeof AiAssessmentNext>;

export const AiMedicine = z
  .object({
    clerkId: z.string().min(1),
    medicineName: z.string().min(1).max(200).optional(),
    imageBase64: z.string().min(50).max(4_000_000).optional(),
  })
  .refine((v) => v.medicineName || v.imageBase64, {
    message: 'medicineName or imageBase64 required',
  });

export const AiAnalyze = z.object({
  clerkId: z.string().min(1),
  text: z.string().min(1).max(20000),
  kind: z.enum(['journal', 'mood', 'general']).default('general'),
});
