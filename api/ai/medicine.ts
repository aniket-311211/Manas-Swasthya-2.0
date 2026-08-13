import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Prisma } from '@prisma/client';
import { prisma } from '../_lib/prisma';
import { ok, fail, parseBody, methodGuard, withErrors } from '../_lib/http';
import { AiMedicine } from '../_lib/schemas';
import { generateJSON, generateJSONWithImage } from '../_lib/gemini';
import { verifiedUser } from '../_lib/clerkAuth';
import { promptLanguageSuffix } from '../_lib/language';
import { MEDICINE_DAILY_LIMIT, peek, refund, reserve } from '../_lib/quota';
import {
  MedicineAnalysisSchema,
  MIN_CONFIDENCE_FOR_DOSING,
  buildPrompt,
  decodeImage,
  isTooUncertain,
  withheldDosing,
  type MedicineAnalysisResult,
} from '../_lib/medicine';

/**
 * Identify a medicine and say what somebody holding it needs to know.
 *
 * GET  — how many analyses are left today. Cheap, so the page can show the
 *        allowance before anyone spends one.
 * POST — one analysis. Costs a use.
 *
 * The order below is deliberate: prove who is calling, take the use, then spend
 * money. Doing any of those later leaves a way to get the expensive part for
 * free.
 */

const FEATURE = 'medicine';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!methodGuard(req, res, ['GET', 'POST'])) return;

  await withErrors(res, async () => {
    // 1. Who is this, really. Verified against Clerk, not read out of the body.
    const user = await verifiedUser(req);
    if (!user) {
      fail(res, 'Sign in to use the medicine assistant.', 401);
      return;
    }

    if (req.method === 'GET') {
      ok(res, await peek(user.id, FEATURE, MEDICINE_DAILY_LIMIT));
      return;
    }

    const body = parseBody(req, res, AiMedicine);
    if (!body) return;

    // 2. Validate the photo before it costs anything. An image the model cannot
    //    use is a wasted call and a wasted allowance.
    let image: { data: string; mimeType: string } | null = null;
    if (body.imageBase64) {
      image = decodeImage(body.imageBase64);
      if (!image) {
        fail(res, 'That file did not look like a JPEG, PNG or WebP photo. Try another picture.', 422);
        return;
      }
    }

    // 3. Take the use.
    const allowance = await reserve(user.id, FEATURE, MEDICINE_DAILY_LIMIT);
    if (!allowance.allowed) {
      res.status(429).json({
        ok: false,
        error: `You have used all ${MEDICINE_DAILY_LIMIT} checks for today.`,
        data: allowance,
      });
      return;
    }

    // The JSON keys stay English — they are a contract with the client and the
    // zod schema. Only the values the student reads change language.
    const prompt =
      buildPrompt({ medicineName: body.medicineName, hasImage: Boolean(image) }) +
      promptLanguageSuffix(req);

    let raw: unknown;
    try {
      raw = image
        ? await generateJSONWithImage<unknown>(prompt, image.data, image.mimeType)
        : await generateJSON<unknown>(prompt);
    } catch (err) {
      // Our fault, or the model's. Give the use back.
      await refund(user.id, FEATURE);
      console.error('Medicine analysis failed', err);
      fail(res, 'The assistant could not be reached just now. Your check has not been used.', 503);
      return;
    }

    // 4. Validate what came back. Previously this was cast, so a missing array
    //    reached the browser and crashed the page mid-render.
    const parsed = MedicineAnalysisSchema.safeParse(raw);
    if (!parsed.success) {
      await refund(user.id, FEATURE);
      console.error('Medicine analysis failed validation', parsed.error.issues);
      fail(res, 'The answer came back malformed, so we are not showing it. Your check has not been used.', 502);
      return;
    }

    let result: MedicineAnalysisResult = parsed.data;

    // 5. Refuse to guess. A confident layout wrapped around an unsure answer is
    //    the failure mode that actually hurts someone.
    if (isTooUncertain(result)) {
      ok(res, {
        analysis: null,
        allowance: await peek(user.id, FEATURE, MEDICINE_DAILY_LIMIT),
        reason:
          result.confidenceReason ??
          'We could not identify this with enough certainty to tell you anything useful about it.',
      });
      return;
    }

    if (result.confidence < MIN_CONFIDENCE_FOR_DOSING) {
      result = withheldDosing(result);
    }

    // 6. History is written here, by the server, from the validated result. The
    //    browser used to POST this itself, which let anyone store whatever text
    //    they liked as a medical record under their own name.
    let savedId: string | null = null;
    try {
      const saved = await prisma.medicineAnalysis.create({
        data: {
          userId: user.id,
          name: result.name,
          uses: result.whatItTreats,
          dosage: result as unknown as Prisma.InputJsonValue,
          sideEffects: [...result.commonSideEffects, ...result.seriousSideEffects],
          warnings: [...result.doNotTakeIf, ...result.interactions],
          safetyVerdict: result.safetyVerdict,
          confidence: result.confidence,
          medicineName: body.medicineName ?? null,
          // The photo itself is never stored. It is somebody's medication, it
          // adds nothing to the record, and there is no blob storage here that
          // would keep it out of the database.
          imageUrl: null,
        },
      });
      savedId = saved.id;
    } catch (err) {
      // A history write that fails must not take the answer down with it.
      console.error('Failed to save medicine analysis', err);
    }

    ok(res, {
      analysis: result,
      id: savedId,
      allowance: await peek(user.id, FEATURE, MEDICINE_DAILY_LIMIT),
      dosingWithheld: result.confidence < MIN_CONFIDENCE_FOR_DOSING,
    });
  });
}
