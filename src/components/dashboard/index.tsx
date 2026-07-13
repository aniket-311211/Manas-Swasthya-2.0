import { useUser } from '@clerk/clerk-react';
import { useQuery } from '@tanstack/react-query';
import { Flame } from 'lucide-react';
import Reveal from '@/components/visual/Reveal';
import ErrorBoundary from '@/components/ErrorBoundary';
import MoodTrendCard from './MoodTrendCard';
import WellnessScoreCard from './WellnessScoreCard';
import QuickActions from './QuickActions';
import RecentActivity from './RecentActivity';
import { api } from '@/lib/api';
import { calcStreak } from '@/lib/streak';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Still up';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard() {
  const { user } = useUser();
  const clerkId = user?.id ?? '';

  const { data: moods = [] } = useQuery({
    queryKey: ['mood', clerkId],
    queryFn: () => api.getMoodHistory(clerkId),
    enabled: !!clerkId,
  });

  const streak = calcStreak(moods.map((m) => m.createdAt));

  if (!user) return null;

  return (
    <div className="gradient-hero min-h-full">
      <div className="container mx-auto px-4 py-8 lg:px-6">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl text-foreground md:text-4xl">
                {greeting()}, {user.firstName ?? 'friend'}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {new Date().toLocaleDateString('en-IN', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </p>
            </div>
            {streak > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-clay/15 px-4 py-1.5 text-sm text-clay">
                <Flame className="h-4 w-4" /> {streak}-day streak
              </span>
            )}
          </div>
        </Reveal>

        <Reveal delay={0.1} className="mt-8">
          <ErrorBoundary label="quick actions">
            <QuickActions />
          </ErrorBoundary>
        </Reveal>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <Reveal delay={0.15} className="lg:col-span-2">
            <ErrorBoundary label="your mood trend">
              <MoodTrendCard clerkId={clerkId} />
            </ErrorBoundary>
          </Reveal>
          <Reveal delay={0.2}>
            <ErrorBoundary label="your wellness score">
              <WellnessScoreCard clerkId={clerkId} />
            </ErrorBoundary>
          </Reveal>
        </div>

        <Reveal delay={0.25} className="mt-6">
          <ErrorBoundary label="recent activity">
            <RecentActivity clerkId={clerkId} />
          </ErrorBoundary>
        </Reveal>
      </div>
    </div>
  );
}
