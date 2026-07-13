import type { NextQuestionResult } from '@/types/api';

export interface AnsweredQuestion {
  question: string;
  answer: string;
  domain: string;
}

export type AssessmentPhase = 'intro' | 'question' | 'loading' | 'results' | 'error';

export interface AssessmentState {
  phase: AssessmentPhase;
  current: NextQuestionResult | null;
  answered: AnsweredQuestion[];
  scores: NonNullable<NextQuestionResult['scores']> | null;
  error: string | null;
}

export const initialState: AssessmentState = {
  phase: 'intro',
  current: null,
  answered: [],
  scores: null,
  error: null,
};

export type AssessmentAction =
  | { type: 'START' }
  | { type: 'ANSWER'; answer: string }
  | { type: 'QUESTION_LOADED'; result: NextQuestionResult }
  | { type: 'FAILED'; message: string }
  | { type: 'RETRY' }
  | { type: 'RESET' };

export function assessmentReducer(state: AssessmentState, action: AssessmentAction): AssessmentState {
  switch (action.type) {
    case 'START':
      return { ...initialState, phase: 'loading' };
    case 'ANSWER': {
      if (!state.current) return state;
      return {
        ...state,
        phase: 'loading',
        answered: [
          ...state.answered,
          { question: state.current.question, answer: action.answer, domain: state.current.domain },
        ],
        current: null,
      };
    }
    case 'QUESTION_LOADED': {
      if (action.result.isComplete && action.result.scores) {
        return { ...state, phase: 'results', scores: action.result.scores, current: null };
      }
      return { ...state, phase: 'question', current: action.result, error: null };
    }
    case 'FAILED':
      return { ...state, phase: 'error', error: action.message };
    case 'RETRY':
      return { ...state, phase: 'loading', error: null };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}
