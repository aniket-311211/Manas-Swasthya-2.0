import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import GlassCard from '@/components/visual/GlassCard';
import { api } from '@/lib/api';
import type { MoodEntry } from '@/types/api';

const MOODS = [
  { value: 1, emoji: '😞', label: 'Very low' },
  { value: 2, emoji: '🙁', label: 'Low' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😄', label: 'Great' },
] as const;

function moodToScore(mood: string): number {
  const found = MOODS.find((m) => m.emoji === mood);
  if (found) return found.value;
  const parsed = Number(mood);
  return Number.isFinite(parsed) && parsed >= 1 && parsed <= 5 ? parsed : 3;
}

export default function MoodTrendCard({ clerkId }: { clerkId: string }) {
  const queryClient = useQueryClient();
  const [justLogged, setJustLogged] = useState(false);

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['mood', clerkId],
    queryFn: () => api.getMoodHistory(clerkId),
  });

  const logMood = useMutation({
    mutationFn: (mood: string) => api.saveMood({ clerkId, mood }),
    onSuccess: () => {
      setJustLogged(true);
      queryClient.invalidateQueries({ queryKey: ['mood', clerkId] });
      setTimeout(() => setJustLogged(false), 2500);
    },
  });

  const chartData = useMemo(() => {
    const last14 = [...entries]
      .sort((a: MoodEntry, b: MoodEntry) => +new Date(a.createdAt) - +new Date(b.createdAt))
      .slice(-14);
    return last14.map((e) => ({
      day: new Date(e.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      score: moodToScore(e.mood),
    }));
  }, [entries]);

  return (
    <GlassCard className="flex h-full flex-col p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Mood this fortnight</p>
        {justLogged && <span className="text-xs text-primary">Logged ✓</span>}
      </div>

      {isLoading ? (
        <div className="mt-4 h-28 animate-pulse rounded-xl bg-muted/50" />
      ) : chartData.length === 0 ? (
        <p className="mt-6 flex-1 text-sm text-muted-foreground">
          No moods logged yet — tap a face below to start your streak.
        </p>
      ) : (
        <div className="mt-2 h-32 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 4, left: -32, bottom: 0 }}>
              <defs>
                <linearGradient id="moodFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--sage))" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="hsl(var(--sage))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
              <YAxis domain={[1, 5]} ticks={[1, 3, 5]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(v: number) => [MOODS.find((m) => m.value === Math.round(v))?.label ?? v, 'Mood']}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="hsl(var(--sage))"
                strokeWidth={2.5}
                fill="url(#moodFill)"
                dot={false}
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
        <span className="text-xs text-muted-foreground">How are you now?</span>
        <div className="flex gap-1.5">
          {MOODS.map((m) => (
            <button
              key={m.value}
              type="button"
              aria-label={`Log mood: ${m.label}`}
              disabled={logMood.isPending}
              onClick={() => logMood.mutate(m.emoji)}
              className="rounded-full p-1 text-lg transition-transform hover:scale-125 disabled:opacity-50"
            >
              {m.emoji}
            </button>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}
