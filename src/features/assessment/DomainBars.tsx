import { motion } from 'framer-motion';

const DOMAIN_LABELS: Record<string, string> = {
  academic: 'Academic',
  social: 'Social',
  emotional: 'Emotional',
  behavioral: 'Behavioral',
  cognitive: 'Cognitive',
  physical: 'Physical',
};

export default function DomainBars({ scores }: { scores: Record<string, number> }) {
  return (
    <div className="space-y-3">
      {Object.entries(scores).map(([domain, value], i) => (
        <div key={domain}>
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-muted-foreground">{DOMAIN_LABELS[domain] ?? domain}</span>
            <span className="text-foreground">{Math.round(value)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-sage to-lavender"
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(0, Math.min(100, value))}%` }}
              transition={{ duration: 1.1, delay: 0.2 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
