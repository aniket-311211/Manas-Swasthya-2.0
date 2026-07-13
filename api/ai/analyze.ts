import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ok, fail, parseBody, methodGuard, withErrors } from '../_lib/http';
import { AiAnalyze } from '../_lib/schemas';
import { generateJSON } from '../_lib/gemini';
import { allow } from '../_lib/ratelimit';

export interface AnalyzeResult {
  sentiment: 'positive' | 'neutral' | 'mixed' | 'negative';
  themes: string[];
  gentleSuggestion: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!methodGuard(req, res, ['POST'])) return;
  const body = parseBody(req, res, AiAnalyze);
  if (!body) return;
  if (!allow(`analyze:${body.clerkId}`, 20, 60_000)) {
    fail(res, 'Too many requests. Please slow down.', 429);
    return;
  }
  await withErrors(res, async () => {
    const prompt = `You are a gentle wellbeing companion analyzing a student's ${body.kind} entry. Text:\n"""${body.text}"""\n
Return JSON only:
{"sentiment":"positive|neutral|mixed|negative","themes":["<2-4 short themes present in the text>"],"gentleSuggestion":"<one warm, specific, non-clinical suggestion (1-2 sentences) for this student>"}`;
    const result = await generateJSON<AnalyzeResult>(prompt);
    ok(res, result);
  });
}
