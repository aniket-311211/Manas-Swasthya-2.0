import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUser } from '@clerk/clerk-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Download, RefreshCcw, Sparkles } from 'lucide-react';
import jsPDF from 'jspdf';
import { aiAssessmentSummary, aiFollowUps } from '@/lib/ai';
import { api } from '@/lib/api';
import { DOMAIN_META, type Answer, type StoredAnswers } from './domain';
import { pickSession } from './itemBank';
import { medianMs, paceReflection } from './scoring';
import { compare, toPast } from './history';
import { assessmentReducer, currentItem, initialState } from './reducer';
import ScoreRing from './ScoreRing';
import DomainBars from './DomainBars';
import HistoryPanel from './HistoryPanel';
import WhatChanged from './WhatChanged';
import DomainRadar from './DomainRadar';
import QuoteCard from './QuoteCard';

/** Follow-ups are asked for once the bank is this far along. */
const PREFETCH_AFTER = 8;

const CARD = 'rounded-[20px] border border-white/25 bg-white/10 backdrop-blur-xl';
const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80';
const BTN = `inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${FOCUS}`;

const RISK_COPY = {
  low: 'Things look steady',
  moderate: 'Some things are asking for attention',
  high: 'A lot is weighing on you right now',
} as const;

export default function AssessmentFlow() {
  const { t } = useTranslation();
  const { user } = useUser();
  const clerkId = user?.id ?? '';
  const queryClient = useQueryClient();
  const reduceMotion = useReducedMotion();

  const [state, dispatch] = useReducer(assessmentReducer, initialState);
  const [announce, setAnnounce] = useState('');

  // Render time of the question on screen. A ref, not state — reading the clock
  // must not itself cause a render, and the value is only ever read on answer.
  const shownAt = useRef<number>(Date.now());
  const savedRef = useRef(false);
  const askedFollowUps = useRef(false);
  const item = currentItem(state);

  useEffect(() => {
    shownAt.current = Date.now();
  }, [item?.id]);

  const { data: assessmentRows = [] } = useQuery({
    queryKey: ['assessments', clerkId],
    queryFn: () => api.getAssessments(clerkId),
    enabled: !!clerkId,
  });

  // Comparison is against what existed BEFORE this run, so the fresh row is
  // excluded until the next visit — otherwise it would compare against itself.
  const priorComparison = useMemo(() => {
    // The row this very run just wrote, if the refetch has already brought it
    // back. Newest first, so it is the head of the list.
    const newestSavedId = savedRef.current ? (assessmentRows ?? [])[0]?.id : undefined;
    const past = toPast(assessmentRows);
    return state.scores
      ? compare([
          {
            id: 'current',
            createdAt: new Date().toISOString(),
            stress: state.scores.stress,
            anxiety: state.scores.anxiety,
            sleep: state.scores.sleep,
            overall: state.scores.overall,
            domainScores: state.scores.domainScores,
            riskLevel: state.scores.riskLevel,
          },
          // `past.filter(p => p.id !== 'current')` never removed anything —
          // only the object built above carries that id, and the saved row
          // comes back from the database with a real one. So seconds after the
          // save landed and the query refetched, this run appeared twice and
          // was compared against itself: every area went "steady", the radar's
          // dashed line sat exactly on the solid one, and a first-ever
          // assessment lost its "this is your first reflection" copy.
          // Dropping by timestamp instead: the saved row is the newest, and it
          // is the one already represented by the object above.
          ...past.filter((p) => p.id !== newestSavedId),
        ])
      : null;
  }, [assessmentRows, state.scores]);

  const answered = state.answers.length;
  const total = state.items.length + state.followUps.length;

  const choose = useCallback(
    (label: string, weight: number) => {
      if (!item) return;
      const answer: Answer = {
        itemId: item.id,
        domain: item.domain,
        question: item.prompt,
        answer: label,
        weight,
        ms: Math.max(0, Date.now() - shownAt.current),
      };
      dispatch({ type: 'ANSWER', answer });
    },
    [item],
  );

  // Number keys pick an option — the fastest possible path through a question.
  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (!Number.isInteger(n) || n < 1 || n > item.options.length) return;
      const opt = item.options[n - 1];
      e.preventDefault();
      choose(opt.label, opt.weight);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [item, choose]);

  // Prefetch follow-ups while they are still on the bank, so the transition is
  // seamless. Failure is silent and ordinary: the reducer routes to scoring.
  useEffect(() => {
    if (state.phase !== 'asking' || askedFollowUps.current) return;
    if (state.answers.length < PREFETCH_AFTER || !clerkId) return;
    askedFollowUps.current = true;
    aiFollowUps(clerkId, state.answers)
      .then((r) => dispatch({ type: 'FOLLOWUPS_READY', questions: r.questions }))
      .catch(() => undefined);
  }, [state.phase, state.answers, clerkId]);

  // Score locally the moment the questions run out. No network in this path.
  useEffect(() => {
    if (state.phase === 'scoring') dispatch({ type: 'SCORE' });
  }, [state.phase]);

  useEffect(() => {
    if (state.phase === 'asking' || state.phase === 'followups') {
      setAnnounce(`Question ${answered + 1} of ${total}`);
    } else if (state.phase === 'results') {
      setAnnounce('Your results are ready');
    }
  }, [state.phase, answered, total]);

  // Persist once, then tell the dashboard. `overall` already equals
  // wellnessScore(), so the wellness card and this screen cannot disagree.
  useEffect(() => {
    if (state.phase !== 'results' || !state.scores || savedRef.current || !clerkId) return;
    savedRef.current = true;
    const s = state.scores;
    const stored: StoredAnswers = {
      v: 2,
      responses: state.answers,
      domainScores: s.domainScores,
      overall: s.overall,
      riskLevel: s.riskLevel,
      summary: state.summary ?? '',
      recommendations: state.recommendations,
      medianMs: medianMs(state.answers),
    };
    api
      .saveAssessment({
        clerkId,
        stress: s.stress,
        anxiety: s.anxiety,
        sleep: s.sleep,
        answers: stored,
        activities: state.recommendations,
        games: [],
      })
      .then(() => queryClient.invalidateQueries({ queryKey: ['assessments', clerkId] }))
      .catch(() => undefined);
  }, [state.phase, state.scores, state.answers, state.summary, state.recommendations, clerkId, queryClient]);

  // Prose arrives after the numbers and slots in.
  useEffect(() => {
    if (state.phase !== 'results' || !state.scores || state.summary !== null || !clerkId) return;
    let live = true;
    aiAssessmentSummary(clerkId, state.answers, state.scores)
      .then((r) => {
        if (live) dispatch({ type: 'SUMMARY', summary: r.summary, recommendations: r.recommendations });
      })
      .catch(() => {
        if (live) {
          dispatch({
            type: 'SUMMARY',
            summary:
              'Here is where your six areas landed today. Read it as a snapshot of this week, not a verdict on you.',
            recommendations: [],
          });
        }
      });
    return () => {
      live = false;
    };
  }, [state.phase, state.scores, state.summary, state.answers, clerkId]);

  const start = () => {
    savedRef.current = false;
    askedFollowUps.current = false;
    dispatch({ type: 'START', items: pickSession() });
  };

  const downloadReport = () => {
    const s = state.scores;
    if (!s) return;
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('ManasSwasthya — Wellness Reflection', 20, 22);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }), 20, 30);
    doc.setFontSize(13);
    doc.text(`Overall: ${s.overall} / 100   ·   ${RISK_COPY[s.riskLevel]}`, 20, 44);
    let y = 58;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Areas', 20, y);
    doc.setFont('helvetica', 'normal');
    y += 8;
    for (const [d, v] of Object.entries(s.domainScores)) {
      doc.text(`${DOMAIN_META[d as keyof typeof DOMAIN_META]?.label ?? d}: ${Math.round(v)} / 100`, 24, y);
      y += 7;
    }
    if (state.summary) {
      y += 4;
      doc.setFont('helvetica', 'bold');
      doc.text('Reflection', 20, y);
      doc.setFont('helvetica', 'normal');
      y += 8;
      const lines = doc.splitTextToSize(state.summary, 170);
      doc.text(lines, 20, y);
      y += lines.length * 6 + 6;
    }
    if (state.recommendations.length) {
      doc.setFont('helvetica', 'bold');
      doc.text('Gentle next steps', 20, y);
      doc.setFont('helvetica', 'normal');
      y += 8;
      for (const r of state.recommendations) {
        const lines = doc.splitTextToSize(`• ${r}`, 170);
        doc.text(lines, 24, y);
        y += lines.length * 6 + 2;
      }
    }
    doc.setFontSize(8);
    doc.text('A wellbeing reflection, not a clinical diagnosis.', 20, 285);
    doc.save('manasswasthya-reflection.pdf');
  };

  const pace = state.phase === 'results' ? paceReflection(state.answers) : null;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 lg:px-6">
      <p role="status" aria-live="polite" className="sr-only">
        {announce}
      </p>

      <AnimatePresence mode="wait">
        {state.phase === 'intro' && (
          <motion.div
            key="intro"
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -12 }}
            transition={{ duration: 0.18 }}
            className="space-y-[18px]"
          >
            <div className={`${CARD} p-8 text-center`}>
              <h1 className="font-display text-[34px] leading-tight text-white">{t('assessment.introTitle')}</h1>
              <p className="mx-auto mt-3 max-w-md text-[15px] text-white/75">
                {t('assessment.introBlurb')}
              </p>
              <button type="button" onClick={start} className={`${BTN} mt-6 bg-white text-[#5A1670]`}>
                Begin <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <HistoryPanel clerkId={clerkId} onRetake={start} />
          </motion.div>
        )}

        {item && (
          <motion.div
            key={`q-${item.id}`}
            initial={reduceMotion ? false : { opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, x: -24 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className={`${CARD} p-6 sm:p-8`}>
              <div className="flex items-center justify-between gap-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/60">
                  {DOMAIN_META[item.domain].label} · {answered + 1} of {total}
                </p>
                {state.phase === 'followups' && (
                  <span className="rounded-full bg-white/15 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white/80">
                    Picked for you
                  </span>
                )}
              </div>

              <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/20">
                <motion.div
                  className="h-full rounded-full bg-white"
                  animate={{ width: `${total ? (answered / total) * 100 : 0}%` }}
                  transition={reduceMotion ? { duration: 0 } : { duration: 0.25 }}
                />
              </div>

              <fieldset className="mt-6">
                <legend className="font-display text-[24px] leading-snug text-white">{item.prompt}</legend>
                <div className="mt-5 space-y-2.5">
                  {item.options.map((opt, i) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => choose(opt.label, opt.weight)}
                      className={`flex w-full items-center gap-3 rounded-[16px] border border-white/25 bg-white/10 px-4 py-3.5 text-left text-[15px] text-white transition-colors hover:bg-white/20 ${FOCUS}`}
                    >
                      <span
                        aria-hidden="true"
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/15 font-mono text-[11px] text-white/80"
                      >
                        {i + 1}
                      </span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-white/45">
                Press 1–{item.options.length} to answer
              </p>
            </div>
          </motion.div>
        )}

        {state.phase === 'scoring' && (
          <motion.div key="scoring" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`${CARD} p-10 text-center`}>
            <p className="text-white/80">Putting your answers together…</p>
          </motion.div>
        )}

        {state.phase === 'results' && state.scores && (
          <motion.div
            key="results"
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
            className="space-y-[18px]"
          >
            <div className={`${CARD} p-6 sm:p-8`}>
              <div className="flex flex-col items-center gap-7 sm:flex-row sm:items-start">
                <div className="flex flex-col items-center gap-2">
                  <ScoreRing score={state.scores.overall} />
                  <span className="rounded-full bg-white/15 px-3 py-1 text-[12px] text-white/85">
                    {RISK_COPY[state.scores.riskLevel]}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="font-display text-[26px] text-white">{t('assessment.resultsTitle')}</h1>
                  <p className="mt-2 text-[15px] leading-relaxed text-white/75">
                    {state.summary ?? 'Reading through what you shared…'}
                  </p>
                  {pace && <p className="mt-3 text-[13px] text-white/60">{pace}</p>}
                </div>
              </div>
              <div className="mt-7">
                <DomainBars scores={state.scores.domainScores} />
              </div>
            </div>

            {priorComparison && (
              <>
                <WhatChanged comparison={priorComparison} />
                <DomainRadar comparison={priorComparison} />
              </>
            )}

            {state.recommendations.length > 0 && (
              <div className={`${CARD} p-6`}>
                <h2 className="text-sm font-semibold text-white">Gentle next steps</h2>
                <ul className="mt-3 space-y-2">
                  {state.recommendations.map((r) => (
                    <li key={r} className="flex items-start gap-2 text-[14px] text-white/80">
                      <Sparkles className="mt-1 h-3.5 w-3.5 shrink-0 text-white/60" aria-hidden="true" /> {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <QuoteCard overall={state.scores.overall} />

            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={downloadReport} className={`${BTN} bg-white text-[#5A1670]`}>
                <Download className="h-4 w-4" aria-hidden="true" /> Download
              </button>
              <button
                type="button"
                onClick={() => dispatch({ type: 'RESET' })}
                className={`${BTN} border border-white/30 bg-white/10 text-white`}
              >
                <RefreshCcw className="h-4 w-4" aria-hidden="true" /> Take it again
              </button>
            </div>
          </motion.div>
        )}

        {state.phase === 'error' && (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`${CARD} p-10 text-center`}>
            <p role="alert" className="text-white/85">
              {state.error ?? 'Something went wrong.'}
            </p>
            <button type="button" onClick={start} className={`${BTN} mt-5 border border-white/30 bg-white/10 text-white`}>
              <RefreshCcw className="h-4 w-4" aria-hidden="true" /> Try again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
