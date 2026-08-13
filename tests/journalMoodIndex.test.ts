import { describe, it, expect } from 'vitest';
import {
  MIN_POINTS_FOR_INDEX,
  MOOD_VALENCE,
  computeMoodIndex,
  toMoodPoints,
  type MoodPoint,
} from '@/features/journal/moodIndex';
import { localDayKey } from '@/features/journal/doc';
import { MOOD_META, type JournalEntryView, type MoodAnalysis, type MoodKey } from '@/features/journal/types';

const NOW = new Date('2026-08-06T18:00:00+05:30');
const DAY = 86_400_000;

/** A point `daysAgo` days back, in the same local calendar the app uses. */
const point = (mood: MoodKey, daysAgo: number): MoodPoint => {
  const at = new Date(+NOW - daysAgo * DAY).toISOString();
  return { dayKey: localDayKey(at), mood, at };
};

const view = (mood: MoodKey | undefined, daysAgo: number, id = String(daysAgo)): JournalEntryView => ({
  id,
  title: null,
  createdAt: new Date(+NOW - daysAgo * DAY).toISOString(),
  updatedAt: new Date(+NOW - daysAgo * DAY).toISOString(),
  tags: [],
  doc: {
    v: 1,
    text: 'some words',
    theme: 'bloom',
    stickers: [],
    media: [],
    mood: mood ? ({ mood, confidence: 0.8, emotions: [], themes: [], insight: '', generatedAt: '' } as MoodAnalysis) : undefined,
  },
});

/** Nothing this surface says may read as assessment, severity or diagnosis. */
const CLINICAL = /diagnos|disorder|symptom|depress|anxiet|severe|mild|moderate|risk|score|assess|you are|you seem/i;

describe('MOOD_VALENCE', () => {
  it('covers every mood key and stays inside 0–1', () => {
    for (const key of Object.keys(MOOD_META) as MoodKey[]) {
      expect(MOOD_VALENCE[key], key).toBeGreaterThanOrEqual(0);
      expect(MOOD_VALENCE[key], key).toBeLessThanOrEqual(1);
    }
    expect(Object.keys(MOOD_VALENCE).sort()).toEqual(Object.keys(MOOD_META).sort());
  });

  it('orders light above neutral above heavy', () => {
    expect(MOOD_VALENCE.happy).toBeGreaterThan(MOOD_VALENCE.neutral);
    expect(MOOD_VALENCE.calm).toBeGreaterThan(MOOD_VALENCE.neutral);
    expect(MOOD_VALENCE.neutral).toBeGreaterThan(MOOD_VALENCE.anxious);
    expect(MOOD_VALENCE.anxious).toBeGreaterThan(MOOD_VALENCE.sad);
  });
});

describe('toMoodPoints', () => {
  it('keeps only entries that carry a mood, oldest first', () => {
    const points = toMoodPoints([view('happy', 0, 'a'), view(undefined, 1, 'b'), view('sad', 2, 'c')]);
    expect(points.map((p) => p.mood)).toEqual(['sad', 'happy']);
    expect(points[0].dayKey < points[1].dayKey).toBe(true);
  });

  it('drops a mood key that is not one of ours — doc is parsed JSON, not a promise', () => {
    const junk = view('happy', 0);
    (junk.doc.mood as unknown as { mood: string }).mood = 'ecstatic';
    expect(toMoodPoints([junk])).toEqual([]);
    expect(toMoodPoints([{ ...view('sad', 0), createdAt: 'not a date' }])).toEqual([]);
  });

  it('returns nothing for no entries', () => {
    expect(toMoodPoints([])).toEqual([]);
  });
});

describe('computeMoodIndex — not enough yet', () => {
  it('never invents a score below the minimum, and says so warmly', () => {
    for (const points of [[], [point('happy', 0)]]) {
      const index = computeMoodIndex(points, NOW);
      expect(index.trend).toBe('new');
      expect(index.delta).toBe(0);
      expect(index.score).toBe(0);
      expect(index.sampleSize).toBe(points.length);
      expect(index.blurb).toMatch(/nothing here to read/i);
      expect(index.label).not.toMatch(CLINICAL);
    }
    expect(MIN_POINTS_FOR_INDEX).toBe(2);
  });
});

describe('computeMoodIndex — recency', () => {
  it('weights the recent stretch above the old one', () => {
    const brightNow = computeMoodIndex([point('sad', 20), point('happy', 0)], NOW).score;
    const heavyNow = computeMoodIndex([point('happy', 20), point('sad', 0)], NOW).score;
    expect(brightNow).toBeGreaterThan(heavyNow);
  });

  it('lands close to today when the older writing is far enough back', () => {
    const index = computeMoodIndex([point('sad', 30), point('happy', 0)], NOW);
    expect(index.score).toBeGreaterThan(90);
  });

  it('moves as soon as a new entry lands', () => {
    const before = computeMoodIndex([point('sad', 1), point('sad', 2)], NOW).score;
    const after = computeMoodIndex([point('sad', 1), point('sad', 2), point('happy', 0)], NOW).score;
    expect(after).toBeGreaterThan(before);
  });

  it('is not affected by the order points arrive in', () => {
    const points = [point('sad', 3), point('happy', 0), point('calm', 1)];
    const a = computeMoodIndex(points, NOW).score;
    const b = computeMoodIndex([...points].reverse(), NOW).score;
    expect(a).toBe(b);
  });
});

