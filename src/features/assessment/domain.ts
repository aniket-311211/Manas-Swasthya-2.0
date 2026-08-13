/**
 * Assessment domain contracts.
 *
 * THE MODEL, and why it changed: the old flow asked Gemini for all 12 questions
 * one at a time, blocking on each. That made it slow AND made the result
 * unrepeatable — different questions every run, so two assessments a week apart
 * were not comparable and a "trend" was meaningless.
 *
 * Now: a fixed bank of items answers instantly and scores deterministically, so
 * the same questions produce the same numbers and retakes are genuinely
 * comparable. AI is used where it is actually good — a few personalised
 * follow-ups and the written summary — not for generating a measuring stick.
 *
 * NOT A CLINICAL INSTRUMENT. These items are written for this product. They are
 * deliberately NOT reproductions of PHQ-9, GAD-7 or any validated scale: those
 * are licensed, and copying them would imply a diagnostic claim this app must
 * never make. Wording is original and the output is a reflection, never a score
 * against a clinical threshold.
 */

export const DOMAINS = ['academic', 'social', 'emotional', 'behavioral', 'cognitive', 'physical'] as const;
export type Domain = (typeof DOMAINS)[number];

export const DOMAIN_META: Record<Domain, { label: string; blurb: string }> = {
  academic: { label: 'Academic', blurb: 'Coursework, exams, placements' },
  social: { label: 'Social', blurb: 'Friends, family, belonging' },
  emotional: { label: 'Emotional', blurb: 'Mood and how it moves' },
  behavioral: { label: 'Behavioural', blurb: 'Habits, routine, avoidance' },
  cognitive: { label: 'Cognitive', blurb: 'Focus, memory, overthinking' },
  physical: { label: 'Physical', blurb: 'Sleep, energy, appetite' },
};

/**
 * Options run most-positive → most-concerning. `weight` is the wellbeing value
 * of that answer, 0–1, where 1 is doing well. Keeping the direction consistent
 * across every item is what makes summing them defensible.
 */
export interface ItemOption {
  label: string;
  weight: number;
}

export interface AssessmentItem {
  id: string;
  domain: Domain;
  prompt: string;
  options: ItemOption[];
  /** Items that speak to stress / anxiety / sleep feed those headline numbers. */
  facets?: ('stress' | 'anxiety' | 'sleep')[];
}

/** One answer, with how long it took. */
export interface Answer {
  itemId: string;
  domain: Domain;
  question: string;
  answer: string;
  weight: number;
  /** Milliseconds from render to choice. Reflection only — never a penalty. */
  ms: number;
}

export interface DomainScore {
  domain: Domain;
  /** 0–100 wellbeing, higher is better. */
  score: number;
  answered: number;
}

export interface AssessmentScores {
  /** 0–100, higher = more stressed. */
  stress: number;
  /** 0–100, higher = more anxious. */
  anxiety: number;
  /** 0–100, higher = better sleep. */
  sleep: number;
  domainScores: Record<Domain, number>;
  /** 0–100 wellbeing, the headline. */
  overall: number;
  riskLevel: 'low' | 'moderate' | 'high';
}

/** Shape stored in the `answers` JSON column of an assessment row. */
export interface StoredAnswers {
  v: 2;
  responses: Answer[];
  domainScores: Record<Domain, number>;
  overall: number;
  riskLevel: AssessmentScores['riskLevel'];
  summary: string;
  recommendations: string[];
  /** Median answer time, for the pace reflection. */
  medianMs?: number;
}
