import { useId, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Check, RotateCcw } from 'lucide-react';
import { EYEBROW, FOCUS, GLASS_SOLID } from '@/components/shell/theme';
import { onAccentFor, paperStyleWithPrefs, themeOf, THEME_LIST } from '../themes';
import {
  ACCENTS,
  DEFAULT_PREFS,
  FONTS,
  PAPERS,
  SCALE_MAX,
  SCALE_MIN,
  type JournalPrefs,
} from '../prefs';

/**
 * Choosing a notebook, not filling in a settings form.
 *
 * Every control is a picture of what it does: the theme cards are real paper,
 * the paper tiles are the real texture, the fonts are set in themselves, and
 * the sheet at the top is the whole combination at once. Nothing here is named
 * without also being shown.
 *
 * ponytail: this component is stateless. The prefs live in one store
 * (prefs.ts) and arrive as props, so the panel can sit anywhere — beside the
 * editor, in a drawer — without a second copy of the truth.
 */

const CARD = 'rounded-[14px] border p-2 text-left transition-colors';
const ON = 'border-[#2E3A59] bg-white ring-2 ring-[#2E3A59]';
const OFF = 'border-[#E4E7EE] bg-white/60 hover:bg-white';
const SELECTED_CHIP =
  'inline-flex shrink-0 items-center gap-1 rounded-full bg-[#EEF0F5] px-1.5 py-0.5 text-[10px] font-semibold text-[#2E3A59]';

