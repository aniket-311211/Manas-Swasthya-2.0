import { describe, it, expect } from 'vitest';
import {
  EVENING_HOUR,
  INTENTION_TAG,
  MORNING_END_HOUR,
  greetingFor,
  hasMoodToday,
  isSameLocalDay,
  pickRitual,
  resolutionOf,
  skyNameFor,
  todaysIntention,
} from '@/components/dashboard/ritual';
import type { JournalEntry, MoodEntry } from '@/types/api';

const at = (h: number, d = 6) => new Date(2026, 7, d, h, 0, 0);

const journal = (over: Partial<JournalEntry> = {}): JournalEntry => ({
  id: 'j1',
  userId: 'u1',
  title: 'Intention',
  content: 'Finish the problem set',
  mood: null,
  tags: [INTENTION_TAG],
  createdAt: at(8).toISOString(),
  updatedAt: at(8).toISOString(),
  ...over,
});

const mood = (over: Partial<MoodEntry> = {}): MoodEntry => ({
  id: 'm1',
  userId: 'u1',
  mood: '🙂',
  notes: null,
  stress: null,
  anxiety: null,
  sleep: null,
  createdAt: at(9).toISOString(),
  ...over,
});

describe('isSameLocalDay', () => {
  it('compares local calendar days, not elapsed hours', () => {
    expect(isSameLocalDay(at(0), at(23))).toBe(true);
    expect(isSameLocalDay(at(23, 6), at(0, 7))).toBe(false);
  });
});

describe('todaysIntention', () => {
  it('ignores untagged entries and entries from other days', () => {
    const entries = [
      journal({ id: 'other-day', createdAt: at(8, 5).toISOString() }),
      journal({ id: 'untagged', tags: ['note'] }),
    ];
    expect(todaysIntention(entries, at(10))).toBeNull();
  });

  it('returns the newest when more than one exists today', () => {
    const entries = [
      journal({ id: 'early', createdAt: at(7).toISOString() }),
      journal({ id: 'late', createdAt: at(11).toISOString() }),
    ];
    expect(todaysIntention(entries, at(13))?.id).toBe('late');
  });

  it('tolerates a missing tags array', () => {
    const entries = [journal({ tags: undefined as unknown as string[] })];
    expect(todaysIntention(entries, at(10))).toBeNull();
  });
});

describe('resolutionOf', () => {
  it('reads the outcome tag, and null when unresolved or absent', () => {
    expect(resolutionOf(journal({ tags: [INTENTION_TAG, 'done'] }))).toBe('done');
    expect(resolutionOf(journal({ tags: [INTENTION_TAG, 'missed'] }))).toBe('missed');
    expect(resolutionOf(journal())).toBeNull();
    expect(resolutionOf(null)).toBeNull();
  });
});

describe('hasMoodToday', () => {
  it('is true only for an entry on the same local day', () => {
    expect(hasMoodToday([mood()], at(20))).toBe(true);
    expect(hasMoodToday([mood({ createdAt: at(9, 5).toISOString() })], at(20))).toBe(false);
    expect(hasMoodToday([], at(20))).toBe(false);
  });
});

describe('pickRitual priority', () => {
  it('1. evening with an unresolved intention wins over everything', () => {
    const phase = pickRitual({ moods: [], journals: [journal()], now: at(EVENING_HOUR) });
    expect(phase.kind).toBe('reflect');
    // beats the missing check-in, which would otherwise match
    expect(hasMoodToday([], at(EVENING_HOUR))).toBe(false);
  });

  it('does not ask to reflect on an intention already resolved', () => {
    const resolved = journal({ tags: [INTENTION_TAG, 'partly'] });
    const phase = pickRitual({ moods: [mood()], journals: [resolved], now: at(19) });
    expect(phase.kind).toBe('settled');
  });

  it('2. morning with no intention asks for one, even with no mood logged', () => {
    expect(pickRitual({ moods: [], journals: [], now: at(8) }).kind).toBe('intention');
  });

  it('3. once an intention exists, a missing mood becomes the ask', () => {
    expect(pickRitual({ moods: [], journals: [journal()], now: at(9) }).kind).toBe('checkin');
  });

  it('4. afternoon with a mood but no intention still asks for one', () => {
    expect(pickRitual({ moods: [mood()], journals: [], now: at(14) }).kind).toBe('intention');
  });

  it('5. everything done settles', () => {
    const phase = pickRitual({ moods: [mood()], journals: [journal()], now: at(14) });
    expect(phase.kind).toBe('settled');
    if (phase.kind === 'settled') expect(phase.intention?.id).toBe('j1');
  });

  it('after the evening cutoff with no intention at all, only the mood matters', () => {
    expect(pickRitual({ moods: [], journals: [], now: at(20) }).kind).toBe('checkin');
    expect(pickRitual({ moods: [mood()], journals: [], now: at(20) }).kind).toBe('settled');
  });

  it('boundary hours resolve to the right side', () => {
    // one minute before noon is still morning
    expect(pickRitual({ moods: [mood()], journals: [], now: at(MORNING_END_HOUR - 1) }).kind).toBe('intention');
    // EVENING_HOUR exactly triggers reflect
    expect(pickRitual({ moods: [mood()], journals: [journal()], now: at(EVENING_HOUR) }).kind).toBe('reflect');
    expect(pickRitual({ moods: [mood()], journals: [journal()], now: at(EVENING_HOUR - 1) }).kind).toBe('settled');
  });
});

describe('skyNameFor / greetingFor', () => {
  it('walks night -> dawn -> day -> dusk -> night', () => {
    expect(skyNameFor(at(3))).toBe('night');
    expect(skyNameFor(at(7))).toBe('dawn');
    expect(skyNameFor(at(13))).toBe('day');
    expect(skyNameFor(at(18))).toBe('dusk');
    expect(skyNameFor(at(22))).toBe('night');
  });

  it('greets in step with the same cutoffs', () => {
    expect(greetingFor(at(3))).toBe('Still up');
    expect(greetingFor(at(8))).toBe('Good morning');
    expect(greetingFor(at(14))).toBe('Good afternoon');
    expect(greetingFor(at(19))).toBe('Good evening');
  });
});
