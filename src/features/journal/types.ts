/**
 * Journal domain types.
 *
 * Storage split, forced by what this project actually has:
 *  - The entry DOCUMENT (text, stickers, theme, AI mood) is JSON, saved to
 *    Postgres through the existing /journal endpoint's `content` field. Real
 *    persistence, cross-device, and it shows up on the dashboard.
 *  - MEDIA BLOBS (photos, audio) live in IndexedDB on the device. There is no
 *    object storage configured — `.env` has Postgres and Gemini and nothing
 *    else — and base64 in a Postgres text column would be indefensible.
 *    Entries reference media by id; see media.ts.
 */

export type ThemeId = 'bloom' | 'carbon';

export type MoodKey = 'happy' | 'calm' | 'excited' | 'neutral' | 'anxious' | 'sad';

export interface PlacedSticker {
  /** Instance id, unique within an entry. */
  id: string;
  /** Key into the sticker pack. */
  stickerId: string;
  /** Position as a fraction of the canvas (0–1), so it survives any resize. */
  x: number;
  y: number;
  /** Rendered size in px at a 1x canvas. */
  size: number;
  /** Degrees. */
  rotation: number;
}

export type MediaKind = 'photo' | 'audio';

/** Pointer to a blob in IndexedDB. The blob itself never enters the document. */
export interface MediaRef {
  id: string;
  kind: MediaKind;
  /** Original filename or a generated label, shown in the UI. */
  name: string;
  mimeType: string;
  bytes: number;
  /** Audio only, seconds. */
  duration?: number;
  createdAt: string;
}

export interface EmotionScore {
  emotion: string;
  /** 0–1 */
  score: number;
}

export interface MoodAnalysis {
  mood: MoodKey;
  /** 0–1 */
  confidence: number;
  emotions: EmotionScore[];
  themes: string[];
  /** One warm, non-clinical sentence. Never a diagnosis. */
  insight: string;
  generatedAt: string;
}

/** What actually gets written to the API `content` field, as JSON. */
export interface JournalDoc {
  /** Bumped when the shape changes so old rows stay readable. */
  v: 1;
  text: string;
  theme: ThemeId;
  stickers: PlacedSticker[];
  media: MediaRef[];
  mood?: MoodAnalysis;
}

/** A doc plus the row metadata the API owns. */
export interface JournalEntryView {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  doc: JournalDoc;
}

/** Marks a row as a rich journal doc rather than a plain-text entry. */
export const JOURNAL_TAG = 'journal:v1';

export const MOODS: { key: MoodKey; label: string; emoji: string }[] = [
  { key: 'happy', label: 'Happy', emoji: '😄' },
  { key: 'calm', label: 'Calm', emoji: '😌' },
  { key: 'excited', label: 'Excited', emoji: '🤩' },
  { key: 'neutral', label: 'Neutral', emoji: '😐' },
  { key: 'anxious', label: 'Anxious', emoji: '😰' },
  { key: 'sad', label: 'Sad', emoji: '😔' },
];

export const MOOD_META: Record<MoodKey, { label: string; emoji: string; tint: string; ink: string }> = {
  happy: { label: 'Happy', emoji: '😄', tint: '#FFE9B8', ink: '#7A5A12' },
  calm: { label: 'Calm', emoji: '😌', tint: '#CFE6DC', ink: '#1F5445' },
  excited: { label: 'Excited', emoji: '🤩', tint: '#FFD9C7', ink: '#8A3E1B' },
  neutral: { label: 'Neutral', emoji: '😐', tint: '#E4E7EE', ink: '#41485A' },
  anxious: { label: 'Anxious', emoji: '😰', tint: '#E6DCF5', ink: '#4A3A78' },
  sad: { label: 'Sad', emoji: '😔', tint: '#D6E0F0', ink: '#2E3A59' },
};
