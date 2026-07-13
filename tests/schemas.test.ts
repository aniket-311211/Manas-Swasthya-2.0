import { describe, it, expect } from 'vitest';
import {
  UserUpsert,
  AssessmentSave,
  MoodSave,
  JournalSave,
  EventAction,
  AiChat,
} from '../api/_lib/schemas';

describe('schemas', () => {
  it('accepts a valid user upsert', () => {
    const r = UserUpsert.safeParse({ clerkId: 'u1', email: 'a@b.com', firstName: 'A' });
    expect(r.success).toBe(true);
  });

  it('rejects user without clerkId', () => {
    const r = UserUpsert.safeParse({ email: 'a@b.com' });
    expect(r.success).toBe(false);
  });

  it('rejects assessment with out-of-range stress', () => {
    const r = AssessmentSave.safeParse({ clerkId: 'u1', stress: 150, anxiety: 50, sleep: 50, answers: [] });
    expect(r.success).toBe(false);
  });

  it('accepts valid mood and rejects empty mood', () => {
    expect(MoodSave.safeParse({ clerkId: 'u1', mood: '🙂' }).success).toBe(true);
    expect(MoodSave.safeParse({ clerkId: 'u1', mood: '' }).success).toBe(false);
  });

  it('rejects mood stress outside 1-10', () => {
    expect(MoodSave.safeParse({ clerkId: 'u1', mood: 'ok', stress: 0 }).success).toBe(false);
  });

  it('journal requires content', () => {
    expect(JournalSave.safeParse({ clerkId: 'u1', content: '' }).success).toBe(false);
    expect(JournalSave.safeParse({ clerkId: 'u1', content: 'today was fine' }).success).toBe(true);
  });

  it('event action restricted to register/unregister', () => {
    expect(EventAction.safeParse({ action: 'register', eventId: 'e', clerkId: 'u' }).success).toBe(true);
    expect(EventAction.safeParse({ action: 'delete', eventId: 'e', clerkId: 'u' }).success).toBe(false);
  });

  it('ai chat requires at least one message', () => {
    expect(AiChat.safeParse({ clerkId: 'u1', messages: [] }).success).toBe(false);
    expect(AiChat.safeParse({ clerkId: 'u1', messages: [{ role: 'user', content: 'hi' }] }).success).toBe(true);
  });
});
