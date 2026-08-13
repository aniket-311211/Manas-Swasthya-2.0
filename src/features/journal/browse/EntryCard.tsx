import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring } from 'motion/react';
import { Image as ImageIcon, Mic, Trash2 } from 'lucide-react';
import { deriveTitle, excerpt, readingMinutes } from '../doc';
import { glyphFor } from '../stickers';
import { paperStyle, themeOf } from '../themes';
import { MOOD_META, type JournalEntryView } from '../types';

/**
 * One entry as a raised sheet of paper.
 *
 * ponytail: the tilt is two motion values fed by pointermove — no 3D library,
 * no per-card observers. The card keeps `transform-style: preserve-3d` and so
 * must NOT clip (overflow != visible flattens the scene), which is why the
 * highlight carries its own radius and the text is clamped instead.
 */

/** Shared so the shelf's loading skeletons are the size of the real thing. */
export const CARD_MIN_H = 'min-h-[196px]';

const TILT = 6; // degrees at the corners
const SPRING = { stiffness: 220, damping: 22, mass: 0.6 };
const DATE_FMT: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };

export default function EntryCard({
  entry,
  onOpen,
  onDelete,
}: {
  entry: JournalEntryView;
  onOpen: (entry: JournalEntryView) => void;
  onDelete: (entry: JournalEntryView) => void;
}) {
  const reduceMotion = useReducedMotion();
  const theme = themeOf(entry.doc.theme);

  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const rotateX = useSpring(tiltX, SPRING);
  const rotateY = useSpring(tiltY, SPRING);
  const glowX = useMotionValue(50);
  const glowY = useMotionValue(50);
  const glow = useMotionTemplate`radial-gradient(240px circle at ${glowX}% ${glowY}%, rgba(255,255,255,0.5), transparent 62%)`;

  const track = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width;
    const ny = (e.clientY - r.top) / r.height;
    glowX.set(nx * 100);
    glowY.set(ny * 100);
    tiltY.set((nx - 0.5) * 2 * TILT);
    tiltX.set((0.5 - ny) * 2 * TILT);
  };
  const rest = () => {
    tiltX.set(0);
    tiltY.set(0);
    glowX.set(50);
    glowY.set(50);
  };

  const title = entry.title?.trim() || deriveTitle(entry.doc.text, entry.createdAt);
  const preview = excerpt(entry.doc.text, 130);
  const photos = entry.doc.media.filter((m) => m.kind === 'photo').length;
  const clips = entry.doc.media.filter((m) => m.kind === 'audio').length;
  const mood = entry.doc.mood ? MOOD_META[entry.doc.mood.mood] : null;
  const marks = entry.doc.stickers.slice(0, 3);
  // The shell accent disappears on Carbon paper, so the ring follows the theme.
  const ring =
    theme.id === 'carbon'
      ? 'focus-visible:ring-[#54C3D8]'
      : 'focus-visible:ring-[#C4557A]';

  return (
    <div className={`group relative h-full ${CARD_MIN_H}`} style={{ perspective: '900px' }}>
      <motion.div
        onPointerMove={reduceMotion ? undefined : track}
        onPointerLeave={reduceMotion ? undefined : rest}
        style={{
          ...paperStyle(theme),
          rotateX: reduceMotion ? 0 : rotateX,
          rotateY: reduceMotion ? 0 : rotateY,
          transformStyle: 'preserve-3d',
        }}
        className="relative flex h-full flex-col rounded-[20px] border"
      >
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[20px] opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100"
          style={{ backgroundImage: glow }}
        />
        <button
          type="button"
          onClick={() => onOpen(entry)}
          className={`relative flex h-full min-w-0 flex-col gap-2 rounded-[20px] p-5 pr-14 text-left focus-visible:outline-none focus-visible:ring-2 ${ring}`}
          style={{ transformStyle: 'preserve-3d' }}
        >
          <span
            className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em]"
            style={{ color: theme.muted }}
          >
            {new Date(entry.createdAt).toLocaleDateString('en-IN', DATE_FMT)}
            <span aria-hidden="true">·</span>
            {readingMinutes(entry.doc.text)} min read
          </span>

          <span
            className="line-clamp-2 break-words text-[17px] font-semibold leading-snug"
            style={{ fontFamily: theme.display, transform: 'translateZ(14px)' }}
          >
            {title}
          </span>

          <span className="line-clamp-3 break-words text-[13.5px] leading-relaxed" style={{ color: theme.muted }}>
            {preview || 'No words in this one — just what you pinned to it.'}
          </span>

          <span className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 pt-2 text-[12px]">
            {mood && (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold"
                style={{ backgroundColor: mood.tint, color: mood.ink }}
              >
                <span aria-hidden="true">{mood.emoji}</span>
                {mood.label}
              </span>
            )}
            {photos > 0 && (
              <span className="inline-flex items-center gap-1" style={{ color: theme.muted }}>
                <ImageIcon aria-hidden="true" className="h-3.5 w-3.5" />
                {photos}
                <span className="sr-only"> photos</span>
              </span>
            )}
            {clips > 0 && (
              <span className="inline-flex items-center gap-1" style={{ color: theme.muted }}>
                <Mic aria-hidden="true" className="h-3.5 w-3.5" />
                {clips}
                <span className="sr-only"> audio clips</span>
              </span>
            )}
            {marks.length > 0 && (
              <span aria-hidden="true" className="ml-auto flex items-center gap-0.5 text-[15px] leading-none">
                {marks.map((s, i) => (
                  <span key={s.id} style={{ transform: `rotate(${(i - 1) * 8}deg) translateZ(${8 + i * 4}px)` }}>
                    {glyphFor(s.stickerId)}
                  </span>
                ))}
              </span>
            )}
          </span>
        </button>
      </motion.div>

      <button
        type="button"
        onClick={() => onDelete(entry)}
        aria-label={`Delete entry: ${title}`}
        className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-black/5 bg-white/85 text-[#C0533F] shadow-sm transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C0533F]"
      >
        <Trash2 aria-hidden="true" className="h-4 w-4" />
      </button>
    </div>
  );
}
