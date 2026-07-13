import type {
  User,
  Assessment,
  MoodEntry,
  JournalEntry,
  MedicineAnalysis,
  ChatRoom,
  ChatMessage,
  Mentor,
  CommunityEvent,
} from '@/types/api';

const API_URL: string = import.meta.env.VITE_API_URL ?? '/api';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type Envelope<T> = { ok: true; data: T } | { ok: false; error: string };

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  let body: Envelope<T>;
  try {
    body = (await res.json()) as Envelope<T>;
  } catch {
    throw new ApiError(`Unexpected response from server (${res.status})`, res.status);
  }
  if (!body.ok) throw new ApiError(body.error, res.status);
  return body.data;
}

export const api = {
  upsertUser: (u: {
    clerkId: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    university?: string | null;
  }) => request<User>('/users', { method: 'POST', body: JSON.stringify(u) }),

  saveAssessment: (a: {
    clerkId: string;
    stress: number;
    anxiety: number;
    sleep: number;
    answers: unknown;
    activities?: unknown;
    games?: unknown;
  }) => request<Assessment>('/assessments', { method: 'POST', body: JSON.stringify(a) }),
  getAssessments: (clerkId: string) =>
    request<Assessment[]>(`/assessments?clerkId=${encodeURIComponent(clerkId)}`),

  saveMood: (m: {
    clerkId: string;
    mood: string;
    notes?: string | null;
    stress?: number | null;
    anxiety?: number | null;
    sleep?: number | null;
  }) => request<MoodEntry>('/mood', { method: 'POST', body: JSON.stringify(m) }),
  getMoodHistory: (clerkId: string) =>
    request<MoodEntry[]>(`/mood?clerkId=${encodeURIComponent(clerkId)}`),

  createJournal: (j: {
    clerkId: string;
    title?: string | null;
    content: string;
    mood?: string | null;
    tags?: string[];
  }) => request<JournalEntry>('/journal', { method: 'POST', body: JSON.stringify(j) }),
  updateJournal: (j: {
    id: string;
    clerkId: string;
    title?: string | null;
    content?: string;
    mood?: string | null;
    tags?: string[];
  }) => request<JournalEntry>('/journal', { method: 'PUT', body: JSON.stringify(j) }),
  deleteJournal: (id: string, clerkId: string) =>
    request<{ deleted: boolean }>(
      `/journal?id=${encodeURIComponent(id)}&clerkId=${encodeURIComponent(clerkId)}`,
      { method: 'DELETE' },
    ),
  getJournal: (clerkId: string) =>
    request<JournalEntry[]>(`/journal?clerkId=${encodeURIComponent(clerkId)}`),

  saveMedicine: (clerkId: string, analysis: unknown) =>
    request<MedicineAnalysis>('/medicine', {
      method: 'POST',
      body: JSON.stringify({ clerkId, analysis }),
    }),
  getMedicineHistory: (clerkId: string) =>
    request<MedicineAnalysis[]>(`/medicine?clerkId=${encodeURIComponent(clerkId)}`),

  getChatRooms: (opts?: { clerkId?: string; type?: string }) => {
    const params = new URLSearchParams();
    if (opts?.clerkId) params.set('clerkId', opts.clerkId);
    if (opts?.type) params.set('type', opts.type);
    const qs = params.toString();
    return request<ChatRoom[]>(`/chat/rooms${qs ? `?${qs}` : ''}`);
  },
  createChatRoom: (room: {
    type: 'group' | 'mentor' | 'private' | 'ai_chat';
    name?: string | null;
    description?: string | null;
    clerkId?: string | null;
    topic?: string | null;
    tags?: string[];
  }) => request<ChatRoom>('/chat/rooms', { method: 'POST', body: JSON.stringify(room) }),
  getChatMessages: (roomId: string, opts?: { limit?: number; before?: string }) => {
    const params = new URLSearchParams({ roomId });
    if (opts?.limit) params.set('limit', String(opts.limit));
    if (opts?.before) params.set('before', opts.before);
    return request<ChatMessage[]>(`/chat/messages?${params.toString()}`);
  },
  sendChatMessage: (msg: {
    roomId: string;
    clerkId?: string | null;
    content: string;
    role?: 'user' | 'assistant' | 'system';
    senderName?: string | null;
  }) => request<ChatMessage>('/chat/messages', { method: 'POST', body: JSON.stringify(msg) }),

  getCommunityGroups: (clerkId?: string) =>
    request<ChatRoom[]>(`/community/groups${clerkId ? `?clerkId=${encodeURIComponent(clerkId)}` : ''}`),
  joinCommunityGroup: (clerkId: string, groupId: string) =>
    request<{ joined: boolean }>('/community/join', {
      method: 'POST',
      body: JSON.stringify({ clerkId, groupId }),
    }),

  getEvents: (clerkId?: string) =>
    request<CommunityEvent[]>(`/events${clerkId ? `?clerkId=${encodeURIComponent(clerkId)}` : ''}`),
  registerEvent: (clerkId: string, eventId: string) =>
    request<unknown>('/events', {
      method: 'POST',
      body: JSON.stringify({ action: 'register', eventId, clerkId }),
    }),
  unregisterEvent: (clerkId: string, eventId: string) =>
    request<unknown>('/events', {
      method: 'POST',
      body: JSON.stringify({ action: 'unregister', eventId, clerkId }),
    }),

  getMentors: () => request<Mentor[]>('/mentors'),
};
