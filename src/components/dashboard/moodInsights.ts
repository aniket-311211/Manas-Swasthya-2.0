import type { MoodEntry } from '@/types/api';

export const MOODS = [
  { value: 1, emoji: '😞', label: 'Very low' },
  { value: 2, emoji: '🙁', label: 'Low' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😄', label: 'Great' },
] as const;

export type MoodValue = (typeof MOODS)[number]['value'];
export type MoodRange = 7 | 14 | 30;

/** Emoji or numeric string -> 1..5. Unknown input reads as neutral. */
export function moodToScore(mood: string): number {
  const found = MOODS.find((m) => m.emoji === mood);
  if (found) return found.value;
  const parsed = Number(mood);
  return Number.isFinite(parsed) && parsed >= 1 && parsed <= 5 ? parsed : 3;
}

export function moodLabel(mood: string): string {
  return MOODS.find((m) => m.value === moodToScore(mood))?.label ?? 'Okay';
}

export function sortByCreatedAt<T extends { createdAt: string }>(entries: T[]): T[] {
  return [...entries].sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
}

/** Entries within the last `days` days, oldest first. */
export function withinDays(entries: MoodEntry[], days: MoodRange, now: Date = new Date()): MoodEntry[] {
  const cutoff = +now - days * 86400000;
  return sortByCreatedAt(entries.filter((e) => +new Date(e.createdAt) >= cutoff));
}

function mean(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/**
 * Plain-language observation. Describes counts and spread only — never cause,
 * never diagnosis.
 * ponytail: population stddev, no sampling correction — the sample is the data.
 */
export function buildInsight(entries: MoodEntry[], days: MoodRange, now: Date = new Date()): string {
  const window = withinDays(entries, days, now);
  if (window.length === 0) return 'No check-ins in this range yet.';
  if (window.length < 3) return 'There is not enough data for a pattern yet.';

  const scores = window.map((e) => moodToScore(e.mood));
  const avg = mean(scores);
  const spread = Math.sqrt(mean(scores.map((s) => (s - avg) ** 2)));

  const half = Math.floor(window.length / 2);
  const earlier = mean(scores.slice(0, half));
  const later = mean(scores.slice(-half));

  if (spread < 0.6) return `Your check-ins have been steady over the last ${days} days.`;
  if (later - earlier >= 0.75) return `Your recent check-ins sit higher than your earlier ones this ${days}-day range.`;
  if (earlier - later >= 0.75) return `Your recent check-ins sit lower than your earlier ones this ${days}-day range.`;
  return `You logged ${window.length} check-ins in the last ${days} days, with some variation day to day.`;
}

/** Emoji for a raw mood value ('😄' or '5'). Unknown input reads as neutral. */
export function moodEmoji(mood: string): string {
  return MOODS.find((m) => m.value === moodToScore(mood))?.emoji ?? '😐';
}
