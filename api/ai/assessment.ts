import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ok, fail, parseBody, methodGuard, withErrors } from '../_lib/http';
import { AiAssessmentNext, type AiAssessmentNextT } from '../_lib/schemas';
import { generateJSON } from '../_lib/gemini';
import { allow } from '../_lib/ratelimit';
import { requireVerifiedUser } from '../_lib/clerkAuth';
import { promptLanguageSuffix } from '../_lib/language';

/**
 * This endpoint no longer builds the measuring stick. The questions and the
 * scores now come from a fixed item bank scored deterministically on the client
 * (src/features/assessment/), so two assessments a week apart are comparable.
 *
 * What is left is the part a model is actually good at:
 *   mode:'followups' — a few personalised probes into the weakest domains
 *   mode:'summary'   — the written reflection and suggestions
 * mode:'next' is the original adaptive generator, kept as the default so the
 * existing aiNextQuestion() caller keeps working untouched.
 */

export const DOMAINS = ['academic', 'social', 'emotional', 'behavioral', 'cognitive', 'physical'] as const;
export type Domain = (typeof DOMAINS)[number];

export interface NextQuestionResult {
  question: string;
  options: string[];
  domain: Domain;
  isComplete: boolean;
  scores?: {
    stress: number;
    anxiety: number;
    sleep: number;
    domainScores: Record<Domain, number>;
    riskLevel: 'low' | 'moderate' | 'high';
    summary: string;
    recommendations: string[];
  };
}

const TOTAL_QUESTIONS = 12;

function buildPrompt(previous: { question: string; answer: string; domain: string }[]): string {
  const answered = previous.length;
  const coveredCounts: Record<string, number> = {};
  for (const p of previous) coveredCounts[p.domain] = (coveredCounts[p.domain] ?? 0) + 1;
  const underCovered = DOMAINS.filter((d) => (coveredCounts[d] ?? 0) < 2);
  const history = previous.map((p, i) => `Q${i + 1} [${p.domain}]: ${p.question}\nA: ${p.answer}`).join('\n');

  if (answered >= TOTAL_QUESTIONS) {
    return `You are an adaptive mental-wellness assessment engine for Indian college students. The student answered these ${answered} questions:\n${history}\n
Produce the FINAL result as JSON:
{"question":"","options":[],"domain":"emotional","isComplete":true,"scores":{"stress":<0-100 higher = more stressed>,"anxiety":<0-100>,"sleep":<0-100 higher = better sleep>,"domainScores":{"academic":<0-100 wellbeing>,"social":<0-100>,"emotional":<0-100>,"behavioral":<0-100>,"cognitive":<0-100>,"physical":<0-100>},"riskLevel":"low|moderate|high","summary":"<3-4 sentence warm, non-clinical summary addressed to the student>","recommendations":["<5 specific, actionable suggestions for an Indian college student>"]}}
Return ONLY the JSON.`;
  }

  return `You are an adaptive mental-wellness assessment engine for Indian college students, covering six domains: academic, social, emotional, behavioral, cognitive, physical.
Previously answered (${answered}/${TOTAL_QUESTIONS}):\n${history || '(none yet)'}
Generate the NEXT question as JSON. Rules:
- Adapt to previous answers: probe deeper where answers suggest difficulty.
- Prioritize under-covered domains: ${underCovered.join(', ') || 'any'}.
- Question must be specific to student life in India, warm in tone, never clinical or alarming.
- Exactly 4 answer options, ordered from most positive to most concerning experience.
{"question":"<the question>","options":["<opt1>","<opt2>","<opt3>","<opt4>"],"domain":"<one of: ${DOMAINS.join(', ')}>","isComplete":false}
Return ONLY the JSON.`;
}

type Responses = AiAssessmentNextT['previousResponses'];

export interface FollowUpQuestion {
  question: string;
  options: string[];
  domain: Domain;
}

const transcript = (rs: Responses): string =>
  rs.map((r, i) => `Q${i + 1} [${r.domain}]: ${r.question}\nA: ${r.answer}`).join('\n') || '(none)';

/** Domains the student answered lowest on. Computed here, not guessed by the model. */
function weakestDomains(rs: Responses): string[] {
  const totals = new Map<string, { sum: number; n: number }>();
  for (const r of rs) {
    if (typeof r.weight !== 'number') continue;
    const t = totals.get(r.domain) ?? { sum: 0, n: 0 };
    totals.set(r.domain, { sum: t.sum + r.weight, n: t.n + 1 });
  }
  return [...totals.entries()]
    .sort((a, b) => a[1].sum / a[1].n - b[1].sum / b[1].n)
    .slice(0, 2)
    .map(([d]) => d);
}

