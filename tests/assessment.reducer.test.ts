import { describe, it, expect } from 'vitest';
import { assessmentReducer, initialState } from '../src/features/assessment/reducer';
import type { NextQuestionResult } from '../src/types/api';

const q = (overrides: Partial<NextQuestionResult> = {}): NextQuestionResult => ({
  question: 'How is your sleep?',
  options: ['Great', 'Okay', 'Poor', 'Terrible'],
  domain: 'physical',
  isComplete: false,
  ...overrides,
});

describe('assessment reducer', () => {
  it('starts into loading', () => {
    const s = assessmentReducer(initialState, { type: 'START' });
    expect(s.phase).toBe('loading');
    expect(s.answered).toEqual([]);
  });

  it('moves to question when a question loads', () => {
    let s = assessmentReducer(initialState, { type: 'START' });
    s = assessmentReducer(s, { type: 'QUESTION_LOADED', result: q() });
    expect(s.phase).toBe('question');
    expect(s.current?.question).toBe('How is your sleep?');
  });

  it('records answer and returns to loading', () => {
    let s = assessmentReducer(initialState, { type: 'START' });
    s = assessmentReducer(s, { type: 'QUESTION_LOADED', result: q() });
    s = assessmentReducer(s, { type: 'ANSWER', answer: 'Okay' });
    expect(s.phase).toBe('loading');
    expect(s.answered).toHaveLength(1);
    expect(s.answered[0]).toEqual({ question: 'How is your sleep?', answer: 'Okay', domain: 'physical' });
  });

  it('completes into results when scores arrive', () => {
    let s = assessmentReducer(initialState, { type: 'START' });
    const scores = {
      stress: 40,
      anxiety: 35,
      sleep: 70,
      domainScores: { academic: 60 },
      riskLevel: 'low' as const,
      summary: 'Doing okay.',
      recommendations: ['Sleep more'],
    };
    s = assessmentReducer(s, { type: 'QUESTION_LOADED', result: q({ isComplete: true, scores }) });
    expect(s.phase).toBe('results');
    expect(s.scores?.riskLevel).toBe('low');
  });

  it('handles failure and retry', () => {
    let s = assessmentReducer(initialState, { type: 'START' });
    s = assessmentReducer(s, { type: 'FAILED', message: 'network' });
    expect(s.phase).toBe('error');
    s = assessmentReducer(s, { type: 'RETRY' });
    expect(s.phase).toBe('loading');
  });

  it('ignores ANSWER without a current question', () => {
    const s = assessmentReducer(initialState, { type: 'ANSWER', answer: 'x' });
    expect(s).toEqual(initialState);
  });
});
