import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { api } from '@/lib/api';
import type { Booking } from '@/types/api';
import { BAD, BTN_QUIET, CARD, GOOD, INK, MUTED, ON_SILK, ON_SILK_PILL, formatFee, formatWhen, groupBookings } from './booking';

/**
 * What you have booked. Cancelling calls DELETE, which the server treats as a
 * status change rather than a deletion — the row stays, marked cancelled, so it
 * keeps showing up here under "Earlier" instead of vanishing.
 */

const MODE_LABEL: Record<Booking['mode'], string> = {
  video: 'Video call',
  audio: 'Voice call',
  chat: 'Text chat',
  in_person: 'In person',
};

const STATUS_PILL: Record<Booking['status'], { label: string; className: string }> = {
  scheduled: { label: 'Scheduled', className: 'border-[#1B2430]/25 text-[#1B2430]' },
  completed: { label: 'Completed', className: 'border-[#146356]/40 text-[#146356]' },
  cancelled: { label: 'Cancelled', className: 'border-[#9B1C1C]/40 text-[#9B1C1C]' },
};

function Row({
  booking,
  onCancel,
  cancelling,
}: {
  booking: Booking;
  onCancel?: (b: Booking) => void;
  cancelling: boolean;
}) {
  const pill = STATUS_PILL[booking.status] ?? STATUS_PILL.scheduled;

  return (
    <li className="rounded-[16px] border border-[#1B2430]/12 bg-white/55 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`font-display text-[18px] leading-tight ${INK}`}>{booking.mentorName}</p>
          <p className={`mt-1 text-[14px] ${MUTED}`}>
            {formatWhen(booking.scheduledAt)} · {booking.durationMin} min
          </p>
          <p className={`mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] ${MUTED}`}>
            {MODE_LABEL[booking.mode] ?? booking.mode}
            <span aria-hidden="true">·</span>
            <span className={booking.feeWaived ? `font-semibold ${GOOD}` : ''}>
              {booking.feeWaived
                ? `Fee waived — ${booking.waiverReason === 'student' ? 'student registration' : 'coupon applied'}`
                : formatFee(booking.feePaise)}
            </span>
          </p>
          {booking.note && <p className={`mt-2 text-[13px] italic ${MUTED}`}>“{booking.note}”</p>}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <span
            className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] ${pill.className}`}
          >
            {pill.label}
          </span>
          {onCancel && (
            <button
              type="button"
              disabled={cancelling}
              onClick={() => onCancel(booking)}
              className={`${BTN_QUIET} !px-3.5 !py-1.5 text-[13px]`}
            >
              {cancelling ? 'Cancelling…' : 'Cancel'}
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

export default function MyBookings({ clerkId }: { clerkId: string }) {
  const queryClient = useQueryClient();
  const [now] = useState(() => new Date());

  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['bookings', clerkId],
    queryFn: () => api.getBookings(clerkId),
    enabled: !!clerkId,
  });

  const cancel = useMutation({
    mutationFn: (id: string) => api.cancelBooking(id, clerkId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings', clerkId] }),
  });

  const { upcoming, past, cancelled } = useMemo(() => groupBookings(data ?? [], now), [data, now]);
  const earlier = useMemo(
    () =>
      [...past, ...cancelled].sort(
        (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime(),
      ),
    [past, cancelled],
  );

  const onCancel = (b: Booking) => {
    // Native confirm: cancelling is not undoable from this screen, and a custom
    // dialog would be a modal to build and trap focus in for one yes/no.
    if (window.confirm(`Cancel your session with ${b.mentorName} on ${formatWhen(b.scheduledAt)}?`)) {
      cancel.mutate(b.id);
    }
  };

  return (
    <section aria-labelledby="mine-heading" className={`${CARD} p-6`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="mine-heading" className={`${ON_SILK_PILL} font-display text-[22px] leading-tight ${ON_SILK}`}>
          Your sessions
        </h2>
        <button type="button" onClick={() => void refetch()} disabled={isFetching} className={`${BTN_QUIET} !py-2 text-[13px]`}>
          <RefreshCcw className="h-3.5 w-3.5" aria-hidden="true" /> {isFetching ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {isPending && <p className={`mt-4 text-[14px] ${MUTED}`}>Looking up your sessions…</p>}

      {isError && (
        <p role="alert" className={`mt-4 flex items-start gap-2 text-[14px] font-medium ${BAD}`}>
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {error instanceof Error ? error.message : 'We could not load your sessions.'}
        </p>
      )}

      {cancel.isError && (
        <p role="alert" className={`mt-4 flex items-start gap-2 text-[14px] font-medium ${BAD}`}>
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {cancel.error instanceof Error ? cancel.error.message : 'That cancellation did not go through.'}
        </p>
      )}

      {!isPending && !isError && upcoming.length === 0 && earlier.length === 0 && (
        <p className={`mt-4 text-[14px] ${MUTED}`}>
          Nothing booked yet. Pick someone from the deck above and choose a time.
        </p>
      )}

      {upcoming.length > 0 && (
        <>
          <h3 className={`mt-5 text-[13px] font-semibold uppercase tracking-[0.12em] ${MUTED}`}>Coming up</h3>
          <ul className="mt-2.5 space-y-2.5">
            {upcoming.map((b) => (
              <Row
                key={b.id}
                booking={b}
                onCancel={onCancel}
                cancelling={cancel.isPending && cancel.variables === b.id}
              />
            ))}
          </ul>
        </>
      )}

      {earlier.length > 0 && (
        <>
          <h3 className={`mt-6 text-[13px] font-semibold uppercase tracking-[0.12em] ${MUTED}`}>Earlier</h3>
          <ul className="mt-2.5 space-y-2.5">
            {earlier.map((b) => (
              <Row key={b.id} booking={b} cancelling={false} />
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
