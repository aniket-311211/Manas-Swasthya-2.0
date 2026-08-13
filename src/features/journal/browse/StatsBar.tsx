import { useId } from 'react';
import { EYEBROW, GLASS } from '@/components/shell/theme';
import type { JournalStats } from '../doc';

export default function StatsBar({ stats }: { stats: JournalStats }) {
  const headingId = useId();
  const items: { label: string; value: string }[] = [
    { label: 'Entries', value: String(stats.entries) },
    { label: 'Words', value: stats.words.toLocaleString('en-IN') },
    { label: 'Avg words', value: String(stats.averageWords) },
    { label: 'Day streak', value: String(stats.streak) },
    { label: 'This month', value: String(stats.thisMonth) },
  ];

  return (
    <section aria-labelledby={headingId} className={`${GLASS} p-4 sm:p-5`}>
      <h2 id={headingId} className={`${EYEBROW} !text-[#1B2430]`}>
        Your writing at a glance
      </h2>
      <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {items.map((item) => (
          <div key={item.label} className="min-w-0">
            <dt className="truncate text-[11px] text-[#1B2430]/70">{item.label}</dt>
            <dd className="font-mono text-[22px] tabular-nums leading-tight text-[#1B2430]">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
