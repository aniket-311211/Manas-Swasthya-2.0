import { useCallback, useEffect, useReducer, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Sparkles, RefreshCcw, Download, ArrowRight } from 'lucide-react';
import jsPDF from 'jspdf';
import GlassCard from '@/components/visual/GlassCard';
import Aurora from '@/components/visual/Aurora';
import { aiNextQuestion } from '@/lib/ai';
import { api } from '@/lib/api';
import { assessmentReducer, initialState } from './reducer';
import ScoreRing from './ScoreRing';
import DomainBars from './DomainBars';

const DOMAINS = ['academic', 'social', 'emotional', 'behavioral', 'cognitive', 'physical'];
const TOTAL_QUESTIONS = 12;

export default function AssessmentFlow() {
  const { user } = useUser();
  const clerkId = user?.id ?? '';
  const [state, dispatch] = useReducer(assessmentReducer, initialState);
  const savedRef = useRef(false);

  const fetchNext = useCallback(
    async (answered: { question: string; answer: string; domain: string }[]) => {
      try {
        const result = await aiNextQuestion(clerkId, answered);
        dispatch({ type: 'QUESTION_LOADED', result });
      } catch (err) {
        dispatch({ type: 'FAILED', message: err instanceof Error ? err.message : 'Something went wrong' });
      }
    },
    [clerkId],
  );

  useEffect(() => {
    if (state.phase === 'loading') fetchNext(state.answered);
  }, [state.phase, state.answered, fetchNext]);

  // Persist once when results arrive
  useEffect(() => {
    if (state.phase === 'results' && state.scores && !savedRef.current && clerkId) {
      savedRef.current = true;
      api
        .saveAssessment({
          clerkId,
          stress: Math.round(state.scores.stress),
          anxiety: Math.round(state.scores.anxiety),
          sleep: Math.round(state.scores.sleep),
          answers: {
            responses: state.answered,
            domainScores: state.scores.domainScores,
            riskLevel: state.scores.riskLevel,
            summary: state.scores.summary,
            recommendations: state.scores.recommendations,
          },
          activities: state.scores.recommendations,
          games: [],
        })
        .catch((e) => console.error('Failed to save assessment:', e));
    }
    if (state.phase === 'intro') savedRef.current = false;
  }, [state.phase, state.scores, state.answered, clerkId]);

  const downloadReport = () => {
    if (!state.scores) return;
    const doc = new jsPDF();
    const s = state.scores;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('ManasSwasthya — Wellness Report', 20, 22);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }), 20, 30);
    doc.setFontSize(13);
    doc.text(`Overall wellness: ${overall(s)} / 100   ·   Risk level: ${s.riskLevel}`, 20, 44);
    doc.setFontSize(11);
    let y = 56;
    doc.setFont('helvetica', 'bold');
    doc.text('Domain scores', 20, y);
    doc.setFont('helvetica', 'normal');
    y += 8;
    for (const [d, v] of Object.entries(s.domainScores)) {
      doc.text(`${d}: ${Math.round(v)} / 100`, 24, y);
      y += 7;
    }
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 20, y);
    doc.setFont('helvetica', 'normal');
    y += 8;
    const summary = doc.splitTextToSize(s.summary, 170);
    doc.text(summary, 20, y);
    y += summary.length * 6 + 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Recommendations', 20, y);
    doc.setFont('helvetica', 'normal');
    y += 8;
    for (const r of s.recommendations) {
      const lines = doc.splitTextToSize(`• ${r}`, 170);
      doc.text(lines, 24, y);
      y += lines.length * 6 + 2;
    }
    doc.setFontSize(8);
    doc.text('This report is a wellbeing companion, not a clinical diagnosis.', 20, 285);
    doc.save('manasswasthya-wellness-report.pdf');
  };

  const overall = (s: NonNullable<typeof state.scores>) =>
    Math.round((100 - s.stress + (100 - s.anxiety) + s.sleep) / 3);

  const progress = Math.min(state.answered.length / TOTAL_QUESTIONS, 1);
  const coveredDomains = new Set(state.answered.map((a) => a.domain));

  return (
    <div className="gradient-hero relative min-h-full overflow-hidden">
      <Aurora variant="subtle" />
      <div className="container relative mx-auto max-w-3xl px-4 py-10 lg:px-6">
        <AnimatePresence mode="wait">
          {state.phase === 'intro' && (
            <motion.div key="intro" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
              <GlassCard className="p-8 text-center md:p-12">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-lavender/20">
                  <Brain className="h-7 w-7 text-lavender" />
                </span>
                <h1 className="mt-6 font-display text-3xl text-foreground md:text-4xl">
                  Adaptive wellness check-in
                </h1>
                <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
                  Twelve questions that adapt to your answers, across six areas of student life —
                  academic, social, emotional, behavioral, cognitive, and physical. Takes about 4
                  minutes. There are no right answers.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {DOMAINS.map((d) => (
                    <span key={d} className="rounded-full bg-muted px-3 py-1 text-xs capitalize text-muted-foreground">
                      {d}
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'START' })}
                  className="pill-button mt-8 inline-flex items-center gap-2 bg-gradient-to-br from-primary-light to-primary-dark text-sm text-primary-foreground shadow-[0_8px_28px_-6px_hsl(var(--sage)/0.6)]"
                >
                  Begin <ArrowRight className="h-4 w-4" />
                </button>
              </GlassCard>
            </motion.div>
          )}

          {(state.phase === 'question' || state.phase === 'loading') && (
            <motion.div key="question" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="mb-6">
                <div className="mb-2 flex justify-between text-xs text-muted-foreground">
                  <span>
                    Question {Math.min(state.answered.length + 1, TOTAL_QUESTIONS)} of {TOTAL_QUESTIONS}
                  </span>
                  <span className="capitalize">
                    {state.current?.domain ?? (state.answered.length >= TOTAL_QUESTIONS ? 'finishing up' : 'thinking…')}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-sage to-lavender"
                    animate={{ width: `${progress * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <div className="mt-2 flex gap-1.5">
                  {DOMAINS.map((d) => (
                    <span
                      key={d}
                      title={d}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        coveredDomains.has(d) ? 'bg-sage/70' : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {state.phase === 'loading' ? (
                <GlassCard className="flex flex-col items-center gap-4 p-12 text-center">
                  <motion.span
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-sage/15"
                  >
                    <Sparkles className="h-6 w-6 text-sage" />
                  </motion.span>
                  <p className="text-sm text-muted-foreground">
                    {state.answered.length >= TOTAL_QUESTIONS
                      ? 'Reading between the lines of your answers…'
                      : 'Choosing the right next question for you…'}
                  </p>
                </GlassCard>
              ) : (
                state.current && (
                  <motion.div
                    key={state.current.question}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45 }}
                  >
                    <GlassCard className="p-8">
                      <h2 className="font-display text-xl leading-snug text-foreground md:text-2xl">
                        {state.current.question}
                      </h2>
                      <div className="mt-6 grid gap-3">
                        {state.current.options.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => dispatch({ type: 'ANSWER', answer: opt })}
                            className="rounded-xl border border-border bg-card/70 px-5 py-3.5 text-left text-sm text-foreground transition-all hover:border-sage hover:bg-sage/10 hover:pl-6"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </GlassCard>
                  </motion.div>
                )
              )}
            </motion.div>
          )}

          {state.phase === 'error' && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <GlassCard className="p-10 text-center">
                <p className="text-sm text-muted-foreground">Couldn't reach the assessment engine. {state.error}</p>
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'RETRY' })}
                  className="pill-button mt-6 inline-flex items-center gap-2 border border-border bg-card text-sm text-foreground"
                >
                  <RefreshCcw className="h-4 w-4" /> Try again
                </button>
              </GlassCard>
            </motion.div>
          )}

          {state.phase === 'results' && state.scores && (
            <motion.div key="results" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <GlassCard className="p-8 md:p-10">
                <div className="flex flex-col items-center gap-8 md:flex-row md:items-start">
                  <div className="flex flex-col items-center gap-3">
                    <ScoreRing score={overall(state.scores)} />
                    <span
                      className={`rounded-full px-4 py-1 text-xs capitalize ${
                        state.scores.riskLevel === 'low'
                          ? 'bg-success/15 text-success'
                          : state.scores.riskLevel === 'moderate'
                            ? 'bg-warning/15 text-warning'
                            : 'bg-destructive/15 text-destructive'
                      }`}
                    >
                      {state.scores.riskLevel} risk
                    </span>
                  </div>
                  <div className="flex-1">
                    <h2 className="font-display text-2xl text-foreground">Your wellness picture</h2>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{state.scores.summary}</p>
                    <div className="mt-6">
                      <DomainBars scores={state.scores.domainScores} />
                    </div>
                  </div>
                </div>

                <div className="mt-8 border-t border-border/60 pt-6">
                  <h3 className="text-sm font-medium text-foreground">Gentle next steps</h3>
                  <ul className="mt-3 space-y-2">
                    {state.scores.recommendations.map((r) => (
                      <li key={r} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sage" /> {r}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={downloadReport}
                    className="pill-button inline-flex items-center gap-2 bg-gradient-to-br from-primary-light to-primary-dark text-sm text-primary-foreground"
                  >
                    <Download className="h-4 w-4" /> Download report
                  </button>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'RESET' })}
                    className="pill-button inline-flex items-center gap-2 border border-border bg-card text-sm text-foreground"
                  >
                    <RefreshCcw className="h-4 w-4" /> Retake
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
