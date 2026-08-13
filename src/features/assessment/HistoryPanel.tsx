import { useId, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { motion, useReducedMotion } from 'motion/react';
import { ChevronDown, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { toPast, trendSeries, type PastAssessment } from './history';

/**
 * Previous recordings, and how the overall score has moved.
 *
 * Sits on the assessment screen's saturated purple backdrop, so everything here
 * is a frosted card with light type — the dashboard's dark-on-white tokens would
 * be unreadable on it.
 *
 * The query key is the dashboard's own `['assessments', clerkId]`. Sharing it is
 * deliberate: opening this panel warms the dashboard's cache and vice versa, and
 * a retake invalidating that key updates both surfaces at once.
 */

const CARD = 'rounded-[20px] border border-white/25 bg-white/10 backdrop-blur-xl';
const FOCUS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-offset-0';
const BUTTON = `inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-4 py-2 text-[13px] font-semibold text-white hover:bg-white/25 ${FOCUS}`;

/** Banding read as tone, never as triage — the same vocabulary the dashboard uses. */
const STRETCH: Record<NonNullable<PastAssessment['riskLevel']>, string> = {
  low: 'A steadier stretch',
  moderate: 'A mixed stretch',
  high: 'A heavier stretch',
};

const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const shortDate = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

/** Direction in words and an arrow. Colour is never carrying the meaning alone. */
function move(delta: number) {
  if (delta > 0) return { arrow: '↑', text: `up ${delta}`, tone: 'text-[#CFF7DF]' };
  if (delta < 0) return { arrow: '↓', text: `down ${-delta}`, tone: 'text-[#FFDDA6]' };
  return { arrow: '→', text: 'no change', tone: 'text-white/60' };
}

function TrendTooltip({ active, payload }: { active?: boolean; payload?: { payload: { at: string; overall: number } }[] }) {
  const point = active ? payload?.[0]?.payload : undefined;
  if (!point) return null;
  return (
    <div className="rounded-xl border border-white/25 bg-[#2C0B36]/90 px-3 py-2 text-xs text-white backdrop-blur-md">
      <p className="font-medium">{longDate(point.at)}</p>
      <p className="text-white/70">{point.overall} out of 100</p>
    </div>
  );
}

export default function HistoryPanel({ clerkId, onRetake }: { clerkId: string; onRetake?: () => void }) {
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const chartTextId = useId();

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['assessments', clerkId],
    queryFn: () => api.getAssessments(clerkId),
    enabled: !!clerkId,
  });

  const history = useMemo(() => toPast(data ?? []), [data]);
  const series = useMemo(() => trendSeries(history), [history]);
  // History is newest-first, so the entry that follows is the one before it in time.
  const rows = useMemo(() => history.map((p, i) => ({ past: p, before: history[i + 1] ?? null })), [history]);

  const shell = `${CARD} p-5 sm:p-6`;
  const enter = reduceMotion ? {} : { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

  if (isLoading) {
    return (
      <section className={shell} aria-labelledby={titleId}>
        <h2 id={titleId} className="font-display text-[20px] text-white">
          Your previous reflections
        </h2>
        <div role="status" className="mt-4 space-y-3">
          <span className="sr-only">Loading your previous reflections</span>
          <div className="h-40 animate-pulse rounded-2xl bg-white/15" aria-hidden="true" />
          <div className="h-14 animate-pulse rounded-2xl bg-white/10" aria-hidden="true" />
          <div className="h-14 animate-pulse rounded-2xl bg-white/10" aria-hidden="true" />
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className={shell} aria-labelledby={titleId}>
        <h2 id={titleId} className="font-display text-[20px] text-white">
          Your previous reflections
        </h2>
        <p role="status" className="mt-2 text-[14px] leading-relaxed text-white/75">
          We could not load your past reflections right now. Nothing has been lost — they are still saved.
        </p>
        <button type="button" onClick={() => refetch()} disabled={isFetching} className={`mt-4 ${BUTTON}`}>
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} aria-hidden="true" />
          {isFetching ? 'Retrying…' : 'Try again'}
        </button>
      </section>
    );
  }

  if (history.length === 0) {
    return (
      <section className={shell} aria-labelledby={titleId}>
        <h2 id={titleId} className="font-display text-[20px] text-white">
          Your previous reflections
        </h2>
        <p className="mt-2 max-w-prose text-[14px] leading-relaxed text-white/75">
          Nothing here yet. Once you finish your first reflection it will land here, and every one after that will show
          you how things have moved since.
        </p>
        {onRetake && (
          <button type="button" onClick={onRetake} className={`mt-4 ${BUTTON}`}>
            Start your first reflection
          </button>
        )}
      </section>
    );
  }

  const latest = history[0];

  return (
    <motion.section {...enter} transition={{ duration: 0.3 }} className={shell} aria-labelledby={titleId}>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/55">History</p>
          <h2 id={titleId} className="mt-1 font-display text-[20px] text-white">
            Your previous reflections
          </h2>
        </div>
        {onRetake && (
          <button type="button" onClick={onRetake} className={BUTTON}>
            Take it again
          </button>
        )}
      </div>

      <h3 className="mt-5 text-[13px] font-semibold text-white/80">Overall score over time</h3>
      {series.length < 2 ? (
        <p className="mt-1 text-[13.5px] leading-relaxed text-white/70">
          One reflection so far, scoring {latest.overall} out of 100 on {longDate(latest.createdAt)}. A line needs at
          least two points, so take another when you are ready.
        </p>
      ) : (
        <div
          className="mt-2 h-44 w-full min-w-0"
          role="img"
          aria-labelledby={titleId}
          aria-describedby={chartTextId}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.18)" strokeDasharray="3 3" />
              <XAxis
                dataKey="at"
                tickFormatter={shortDate}
                tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.7)' }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                minTickGap={20}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 50, 100]}
                width={30}
                tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.6)' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<TrendTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.35)' }} />
              <Line
                type="monotone"
                dataKey="overall"
                name="Overall score"
                stroke="#FFFFFF"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#FFFFFF', stroke: 'none' }}
                activeDot={{ r: 5 }}
                isAnimationActive={!reduceMotion}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* A line chart says nothing to a screen reader — the same data, read out. */}
      <ul id={chartTextId} className="sr-only">
        {series.map((point) => (
          <li key={point.at}>
            {longDate(point.at)}: {point.overall} out of 100
          </li>
        ))}
      </ul>

      <h3 className="mt-6 text-[13px] font-semibold text-white/80">
        Every reflection, newest first
      </h3>
      <ul className="mt-2 space-y-2">
        {rows.map(({ past, before }) => {
          const change = before ? move(past.overall - before.overall) : null;
          return (
            <li key={past.id}>
              <details className="group rounded-2xl border border-white/15 bg-white/5">
                <summary
                  className={`flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-3 [&::-webkit-details-marker]:hidden ${FOCUS}`}
                >
                  <span className="min-w-0">
                    <span className="block text-[14px] text-white">{longDate(past.createdAt)}</span>
                    <span className="block text-[12px] text-white/60">
                      {past.riskLevel ? STRETCH[past.riskLevel] : 'No band recorded'}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3">
                    <span className="text-right">
                      <span className="block font-display text-[22px] leading-none text-white">{past.overall}</span>
                      <span className="block text-[11px] text-white/55">out of 100</span>
                    </span>
                    <span className={`w-[92px] text-right text-[12px] ${change ? change.tone : 'text-white/50'}`}>
                      {change ? (
                        <>
                          <span aria-hidden="true">{change.arrow} </span>
                          {change.text}
                        </>
                      ) : (
                        'first one'
                      )}
                    </span>
                    <ChevronDown
                      className="h-4 w-4 shrink-0 text-white/60 transition-transform group-open:rotate-180"
                      aria-hidden="true"
                    />
                  </span>
                </summary>
                <p className="border-t border-white/10 px-4 py-3 text-[13.5px] leading-relaxed text-white/75">
                  {past.summary ?? 'No written reflection was saved with this one, but the scores above still count.'}
                </p>
              </details>
            </li>
          );
        })}
      </ul>

      <p className="mt-4 text-[12px] text-white/55">A reflection, not a diagnosis.</p>
    </motion.section>
  );
}
