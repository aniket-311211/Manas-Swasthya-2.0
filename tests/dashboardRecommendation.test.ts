import { describe, it, expect } from 'vitest';
import {
  pickRecommendation,
  LOW_WELLNESS_SCORE,
  RECENT_JOURNAL_DAYS,
} from '@/components/dashboard/dashboardRecommendation';
import { sortByCreatedAt } from '@/components/dashboard/moodInsights';
import { wellnessScore } from '@/lib/wellness';
import type { Assessment, JournalEntry, MoodEntry } from '@/types/api';

const NOW = new Date('2026-07-13T15:00:00');
const DAY = 86400000;
const at = (msFromNow: number) => new Date(+NOW + msFromNow).toISOString();

const mood = (createdAt: string): MoodEntry => ({
  id: createdAt,
  userId: 'u1',
  mood: '4',
  notes: null,
  stress: null,
  anxiety: null,
  sleep: null,
  createdAt,
});

/** stress/anxiety/sleep all stay in 0..100 and land wellnessScore exactly on `score`. */
const assessment = (createdAt: string, score: number): Assessment => {
  const stress = Math.min(100, 200 - 2 * score);
  return {
    id: createdAt,
    userId: 'u1',
    stress,
    anxiety: 200 - 2 * score - stress,
    sleep: score,
    answers: null,
    activities: null,
    games: null,
    createdAt,
  };
};

const journal = (createdAt: string): JournalEntry => ({
  id: createdAt,
  userId: 'u1',
  title: null,
  content: 'note',
  mood: null,
  tags: [],
  createdAt,
  updatedAt: createdAt,
});

const MOOD_TODAY = [mood(at(-3 * 3600000))];
const HEALTHY = [assessment(at(-2 * DAY), 80)];
const FRESH_JOURNAL = [journal(at(-1 * DAY))];
const pick = (input: Partial<Parameters<typeof pickRecommendation>[0]>) =>
  pickRecommendation({ moods: [], assessments: [], journals: [], now: NOW, ...input }).id;

describe('assessment fixture', () => {
  it('produces the wellness score it claims', () => {
    expect([44, 45, 46, 80].map((s) => wellnessScore(assessment(at(0), s)))).toEqual([44, 45, 46, 80]);
  });
});

describe('pickRecommendation priority', () => {
  it('check-in beats every lower branch', () => {
    // No mood today, and everything below is also unsatisfied.
    expect(pick({ moods: [mood(at(-1 * DAY))] })).toBe('check-in');
    expect(pick({ moods: [], assessments: [assessment(at(0), 10)], journals: [] })).toBe('check-in');
  });

  it('first-assessment beats talk-to-manas and below', () => {
    expect(pick({ moods: MOOD_TODAY, assessments: [], journals: [] })).toBe('first-assessment');
  });

  it('talk-to-manas beats write-journal', () => {
    expect(pick({ moods: MOOD_TODAY, assessments: [assessment(at(-1 * DAY), 10)], journals: [] })).toBe(
      'talk-to-manas',
    );
  });

  it('write-journal wins once mood, assessment and score are fine', () => {
    expect(pick({ moods: MOOD_TODAY, assessments: HEALTHY, journals: [journal(at(-30 * DAY))] })).toBe(
      'write-journal',
    );
  });

  it('review-rhythm is the all-clear fallback', () => {
    expect(pick({ moods: MOOD_TODAY, assessments: HEALTHY, journals: FRESH_JOURNAL })).toBe('review-rhythm');
  });

  it('counts any entry from today, not only the most recent one', () => {
    expect(pick({ moods: [mood(at(-10 * DAY)), mood(at(-9 * 3600000))], assessments: HEALTHY, journals: FRESH_JOURNAL })).toBe(
      'review-rhythm',
    );
  });
});

describe('pickRecommendation thresholds', () => {
  it(`treats exactly ${LOW_WELLNESS_SCORE} as not low`, () => {
    const args = { moods: MOOD_TODAY, journals: FRESH_JOURNAL };
    expect(pick({ ...args, assessments: [assessment(at(-1 * DAY), LOW_WELLNESS_SCORE - 1)] })).toBe('talk-to-manas');
    expect(pick({ ...args, assessments: [assessment(at(-1 * DAY), LOW_WELLNESS_SCORE)] })).toBe('review-rhythm');
    expect(pick({ ...args, assessments: [assessment(at(-1 * DAY), LOW_WELLNESS_SCORE + 1)] })).toBe('review-rhythm');
  });

  it(`treats a journal exactly ${RECENT_JOURNAL_DAYS} days old as recent`, () => {
    const cutoff = -RECENT_JOURNAL_DAYS * DAY;
    const args = { moods: MOOD_TODAY, assessments: HEALTHY };
    expect(pick({ ...args, journals: [journal(at(cutoff + 1000))] })).toBe('review-rhythm');
    expect(pick({ ...args, journals: [journal(at(cutoff))] })).toBe('review-rhythm');
    expect(pick({ ...args, journals: [journal(at(cutoff - 1000))] })).toBe('write-journal');
  });

  it('judges the newest assessment even when the array is not in date order', () => {
    // Buggy code reading assessments[0] would see 90 and skip talk-to-manas.
    const outOfOrder = [assessment(at(-9 * DAY), 90), assessment(at(-1 * DAY), 20)];
    expect(pick({ moods: MOOD_TODAY, assessments: outOfOrder, journals: FRESH_JOURNAL })).toBe('talk-to-manas');
  });
});

describe('assessment sorting and delta', () => {
  const unordered = [assessment(at(-1 * DAY), 60), assessment(at(-9 * DAY), 80), assessment(at(-5 * DAY), 45)];

  it('sorts oldest-first so the last two entries are previous and current', () => {
    expect(sortByCreatedAt(unordered).map(wellnessScore)).toEqual([80, 45, 60]);
  });

  it.each([
    ['positive', [45, 90], 45],
    ['zero', [45, 45], 0],
    ['negative', [90, 45], -45],
  ] as const)('computes a %s delta from the two newest assessments', (_name, [previous, latest], expected) => {
    // Newest first on input: the sort, not the array order, decides which is current.
    const sorted = sortByCreatedAt([assessment(at(0), latest), assessment(at(-1 * DAY), previous)]);
    expect(wellnessScore(sorted[sorted.length - 1]) - wellnessScore(sorted[sorted.length - 2])).toBe(expected);
  });

  it('has no previous assessment to compare against when only one exists', () => {
    const sorted = sortByCreatedAt([assessment(at(0), 60)]);
    expect(sorted[sorted.length - 2]).toBeUndefined();
  });
});
