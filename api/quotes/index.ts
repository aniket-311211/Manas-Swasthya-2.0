import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ok, methodGuard, queryStr } from '../_lib/http';
import { allow } from '../_lib/ratelimit';

/**
 * GET /api/quotes?tone=gentle|steady|bright → { text, author, source }
 *
 * A proxy, not a convenience. Calling a stranger's quote API straight from the
 * page means their CORS policy, their uptime and their rate limit all become
 * our results screen. Here there is one place to cache, one place to fail, and
 * one place to filter tone.
 *
 * Upstream is zenquotes.io. api.quotable.io — the obvious first choice — no
 * longer resolves in DNS at all, so it is not an option. ZenQuotes is free, no
 * auth, and answers in ~1s; it throttles at 5 requests per 30s per IP, which is
 * exactly what the cache below is for.
 *
 * There is no withErrors wrapper and no 429: this endpoint always answers 200
 * with a usable quote. A decoration is never worth an error state here.
 */

interface Quote {
  text: string;
  author: string;
  source: 'api' | 'local';
}

const TONES = ['gentle', 'steady', 'bright'] as const;
const TTL_MS = 30 * 60_000;
const UPSTREAM_TIMEOUT_MS = 3_000;
const MAX_QUOTE_LEN = 180;

/**
 * Duplicated from src/features/assessment/quotes.ts, the same way
 * detectCrisisServer in api/ai/chat.ts duplicates src/lib/crisis.ts. Nothing
 * under api/ imports from src/: that module pulls in src/lib/api.ts, which
 * reads `import.meta.env` at module scope and throws under Node. Edit one,
 * edit the other — the client re-checks this filter as a second net.
 */
const HARSH: RegExp[] = [
  /\bgrind(?:set)?\b/i,
  /\bhustle\b/i,
  /\bwhatever it takes\b/i,
  /\bsacrifice\b/i,
  /\bweak(?:ness|lings?)?\b/i,
  /\b(?:tough(?:en)?|man|suck it) up\b/i,
  /\bbeast\b/i,
  /\bno pain,? no gain\b/i,
  /\bpain is (?:temporary|weakness)\b/i,
  /\bsuffer(?:s|ed|ing)?\b/i,
  /\bno excuses?\b/i,
  /\bstop (?:making )?excuses\b/i,
  /\bonly you can\b/i,
  /\bnobody(?: else)? (?:is going to |will )?(?:save|rescue) you\b/i,
  /\blosers?\b/i,
  /\bwinners?\b/i,
  /\bmediocr/i,
];

/** Mirrors LOCAL_QUOTES in src/features/assessment/quotes.ts. */
const LOCAL_QUOTES: Quote[] = [
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

function isGentleEnough(text: string): boolean {
  const t = text.trim();
  if (t.length === 0 || t.length > MAX_QUOTE_LEN) return false;
  return !HARSH.some((p) => p.test(t));
}

function localQuote(): Quote {
  return LOCAL_QUOTES[Math.floor(Math.random() * LOCAL_QUOTES.length)];
}

// ponytail: plain Map, one process. Cold starts and multiple lambdas each get
// their own — fine at this volume. Reach for Redis when the upstream complains.
const cache = new Map<string, { quote: Quote; at: number }>();

/** Null on anything we would not show: down, slow, throttled, or off-tone. */
async function fromUpstream(): Promise<Quote | null> {
  try {
    const res = await fetch('https://zenquotes.io/api/random', {
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      headers: { accept: 'application/json' },
    });
    if (!res.ok) return null;
    const body: unknown = await res.json();
    const first = Array.isArray(body) ? (body[0] as Record<string, unknown> | undefined) : undefined;
    const text = typeof first?.q === 'string' ? first.q.trim() : '';
    const rawAuthor = typeof first?.a === 'string' ? first.a.trim() : '';
    // A throttled ZenQuotes answers 200 with an advert attributed to itself.
    if (rawAuthor.toLowerCase() === 'zenquotes.io') return null;
    if (!isGentleEnough(text)) return null;
    return { text, author: rawAuthor || 'Anonymous', source: 'api' };
  } catch {
    return null;
  }
}

async function quoteFor(tone: string, caller: string): Promise<Quote> {
  const hit = cache.get(tone);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.quote;

  // The limit protects the upstream, not us — a throttled caller still gets a
  // quote, just a local one.
  if (!allow(`quotes:${caller}`, 20, 60_000)) return localQuote();

  const fresh = await fromUpstream();
  if (!fresh) return localQuote();
  cache.set(tone, { quote: fresh, at: Date.now() });
  return fresh;
}

function callerKey(req: VercelRequest): string {
  const fwd = req.headers['x-forwarded-for'];
  return (Array.isArray(fwd) ? fwd[0] : fwd)?.split(',')[0]?.trim() || 'anon';
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!methodGuard(req, res, ['GET'])) return;
  const raw = queryStr(req, 'tone');
  // ponytail: tone only partitions the cache — ZenQuotes has no tone parameter
  // and the local set is warm end to end. Bucket the local set by tone if that
  // stops being true.
  const tone = (TONES as readonly string[]).includes(raw ?? '') ? (raw as string) : 'steady';
  ok(res, await quoteFor(tone, callerKey(req)));
}
