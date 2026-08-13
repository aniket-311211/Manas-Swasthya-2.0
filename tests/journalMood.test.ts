import { describe, it, expect } from 'vitest';
import {
  MIN_WORDS_FOR_ANALYSIS,
  canAnalyze,
  clamp01,
  confidenceLabel,
  normalizeAnalysis,
  toMoodKey,
  wordsToGo,
} from '@/features/journal/ai/moodAnalysis';
import { MOOD_META } from '@/features/journal/types';

const words = (n: number) => 'word '.repeat(n).trim();

describe('analysis gate', () => {
  it('refuses text below the floor and allows it at the floor', () => {
    expect(canAnalyze(words(MIN_WORDS_FOR_ANALYSIS - 1))).toBe(false);
    expect(canAnalyze(words(MIN_WORDS_FOR_ANALYSIS))).toBe(true);
    expect(canAnalyze('')).toBe(false);
  });

  it('reports how many words are still needed, never negative', () => {
    expect(wordsToGo(words(5))).toBe(MIN_WORDS_FOR_ANALYSIS - 5);
    expect(wordsToGo(words(MIN_WORDS_FOR_ANALYSIS + 20))).toBe(0);
  });
});

describe('clamp01', () => {
  it('clamps, and falls back for anything non-numeric', () => {
    expect(clamp01(0.5)).toBe(0.5);
    expect(clamp01(4)).toBe(1);
    expect(clamp01(-2)).toBe(0);
    expect(clamp01('nope', 0.5)).toBe(0.5);
    expect(clamp01(NaN, 0.3)).toBe(0.3);
    expect(clamp01(undefined, 0.5)).toBe(0.5);
  });
});

describe('toMoodKey', () => {
  it('accepts the six real keys', () => {
    for (const key of Object.keys(MOOD_META)) expect(toMoodKey(key)).toBe(key);
  });

  it('coerces anything else to neutral — a hallucinated key must not crash MOOD_META', () => {
    for (const bad of ['ecstatic', '', null, undefined, 42, {}]) {
      const key = toMoodKey(bad);
      expect(MOOD_META[key]).toBeDefined();
      expect(key).toBe('neutral');
    }
  });
});

describe('normalizeAnalysis', () => {
  it('passes a well-formed payload through', () => {
    const out = normalizeAnalysis(
      {
        mood: 'calm',
        confidence: 0.72,
        emotions: [{ emotion: 'settled', score: 0.6 }],
        themes: ['rest'],
        insight: 'A steady evening.',
      },
      'T',
    );
    expect(out.mood).toBe('calm');
    expect(out.confidence).toBeCloseTo(0.72);
    expect(out.themes).toEqual(['rest']);
    expect(out.generatedAt).toBe('T');
  });

  it('survives garbage from the model without throwing', () => {
    for (const bad of [null, undefined, 'text', 42, [], {}]) {
      const out = normalizeAnalysis(bad, 'T');
      expect(MOOD_META[out.mood]).toBeDefined();
      expect(out.confidence).toBeGreaterThanOrEqual(0);
      expect(out.confidence).toBeLessThanOrEqual(1);
      expect(Array.isArray(out.emotions)).toBe(true);
      expect(Array.isArray(out.themes)).toBe(true);
      expect(typeof out.insight).toBe('string');
    }
  });

  it('clamps out-of-range emotion scores and drops malformed entries', () => {
    const out = normalizeAnalysis(
      {
        mood: 'happy',
        confidence: 9,
        emotions: [
          { emotion: 'joy', score: 5 },
          { emotion: 'dread', score: -1 },
          'not an emotion',
          { score: 0.5 },
        ],
        themes: ['ok', 123, null],
      },
      'T',
    );
    expect(out.confidence).toBe(1);
    for (const e of out.emotions) {
      expect(typeof e.emotion).toBe('string');
      expect(e.score).toBeGreaterThanOrEqual(0);
      expect(e.score).toBeLessThanOrEqual(1);
    }
    for (const t of out.themes) expect(typeof t).toBe('string');
  });
});

describe('confidenceLabel', () => {
  it('returns prose across the range and never mentions certainty about the person', () => {
    for (const c of [0, 0.3, 0.5, 0.8, 1]) {
      const label = confidenceLabel(c);
      expect(typeof label).toBe('string');
      expect(label.length).toBeGreaterThan(0);
      expect(label.toLowerCase()).not.toContain('diagnos');
    }
  });
});
