import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ACCENTS,
  DEFAULT_PREFS,
  FONTS,
  PAPERS,
  SCALE_MAX,
  SCALE_MIN,
  loadPrefs,
  savePrefs,
  type JournalPrefs,
} from '@/features/journal/prefs';

/**
 * The prefs live in localStorage, which is user-writable, survives a bad
 * deploy, and is missing entirely in private mode. Every case here is one of
 * those, not a hypothetical.
 */

const KEY = 'nmc:journal:prefs:v1';

/** Minimal Storage. Only the two methods prefs.ts touches actually do anything. */
function fakeStore(initial: string | null = null) {
  let value = initial;
  return {
    getItem: (k: string) => (k === KEY ? value : null),
    setItem: (k: string, v: string) => {
      if (k === KEY) value = v;
    },
    removeItem: () => {
      value = null;
    },
    clear: () => {
      value = null;
    },
    key: () => null,
    length: 0,
  } as unknown as Storage;
}

/** Stores `raw` verbatim, so hand-edited and half-written values are testable. */
function withRaw(raw: string | null) {
  vi.stubGlobal('localStorage', fakeStore(raw));
}

const stored = (value: unknown) => withRaw(JSON.stringify(value));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('the tables themselves', () => {
  it('every accent is a six-digit hex, and no two are the same colour', () => {
    for (const a of ACCENTS) expect(a.hex, a.name).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(new Set(ACCENTS.map((a) => a.hex.toLowerCase())).size).toBe(ACCENTS.length);
    expect(new Set(ACCENTS.map((a) => a.id)).size).toBe(ACCENTS.length);
  });

  it('only names font families the app already loads — a new one means a new download', () => {
    // @fontsource in index.css, the Google link in index.html, and the system stacks.
    const LOADED = /Inter Variable|Playfair Display Variable|Instrument Serif|Barlow|ui-monospace/;
    for (const f of FONTS) expect(f.stack, f.name).toMatch(LOADED);
    expect(new Set(FONTS.map((f) => f.id)).size).toBe(FONTS.length);
  });

  it('has a default that is already a valid, in-range set of prefs', () => {
    stored(DEFAULT_PREFS);
    expect(loadPrefs()).toEqual(DEFAULT_PREFS);
    expect(PAPERS.some((p) => p.id === DEFAULT_PREFS.paper)).toBe(true);
    expect(FONTS.some((f) => f.id === DEFAULT_PREFS.fontId)).toBe(true);
    expect(DEFAULT_PREFS.fontScale).toBeGreaterThanOrEqual(SCALE_MIN);
    expect(DEFAULT_PREFS.fontScale).toBeLessThanOrEqual(SCALE_MAX);
  });
});

describe('loadPrefs — nothing to read', () => {
  it('falls back to the defaults when the key was never written', () => {
    withRaw(null);
    expect(loadPrefs()).toEqual(DEFAULT_PREFS);
  });

  it('falls back when there is no localStorage at all, as in a locked-down browser', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(() => loadPrefs()).not.toThrow();
    expect(loadPrefs()).toEqual(DEFAULT_PREFS);
  });

  it('falls back when reading the store itself throws', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new DOMException('The operation is insecure.');
      },
    } as unknown as Storage);
    expect(loadPrefs()).toEqual(DEFAULT_PREFS);
  });

  it('hands back a fresh object, so a caller mutating it cannot poison the next read', () => {
    withRaw(null);
    const first = loadPrefs();
    first.accent = '#000000';
    first.fontScale = 99;
    expect(loadPrefs()).toEqual(DEFAULT_PREFS);
  });
});

describe('loadPrefs — corrupt JSON', () => {
  it('survives a half-written value', () => {
    withRaw('{"theme":"carbon","acce');
    expect(loadPrefs()).toEqual(DEFAULT_PREFS);
  });

  it('survives anything that is not JSON', () => {
    for (const raw of ['', 'undefined', 'not json at all', '{{}}', '[1,2']) {
      withRaw(raw);
      expect(loadPrefs(), raw).toEqual(DEFAULT_PREFS);
    }
  });

  it('survives valid JSON that is not an object', () => {
    for (const raw of ['null', '42', '"carbon"', 'true', '[]']) {
      withRaw(raw);
      expect(loadPrefs(), raw).toEqual(DEFAULT_PREFS);
    }
  });
});

