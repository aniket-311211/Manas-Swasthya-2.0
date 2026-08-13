import { motion, useReducedMotion } from 'motion/react';
import {
  AlertOctagon,
  AlertTriangle,
  Ban,
  Brain,
  Clock,
  FlaskConical,
  Info,
  Package,
  Pill,
  ShieldAlert,
  Stethoscope,
  Utensils,
} from 'lucide-react';
import type { MedicineAiResult } from '@/types/api';
import { BAD, CARD, EYEBROW, INK, MUTED, NOTE, confidenceBand } from './theme';

/**
 * Everything worth knowing about the medicine in your hand, in the order you
 * need it.
 *
 * The ordering is the design. What it is, then how sure we are, then what it
 * does, then how to take it, then what would make you stop. The old page led
 * with dosage in a cheerful green panel and put contraindications below the
 * fold; someone scanning for "how many do I take" saw the number and never
 * reached "do not take if you are pregnant".
 *
 * Serious side effects are pulled out of the side-effect list entirely. Buried
 * in a bullet list of twelve, "yellowing of the eyes" reads like "mild nausea".
 */

interface Props {
  analysis: MedicineAiResult;
  dosingWithheld?: boolean;
}

function Section({
  icon: Icon,
  title,
  children,
  className = '',
}: {
  icon: typeof Info;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`${CARD} p-5 ${className}`}>
      <h3 className={`flex items-center gap-2 text-[15px] font-semibold ${INK}`}>
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        {title}
      </h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Bullets({ items, className = '' }: { items: string[]; className?: string }) {
  return (
    <ul className={`space-y-1.5 text-[14px] leading-relaxed ${className || MUTED}`}>
      {items.map((item, i) => (
        <li key={i} className="flex gap-2">
          <span aria-hidden="true" className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-current" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** A labelled line, rendered only when there is something to say. */
function Fact({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
      <dt className={`shrink-0 text-[13px] font-semibold sm:w-32 ${INK}`}>{label}</dt>
      <dd className={`text-[14px] leading-relaxed ${MUTED}`}>{value}</dd>
    </div>
  );
}

export default function MedicineReport({ analysis: a, dosingWithheld }: Props) {
  const reduceMotion = useReducedMotion();
  const band = confidenceBand(a.confidence);

  const strengths = a.activeIngredients
    .map((i) => [i.name, i.strength].filter(Boolean).join(' '))
    .filter(Boolean);

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-4"
      aria-live="polite"
    >
      {/* ── Identity ─────────────────────────────────────────────────── */}
      <section className={`${CARD} p-6`}>
        <p className={`${EYEBROW} ${MUTED}`}>Identified as</p>
        <h2 className={`mt-1.5 font-display text-[30px] leading-tight ${INK}`}>{a.name}</h2>
        {a.genericName && a.genericName.toLowerCase() !== a.name.toLowerCase() && (
          <p className={`mt-1 text-[15px] ${MUTED}`}>{a.genericName}</p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {a.form && (
            <span className={`inline-flex items-center gap-1.5 rounded-full bg-[#3B0A0A]/8 px-3 py-1 text-[13px] font-medium ${INK}`}>
              <Pill className="h-3.5 w-3.5" aria-hidden="true" />
              {a.form}
            </span>
          )}
          {strengths.map((s) => (
            <span
              key={s}
              className={`inline-flex items-center gap-1.5 rounded-full bg-[#3B0A0A]/8 px-3 py-1 text-[13px] font-medium ${INK}`}
            >
              <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
              {s}
            </span>
          ))}
          {/* Prescription status leads with the word, not a colour — this is the
              single fact most likely to stop someone self-medicating. */}
          {a.prescriptionOnly === true && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#8B1111] px-3 py-1 text-[13px] font-semibold text-white">
              <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
              Prescription only
            </span>
          )}
          {a.prescriptionOnly === false && (
            <span className={`inline-flex items-center gap-1.5 rounded-full bg-[#0F5132] px-3 py-1 text-[13px] font-semibold text-white`}>
              Available over the counter
            </span>
          )}
        </div>

        {a.scheduleNote && <p className={`mt-3 text-[13px] ${NOTE}`}>{a.scheduleNote}</p>}

        {a.brandNames.length > 0 && (
          <p className={`mt-3 text-[13px] ${MUTED}`}>
            <span className="font-semibold">Also sold as:</span> {a.brandNames.join(', ')}
          </p>
        )}

        {/* ── Confidence ─────────────────────────────────────────────── */}
        <div className="mt-5 border-t border-[#3B0A0A]/10 pt-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className={`text-[14px] font-semibold ${band.tone === 'poor' ? BAD : INK}`}>
              {band.label} · {a.confidence}%
            </p>
          </div>
          <div
            className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#3B0A0A]/10"
            role="img"
            aria-label={`Identification confidence ${a.confidence} out of 100`}
          >
            <div
              className={`h-full rounded-full ${
                band.tone === 'good' ? 'bg-[#0F5132]' : band.tone === 'fair' ? 'bg-[#7A4A00]' : 'bg-[#8B1111]'
              }`}
              style={{ width: `${Math.max(3, a.confidence)}%` }}
            />
          </div>
          <p className={`mt-2 text-[13px] leading-relaxed ${MUTED}`}>{band.detail}</p>
          {a.confidenceReason && (
            <p className={`mt-1 text-[13px] italic leading-relaxed ${MUTED}`}>{a.confidenceReason}</p>
          )}
        </div>
      </section>

      {/* ── The one that stops people ────────────────────────────────── */}
      {a.seriousSideEffects.length > 0 && (
        <section className="rounded-[20px] bg-[#5C0F0F] p-6 text-white" role="alert">
          <h3 className="flex items-center gap-2 text-[15px] font-semibold">
            <AlertOctagon className="h-4 w-4 shrink-0" aria-hidden="true" />
            Stop taking it and get medical help if you notice
          </h3>
          <Bullets items={a.seriousSideEffects} className="mt-3 text-white/90" />
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {a.whatItTreats.length > 0 && (
          <Section icon={Info} title="What it is for">
            <Bullets items={a.whatItTreats} />
          </Section>
        )}

        <Section icon={Clock} title="How to take it">
          {dosingWithheld && (
            <p className={`mb-3 flex items-start gap-2 text-[13px] font-medium ${BAD}`}>
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Held back because the identification is not certain enough to attach a dose to.
            </p>
          )}
          <dl className="space-y-2.5">
            <Fact label="Adults" value={a.howToTake.adult} />
            <Fact label="Children" value={a.howToTake.pediatric} />
            <Fact label="With food" value={a.howToTake.withFood} />
            <Fact label="Timing" value={a.howToTake.timing} />
            <Fact label="How long" value={a.howToTake.courseLength} />
            <Fact label="Missed a dose" value={a.missedDose} />
          </dl>
        </Section>

        {a.doNotTakeIf.length > 0 && (
          <Section icon={Ban} title="Do not take it if">
            <Bullets items={a.doNotTakeIf} className={BAD} />
          </Section>
        )}

        {a.interactions.length > 0 && (
          <Section icon={Utensils} title="Does not mix with">
            <Bullets items={a.interactions} />
          </Section>
        )}

        {a.commonSideEffects.length > 0 && (
          <Section icon={AlertTriangle} title="Common side effects">
            <Bullets items={a.commonSideEffects} />
          </Section>
        )}

        {a.seeADoctorIf.length > 0 && (
          <Section icon={Stethoscope} title="See a doctor if">
            <Bullets items={a.seeADoctorIf} />
          </Section>
        )}
      </div>

      {/* ── Why this section exists on this particular site ──────────── */}
      {a.mentalHealthNote && (
        <Section icon={Brain} title="If you are also on something for your mental health">
          <p className={`text-[14px] leading-relaxed ${MUTED}`}>{a.mentalHealthNote}</p>
        </Section>
      )}

      {a.storage && (
        <Section icon={Package} title="Storing it">
          <p className={`text-[14px] leading-relaxed ${MUTED}`}>{a.storage}</p>
        </Section>
      )}

      <section className={`${CARD} p-6`}>
        <h3 className={`text-[15px] font-semibold ${INK}`}>The short version</h3>
        <p className={`mt-2 text-[15px] leading-relaxed ${INK}`}>{a.safetyVerdict}</p>
        <p className={`mt-4 border-t border-[#3B0A0A]/10 pt-4 text-[13px] leading-relaxed ${MUTED}`}>
          This is an AI reading of a photograph or a name, not a prescription, a diagnosis or a
          pharmacist. It can be wrong about which medicine this is. Before you take anything —
          especially if you are pregnant, already on other medication, or taking it for a child —
          check with a pharmacist or a doctor. The leaflet in the box beats this page every time.
        </p>
      </section>
    </motion.div>
  );
}
