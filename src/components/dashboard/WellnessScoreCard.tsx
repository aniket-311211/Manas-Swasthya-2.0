import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import GlassCard from '@/components/visual/GlassCard';
import { api } from '@/lib/api';
import type { Assessment } from '@/types/api';

export function wellnessScore(a: Assessment): number {
  return Math.round((100 - a.stress + (100 - a.anxiety) + a.sleep) / 3);
}

export default function WellnessScoreCard({ clerkId }: { clerkId: string }) {
  const navigate = useNavigate();
  const { data: assessments = [], isLoading } = useQuery({
    queryKey: ['assessments', clerkId],
    queryFn: () => api.getAssessments(clerkId),
  });

  if (isLoading) {
    return <GlassCard className="h-full animate-pulse p-5"><div className="h-24 rounded-xl bg-muted/50" /></GlassCard>;
  }

  if (assessments.length === 0) {
    return (
      <GlassCard className="flex h-full flex-col justify-between p-5">
        <p className="text-sm text-muted-foreground">Wellness score</p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Take your first assessment to see your score.
        </p>
        <button
          type="button"
          onClick={() => navigate('/assessment')}
          className="pill-button mt-4 self-start bg-gradient-to-br from-primary-light to-primary-dark text-xs text-primary-foreground"
        >
          Start assessment
        </button>
      </GlassCard>
    );
  }

  const score = wellnessScore(assessments[0]);
  const prev = assessments[1] ? wellnessScore(assessments[1]) : null;
  const delta = prev === null ? null : score - prev;
  const circumference = 2 * Math.PI * 34;

  return (
    <GlassCard className="flex h-full flex-col p-5">
      <p className="text-sm text-muted-foreground">Wellness score</p>
      <div className="mt-3 flex flex-1 items-center gap-4">
        <div className="relative h-20 w-20">
          <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90">
            <circle cx="40" cy="40" r="34" fill="none" stroke="hsl(var(--muted))" strokeWidth="7" />
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              stroke="hsl(var(--sage))"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - score / 100)}
              style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)' }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-display text-2xl text-foreground">
            {score}
          </span>
        </div>
        <div>
          <p className="font-display text-lg text-foreground">
            {score >= 70 ? 'Doing well' : score >= 45 ? 'Holding steady' : 'Needs care'}
          </p>
          {delta !== null && (
            <p className={`mt-1 text-xs ${delta >= 0 ? 'text-primary' : 'text-destructive'}`}>
              {delta >= 0 ? '↑' : '↓'} {Math.abs(delta)} since last assessment
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            {new Date(assessments[0].createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>
    </GlassCard>
  );
}