describe('loadPrefs — partial and wrong-typed', () => {
  it('keeps the fields that are good and defaults only the missing ones', () => {
    stored({ theme: 'carbon', accent: '#2F7D74' });
    expect(loadPrefs()).toEqual({
      ...DEFAULT_PREFS,
      theme: 'carbon',
      accent: '#2F7D74',
    });
  });

  it('repairs field by field — one bad key never wipes the rest', () => {
    stored({
      theme: 'carbon',
      accent: 12345,
      paper: 'grid',
      fontId: { id: 'mono' },
      fontScale: 1.2,
      ruled: 'yes please',
    });
    expect(loadPrefs()).toEqual({
      theme: 'carbon',
      accent: DEFAULT_PREFS.accent,
      paper: 'grid',
      fontId: DEFAULT_PREFS.fontId,
      fontScale: 1.2,
      ruled: DEFAULT_PREFS.ruled,
    });
  });

  it('defaults every field when every field is the wrong type', () => {
    stored({ theme: 5, accent: [], paper: true, fontId: null, fontScale: '1.1', ruled: 1 });
    expect(loadPrefs()).toEqual(DEFAULT_PREFS);
  });

  it('ignores keys that are not ours', () => {
    stored({ ...DEFAULT_PREFS, sparkles: true, __proto__: { polluted: true } });
    expect(loadPrefs()).toEqual(DEFAULT_PREFS);
    expect(Object.keys(loadPrefs()).sort()).toEqual(Object.keys(DEFAULT_PREFS).sort());
  });
});

describe('loadPrefs — unknown ids', () => {
  it('falls back for a paper, font or theme that no longer exists', () => {
    stored({ theme: 'neon', paper: 'papyrus', fontId: 'comic-sans' });
    const prefs = loadPrefs();
    expect(prefs.theme).toBe('bloom');
    expect(prefs.paper).toBe(DEFAULT_PREFS.paper);
    expect(prefs.fontId).toBe(DEFAULT_PREFS.fontId);
  });

  it('accepts every id the tables actually offer', () => {
    for (const p of PAPERS) {
      for (const f of FONTS) {
        stored({ paper: p.id, fontId: f.id });
        expect(loadPrefs().paper, p.id).toBe(p.id);
        expect(loadPrefs().fontId, f.id).toBe(f.id);
      }
    }
    for (const theme of ['bloom', 'carbon'] as const) {
      stored({ theme });
      expect(loadPrefs().theme).toBe(theme);
    }
  });
});

describe('loadPrefs — accent is a colour, and it goes into a style attribute', () => {
  it('takes any real hex, three digits or six', () => {
    for (const hex of ['#abc', '#ABCDEF', '#000000', '#c4557a']) {
      stored({ accent: hex });
      expect(loadPrefs().accent, hex).toBe(hex);
    }
  });

  it('rejects anything that is not a hex, however plausible', () => {
    for (const junk of ['red', 'rgb(1,2,3)', '#ggg', '#12345', 'C4557A', '', 'url(evil)']) {
      stored({ accent: junk });
      expect(loadPrefs().accent, junk).toBe(DEFAULT_PREFS.accent);
    }
  });
});

describe('loadPrefs — fontScale', () => {
  it('clamps to the slider range at both ends', () => {
    stored({ fontScale: 99 });
    expect(loadPrefs().fontScale).toBe(SCALE_MAX);
    stored({ fontScale: -4 });
    expect(loadPrefs().fontScale).toBe(SCALE_MIN);
    stored({ fontScale: 0 });
    expect(loadPrefs().fontScale).toBe(SCALE_MIN);
  });

  it('keeps a value already inside the range untouched', () => {
    for (const n of [SCALE_MIN, 1, 1.15, SCALE_MAX]) {
      stored({ fontScale: n });
      expect(loadPrefs().fontScale, String(n)).toBe(n);
    }
  });

  it('defaults rather than clamping when the value is not a finite number', () => {
    // Infinity and NaN both serialise to null, which is exactly what a bad
    // write leaves behind.
    for (const raw of ['{"fontScale":null}', '{"fontScale":"1.1"}', '{"fontScale":{}}']) {
      withRaw(raw);
      expect(loadPrefs().fontScale, raw).toBe(DEFAULT_PREFS.fontScale);
    }
  });
});

describe('savePrefs', () => {
  const custom: JournalPrefs = {
    theme: 'carbon',
    accent: '#6B57A6',
    paper: 'linen',
    fontId: 'mono',
    fontScale: 1.25,
    ruled: false,
  };

  it('round-trips through loadPrefs', () => {
    withRaw(null);
    savePrefs(custom);
    expect(loadPrefs()).toEqual(custom);
  });

  it('swallows a full quota — a cosmetic choice never breaks the page', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => {
        throw new DOMException('QuotaExceededError');
      },
    } as unknown as Storage);
    expect(() => savePrefs(custom)).not.toThrow();
    expect(loadPrefs()).toEqual(DEFAULT_PREFS);
  });

  it('swallows a missing store, as in private mode', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(() => savePrefs(custom)).not.toThrow();
  });
});
