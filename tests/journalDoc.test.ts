import { describe, it, expect } from 'vitest';
import {
  buildStats,
  decodeDoc,
  deriveTitle,
  emptyDoc,
  encodeDoc,
  excerpt,
  localDayKey,
  plainText,
  readingMinutes,
  toView,
  wordCount,
  writingStreak,
} from '@/features/journal/doc';
import { JOURNAL_TAG, type JournalDoc } from '@/features/journal/types';
import type { JournalEntry } from '@/types/api';

const row = (over: Partial<JournalEntry> = {}): JournalEntry => ({
  id: 'r1',
  userId: 'u1',
  title: null,
  content: 'plain thoughts',
  mood: null,
  tags: [],
  createdAt: '2026-08-06T09:00:00.000Z',
  updatedAt: '2026-08-06T09:00:00.000Z',
  ...over,
});

describe('encode / decode round trip', () => {
  it('preserves a full document', () => {
    const doc: JournalDoc = {
      v: 1,
      text: 'Walked by the lake.',
      theme: 'carbon',
      stickers: [{ id: 's1', stickerId: 'moon', x: 0.4, y: 0.2, size: 40, rotation: -8 }],
      media: [
        { id: 'm1', kind: 'photo', name: 'lake.jpg', mimeType: 'image/jpeg', bytes: 1024, createdAt: 'x' },
      ],
      mood: {
        mood: 'calm',
        confidence: 0.8,
        emotions: [{ emotion: 'peaceful', score: 0.7 }],
        themes: ['nature'],
        insight: 'A gentle evening.',
        generatedAt: 'x',
      },
    };
    expect(decodeDoc(encodeDoc(doc))).toEqual(doc);
  });
});

describe('decodeDoc tolerates everything already in the database', () => {
  it('reads a legacy plain-text row as prose, not an error', () => {
    const d = decodeDoc('just some words');
    expect(d.text).toBe('just some words');
    expect(d.theme).toBe('bloom');
    expect(d.stickers).toEqual([]);
  });

  it('treats a dashboard intention (plain text) as prose', () => {
    expect(decodeDoc('Finish the problem set').text).toBe('Finish the problem set');
  });

  it('falls back to prose for JSON that is not one of our docs', () => {
    expect(decodeDoc('{"foo":1}').text).toBe('{"foo":1}');
  });

  it('falls back to prose for malformed JSON that merely starts with a brace', () => {
    expect(decodeDoc('{not json').text).toBe('{not json');
  });

  it('repairs a doc with missing arrays rather than throwing', () => {
    const d = decodeDoc(JSON.stringify({ v: 1, text: 'hi' }));
    expect(d.stickers).toEqual([]);
    expect(d.media).toEqual([]);
    expect(d.theme).toBe('bloom');
  });

  it('coerces an unknown theme to bloom', () => {
    const d = decodeDoc(JSON.stringify({ v: 1, text: 'hi', theme: 'neon' }));
    expect(d.theme).toBe('bloom');
  });
});

describe('plainText', () => {
  it('unwraps a rich doc so the dashboard never shows raw JSON', () => {
    const encoded = encodeDoc({ ...emptyDoc(), text: 'Felt calmer after the walk.' });
    expect(plainText(encoded)).toBe('Felt calmer after the walk.');
    expect(plainText(encoded).startsWith('{')).toBe(false);
  });
});

describe('toView', () => {
  it('carries row metadata and decodes the doc', () => {
    const v = toView(row({ tags: [JOURNAL_TAG], content: encodeDoc({ ...emptyDoc('carbon'), text: 'x' }) }));
    expect(v.id).toBe('r1');
    expect(v.tags).toContain(JOURNAL_TAG);
    expect(v.doc.theme).toBe('carbon');
  });

  it('survives a null tags array from the API', () => {
    expect(toView(row({ tags: undefined as unknown as string[] })).tags).toEqual([]);
  });
});

describe('counts', () => {
  it('counts words ignoring surrounding and repeated whitespace', () => {
    expect(wordCount('  one   two \n three ')).toBe(3);
    expect(wordCount('')).toBe(0);
    expect(wordCount('   ')).toBe(0);
  });

  it('never reports a zero-minute read', () => {
    expect(readingMinutes('')).toBe(1);
    expect(readingMinutes('word '.repeat(400))).toBe(2);
  });

  it('truncates an excerpt with an ellipsis and collapses newlines', () => {
    expect(excerpt('a\nb', 10)).toBe('a b');
    const long = excerpt('x'.repeat(50), 10);
    expect(long).toHaveLength(10);
    expect(long.endsWith('…')).toBe(true);
  });
});

describe('deriveTitle', () => {
  it('uses the first non-empty line', () => {
    expect(deriveTitle('\n\n  Exam day  \nmore', '2026-08-06T09:00:00.000Z')).toBe('Exam day');
  });

  it('falls back to the date when there is no text', () => {
    expect(deriveTitle('   ', '2026-08-06T09:00:00.000Z')).toMatch(/August/);
  });
});

describe('writingStreak', () => {
  const at = (d: number) => new Date(2026, 7, d, 12).toISOString();

  it('counts consecutive days ending today', () => {
    expect(writingStreak([at(6), at(5), at(4)], new Date(2026, 7, 6, 20))).toBe(3);
  });

  it('stays alive when only yesterday is logged', () => {
    expect(writingStreak([at(5), at(4)], new Date(2026, 7, 6, 9))).toBe(2);
  });

  it('breaks on a gap', () => {
    expect(writingStreak([at(6), at(3)], new Date(2026, 7, 6, 20))).toBe(1);
  });

  it('counts two entries on one day once', () => {
    expect(writingStreak([at(6), at(6)], new Date(2026, 7, 6, 20))).toBe(1);
  });

  it('is zero for no entries and for a stale last entry', () => {
    expect(writingStreak([], new Date())).toBe(0);
    expect(writingStreak([at(1)], new Date(2026, 7, 6))).toBe(0);
  });
});

describe('localDayKey', () => {
  it('zero-pads to YYYY-MM-DD', () => {
    expect(localDayKey(new Date(2026, 0, 5, 10))).toBe('2026-01-05');
  });
});

describe('buildStats', () => {
  it('aggregates entries, words, average and month count', () => {
    const views = [
      toView(row({ id: 'a', content: 'one two three', createdAt: new Date(2026, 7, 6).toISOString() })),
      toView(row({ id: 'b', content: 'one', createdAt: new Date(2026, 6, 2).toISOString() })),
    ];
    const stats = buildStats(views, new Date(2026, 7, 6, 20));
    expect(stats.entries).toBe(2);
    expect(stats.words).toBe(4);
    expect(stats.averageWords).toBe(2);
    expect(stats.thisMonth).toBe(1);
  });

  it('does not divide by zero when empty', () => {
    expect(buildStats([], new Date()).averageWords).toBe(0);
  });
});
