import type { JournalEntry } from '@/types/api';
import { JOURNAL_TAG, type JournalDoc, type JournalEntryView, type ThemeId } from './types';
import { stripMarkdown } from './markdown';

/**
 * Codec between the rich journal document and the API's plain `content` string.
 *
 * Everything here is pure so it can be unit-tested in the node vitest env.
 */

export const MAX_CONTENT = 50_000; // matches JournalSave in api/_lib/schemas.ts

export function emptyDoc(theme: ThemeId = 'bloom'): JournalDoc {
  return { v: 1, text: '', theme, stickers: [], media: [], mood: undefined };
}

export function encodeDoc(doc: JournalDoc): string {
  return JSON.stringify(doc);
}

function isDoc(value: unknown): value is JournalDoc {
  if (typeof value !== 'object' || value === null) return false;
  const d = value as Partial<JournalDoc>;
  return d.v === 1 && typeof d.text === 'string';
}

/**
 * Rows predate this format (plain text from the old journal, and the
 * dashboard's intention entries), so a non-JSON `content` is not an error —
 * it is a plain-text entry and reads as one.
 */
export function decodeDoc(content: string): JournalDoc {
  const trimmed = content.trim();
  if (trimmed.startsWith('{')) {
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (isDoc(parsed)) {
        const d = parsed as JournalDoc;
        return {
          v: 1,
          text: d.text,
          theme: d.theme === 'carbon' ? 'carbon' : 'bloom',
          stickers: Array.isArray(d.stickers) ? d.stickers : [],
          media: Array.isArray(d.media) ? d.media : [],
          mood: d.mood,
        };
      }
    } catch {
      // Not our JSON. Fall through and treat it as prose.
    }
  }
  return { ...emptyDoc(), text: content };
}

export function toView(row: JournalEntry): JournalEntryView {
  return {
    id: row.id,
    title: row.title,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    tags: row.tags ?? [],
    doc: decodeDoc(row.content),
  };
}

export function isJournalRow(row: JournalEntry): boolean {
  return (row.tags ?? []).includes(JOURNAL_TAG);
}

/**
 * Human-readable text for any row, rich or plain. The dashboard uses this so a
 * rich entry never renders as raw JSON.
 */
export function plainText(content: string): string {
  // Entries are Markdown now, so strip the syntax — the dashboard card and
  // excerpts should never render a literal **bold**.
  return stripMarkdown(decodeDoc(content).text);
}

export function wordCount(text: string): number {
  return stripMarkdown(text).trim().split(/\s+/).filter(Boolean).length;
}

/** ~200 wpm, floored at one minute so a haiku doesn't say "0 min read". */
export function readingMinutes(text: string): number {
  return Math.max(1, Math.round(wordCount(text) / 200));
}

export function excerpt(text: string, max = 140): string {
  const clean = stripMarkdown(text).replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

/** First line, else the date. Used when the writer never titles an entry. */
export function deriveTitle(text: string, createdAt: string): string {
  const first = text.split('\n').map((l) => l.trim()).find(Boolean);
  if (first) return excerpt(first, 60);
  return new Date(createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' });
}

export function localDayKey(iso: string | Date): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Consecutive days ending today or yesterday that have at least one entry.
 * Yesterday still counts so the streak does not look broken before you write.
 */
export function writingStreak(dates: (string | Date)[], now: Date = new Date()): number {
  if (dates.length === 0) return 0;
  const days = new Set(dates.map(localDayKey));
  const cursor = new Date(now);
  if (!days.has(localDayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(localDayKey(cursor))) return 0;
  }
  let streak = 0;
  while (days.has(localDayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export interface JournalStats {
  entries: number;
  words: number;
  averageWords: number;
  streak: number;
  thisMonth: number;
}

export function buildStats(views: JournalEntryView[], now: Date = new Date()): JournalStats {
  const words = views.reduce((sum, v) => sum + wordCount(v.doc.text), 0);
  const thisMonth = views.filter((v) => {
    const d = new Date(v.createdAt);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;
  return {
    entries: views.length,
    words,
    averageWords: views.length ? Math.round(words / views.length) : 0,
    streak: writingStreak(views.map((v) => v.createdAt), now),
    thisMonth,
  };
}
