import type { FollowUpQuestion } from '@/lib/ai';
import { DOMAINS, type Answer, type AssessmentItem, type AssessmentScores, type Domain } from './domain';
import { scoreAnswers } from './scoring';

/**
 * The assessment as a state machine.
 *
 * Six phases, and the important one is what is NOT here: there is no "waiting
 * for the next question". The 12 bank items are handed in whole at START, so
 * every answer moves straight to the next question with nothing in between.
 *
 * The AI follow-ups are prefetched while the student is still on the bank and
 * arrive as FOLLOWUPS_READY. If they never arrive — slow, failed, rate-limited,
 * or the model returned junk — `followUps` stays empty and the last bank answer
 * routes to 'scoring' instead. That is why there is no SKIP action and no
 * timeout in here: absent follow-ups are the ordinary case, not an error.
 *
 * Pure: no clock, no network, no randomness. `pickSession()` is called by the
 * caller and passed in, which is what keeps this unit-testable.
 */

export type AssessmentPhase = 'intro' | 'asking' | 'followups' | 'scoring' | 'results' | 'error';

export interface AssessmentState {
  phase: AssessmentPhase;
  /** The local bank session. */
  items: AssessmentItem[];
  /** Personalised follow-ups, already normalised to item shape. Empty is normal. */
  followUps: AssessmentItem[];
  /** Position inside whichever list the current phase is reading. */
  index: number;
  answers: Answer[];
  scores: AssessmentScores | null;
  /** null until the written reflection lands — the numbers never wait for it. */
  summary: string | null;
  recommendations: string[];
  error: string | null;
}

export const initialState: AssessmentState = {
  phase: 'intro',
  items: [],
  followUps: [],
  index: 0,
  answers: [],
  scores: null,
  summary: null,
  recommendations: [],
  error: null,
};

export type AssessmentAction =
  | { type: 'START'; items: AssessmentItem[] }
  | { type: 'ANSWER'; answer: Answer }
  | { type: 'FOLLOWUPS_READY'; questions: FollowUpQuestion[] }
  | { type: 'SCORE' }
  | { type: 'SUMMARY'; summary: string; recommendations: string[] }
  | { type: 'FAILED'; message: string }
  | { type: 'RESET' };

const isDomain = (v: unknown): v is Domain => (DOMAINS as readonly string[]).includes(v as string);

/**
 * Model output → bank-shaped items. Options arrive ordered most-positive first,
 * so evenly spaced weights 1 → 0 give a follow-up the same scale as every bank
 * item; nothing downstream has to know where a question came from.
 *
 * The server cleans this too. It is repeated here because a reducer that trusts
 * a language model's JSON is one bad response away from `undefined.label` on
 * screen.
 */
export function toItems(questions: FollowUpQuestion[]): AssessmentItem[] {
  if (!Array.isArray(questions)) return [];
  const out: AssessmentItem[] = [];
  for (const q of questions.slice(0, 4)) {
    const prompt = typeof q?.question === 'string' ? q.question.trim() : '';
    const options = Array.isArray(q?.options) ? q.options.filter((o) => typeof o === 'string' && o.trim() !== '') : [];
    // Two is the minimum that makes a scale; one option would divide by zero.
    if (prompt === '' || options.length < 2) continue;
    out.push({
      id: `followup-${out.length}`,
      domain: isDomain(q.domain) ? q.domain : 'emotional',
      prompt,
      options: options.map((label, i) => ({ label, weight: 1 - i / (options.length - 1) })),
    });
  }
  return out;
}

/** The question on screen, or null when the phase is not asking one. */
export function currentItem(state: AssessmentState): AssessmentItem | null {
  if (state.phase === 'asking') return state.items[state.index] ?? null;
  if (state.phase === 'followups') return state.followUps[state.index] ?? null;
  return null;
}

export function assessmentReducer(state: AssessmentState, action: AssessmentAction): AssessmentState {
  switch (action.type) {
    case 'START':
      // An empty session means the bank could not be read at all — there is no
      // assessment to run, and pretending otherwise scores an empty answer set.
      if (!Array.isArray(action.items) || action.items.length === 0) {
        return { ...initialState, phase: 'error', error: 'We could not load the questions.' };
      }
      return { ...initialState, phase: 'asking', items: action.items };

    case 'ANSWER': {
      if (state.phase !== 'asking' && state.phase !== 'followups') return state;
      const list = state.phase === 'asking' ? state.items : state.followUps;
      if (!list[state.index]) return state;

      const answers = [...state.answers, action.answer];
      const next = state.index + 1;
      if (next < list.length) return { ...state, answers, index: next };
      // Bank finished: into the follow-ups only if they actually landed in time.
      if (state.phase === 'asking' && state.followUps.length > 0) {
        return { ...state, answers, phase: 'followups', index: 0 };
      }
      return { ...state, answers, phase: 'scoring', index: next };
    }

    case 'FOLLOWUPS_READY': {
      // A late arrival, after the student has already moved on, is dropped.
      if (state.phase !== 'asking') return state;
      const followUps = toItems(action.questions);
      return followUps.length > 0 ? { ...state, followUps } : state;
    }

    case 'SCORE':
      // Scoring an empty answer set would publish a number nobody produced.
      if (state.phase !== 'scoring' || state.answers.length === 0) return state;
      return { ...state, phase: 'results', scores: scoreAnswers(state.answers), error: null };

    case 'SUMMARY':
      if (state.phase !== 'results') return state;
      return { ...state, summary: action.summary, recommendations: action.recommendations };

    case 'FAILED':
      return { ...state, phase: 'error', error: action.message };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}
