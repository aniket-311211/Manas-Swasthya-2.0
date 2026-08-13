import { useId, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { EYEBROW, GLASS_SOLID } from '@/components/shell/theme';
import { localDayKey, wordCount } from '../doc';
import { MOODS, MOOD_META, type JournalEntryView, type MoodKey } from '../types';

/**
 * A month of writing, coloured by how each day read.
 *
 * The fill is the day's mood tint, not its word count — a long hard evening and
 * a long easy one are not the same day, and word count never said which was
 * which. Every tint carries its own `ink` from MOOD_META, so the two always
 * move together; do not pair a tint with another mood's ink.
 *
 * ponytail: plain buttons in a CSS grid, not role="grid" — a roving-tabindex
 * grid would be a keyboard model to maintain for 30 cells that each already say
 * what they are. Colour is redundant: every day's accessible name says the mood
 * in words, plus the entry and word count.
 */

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Written, not read yet. A hatch rather than a seventh tint, so it can never be mistaken for "neutral". */
const UNREAD_HATCH =
  'repeating-linear-gradient(45deg, #EDEFF5 0 5px, #F8F9FC 5px 10px)';
const UNREAD_INK = '#5A6472';

interface DayRead {
  entries: number;
  words: number;
  mood: MoodKey | null;
}

/**
 * The day's dominant mood: the mood analysed most often that day, ties broken
 * by the latest entry among the tied moods — a day reads as it ended.
 */
function dominantMood(reads: { mood: MoodKey; at: number }[]): MoodKey | null {
  const count = new Map<MoodKey, number>();
  for (const r of reads) count.set(r.mood, (count.get(r.mood) ?? 0) + 1);
  let best: { mood: MoodKey; at: number } | null = null;
  for (const r of reads) {
    const n = count.get(r.mood) ?? 0;
    const bn = best ? (count.get(best.mood) ?? 0) : -1;
    if (n > bn || (n === bn && best !== null && r.at > best.at)) best = r;
  }
  return best?.mood ?? null;
}

export default function CalendarHeat({
  entries,
  onPickDay,
}: {
  entries: JournalEntryView[];
  onPickDay: (dayKey: string) => void;
}) {
  const headingId = useId();
  const legendId = useId();
  const reduceMotion = useReducedMotion();
  const [dir, setDir] = useState(1);
  const [view, setView] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const byDay = useMemo(() => {
    const acc = new Map<string, { entries: number; words: number; reads: { mood: MoodKey; at: number }[] }>();
    for (const e of entries) {
      const key = localDayKey(e.createdAt);
      const cur = acc.get(key) ?? { entries: 0, words: 0, reads: [] };
      cur.entries += 1;
      cur.words += wordCount(e.doc.text);
      // `doc` is parsed JSON, so a mood key from an old or hand-edited row can
      // be anything at all. Anything outside the table is not a reading.
      const mood = e.doc.mood?.mood;
      if (typeof mood === 'string' && mood in MOOD_META) {
        cur.reads.push({ mood: mood as MoodKey, at: +new Date(e.createdAt) });
      }
      acc.set(key, cur);
    }
    const map = new Map<string, DayRead>();
    for (const [key, cur] of acc) {
      map.set(key, { entries: cur.entries, words: cur.words, mood: dominantMood(cur.reads) });
    }
    return map;
  }, [entries]);

  const year = view.getFullYear();
  const month = view.getMonth();
  const today = new Date();
  const todayKey = localDayKey(today);
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
  const blanks = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();

  const step = (by: number) => {
    setDir(by);
    setView(new Date(year, month + by, 1));
  };

  const slide = reduceMotion
    ? { initial: false as const, animate: { opacity: 1, x: 0 }, exit: { opacity: 0 }, transition: { duration: 0 } }
    : {
        initial: { opacity: 0, x: dir * 26 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: dir * -26 },
        transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const },
      };

  return (
    <section aria-labelledby={headingId} className={`${GLASS_SOLID} p-4 sm:p-5`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={headingId} className={EYEBROW}>
          Your writing calendar
        </h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Previous month"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#E4E7EE] bg-white text-[#1B2430] transition-colors hover:bg-[#EEF0F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E3A59]"
          >
            <ChevronLeft aria-hidden="true" className="h-4 w-4" />
          </button>
          <p aria-live="polite" className="min-w-[8.5rem] text-center text-[13px] font-semibold text-[#1B2430]">
            {view.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
          </p>
          <button
            type="button"
            onClick={() => step(1)}
            disabled={isCurrentMonth}
            aria-label="Next month"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#E4E7EE] bg-white text-[#1B2430] transition-colors hover:bg-[#EEF0F5] disabled:opacity-40 disabled:hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E3A59]"
          >
            <ChevronRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div aria-hidden="true" className="mt-4 grid grid-cols-7 gap-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-[#8A93A3]">
        {WEEKDAYS.map((d) => (
          <span key={d} className="text-center">
            {d.slice(0, 1)}
          </span>
        ))}
      </div>

      {/* Months slide past each other; the cells inside settle in one by one. */}
      <div className="overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={`${year}-${month}`} {...slide} className="mt-1.5 grid grid-cols-7 gap-1.5">
            {Array.from({ length: blanks }, (_, i) => (
              <span key={`blank-${i}`} aria-hidden="true" className="aspect-square" />
            ))}
            {Array.from({ length: days }, (_, i) => {
              const day = i + 1;
              const date = new Date(year, month, day);
              const key = localDayKey(date);
              const hit = byDay.get(key);
              const isToday = key === todayKey;
              const future = date > today && !isToday;
              const disabled = future;
              const label = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' });
              const meta = hit?.mood ? MOOD_META[hit.mood] : null;
              const counts = hit
                ? `${hit.entries} ${hit.entries === 1 ? 'entry' : 'entries'}, ${hit.words} ${hit.words === 1 ? 'word' : 'words'}`
                : '';
              const name = future
                ? `${label}, not here yet`
                : hit
                  ? `${label}, ${counts}, ${meta ? `reads ${meta.label.toLowerCase()}` : 'no mood read yet'}`
                  : `${label}, nothing written. Start an entry`;

              const fill: React.CSSProperties = meta
                ? { backgroundColor: meta.tint, color: meta.ink }
                : hit
                  ? { backgroundImage: UNREAD_HATCH, color: UNREAD_INK }
                  : { backgroundColor: 'transparent', color: UNREAD_INK };

              return (
                <motion.button
                  key={key}
                  type="button"
                  disabled={disabled}
                  onClick={() => onPickDay(key)}
                  aria-label={isToday ? `Today, ${name}` : name}
                  aria-current={isToday ? 'date' : undefined}
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.86 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { delay: 0.1 + i * 0.012, duration: 0.24, ease: [0.22, 1, 0.36, 1] }
                  }
                  whileHover={reduceMotion || disabled ? undefined : { y: -2, scale: 1.05 }}
                  whileTap={reduceMotion || disabled ? undefined : { scale: 0.96 }}
                  className={`relative flex aspect-square min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl border text-[12px] tabular-nums disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E3A59] ${
                    isToday ? 'border-[#2E3A59] font-semibold' : 'border-[#E4E7EE]'
                  }`}
                  style={fill}
                >
                  {/* Today keeps a quiet heartbeat — only ever when motion is welcome. */}
                  {isToday && !reduceMotion && (
                    <motion.span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 rounded-xl border-2 border-[#2E3A59]"
                      animate={{ opacity: [0.75, 0.15, 0.75], scale: [1, 1.07, 1] }}
                      transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  )}
                  <span aria-hidden="true">{day}</span>
                  {hit && meta ? (
                    <span aria-hidden="true" className="text-[14px] leading-none">
                      {meta.emoji}
                    </span>
                  ) : hit ? (
                    <span
                      aria-hidden="true"
                      className={`h-1.5 w-1.5 rounded-full ${meta ? '' : 'border border-current'}`}
                      style={meta ? { backgroundColor: meta.ink } : undefined}
                    />
                  ) : null}
                </motion.button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      <p id={legendId} className="mt-4 text-[12px] text-[#5A6472]">
        Saved entries show their exact mood sticker on the day they belong to.
      </p>
      <ul aria-labelledby={legendId} className="mt-2 flex list-none flex-wrap gap-1.5 p-0">
        {MOODS.map((m) => (
          <li
            key={m.key}
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium"
            style={{ backgroundColor: MOOD_META[m.key].tint, color: MOOD_META[m.key].ink }}
          >
            <span aria-hidden="true">{m.emoji}</span>
            {m.label}
          </li>
        ))}
        <li
          className="inline-flex items-center gap-1.5 rounded-full border border-[#E4E7EE] px-2.5 py-1 text-[11.5px] font-medium"
          style={{ backgroundImage: UNREAD_HATCH, color: UNREAD_INK }}
        >
          Written, no mood read yet
        </li>
      </ul>

      <p className="mt-2.5 text-[12px] text-[#8A93A3]">
        Pick any past or present day to open it or start writing. Future dates stay closed.
      </p>
    </section>
  );
}
