import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RESOURCES, type Resource } from '@/lib/resources';
import {
  CATEGORIES,
  categoryOf,
  nextCode,
  resourceByCode,
  searchResources,
  suggestResources,
  withCodes,
} from '@/features/resources/catalogue';
import { hasFile, mediaTypeOf, mediaUrlOf, formatClock } from '@/features/resources/media';

describe('the shipped catalogue', () => {
  it('gives every entry a unique code', () => {
    const codes = RESOURCES.map((r) => r.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('files every entry into a real category', () => {
    for (const r of RESOURCES) {
      expect(categoryOf(r)).toBeDefined();
      expect(typeof categoryOf(r).accent).toBe('string');
    }
  });
});

describe('nextCode', () => {
  it('continues the series rather than colliding with an existing code', () => {
    for (const cat of CATEGORIES) {
      const code = nextCode(cat.kind, RESOURCES);
      expect(code.startsWith(`${cat.prefix}-`)).toBe(true);
      expect(RESOURCES.some((r) => r.code === code)).toBe(false);
    }
  });

  it('starts a fresh series when nothing exists yet', () => {
    const code = nextCode('music', []);
    expect(code).toMatch(/^MUS-\d+$/);
  });
});

describe('withCodes', () => {
  it('assigns unique codes across a whole batch, not the same one repeatedly', () => {
    const batch = [
      { id: 900, title: 'A', type: 'music', author: 'x', category: 'music', description: '', tags: [], thumbnail: '' },
      { id: 901, title: 'B', type: 'music', author: 'x', category: 'music', description: '', tags: [], thumbnail: '' },
      { id: 902, title: 'C', type: 'music', author: 'x', category: 'music', description: '', tags: [], thumbnail: '' },
    ] as Omit<Resource, 'code'>[];
    const out = withCodes(batch, RESOURCES);
    const codes = out.map((r) => r.code);
    expect(new Set(codes).size).toBe(3);
    for (const c of codes) expect(RESOURCES.some((r) => r.code === c)).toBe(false);
  });
});

describe('searchResources', () => {
  const first = RESOURCES[0];

  it('finds an exact code', () => {
    expect(searchResources(first.code).map((r) => r.id)).toContain(first.id);
  });

  it('finds a code typed without the dash, in any case', () => {
    const dashless = first.code.replace('-', '').toLowerCase();
    expect(searchResources(dashless).map((r) => r.id)).toContain(first.id);
  });

  it('finds by a fragment of the name, case-insensitively', () => {
    const fragment = first.title.slice(0, 5).toLowerCase();
    expect(searchResources(fragment).map((r) => r.id)).toContain(first.id);
  });

  it('finds by tag', () => {
    const tagged = RESOURCES.find((r) => r.tags.length > 0)!;
    expect(searchResources(tagged.tags[0]).map((r) => r.id)).toContain(tagged.id);
  });

  it('returns everything for an empty or whitespace query', () => {
    expect(searchResources('')).toHaveLength(RESOURCES.length);
    expect(searchResources('   ')).toHaveLength(RESOURCES.length);
  });

  it('returns nothing for a query that matches nothing', () => {
    expect(searchResources('zzzzzznotathing')).toEqual([]);
  });
});

describe('resourceByCode', () => {
  it('finds a real code and misses cleanly on a fake one', () => {
    expect(resourceByCode(RESOURCES[0].code)?.id).toBe(RESOURCES[0].id);
    expect(resourceByCode('NOPE-999')).toBeUndefined();
  });
});

describe('suggestResources', () => {
  it('never suggests something already in the recent list', () => {
    const recentCodes = RESOURCES.slice(0, 4).map((r) => r.code);
    const out = suggestResources({ recentCodes, limit: 5 });
    for (const r of out) expect(recentCodes).not.toContain(r.code);
  });

  it('respects the limit and still returns something with no history', () => {
    expect(suggestResources({ limit: 2 }).length).toBeLessThanOrEqual(2);
    expect(suggestResources({ recentCodes: [], limit: 3 }).length).toBeGreaterThan(0);
  });
});

describe('media resolution', () => {
  it('classifies each resource by the source it carries', () => {
    for (const r of RESOURCES) {
      const kind = mediaTypeOf(r);
      if (r.audioSrc) expect(kind).toBe('audio');
      else if (r.videoSrc) expect(kind).toBe('video');
      else if (r.pdfSrc) expect(kind).toBe('pdf');
      else expect(kind).toBeNull();
    }
  });

  it('resolves a bare filename into the media directory, not the site root', () => {
    const withMedia = RESOURCES.find((r) => mediaTypeOf(r) !== null)!;
    const url = mediaUrlOf(withMedia)!;
    expect(url.startsWith('/animation/')).toBe(true);
    // A bare name would 404 at the root — that was the original bug.
    expect(url.startsWith('/animation/')).toBe(true);
  });

  it('reports no file for a resource whose media was never uploaded', () => {
    // bird.mp3 is referenced but no audio file exists anywhere in public/.
    const audio = RESOURCES.find((r) => r.audioSrc);
    if (audio) expect(hasFile(audio)).toBe(false);
  });

  it('reports a file for the media that is genuinely on disk', () => {
    const pdf = RESOURCES.find((r) => r.pdfSrc === 'mindfulness-beginners.pdf');
    if (pdf) expect(hasFile(pdf)).toBe(true);
  });

  it('returns null for a resource with nothing attached', () => {
    const plain = RESOURCES.find((r) => mediaTypeOf(r) === null)!;
    expect(mediaUrlOf(plain)).toBeNull();
    expect(hasFile(plain)).toBe(false);
  });
});

describe('formatClock', () => {
  it('pads seconds and survives nonsense', () => {
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(9)).toBe('0:09');
    expect(formatClock(75)).toBe('1:15');
    expect(formatClock(NaN)).toBe('0:00');
    expect(formatClock(-5)).toBe('0:00');
  });
});

describe('recent resources store', () => {
  beforeEach(() => {
    vi.resetModules();
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    });
    vi.stubGlobal('window', { dispatchEvent: () => true, CustomEvent: class {} });
  });

  it('records newest first and deduplicates', async () => {
    const { recordAccess, recentCodes } = await import('@/features/resources/recent');
    recordAccess('MUS-101');
    recordAccess('BK-201');
    recordAccess('MUS-101');
    expect(recentCodes()).toEqual(['MUS-101', 'BK-201']);
  });

  it('ignores an empty code', async () => {
    const { recordAccess, recentCodes } = await import('@/features/resources/recent');
    recordAccess('');
    recordAccess('   ');
    expect(recentCodes()).toEqual([]);
  });

  it('returns an empty list rather than throwing on corrupt storage', async () => {
    localStorage.setItem('nmc:resources:recent:v1', '{not json');
    const { recentCodes } = await import('@/features/resources/recent');
    expect(recentCodes()).toEqual([]);
  });

  it('skips codes that no longer exist in the catalogue', async () => {
    const { recordAccess, recentResources } = await import('@/features/resources/recent');
    recordAccess('GONE-999');
    recordAccess(RESOURCES[0].code);
    const out = recentResources(5);
    expect(out).toHaveLength(1);
    expect(out[0].code).toBe(RESOURCES[0].code);
  });

  it('does not throw when storage refuses to write', async () => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceeded');
      },
      removeItem: () => undefined,
    });
    const { recordAccess } = await import('@/features/resources/recent');
    expect(() => recordAccess('MUS-101')).not.toThrow();
  });
});
