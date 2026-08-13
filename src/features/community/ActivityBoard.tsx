import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'motion/react';
import { AlertCircle, Check, Clock, MapPin, RefreshCcw, Users } from 'lucide-react';
import { api } from '@/lib/api';
import type { CommunityEvent } from '@/types/api';
import { formatWhen } from '@/features/booking/booking';
import { BAD, BTN_QUIET, BTN_SOLID, CARD, INK, MUTED, initials, monogramTile } from './theme';

/**
 * The activities students can join.
 *
 * THE "LIVE" BADGE IS EARNED, NOT DECORATIVE. It appears only while the clock is
 * inside the event's own window — its start time plus the duration it publishes.
 * When the duration is a sentence we cannot parse there is no badge at all,
 * because a countdown nobody can stand behind is just manufactured urgency, and
 * this is a mental-health product.
 *
 * Registering is reversible in the same place it is made. A student who signs up
 * for a room full of strangers and thinks better of it should not have to email
 * anyone.
 */

type Phase = 'upcoming' | 'live' | 'past';

/** Minutes from "2 hours" / "90 min". null when the string does not say. */
function durationMinutes(text: string | null | undefined): number | null {
  const m = /(\d+(?:\.\d+)?)\s*(h|m)/i.exec(text ?? '');
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n) || n <= 0) return null;
  return m[2].toLowerCase() === 'h' ? n * 60 : n;
}

function phaseOf(e: CommunityEvent, now: Date): Phase {
  const start = new Date(e.date).getTime();
  // An unreadable date is a data problem, not an event in the past — it still
  // takes registrations, it just cannot claim a time.
  if (Number.isNaN(start)) return 'upcoming';
  if (now.getTime() < start) return 'upcoming';
  const mins = durationMinutes(e.duration);
  if (mins === null) return 'past';
  return now.getTime() < start + mins * 60_000 ? 'live' : 'past';
}

const RANK: Record<Phase, number> = { live: 0, upcoming: 1, past: 2 };

/** Red reads as "on air" here, and the word says it too — never colour alone. */
const LIVE_PILL =
  'inline-flex items-center gap-1.5 rounded-full bg-[#9B1C1C] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-white';

function Skeleton() {
  return (
    <li className={`${CARD} p-5`} aria-hidden="true">
      <span className="block h-3 w-20 animate-pulse rounded bg-[#2B0B2E]/10" />
      <span className="mt-3 block h-5 w-2/3 animate-pulse rounded bg-[#2B0B2E]/10" />
      <span className="mt-3 block h-3 w-full animate-pulse rounded bg-[#2B0B2E]/10" />
      <span className="mt-2 block h-3 w-4/5 animate-pulse rounded bg-[#2B0B2E]/10" />
      <span className="mt-5 block h-9 w-full animate-pulse rounded-full bg-[#2B0B2E]/10" />
    </li>
  );
}

