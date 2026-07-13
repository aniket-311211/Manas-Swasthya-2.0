import { describe, it, expect } from 'vitest';
import { calcStreak } from '../src/lib/streak';

const day = (offset: number, base = new Date('2026-07-13T12:00:00')) => {
  const d = new Date(base);
  d.setDate(d.getDate() + offset);
  return d;
};

const NOW = new Date('2026-07-13T15:00:00');

describe('calcStreak', () => {
  it('returns 0 for no entries', () => {
    expect(calcStreak([], NOW)).toBe(0);
  });

  it('counts consecutive days including today', () => {
    expect(calcStreak([day(0), day(-1), day(-2)], NOW)).toBe(3);
  });

  it('keeps streak alive if today not yet logged', () => {
    expect(calcStreak([day(-1), day(-2)], NOW)).toBe(2);
  });

  it('breaks on a gap', () => {
    expect(calcStreak([day(0), day(-2), day(-3)], NOW)).toBe(1);
  });

  it('returns 0 when last entry older than yesterday', () => {
    expect(calcStreak([day(-3), day(-4)], NOW)).toBe(0);
  });

  it('deduplicates multiple entries on the same day', () => {
    expect(calcStreak([day(0), day(0), day(-1)], NOW)).toBe(2);
  });
});
