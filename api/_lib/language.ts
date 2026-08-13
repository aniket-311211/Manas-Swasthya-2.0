import type { VercelRequest } from '@vercel/node';

/**
 * What language the model should answer in.
 *
 * The interface translates, but almost every word a student actually reads on
 * this site is generated — a chat reply, an assessment summary, a medicine
 * explanation. Leaving those in English while the chrome switched to Odia gives
 * you a page that argues with itself.
 *
 * `AiChat` has carried an optional `language` field since the beginning and no
 * handler ever read it. It comes from a header now instead, so a single place
 * in the client sets it for every AI call rather than each call site
 * remembering to.
 */

export const SUPPORTED = ['en', 'hi', 'or', 'ks'] as const;
export type LanguageCode = (typeof SUPPORTED)[number];

const NAMES: Record<LanguageCode, string> = {
  en: 'English',
  hi: 'Hindi (Devanagari script)',
  or: 'Odia (Odia script)',
  ks: 'Kashmiri (Perso-Arabic script)',
};

const HEADER = 'x-manas-language';

/** The requested language, or English. Never trusts an arbitrary string. */
export function requestLanguage(req: VercelRequest): LanguageCode {
  const raw = req.headers[HEADER];
  const value = (Array.isArray(raw) ? raw[0] : raw) ?? '';
  const code = value.split('-')[0].toLowerCase();
  return (SUPPORTED as readonly string[]).includes(code) ? (code as LanguageCode) : 'en';
}

/**
 * A line to append to a prompt. Empty for English, so the existing prompts are
 * untouched in the common case rather than carrying a redundant instruction.
 *
 * The fallback clause matters: a model that cannot write fluent Kashmiri should
 * say so in English rather than produce something that looks like Kashmiri and
 * is not. On a mental-health service, confidently wrong phrasing is worse than
 * an honest language mismatch.
 */
export function languageInstruction(code: LanguageCode): string {
  if (code === 'en') return '';
  return `\n\nWrite your entire response in ${NAMES[code]}. Keep helpline numbers, medicine names and dosages exactly as they are — transliterate nothing that someone has to read aloud to an operator or match against a packet. If you cannot write fluent ${NAMES[code]}, answer in English instead rather than producing something approximate.`;
}

/** Convenience: read and render in one step. */
export function promptLanguageSuffix(req: VercelRequest): string {
  return languageInstruction(requestLanguage(req));
}
