import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Loader2, RefreshCw } from 'lucide-react';
import { EYEBROW, FOCUS, GLASS_SOLID } from '@/components/shell/theme';
import CrisisBanner from '@/features/chat/CrisisBanner';
import { detectCrisis } from '@/lib/crisis';
import { wordCount } from '../doc';
import type { AutoMoodState } from '../editor/useAutoMood';
import { MOOD_META, type MoodAnalysis } from '../types';
import {
  analyzeJournal,
  canAnalyze,
  confidenceLabel,
  MIN_WORDS_FOR_ANALYSIS,
  wordsToGo,
} from './moodAnalysis';

/**
 * The mood card: the display of an analysis that now happens on its own.
 *
 * useAutoMood runs the read a beat after the entry saves, so the button here is
 * only a re-run — worth offering once there is a reading to disagree with, or
 * when the automatic one failed. Crisis outranks everything else in the card:
 * helplines first, mood after, and the scan below runs on the live text so it
 * never depends on a request landing.
 */

export interface MoodReportProps {
  clerkId: string;
  text: string;
  /** The analysis already stored on the entry, if it has one. */
  value?: MoodAnalysis;
  onAnalyzed: (mood: MoodAnalysis) => void;
  /** Progress of the automatic read, from useAutoMood. */
  auto?: { state: AutoMoodState; error?: string };
}

const BUTTON =
  `inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors ${FOCUS}`;

export default function MoodReport({ clerkId, text, value, onAnalyzed, auto }: MoodReportProps) {
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');
  const [flagged, setFlagged] = useState(false);
  const reduceMotion = useReducedMotion();

  const words = wordCount(text);
  const ready = canAnalyze(text);
  const running = status === 'running' || auto?.state === 'running';
  const waiting = auto?.state === 'waiting';
  // A successful re-run clears the automatic run's failure — the hook keeps
  // that state until the text changes again, and it is stale the moment this
  // card gets a reading of its own.
  const failed = status === 'error' || (status !== 'done' && auto?.state === 'error');
  // A re-run is only meaningful once there is a reading, or once the automatic
  // one failed. With no auto wired up at all, the button is the only way in.
  const offerRun = ready && (!!value || failed || !auto);
  const failure = status === 'error' ? error : auto?.error;

  // Two independent nets: what the server flagged on the last run, and a scan
  // of what is on the page right now. Either one shows the helplines, so a
  // failed request never swallows a disclosure.
  const crisis = useMemo(() => flagged || detectCrisis(text), [flagged, text]);

  const run = async () => {
    setStatus('running');
    setError('');
    try {
      const { crisis: isCrisis, ...mood } = await analyzeJournal(clerkId, text);
      setFlagged(isCrisis);
      onAnalyzed(mood);
      setStatus('done');
    } catch (err) {
      // Only the failure reason is surfaced — never the entry or the analysis.
      setError(err instanceof Error ? err.message : 'Could not read the entry just now.');
      setStatus('error');
    }
  };

  const meta = value ? MOOD_META[value.mood] : null;
  const stamp = value ? new Date(value.generatedAt) : null;
  const when =
    stamp && !Number.isNaN(stamp.getTime())
      ? stamp.toLocaleString('en-IN', {
          day: 'numeric',
          month: 'short',
          hour: 'numeric',
          minute: '2-digit',
        })
      : null;

  return (
    <section aria-labelledby="mood-report-heading" className={`${GLASS_SOLID} space-y-4 p-4 sm:p-5`}>
      <header className="space-y-1">
        <p className={EYEBROW}>Reflection</p>
        <h2 id="mood-report-heading" className="font-display text-[20px] leading-tight text-[#1B2430]">
          How this entry reads
        </h2>
        <p className="text-[12px] leading-relaxed text-[#5A6472]">
          A reflection of your own words, never a diagnosis. It describes the writing on this page,
          not you.
        </p>
      </header>

      {crisis && <CrisisBanner />}

      {value && meta && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5"
              style={{ backgroundColor: meta.tint, color: meta.ink }}
            >
              <span aria-hidden="true" className="text-[16px] leading-none">
                {meta.emoji}
              </span>
              <span className="text-[13px] font-semibold">{meta.label}</span>
            </span>
            <p className="text-[12px] text-[#5A6472]">
              <span className="font-mono text-[11px] text-[#1B2430]">
                {Math.round(value.confidence * 100)}%
              </span>{' '}
              — {confidenceLabel(value.confidence)} of what you wrote.
            </p>
          </div>

          {value.emotions.length > 0 && (
            <div>
              <p className={EYEBROW}>What came through</p>
              <ul className="mt-2 space-y-2">
                {value.emotions.map((e) => {
                  const pct = Math.round(e.score * 100);
                  return (
                    <li key={e.emotion}>
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-[13px] text-[#1B2430]">{e.emotion}</span>
                        <span className="font-mono text-[11px] text-[#5A6472]">{pct}%</span>
                      </div>
                      <div
                        aria-hidden="true"
                        className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#EEF0F5]"
                      >
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={reduceMotion ? { duration: 0 } : { duration: 0.5 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: meta.ink }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {value.themes.length > 0 && (
            <div>
              <p className={EYEBROW}>What it is about</p>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {value.themes.map((t) => (
                  <li
                    key={t}
                    className="rounded-full border border-[#E4E7EE] bg-[#EEF0F5] px-2.5 py-1 text-[12px] text-[#41485A]"
                  >
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {value.insight && (
            <p className="border-l-2 border-[#E4E7EE] pl-3 text-[14px] leading-relaxed text-[#1B2430]">
              {value.insight}
            </p>
          )}
        </div>
      )}

      {!value && ready && !running && !failed && (
        <p className="text-[13px] leading-relaxed text-[#5A6472]">
          Keep writing — a moment after this entry saves, it reads itself back to you: the mood it
          carries, the feelings in it, and what it seems to be about.
        </p>
      )}

      {!ready && (
        <p className="text-[13px] leading-relaxed text-[#5A6472]">
          A few more words first — {wordsToGo(text)} to go. Under {MIN_WORDS_FOR_ANALYSIS} words
          there is not enough here to reflect anything honest back.{' '}
          <span className="font-mono text-[11px] text-[#8A93A3]">
            {words}/{MIN_WORDS_FOR_ANALYSIS}
          </span>
        </p>
      )}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {offerRun && (
          <button
            type="button"
            onClick={run}
            disabled={running || waiting}
            className={`${BUTTON} border border-[#E4E7EE] bg-white text-[#2E3A59] hover:bg-[#EEF0F5] disabled:cursor-not-allowed disabled:text-[#8A93A3]`}
          >
            {running ? (
              <Loader2 className="h-3.5 w-3.5 motion-safe:animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {running ? 'Reading…' : failed ? 'Try again' : 'Re-analyse'}
          </button>
        )}

        <p role="status" aria-live="polite" className="text-[12px] text-[#5A6472]">
          {running
            ? 'Reading what you wrote…'
            : waiting
              ? 'Reading this back to you in a moment…'
              : failed
                ? ''
                : when
                  ? `Reflected ${when}`
                  : ''}
        </p>
      </div>

      {failed && (
        <p role="alert" className="text-[12px] leading-relaxed text-[#C0533F]">
          {failure} Your writing is untouched — try again whenever you like.
        </p>
      )}
    </section>
  );
}
