import { useQuery } from '@tanstack/react-query';
import { ClipboardList, NotebookPen, SmilePlus } from 'lucide-react';
import GlassCard from '@/components/visual/GlassCard';
import { api } from '@/lib/api';

interface ActivityItem {
  id: string;
  kind: 'assessment' | 'journal' | 'mood';
  title: string;
  when: Date;
}

const KIND_META = {
  assessment: { icon: ClipboardList, color: 'text-lavender', bg: 'bg-lavender/15' },
  journal: { icon: NotebookPen, color: 'text-clay', bg: 'bg-clay/15' },
  mood: { icon: SmilePlus, color: 'text-sage', bg: 'bg-sage/15' },
} as const;

function timeAgo(d: Date): string {
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? 'yesterday' : `${days}d ago`;
}

export default function RecentActivity({ clerkId }: { clerkId: string }) {
  const assessments = useQuery({ queryKey: ['assessments', clerkId], queryFn: () => api.getAssessments(clerkId) });
  const journal = useQuery({ queryKey: ['journal', clerkId], queryFn: () => api.getJournal(clerkId) });
  const moods = useQuery({ queryKey: ['mood', clerkId], queryFn: () => api.getMoodHistory(clerkId) });

  const items: ActivityItem[] = [
    ...(assessments.data ?? []).map((a) => ({
      id: a.id,
      kind: 'assessment' as const,
      title: 'Completed a wellness assessment',
      when: new Date(a.createdAt),
    })),
    ...(journal.data ?? []).map((j) => ({
      id: j.id,
      kind: 'journal' as const,
      title: j.title ? `Journal: ${j.title}` : 'Wrote a journal entry',
      when: new Date(j.createdAt),
    })),
    ...(moods.data ?? []).map((m) => ({
      id: m.id,
      kind: 'mood' as const,
      title: `Logged mood ${m.mood}`,
      when: new Date(m.createdAt),
    })),
  ]
    .sort((a, b) => +b.when - +a.when)
    .slice(0, 6);

  const loading = assessments.isLoading || journal.isLoading || moods.isLoading;

  return (
    <GlassCard className="p-5">
      <p className="text-sm text-muted-foreground">Recent activity</p>
      {loading ? (
        <div className="mt-4 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-xl bg-muted/50" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Your check-ins, journal entries, and assessments will appear here.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((item) => {
            const meta = KIND_META[item.kind];
            return (
              <li key={`${item.kind}-${item.id}`} className="flex items-center gap-3">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.bg}`}>
                  <meta.icon className={`h-4 w-4 ${meta.color}`} />
                </span>
                <span className="flex-1 truncate text-sm text-foreground">{item.title}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(item.when)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </GlassCard>
  );
}
