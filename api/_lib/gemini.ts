import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');

export const MODEL_ID = 'gemini-flash-latest';

export function getModel() {
  return genAI.getGenerativeModel({ model: MODEL_ID });
}

export async function generateJSON<T>(prompt: string): Promise<T> {
  const model = getModel();
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json' },
  });
  return JSON.parse(result.response.text()) as T;
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
  const result = await model.generateContent({
    contents,
    systemInstruction: { role: 'system', parts: [{ text: system }] },
  });
  return result.response.text();
}
