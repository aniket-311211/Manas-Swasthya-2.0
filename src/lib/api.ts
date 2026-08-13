import type {
  User,
  Assessment,
  MoodEntry,
  JournalEntry,
  MedicineAnalysis,
  MedicineAllowance,
  MedicineAnalysisResponse,
  ChatRoom,
  ChatMessage,
  Mentor,
  CommunityEvent,
  Booking,
  CommunityMessage,
  MentorIdentity,
  MentorSession,
  MentorThread,
  ThreadMessage,
} from '@/types/api';

import { STORAGE_KEY, languageFor } from '@/lib/languages';

const API_URL: string = import.meta.env.VITE_API_URL ?? '/api';

/**
 * The language the server should answer in.
 *
 * Read from storage rather than from an i18n import, so this module stays free
 * of a dependency on React and can be used from anywhere. `setLang` in the top
 * bar writes the same key, so this is always the current choice.
 */
function currentLanguage(): string {
  try {
    return languageFor(localStorage.getItem(STORAGE_KEY) ?? undefined).code;
  } catch {
    return 'en';
  }
}

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

/**
 * Supplies the current Clerk session token.
 *
 * Registered once by App.tsx from `useAuth().getToken`. Every request picks it
 * up automatically, which is what makes it practical for the server to verify
 * identity rather than believe a `clerkId` in the body — doing it per call site
 * across forty functions is how the old scheme survived so long.
 */
let tokenProvider: (() => Promise<string | null>) | null = null;

