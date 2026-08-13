import { useId, useMemo } from 'react';
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from 'recharts';
import { useReducedMotion } from 'motion/react';
import { DOMAIN_META } from './domain';
import type { Comparison } from './history';

/**
 * This reflection laid over the last one, across the six areas.
 *
 * The two series are told apart by stroke style as well as colour — solid for
 * now, dashed for last time — because a legend that only differs by hue is no
 * legend at all for a lot of people. And a radar is meaningless to a screen
 * reader, so the same numbers are also written out as a list.
 */

const CARD = 'rounded-[20px] border border-white/25 bg-white/10 backdrop-blur-xl';
const NOW = '#FFFFFF';
const BEFORE = '#FFD27A';

function Swatch({ colour, dashed }: { colour: string; dashed: boolean }) {
  return (
    <svg width="26" height="10" viewBox="0 0 26 10" aria-hidden="true" className="shrink-0">
      <line
        x1="1"
        y1="5"
        x2="25"
        y2="5"
        stroke={colour}
        strokeWidth="2.5"
        strokeDasharray={dashed ? '6 4' : undefined}
      />
    </svg>
  );
}

export default function DomainRadar({ comparison }: { comparison: Comparison }) {
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const textId = useId();

  const { domains, previous } = comparison;
  const data = useMemo(
    () => domains.map((d) => ({ area: DOMAIN_META[d.domain].label, now: d.now, before: d.before })),
    [domains],
  );

  const shell = `${CARD} p-5 sm:p-6`;

  if (domains.length === 0) {
    return (
      <section className={shell} aria-labelledby={titleId}>
        <h2 id={titleId} className="font-display text-[20px] text-white">
          Across the six areas
        </h2>
        <p className="mt-2 max-w-prose text-[14px] leading-relaxed text-white/75">
          We could not read the area-by-area detail for this reflection, so there is no shape to draw. Your overall score
          is still on record.
        </p>
      </section>
    );
  }

  return (
    <section className={shell} aria-labelledby={titleId}>
      <h2 id={titleId} className="font-display text-[20px] text-white">
        Across the six areas
      </h2>
      <p className="mt-1 text-[13.5px] leading-relaxed text-white/70">
        {previous
          ? 'This reflection over your last one. Further out is doing better.'
          : 'This is your first reflection, so there is only one shape to show. Further out is doing better.'}
      </p>

      <div className="mt-3 h-64 w-full min-w-0" role="img" aria-labelledby={titleId} aria-describedby={textId}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="72%">
            <PolarGrid stroke="rgba(255,255,255,0.28)" />
            <PolarAngleAxis dataKey="area" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.8)' }} />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} tickLine={false} />
            {previous && (
              <Radar
                name="Last time"
                dataKey="before"
                stroke={BEFORE}
                strokeWidth={2}
                strokeDasharray="6 4"
                fill={BEFORE}
                fillOpacity={0.1}
                isAnimationActive={!reduceMotion}
              />
            )}
            <Radar
              name="This time"
              dataKey="now"
              stroke={NOW}
              strokeWidth={2}
              fill={NOW}
              fillOpacity={0.22}
              isAnimationActive={!reduceMotion}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Our own legend: stroke style carries the difference, the words confirm it. */}
      <ul className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[12.5px] text-white/80">
        <li className="flex items-center gap-2">
          <Swatch colour={NOW} dashed={false} />
          This time (solid line)
        </li>
        {previous && (
          <li className="flex items-center gap-2">
            <Swatch colour={BEFORE} dashed />
            Last time (dashed line)
          </li>
        )}
      </ul>

      <ul id={textId} className="sr-only">
        {domains.map((d) => (
          <li key={d.domain}>
            {DOMAIN_META[d.domain].label}: {d.now} out of 100
            {previous
              ? `, compared with ${d.before} last time, ${
                  d.delta > 0 ? `up ${d.delta}` : d.delta < 0 ? `down ${-d.delta}` : 'no change'
                }.`
              : '.'}
          </li>
        ))}
      </ul>
    </section>
  );
}