function followUpPrompt(rs: Responses): string {
  const focus = weakestDomains(rs);
  return `A student in an Indian college has just finished a fixed set of wellbeing questions. Their answers:
${transcript(rs)}

Write 3-4 follow-up questions that go one step deeper where they seemed to be struggling${focus.length ? `, especially: ${focus.join(', ')}` : ''}.
Rules:
- Each question has EXACTLY 4 answer options, ordered most positive first, most concerning last.
- Warm, plain, specific to Indian student life (semesters, placements, hostel, attendance, family). Never clinical, never alarming.
- Ask about experience only. No advice, no diagnosis, no reassurance inside the question.
- Do not repeat a question they were already asked.
{"questions":[{"question":"<question>","options":["<opt1>","<opt2>","<opt3>","<opt4>"],"domain":"<one of: ${DOMAINS.join(', ')}>"}]}
Return ONLY the JSON.`;
}

function summaryPrompt(rs: Responses, scores: AiAssessmentNextT['scores']): string {
  const numbers = scores
    ? `Their scores are already calculated — do NOT recalculate or return them, just write text that agrees with them:
stress ${scores.stress}/100 (higher = more stressed), anxiety ${scores.anxiety}/100, sleep ${scores.sleep}/100 (higher = better), overall wellbeing ${scores.overall}/100.`
    : '';
  return `A student in an Indian college has just finished a wellbeing check-in. Their answers:
${transcript(rs)}
${numbers}

Return JSON with exactly two keys:
{"summary":"<3-4 sentences, warm, addressed to the student as 'you', reflecting back what they described. Never a diagnosis, never a label, never alarming.>","recommendations":["<5 small, specific, doable suggestions that fit a college student in India — hostel, campus, budget, timetable>"]}
Return ONLY the JSON. Do not include scores of any kind.`;
}

const text = (v: unknown, max: number): string => (typeof v === 'string' ? v.trim().slice(0, max) : '');

const isDomain = (v: unknown): v is Domain => (DOMAINS as readonly string[]).includes(v as string);

/** Anything the model got wrong is dropped here, not in the UI. A short or ragged option array never reaches the screen. */
function cleanQuestions(v: unknown): FollowUpQuestion[] {
  const raw = Array.isArray(v) ? v : [];
  const out: FollowUpQuestion[] = [];
  for (const entry of raw.slice(0, 4)) {
    const q = entry as { question?: unknown; options?: unknown; domain?: unknown };
    const question = text(q?.question, 240);
    const options = (Array.isArray(q?.options) ? q.options : []).map((o) => text(o, 160)).filter(Boolean);
    if (!question || options.length !== 4) continue;
    out.push({ question, options, domain: isDomain(q?.domain) ? q.domain : 'emotional' });
  }
  return out;
}

function cleanList(v: unknown, max: number): string[] {
  return (Array.isArray(v) ? v : []).map((s) => text(s, 240)).filter(Boolean).slice(0, max);
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!methodGuard(req, res, ['POST'])) return;
  const body = parseBody(req, res, AiAssessmentNext);
  if (!body) return;
  await withErrors(res, async () => {
    // The worst of the three: unbounded strings in an unbounded array, all
    // concatenated into a paid prompt, reachable by anyone.
    const user = await requireVerifiedUser(req, res);
    if (!user) return;
    if (!allow(`assess:${user.id}`, 30, 60_000)) {
      fail(res, 'Too many requests. Please slow down.', 429);
      return;
    }

    if (body.mode === 'followups') {
      const lang = promptLanguageSuffix(req);
      const raw = await generateJSON<{ questions?: unknown }>(
        followUpPrompt(body.previousResponses) + lang,
      );
      ok(res, { questions: cleanQuestions(raw?.questions) });
      return;
    }
    if (body.mode === 'summary') {
      const raw = await generateJSON<{ summary?: unknown; recommendations?: unknown }>(
        summaryPrompt(body.previousResponses, body.scores) + promptLanguageSuffix(req),
      );
      // Scores are computed locally; any the model volunteered are ignored on purpose.
      ok(res, { summary: text(raw?.summary, 1200), recommendations: cleanList(raw?.recommendations, 5) });
      return;
    }
    const result = await generateJSON<NextQuestionResult>(buildPrompt(body.previousResponses));
    ok(res, result);
  });
}
