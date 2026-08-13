import { request } from '@/lib/api';

/**
 * The one line of borrowed warmth under an assessment result.
 *
 * Everything here except `fetchQuote` is pure so the tone filter — the part
 * that actually matters — is testable without a network. The upstream call
 * goes through our own `/api/quotes` proxy rather than a third party directly:
 * see api/quotes/index.ts for why.
 */

export interface Quote {
  text: string;
  author: string;
  source: 'api' | 'local';
}

export type Tone = 'gentle' | 'steady' | 'bright';

/** Longer than this stops being a line to take with you and starts being reading. */
export const MAX_QUOTE_LEN = 180;

/**
 * Framings that must never appear under someone's mental-health result.
 *
 * All of these are the same claim wearing different clothes: that feeling bad
 * is a discipline problem and the fix is to want it more. Word-boundary
 * anchored on purpose — `\bgrind\b` rejects "rise and grind" and leaves
 * "grinding coffee" alone.
 *
 * Over-rejecting costs nothing here: we fall back to a warm local line.
 * Under-rejecting puts hustle-culture blame under a hard score.
 */
const HARSH: RegExp[] = [
  // Effort as moral worth.
  /\bgrind(?:set)?\b/i,
  /\bhustle\b/i,
  /\bwhatever it takes\b/i,
  /\bsacrifice\b/i,
  // Feeling bad recast as a character flaw.
  /\bweak(?:ness|lings?)?\b/i,
  /\b(?:tough(?:en)?|man|suck it) up\b/i,
  /\bbeast\b/i,
  // Pain as a teacher.
  /\bno pain,? no gain\b/i,
  /\bpain is (?:temporary|weakness)\b/i,
  /\bsuffer(?:s|ed|ing)?\b/i,
  // It is on you, and only you.
  /\bno excuses?\b/i,
  /\bstop (?:making )?excuses\b/i,
  /\bonly you can\b/i,
  /\bnobody(?: else)? (?:is going to |will )?(?:save|rescue) you\b/i,
  // Winners, and therefore losers.
  /\blosers?\b/i,
  /\bwinners?\b/i,
  /\bmediocr/i,
];

/**
 * Warm, non-clinical, and used whenever the upstream is down, slow, throttled
 * or says something we would not want on this screen. Attributed where the
 * attribution is solid, Anonymous where it is folklore.
 */
export const LOCAL_QUOTES: Quote[] = [
  { text: 'No feeling is final.', author: 'Rainer Maria Rilke', source: 'local' },
  {
    text: 'Nothing ever goes away until it has taught us what we need to know.',
    author: 'Pema Chödrön',
    source: 'local',
  },
  { text: 'Rest is not idleness.', author: 'John Lubbock', source: 'local' },
  {
    text: 'You are allowed to be both a masterpiece and a work in progress, simultaneously.',
    author: 'Sophia Bush',
    source: 'local',
  },
  {
    text: 'Start where you are. Use what you have. Do what you can.',
    author: 'Arthur Ashe',
    source: 'local',
  },
  {
    text: 'You are a child of the universe, no less than the trees and the stars; you have a right to be here.',
    author: 'Max Ehrmann',
    source: 'local',
  },
  {
    text: 'This being human is a guest house. Every morning a new arrival.',
    author: 'Rumi',
    source: 'local',
  },
  {
    text: 'Hope is the thing with feathers that perches in the soul.',
    author: 'Emily Dickinson',
    source: 'local',
  },
  {
    text: 'Almost everything will work again if you unplug it for a few minutes, including you.',
    author: 'Anne Lamott',
    source: 'local',
  },
  {
    text: 'Caring for myself is not self-indulgence, it is self-preservation.',
    author: 'Audre Lorde',
    source: 'local',
  },
  {
    text: 'You are not required to set yourself on fire to keep other people warm.',
    author: 'Anonymous',
    source: 'local',
  },
  {
    text: 'Go easy on yourself. Whatever you do today, let it be enough.',
    author: 'Anonymous',
    source: 'local',
  },
];

/** The tone filter. Pure — same string in, same verdict out. */
export function isGentleEnough(text: string): boolean {
  const t = text.trim();
  if (t.length === 0 || t.length > MAX_QUOTE_LEN) return false;
  return !HARSH.some((p) => p.test(t));
}

/**
 * Harder result, gentler quote. The boundaries are riskFrom()'s overall bands
 * in scoring.ts (high below 40, moderate below 65) so the quote never sounds
 * brighter than the number above it.
 */
export function toneFor(overall: number): Tone {
  if (overall < 40) return 'gentle';
  if (overall < 65) return 'steady';
  return 'bright';
}

function localQuote(): Quote {
  return LOCAL_QUOTES[Math.floor(Math.random() * LOCAL_QUOTES.length)];
}

/**
 * Never rejects. A quote we could not fetch is not worth an error state on a
 * results screen, so every failure — network, envelope, or a line that got
 * past the server's copy of the filter — lands on a local one.
 */
export async function fetchQuote(tone: string): Promise<Quote> {
  try {
    const q = await request<Quote>(`/quotes?tone=${encodeURIComponent(tone)}`);
    return q && typeof q.text === 'string' && isGentleEnough(q.text) ? q : localQuote();
  } catch {
    return localQuote();
  }
}
