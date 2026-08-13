import { useEffect, useId, useState } from 'react';
import { useReducedMotion } from 'motion/react';

/**
 * Tuned for the assessment screen's saturated purple: a translucent white track
 * with a solid white-to-amber arc over it. The old sage/lavender-on-muted pair
 * disappeared against that backdrop.
 *
 * The number is real text in the middle, so the ring itself is decorative and
 * hidden from assistive tech rather than described twice.
 */
export default function ScoreRing({ score, size = 160 }: { score: number; size?: number }) {
  const reduceMotion = useReducedMotion();
  const gradientId = useId();
  const [animated, setAnimated] = useState(reduceMotion ? score : 0);
  const r = size * 0.42;
  const circumference = 2 * Math.PI * r;

  useEffect(() => {
    if (reduceMotion) {
      setAnimated(score);
      return;
    }
    const id = setTimeout(() => setAnimated(score), 150);
    return () => clearTimeout(id);
  }, [score, reduceMotion]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="-rotate-90" width={size} height={size} aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.22)"
          strokeWidth={size * 0.07}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={size * 0.07}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - Math.min(100, Math.max(0, animated)) / 100)}
          style={reduceMotion ? undefined : { transition: 'stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)' }}
        />
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#FFD27A" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-5xl leading-none text-white">{score}</span>
        <span className="mt-1.5 text-[12px] text-white/60">out of 100</span>
      </div>
    </div>
  );
}
