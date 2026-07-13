import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { ok, fail, parseBody, methodGuard, withErrors } from '../_lib/http';
import { generateText } from '../_lib/gemini';
import { allow } from '../_lib/ratelimit';

const AiAdvisory = z.object({
  clerkId: z.string().min(1),
  prompt: z.string().min(1).max(8000),
});

const SYSTEM = `You are the advisory engine of ManasSwasthya, a mental wellness platform for Indian college students.
Follow the user's formatting instructions exactly (JSON when asked). Be warm, practical, non-clinical, and India-aware.
Never provide medical diagnoses. Never include disallowed content.`;

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!methodGuard(req, res, ['POST'])) return;
  const body = parseBody(req, res, AiAdvisory);
  if (!body) return;
  if (!allow(`advisory:${body.clerkId}`, 20, 60_000)) {
    fail(res, 'Too many requests. Please slow down.', 429);
    return;
  }
  await withErrors(res, async () => {
    const text = await generateText(SYSTEM, [{ role: 'user', content: body.prompt }]);
    ok(res, { text });
  });
}
