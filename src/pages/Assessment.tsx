import { useTranslation } from 'react-i18next';
import { useReducedMotion } from 'motion/react';
import Silk from '@/components/Silk/Silk';
import AssessmentFlow from '@/features/assessment/AssessmentFlow';

export default function Assessment() {
  const reduceMotion = useReducedMotion();
  const { t } = useTranslation();

  return (
    <div className="relative flex min-h-[calc(100vh-4.25rem)] flex-col">
      {/*
        Silk canvas. `fixed` so it spans the viewport under the sticky top bar;
        pointer-events-none so it never eats a click on an answer. Reduced motion
        falls back to the flat colour — same hex, so contrast is identical.
      */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 bg-[#9e30bd]">
        {!reduceMotion && (
          <Silk speed={5.8} scale={1.3} color="#9e30bd" noiseIntensity={2.2} rotation={0} />
        )}
      </div>

      <div className="relative flex-1">
        {/*
          Page identity, matching Manas Resources / Swasthya Consultations /
          Swasthya Community. White logo and outlined white type, because
          #9e30bd carries white at only 4.3:1 — fine for a 34px display face
          with an outline, not for anything smaller.
        */}
        <header className="mx-auto w-full max-w-3xl px-4 pt-10 lg:px-6">
          <h1 className="flex items-center gap-3 font-display text-[34px] leading-tight text-white [text-shadow:0_1px_0_rgba(0,0,0,0.75),0_0_2px_rgba(0,0,0,0.9),0_0_10px_rgba(0,0,0,0.55)]">
            <img
              src="/logos/manas_swasthya_logo_white.png"
              alt=""
              className="h-10 w-auto shrink-0 drop-shadow-[0_1px_3px_rgba(0,0,0,0.55)]"
            />
            {t('page.assessment')}
          </h1>
        </header>

        <AssessmentFlow />
      </div>
    </div>
  );
}
