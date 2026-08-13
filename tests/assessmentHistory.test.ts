import { describe, it, expect } from 'vitest';
import type { Assessment } from '@/types/api';
import { wellnessScore } from '@/lib/wellness';
import { toPast, compare, trendSeries, type PastAssessment } from '@/features/assessment/history';

/** Only the fields toPast reads; the rest of the row is noise it must ignore. */
function row(over: Partial<Assessment> & { createdAt: string }): Assessment {
  return {
    id: 'a1',
    userId: 'u1',
    stress: 40,
    anxiety: 30,
    sleep: 70,
    answers: null,
    activities: null,
    games: null,
    ...over,
  } as Assessment;
}

const V2 = {
  v: 2,
  responses: [{ itemId: 'i1', domain: 'academic', question: 'q', answer: 'a', weight: 0.75, ms: 900 }],
  domainScores: { academic: 80, social: 60, emotional: 55, behavioral: 70, cognitive: 65, physical: 50 },
  overall: 99, // deliberately wrong — overall must never be read from the JSON
  riskLevel: 'moderate',
  summary: 'A steady week with a few sharp edges.',
  recommendations: ['walk'],
  medianMs: 900,
};

const OLD = {
  responses: [{ question: 'q', answer: 'a', domain: 'social' }],
  domainScores: { academic: 40, social: 45, emotional: 50, behavioral: 55, cognitive: 60, physical: 65 },
  riskLevel: 'high',
  summary: 'The old implementation wrote this.',
  recommendations: ['rest', 'call a friend'],
};

describe('toPast — answers parsing', () => {
  it('reads the v2 StoredAnswers shape', () => {
    const [p] = toPast([row({ createdAt: '2026-01-05T10:00:00.000Z', answers: V2 })]);
    expect(p.domainScores).toEqual(V2.domainScores);
    expect(p.riskLevel).toBe('moderate');
    expect(p.summary).toBe('A steady week with a few sharp edges.');
  });

  it('reads the old {responses, domainScores, riskLevel, summary, recommendations} shape', () => {
    const [p] = toPast([row({ createdAt: '2026-01-05T10:00:00.000Z', answers: OLD })]);
    expect(p.domainScores).toEqual(OLD.domainScores);
    expect(p.riskLevel).toBe('high');
    expect(p.summary).toBe('The old implementation wrote this.');
  });

  it('parses a stringified blob', () => {
    const [p] = toPast([row({ createdAt: '2026-01-05T10:00:00.000Z', answers: JSON.stringify(V2) })]);
    expect(p.domainScores.academic).toBe(80);
    expect(p.riskLevel).toBe('moderate');
  });

  it('parses a double-stringified blob', () => {
    const [p] = toPast([row({ createdAt: '2026-01-05T10:00:00.000Z', answers: JSON.stringify(JSON.stringify(OLD)) })]);
    expect(p.domainScores.social).toBe(45);
  });

  it('survives null answers and still keeps the row', () => {
    const [p] = toPast([row({ createdAt: '2026-01-05T10:00:00.000Z', answers: null, stress: 20, anxiety: 10, sleep: 90 })]);
    expect(p.domainScores).toEqual({});
    expect(p.riskLevel).toBeUndefined();
    expect(p.summary).toBeUndefined();
    expect(p.overall).toBe(87);
  });

  it('survives every flavour of garbage without throwing', () => {
    const junk: unknown[] = [
      undefined,
      42,
      'not json at all',
      '{"broken":',
      [],
      [1, 2, 3],
      true,
      { nothing: 'useful' },
      { domainScores: 'nope' },
      { domainScores: [1, 2, 3] },
      { riskLevel: 'catastrophic', summary: 42 },
    ];
    const out = toPast(junk.map((answers, i) => row({ createdAt: `2026-01-0${i % 9 + 1}T10:00:00.000Z`, answers })));
    expect(out).toHaveLength(junk.length);
    for (const p of out) {
      expect(p.domainScores).toEqual({});
      expect(p.riskLevel).toBeUndefined();
      expect(p.summary).toBeUndefined();
      expect(Number.isFinite(p.overall)).toBe(true);
    }
  });

  it('handles missing domainScores but a readable rest', () => {
    const [p] = toPast([
      row({ createdAt: '2026-01-05T10:00:00.000Z', answers: { responses: [], riskLevel: 'low', summary: 'ok' } }),
    ]);
    expect(p.domainScores).toEqual({});
    expect(p.riskLevel).toBe('low');
    expect(p.summary).toBe('ok');
  });

  it('keeps only known domains, clamps to 0-100 and drops unreadable values', () => {
    const [p] = toPast([
      row({
        createdAt: '2026-01-05T10:00:00.000Z',
        answers: {
          domainScores: {
            academic: 140,
            social: -20,
            emotional: '62',
            behavioral: null,
            cognitive: 'abc',
            physical: 49.6,
            mystery: 70,
          },
        },
      }),
    ]);
    expect(p.domainScores).toEqual({ academic: 100, social: 0, emotional: 62, physical: 50 });
    expect('mystery' in p.domainScores).toBe(false);
  });

  it('never throws on a non-array input', () => {
    expect(toPast(null as unknown as Assessment[])).toEqual([]);
    expect(toPast(undefined as unknown as Assessment[])).toEqual([]);
    expect(toPast('rows' as unknown as Assessment[])).toEqual([]);
  });

  it('drops rows that are not objects or cannot be dated', () => {
    const rows = [
      null,
      'nope',
      { id: 'x', stress: 1, anxiety: 1, sleep: 1 },
      row({ createdAt: 'not-a-date' }),
      row({ createdAt: '2026-01-05T10:00:00.000Z' }),
    ] as unknown as Assessment[];
    expect(toPast(rows)).toHaveLength(1);
  });
});

