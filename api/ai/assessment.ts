import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ok, fail, parseBody, methodGuard, withErrors } from '../_lib/http';
import { AiAssessmentNext } from '../_lib/schemas';
import { generateJSON } from '../_lib/gemini';
import { allow } from '../_lib/ratelimit';

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

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!methodGuard(req, res, ['POST'])) return;
  const body = parseBody(req, res, AiAssessmentNext);
  if (!body) return;
  if (!allow(`assess:${body.clerkId}`, 30, 60_000)) {
    fail(res, 'Too many requests. Please slow down.', 429);
    return;
  }
  await withErrors(res, async () => {
    const result = await generateJSON<NextQuestionResult>(buildPrompt(body.previousResponses));
    ok(res, result);
  });
}
