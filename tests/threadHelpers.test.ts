import { describe, it, expect } from 'vitest';
import type { MentorThread } from '@/types/api';
import {
  assignedThread,
  isMine,
  sortThreads,
  threadPartner,
  threadStamp,
} from '@/features/community/ThreadList';

/**
 * The pure half of the 1:1 mentor threads. No DOM, no network, no clock of its
 * own — `threadStamp` takes "now" as an argument so every branch is reachable.
 *
 * The one that matters most is `isMine`: it decides which side of a private
 * conversation a message hangs on, and getting it wrong would put somebody
 * else's disclosure in the reader's own colours.
 */

/** Local time, so every assertion here lives in one timezone: the test's. */
const at = (y: number, m: number, d: number, h = 0, min = 0) => new Date(y, m - 1, d, h, min, 0, 0);
const iso = (d: Date) => d.toISOString();

const NOW = at(2026, 8, 8, 14, 0);

function thread(over: Partial<MentorThread> & { id: string }): MentorThread {
  return {
    status: 'active',
    updatedAt: iso(NOW),
    lastMessage: 'hello',
    lastAt: iso(NOW),
    mentor: { id: 'm1', name: 'Asha Verma', badge: 'Peer Mentor', specialization: 'Exam stress' },
    student: { id: 's1', name: 'Ravi Kumar' },
    ...over,
  };
}

describe('sortThreads', () => {
  it('puts the most recently active conversation first', () => {
    const out = sortThreads([
      thread({ id: 'old', lastAt: iso(at(2026, 8, 1, 9, 0)) }),
      thread({ id: 'new', lastAt: iso(at(2026, 8, 8, 9, 0)) }),
      thread({ id: 'mid', lastAt: iso(at(2026, 8, 5, 9, 0)) }),
    ]);
    expect(out.map((t) => t.id)).toEqual(['new', 'mid', 'old']);
  });

  it('does not mutate the array it was handed — that is React Query cache', () => {
    const input = [
      thread({ id: 'old', lastAt: iso(at(2026, 8, 1)) }),
      thread({ id: 'new', lastAt: iso(at(2026, 8, 8)) }),
    ];
    sortThreads(input);
    expect(input.map((t) => t.id)).toEqual(['old', 'new']);
  });

  it('sinks a thread with an unreadable date rather than dropping or crashing on it', () => {
    const out = sortThreads([
      thread({ id: 'broken', lastAt: 'whenever' }),
      thread({ id: 'fine', lastAt: iso(at(2026, 8, 8)) }),
    ]);
    expect(out.map((t) => t.id)).toEqual(['fine', 'broken']);
  });

  it('survives an empty, non-array or holey list', () => {
    expect(sortThreads([])).toEqual([]);
    expect(sortThreads(null as unknown as MentorThread[])).toEqual([]);
    expect(sortThreads([null as unknown as MentorThread, thread({ id: 'a' })])).toHaveLength(1);
  });
});

describe('threadPartner', () => {
  it('shows a student the mentor, with their badge and specialisation', () => {
    const p = threadPartner(thread({ id: 'a' }), false);
    expect(p.name).toBe('Asha Verma');
    expect(p.badge).toBe('Peer Mentor');
    expect(p.specialization).toBe('Exam stress');
    expect(p.isMentor).toBe(true);
  });

  it('shows a mentor the student, and never hands them a mentor badge', () => {
    const p = threadPartner(thread({ id: 'a' }), true);
    expect(p.name).toBe('Ravi Kumar');
    expect(p.badge).toBeNull();
    expect(p.specialization).toBeNull();
    expect(p.isMentor).toBe(false);
  });

  it('falls back to the role rather than an empty row when the other side is gone', () => {
    expect(threadPartner(thread({ id: 'a', mentor: null }), false).name).toBe('Mentor');
    expect(threadPartner(thread({ id: 'a', student: null }), true).name).toBe('Student');
    expect(threadPartner(undefined, false).name).toBe('Mentor');
    expect(threadPartner(null, true).name).toBe('Student');
  });

  it('treats a blank name as no name at all', () => {
    expect(threadPartner(thread({ id: 'a', student: { id: 's1', name: '   ' } }), true).name).toBe(
      'Student',
    );
  });
});

describe('assignedThread', () => {
  it('calls a lone thread the auto-assigned mentor, because that is what it is', () => {
    const only = thread({ id: 'only' });
    expect(assignedThread([only])).toBe(only);
  });

  it('labels nobody once there is more than one — the payload cannot say which came first', () => {
    expect(assignedThread([thread({ id: 'a' }), thread({ id: 'b' })])).toBeNull();
  });

  it('has nothing to label on an empty or missing list', () => {
    expect(assignedThread([])).toBeNull();
    expect(assignedThread(undefined as unknown as MentorThread[])).toBeNull();
  });
});

describe('isMine', () => {
  it('gives a student their own messages and the mentor the mentor\'s', () => {
    expect(isMine({ isMentor: false }, false)).toBe(true);
    expect(isMine({ isMentor: true }, false)).toBe(false);
    expect(isMine({ isMentor: true }, true)).toBe(true);
    expect(isMine({ isMentor: false }, true)).toBe(false);
  });

  it('splits one thread into two sides that never overlap', () => {
    const msgs = [{ isMentor: false }, { isMentor: true }, { isMentor: false }];
    const asStudent = msgs.filter((m) => isMine(m, false));
    const asMentor = msgs.filter((m) => isMine(m, true));
    expect(asStudent).toHaveLength(2);
    expect(asMentor).toHaveLength(1);
    expect(asStudent.some((m) => asMentor.includes(m))).toBe(false);
  });

  it('treats a missing flag as the student side rather than throwing', () => {
    expect(isMine(undefined, false)).toBe(true);
    expect(isMine({} as { isMentor: boolean }, true)).toBe(false);
  });
});

describe('threadStamp', () => {
  it('stays relative inside today, where the day is obvious', () => {
    expect(threadStamp(iso(at(2026, 8, 8, 13, 55)), NOW)).toBe('5 min ago');
    expect(threadStamp(iso(at(2026, 8, 8, 14, 0)), NOW)).toBe('just now');
  });

  it('adds the day once it is not today, because a bare clock time could be any date', () => {
    expect(threadStamp(iso(at(2026, 8, 7, 21, 30)), NOW)).toBe('Yesterday · 9:30 pm');
    expect(threadStamp(iso(at(2026, 8, 5, 9, 15)), NOW)).toBe('Wed, 5 Aug · 9:15 am');
  });

  it('says nothing rather than "Invalid Date"', () => {
    expect(threadStamp('sometime', NOW)).toBe('');
    expect(threadStamp('', NOW)).toBe('');
  });
});