describe('toPast — overall and ordering', () => {
  it('always equals the dashboard wellnessScore formula', () => {
    const rows = [
      row({ createdAt: '2026-01-01T00:00:00.000Z', stress: 80, anxiety: 70, sleep: 30, answers: V2 }),
      row({ createdAt: '2026-01-02T00:00:00.000Z', stress: 0, anxiety: 0, sleep: 100, answers: OLD }),
      row({ createdAt: '2026-01-03T00:00:00.000Z', stress: 33, anxiety: 44, sleep: 55, answers: 'garbage' }),
    ];
    for (const p of toPast(rows)) {
      expect(p.overall).toBe(Math.round((100 - p.stress + (100 - p.anxiety) + p.sleep) / 3));
      expect(p.overall).toBe(wellnessScore({ stress: p.stress, anxiety: p.anxiety, sleep: p.sleep } as Assessment));
    }
  });

  it('ignores the overall written into the JSON', () => {
    const [p] = toPast([row({ createdAt: '2026-01-05T10:00:00.000Z', stress: 40, anxiety: 30, sleep: 70, answers: V2 })]);
    expect(V2.overall).toBe(99);
    expect(p.overall).toBe(67);
  });

  it('coerces numeric-string and null columns rather than producing NaN', () => {
    const [p] = toPast([
      row({ createdAt: '2026-01-05T10:00:00.000Z', stress: '40' as unknown as number, anxiety: null as unknown as number, sleep: 200 }),
    ]);
    expect(p).toMatchObject({ stress: 40, anxiety: 0, sleep: 100 });
    expect(p.overall).toBe(87);
  });

  it('returns newest first regardless of input order', () => {
    const out = toPast([
      row({ id: 'mid', createdAt: '2026-02-10T00:00:00.000Z' }),
      row({ id: 'old', createdAt: '2026-01-01T00:00:00.000Z' }),
      row({ id: 'new', createdAt: '2026-03-20T00:00:00.000Z' }),
    ]);
    expect(out.map((p) => p.id)).toEqual(['new', 'mid', 'old']);
  });
});

