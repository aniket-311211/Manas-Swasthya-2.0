import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';

function CountUp({ target, suffix = '' }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1600;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, target]);

  return (
    <span ref={ref} className="font-display text-4xl text-foreground md:text-5xl">
      {value.toLocaleString('en-IN')}
      {suffix}
    </span>
  );
}

const STATS = [
  { target: 6, suffix: '', label: 'wellness domains assessed' },
  { target: 24, suffix: '/7', label: 'AI companion availability' },
  { target: 4, suffix: '', label: 'languages supported' },
  { target: 100, suffix: '%', label: 'free and confidential' },
];

export default function StatsBand() {
  return (
    <section className="border-y border-white/10 bg-white/[0.03]">
      <div className="container mx-auto grid grid-cols-2 gap-8 px-6 py-14 md:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="text-center">
            <CountUp target={s.target} suffix={s.suffix} />
            <p className="mt-2 text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
