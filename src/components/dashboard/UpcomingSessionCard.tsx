import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CalendarCheck, RefreshCw, Video } from 'lucide-react';
import { api } from '@/lib/api';
import { GLASS } from '@/components/shell/theme';
import { formatFee, groupBookings } from '@/features/booking/booking';

const EYEBROW = 'font-mono text-[11px] uppercase tracking-[0.14em] text-[#8A93A3]';
const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E3A59]';

const MODE_LABEL: Record<string, string> = {
  video: 'Video call',
  audio: 'Voice call',
  chat: 'Chat',
  in_person: 'In person',
};

/**
 * The next confirmed consultation. Shares the `['bookings', clerkId]` key with
 * the booking page, so confirming a session there refreshes this without a
 * refetch.
 */
export default function UpcomingSessionCard({ clerkId }: { clerkId: string }) {
  const { data: bookings = [], isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['bookings', clerkId],
    queryFn: () => api.getBookings(clerkId),
    enabled: !!clerkId,
  });

  const next = groupBookings(bookings).upcoming[0];

  if (isLoading) {
    return (
      <div className={`${GLASS} h-full p-6`}>
        <div className="h-24 animate-pulse rounded-xl bg-white/50" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className={`${GLASS} flex h-full flex-col p-6`}>
        <h2 className={EYEBROW}>Next session</h2>
        <p role="status" className="mt-2 text-sm text-[#5A6472]">
          We could not load your bookings right now.
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className={`mt-4 inline-flex items-center gap-2 self-start rounded-full border border-[#E4E7EE] px-3 py-1.5 text-sm text-[#1B2430] ${FOCUS}`}
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          {isFetching ? 'Retrying…' : 'Retry'}
        </button>
      </div>
    );
  }

  if (!next) {
    return (
      <div className={`${GLASS} flex h-full flex-col p-6`}>
        <h2 className={EYEBROW}>Next session</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-[#5A6472]">
          Nothing booked yet. Talking to someone is free if you are a registered student.
        </p>
        <Link to="/booking" className={`mt-auto pt-3 text-[13px] font-semibold text-[#2E3A59] ${FOCUS}`}>
          Find a consultant →
        </Link>
      </div>
    );
  }

  const when = new Date(next.scheduledAt);

  return (
    <div className={`${GLASS} flex h-full flex-col p-6`}>
      <h2 className={EYEBROW}>Next session</h2>

      <p className="mt-2 flex items-center gap-2 font-display text-[18px] text-[#1B2430]">
        <CalendarCheck className="h-4 w-4 shrink-0 text-[#2E3A59]" aria-hidden="true" />
        {next.mentorName}
      </p>

      <p className="mt-1 text-[13px] text-[#5A6472]">
        {when.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        {' · '}
        {when.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
      </p>

      <div className="mt-3 flex flex-wrap gap-2 font-mono text-[11px] text-[#3A4457]">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#EEF0F5] px-2.5 py-1.5">
          <Video className="h-3 w-3" aria-hidden="true" />
          {MODE_LABEL[next.mode] ?? next.mode}
        </span>
        <span className="rounded-lg bg-[#EEF0F5] px-2.5 py-1.5">{next.durationMin} min</span>
        <span className="rounded-lg bg-[#EEF0F5] px-2.5 py-1.5">
          {/* The server decided this, not the browser. */}
          {next.feeWaived ? 'Fee waived' : formatFee(next.feePaise)}
        </span>
      </div>

      <Link to="/booking" className={`mt-auto pt-3 text-[13px] font-semibold text-[#2E3A59] ${FOCUS}`}>
        Manage booking →
      </Link>
    </div>
  );
}
