import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useReducedMotion } from 'motion/react';
import Silk from '@/components/Silk/Silk';
import ErrorBoundary from '@/components/ErrorBoundary';
import ResourceGrid from '@/features/resources/ResourceGrid';
import ResourceViewer from '@/features/resources/ResourceViewer';
import { ON_SILK, ON_SILK_PANEL } from '@/features/resources/catalogue';
import type { Resource } from '@/lib/resources';

export default function Resources() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState<Resource | null>(null);

  return (
    <div className="relative flex min-h-[calc(100vh-4.25rem)] flex-col">
      {/*
        Silk canvas, matching the pattern on Chat and Assessment: fixed under the
        sticky top bar, pointer-events-none so it never eats a click, and skipped
        under reduced motion in favour of the flat colour.
      */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 bg-[#52dbdf]">
        {!reduceMotion && (
          <Silk speed={5.8} scale={1.3} color="#52dbdf" noiseIntensity={2.2} rotation={0} />
        )}
      </div>

      <div className="relative mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-10 lg:px-6">
        {open ? (
          <ErrorBoundary label="this resource">
            <ResourceViewer resource={open} onBack={() => setOpen(null)} />
          </ErrorBoundary>
        ) : (
          <>
            <header className={ON_SILK_PANEL}>
              <h1 className={`flex items-center gap-3 font-display text-[34px] leading-tight ${ON_SILK}`}>
                <img
                  src="/logos/manas_swasthya_logo_white.png"
                  alt=""
                  className="h-10 w-auto shrink-0 drop-shadow-[0_1px_3px_rgba(0,0,0,0.55)]"
                />
                {t('page.resources')}
              </h1>
              <p className={`mt-2 max-w-2xl text-[15px] leading-relaxed ${ON_SILK}`}>
                Music, books, films, activities and hobbies — each with its own code. Search by name
                or by code, or just browse a category.
              </p>
            </header>

            <ErrorBoundary label="the resource library">
              <ResourceGrid onOpen={setOpen} />
            </ErrorBoundary>
          </>
        )}
      </div>
    </div>
  );
}
