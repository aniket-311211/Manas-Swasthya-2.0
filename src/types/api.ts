export interface User {
  id: string;
  clerkId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  university: string | null;
  createdAt: string;
}

export interface Assessment {
  id: string;
  userId: string;
  stress: number;
  anxiety: number;
  sleep: number;
  answers: unknown;
  activities: unknown;
  games: unknown;
  createdAt: string;
}

export interface AssessmentAnswersPayload {
  responses: { question: string; answer: string; domain: string }[];
  domainScores: Record<string, number>;
  riskLevel: 'low' | 'moderate' | 'high';
  summary: string;
  recommendations: string[];
}

export interface MoodEntry {
  id: string;
  userId: string;
  mood: string;
  notes: string | null;
  stress: number | null;
  anxiety: number | null;
  sleep: number | null;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string | null;
  content: string;
  mood: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MedicineAnalysis {
  id: string;
  name: string;
  uses: string[];
  dosage: { adult: string; pediatric: string };
  sideEffects: string[];
  warnings: string[];
  safetyVerdict: string;
  confidence: number;
  imageUrl: string | null;
  medicineName: string | null;
  createdAt: string;
}

export interface ChatParticipant {
  id: string;
  clerkId: string;
  firstName: string | null;
  lastName: string | null;
}

export interface ChatMessage {
  id: string;
  roomId: string | null;
  userId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  user?: ChatParticipant;
}

export interface ChatRoom {
  id: string;
  type: 'group' | 'mentor' | 'private' | 'ai_chat';
  name: string | null;
  description: string | null;
  topic: string | null;
  tags: string[];
  status: string | null;
  mentorId: string | null;
  studentId: string | null;
  createdAt: string;
  updatedAt: string;
  participants?: ChatParticipant[];
  messages?: ChatMessage[];
  memberCount?: number;
  joined?: boolean;
}

export interface Mentor {
  id: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  specialization: string | null;
  badge: string | null;
  status: 'online' | 'offline' | 'away';
  totalSessions: number;
  rating: number;
}

export interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  category: string;
  host: string;
  image: string | null;
  date: string;
  duration: string;
  location: string;
  maxParticipants: number;
  participantCount: number;
  isRegistered: boolean;
}

export interface AiChatResult {
  reply: string;
  crisis: boolean;
}

export interface NextQuestionResult {
  question: string;
  options: string[];
  domain: 'academic' | 'social' | 'emotional' | 'behavioral' | 'cognitive' | 'physical';
  isComplete: boolean;
  scores?: {
    stress: number;
    anxiety: number;
    sleep: number;
    domainScores: Record<string, number>;
    riskLevel: 'low' | 'moderate' | 'high';
    summary: string;
    recommendations: string[];
  };
}

/**
 * Mirrors MedicineAnalysisSchema in api/_lib/medicine.ts. The server validates
 * against that schema before anything reaches here, so these fields are the
 * ones that survived validation rather than the ones a model happened to send.
 */
export interface MedicineAiResult {
  identified: boolean;
  name: string;
  genericName: string | null;
  brandNames: string[];
  activeIngredients: { name: string; strength: string | null }[];
  form: string | null;
  prescriptionOnly: boolean | null;
  scheduleNote: string | null;

  whatItTreats: string[];
  howToTake: {
    adult: string;
    pediatric: string;
    withFood: string | null;
    timing: string | null;
    courseLength: string | null;
  };
  missedDose: string | null;
  storage: string | null;

  commonSideEffects: string[];
  seriousSideEffects: string[];
  doNotTakeIf: string[];
  interactions: string[];
  mentalHealthNote: string | null;
  seeADoctorIf: string[];

  safetyVerdict: string;
  confidence: number;
  confidenceReason: string | null;
}

/** How many checks are left today. */
export interface MedicineAllowance {
  allowed: boolean;
  remaining: number;
  limit: number;
  /** ISO instant of the next refill — midnight India time. */
  resetsAt: string;
}

/**
 * `analysis` is null when the model was not sure enough to claim an
 * identification; `reason` says why. A null analysis still costs a check,
 * because the model was still asked.
 */
export interface MedicineAnalysisResponse {
  analysis: MedicineAiResult | null;
  id?: string | null;
  allowance: MedicineAllowance;
  reason?: string;
  dosingWithheld?: boolean;
}

export interface AnalyzeResult {
  sentiment: 'positive' | 'neutral' | 'mixed' | 'negative';
  themes: string[];
  gentleSuggestion: string;
}

export interface Booking {
  id: string;
  userId: string;
  mentorId: string;
  mentorName: string;
  mode: 'video' | 'audio' | 'chat' | 'in_person';
  scheduledAt: string;
  durationMin: number;
  status: 'scheduled' | 'completed' | 'cancelled';
  note: string | null;
  feePaise: number;
  feeWaived: boolean;
  waiverReason: 'coupon' | 'student' | null;
  couponCode: string | null;
  registrationNo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityMessage {
  id: string;
  roomId: string | null;
  content: string;
  timestamp: string;
  isMentor: boolean;
  authorName: string;
  badge: string | null;
}

export interface MentorIdentity {
  id: string;
  name: string;
  email: string;
  specialization: string | null;
  badge: string | null;
}

export interface MentorSession {
  token: string;
  expiresAt: string;
  mentor: MentorIdentity;
}

export interface MentorThread {
  id: string;
  status: string;
  updatedAt: string;
  lastMessage: string | null;
  lastAt: string;
  mentor: { id: string; name: string; badge: string | null; specialization: string | null } | null;
  student: { id: string; name: string } | null;
}

export interface ThreadMessage {
  id: string;
  content: string;
  timestamp: string;
  isMentor: boolean;
  authorName: string;
  badge: string | null;
}
