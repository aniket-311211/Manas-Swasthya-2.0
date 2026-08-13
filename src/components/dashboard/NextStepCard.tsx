import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { pickRecommendation } from './dashboardRecommendation';
import { INK_CARD } from '@/components/shell/theme';

/**
 * Full 1B restyle of the "One next step" card — the dark evergreen block from
 * the mockup. Same pickRecommendation logic and routing as the original.
 */
const shell = `flex h-full flex-col justify-center ${INK_CARD} p-6 text-[#E8ECF3]`;
const cta =
  'mt-3.5 inline-flex items-center gap-2 self-start rounded-full bg-[#E8ECF3] px-4 py-2.5 text-[13px] font-semibold text-[#1B2430] hover:bg-[#D8DEEA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1B2430]';

export default function NextStepCard({ clerkId }: { clerkId: string }) {
  const enabled = !!clerkId;
  const moods = useQuery({ queryKey: ['mood', clerkId], queryFn: () => api.getMoodHistory(clerkId), enabled });
  const assessments = useQuery({ queryKey: ['assessments', clerkId], queryFn: () => api.getAssessments(clerkId), enabled });
  const journals = useQuery({ queryKey: ['journal', clerkId], queryFn: () => api.getJournal(clerkId), enabled });

  if (moods.isLoading || assessments.isLoading || journals.isLoading) {
    return <div className={shell}><div className="h-24 animate-pulse rounded-xl bg-white/10" /></div>;
  }

  // A failed query would read as "you have not checked in today" — say what happened instead of guessing.
  if (moods.isError || assessments.isError || journals.isError) {
    return (
      <div className={shell}>
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#98A3B8]">One next step</p>
        <h2 className="mt-1.5 font-display text-[20px]">We could not load your recent activity</h2>
        <p role="status" className="mt-1 text-[13px] leading-relaxed text-[#AEB8CA]">
          Suggesting a next step needs your check-ins, so we are not guessing one right now.
        </p>
        <button
          type="button"
          onClick={() => { moods.refetch(); assessments.refetch(); journals.refetch(); }}
          className={cta}
        >
          Try again
        </button>
      </div>
    );
  }

  const step = pickRecommendation({
    moods: moods.data ?? [],
    assessments: assessments.data ?? [],
    journals: journals.data ?? [],
  });

  return (
    <div className={shell}>
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#98A3B8]">One next step</p>
      <h2 className="mt-1.5 font-display text-[20px]">{step.title}</h2>
      <p className="mt-1 text-[13px] leading-relaxed text-[#AEB8CA]">{step.reason}</p>
      {step.href.startsWith('#') ? (
        <a href={step.href} className={cta}>{step.ctaLabel}<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></a>
      ) : (
        <Link to={step.href} className={cta}>{step.ctaLabel}<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>
      )}
    </div>
  );
}
