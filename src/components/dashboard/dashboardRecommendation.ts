import type { Assessment, JournalEntry, MoodEntry } from '@/types/api';
import { wellnessScore } from '@/lib/wellness';
import { sortByCreatedAt } from './moodInsights';

/** Reflection cue for nudging toward support. Not a clinical cutoff. */
export const LOW_WELLNESS_SCORE = 45;
/** A journal entry older than this many days no longer counts as recent. */
export const RECENT_JOURNAL_DAYS = 7;

const DAY_MS = 86400000;

export interface RecommendationInput {
  moods: MoodEntry[];
  assessments: Assessment[];
  journals: JournalEntry[];
  now?: Date;
}

export interface Recommendation {
  /** One of: check-in | first-assessment | talk-to-manas | write-journal | review-rhythm */
  id: string;
  title: string;
  reason: string;
  ctaLabel: string;
  /** An existing route, or an in-page anchor the dashboard attaches. */
  href: string;
}

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

/** Deterministic, first match wins. Order matches the dashboard plan. */
export function pickRecommendation({
  moods,
  assessments,
  journals,
  now = new Date(),
}: RecommendationInput): Recommendation {
  if (!moods.some((m) => sameDay(new Date(m.createdAt), now))) {
    return {
      id: 'check-in',
      title: 'Check in with today',
      reason: 'You have not logged how you are feeling today.',
      ctaLabel: 'Check in now',
      href: '#today',
    };
  }

  if (assessments.length === 0) {
    return {
      id: 'first-assessment',
      title: 'Take your first assessment',
      reason: 'A short assessment gives your check-ins some context.',
      ctaLabel: 'Start assessment',
      href: '/assessment',
    };
  }

  const sorted = sortByCreatedAt(assessments);
  if (wellnessScore(sorted[sorted.length - 1]) < LOW_WELLNESS_SCORE) {
    return {
      id: 'talk-to-manas',
      title: 'Talk it through with Manas',
      reason: 'Your last reflection sat on the lower side. Talking can help.',
      ctaLabel: 'Open chat',
      href: '/chat',
    };
  }

  const cutoff = +now - RECENT_JOURNAL_DAYS * DAY_MS;
  if (!journals.some((j) => +new Date(j.createdAt) >= cutoff)) {
    return {
      id: 'write-journal',
      title: 'Write a short reflection',
      reason: `You have not journalled in the last ${RECENT_JOURNAL_DAYS} days.`,
      ctaLabel: 'Open journal',
      href: '/journal',
    };
  }

  return {
    id: 'review-rhythm',
    title: 'Review your mood rhythm',
    reason: 'You are up to date. Take a look at how the last few weeks read.',
    ctaLabel: 'View rhythm',
    href: '#rhythm',
  };
}
