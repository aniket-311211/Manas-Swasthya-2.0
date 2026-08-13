import type { ThemeId } from './types';

/**
 * The sticker pack.
 *
 * ponytail: Unicode emoji, not an SVG/PNG asset set. They ship with the OS,
 * render at any size, cost zero bytes, need no licence and no loader — and the
 * entry document only ever stores the id, so the pack can be swapped for real
 * artwork later without touching a single saved entry.
 */

export type StickerCategory = 'feeling' | 'people' | 'doing' | 'nature' | 'treats' | 'marks';

export interface Sticker {
  id: string;
  name: string;
  glyph: string;
  category: StickerCategory;
  /** 'both' shows in either theme. */
  theme: ThemeId | 'both';
}

export const STICKER_CATEGORIES: { key: StickerCategory; label: string }[] = [
  { key: 'feeling', label: 'Feelings' },
  { key: 'people', label: 'People' },
  { key: 'doing', label: 'Doing' },
  { key: 'nature', label: 'Nature' },
  { key: 'treats', label: 'Treats' },
  { key: 'marks', label: 'Marks' },
];

const s = (
  id: string,
  name: string,
  glyph: string,
  category: StickerCategory,
  theme: ThemeId | 'both' = 'both',
): Sticker => ({ id, name, glyph, category, theme });

export const STICKERS: Sticker[] = [
  // Feelings
  s('joy', 'Joy', '😄', 'feeling'),
  s('calm', 'Calm', '😌', 'feeling'),
  s('love', 'Love', '🥰', 'feeling'),
  s('proud', 'Proud', '😎', 'feeling'),
  s('tired', 'Tired', '🥱', 'feeling'),
  s('teary', 'Teary', '🥲', 'feeling'),
  s('anxious', 'Anxious', '😰', 'feeling'),
  s('angry', 'Angry', '😤', 'feeling'),
  s('heart', 'Heart', '❤️', 'feeling'),
  s('pink-heart', 'Pink heart', '💖', 'feeling', 'bloom'),
  s('fire-heart', 'Fired up', '🔥', 'feeling', 'carbon'),
  s('mind-blown', 'Mind blown', '🤯', 'feeling', 'carbon'),

  // People
  s('friends', 'Friends', '👯', 'people'),
  s('family', 'Family', '🏡', 'people'),
  s('call', 'Call home', '📞', 'people'),
  s('hug', 'Hug', '🤗', 'people'),
  s('alone', 'Alone time', '🧘', 'people'),
  s('crowd', 'Crowd', '🫂', 'people'),

  // Doing
  s('study', 'Study', '📚', 'doing'),
  s('exam', 'Exam', '📝', 'doing'),
  s('code', 'Code', '💻', 'doing'),
  s('gym', 'Gym', '🏋️', 'doing'),
  s('run', 'Run', '🏃', 'doing'),
  s('walk', 'Walk', '🚶', 'doing'),
  s('sleep', 'Sleep', '😴', 'doing'),
  s('music', 'Music', '🎧', 'doing'),
  s('game', 'Game', '🎮', 'doing', 'carbon'),
  s('art', 'Art', '🎨', 'doing', 'bloom'),
  s('read', 'Read', '📖', 'doing'),
  s('travel', 'Travel', '✈️', 'doing'),

  // Nature
  s('sun', 'Sun', '☀️', 'nature'),
  s('moon', 'Moon', '🌙', 'nature'),
  s('rain', 'Rain', '🌧️', 'nature'),
  s('cloud', 'Cloud', '☁️', 'nature'),
  s('rainbow', 'Rainbow', '🌈', 'nature'),
  s('blossom', 'Blossom', '🌸', 'nature', 'bloom'),
  s('rose', 'Rose', '🌹', 'nature', 'bloom'),
  s('leaf', 'Leaf', '🍃', 'nature'),
  s('wave', 'Wave', '🌊', 'nature'),
  s('mountain', 'Mountain', '⛰️', 'nature', 'carbon'),
  s('bolt', 'Lightning', '⚡', 'nature', 'carbon'),
  s('butterfly', 'Butterfly', '🦋', 'nature', 'bloom'),

  // Treats
  s('chai', 'Chai', '☕', 'treats'),
  s('cake', 'Cake', '🍰', 'treats', 'bloom'),
  s('samosa', 'Snack', '🥟', 'treats'),
  s('mango', 'Mango', '🥭', 'treats'),
  s('icecream', 'Ice cream', '🍦', 'treats', 'bloom'),
  s('pizza', 'Pizza', '🍕', 'treats', 'carbon'),
  s('noodles', 'Noodles', '🍜', 'treats'),

  // Marks
  s('star', 'Star', '⭐', 'marks'),
  s('sparkles', 'Sparkles', '✨', 'marks', 'bloom'),
  s('check', 'Done', '✅', 'marks'),
  s('pin', 'Pin', '📌', 'marks'),
  s('bulb', 'Idea', '💡', 'marks'),
  s('target', 'Goal', '🎯', 'marks'),
  s('crown', 'Crown', '👑', 'marks', 'bloom'),
  s('skull', 'Brutal', '💀', 'marks', 'carbon'),
  s('hundred', 'Hundred', '💯', 'marks', 'carbon'),
  s('warning', 'Careful', '⚠️', 'marks'),
];

export const STICKER_BY_ID: Record<string, Sticker> = Object.fromEntries(
  STICKERS.map((sticker) => [sticker.id, sticker]),
);

export function stickersFor(theme: ThemeId, category?: StickerCategory): Sticker[] {
  return STICKERS.filter(
    (sticker) =>
      (sticker.theme === 'both' || sticker.theme === theme) &&
      (!category || sticker.category === category),
  );
}

/** Unknown ids (a pack change, a hand-edited row) render as a neutral mark. */
export function glyphFor(stickerId: string): string {
  return STICKER_BY_ID[stickerId]?.glyph ?? '⭐';
}
