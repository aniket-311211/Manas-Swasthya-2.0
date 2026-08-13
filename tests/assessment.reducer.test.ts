import { describe, it, expect } from 'vitest';
import {
  assessmentReducer,
  currentItem,
  initialState,
  toItems,
  type AssessmentState,
} from '@/features/assessment/reducer';
import type { AssessmentItem, Answer } from '@/features/assessment/domain';

const item = (id: string, domain: AssessmentItem['domain'] = 'emotional'): AssessmentItem => ({
  id,
  domain,
  prompt: `Prompt ${id}`,
  options: [
    { label: 'Great', weight: 1 },
    { label: 'Okay', weight: 0.66 },
    { label: 'Hard', weight: 0.33 },
    { label: 'Very hard', weight: 0 },
  ],
});

const answerFor = (it: AssessmentItem, weight = 1, ms = 1200): Answer => ({
  itemId: it.id,
  domain: it.domain,
  question: it.prompt,
  answer: 'Great',
  weight,
  ms,
});

const start = (n = 3): AssessmentState =>
  assessmentReducer(initialState, {
    type: 'START',
    items: Array.from({ length: n }, (_, i) => item(`i${i}`)),
  });

const answerAll = (s: AssessmentState): AssessmentState => {
  let out = s;
  for (let guard = 0; guard < 50; guard += 1) {
    const cur = currentItem(out);
    if (!cur) break;
    out = assessmentReducer(out, { type: 'ANSWER', answer: answerFor(cur) });
  }
  return out;
};

describe('START', () => {
  it('opens the bank and shows the first question', () => {
    const s = start();
    expect(s.phase).toBe('asking');
    expect(s.items).toHaveLength(3);
    expect(currentItem(s)?.id).toBe('i0');
  });

  it('errors rather than running an assessment with no questions', () => {
    for (const items of [[], undefined as unknown as AssessmentItem[]]) {
      const s = assessmentReducer(initialState, { type: 'START', items });
      expect(s.phase).toBe('error');
      expect(s.error).toBeTruthy();
    }
  });

  it('clears anything left from a previous run', () => {
    const done = answerAll(start(1));
    const scored = assessmentReducer(done, { type: 'SCORE' });
    const again = assessmentReducer(scored, { type: 'START', items: [item('fresh')] });
    expect(again.answers).toEqual([]);
    expect(again.scores).toBeNull();
    expect(again.summary).toBeNull();
  });
});

describe('ANSWER', () => {
  it('accumulates answers with their timing and advances', () => {
    const s = assessmentReducer(start(), { type: 'ANSWER', answer: answerFor(item('i0'), 0.66, 2500) });
    expect(s.answers).toHaveLength(1);
    expect(s.answers[0].ms).toBe(2500);
    expect(s.answers[0].weight).toBe(0.66);
    expect(currentItem(s)?.id).toBe('i1');
  });

  it('is ignored outside a question phase', () => {
    const s = assessmentReducer(initialState, { type: 'ANSWER', answer: answerFor(item('x')) });
    expect(s).toEqual(initialState);
  });

  it('goes to scoring after the last bank item when no follow-ups landed', () => {
    const s = answerAll(start(2));
    expect(s.phase).toBe('scoring');
    expect(s.answers).toHaveLength(2);
  });

  it('goes into follow-ups when they arrived in time', () => {
    let s = start(2);
    s = assessmentReducer(s, {
      type: 'FOLLOWUPS_READY',
      questions: [{ question: 'And how is sleep?', options: ['Fine', 'Rough'], domain: 'physical' }],
    });
    s = answerAll(s);
    // Two bank answers plus the one follow-up, then scoring.
    expect(s.answers).toHaveLength(3);
    expect(s.phase).toBe('scoring');
  });
});

describe('FOLLOWUPS_READY', () => {
  it('is dropped when it arrives after the student has moved on', () => {
    const done = answerAll(start(1));
    const late = assessmentReducer(done, {
      type: 'FOLLOWUPS_READY',
      questions: [{ question: 'Late', options: ['a', 'b'], domain: 'social' }],
    });
    expect(late.followUps).toEqual([]);
    expect(late.phase).toBe('scoring');
  });

  it('ignores an empty or unusable payload rather than stalling', () => {
    const s = start();
    for (const questions of [[], [{ question: '', options: ['a', 'b'], domain: 'social' }]]) {
      const out = assessmentReducer(s, {
        type: 'FOLLOWUPS_READY',
        questions: questions as never,
      });
      expect(out.followUps).toEqual([]);
    }
  });
});

describe('toItems — model output is never trusted', () => {
  it('drops questions with no prompt or fewer than two options', () => {
    expect(
      toItems([
        { question: '', options: ['a', 'b'], domain: 'social' },
        { question: 'Only one', options: ['a'], domain: 'social' },
      ] as never),
    ).toEqual([]);
  });

  it('survives non-array and malformed input', () => {
    for (const bad of [null, undefined, 'text', 42, {}]) {
      expect(toItems(bad as never)).toEqual([]);
    }
  });

  it('falls back to a real domain when the model invents one', () => {
    const [only] = toItems([{ question: 'Q', options: ['a', 'b'], domain: 'vibes' }] as never);
    expect(only.domain).toBe('emotional');
  });

  it('spreads weights from 1 down to 0 so follow-ups share the bank scale', () => {
    const [only] = toItems([{ question: 'Q', options: ['a', 'b', 'c'], domain: 'social' }] as never);
    expect(only.options.map((o) => o.weight)).toEqual([1, 0.5, 0]);
  });
});

describe('SCORE', () => {
  it('produces scores and moves to results', () => {
    const s = assessmentReducer(answerAll(start(2)), { type: 'SCORE' });
    expect(s.phase).toBe('results');
    expect(s.scores).not.toBeNull();
    expect(s.scores!.overall).toBeGreaterThanOrEqual(0);
    expect(s.scores!.overall).toBeLessThanOrEqual(100);
  });

  it('never scores an empty answer set', () => {
    const empty: AssessmentState = { ...initialState, phase: 'scoring' };
    expect(assessmentReducer(empty, { type: 'SCORE' })).toEqual(empty);
  });

  it('is ignored outside the scoring phase', () => {
    const s = start();
    expect(assessmentReducer(s, { type: 'SCORE' })).toEqual(s);
  });
});

describe('SUMMARY', () => {
  it('slots prose in after the numbers', () => {
    const scored = assessmentReducer(answerAll(start(1)), { type: 'SCORE' });
    const s = assessmentReducer(scored, { type: 'SUMMARY', summary: 'Warm words.', recommendations: ['Walk'] });
    expect(s.summary).toBe('Warm words.');
    expect(s.recommendations).toEqual(['Walk']);
    expect(s.scores).toEqual(scored.scores);
  });

  it('is ignored before results exist', () => {
    const s = start();
    expect(assessmentReducer(s, { type: 'SUMMARY', summary: 'x', recommendations: [] })).toEqual(s);
  });
});

describe('FAILED and RESET', () => {
  it('records the failure message', () => {
    const s = assessmentReducer(start(), { type: 'FAILED', message: 'Network down' });
    expect(s.phase).toBe('error');
    expect(s.error).toBe('Network down');
  });

  it('returns to a clean slate', () => {
    expect(assessmentReducer(answerAll(start(2)), { type: 'RESET' })).toEqual(initialState);
  });
});

describe('currentItem', () => {
  it('is null when no question is on screen', () => {
    expect(currentItem(initialState)).toBeNull();
    expect(currentItem({ ...initialState, phase: 'results' })).toBeNull();
  });
});