describe('computeMoodIndex — one day, one voice', () => {
  it('averages entries sharing a day so a single day cannot dominate', () => {
    const one = computeMoodIndex([point('sad', 0), point('happy', 4)], NOW);
    const three = computeMoodIndex(
      [point('sad', 0), point('sad', 0), point('sad', 0), point('happy', 4)],
      NOW,
    );
    expect(three.score).toBe(one.score);
    expect(three.sampleSize).toBe(4); // sample size still counts entries, not days
  });

  it('a mixed day sits between its entries', () => {
    const mixed = computeMoodIndex([point('sad', 0), point('happy', 0)], NOW).score;
    expect(mixed).toBeGreaterThan(computeMoodIndex([point('sad', 0), point('sad', 0)], NOW).score);
    expect(mixed).toBeLessThan(computeMoodIndex([point('happy', 0), point('happy', 0)], NOW).score);
  });
});

describe('computeMoodIndex — trend and delta', () => {
  it('reads a lifting run as up, with a positive delta', () => {
    const index = computeMoodIndex([point('sad', 6), point('sad', 5), point('happy', 1), point('happy', 0)], NOW);
    expect(index.trend).toBe('up');
    expect(index.delta).toBeGreaterThan(0);
  });

  it('reads a sinking run as down, with a negative delta', () => {
    const index = computeMoodIndex([point('happy', 6), point('happy', 5), point('sad', 1), point('sad', 0)], NOW);
    expect(index.trend).toBe('down');
    expect(index.delta).toBeLessThan(0);
  });

  it('reads an unchanged run as flat with no delta', () => {
    const index = computeMoodIndex([point('calm', 3), point('calm', 2), point('calm', 1), point('calm', 0)], NOW);
    expect(index.trend).toBe('flat');
    expect(index.delta).toBe(0);
  });

  it('claims no comparison when every entry is from the same day', () => {
    const index = computeMoodIndex([point('happy', 0), point('sad', 0)], NOW);
    expect(index.trend).toBe('flat');
    expect(index.delta).toBe(0);
    expect(index.sampleSize).toBe(2);
  });
});

describe('computeMoodIndex — bounds and copy', () => {
  it('clamps to 0–100 at both extremes and everywhere between', () => {
    const all = (mood: MoodKey) => computeMoodIndex([point(mood, 0), point(mood, 1)], NOW).score;
    expect(all('happy')).toBe(100);
    expect(all('sad')).toBeGreaterThanOrEqual(0);
    for (const key of Object.keys(MOOD_VALENCE) as MoodKey[]) {
      const score = all(key);
      expect(Number.isInteger(score), key).toBe(true);
      expect(score, key).toBeGreaterThanOrEqual(0);
      expect(score, key).toBeLessThanOrEqual(100);
    }
  });

  it('stays finite and in range for writing years old, where the weights underflow', () => {
    const index = computeMoodIndex([point('happy', 4000), point('sad', 4001)], NOW);
    expect(Number.isFinite(index.score)).toBe(true);
    expect(index.score).toBeGreaterThanOrEqual(0);
    expect(index.score).toBeLessThanOrEqual(100);
  });

  it('does not let a future-dated entry outweigh today', () => {
    const future = computeMoodIndex([point('happy', -30), point('sad', 0)], NOW).score;
    const today = computeMoodIndex([point('happy', 0), point('sad', 0)], NOW).score;
    expect(future).toBe(today);
  });

  it('bands the whole range, and every band speaks warmly', () => {
    const bands = new Set<string>();
    for (const key of Object.keys(MOOD_VALENCE) as MoodKey[]) {
      const index = computeMoodIndex([point(key, 0), point(key, 1)], NOW);
      bands.add(index.band);
      expect(index.label, index.band).not.toMatch(CLINICAL);
      expect(index.blurb, index.band).not.toMatch(CLINICAL);
      expect(index.blurb.length, index.band).toBeGreaterThan(20);
    }
    expect(bands.has('low')).toBe(true);
    expect(bands.has('bright')).toBe(true);
  });

  it('takes the clock as an argument, and an earlier clock levels the weighting', () => {
    const points = [point('sad', 0), point('happy', 10)];
    // Read today, the heavy day is the recent one and pulls the number down.
    expect(computeMoodIndex(points, NOW).score).toBeLessThan(50);
    // Read from before either was written, nothing is older than anything else.
    expect(computeMoodIndex(points, new Date(+NOW - 30 * DAY)).score).toBe(
      Math.round(((MOOD_VALENCE.sad + MOOD_VALENCE.happy) / 2) * 100),
    );
  });

  it('does not drift on its own — only new writing moves it', () => {
    const points = [point('sad', 0), point('happy', 10)];
    // The weights are relative, so waiting a month without writing changes
    // nothing. The number reflects the last stretch, however long ago it was.
    expect(computeMoodIndex(points, new Date(+NOW + 30 * DAY)).score).toBe(
      computeMoodIndex(points, NOW).score,
    );
  });
});
