import { useId } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'motion/react';
import { fetchQuote, toneFor } from './quotes';

/**
 * One borrowed line under the result. It has no error state and no retry
 * button on purpose: `fetchQuote` always resolves, falling back to a local
 * quote, because "we couldn't load your quote" is not news anyone needs on the
 * screen where they just found out how their week went.
 */

const CARD = 'rounded-[20px] border border-white/25 bg-white/10 backdrop-blur-xl';

export default function QuoteCard({ overall }: { overall: number }) {
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const tone = toneFor(overall);

  const { data } = useQuery({
    queryKey: ['quote', tone],
    queryFn: () => fetchQuote(tone),
    staleTime: 30 * 60_000,
    gcTime: 60 * 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const enter = reduceMotion ? {} : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } };

  return (
    <motion.section
      {...enter}
      transition={{ duration: 0.35 }}
      className={`${CARD} p-5 sm:p-6`}
      aria-labelledby={titleId}
      aria-busy={!data}
    >
      <h2 id={titleId} className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/55">
        Something to take with you
      </h2>

      {data ? (
        <blockquote className="mt-3">
          <p className="max-w-prose font-display text-[19px] leading-relaxed text-white">
            &ldquo;{data.text}&rdquo;
          </p>
          <cite className="mt-3 block text-[13px] not-italic text-white/60">— {data.author}</cite>
        </blockquote>
      ) : (
        // Quiet on purpose: a spinner here would pull the eye away from the result.
        <div className="mt-4 space-y-2.5" aria-hidden="true">
          <div className="h-3.5 w-full rounded-full bg-white/10" />
          <div className="h-3.5 w-4/5 rounded-full bg-white/10" />
          <div className="mt-4 h-2.5 w-24 rounded-full bg-white/[0.07]" />
        </div>
      )}
    </motion.section>
  );
}
