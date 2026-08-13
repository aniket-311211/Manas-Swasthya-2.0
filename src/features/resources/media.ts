import type { Resource } from '@/lib/resources';

/**
 * Where a resource's file actually lives.
 *
 * The catalogue stores bare filenames (`bird.mp3`, `mindfulness-beginners.pdf`)
 * but the files sit in `public/animation/`. A bare name resolves to the site
 * root and 404s, which is why nothing played before.
 *
 * VERIFIED ON DISK at the time of writing:
 *   public/animation/mindfulness-beginners.pdf              ✓
 *   public/animation/Inside Out - Emotional Intelligence.mp4 ✓
 *   public/animation/Thought Bubbles! For Anxiety & Worry..mp4 ✓
 * MISSING: every audio file, and one video. No .mp3, .wav, .m4a or .ogg exists
 * anywhere in public/. Rather than render a player that silently does nothing,
 * `hasFile` reports false and the viewer says so.
 *
 * Entries that advertise a running time now always name the file they want,
 * even when it is not there yet. Naming nothing meant `mediaTypeOf` returned
 * null and the viewer quietly fell through to the article reader — so a twenty
 * minute music track opened as a paragraph of text with no player and no
 * explanation. Naming it produces the honest "no file attached yet" card.
 */

const MEDIA_DIR = '/animation/';

/** Files confirmed present. Add to this when you drop new media in. */
const PRESENT = new Set([
  'mindfulness-beginners.pdf',
  'Inside Out - Emotional Intelligence.mp4',
  'Thought Bubbles! For Anxiety & Worry..mp4',
]);

export type MediaType = 'audio' | 'video' | 'pdf' | null;

export function mediaTypeOf(r: Resource): MediaType {
  if (r.audioSrc) return 'audio';
  if (r.videoSrc) return 'video';
  if (r.pdfSrc) return 'pdf';
  return null;
}

export function mediaFileOf(r: Resource): string | null {
  return r.audioSrc ?? r.videoSrc ?? r.pdfSrc ?? null;
}

/** Absolute URL for a stored filename. Already-absolute paths pass through. */
export function mediaUrlOf(r: Resource): string | null {
  const file = mediaFileOf(r);
  if (!file) return null;
  if (/^(https?:|\/)/.test(file)) return file;
  return MEDIA_DIR + encodeURIComponent(file);
}

/**
 * Whether the file is actually there. A resource can claim `hasAudio: true`
 * and still have nothing behind it — that is the current state of the music
 * category, and pretending otherwise would be a broken play button.
 */
export function hasFile(r: Resource): boolean {
  const file = mediaFileOf(r);
  if (!file) return false;
  if (/^(https?:|\/)/.test(file)) return true;
  return PRESENT.has(file);
}

export function formatClock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const s = Math.floor(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
