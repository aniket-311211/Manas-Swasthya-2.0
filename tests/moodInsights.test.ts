import { describe, it, expect } from 'vitest';
import { MOODS, moodToScore, moodLabel, moodEmoji, sortByCreatedAt, withinDays, buildInsight } from '@/components/dashboard/moodInsights';
import type { MoodEntry } from '@/types/api';

const NOW = new Date('2026-07-13T12:00:00Z');
const DAY = 86400000;
const at = (msFromNow: number) => new Date(+NOW + msFromNow).toISOString();

const entry = (createdAt: string, mood = '3'): MoodEntry => ({
  id: createdAt,
  userId: 'u1',
  mood,
  notes: null,
  stress: null,
  anxiety: null,
  sleep: null,
  createdAt,
});

/** Nothing the insight text says may imply cause or clinical judgement. */
const CLINICAL = /because|caused|due to|diagnos|disorder|symptom|depress|anxiet|you should|treatment/i;

describe('moodToScore', () => {
  it('maps every emoji to its value', () => {
    expect(MOODS.map((m) => moodToScore(m.emoji))).toEqual([1, 2, 3, 4, 5]);
  });

  it('accepts numeric strings in range', () => {
    expect(['1', '2', '3', '4', '5'].map(moodToScore)).toEqual([1, 2, 3, 4, 5]);
  });

  it('falls back to neutral 3 for out-of-range, garbage and empty input', () => {
    for (const bad of ['0', '6', '-1', '99', '', ' ', 'banana', 'NaN', 'Infinity', '🤖']) {
      expect(moodToScore(bad), bad).toBe(3);
    }
  });

  it('never returns NaN', () => {
    for (const bad of ['', 'x', 'NaN', '😞', '4']) expect(Number.isNaN(moodToScore(bad))).toBe(false);
  });
});

describe('moodLabel / moodEmoji', () => {
  it('resolves emoji and numeric input to the same pair', () => {
    expect([moodLabel('😄'), moodEmoji('5')]).toEqual(['Great', '😄']);
    expect([moodLabel('1'), moodEmoji('😞')]).toEqual(['Very low', '😞']);
  });

  it('reads unknown input as neutral', () => {
    expect([moodLabel('banana'), moodEmoji('banana')]).toEqual(['Okay', '😐']);
  });
});

describe('sortByCreatedAt', () => {
  it('sorts oldest first without mutating the input', () => {
    const input = [entry(at(0)), entry(at(-2 * DAY)), entry(at(-1 * DAY))];
    const original = [...input];
    expect(sortByCreatedAt(input).map((e) => e.createdAt)).toEqual([at(-2 * DAY), at(-1 * DAY), at(0)]);
    expect(input).toEqual(original);
  });
});

describe('withinDays', () => {
  it.each([7, 14, 30] as const)('keeps entries at or after the %s-day cutoff and drops earlier ones', (days) => {
    const cutoff = -days * DAY;
    const kept = withinDays(
      [entry(at(cutoff + 1000)), entry(at(cutoff - 1000)), entry(at(cutoff)), entry(at(0))],
      days,
      NOW,
    );
    expect(kept.map((e) => e.createdAt)).toEqual([at(cutoff), at(cutoff + 1000), at(0)]);
  });

  it('returns oldest-first regardless of input order', () => {
    const shuffled = [entry(at(-1 * DAY)), entry(at(-5 * DAY)), entry(at(-3 * DAY))];
    expect(withinDays(shuffled, 7, NOW).map((e) => e.createdAt)).toEqual([at(-5 * DAY), at(-3 * DAY), at(-1 * DAY)]);
  });

  it('returns empty when everything is older than the window', () => {
    expect(withinDays([entry(at(-8 * DAY)), entry(at(-40 * DAY))], 7, NOW)).toEqual([]);
  });
});

describe('buildInsight', () => {
  const window = (moods: string[]) => moods.map((m, i) => entry(at(-(moods.length - i) * DAY), m));

  it('says nothing yet when the range is empty', () => {
    expect(buildInsight([entry(at(-30 * DAY))], 7, NOW)).toBe('No check-ins in this range yet.');
  });

  it('refuses a pattern below three entries', () => {
    expect(buildInsight(window(['1', '5']), 7, NOW)).toBe('There is not enough data for a pattern yet.');
  });

  it('reports steady when spread is tight', () => {
    expect(buildInsight(window(['4', '4', '4', '4', '4']), 7, NOW)).toBe(
      'Your check-ins have been steady over the last 7 days.',
    );
  });

  it('reports higher when the later half rises', () => {
    expect(buildInsight(window(['1', '1', '2', '4', '5']), 7, NOW)).toBe(
      'Your recent check-ins sit higher than your earlier ones this 7-day range.',
    );
  });

  it('reports lower when the later half falls', () => {
    expect(buildInsight(window(['5', '4', '2', '1', '1']), 14, NOW)).toBe(
      'Your recent check-ins sit lower than your earlier ones this 14-day range.',
    );
  });

  it('falls back to a count when it varies without a direction', () => {
    expect(buildInsight(window(['5', '1', '5', '1', '5']), 30, NOW)).toBe(
      'You logged 5 check-ins in the last 30 days, with some variation day to day.',
    );
  });

  it('sorts the window before comparing halves, so input order cannot flip the verdict', () => {
    const rising = window(['1', '1', '2', '4', '5']);
    expect(buildInsight([...rising].reverse(), 7, NOW)).toBe(buildInsight(rising, 7, NOW));
  });

  it('never uses causal or diagnostic language on any branch', () => {
    const outputs = [
      buildInsight([], 7, NOW),
      buildInsight(window(['1', '5']), 7, NOW),
      buildInsight(window(['4', '4', '4', '4', '4']), 7, NOW),
      buildInsight(window(['1', '1', '2', '4', '5']), 7, NOW),
      buildInsight(window(['5', '4', '2', '1', '1']), 7, NOW),
      buildInsight(window(['5', '1', '5', '1', '5']), 7, NOW),
    ];
    for (const text of outputs) expect(text, text).not.toMatch(CLINICAL);
  });
});
