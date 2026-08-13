import { motion } from 'motion/react';
import { PhoneCall, HeartHandshake } from 'lucide-react';
import { HELPLINES } from '@/lib/crisis';

export default function CrisisBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      role="alert"
      className="rounded-2xl border border-white/70 bg-white/90 p-4 shadow-[0_8px_32px_rgba(27,36,48,0.18)] backdrop-blur-xl"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#C0533F]/15">
          <HeartHandshake className="h-5 w-5 text-[#C0533F]" />
        </span>
        <div>
          <p className="text-sm font-medium text-[#1B2430]">
            You matter, and you don't have to face this alone.
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[#5A6472]">
            If you're thinking about harming yourself, please reach out right now — these helplines
            are free, confidential, and available in multiple languages:
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {HELPLINES.map((h) => (
              <a
                key={h.phone}
                href={`tel:${h.phone.replace(/-/g, '')}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#E4E7EE] bg-[#EEF0F5] px-3 py-1.5 text-xs font-medium text-[#1B2430] backdrop-blur-xl transition-transform hover:scale-105"
              >
                <PhoneCall className="h-3 w-3 text-[#C0533F]" />
                {h.name}: {h.phone}
              </a>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