/** Small builder for compare/trendSeries, which take already-parsed history. */
function past(over: Partial<PastAssessment> & { createdAt: string }): PastAssessment {
  return {
    id: over.createdAt,
    stress: 40,
    anxiety: 30,
    sleep: 70,
    overall: 67,
    domainScores: {},
    ...over,
  };
}

describe('compare', () => {
  it('returns null when there is nothing yet', () => {
    expect(compare([])).toBeNull();
    expect(compare(null as unknown as PastAssessment[])).toBeNull();
  });

  it('handles a first-ever assessment without inventing a comparison', () => {
    const c = compare([past({ createdAt: '2026-01-05T00:00:00.000Z', overall: 72, domainScores: { academic: 60 } })])!;
    expect(c.previous).toBeNull();
    expect(c.overallDelta).toBe(0);
    expect(c.improved).toEqual([]);
    expect(c.slipped).toEqual([]);
    expect(c.domains).toEqual([{ domain: 'academic', now: 60, before: 60, delta: 0 }]);
    expect(c.headline).toMatch(/first reflection/i);
    expect(c.narrative).toContain('72 out of 100');
  });

  it('compares the newest against the one before it', () => {
    const c = compare([
      past({ createdAt: '2026-02-01T00:00:00.000Z', overall: 70, domainScores: { academic: 80, social: 40 } }),
      past({ createdAt: '2026-01-01T00:00:00.000Z', overall: 55, domainScores: { academic: 60, social: 65 } }),
    ])!;
    expect(c.current.overall).toBe(70);
    expect(c.previous?.overall).toBe(55);
    expect(c.overallDelta).toBe(15);
    expect(c.domains).toEqual([
      { domain: 'academic', now: 80, before: 60, delta: 20 },
      { domain: 'social', now: 40, before: 65, delta: -25 },
    ]);
  });

  it('ignores anything older than the previous one', () => {
    const c = compare([
      past({ createdAt: '2026-03-01T00:00:00.000Z', overall: 70 }),
      past({ createdAt: '2026-02-01T00:00:00.000Z', overall: 60 }),
      past({ createdAt: '2026-01-01T00:00:00.000Z', overall: 10 }),
    ])!;
    expect(c.overallDelta).toBe(10);
  });

  it('signs deltas the intuitive way and orders improved/slipped by size', () => {
    const c = compare([
      past({
        createdAt: '2026-02-01T00:00:00.000Z',
        domainScores: { academic: 70, social: 50, emotional: 90, behavioral: 20, cognitive: 55 },
      }),
      past({
        createdAt: '2026-01-01T00:00:00.000Z',
        domainScores: { academic: 65, social: 80, emotional: 60, behavioral: 45, cognitive: 55 },
      }),
    ])!;
    expect(c.improved.map((d) => [d.domain, d.delta])).toEqual([
      ['emotional', 30],
      ['academic', 5],
    ]);
    expect(c.slipped.map((d) => [d.domain, d.delta])).toEqual([
      ['social', -30],
      ['behavioral', -25],
    ]);
    // A flat domain belongs to neither list but stays on the radar.
    expect(c.domains.find((d) => d.domain === 'cognitive')?.delta).toBe(0);
  });

  it('only reports domains the current assessment can actually speak to', () => {
    const c = compare([
      past({ createdAt: '2026-02-01T00:00:00.000Z', domainScores: { academic: 70 } }),
      past({ createdAt: '2026-01-01T00:00:00.000Z', domainScores: { academic: 60, social: 90 } }),
    ])!;
    expect(c.domains.map((d) => d.domain)).toEqual(['academic']);
  });

  it('mirrors `now` into `before` when the previous one is missing that domain', () => {
    const c = compare([
      past({ createdAt: '2026-02-01T00:00:00.000Z', domainScores: { physical: 40 } }),
      past({ createdAt: '2026-01-01T00:00:00.000Z', domainScores: {} }),
    ])!;
    expect(c.domains).toEqual([{ domain: 'physical', now: 40, before: 40, delta: 0 }]);
    expect(c.slipped).toEqual([]);
  });

  it('writes a warm, non-clinical narrative naming what moved and by how much', () => {
    const c = compare([
      past({ createdAt: '2026-02-01T00:00:00.000Z', overall: 70, domainScores: { academic: 80, physical: 30 } }),
      past({ createdAt: '2026-01-01T00:00:00.000Z', overall: 55, domainScores: { academic: 60, physical: 55 } }),
    ])!;
    expect(c.narrative).toContain('up 15');
    expect(c.narrative).toContain('Academic');
    expect(c.narrative).toContain('Physical');
    expect(c.narrative).toContain('asking for some attention');
    expect(c.narrative).not.toMatch(/declin|fail|worse|disorder|symptom|diagnos|severe/i);
    expect(c.narrative.split('. ').length).toBeLessThanOrEqual(3);
  });

  it('says something kind when nothing moved', () => {
    const c = compare([
      past({ createdAt: '2026-02-01T00:00:00.000Z', overall: 60, domainScores: { academic: 50 } }),
      past({ createdAt: '2026-01-01T00:00:00.000Z', overall: 60, domainScores: { academic: 50 } }),
    ])!;
    expect(c.overallDelta).toBe(0);
    expect(c.headline).toMatch(/steady/i);
    expect(c.narrative).toMatch(/holding at 60/);
  });

  it('falls back to the headline number when no domains are readable', () => {
    const c = compare([
      past({ createdAt: '2026-02-01T00:00:00.000Z', overall: 60 }),
      past({ createdAt: '2026-01-01T00:00:00.000Z', overall: 70 }),
    ])!;
    expect(c.domains).toEqual([]);
    expect(c.narrative).toContain('headline number only');
    expect(c.overallDelta).toBe(-10);
  });
});

