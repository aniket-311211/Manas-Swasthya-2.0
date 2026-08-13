import { useRef, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'motion/react';
import {
  AlertTriangle,
  Camera,
  History,
  ImageUp,
  RotateCcw,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import Silk from '@/components/Silk/Silk';
import ErrorBoundary from '@/components/ErrorBoundary';
import { api, ApiError } from '@/lib/api';
import type { MedicineAnalysisResponse } from '@/types/api';
import MedicineReport from '@/features/medicine/MedicineReport';
import { ImageError, prepareImage } from '@/features/medicine/prepareImage';
import {
  BAD,
  BTN_QUIET,
  BTN_SOLID,
  CARD,
  EYEBROW,
  FOCUS,
  INK,
  MUTED,
  NOTE,
  ON_SILK,
  ON_SILK_MUTED,
  resetLabel,
} from '@/features/medicine/theme';

/**
 * Manas Medicine — photograph a strip or type a name, and find out what you are
 * actually holding.
 *
 * Every call is authenticated with a Clerk session token rather than a user id
 * typed into the request body, and every user gets five checks a day counted in
 * the database. Both of those are visible here only as a number in the corner;
 * the reasons are in api/_lib/clerkAuth.ts and api/_lib/quota.ts.
 */

const DAILY_LIMIT_FALLBACK = 5;

export default function Medicine() {
  const { getToken, isSignedIn } = useAuth();
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [photo, setPhoto] = useState<{ dataUrl: string; preview: string } | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [result, setResult] = useState<MedicineAnalysisResponse | null>(null);
  const [dragging, setDragging] = useState(false);

  const allowance = useQuery({
    queryKey: ['medicine-allowance'],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new ApiError('Not signed in', 401);
      return api.getMedicineAllowance(token);
    },
    enabled: Boolean(isSignedIn),
  });

  const history = useQuery({
    queryKey: ['medicine-history'],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new ApiError('Not signed in', 401);
      return api.getMedicineHistory(token);
    },
    enabled: Boolean(isSignedIn),
  });

  const analyse = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      if (!token) throw new ApiError('Sign in to use the medicine assistant.', 401);
      return api.analyseMedicine(token, {
        medicineName: photo ? undefined : name.trim() || undefined,
        imageBase64: photo?.dataUrl,
      });
    },
    onSuccess: (data) => {
      setResult(data);
      // The server returns the allowance it just decremented, so this is the
      // real number rather than a guess made in the browser.
      qc.setQueryData(['medicine-allowance'], data.allowance);
      void qc.invalidateQueries({ queryKey: ['medicine-history'] });
    },
  });

  const left = allowance.data?.remaining ?? DAILY_LIMIT_FALLBACK;
  const limit = allowance.data?.limit ?? DAILY_LIMIT_FALLBACK;
  const exhausted = allowance.data ? !allowance.data.allowed : false;
  const busy = analyse.isPending;
  const canSubmit = Boolean(photo || name.trim()) && !busy && !exhausted;

  async function takeFile(file: File | undefined) {
    if (!file) return;
    setLocalError(null);
    try {
      const prepared = await prepareImage(file);
      setPhoto({ dataUrl: prepared.dataUrl, preview: prepared.preview });
      setName('');
      setResult(null);
    } catch (err) {
      setLocalError(err instanceof ImageError ? err.message : 'That photo could not be used.');
    }
  }

  function startOver() {
    setPhoto(null);
    setName('');
    setResult(null);
    setLocalError(null);
    analyse.reset();
    if (fileRef.current) fileRef.current.value = '';
    if (cameraRef.current) cameraRef.current.value = '';
  }

  const serverError =
    analyse.error instanceof Error ? analyse.error.message : analyse.isError ? 'Something went wrong.' : null;

  return (
    <div className="relative flex min-h-[calc(100vh-4.25rem)] flex-col">
      {/*
        Silk canvas. `fixed` so it spans the viewport under the sticky top bar;
        pointer-events-none so it never eats a click. Reduced motion falls back
        to the flat colour — same hex, so contrast is identical.

        #f44b4b is a strong red, L≈0.248: white on it is 3.5:1 and too weak for
        body copy, so every surface above it is dark ink on frosted light and the
        copy on the shader itself is outlined.
      */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 bg-[#f44b4b]">
        {!reduceMotion && (
          <Silk speed={5} scale={1} color="#f44b4b" noiseIntensity={1.5} rotation={0} />
        )}
      </div>

      <div className="relative mx-auto w-full max-w-5xl flex-1 space-y-6 px-4 py-10 lg:px-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className={`flex items-center gap-3 font-display text-[34px] leading-tight ${ON_SILK}`}>
              <img
                src="/logos/manas_swasthya_logo_white.png"
                alt=""
                className="h-10 w-auto shrink-0 drop-shadow-[0_1px_3px_rgba(0,0,0,0.55)]"
              />
              {t('page.medicine')}
            </h1>
            <p className={`mt-2 max-w-2xl text-[15px] leading-relaxed ${ON_SILK_MUTED}`}>
              Photograph a strip or type a name, and find out what it treats, how it is taken and
              what would mean stopping. It is a reading, not a prescription — a pharmacist is still
              the authority.
            </p>
          </div>

          {/* The allowance is stated up front rather than discovered on the
              fifth attempt. */}
          <div className={`${CARD} shrink-0 px-4 py-3`}>
            <p className={`${EYEBROW} ${MUTED}`}>{t('medicine.checksToday')}</p>
            <p className={`mt-0.5 font-display text-[22px] leading-none ${exhausted ? BAD : INK}`}>
              {allowance.isPending ? '—' : `${left} of ${limit}`}
            </p>
            {allowance.data && exhausted && (
              <p className={`mt-1 text-[12px] ${MUTED}`}>Back at {resetLabel(allowance.data.resetsAt)}</p>
            )}
          </div>
        </header>

        {/* ── Input ──────────────────────────────────────────────────── */}
        {!result && (
          <section className={`${CARD} p-6`} aria-label="Identify a medicine">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                void takeFile(e.dataTransfer.files?.[0]);
              }}
              className={`rounded-[16px] border-2 border-dashed p-6 text-center transition-colors ${
                dragging ? 'border-[#3B0A0A] bg-[#3B0A0A]/5' : 'border-[#3B0A0A]/25'
              }`}
            >
              {photo ? (
                <div className="flex flex-col items-center gap-4">
                  <img
                    src={photo.preview}
                    alt="The medicine you uploaded"
                    className="max-h-64 w-auto rounded-[12px] shadow-sm"
                  />
                  <button type="button" onClick={startOver} className={BTN_QUIET}>
                    <X className="h-4 w-4" aria-hidden="true" />
                    Use a different photo
                  </button>
                </div>
              ) : (
                <>
                  <p className={`font-display text-[19px] ${INK}`}>Photograph the strip or the box</p>
                  <p className={`mx-auto mt-1.5 max-w-md text-[13px] leading-relaxed ${MUTED}`}>
                    Get the printed name in frame and in focus. Good light and a flat surface do more
                    for accuracy than anything else.
                  </p>

                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    <button type="button" onClick={() => fileRef.current?.click()} className={BTN_SOLID}>
                      <ImageUp className="h-4 w-4" aria-hidden="true" />
                      {t('medicine.choosePhoto')}
                    </button>
                    <button type="button" onClick={() => cameraRef.current?.click()} className={BTN_QUIET}>
                      <Camera className="h-4 w-4" aria-hidden="true" />
                      {t('medicine.takePhoto')}
                    </button>
                  </div>

                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={(e) => void takeFile(e.target.files?.[0])}
                  />
                  <input
                    ref={cameraRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="sr-only"
                    onChange={(e) => void takeFile(e.target.files?.[0])}
                  />
                </>
              )}
            </div>

            {!photo && (
              <>
                <div className="my-5 flex items-center gap-3">
                  <span className="h-px flex-1 bg-[#3B0A0A]/15" />
                  <span className={`text-[12px] font-semibold uppercase tracking-[0.1em] ${MUTED}`}>
                    {t('medicine.orType')}
                  </span>
                  <span className="h-px flex-1 bg-[#3B0A0A]/15" />
                </div>

                <label htmlFor="medicine-name" className={`block text-[13px] font-semibold ${INK}`}>
                  {t('medicine.nameLabel')}
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  <input
                    id="medicine-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && canSubmit) analyse.mutate();
                    }}
                    maxLength={200}
                    placeholder="Dolo 650, Pan-D, Sertraline…"
                    className={`min-w-[240px] flex-1 rounded-full border border-[#3B0A0A]/20 bg-white px-4 py-2.5 text-[15px] ${INK} placeholder:text-[#7A2E2E]/55 ${FOCUS}`}
                  />
                </div>
              </>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={!canSubmit}
                onClick={() => analyse.mutate()}
                className={BTN_SOLID}
              >
                {busy ? (
                  <>
                    <Sparkles className="h-4 w-4 motion-safe:animate-pulse" aria-hidden="true" />
                    {t('medicine.reading')}
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" aria-hidden="true" />
                    {t('medicine.analyse')}
                  </>
                )}
              </button>
              {exhausted && (
                <p className={`text-[13px] font-medium ${BAD}`}>
                  That is all {limit} for today. It refills at midnight.
                </p>
              )}
            </div>

            {(localError || serverError) && (
              <p role="alert" className={`mt-3 flex items-start gap-2 text-[13px] font-medium ${BAD}`}>
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {localError ?? serverError}
              </p>
            )}

            <p className={`mt-4 border-t border-[#3B0A0A]/10 pt-4 text-[12px] leading-relaxed ${MUTED}`}>
              Your photo is used for the reading and then discarded — it is never stored. The name
              and the result are kept in your own history so you can look them up again.
            </p>
          </section>
        )}

        {/* ── Working ────────────────────────────────────────────────── */}
        {busy && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`${CARD} p-6`}
            role="status"
          >
            <p className={`font-display text-[19px] ${INK}`}>Reading the packaging…</p>
            <p className={`mt-1.5 text-[13px] ${MUTED}`}>
              Matching the printed name, working out the strength, and checking what it interacts
              with. A few seconds.
            </p>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#3B0A0A]/10">
              <div className="h-full w-1/3 rounded-full bg-[#3B0A0A]/40 motion-safe:animate-pulse" />
            </div>
          </motion.div>
        )}

        {/* ── Result ─────────────────────────────────────────────────── */}
        {result && result.analysis && (
          <>
            <ErrorBoundary label="this medicine report">
              <MedicineReport analysis={result.analysis} dosingWithheld={result.dosingWithheld} />
            </ErrorBoundary>
            <button type="button" onClick={startOver} className={BTN_SOLID}>
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              {t('medicine.another')}
            </button>
          </>
        )}

        {/* Not-identified is its own state, not a report full of empty sections. */}
        {result && !result.analysis && (
          <section className={`${CARD} p-6`} role="alert">
            <h2 className={`flex items-center gap-2 font-display text-[22px] ${INK}`}>
              <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
              {t('medicine.notIdentified')}
            </h2>
            <p className={`mt-2 text-[15px] leading-relaxed ${MUTED}`}>{result.reason}</p>
            <p className={`mt-3 text-[14px] leading-relaxed ${NOTE}`}>
              Rather than guess, we would rather say nothing. Try a sharper photo with the printed
              name flat to the camera, or type the name instead. If the packaging is gone, a
              pharmacist can identify a tablet by sight in a way this cannot.
            </p>
            <button type="button" onClick={startOver} className={`${BTN_SOLID} mt-5`}>
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Try again
            </button>
          </section>
        )}

        {/* ── History ────────────────────────────────────────────────── */}
        {(history.data?.length ?? 0) > 0 && (
          <section className={`${CARD} p-6`} aria-labelledby="medicine-history">
            <h2 id="medicine-history" className={`flex items-center gap-2 text-[15px] font-semibold ${INK}`}>
              <History className="h-4 w-4 shrink-0" aria-hidden="true" />
              What you have looked up
            </h2>
            <ul className="mt-3 divide-y divide-[#3B0A0A]/10">
              {history.data!.slice(0, 8).map((h) => (
                <li key={h.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2.5">
                  <span className={`text-[14px] font-medium ${INK}`}>{h.name}</span>
                  <span className={`text-[12px] ${MUTED}`}>
                    {new Date(h.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    })}
                    {' · '}
                    {h.confidence}% sure
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