function Group({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  const id = useId();
  return (
    <div role="group" aria-labelledby={id}>
      <h4 id={id} className="text-[13px] font-semibold text-[#1B2430]">
        {title}
      </h4>
      <p className="mt-0.5 text-[11.5px] leading-snug text-[#8A93A3]">{hint}</p>
      <div className="mt-2.5">{children}</div>
    </div>
  );
}

export default function CustomizePanel({
  prefs,
  onChange,
}: {
  prefs: JournalPrefs;
  onChange: (patch: Partial<JournalPrefs>) => void;
}) {
  const headingId = useId();
  const sizeId = useId();
  const reduceMotion = useReducedMotion();
  const theme = themeOf(prefs.theme);
  const tap = reduceMotion ? undefined : { scale: 0.97 };

  const stack = reduceMotion
    ? {}
    : {
        initial: 'off' as const,
        animate: 'on' as const,
        variants: { off: {}, on: { transition: { staggerChildren: 0.05 } } },
      };
  const item = reduceMotion
    ? {}
    : { variants: { off: { opacity: 0, y: 8 }, on: { opacity: 1, y: 0 } } };

  return (
    <section aria-labelledby={headingId} className={`${GLASS_SOLID} p-4 sm:p-5`}>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className={EYEBROW}>Yours to set</p>
          <h3 id={headingId} className="font-display text-[19px] leading-tight text-[#1B2430]">
            Make this notebook yours
          </h3>
        </div>
        <button
          type="button"
          onClick={() => onChange(DEFAULT_PREFS)}
          className={`inline-flex items-center gap-1.5 rounded-full border border-[#E4E7EE] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#5A6472] transition-colors hover:bg-[#EEF0F5] ${FOCUS}`}
        >
          <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
          Start over
        </button>
      </div>

      <motion.div {...stack} className="mt-4 space-y-5">
        {/* The whole combination, on one page. Decorative — every control below says its own state. */}
        <motion.div
          {...item}
          aria-hidden="true"
          className="rounded-[16px] border p-4 sm:p-5"
          style={paperStyleWithPrefs(theme, prefs)}
        >
          <p className="text-[1.4em] leading-[1.75em]" style={{ fontFamily: theme.display }}>
            Tuesday, late
          </p>
          <p className="text-[1em] leading-[1.75em] opacity-90">
            Wrote a little before bed. The rain kept going
          </p>
          <p className="text-[1em] leading-[1.75em] opacity-90">and I did not mind it at all.</p>
          <span
            className="mt-3 inline-block rounded-full px-2.5 py-1 text-[0.7em] font-semibold"
            style={{ backgroundColor: prefs.accent, color: onAccentFor(prefs.accent) }}
          >
            Today&rsquo;s page
          </span>
        </motion.div>

        <motion.div {...item}>
          <Group title="Paper and ink" hint="Two skins. Both are for anyone — pick the one you like looking at.">
            <div className="grid gap-2.5 sm:grid-cols-2">
              {THEME_LIST.map((t) => {
                const on = t.id === prefs.theme;
                return (
                  <motion.button
                    key={t.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => onChange({ theme: t.id })}
                    whileTap={tap}
                    className={`${CARD} ${FOCUS} ${on ? ON : OFF}`}
                  >
                    <span
                      aria-hidden="true"
                      className="block rounded-[10px] border px-3 py-3.5"
                      style={paperStyleWithPrefs(t, prefs)}
                    >
                      <span className="block text-[1em] leading-[1.75em]" style={{ fontFamily: t.display }}>
                        {t.name}
                      </span>
                      <span className="block text-[0.85em] leading-[1.75em] opacity-70">
                        a line of writing
                      </span>
                    </span>
                    <span className="mt-2 flex items-start justify-between gap-2 px-0.5">
                      <span className="block min-w-0">
                        <span className="block text-[12.5px] font-semibold text-[#1B2430]">{t.name}</span>
                        <span className="block text-[11px] leading-snug text-[#5A6472]">{t.blurb}</span>
                      </span>
                      {on && (
                        <span className={SELECTED_CHIP}>
                          <Check aria-hidden="true" className="h-3 w-3" />
                          On
                        </span>
                      )}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </Group>
        </motion.div>

        <motion.div {...item}>
          <Group title="Accent" hint="Buttons, the caret, and the wash of colour across the page.">
            <div className="flex flex-wrap gap-2">
              {ACCENTS.map((a) => {
                const on = a.hex.toLowerCase() === prefs.accent.toLowerCase();
                return (
                  <motion.button
                    key={a.id}
                    type="button"
                    aria-pressed={on}
                    aria-label={`${a.name} accent`}
                    onClick={() => onChange({ accent: a.hex })}
                    whileTap={tap}
                    whileHover={reduceMotion ? undefined : { y: -2 }}
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors ${FOCUS} ${
                      on ? 'border-[#2E3A59] ring-2 ring-[#2E3A59] ring-offset-2' : 'border-white'
                    }`}
                    style={{ backgroundColor: a.hex }}
                  >
                    {/* A tick, not just the ring — colour is never the only tell. */}
                    {on && <Check aria-hidden="true" className="h-4 w-4" style={{ color: onAccentFor(a.hex) }} />}
                  </motion.button>
                );
              })}
            </div>
          </Group>
        </motion.div>

        <motion.div {...item}>
          <Group title="Surface" hint="The texture under the words. Shown here without the lines.">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {PAPERS.map((p) => {
                const on = p.id === prefs.paper;
                return (
                  <motion.button
                    key={p.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => onChange({ paper: p.id })}
                    whileTap={tap}
                    className={`${CARD} ${FOCUS} ${on ? ON : OFF}`}
                  >
                    <span
                      aria-hidden="true"
                      className="block h-12 rounded-[10px] border"
                      style={paperStyleWithPrefs(theme, { ...prefs, paper: p.id, ruled: false })}
                    />
                    <span className="mt-1.5 flex items-center justify-between gap-1 px-0.5">
                      <span className="text-[12px] font-semibold text-[#1B2430]">{p.name}</span>
                      {on && <Check aria-hidden="true" className="h-3.5 w-3.5 text-[#2E3A59]" />}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </Group>
        </motion.div>

        <motion.div {...item}>
          <Group title="Handwriting" hint="The face your entries are set in. Each one is showing itself.">
            <div className="grid gap-2 sm:grid-cols-2">
              {FONTS.map((f) => {
                const on = f.id === prefs.fontId;
                return (
                  <motion.button
                    key={f.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => onChange({ fontId: f.id })}
                    whileTap={tap}
                    className={`${CARD} ${FOCUS} flex items-center gap-3 ${on ? ON : OFF}`}
                    style={{ fontFamily: f.stack }}
                  >
                    <span aria-hidden="true" className="text-[22px] leading-none text-[#1B2430]">
                      Aa
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] text-[#1B2430]">{f.name}</span>
                      <span className="block truncate text-[11px] text-[#5A6472]">the quiet part</span>
                    </span>
                    {on && <Check aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-[#2E3A59]" />}
                  </motion.button>
                );
              })}
            </div>
          </Group>
        </motion.div>

        <motion.div {...item}>
          <label htmlFor={sizeId} className="text-[13px] font-semibold text-[#1B2430]">
            Writing size
          </label>
          <p className="mt-0.5 text-[11.5px] leading-snug text-[#8A93A3]">
            Bigger text, wider lines — the ruling follows the size.
          </p>
          <div className="mt-2.5 flex items-center gap-3">
            <span aria-hidden="true" className="text-[11px] text-[#8A93A3]">
              A
            </span>
            <input
              id={sizeId}
              type="range"
              min={SCALE_MIN}
              max={SCALE_MAX}
              step={0.05}
              value={prefs.fontScale}
              onChange={(e) => onChange({ fontScale: Number(e.target.value) })}
              aria-valuetext={`${Math.round(prefs.fontScale * 100)} percent`}
              className={`h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-[#E4E7EE] ${FOCUS}`}
              style={{ accentColor: '#2E3A59' }}
            />
            <span aria-hidden="true" className="text-[19px] leading-none text-[#8A93A3]">
              A
            </span>
            <span className="w-10 shrink-0 text-right font-mono text-[11px] tabular-nums text-[#5A6472]">
              {Math.round(prefs.fontScale * 100)}%
            </span>
          </div>
        </motion.div>

        <motion.div {...item}>
          <button
            type="button"
            role="switch"
            aria-checked={prefs.ruled}
            onClick={() => onChange({ ruled: !prefs.ruled })}
            className={`flex w-full items-center gap-3 rounded-[14px] border p-3 text-left transition-colors ${FOCUS} ${
              prefs.ruled ? ON : OFF
            }`}
          >
            <span
              aria-hidden="true"
              className="h-10 w-16 shrink-0 rounded-[8px] border"
              style={paperStyleWithPrefs(theme, { ...prefs, ruled: true, fontScale: 0.72 })}
            />
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-semibold text-[#1B2430]">Ruled lines</span>
              <span className="block text-[11.5px] leading-snug text-[#5A6472]">
                {prefs.ruled ? 'On — lines under the writing.' : 'Off — a blank page.'}
              </span>
            </span>
            <span
              aria-hidden="true"
              className={`inline-flex h-6 w-10 shrink-0 items-center rounded-full p-0.5 transition-colors ${
                prefs.ruled ? 'bg-[#2E3A59]' : 'bg-[#E4E7EE]'
              }`}
            >
              <motion.span
                layout={!reduceMotion}
                transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 34 }}
                className={`h-5 w-5 rounded-full bg-white shadow-sm ${prefs.ruled ? 'ml-auto' : ''}`}
              />
            </span>
          </button>
        </motion.div>
      </motion.div>
    </section>
  );
}
