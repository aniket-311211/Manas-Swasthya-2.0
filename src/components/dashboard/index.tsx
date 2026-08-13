import { useUser } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import Reveal from '@/components/visual/Reveal';
import ErrorBoundary from '@/components/ErrorBoundary';
import DailyRitual from './DailyRitual';
import MoodCheckIn from './MoodCheckIn';
import MoodRhythmCard from './MoodRhythmCard';
import NextStepCard from './NextStepCard';
import WellnessScoreCard from './WellnessScoreCard';
// Bookings are real now, so this slot shows the actual next appointment
// rather than the mentor suggestion that stood in for it.
import UpcomingSessionCard from './UpcomingSessionCard';
import ResourceShelfCard from './ResourceShelfCard';
import QuickThoughtsCard from './QuickThoughtsCard';
import CommunityCard from './CommunityCard';




export default function Dashboard() {
  const { user } = useUser();
  const clerkId = user?.id ?? '';


  return (
    <div className="mx-auto w-full max-w-[1320px] px-6 py-8 lg:px-10">
      <Reveal>
        <ErrorBoundary label="today's ritual">
          <DailyRitual clerkId={clerkId} />
        </ErrorBoundary>
      </Reveal>

      {/* Mood check-in + next step */}
      <Reveal delay={0.05} className="mt-[22px]">
        <div className="flex flex-col gap-[18px] lg:flex-row">
          <section id="today" aria-label="Today's check-in" className="scroll-mt-24 flex-1">
            <ErrorBoundary label="today's mood check-in">
              <MoodCheckIn clerkId={clerkId} />
            </ErrorBoundary>
          </section>
          <div className="lg:w-[300px]">
            <ErrorBoundary label="your next step">
              <NextStepCard clerkId={clerkId} />
            </ErrorBoundary>
          </div>
        </div>
      </Reveal>

      {/* Editorial bento */}
      <div className="mt-[22px] grid grid-cols-1 gap-[18px] lg:grid-cols-12">
        <Reveal delay={0.1} className="lg:col-span-8">
          <section id="rhythm" aria-label="Your mood rhythm" className="h-full scroll-mt-24">
            <ErrorBoundary label="your mood rhythm">
              <MoodRhythmCard clerkId={clerkId} />
            </ErrorBoundary>
          </section>
        </Reveal>

        <Reveal delay={0.15} className="lg:col-span-4">
          <ErrorBoundary label="your wellness score">
            <WellnessScoreCard clerkId={clerkId} />
          </ErrorBoundary>
        </Reveal>

        <Reveal delay={0.2} className="lg:col-span-4">
          <ErrorBoundary label="your next session">
            <UpcomingSessionCard clerkId={clerkId} />
          </ErrorBoundary>
        </Reveal>

        <Reveal delay={0.25} className="lg:col-span-4">
          <ErrorBoundary label="your recent journal entries">
            <QuickThoughtsCard clerkId={clerkId} />
          </ErrorBoundary>
        </Reveal>

        <Reveal delay={0.3} className="lg:col-span-8">
          <div className="flex flex-col gap-[18px] sm:flex-row">
            <ErrorBoundary label="community events">
              <CommunityCard clerkId={clerkId} />
            </ErrorBoundary>
            <div className="flex-1">
              <ErrorBoundary label="your resources">
                <ResourceShelfCard />
              </ErrorBoundary>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
