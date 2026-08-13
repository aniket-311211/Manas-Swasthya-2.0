import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');

export const MODEL_ID = 'gemini-flash-latest';

export function getModel() {
  return genAI.getGenerativeModel({ model: MODEL_ID });
}

async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < retries) await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
    }
  }
  throw lastErr;
}

export async function generateJSON<T>(prompt: string): Promise<T> {
  return withRetry(async () => {
    const model = getModel();
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    });
    return JSON.parse(result.response.text()) as T;
  });
}

export async function generateText(
  system: string,
  messages: { role: string; content: string }[],
): Promise<string> {
  const model = getModel();
  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
    parts: [{ text: m.content }],
  }));
  return withRetry(async () => {
    const result = await model.generateContent({
      contents,
      systemInstruction: { role: 'system', parts: [{ text: system }] },
    });
    return result.response.text();
  });
}

/**
 * `mimeType` defaults to JPEG only because existing callers pass a data URL and
 * relied on that. Pass the real type when you know it — a PNG announced as a
 * JPEG is a worse image for the model to read, and this endpoint is asked to
 * make out small print on a foil strip.
 */
export async function generateJSONWithImage<T>(
  prompt: string,
  imageBase64: string,
  mimeType = 'image/jpeg',
): Promise<T> {
  const data = imageBase64.replace(/^data:image\/[a-z0-9.+-]+;base64,/i, '');
  return withRetry(async () => {
    const model = getModel();
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }, { inlineData: { mimeType, data } }],
        },
      ],
      generationConfig: { responseMimeType: 'application/json' },
    });
    return JSON.parse(result.response.text()) as T;
  });
}
