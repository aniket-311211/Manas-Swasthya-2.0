import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'motion/react';
import { AlertCircle, ArrowRight, Check, RefreshCcw, Users } from 'lucide-react';
import { api } from '@/lib/api';
import type { ChatRoom } from '@/types/api';
import { BAD, BTN_QUIET, BTN_SOLID, CARD, INK, MUTED, ON_SILK, ON_SILK_MUTED } from './theme';

/**
 * The peer groups.
 *
 * LEAVING IS AS LOUD AS JOINING. The Leave button sits in the same row, at the
 * same size, on the face of the card — not behind a menu, not behind a
 * confirmation maze. This is a mental-health space; somebody who wants out of a
 * room should never have to hunt for the door.
 */

interface Props {
  clerkId: string;
  openId: string | null;
  onOpen: (group: ChatRoom) => void;
}

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

export default function GroupList({ clerkId, openId, onOpen }: Props) {
  const reduceMotion = useReducedMotion();
  const qc = useQueryClient();

  const { data: groups, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['community-groups', clerkId],
    queryFn: () => api.getCommunityGroups(clerkId || undefined),
  });

  const membership = useMutation({
    mutationFn: ({ groupId, action }: { groupId: string; action: 'join' | 'leave' }) =>
      api.setGroupMembership(clerkId, groupId, action),
    // Only this list is invalidated — the open room's messages are untouched by
    // a membership change, and refetching them would flicker the thread.
    onSuccess: () => qc.invalidateQueries({ queryKey: ['community-groups', clerkId] }),
  });

  const busyId = membership.isPending ? membership.variables?.groupId : undefined;

  return (
    <section aria-labelledby="groups-heading" className="space-y-4">
      <div>
        <h2 id="groups-heading" className={`font-display text-[24px] leading-tight ${ON_SILK}`}>
          Peer circles
        </h2>
        <p className={`mt-1 max-w-2xl text-[14px] ${ON_SILK_MUTED}`}>
          Small student-run rooms. Read any of them without joining; join when you want to post,
          and leave again whenever you like — the button is right there on the card.
        </p>
      </div>

      {isError && (
        <div className={`${CARD} p-6`} role="alert">
          <p className={`flex items-start gap-2 text-[15px] font-semibold ${BAD}`}>
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            We could not load the circles.
          </p>
          <p className={`mt-1.5 text-[14px] ${MUTED}`}>
            {error instanceof Error ? error.message : 'Something went wrong on the way to the server.'}
          </p>
          <button type="button" onClick={() => void refetch()} className={`${BTN_QUIET} mt-4`} disabled={isFetching}>
            <RefreshCcw className="h-4 w-4" aria-hidden="true" /> {isFetching ? 'Trying…' : 'Try again'}
          </button>
        </div>
      )}

      {membership.isError && (
        <p className={`${CARD} flex items-start gap-2 p-4 text-[14px] font-medium ${BAD}`} role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {membership.error instanceof Error
            ? membership.error.message
            : 'That did not go through. Try once more.'}
        </p>
      )}

      {!isError && !isPending && (groups?.length ?? 0) === 0 && (
        <div className={`${CARD} p-6`}>
          <p className={`text-[15px] font-semibold ${INK}`}>There are no circles open yet.</p>
          <p className={`mt-1.5 text-[14px] ${MUTED}`}>
            Rooms are opened by the wellbeing team as facilitators become available. Nothing is
            missing from your account — check back in a few days.
          </p>
        </div>
      )}

      {!isError && (isPending || (groups?.length ?? 0) > 0) && (
        <ul className="grid gap-4 sm:grid-cols-2" aria-busy={isPending}>
          {isPending
            ? [0, 1, 2, 3].map((i) => <Skeleton key={i} />)
            : (groups ?? []).map((g, i) => {
                const joined = g.joined === true;
                const open = g.id === openId;
                const busy = busyId === g.id;
                const name = g.name ?? 'Peer circle';

                return (
                  <motion.li
                    key={g.id}
                    initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, delay: reduceMotion ? 0 : Math.min(i, 6) * 0.03 }}
                    className={`${CARD} flex flex-col p-5 ${open ? 'ring-2 ring-[#2B0B2E]' : ''}`}
                  >
                    {g.topic && (
                      <p className={`font-mono text-[10px] uppercase tracking-[0.16em] ${MUTED}`}>
                        {g.topic}
                      </p>
                    )}
                    <h3 className={`mt-1.5 font-display text-[19px] leading-tight ${INK}`}>{name}</h3>
                    {g.description && (
                      <p className={`mt-1.5 line-clamp-3 text-[14px] leading-relaxed ${MUTED}`}>
                        {g.description}
                      </p>
                    )}

                    {g.tags.length > 0 && (
                      <ul className="mt-3 flex flex-wrap gap-1.5">
                        {g.tags.map((t) => (
                          <li
                            key={t}
                            className={`rounded-full border border-[#2B0B2E]/20 bg-white/60 px-2.5 py-0.5 text-[11px] ${INK}`}
                          >
                            {t}
                          </li>
                        ))}
                      </ul>
                    )}

                    <p className={`mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] ${MUTED}`}>
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" aria-hidden="true" />
                        {g.memberCount ?? 0} member{g.memberCount === 1 ? '' : 's'}
                      </span>
                      {/* The tick is decoration; the words carry it. */}
                      {joined && (
                        <span className={`inline-flex items-center gap-1.5 font-semibold ${INK}`}>
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          You are a member
                        </span>
                      )}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => onOpen(g)}
                        className={`${BTN_SOLID} flex-1`}
                        aria-current={open ? 'true' : undefined}
                      >
                        {open ? 'Reading now' : 'Open'}
                        {!open && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
                      </button>

                      {clerkId ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            membership.mutate({ groupId: g.id, action: joined ? 'leave' : 'join' })
                          }
                          className={BTN_QUIET}
                          aria-label={joined ? `Leave ${name}` : `Join ${name}`}
                        >
                          {busy ? 'Saving…' : joined ? 'Leave' : 'Join'}
                        </button>
                      ) : (
                        <span className={`self-center text-[13px] ${MUTED}`}>Sign in to join</span>
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
