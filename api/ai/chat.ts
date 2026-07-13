import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ok, fail, parseBody, methodGuard, withErrors } from '../_lib/http';
import { AiChat } from '../_lib/schemas';
import { generateText } from '../_lib/gemini';
import { allow } from '../_lib/ratelimit';

const CRISIS_PATTERNS = [
  /suicid/i, /kill\s*myself/i, /end\s*my\s*life/i, /want\s*to\s*die/i, /self[\s-]*harm/i,
  /hurt\s*myself/i, /no\s*reason\s*to\s*live/i, /marna\s*chahta/i, /jeena\s*nahi/i,
  /khudkushi/i, /cutting\s*myself/i, /overdose/i,
];

export function detectCrisisServer(text: string): boolean {
  return CRISIS_PATTERNS.some((p) => p.test(text));
}

const SYSTEM_PROMPT = `You are Manas, a warm, empathetic AI mental wellness companion for Indian college students on the ManasSwasthya platform.
Guidelines:
- Be supportive, non-judgmental, and conversational. Keep replies concise (2-5 sentences) unless the user asks for depth.
- You are NOT a doctor or therapist. Never diagnose, never prescribe medication. For clinical concerns, gently suggest professional help.
- Understand Indian college context: exam pressure, placements, family expectations, hostel life, relationships.
- You may respond in the user's language (English, Hindi, or Hinglish) matching their style.
- If the user expresses self-harm or suicidal thoughts, respond with warmth and urgency: acknowledge their pain, tell them they deserve support, and share these helplines: KIRAN 1800-599-0019 (24/7, Govt of India) and iCall 9152987821. Encourage reaching out to a trusted person.`;

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!methodGuard(req, res, ['POST'])) return;
  const body = parseBody(req, res, AiChat);
  if (!body) return;
  if (!allow(`chat:${body.clerkId}`, 30, 60_000)) {
    fail(res, 'Too many requests. Please slow down.', 429);
    return;
  }
  await withErrors(res, async () => {
    const lastUser = [...body.messages].reverse().find((m) => m.role === 'user');
    const crisis = lastUser ? detectCrisisServer(lastUser.content) : false;
    const reply = await generateText(SYSTEM_PROMPT, body.messages);
    ok(res, { reply, crisis });
  });
}
