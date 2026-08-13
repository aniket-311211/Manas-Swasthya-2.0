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
  /** Local calendar day for a new entry; omitted means today. */
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
export type JournalSaveT = z.infer<typeof JournalSave>;

export const JournalUpdate = JournalSave.partial().extend({
  id: z.string().min(1),
  clerkId: z.string().min(1),
});

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
  action: z.enum(['join', 'leave']).default('join'),
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
  /**
   * What the dashboard already knows about today, so Manas can open with
   * something specific instead of a generic prompt. Caller-supplied and
   * length-capped; never trusted as instructions.
   */
  context: z
    .object({
      mood: z.string().max(40).optional(),
      intention: z.string().max(200).optional(),
      streak: z.number().int().min(0).max(3650).optional(),
    })
    .optional(),
});
export type AiChatT = z.infer<typeof AiChat>;

export const AiAssessmentNext = z.object({
  clerkId: z.string().min(1),
  /**
   * Which job the endpoint is doing. Defaults to 'next' — the original
   * one-question-at-a-time generator — so every existing caller keeps working
   * with no change. The fixed item bank uses 'followups' and 'summary'; it
   * never asks the model for a question set or for scores.
   */
  mode: z.enum(['next', 'followups', 'summary']).default('next'),
  previousResponses: z
    .array(
      z.object({
        question: z.string(),
        answer: z.string(),
        domain: z.string(),
        /** Wellbeing value of the chosen option, 0–1. Sent by the item bank so the server can aim follow-ups at the weakest domains. */
        weight: z.number().min(0).max(1).optional(),
      }),
    )
    .default([]),
  /**
   * Deterministic scores computed on the client. Read only for mode:'summary',
   * and only so the written summary matches the numbers on screen. The model is
   * never asked to produce scores.
   */
  scores: z
    .object({
      stress: z.number().min(0).max(100),
      anxiety: z.number().min(0).max(100),
      sleep: z.number().min(0).max(100),
      overall: z.number().min(0).max(100),
      riskLevel: z.enum(['low', 'moderate', 'high']),
      domainScores: z.record(z.string(), z.number()).default({}),
    })
    .optional(),
});
export type AiAssessmentNextT = z.infer<typeof AiAssessmentNext>;

/**
 * No `clerkId`. Identity comes from the verified Clerk session token in the
 * Authorization header — a field in the body is a claim, not a proof, and this
 * endpoint spends money.
 */
export const AiMedicine = z
  .object({
    medicineName: z.string().trim().min(1).max(200).optional(),
    imageBase64: z.string().min(50).max(8_400_000).optional(),
  })
  .refine((v) => v.medicineName || v.imageBase64, {
    message: 'medicineName or imageBase64 required',
  });

export const AiAnalyze = z.object({
  clerkId: z.string().min(1),
  text: z.string().min(1).max(20000),
  kind: z.enum(['journal', 'mood', 'general']).default('general'),
  /**
   * Which response shape the caller wants. Defaults to 'sentiment' — the
   * original {sentiment, themes, gentleSuggestion} — so every existing caller
   * keeps working untouched. The rich journal editor asks for 'mood', which
   * returns the MoodAnalysis shape from src/features/journal/types.ts.
   * `kind` cannot carry this: 'journal' already means the old shape.
   */
  shape: z.enum(['sentiment', 'mood']).default('sentiment'),
});

export const BookingCreate = z.object({
  clerkId: z.string().min(1),
  mentorId: z.string().min(1),
  mentorName: z.string().min(1).max(120),
  mode: z.enum(['video', 'audio', 'chat', 'in_person']).optional(),
  scheduledAt: z.string().min(1),
  durationMin: z.number().int().min(15).max(180).optional(),
  note: z.string().max(2000).optional().nullable(),
  // The client may ASK for a waiver; only the server grants one. Note there is
  // deliberately no fee field here — a client-supplied price is not a price.
  couponCode: z.string().max(32).optional().nullable(),
  registrationNo: z.string().max(32).optional().nullable(),
});

export const BookingUpdate = z.object({
  id: z.string().min(1),
  clerkId: z.string().min(1),
  status: z.enum(['scheduled', 'completed', 'cancelled']).optional(),
  scheduledAt: z.string().optional(),
  note: z.string().max(2000).optional().nullable(),
});

export const MentorAuth = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('login'),
    email: z.string().email().max(200),
    password: z.string().min(1).max(200),
  }),
  z.object({ action: z.literal('logout') }),
]);

export const CommunityMessage = z.object({
  roomId: z.string().min(1),
  content: z.string().min(1).max(2000),
  // Optional: a mentor authenticates with a bearer token instead. Whichever
  // arrives, the server resolves the author — the client never declares it.
  clerkId: z.string().min(1).optional(),
});

export const ThreadCreate = z.object({
  clerkId: z.string().min(1),
  mentorId: z.string().min(1),
});

export const ThreadMessage = z.object({
  roomId: z.string().min(1),
  content: z.string().min(1).max(4000),
  // A mentor authenticates with a bearer token instead; the server resolves
  // which side of the thread the caller is on and never takes their word.
  clerkId: z.string().min(1).optional(),
});

export const MentorSignup = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(200),
  password: z.string().min(1).max(200),
  specialization: z.string().max(200).optional(),
  inviteCode: z.string().min(1).max(64),
});