export default function ActivityBoard({ clerkId }: { clerkId: string }) {
  const reduceMotion = useReducedMotion();
  const qc = useQueryClient();

  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['events', clerkId],
    queryFn: () => api.getEvents(clerkId || undefined),
  });

  const booking = useMutation({
    mutationFn: ({ id, registered }: { id: string; registered: boolean }) =>
      registered ? api.unregisterEvent(clerkId, id) : api.registerEvent(clerkId, id),
    // The count and `isRegistered` both come from the server; refetching is the
    // only way to keep them honest when two people take the last seat at once.
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events', clerkId] }),
  });

  // One clock for the whole render, so two cards can never disagree about now.
  const now = new Date();
  const events = [...(data ?? [])].sort(
    (a, b) =>
      RANK[phaseOf(a, now)] - RANK[phaseOf(b, now)] ||
      new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  return (
    <section aria-labelledby="activities-heading" className="space-y-4">
      <h2 id="activities-heading" className="sr-only">
        Activities you can join
      </h2>

      {isError && (
        <div className={`${CARD} p-6`} role="alert">
          <p className={`flex items-start gap-2 text-[15px] font-semibold ${BAD}`}>
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            We could not load the activities.
          </p>
          <p className={`mt-1.5 text-[14px] ${MUTED}`}>
            {error instanceof Error
              ? error.message
              : 'Something went wrong on the way to the server.'}
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className={`${BTN_QUIET} mt-4`}
            disabled={isFetching}
          >
            <RefreshCcw className="h-4 w-4" aria-hidden="true" /> {isFetching ? 'Trying…' : 'Try again'}
          </button>
        </div>
      )}

      {booking.isError && (
        <p className={`${CARD} flex items-start gap-2 p-4 text-[14px] font-medium ${BAD}`} role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {booking.error instanceof Error
            ? booking.error.message
            : 'That did not go through. Try once more.'}
        </p>
      )}

      {!isError && !isPending && events.length === 0 && (
        <div className={`${CARD} p-6`}>
          <p className={`text-[15px] font-semibold ${INK}`}>Nothing is scheduled yet.</p>
          <p className={`mt-1.5 text-[14px] ${MUTED}`}>
            Sessions are put up by the wellbeing team and by student hosts, usually a week or two
            ahead. Nothing is missing from your account — check back soon.
          </p>
        </div>
      )}

      {!isError && (isPending || events.length > 0) && (
        <ul className="grid gap-4 sm:grid-cols-2" aria-busy={isPending}>
          {isPending
            ? [0, 1, 2, 3].map((i) => <Skeleton key={i} />)
            : events.map((e, i) => {
                const phase = phaseOf(e, now);
                const seatsLeft = Math.max(0, e.maxParticipants - e.participantCount);
                const full = seatsLeft === 0 && !e.isRegistered;
                const busy = booking.isPending && booking.variables?.id === e.id;
                const closed = phase === 'past' || full;
                const [from, to] = monogramTile(e.host ?? '');

                return (
                  <motion.li
                    key={e.id}
                    initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, delay: reduceMotion ? 0 : Math.min(i, 6) * 0.03 }}
                    className={`${CARD} flex flex-col p-5 ${phase === 'past' ? 'opacity-80' : ''}`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={`font-mono text-[10px] uppercase tracking-[0.16em] ${MUTED}`}>
                        {e.category}
                      </p>
                      {phase === 'live' && (
                        <span className={LIVE_PILL}>
                          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-white" />
                          Live now
                        </span>
                      )}
                      {phase === 'past' && (
                        <span className={`text-[11px] font-semibold uppercase tracking-[0.08em] ${MUTED}`}>
                          Finished
                        </span>
                      )}
                    </div>

                    <h3 className={`mt-1.5 font-display text-[19px] leading-tight ${INK}`}>
                      {e.title}
                    </h3>
                    {e.description && (
                      <p className={`mt-1.5 line-clamp-3 text-[14px] leading-relaxed ${MUTED}`}>
                        {e.description}
                      </p>
                    )}

                    {/* Initials, never a stock emoji — a placeholder face for a
                        real person reads as a stand-in for someone who did not
                        show up. */}
                    <p className="mt-3 flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-display text-[11px] tracking-wide text-white"
                      >
                        {initials(e.host ?? '')}
                      </span>
                      <span className={`text-[13px] ${MUTED}`}>Hosted by {e.host}</span>
                    </p>

                    <dl className={`mt-3 space-y-1 text-[13px] ${MUTED}`}>
                      <div className="flex items-center gap-1.5">
                        <dt className="sr-only">When</dt>
                        <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <dd>
                          <time dateTime={e.date}>{formatWhen(e.date)}</time>
                          {e.duration && ` · ${e.duration}`}
                        </dd>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <dt className="sr-only">Where</dt>
                        <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <dd>{e.location}</dd>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <dt className="sr-only">Going</dt>
                        <Users className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <dd>
                          {e.participantCount} of {e.maxParticipants} going
                          {phase !== 'past' &&
                            (full ? ' · no places left' : ` · ${seatsLeft} place${seatsLeft === 1 ? '' : 's'} left`)}
                        </dd>
                      </div>
                    </dl>

                    {/* The tick is decoration; the sentence carries it. */}
                    {e.isRegistered && (
                      <p className={`mt-3 flex items-center gap-1.5 text-[13px] font-semibold ${INK}`}>
                        <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        You have a place
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-2 pt-1">
                      {!clerkId ? (
                        <span className={`text-[13px] ${MUTED}`}>Sign in to take a place.</span>
                      ) : e.isRegistered ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => booking.mutate({ id: e.id, registered: true })}
                          className={BTN_QUIET}
                        >
                          {busy ? 'Saving…' : 'Cancel my place'}
                        </button>
                      ) : closed ? (
                        <span className={`text-[13px] ${MUTED}`}>
                          {phase === 'past' ? 'This one has finished.' : 'This one is full.'}
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => booking.mutate({ id: e.id, registered: false })}
                          className={`${BTN_SOLID} flex-1`}
                        >
                          {busy ? 'Saving…' : 'Take a place'}
                        </button>
                      )}
                    </div>
                  </motion.li>
                );
              })}
        </ul>
      )}
    </section>
  );
}
