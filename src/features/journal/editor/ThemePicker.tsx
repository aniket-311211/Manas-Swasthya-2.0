import { motion, useReducedMotion } from 'motion/react';
import { Check } from 'lucide-react';
import { paperStyle, THEME_LIST } from '../themes';
import type { ThemeId } from '../types';
import { FOCUS, GLASS } from '@/components/shell/theme';

/**
 * Bloom or Carbon.
 *
 * Each option renders an actual scrap of its own paper — the real gradient, the
 * real ink, the real accent — because "warm" and "graphic" mean nothing until
 * you see them. Both are for anyone; the copy stays on character, never gender.
 */

export interface ThemePickerProps {
  value: ThemeId;
  onChange: (theme: ThemeId) => void;
}

export default function ThemePicker({ value, onChange }: ThemePickerProps) {
  const reduceMotion = useReducedMotion();

  return (
    <section aria-labelledby="journal-theme-heading" className={`${GLASS} p-4`}>
      <h3 id="journal-theme-heading" className="text-[13px] font-semibold text-[#1B2430]">
        Journal theme
      </h3>
      <p className="mt-1 text-[12px] text-[#5A6472]">
        Sets the paper, the ink and the sticker pack. Switch whenever you like.
      </p>

      <div role="group" aria-labelledby="journal-theme-heading" className="mt-3 grid gap-3 sm:grid-cols-2">
        {THEME_LIST.map((t) => {
          const on = t.id === value;
          return (
            <motion.button
              key={t.id}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(t.id)}
              whileTap={reduceMotion ? undefined : { scale: 0.985 }}
              className={`rounded-[16px] border p-2 text-left transition-colors ${FOCUS} ${
                on
                  ? 'border-[#2E3A59] bg-white/80 ring-2 ring-[#2E3A59]'
                  : 'border-[#E4E7EE] bg-white/50 hover:bg-white/70'
              }`}
            >
              {/* Decorative sample of the real surface — the button's name says it all. */}
              <div aria-hidden="true" className="rounded-[12px] border p-3" style={paperStyle(t)}>
                <span className="text-[14px] font-semibold" style={{ fontFamily: t.display }}>
                  {t.name}
                </span>
                <span className="mt-2 block h-1.5 rounded-full" style={{ background: t.ink, opacity: 0.7 }} />
                <span
                  className="mt-1.5 block h-1.5 w-2/3 rounded-full"
                  style={{ background: t.muted, opacity: 0.7 }}
                />
                <span
                  className="mt-2.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{ background: t.accent, color: t.onAccent }}
                >
                  Aa
                </span>
              </div>

              <div className="mt-2 flex items-start justify-between gap-2 px-1 pb-0.5">
                <span className="block">
                  <span className="block text-[13px] font-semibold text-[#1B2430]">{t.name}</span>
                  <span className="block text-[11px] leading-snug text-[#5A6472]">{t.blurb}</span>
                </span>
                {on && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#EEF0F5] px-2 py-0.5 text-[10px] font-semibold text-[#2E3A59]">
                    <Check className="h-3 w-3" aria-hidden="true" />
                    Selected
                  </span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
