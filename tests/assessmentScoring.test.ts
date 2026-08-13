import { describe, it, expect } from 'vitest';
import { DOMAINS, type Answer, type Domain } from '@/features/assessment/domain';
import { ITEMS, itemsFor, pickSession } from '@/features/assessment/itemBank';
import { scoreAnswers, medianMs, paceReflection, riskFrom, domainBreakdown } from '@/features/assessment/scoring';

/** The dashboard's wellnessScore(), copied here on purpose: if the two ever drift, this file fails. */
const dashboardFormula = (stress: number, anxiety: number, sleep: number) =>
  Math.round((100 - stress + (100 - anxiety) + sleep) / 3);

const answer = (itemId: string, weight: number, ms = 4000): Answer => {
  const item = ITEMS.find((i) => i.id === itemId);
  if (!item) throw new Error(`no such item: ${itemId}`);
  return { itemId, domain: item.domain, question: item.prompt, answer: item.options[0].label, weight, ms };
};

/** Every item of one domain answered at the same weight. */
const wholeDomain = (domain: Domain, weight: number): Answer[] =>
  itemsFor(domain).map((i) => answer(i.id, weight));

const allItems = (weight: number): Answer[] => ITEMS.map((i) => answer(i.id, weight));

describe('item bank', () => {
  it('has 18 items, 3 per domain, with unique ids', () => {
    expect(ITEMS).toHaveLength(18);
    for (const d of DOMAINS) expect(itemsFor(d)).toHaveLength(3);
    expect(new Set(ITEMS.map((i) => i.id)).size).toBe(18);
  });

  it('gives every item exactly 4 options weighted 1 / 0.66 / 0.33 / 0, strictly descending', () => {
    for (const item of ITEMS) {
      expect(item.options).toHaveLength(4);
      expect(item.options.map((o) => o.weight)).toEqual([1, 0.66, 0.33, 0]);
      for (const o of item.options) {
        expect(o.weight).toBeGreaterThanOrEqual(0);
        expect(o.weight).toBeLessThanOrEqual(1);
        expect(o.label.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('tags at least 3 items for each headline facet', () => {
    for (const facet of ['stress', 'anxiety', 'sleep'] as const) {
      expect(ITEMS.filter((i) => i.facets?.includes(facet)).length).toBeGreaterThanOrEqual(3);
    }
  });

  it('does not reproduce wording from a validated instrument', () => {
    const text = ITEMS.map((i) => `${i.prompt} ${i.options.map((o) => o.label).join(' ')}`).join(' ').toLowerCase();
    for (const phrase of [
      'little interest or pleasure',
      'feeling down, depressed',
      'nearly every day',
      'not at all',
      'several days',
      'more than half the days',
      'trouble relaxing',
      'afraid as if something awful',
    ]) {
      expect(text).not.toContain(phrase);
    }
  });
});

describe('pickSession', () => {
  it('returns 12 items, 2 per domain, no duplicates', () => {
    const session = pickSession(7);
    expect(session).toHaveLength(12);
    expect(new Set(session.map((i) => i.id)).size).toBe(12);
    for (const d of DOMAINS) expect(session.filter((i) => i.domain === d)).toHaveLength(2);
  });

  it('is deterministic for the same seed and differs across seeds', () => {
    expect(pickSession(42).map((i) => i.id)).toEqual(pickSession(42).map((i) => i.id));
    const seen = new Set(Array.from({ length: 40 }, (_, s) => pickSession(s).map((i) => i.id).join(',')));
    expect(seen.size).toBeGreaterThan(1);
  });

  it('never produces a session with zero inputs for a facet', () => {
    for (let seed = 0; seed < 400; seed++) {
      const session = pickSession(seed);
      for (const facet of ['stress', 'anxiety', 'sleep'] as const) {
        expect(session.some((i) => i.facets?.includes(facet))).toBe(true);
      }
    }
  });

  it('does not put both items of a domain back to back', () => {
    const session = pickSession(11);
    for (let i = 1; i < session.length; i++) expect(session[i].domain).not.toBe(session[i - 1].domain);
  });
});

describe('scoreAnswers — weight to score', () => {
  it('maps a domain answered at full weight to 100 and at zero to 0', () => {
    expect(scoreAnswers(wholeDomain('academic', 1)).domainScores.academic).toBe(100);
    expect(scoreAnswers(wholeDomain('academic', 0)).domainScores.academic).toBe(0);
  });

  it('averages mixed weights and rounds', () => {
    const items = itemsFor('cognitive');
    const scores = scoreAnswers([answer(items[0].id, 1), answer(items[1].id, 0.66), answer(items[2].id, 0)]);
    // (1 + 0.66 + 0) / 3 = 0.5533… → 55
    expect(scores.domainScores.cognitive).toBe(55);
  });

  it('gives an unanswered domain a neutral 50, not a zero', () => {
    const scores = scoreAnswers(wholeDomain('academic', 0));
    expect(scores.domainScores.academic).toBe(0);
    expect(scores.domainScores.social).toBe(50);
    expect(domainBreakdown(wholeDomain('academic', 0)).find((d) => d.domain === 'social')?.answered).toBe(0);
  });
});

describe('scoreAnswers — facet direction', () => {
  it('inverts stress and anxiety: doing well means low numbers', () => {
    const good = scoreAnswers(allItems(1));
    expect(good.stress).toBe(0);
    expect(good.anxiety).toBe(0);

    const bad = scoreAnswers(allItems(0));
    expect(bad.stress).toBe(100);
    expect(bad.anxiety).toBe(100);
  });

  it('does not invert sleep: doing well means a high number', () => {
    expect(scoreAnswers(allItems(1)).sleep).toBe(100);
    expect(scoreAnswers(allItems(0)).sleep).toBe(0);
  });

  it('moves stress up and sleep down when the answers get worse', () => {
    const better = scoreAnswers(allItems(0.66));
    const worse = scoreAnswers(allItems(0.33));
    expect(worse.stress).toBeGreaterThan(better.stress);
    expect(worse.anxiety).toBeGreaterThan(better.anxiety);
    expect(worse.sleep).toBeLessThan(better.sleep);
  });

  it('only lets facet-tagged items move the facet numbers', () => {
    const untagged = ITEMS.filter((i) => !i.facets);
    const scores = scoreAnswers(untagged.map((i) => answer(i.id, 0)));
    expect(scores.stress).toBe(50);
    expect(scores.anxiety).toBe(50);
    expect(scores.sleep).toBe(50);
  });
});

describe('overall matches the dashboard wellness card exactly', () => {
  it('agrees for every weight combination in the bank', () => {
    for (const w of [0, 0.33, 0.66, 1]) {
      const s = scoreAnswers(allItems(w));
      expect(s.overall).toBe(dashboardFormula(s.stress, s.anxiety, s.sleep));
    }
  });

  it('agrees for random mixed sessions', () => {
    for (let seed = 0; seed < 60; seed++) {
      const answers = pickSession(seed).map((item, i) => answer(item.id, [0, 0.33, 0.66, 1][(seed + i) % 4]));
      const s = scoreAnswers(answers);
      expect(s.overall).toBe(dashboardFormula(s.stress, s.anxiety, s.sleep));
    }
  });

  it('sits at a neutral 50 for empty input rather than dividing by zero', () => {
    const s = scoreAnswers([]);
    expect(s).toMatchObject({ stress: 50, anxiety: 50, sleep: 50, overall: 50 });
    expect(Object.values(s.domainScores)).toEqual(DOMAINS.map(() => 50));
    expect(Number.isNaN(s.overall)).toBe(false);
  });

  it('survives a partial session', () => {
    const s = scoreAnswers([answer('emo-onedge', 0), answer('phy-rested', 1)]);
    expect(s.stress).toBe(100);
    expect(s.anxiety).toBe(100);
    expect(s.sleep).toBe(100);
    expect(s.overall).toBe(dashboardFormula(s.stress, s.anxiety, s.sleep));
  });
});

describe('riskFrom', () => {
  it('is low only when everything is comfortably clear', () => {
    expect(riskFrom(80, 20, 20)).toBe('low');
    expect(riskFrom(65, 54, 54)).toBe('low');
  });

  it('holds its boundaries', () => {
    expect(riskFrom(65, 0, 0)).toBe('low');
    expect(riskFrom(64, 0, 0)).toBe('moderate');
    expect(riskFrom(40, 0, 0)).toBe('moderate');
    expect(riskFrom(39, 0, 0)).toBe('high');
    expect(riskFrom(100, 54, 0)).toBe('low');
    expect(riskFrom(100, 55, 0)).toBe('moderate');
    expect(riskFrom(100, 74, 0)).toBe('moderate');
    expect(riskFrom(100, 75, 0)).toBe('high');
    expect(riskFrom(100, 0, 55)).toBe('moderate');
    expect(riskFrom(100, 0, 75)).toBe('high');
  });

  it('is what scoreAnswers reports', () => {
    expect(scoreAnswers(allItems(1)).riskLevel).toBe('low');
    expect(scoreAnswers(allItems(0)).riskLevel).toBe('high');
  });
});

describe('medianMs', () => {
  const timed = (...ms: number[]) => ms.map((m, i) => answer(ITEMS[i].id, 1, m));

  it('returns the middle value for an odd count', () => {
    expect(medianMs(timed(1000, 9000, 3000))).toBe(3000);
  });

  it('averages the middle two for an even count', () => {
    expect(medianMs(timed(1000, 2000, 4000, 9000))).toBe(3000);
  });

  it('rounds a fractional midpoint', () => {
    expect(medianMs(timed(1000, 1001))).toBe(1001);
  });

  it('returns 0 for no answers', () => {
    expect(medianMs([])).toBe(0);
  });

  it('does not depend on input order', () => {
    expect(medianMs(timed(9000, 1000, 3000, 2000))).toBe(medianMs(timed(1000, 2000, 3000, 9000)));
  });
});

describe('paceReflection', () => {
  const pace = (emotionalMs: number, otherMs: number): Answer[] => [
    ...itemsFor('emotional').map((i) => answer(i.id, 1, emotionalMs)),
    ...itemsFor('academic').map((i) => answer(i.id, 1, otherMs)),
    ...itemsFor('physical').map((i) => answer(i.id, 1, otherMs)),
  ];

  it('says nothing when the pace is even', () => {
    expect(paceReflection(pace(4000, 4000))).toBeNull();
  });

  it('says nothing when the gap is proportionally large but tiny in absolute terms', () => {
    expect(paceReflection(pace(1500, 500))).toBeNull();
  });

  it('says nothing without enough answers to compare', () => {
    expect(paceReflection([])).toBeNull();
    expect(paceReflection([answer('emo-mood', 1, 30000), answer('aca-deadlines', 1, 1000)])).toBeNull();
  });

  it('observes a longer pause on the emotional questions, without judgement', () => {
    const line = paceReflection(pace(14000, 3000));
    expect(line).toBeTruthy();
    expect(line).toContain('took your time');
    expect(line).not.toMatch(/slow|hesitat|struggl|avoid|should|worry|concern/i);
  });

  it('says nothing when the emotional questions were the quick ones', () => {
    expect(paceReflection(pace(2000, 14000))).toBeNull();
  });
});

describe('the session is the same every time', () => {
  it('draws identical items on two separate runs', () => {
    // This defaulted to `Date.now()`, so each run drew a different two-of-three
    // per domain and every trend compared different questions. A fixed bank
    // that is not actually fixed is worse than no bank: it looks comparable.
    const a = pickSession().map((i) => i.id);
    const b = pickSession().map((i) => i.id);
    expect(a).toEqual(b);
  });

  it('still covers every domain twice', () => {
    const counts = new Map<string, number>();
    for (const item of pickSession()) counts.set(item.domain, (counts.get(item.domain) ?? 0) + 1);
    expect([...counts.values()].every((n) => n === 2)).toBe(true);
    expect(counts.size).toBe(6);
  });

  it('an explicit seed can still vary the wording', () => {
    const a = pickSession(1).map((i) => i.id);
    const b = pickSession(999).map((i) => i.id);
    expect(a).not.toEqual(b);
  });
});
