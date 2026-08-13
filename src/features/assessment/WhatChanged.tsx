import { useId } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { DOMAIN_META } from './domain';
import type { Comparison, DomainDelta } from './history';

/**
 * The plain-language version of the comparison: one warm sentence, two or three
 * sentences of detail, then a chip per area.
 *
 * Every chip carries an arrow AND a word alongside its colour, so the direction
 * survives greyscale, colour blindness and a screen reader reading it aloud.
 */

const CARD = 'rounded-[20px] border border-white/25 bg-white/10 backdrop-blur-xl';

function chip(d: DomainDelta) {
  if (d.delta > 0)
    return { arrow: '↑', word: 'up', amount: `${d.delta}`, tone: 'border-[#CFF7DF]/40 bg-[#CFF7DF]/15 text-[#E6FCF0]' };
  if (d.delta < 0)
    return {
      arrow: '↓',
      word: 'down',
      amount: `${-d.delta}`,
      tone: 'border-[#FFDDA6]/45 bg-[#FFDDA6]/15 text-[#FFEFD2]',
    };
  return { arrow: '→', word: 'steady', amount: '', tone: 'border-white/25 bg-white/10 text-white/75' };
}

export default function WhatChanged({ comparison }: { comparison: Comparison }) {
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const { headline, narrative, domains, previous } = comparison;

  const enter = reduceMotion ? {} : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } };

  return (
    <motion.section
      {...enter}
      transition={{ duration: 0.3 }}
      className={`${CARD} p-5 sm:p-6`}
      aria-labelledby={titleId}
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/55">Since last time</p>
      <h2 id={titleId} className="mt-1 font-display text-[20px] leading-snug text-white">
        {headline}
      </h2>
      <p className="mt-2 max-w-prose text-[14px] leading-relaxed text-white/80">{narrative}</p>

      {domains.length > 0 && (
        <>
          <h3 className="mt-5 text-[13px] font-semibold text-white/80">
            {previous ? 'Area by area, against your last one' : 'Area by area'}
          </h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {domains.map((d) => {
              const c = chip(d);
              return (
                <li
                  key={d.domain}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] ${c.tone}`}
                >
                  <span className="font-medium">{DOMAIN_META[d.domain].label}</span>
                  <span aria-hidden="true">{c.arrow}</span>
                  <span>
                    {c.word}
                    {c.amount && ` ${c.amount}`}
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </motion.section>
  );
}