describe('trendSeries', () => {
  const history = [
    past({ createdAt: '2026-04-01T00:00:00.000Z', overall: 80 }),
    past({ createdAt: '2026-03-01T00:00:00.000Z', overall: 70 }),
    past({ createdAt: '2026-02-01T00:00:00.000Z', overall: 60 }),
    past({ createdAt: '2026-01-01T00:00:00.000Z', overall: 50 }),
  ];

  it('returns oldest first so a chart reads left to right', () => {
    expect(trendSeries(history)).toEqual([
      { at: '2026-01-01T00:00:00.000Z', overall: 50 },
      { at: '2026-02-01T00:00:00.000Z', overall: 60 },
      { at: '2026-03-01T00:00:00.000Z', overall: 70 },
      { at: '2026-04-01T00:00:00.000Z', overall: 80 },
    ]);
  });

  it('keeps the most recent `limit` entries, still oldest first', () => {
    expect(trendSeries(history, 2)).toEqual([
      { at: '2026-03-01T00:00:00.000Z', overall: 70 },
      { at: '2026-04-01T00:00:00.000Z', overall: 80 },
    ]);
  });

  it('does not mutate the history it is given', () => {
    const copy = [...history];
    trendSeries(history, 3);
    expect(history).toEqual(copy);
  });

  it('handles empty, zero and negative limits', () => {
    expect(trendSeries([])).toEqual([]);
    expect(trendSeries(history, 0)).toEqual([]);
    expect(trendSeries(history, -5)).toEqual([]);
    expect(trendSeries(null as unknown as PastAssessment[])).toEqual([]);
  });

  it('caps at the default limit', () => {
    const many = Array.from({ length: 30 }, (_, i) =>
      past({ createdAt: new Date(Date.UTC(2026, 0, 30 - i)).toISOString(), overall: i }),
    );
    expect(trendSeries(many)).toHaveLength(12);
    expect(trendSeries(many)[11].overall).toBe(0);
  });
});
