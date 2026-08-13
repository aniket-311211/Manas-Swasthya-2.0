import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { MentorIdentity } from '../src/types/api';

/**
 * The pure half of the mentor session store. Nothing here renders, and nothing
 * reaches the network — the hook is deliberately kept out so these run in the
 * node env with one fake localStorage and a clock we pass in by hand.
 *
 * The property under test throughout: an expired, absent or unreadable record is
 * indistinguishable from being signed out. There is no branch where a stale
 * token reaches a caller.
 */

// import.meta.env shim: the module imports the api client, which reads it.
vi.stubEnv('VITE_API_URL', '');

const { clearSession, isExpired, loadSession, saveSession } = await import(
  '../src/features/community/mentorSession'
);

const KEY = 'manas.mentor.session';

const MENTOR: MentorIdentity = {
  id: 'mentor-1',
  name: 'Rhea Kapoor',
  email: 'rhea.kapoor@university.example',
  specialization: 'Exam stress',
  badge: 'Peer Lead',
};

const session = (expiresAt: string) => ({ token: 'a'.repeat(64), expiresAt, mentor: MENTOR });

class MemoryStorage {
  readonly store = new Map<string, string>();
  getItem(k: string): string | null {
    return this.store.has(k) ? (this.store.get(k) as string) : null;
  }
  setItem(k: string, v: string): void {
    this.store.set(k, String(v));
  }
  removeItem(k: string): void {
    this.store.delete(k);
  }
}

let storage: MemoryStorage;

beforeEach(() => {
  storage = new MemoryStorage();
  vi.stubGlobal('localStorage', storage);
});

afterEach(() => vi.unstubAllGlobals());

const inAWeek = () => new Date(Date.now() + 7 * 86_400_000).toISOString();
const lastWeek = () => new Date(Date.now() - 7 * 86_400_000).toISOString();

describe('isExpired', () => {
  const now = new Date('2026-08-08T12:00:00.000Z');

  it('is false right up to the expiry and true from it onwards', () => {
    expect(isExpired(session('2026-08-08T12:00:00.001Z'), now)).toBe(false);
    // The instant it expires it is expired — a token the server would refuse
    // must not be treated as good for one more millisecond.
    expect(isExpired(session('2026-08-08T12:00:00.000Z'), now)).toBe(true);
    expect(isExpired(session('2026-08-08T11:59:59.999Z'), now)).toBe(true);
  });

  it('treats an expiry it cannot read as expired', () => {
    expect(isExpired(session('whenever'), now)).toBe(true);
    expect(isExpired(session(''), now)).toBe(true);
    expect(isExpired({ token: 't', mentor: MENTOR } as never, now)).toBe(true);
  });

  it('reads the real clock when no clock is given', () => {
    expect(isExpired(session(inAWeek()))).toBe(false);
    expect(isExpired(session(lastWeek()))).toBe(true);
  });
});

describe('loadSession', () => {
  it('returns a session that is still good', () => {
    const s = session(inAWeek());
    saveSession(s);
    expect(loadSession()).toEqual(s);
  });

  it('returns null when nothing was ever stored', () => {
    expect(loadSession()).toBeNull();
  });

  it('returns null for an expired record, and forgets it', () => {
    saveSession(session(lastWeek()));
    expect(loadSession()).toBeNull();
    expect(storage.store.has(KEY)).toBe(false);
  });

  it('returns null for a record that is not JSON, and forgets it', () => {
    storage.setItem(KEY, '{not json');
    expect(loadSession()).toBeNull();
    expect(storage.store.has(KEY)).toBe(false);
  });

  it('returns null for JSON of the wrong shape', () => {
    for (const junk of ['null', '"a string"', '[]', '{}', '{"token":"","expiresAt":"x"}']) {
      storage.setItem(KEY, junk);
      expect(loadSession()).toBeNull();
    }
    // A record with a token but no mentor is still not a session.
    storage.setItem(KEY, JSON.stringify({ token: 'abc', expiresAt: inAWeek() }));
    expect(loadSession()).toBeNull();
  });

  it('returns null rather than throwing when storage is unavailable', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(loadSession()).toBeNull();
  });
});

describe('saveSession', () => {
  it('round-trips through storage', () => {
    const s = session(inAWeek());
    saveSession(s);
    expect(JSON.parse(storage.getItem(KEY) as string)).toEqual(s);
  });

  it('never throws when storage refuses to write', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => {
        throw new DOMException('QuotaExceededError');
      },
      removeItem: () => undefined,
    });
    expect(() => saveSession(session(inAWeek()))).not.toThrow();
  });

  it('never throws when there is no storage at all', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(() => saveSession(session(inAWeek()))).not.toThrow();
  });
});

describe('clearSession', () => {
  it('removes the record', () => {
    saveSession(session(inAWeek()));
    clearSession();
    expect(storage.store.has(KEY)).toBe(false);
    expect(loadSession()).toBeNull();
  });

  it('never throws when storage refuses to delete', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => {
        throw new Error('nope');
      },
    });
    expect(() => clearSession()).not.toThrow();
  });
});
