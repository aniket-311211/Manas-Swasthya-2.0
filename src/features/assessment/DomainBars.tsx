import { motion, useReducedMotion } from 'motion/react';
import { DOMAIN_META, type Domain } from './domain';

/**
 * Tuned for the assessment screen's saturated purple: white fills on a
 * translucent white track. The old sage/lavender-on-muted pair vanished there.
 *
 * The bars are decorative — every value is printed as a number beside its
 * label, so nothing here depends on reading a length or a colour.
 */
export default function DomainBars({ scores }: { scores: Record<string, number> }) {
  const reduceMotion = useReducedMotion();

  return (
    <ul className="space-y-3">
      {Object.entries(scores).map(([domain, value], i) => {
        const pct = Math.max(0, Math.min(100, Math.round(value)));
        return (
          <li key={domain}>
            <div className="mb-1 flex justify-between text-[12.5px]">
              <span className="text-white/70">{DOMAIN_META[domain as Domain]?.label ?? domain}</span>
              <span className="font-medium text-white">
                {pct}
                <span className="sr-only"> out of 100</span>
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/15" aria-hidden="true">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-white to-[#FFD27A]"
                initial={reduceMotion ? false : { width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.9, delay: 0.15 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
