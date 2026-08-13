import { useCallback, useEffect, useState } from 'react';
import { ApiError, api } from '@/lib/api';
import type { MentorIdentity } from '@/types/api';

/**
 * The mentor's side of `api/mentors/auth.ts`.
 *
 * The server issues an opaque bearer token with an expiry; this file is the only
 * place in the client that knows where it is kept. Everything above the hook
 * sees either a live session or nothing at all.
 *
 * A STALE TOKEN IS NOT A SESSION. `loadSession` refuses to return an expired,
 * absent or unreadable record and clears it on the way out, and the hook checks
 * the expiry again on every render — a tab left open past the seven-day window
 * must not hand the UI a token the server will reject.
 *
 * The pure half (load/save/clear/isExpired) takes no clock of its own beyond an
 * injectable `now`, so tests/mentorSession.test.ts can drive every branch in the
 * node env with a fake localStorage.
 */

/** Namespaced, so it cannot collide with the old `mentorSession` blob. */
const KEY = 'manas.mentor.session';

export interface StoredSession {
  token: string;
  expiresAt: string;
  mentor: MentorIdentity;
}

function looksLikeSession(v: unknown): v is StoredSession {
  const s = v as StoredSession | null;
  return Boolean(
    s &&
      typeof s.token === 'string' &&
      s.token.length > 0 &&
      typeof s.expiresAt === 'string' &&
      s.mentor &&
      typeof s.mentor.name === 'string',
  );
}

/**
 * An expiry we cannot read counts as expired. The alternative — assuming a
 * corrupt date is still good — keeps a token nobody can reason about.
 */
export function isExpired(s: StoredSession, now: Date = new Date()): boolean {
  const t = new Date(s?.expiresAt ?? '').getTime();
  return Number.isNaN(t) || t <= now.getTime();
}

/** The stored session, or null when there is none, it is unreadable, or it has expired. */
export function loadSession(): StoredSession | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    // Storage disabled (private mode, blocked cookies). No session, no crash.
    return null;
  }
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = null;
  }
  if (!looksLikeSession(parsed) || isExpired(parsed)) {
    clearSession();
    return null;
  }
  return parsed;
}

/** Never throws: a full or disabled localStorage must not break signing in. */
export function saveSession(s: StoredSession): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // The session still works for this tab; it just will not survive a reload.
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing kept it in the first place.
  }
}

export interface MentorSessionState {
  session: StoredSession | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

/**
 * A stored session is trusted for the first paint — a returning mentor should
 * not watch a sign-in form flash past while a round trip confirms what is
 * already on disk — and is then checked in the background.
 */
export function useMentorSession(): MentorSessionState {
  const [session, setSession] = useState<StoredSession | null>(loadSession);

  // A token can be revoked, or its mentor deleted, between two page loads — the
  // expiry alone does not prove it is still good. Only an explicit 401 signs
  // anyone out: a flaky connection must not throw a mentor out of their console.
  useEffect(() => {
    const stored = loadSession();
    if (!stored) return;
    let alive = true;
    api
      .mentorMe(stored.token)
      .then(({ mentor }) => {
        if (alive) setSession({ ...stored, mentor });
      })
      .catch((e: unknown) => {
        if (!alive) return;
        if (e instanceof ApiError && e.status === 401) {
          clearSession();
          setSession(null);
        }
      });
    return () => {
      alive = false;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const s = await api.mentorLogin(email, password);
    saveSession(s);
    setSession(s);
  }, []);

  const signOut = useCallback(async () => {
    const token = session?.token;
    // Local first, and unconditionally. Whatever the network does next, the
    // person who pressed sign-out is signed out here.
    clearSession();
    setSession(null);
    if (token) await api.mentorLogout(token).catch(() => undefined);
  }, [session]);

  // Re-checked on every render rather than trusted from state: this is what
  // stops a long-lived tab handing an expired token to the UI.
  const live = session && !isExpired(session) ? session : null;

  return { session: live, signIn, signOut };
}
