import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ok, fail, parseBody, methodGuard, withErrors } from '../_lib/http';
import { AiMedicine } from '../_lib/schemas';
import { generateJSON, generateJSONWithImage } from '../_lib/gemini';
import { allow } from '../_lib/ratelimit';

export interface MedicineResult {
  name: string;
  uses: string[];
  dosage: { adult: string; pediatric: string };
  sideEffects: string[];
  warnings: string[];
  safetyVerdict: string;
  confidence: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!methodGuard(req, res, ['POST'])) return;
  const body = parseBody(req, res, AiMedicine);
  if (!body) return;
  if (!allow(`med:${body.clerkId}`, 15, 60_000)) {
    fail(res, 'Too many requests. Please slow down.', 429);
    return;
  }
  await withErrors(res, async () => {
    const subject = body.medicineName
      ? `the medicine "${body.medicineName}"`
      : 'the medicine shown in the attached photo (identify it from packaging text)';
    const prompt = `You are a pharmaceutical information assistant. A user in India asks about ${subject}.
Return JSON only:
{"name":"<canonical name>","uses":["<common uses>"],"dosage":{"adult":"<typical adult dosage guidance>","pediatric":"<pediatric guidance or 'Consult a pediatrician'>"},"sideEffects":["<common side effects>"],"warnings":["<important warnings, interactions, contraindications>"],"safetyVerdict":"<one-line general safety note>","confidence":<0-100 confidence this medicine was identified correctly>}
Rules: factual, conservative, India-relevant brand context where useful. Always include a warning to consult a doctor or pharmacist before use. If the name is unrecognizable, set confidence below 30 and say so in safetyVerdict.`;
    const result = body.imageBase64
      ? await generateJSONWithImage<MedicineResult>(prompt, body.imageBase64)
      : await generateJSON<MedicineResult>(prompt);
    ok(res, result);
  });
}
