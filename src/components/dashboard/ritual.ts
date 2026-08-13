import type { JournalEntry, MoodEntry } from '@/types/api';

/**
 * The daily ritual: set one intention in the morning, check in during the day,
 * and say whether the intention happened in the evening.
 *
 * Intentions are stored as journal entries tagged `intention`; the outcome is a
 * second tag on the same entry. No new endpoint — createJournal/updateJournal
 * already accept tags.
 *
 * Everything here is pure and clock-injectable so the phase rules can be tested.
 */

export const INTENTION_TAG = 'intention';
export const RESOLUTIONS = ['done', 'partly', 'missed'] as const;
export type Resolution = (typeof RESOLUTIONS)[number];

/** Before this hour the hero asks for an intention. */
export const MORNING_END_HOUR = 12;
/** From this hour the hero asks how the intention went. */
export const EVENING_HOUR = 17;

export type RitualPhase =
  | { kind: 'intention' }
  | { kind: 'checkin' }
  | { kind: 'reflect'; entry: JournalEntry }
  | { kind: 'settled'; intention: JournalEntry | null };

export function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}

/** Newest intention logged today, or null. */
export function todaysIntention(journals: JournalEntry[], now: Date = new Date()): JournalEntry | null {
  const today = journals.filter(
    (j) => j.tags?.includes(INTENTION_TAG) && isSameLocalDay(new Date(j.createdAt), now),
  );
  if (today.length === 0) return null;
  return today.reduce((a, b) => (+new Date(a.createdAt) >= +new Date(b.createdAt) ? a : b));
}

export function resolutionOf(entry: JournalEntry | null): Resolution | null {
  if (!entry) return null;
  return RESOLUTIONS.find((r) => entry.tags?.includes(r)) ?? null;
}

export function hasMoodToday(moods: MoodEntry[], now: Date = new Date()): boolean {
  return moods.some((m) => isSameLocalDay(new Date(m.createdAt), now));
}

/**
 * Which single thing the hero should ask for. First match wins — the hero shows
 * exactly one action at a time.
 */
export function pickRitual(args: {
  moods: MoodEntry[];
  journals: JournalEntry[];
  now?: Date;
}): RitualPhase {
  const { moods, journals, now = new Date() } = args;
  const hour = now.getHours();
  const intention = todaysIntention(journals, now);
  const resolved = resolutionOf(intention) !== null;

  if (hour >= EVENING_HOUR && intention && !resolved) return { kind: 'reflect', entry: intention };
  if (hour < MORNING_END_HOUR && !intention) return { kind: 'intention' };
  if (!hasMoodToday(moods, now)) return { kind: 'checkin' };
  if (hour < EVENING_HOUR && !intention) return { kind: 'intention' };
  return { kind: 'settled', intention };
}

export type SkyName = 'night' | 'dawn' | 'day' | 'dusk';

export function skyNameFor(now: Date = new Date()): SkyName {
  const h = now.getHours();
  if (h < 6) return 'night';
  if (h < MORNING_END_HOUR) return 'dawn';
  if (h < EVENING_HOUR) return 'day';
  if (h < 21) return 'dusk';
  return 'night';
}

/** Gradient + sun position for the hero backdrop. */
export const SKIES: Record<SkyName, { gradient: string; sun: string; sunTop: string }> = {
  dawn: {
    gradient: 'linear-gradient(105deg,#1B2430 0%,#2E3A59 44%,#8C7BA6 78%,#E3A87C 100%)',
    sun: 'radial-gradient(circle,#FDEBC8 0%,#F3C48C 45%,transparent 72%)',
    sunTop: '-2rem',
  },
  day: {
    gradient: 'linear-gradient(105deg,#141C28 0%,#1B2430 28%,#2E3A59 64%,#5B6C93 100%)',
    sun: 'radial-gradient(circle,#FBF0D2 0%,#F6D9A6 45%,transparent 72%)',
    sunTop: '-6rem',
  },
  dusk: {
    gradient: 'linear-gradient(105deg,#141C28 0%,#2A2740 40%,#5B4A6E 74%,#C77B6B 100%)',
    sun: 'radial-gradient(circle,#F7D3B0 0%,#D98F6E 45%,transparent 72%)',
    sunTop: '2rem',
  },
  night: {
    gradient: 'linear-gradient(105deg,#0E1420 0%,#141C28 40%,#1B2430 72%,#33405E 100%)',
    sun: 'radial-gradient(circle,#D7DEF0 0%,#8E9BC0 45%,transparent 72%)',
    sunTop: '-4rem',
  },
};

export function greetingFor(now: Date = new Date()): string {
  const h = now.getHours();
  if (h < 5) return 'Still up';
  if (h < MORNING_END_HOUR) return 'Good morning';
  if (h < EVENING_HOUR) return 'Good afternoon';
  return 'Good evening';
}

export const RESOLUTION_COPY: Record<Resolution, string> = {
  done: 'You did it',
  partly: 'You got part of the way',
  missed: 'It did not happen today',
};
