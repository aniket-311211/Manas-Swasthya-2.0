import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { wellnessScore } from '@/lib/wellness';
import { sortByCreatedAt } from './moodInsights';
import { GLASS } from '@/components/shell/theme';

function delta(current: number, previous: number) {
  const diff = current - previous;
  // Direction lives in the words: the arrow is decorative and colour is never the only signal.
  if (diff === 0) return { arrow: '→', text: 'No change since your last assessment', tone: 'text-[#5A6472]' };
  if (diff > 0) return { arrow: '↑', text: `Up ${diff} since your last assessment`, tone: 'text-[#1B2430]' };
  return { arrow: '↓', text: `Down ${-diff} since your last assessment`, tone: 'text-[#C0533F]' };
}

const shell = `flex h-full flex-col ${GLASS} p-6`;

export default function WellnessScoreCard({ clerkId }: { clerkId: string }) {
  const { data: assessments = [], isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['assessments', clerkId],
    queryFn: () => api.getAssessments(clerkId),
    enabled: !!clerkId,
  });

  if (isLoading) {
    return <div className={shell}><div className="h-24 animate-pulse rounded-xl bg-white/50" /></div>;
  }

  if (isError) {
    return (
      <div className={shell}>
        <h2 className="text-sm text-[#5A6472]">Wellness reflection</h2>
        <p role="status" className="mt-2 text-sm leading-relaxed text-[#5A6472]">We could not load your assessments right now.</p>
        <button type="button" onClick={() => refetch()} disabled={isFetching} className="mt-4 self-start rounded-full border border-[#E4E7EE] px-3 py-1.5 text-sm text-[#1B2430] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B2430]">
          {isFetching ? 'Retrying…' : 'Retry'}
        </button>
      </div>
    );
  }

  const sorted = sortByCreatedAt(assessments);
  const latest = sorted[sorted.length - 1];

  if (!latest) {
    return (
      <div className={`${shell} items-center justify-center text-center`}>
        <h2 className="text-sm text-[#5A6472]">Wellness reflection</h2>
        <p className="mt-2 text-sm leading-relaxed text-[#5A6472]">Take your first assessment to see this reflection.</p>
        <Link to="/assessment" className="mt-4 rounded-full bg-[#2E3A59] px-5 py-2.5 text-xs font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B2430] focus-visible:ring-offset-2">Start assessment</Link>
      </div>
    );
  }

  const score = wellnessScore(latest);
  const previous = sorted[sorted.length - 2];
  const change = previous ? delta(score, wellnessScore(previous)) : null;
  const circumference = 2 * Math.PI * 42;

  return (
    <div className={`${shell} items-center justify-center text-center`}>
      {/* ponytail: sr-only so the heading level is correct without altering the approved layout */}
      <h2 className="sr-only">Wellness reflection</h2>
      <div className="relative h-[120px] w-[120px]">
        <svg viewBox="0 0 100 100" className="h-[120px] w-[120px] -rotate-90" aria-hidden="true">
          <circle cx="50" cy="50" r="42" fill="none" stroke="#D8DEEA" strokeWidth="9" />
          <circle cx="50" cy="50" r="42" fill="none" stroke="#2E3A59" strokeWidth="9" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - score / 100)} />
        </svg>
        <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center font-display text-[34px] text-[#1B2430]">{score}</span>
        <span className="sr-only">{score} out of 100</span>
      </div>
      <h3 className="mt-3.5 font-display text-[19px] text-[#1B2430]">
        {score >= 70 ? 'A steadier stretch' : score >= 45 ? 'A mixed stretch' : 'A heavier stretch'}
      </h3>
      <p className="mt-0.5 text-[13px] text-[#5A6472]">
        {change && <span className={change.tone}><span aria-hidden="true">{change.arrow} </span>{change.text} · </span>}
        a reflection, not a diagnosis
      </p>
    </div>
  );
}
