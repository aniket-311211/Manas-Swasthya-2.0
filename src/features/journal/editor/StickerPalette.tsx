import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Check, Search } from 'lucide-react';
import { STICKER_BY_ID, STICKER_CATEGORIES, stickersFor } from '../stickers';
import type { StickerCategory } from '../stickers';
import type { ThemeId } from '../types';
import { FOCUS, GLASS } from '@/components/shell/theme';

/**
 * The sticker pack, as a picker.
 *
 * Picking ARMS a sticker — the editor places it and hands `value` back as null,
 * so the armed state here is whatever the parent says it is, never local.
 *
 * ponytail: the category filter is a row of aria-pressed buttons, not a real
 * tablist. Tabs would owe a roving tabindex and tabpanel wiring for a control
 * that only ever filters one grid; toggle buttons are keyboard-correct for free.
 */

export interface StickerPaletteProps {
  theme: ThemeId;
  /** Currently armed sticker, or null. */
  value: string | null;
  /** Called with a sticker id when the user picks one. */
  onPick: (stickerId: string) => void;
}

export default function StickerPalette({ theme, value, onPick }: StickerPaletteProps) {
  const [category, setCategory] = useState<StickerCategory>('feeling');
  const [query, setQuery] = useState('');
  const reduceMotion = useReducedMotion();

  const q = query.trim().toLowerCase();
  // Search spans every category, but never leaves the current theme's pack.
  const shown = q
    ? stickersFor(theme).filter((s) => s.name.toLowerCase().includes(q))
    : stickersFor(theme, category);

  const armed = value ? STICKER_BY_ID[value] : undefined;

  return (
    <section aria-labelledby="journal-stickers-heading" className={`${GLASS} space-y-3 p-4`}>
      <div className="flex min-h-6 items-center justify-between gap-3">
        <h3 id="journal-stickers-heading" className="text-[13px] font-semibold text-[#1B2430]">
          Stickers
        </h3>
        {/* Live region: empty when nothing is armed, so clearing stays silent. */}
        <p role="status" className="text-[11px] font-semibold text-[#2E3A59]">
          {armed && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#EEF0F5] px-2 py-0.5">
              <Check className="h-3 w-3" aria-hidden="true" />
              {armed.name} added
            </span>
          )}
        </p>
      </div>

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8A93A3]"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search stickers"
          aria-label="Search stickers by name"
          className={`h-9 w-full rounded-full border border-[#E4E7EE] bg-white/70 pl-9 pr-3 text-[13px] text-[#1B2430] placeholder:text-[#8A93A3] ${FOCUS}`}
        />
      </div>

      <div role="group" aria-label="Sticker categories" className="flex flex-wrap gap-1.5">
        {STICKER_CATEGORIES.map(({ key, label }) => {
          const on = !q && key === category;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={on}
              onClick={() => {
                setQuery('');
                setCategory(key);
              }}
              className={`rounded-full border px-2.5 py-1 text-[12px] transition-colors ${FOCUS} ${
                on
                  ? 'border-[#2E3A59] bg-[#2E3A59] font-semibold text-white'
                  : 'border-[#E4E7EE] bg-white/60 text-[#5A6472] hover:bg-[#EEF0F5]'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {shown.length === 0 ? (
        <p role="status" className="px-1 py-6 text-center text-[12px] text-[#5A6472]">
          {q
            ? `No sticker called “${query.trim()}”. Try a shorter word, or pick a category.`
            : 'No stickers in this set yet.'}
        </p>
      ) : (
        <ul className="grid max-h-52 list-none grid-cols-[repeat(auto-fill,minmax(44px,1fr))] justify-items-center gap-2 overflow-y-auto overscroll-contain pr-1">
          {shown.map((s) => {
            const on = s.id === value;
            return (
              <li key={s.id}>
                <motion.button
                  type="button"
                  aria-label={s.name}
                  aria-pressed={on}
                  title={s.name}
                  onClick={() => onPick(s.id)}
                  whileTap={reduceMotion ? undefined : { scale: 0.88 }}
                  className={`relative grid h-11 w-11 place-items-center rounded-[14px] border text-[22px] leading-none transition-colors ${FOCUS} ${
                    on
                      ? 'border-[#2E3A59] bg-[#EEF0F5] ring-2 ring-[#2E3A59]'
                      : 'border-[#E4E7EE] bg-white/70 hover:bg-[#EEF0F5]'
                  }`}
                >
                  <span aria-hidden="true">{s.glyph}</span>
                  {on && (
                    <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-[#2E3A59] text-white">
                      <Check className="h-2.5 w-2.5" strokeWidth={3} aria-hidden="true" />
                    </span>
                  )}
                </motion.button>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-[11px] text-[#8A93A3]">
        Pick a sticker to drop it on the page, then drag it where you want it.
      </p>
    </section>
  );
}
