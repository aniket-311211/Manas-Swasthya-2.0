import { aiAnalyzeMood } from '@/lib/ai';
import { detectCrisis } from '@/lib/crisis';
import { wordCount } from '../doc';
import { MOOD_META, type EmotionScore, type MoodAnalysis, type MoodKey } from '../types';

/**
 * Journal mood analysis: the transport call plus the coercion that keeps a
 * hallucinated field from reaching the UI.
 *
 * The server already validates and clamps the model's JSON. This normalises it
 * a second time on arrival because the two are separated by a network and a
 * deploy — `MOOD_META[mood]` must never be handed a key that does not exist.
 * Everything except `analyzeJournal` is pure, so it tests in the node env.
 */

/** Below this, the model is pattern-matching noise rather than reading you. */
export const MIN_WORDS_FOR_ANALYSIS = 25;

const MAX_EMOTIONS = 5;
const MAX_THEMES = 4;

export function canAnalyze(text: string): boolean {
  return wordCount(text) >= MIN_WORDS_FOR_ANALYSIS;
}

/** Words still needed before analysis is worth running. 0 once it is ready. */
export function wordsToGo(text: string): number {
  return Math.max(0, MIN_WORDS_FOR_ANALYSIS - wordCount(text));
}

export function clamp01(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(1, Math.max(0, value))
    : fallback;
}

/** Any unrecognised mood becomes 'neutral' rather than an undefined lookup. */
export function toMoodKey(value: unknown): MoodKey {
  return typeof value === 'string' && value in MOOD_META ? (value as MoodKey) : 'neutral';
}

/** How sure the model is of its reading — of the text, never of the person. */
export function confidenceLabel(confidence: number): string {
  if (confidence < 0.4) return 'a tentative read';
  if (confidence < 0.7) return 'a fair read';
  return 'a clear read';
}

function cleanText(value: unknown, max: number): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';
}

/** `generatedAt` is injectable so this stays pure and testable. */
export function normalizeAnalysis(
  raw: unknown,
  generatedAt: string = new Date().toISOString(),
): MoodAnalysis {
  const r = (raw ?? {}) as Record<string, unknown>;
  const emotions: EmotionScore[] = (Array.isArray(r.emotions) ? (r.emotions as unknown[]) : [])
    .map((entry) => {
      const e = (entry ?? {}) as Record<string, unknown>;
      return { emotion: cleanText(e.emotion, 32), score: clamp01(e.score) };
    })
    .filter((e) => e.emotion.length > 0)
    .slice(0, MAX_EMOTIONS);

  return {
    mood: toMoodKey(r.mood),
    confidence: clamp01(r.confidence, 0.5),
    emotions,
    themes: (Array.isArray(r.themes) ? (r.themes as unknown[]) : [])
      .map((t) => cleanText(t, 40))
      .filter(Boolean)
      .slice(0, MAX_THEMES),
    insight: cleanText(r.insight, 300),
    generatedAt: cleanText(r.generatedAt, 40) || generatedAt,
  };
}

/**
 * Sends the entry to Gemini through the existing endpoint and nowhere else.
 * `crisis` is true if either the server's scan or this one fires — the local
 * check also covers the case where the request itself failed on a later retry.
 */
export async function analyzeJournal(
  clerkId: string,
  text: string,
): Promise<MoodAnalysis & { crisis: boolean }> {
  if (!canAnalyze(text)) {
    throw new Error(`Write at least ${MIN_WORDS_FOR_ANALYSIS} words first.`);
  }
  const raw = await aiAnalyzeMood(clerkId, text);
  return {
    ...normalizeAnalysis(raw),
    crisis: raw?.crisis === true || detectCrisis(text),
  };
}
