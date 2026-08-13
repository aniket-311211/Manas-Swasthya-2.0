import { DOMAINS, type Answer, type AssessmentScores, type Domain, type DomainScore } from './domain';
import { ITEMS } from './itemBank';

/**
 * Deterministic scoring. Pure functions, no clock, no network, no randomness —
 * the same answers always produce the same numbers, which is the whole point of
 * replacing the AI-generated questionnaire.
 *
 * Direction, once, so nobody has to re-derive it: every `weight` is WELLBEING,
 * 0–1, higher is better. `sleep` is reported in that same direction (higher =
 * better sleep). `stress` and `anxiety` are reported INVERTED (higher = more
 * stressed / more anxious), because that is what the DB columns and the
 * dashboard have always meant.
 *
 * A domain or facet with no answers scores a NEUTRAL 50 rather than 0. Zero
 * would read as "worst possible" for a question the student was never asked;
 * `AssessmentScores.domainScores` is a total record so omitting is not an
 * option the contract allows.
 */

const FACETS = new Map(ITEMS.map((i) => [i.id, i.facets ?? []]));

const NEUTRAL = 50;

/** Mean weight → 0–100 wellbeing. Empty means "not asked", not "zero". */
function meanPct(weights: number[]): number {
  if (weights.length === 0) return NEUTRAL;
  return Math.round((weights.reduce((sum, w) => sum + w, 0) / weights.length) * 100);
}

/** Wellbeing for one facet. Follow-up answers are not in the bank, so they carry no facet and do not move these. */
function facetPct(answers: Answer[], facet: 'stress' | 'anxiety' | 'sleep'): number {
  return meanPct(answers.filter((a) => FACETS.get(a.itemId)?.includes(facet)).map((a) => a.weight));
}

export function domainBreakdown(answers: Answer[]): DomainScore[] {
  return DOMAINS.map((domain) => {
    const weights = answers.filter((a) => a.domain === domain).map((a) => a.weight);
    return { domain, score: meanPct(weights), answered: weights.length };
  });
}

export function scoreAnswers(answers: Answer[]): AssessmentScores {
  const stress = 100 - facetPct(answers, 'stress');
  const anxiety = 100 - facetPct(answers, 'anxiety');
  const sleep = facetPct(answers, 'sleep');

  const domainScores = {} as Record<Domain, number>;
  for (const d of domainBreakdown(answers)) domainScores[d.domain] = d.score;

  // Character-for-character the dashboard's wellnessScore() in src/lib/wellness.ts.
  // Both read the same three integers, so the assessment screen and the wellness
  // card can never show two different headline numbers.
  const overall = Math.round((100 - stress + (100 - anxiety) + sleep) / 3);

  return { stress, anxiety, sleep, domainScores, overall, riskLevel: riskFrom(overall, stress, anxiety) };
}

/**
 * Banding for tone, not triage. 'high' widens the safety net (helplines, a
 * nudge toward a counsellor); it is never shown as a diagnosis.
 */
export function riskFrom(overall: number, stress: number, anxiety: number): 'low' | 'moderate' | 'high' {
  if (overall < 40 || stress >= 75 || anxiety >= 75) return 'high';
  if (overall < 65 || stress >= 55 || anxiety >= 55) return 'moderate';
  return 'low';
}

export function medianMs(answers: Answer[]): number {
  const ms = answers.map((a) => a.ms).sort((a, b) => a - b);
  if (ms.length === 0) return 0;
  const mid = ms.length >> 1;
  return ms.length % 2 === 1 ? ms[mid] : Math.round((ms[mid - 1] + ms[mid]) / 2);
}

/**
 * Latency as a gentle observation and nothing more. Returns null unless the
 * emotional questions clearly took longer than the rest — no signal, no line.
 * Never framed as slowness, indecision or a deficit.
 */
export function paceReflection(answers: Answer[]): string | null {
  const emotional = answers.filter((a) => a.domain === 'emotional');
  const rest = answers.filter((a) => a.domain !== 'emotional');
  if (emotional.length < 2 || rest.length < 2) return null;

  const here = medianMs(emotional);
  const elsewhere = medianMs(rest);
  if (elsewhere <= 0) return null;
  if (here < elsewhere * 1.5 || here - elsewhere < 2000) return null;

  return 'You took your time on the questions about how you have been feeling. Those are usually the harder ones to put into words.';
}
