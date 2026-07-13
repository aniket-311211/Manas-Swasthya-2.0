import { motion } from 'framer-motion';
import { PhoneCall, HeartHandshake } from 'lucide-react';
import { HELPLINES } from '@/lib/crisis';

export default function CrisisBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      role="alert"
      className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-destructive/15">
          <HeartHandshake className="h-5 w-5 text-destructive" />
        </span>
        <div>
          <p className="text-sm font-medium text-foreground">
            You matter, and you don't have to face this alone.
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            If you're thinking about harming yourself, please reach out right now — these helplines
            are free, confidential, and available in multiple languages:
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {HELPLINES.map((h) => (
              <a
                key={h.phone}
                href={`tel:${h.phone.replace(/-/g, '')}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-soft transition-transform hover:scale-105"
              >
                <PhoneCall className="h-3 w-3 text-destructive" />
                {h.name}: {h.phone}
              </a>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
