import { describe, it, expect, afterAll } from 'vitest';
import 'dotenv/config';
import users from '../api/users';
import assessments from '../api/assessments/index';
import quotes from '../api/quotes/index';
import { prisma } from '../api/_lib/prisma';
import { mockReq, mockRes } from './helpers/mockRes';
import { scoreAnswers } from '@/features/assessment/scoring';
import { pickSession } from '@/features/assessment/itemBank';
import { toPast } from '@/features/assessment/history';
import { wellnessScore } from '@/lib/wellness';
import type { Answer, StoredAnswers } from '@/features/assessment/domain';
import type { Assessment } from '@/types/api';

/**
 * End-to-end contract tests: a real session is scored, saved through the real
 * handler to the real database, read back, and re-derived. This is the path
 * that must not break — the assessment screen and the dashboard's wellness card
 * both read these rows, and they are only trustworthy if the number that goes
 * in is the number that comes out.
 */

const ID = 'TEST_assessment_e2e';

interface Envelope<T = unknown> { ok: boolean; data?: T; error?: string }

afterAll(async () => {
  const user = await prisma.user.findUnique({ where: { clerkId: ID } });
  if (user) {
    await prisma.assessment.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  }
  await prisma.$disconnect();
});

/** Answer a real session, choosing option `pick` on every item. */
function playSession(pick: number): Answer[] {
  return pickSession(42).map((item) => {
    const option = item.options[Math.min(pick, item.options.length - 1)];
    return {
      itemId: item.id,
      domain: item.domain,
      question: item.prompt,
      answer: option.label,
      weight: option.weight,
      ms: 1500,
    };
  });
}

describe('assessment endpoints (live db)', () => {
  it('saves a scored session and reads it back with the same numbers', async () => {
    const u = mockRes();
    await users(
      mockReq({ method: 'POST', body: { clerkId: ID, email: 'assess@test.manasswasthya.app', firstName: 'As' } }),
      u.res,
    );
    expect((u.captured.body as Envelope).ok).toBe(true);

    const answers = playSession(1);
    const scores = scoreAnswers(answers);
    const stored: StoredAnswers = {
      v: 2,
      responses: answers,
      domainScores: scores.domainScores,
      overall: scores.overall,
      riskLevel: scores.riskLevel,
      summary: 'A steady week.',
      recommendations: ['Take a walk'],
      medianMs: 1500,
    };

    const save = mockRes();
    await assessments(
      mockReq({
        method: 'POST',
        body: {
          clerkId: ID,
          stress: scores.stress,
          anxiety: scores.anxiety,
          sleep: scores.sleep,
          answers: stored,
          activities: stored.recommendations,
          games: [],
        },
      }),
      save.res,
    );
    expect(save.captured.statusCode).toBe(201);

    const get = mockRes();
    await assessments(mockReq({ method: 'GET', query: { clerkId: ID } }), get.res);
    // Round-trip through JSON: that is what the browser actually receives,
    // and Date columns become strings on the way.
    const rows: Assessment[] = JSON.parse(
      JSON.stringify((get.captured.body as Envelope<Assessment[]>).data ?? []),
    );
    expect(rows.length).toBeGreaterThan(0);

    const row = rows[0];
    expect(row.stress).toBe(scores.stress);
    expect(row.anxiety).toBe(scores.anxiety);
    expect(row.sleep).toBe(scores.sleep);

    // The dashboard derives its number from the columns, the assessment screen
    // from scoreAnswers. They must agree, or the two screens contradict.
    expect(wellnessScore(row)).toBe(scores.overall);

    // And the history view must re-derive the same thing from the stored JSON.
    const [past] = toPast(rows);
    expect(past.overall).toBe(scores.overall);
    expect(past.riskLevel).toBe(scores.riskLevel);
    expect(Object.keys(past.domainScores).length).toBeGreaterThan(0);
  });

  it('rejects an invalid body with 422 rather than writing junk', async () => {
    const bad = mockRes();
    await assessments(mockReq({ method: 'POST', body: { clerkId: ID, stress: 'lots' } }), bad.res);
    expect(bad.captured.statusCode).toBe(422);
  });

  it('refuses a token for somebody who is not a user here', async () => {
    // Used to answer with an empty list, which told the caller the id was
    // unknown. A valid-looking token for a non-user is simply not signed in.
    const r = mockRes();
    await assessments(mockReq({ method: 'GET', query: { clerkId: 'TEST_nobody_here' } }), r.res);
    expect(r.captured.statusCode).toBe(401);
  });

  it('refuses to read anyone\'s assessments without a token', async () => {
    const r = mockRes();
    await assessments(mockReq({ method: 'GET', query: { clerkId: ID }, auth: false }), r.res);
    expect(r.captured.statusCode).toBe(401);
  });

  it('always returns a usable quote, whatever the upstream does', async () => {
    const r = mockRes();
    await quotes(mockReq({ method: 'GET', query: { tone: 'gentle' } }), r.res);
    const body = r.captured.body as Envelope<{ text: string; author: string; source: string }>;
    expect(body.ok).toBe(true);
    expect(body.data?.text.length).toBeGreaterThan(0);
    expect(body.data?.author.length).toBeGreaterThan(0);
    expect(['api', 'local']).toContain(body.data?.source);
  }, 15_000);
});

describe('score direction is not silently inverted', () => {
  it('answering well scores higher than answering badly, end to end', () => {
    const best = scoreAnswers(playSession(0));
    const worst = scoreAnswers(playSession(3));
    expect(best.overall).toBeGreaterThan(worst.overall);
    expect(best.stress).toBeLessThan(worst.stress);
    expect(best.anxiety).toBeLessThan(worst.anxiety);
    expect(best.sleep).toBeGreaterThan(worst.sleep);
  });
});
