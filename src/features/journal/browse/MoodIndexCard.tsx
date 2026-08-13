import { useEffect, useId } from 'react';
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react';
import { Flame, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { EYEBROW, GLASS } from '@/components/shell/theme';
import type { Band, MoodIndex } from '../moodIndex';

/**
 * The live read of recent entries, sitting beside the streak.
 *
 * ponytail: one motion value drives both the arc and the counting number, so
 * they can never disagree and there is no second animation to keep in step.
 */

const BAND: Record<Band, { tint: string; ring: string; ink: string }> = {
  low: { tint: '#DCE6F5', ring: '#4E6A9E', ink: '#2E3A59' },
  tender: { tint: '#EADFF7', ring: '#6B57A6', ink: '#4A3A78' },
  steady: { tint: '#D3E7DD', ring: '#3E7C68', ink: '#1F5445' },
  bright: { tint: '#FFE6B0', ring: '#B5800F', ink: '#7A5A12' },
};

const TREND = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
  new: Minus,
};

const R = 42;
const CIRCUMFERENCE = 2 * Math.PI * R;

function trendWords(trend: MoodIndex['trend'], delta: number): string {
  if (trend === 'up') return `Up ${delta} from the stretch before`;
  if (trend === 'down') return `Down ${Math.abs(delta)} from the stretch before`;
  if (trend === 'flat') return 'Holding steady';
  return 'Nothing to compare yet';
}

export default function MoodIndexCard({ index, streak }: { index: MoodIndex; streak: number }) {
  const headingId = useId();
  const reduceMotion = useReducedMotion();
  const band = BAND[index.band];
  const blank = index.trend === 'new';

  const value = useMotionValue(0);
  const shown = useTransform(value, (v) => Math.round(v));
  const offset = useTransform(value, (v) => CIRCUMFERENCE * (1 - v / 100));

  useEffect(() => {
    const controls = animate(
      value,
      blank ? 0 : index.score,
      reduceMotion ? { duration: 0 } : { duration: 1.1, ease: [0.22, 1, 0.36, 1] },
    );
    return () => controls.stop();
  }, [index.score, blank, reduceMotion, value]);

  const Arrow = TREND[index.trend];
  const chip = 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold';

  return (
    <section
      aria-labelledby={headingId}
      className={`${GLASS} p-4 sm:p-5`}
      // Sits over the frosted white so the card carries the band's colour
      // without losing the iridescence underneath.
      style={{ backgroundImage: `linear-gradient(135deg, ${band.tint} 0%, rgba(255,255,255,0) 68%)` }}
    >
      <div className="flex items-center gap-4 sm:gap-5">
        <div className="relative h-[104px] w-[104px] shrink-0">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
            <circle
              cx="50"
              cy="50"
              r={R}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="9"
              opacity="0.75"
            />
            <circle
              cx="50"
              cy="50"
              r={R}
              fill="none"
              stroke={band.ring}
              strokeWidth="9"
              opacity="0.18"
              strokeDasharray={blank ? '3 7' : undefined}
            />
            {!blank && (
              <motion.circle
                cx="50"
                cy="50"
                r={R}
                fill="none"
                stroke={band.ring}
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                style={{ strokeDashoffset: offset }}
              />
            )}
          </svg>
          <span
            aria-hidden="true"
            className="absolute inset-0 flex flex-col items-center justify-center leading-none"
            style={{ color: band.ink }}
          >
            {blank ? (
              <span className="font-display text-[30px]">—</span>
            ) : (
              <motion.span className="font-display text-[32px] tabular-nums">{shown}</motion.span>
            )}
            <span className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] opacity-70">
              of 100
            </span>
          </span>
          {/* The ring is decoration; this is the reading. */}
          <span className="sr-only">
            {blank
              ? 'No reading yet.'
              : `${index.score} out of 100, from ${index.sampleSize} ${index.sampleSize === 1 ? 'entry' : 'entries'}.`}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className={EYEBROW}>How lately reads</p>
          <h2 id={headingId} className="font-display text-[20px] leading-tight text-[#1B2430]">
            {index.label}
          </h2>
          {/* Arrow and colour both repeat what the words already say. */}
          <p
            className="mt-1.5 inline-flex items-center gap-1.5 text-[12px] font-semibold"
            style={{ color: band.ink }}
          >
            <Arrow aria-hidden="true" className="h-3.5 w-3.5" />
            {trendWords(index.trend, index.delta)}
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-[#5A6472]">{index.blurb}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#E4E7EE] pt-3">
        <span className={chip} style={{ backgroundColor: band.tint, color: band.ink }}>
          <Flame aria-hidden="true" className="h-3.5 w-3.5" />
          {streak === 1 ? '1 day in a row' : `${streak} days in a row`}
        </span>
        <span className="rounded-full bg-white/70 px-2.5 py-1 text-[11.5px] text-[#5A6472]">
          {index.sampleSize === 1
            ? 'From 1 entry with a mood on it'
            : `From ${index.sampleSize} entries with a mood on them`}
        </span>
        <span className="text-[11px] text-[#8A93A3]">Recent entries count for more.</span>
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-[#8A93A3]">
        A reflection of what you wrote, not a measure of you.
      </p>
    </section>
  );
}
