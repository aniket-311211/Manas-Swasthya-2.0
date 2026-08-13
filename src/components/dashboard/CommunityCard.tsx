import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import type { CommunityEvent } from '@/types/api';
import { GLASS, EYEBROW, FOCUS } from '@/components/shell/theme';

const cardBase = `${GLASS} p-6`;
const eyebrow = EYEBROW;
const focusRing = FOCUS;
const shell = `${cardBase} relative flex-1`;

// ponytail: `duration` is free text ("2 hours", "90 min"); assume 60 min when it
// does not parse. Store minutes on the event if that guess ever matters.
function endsAt(event: CommunityEvent): number {
  const match = /(\d+(?:\.\d+)?)\s*(h|m)/i.exec(event.duration ?? '');
  const minutes = match ? Number(match[1]) * (match[2].toLowerCase() === 'h' ? 60 : 1) : 60;
  return +new Date(event.date) + minutes * 60000;
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function CommunityCard({ clerkId }: { clerkId: string }) {
  const queryClient = useQueryClient();
  const { data: events = [], isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['events', clerkId],
    queryFn: () => api.getEvents(clerkId),
    enabled: !!clerkId,
  });

  const register = useMutation({
    mutationFn: (eventId: string) => api.registerEvent(clerkId, eventId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events', clerkId] }),
  });

  if (isLoading) {
    return (
      <div className={shell}>
        <h2 className={eyebrow}>Community</h2>
        <div aria-hidden="true" className="mt-2.5 animate-pulse space-y-2.5">
          <div className="h-[18px] w-2/3 rounded bg-[#EEF0F5]" />
          <div className="h-3.5 w-1/2 rounded bg-[#EEF0F5]" />
          <div className="h-4 w-24 rounded bg-[#EEF0F5]" />
        </div>
        <span className="sr-only">Loading community events…</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={shell}>
        <h2 className={eyebrow}>Community</h2>
        <p role="status" className="mt-2.5 text-[13px] leading-[1.5] text-[#5A6472]">
          We could not load community events right now.
        </p>
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          className={`mt-3 rounded-full border border-[#E4E7EE] px-3 py-1.5 text-[13px] font-semibold text-[#2E3A59] disabled:opacity-60 ${focusRing}`}
        >
          {isFetching ? 'Retrying…' : 'Retry'}
        </button>
      </div>
    );
  }

  const now = Date.now();
  const ahead = events
    .filter((e) => endsAt(e) > now)
    .sort((a, b) => +new Date(a.date) - +new Date(b.date));

  // What you have joined outranks what you could join. A student who took a
  // place should see that place here, not be sold a different session — this
  // card is the only reminder they get before the thing starts.
  const mine = ahead.filter((e) => e.isRegistered);
  const event = mine[0] ?? ahead[0];

  if (!event) {
    return (
      <div className={shell}>
        <h2 className={eyebrow}>Community</h2>
        <p className="mb-3 mt-2.5 text-[13px] leading-[1.5] text-[#5A6472]">
          No upcoming events right now.
        </p>
        <Link
          to="/community?tab=events"
          className={`rounded text-[13px] font-semibold text-[#2E3A59] ${focusRing}`}
        >
          Browse activities →
        </Link>
      </div>
    );
  }

  const isLive = +new Date(event.date) <= now;
  const joined = event.isRegistered;
  const alsoJoined = mine.length - 1;

  return (
    <div className={shell}>
      {isLive && (
        <span className="absolute right-5 top-5 inline-flex items-center gap-1.5 font-mono text-[11px] text-[#C0533F]">
          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[#C0533F] motion-safe:animate-pulse" /> LIVE NOW
        </span>
      )}
      <h2 className={eyebrow}>{joined ? 'You are going' : 'Community'}</h2>
      <h3 className="mb-1.5 mt-2.5 pr-20 font-display text-[18px] text-[#1B2430]">{event.title}</h3>
      <p className="mb-1 text-[13px] leading-[1.5] text-[#5A6472]">
        {event.host || event.category} · {event.participantCount} going
      </p>
      <p className="mb-3 font-mono text-[11px] text-[#8A93A3]">
        {isLive ? `Started ${formatWhen(event.date)}` : formatWhen(event.date)}
      </p>

      {joined ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {/* The tick is decoration; the sentence carries it. */}
          <p className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#2E3A59]">
            <Check aria-hidden="true" className="h-4 w-4" />
            {isLive ? 'Happening now' : 'Your place is held'}
          </p>
          <Link
            to="/community?tab=events"
            className={`rounded text-[13px] font-semibold text-[#2E3A59] ${focusRing}`}
          >
            {alsoJoined > 0
              ? `${alsoJoined} more you joined →`
              : 'Manage →'}
          </Link>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => register.mutate(event.id)}
          disabled={register.isPending}
          className={`rounded text-[13px] font-semibold text-[#2E3A59] disabled:opacity-60 ${focusRing}`}
        >
          {register.isPending ? 'Registering…' : 'Register →'}
        </button>
      )}

      <p role="status" aria-live="polite" className="mt-1 text-[12px] text-[#C0533F] empty:mt-0">
        {register.isError ? 'Registration failed. Please try again.' : ''}
      </p>
    </div>
  );
}
