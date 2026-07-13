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

export interface MedicineAiResult {
  name: string;
  uses: string[];
  dosage: { adult: string; pediatric: string };
  sideEffects: string[];
  warnings: string[];
  safetyVerdict: string;
  confidence: number;
}

export interface AnalyzeResult {
  sentiment: 'positive' | 'neutral' | 'mixed' | 'negative';
  themes: string[];
  gentleSuggestion: string;
}