export function setTokenProvider(fn: (() => Promise<string | null>) | null): void {
  tokenProvider = fn;
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  // Never let a token failure take the request down with it — the server will
  // answer 401 and the UI already handles that.
  const token = tokenProvider ? await tokenProvider().catch(() => null) : null;

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    // Merged, not overwritten: spreading `init` after a `headers` literal would
    // drop Content-Type for any caller that sets Authorization, and the body
    // would stop being parsed as JSON. An explicit Authorization on the call
    // wins over the ambient one — the mentor console signs in separately.
    headers: {
      'Content-Type': 'application/json',
      'X-Manas-Language': currentLanguage(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  let body: Envelope<T>;
  try {
    body = (await res.json()) as Envelope<T>;
  } catch {
    throw new ApiError(`Unexpected response from server (${res.status})`, res.status);
  }
  // Narrowed on `ok` first: reading `.error` off the union directly is an error
  // because the success arm has no such field.
  if (body.ok === false) throw new ApiError(body.error, res.status);
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
    entryDate?: string;
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

  /**
   * Medicine calls carry a Clerk session token instead of a clerkId, because
   * they spend money and read medical history. `saveMedicine` is gone: the
   * server writes history from its own validated output, so the browser can no
   * longer file whatever it likes as a medical record.
   */
  getMedicineHistory: (token: string) =>
    request<MedicineAnalysis[]>('/medicine', { headers: { Authorization: `Bearer ${token}` } }),

  getMedicineAllowance: (token: string) =>
    request<MedicineAllowance>('/ai/medicine', { headers: { Authorization: `Bearer ${token}` } }),

  analyseMedicine: (token: string, input: { medicineName?: string; imageBase64?: string }) =>
    request<MedicineAnalysisResponse>('/ai/medicine', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(input),
    }),

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
  getChatMessages: (roomId: string, opts?: { limit?: number; before?: string; clerkId?: string }) => {
    const params = new URLSearchParams({ roomId });
    if (opts?.limit) params.set('limit', String(opts.limit));
    if (opts?.before) params.set('before', opts.before);
    if (opts?.clerkId) params.set('clerkId', opts.clerkId);
    return request<ChatMessage[]>(`/chat/messages?${params.toString()}`);
  },
  pruneChatMessages: (roomId: string, clerkId: string) =>
    request<{ deleted: number }>(
      `/chat/messages?roomId=${encodeURIComponent(roomId)}&clerkId=${encodeURIComponent(clerkId)}`,
      { method: 'DELETE' },
    ),
  clearChatMessages: (roomId: string, clerkId: string) =>
    request<{ deleted: number }>(
      `/chat/messages?roomId=${encodeURIComponent(roomId)}&clerkId=${encodeURIComponent(clerkId)}&clear=1`,
      { method: 'DELETE' },
    ),
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

  // --- Community ---------------------------------------------------------
  getCommunityMessages: (roomId: string) =>
    request<CommunityMessage[]>(`/community/messages?roomId=${encodeURIComponent(roomId)}`),
  /**
   * Post to a group. A mentor passes `mentorToken`; a student passes clerkId.
   * The server decides the author either way — this never declares it.
   */
  postCommunityMessage: (
    m: { roomId: string; content: string; clerkId?: string },
    mentorToken?: string,
  ) =>
    request<{ id: string; crisis: boolean }>('/community/messages', {
      method: 'POST',
      body: JSON.stringify(m),
      headers: mentorToken ? { Authorization: `Bearer ${mentorToken}` } : undefined,
    }),
  setGroupMembership: (clerkId: string, groupId: string, action: 'join' | 'leave') =>
    request<{ joined: boolean }>('/community/join', {
      method: 'POST',
      body: JSON.stringify({ clerkId, groupId, action }),
    }),

  // --- Mentor threads (1:1) ----------------------------------------------
  /** My threads. Students pass clerkId; a mentor passes their token. */
  getThreads: (clerkId?: string, mentorToken?: string) =>
    request<MentorThread[]>(`/mentors/threads${clerkId ? `?clerkId=${encodeURIComponent(clerkId)}` : ''}`, {
      headers: mentorToken ? { Authorization: `Bearer ${mentorToken}` } : undefined,
    }),
  getThreadMessages: (roomId: string, clerkId?: string, mentorToken?: string) =>
    request<ThreadMessage[]>(
      `/mentors/threads?roomId=${encodeURIComponent(roomId)}${clerkId ? `&clerkId=${encodeURIComponent(clerkId)}` : ''}`,
      { headers: mentorToken ? { Authorization: `Bearer ${mentorToken}` } : undefined },
    ),
  startThread: (clerkId: string, mentorId: string) =>
    request<{ id: string; existing: boolean }>('/mentors/threads', {
      method: 'POST',
      body: JSON.stringify({ clerkId, mentorId }),
    }),
  sendThreadMessage: (
    m: { roomId: string; content: string; clerkId?: string },
    mentorToken?: string,
  ) =>
    request<{ id: string; crisis: boolean }>('/mentors/threads', {
      method: 'POST',
      body: JSON.stringify(m),
      headers: mentorToken ? { Authorization: `Bearer ${mentorToken}` } : undefined,
    }),

  // --- Mentor auth -------------------------------------------------------
  mentorSignup: (m: {
    name: string;
    email: string;
    password: string;
    specialization?: string;
    inviteCode: string;
  }) => request<MentorSession>('/mentors/signup', { method: 'POST', body: JSON.stringify(m) }),
  mentorLogin: (email: string, password: string) =>
    request<MentorSession>('/mentors/auth', {
      method: 'POST',
      body: JSON.stringify({ action: 'login', email, password }),
    }),
  mentorLogout: (token: string) =>
    request<{ loggedOut: boolean }>('/mentors/auth', {
      method: 'POST',
      body: JSON.stringify({ action: 'logout' }),
      headers: { Authorization: `Bearer ${token}` },
    }),
  mentorMe: (token: string) =>
    request<{ mentor: MentorIdentity }>('/mentors/auth', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getBookings: (clerkId: string) =>
    request<Booking[]>(`/bookings?clerkId=${encodeURIComponent(clerkId)}`),
  createBooking: (b: {
    clerkId: string;
    mentorId: string;
    mentorName: string;
    mode?: 'video' | 'audio' | 'chat' | 'in_person';
    scheduledAt: string;
    durationMin?: number;
    note?: string | null;
    // Asked for, never granted here — the server decides and stamps the result.
    couponCode?: string | null;
    registrationNo?: string | null;
  }) => request<Booking>('/bookings', { method: 'POST', body: JSON.stringify(b) }),
  updateBooking: (b: {
    id: string;
    clerkId: string;
    status?: 'scheduled' | 'completed' | 'cancelled';
    scheduledAt?: string;
    note?: string | null;
  }) => request<Booking>('/bookings', { method: 'PATCH', body: JSON.stringify(b) }),
  cancelBooking: (id: string, clerkId: string) =>
    request<Booking>(`/bookings?id=${encodeURIComponent(id)}&clerkId=${encodeURIComponent(clerkId)}`, {
      method: 'DELETE',
    }),
};
