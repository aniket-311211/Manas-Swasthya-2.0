import { useId, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useReducedMotion } from 'motion/react';
import { RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import {
  buildInsight,
  moodEmoji,
  moodLabel,
  moodToScore,
  sortByCreatedAt,
  withinDays,
  type MoodRange,
} from './moodInsights';
import { GLASS_SOLID } from '@/components/shell/theme';

const RANGES: MoodRange[] = [7, 14, 30];
const formatDay = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

interface Point { day: string; score: number; emoji: string; label: string }

function MoodTooltip({ active, payload }: { active?: boolean; payload?: { payload: Point }[] }) {
  const point = active ? payload?.[0]?.payload : undefined;
  if (!point) return null;
  return (
    <div className="rounded-xl border border-[#E4E7EE] bg-white px-3 py-2 text-xs shadow-sm">
      <p className="font-medium text-[#1B2430]">{point.day}</p>
      <p className="text-[#5A6472]">{point.emoji} {point.label} ({point.score} of 5)</p>
    </div>
  );
}

export default function MoodRhythmCard({ clerkId }: { clerkId: string }) {
  const [range, setRange] = useState<MoodRange>(7);
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const scaleId = useId();
  const insightId = useId();

  const { data: entries = [], isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['mood', clerkId],
    queryFn: () => api.getMoodHistory(clerkId),
    enabled: !!clerkId,
  });

  const inRange = useMemo(() => withinDays(sortByCreatedAt(entries), range), [entries, range]);
  const chartData = useMemo<Point[]>(
    () => inRange.map((e) => ({ day: formatDay(e.createdAt), score: moodToScore(e.mood), emoji: moodEmoji(e.mood), label: moodLabel(e.mood) })),
    [inRange],
  );

  return (
    <div className={`flex h-full flex-col ${GLASS_SOLID} p-6`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E4E7EE] pb-3">
        <h2 id={titleId} className="font-display text-[20px] text-[#1B2430]">Your mood rhythm</h2>
        <div role="group" aria-label="Mood history range in days" className="flex gap-1 font-mono text-xs">
          {RANGES.map((r) => {
            const on = range === r;
            return (
              <button
                key={r}
                type="button"
                aria-pressed={on}
                onClick={() => setRange(r)}
                className={`rounded-lg border px-2.5 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E3A59] ${on ? 'border-[#E4E7EE] bg-[#EEF0F5] font-semibold text-[#1B2430]' : 'border-[#E4E7EE] bg-white text-[#8A93A3]'}`}
              >
                {r}d
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3 h-44 w-full min-w-0">
        {isLoading ? (
          <div className="h-full w-full animate-pulse rounded-xl bg-[#E9ECF2]" />
        ) : isError ? (
          <div className="flex h-full flex-col items-start justify-center gap-3">
            <p role="status" className="text-sm text-[#5A6472]">We could not load your mood history right now.</p>
            <button type="button" onClick={() => refetch()} disabled={isFetching} className="inline-flex items-center rounded-full border border-[#E4E7EE] px-3 py-1.5 text-sm text-[#1B2430] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E3A59]">
              <RefreshCw className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
              {isFetching ? 'Retrying…' : 'Retry'}
            </button>
          </div>
        ) : entries.length === 0 ? (
          <p className="flex h-full items-center text-sm text-[#5A6472]">No check-ins yet. Use the Today check-in to log how you are feeling, and your rhythm will show up here.</p>
        ) : inRange.length === 0 ? (
          <p className="flex h-full items-center text-sm text-[#5A6472]">No check-ins in the last {range} days. Try a longer range, or log today&rsquo;s mood in the Today check-in.</p>
        ) : inRange.length === 1 ? (
          <p className="flex h-full items-center text-sm text-[#5A6472]">One check-in in the last {range} days: {moodEmoji(inRange[0].mood)} {moodLabel(inRange[0].mood)} on {formatDay(inRange[0].createdAt)}. Log a few more to see a rhythm.</p>
        ) : (
          <div className="h-full w-full" role="img" aria-labelledby={titleId} aria-describedby={`${scaleId} ${insightId}`}>
            <p id={scaleId} className="sr-only">
              Line chart of {inRange.length} check-ins over the last {range} days, scored 1 (very low) to 5 (great). Most recent: {moodLabel(inRange[inRange.length - 1].mood)} on {formatDay(inRange[inRange.length - 1].createdAt)}.
            </p>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#E4E7EE" strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#8A93A3' }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={20} />
                <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} width={30} tickFormatter={(v: number) => moodEmoji(String(v))} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip content={<MoodTooltip />} cursor={{ stroke: '#E4E7EE' }} />
                <Line type="linear" dataKey="score" name="Mood" stroke="#2E3A59" strokeWidth={2.5} dot={{ r: 3, fill: '#2E3A59' }} activeDot={{ r: 5 }} isAnimationActive={!reduceMotion} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="mt-3 min-h-[2.5rem] text-[13.5px] text-[#5A6472]">
        {isLoading ? <div className="h-4 w-3/4 animate-pulse rounded bg-[#E9ECF2]" /> : isError ? null : <p id={insightId}>{buildInsight(entries, range)}</p>}
      </div>
    </div>
  );
}
