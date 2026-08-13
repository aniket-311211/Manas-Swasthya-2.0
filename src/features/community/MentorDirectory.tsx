import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'motion/react';
import { AlertCircle, MessageSquare, RefreshCcw, ShieldCheck, Star } from 'lucide-react';
import { api } from '@/lib/api';
import type { Mentor } from '@/types/api';
import {
  BAD,
  BTN_SOLID,
  BTN_QUIET,
  CARD,
  INK,
  MENTOR_INK,
  MENTOR_PILL,
  MENTOR_TILE,
  MUTED,
  ON_SILK,
  ON_SILK_MUTED,
  initials,
} from './theme';

/**
 * Everyone a student can write to.
 *
 * "MESSAGE" NEVER CREATES A DUPLICATE. `api/mentors/threads.ts` returns the
 * open thread for a pair if there already is one (`{ id, existing: true }`) and
 * only creates a room otherwise, so pressing this on someone you already talk to
 * opens that conversation instead of failing or forking the history. The button
 * says which of the two will happen before it is pressed.
 *
 * No photographs and no emoji stand-ins for people: an initials monogram, in a
 * colour that stays with that name.
 */

/** Never colour alone — the word is the signal and the dot is decoration. */
const PRESENCE: Record<Mentor['status'], { label: string; dot: string }> = {
  online: { label: 'Online now', dot: 'bg-[#0F5132]' },
  away: { label: 'Away', dot: 'bg-[#8A5A00]' },
  offline: { label: 'Offline', dot: 'bg-[#6A3F70]/50' },
};

interface Props {
  clerkId: string;
  onOpen: (roomId: string) => void;
}

export default function MentorDirectory({ clerkId, onOpen }: Props) {
  const reduceMotion = useReducedMotion();
  const qc = useQueryClient();

  const mentors = useQuery({ queryKey: ['mentors'], queryFn: () => api.getMentors() });

  // Same key and function ThreadList uses, so this is that cache entry — no
  // second request, and the labels below stay honest the moment one changes.
  const { data: threads } = useQuery({
    queryKey: ['threads', clerkId],
    queryFn: () => api.getThreads(clerkId),
    enabled: Boolean(clerkId),
  });
  const talkingTo = new Set((threads ?? []).map((t) => t.mentor?.id).filter(Boolean));

  const start = useMutation({
    mutationFn: (mentorId: string) => api.startThread(clerkId, mentorId),
    onSuccess: (res) => {
      void qc.invalidateQueries({ queryKey: ['threads', clerkId] });
      onOpen(res.id);
    },
  });

  const list = mentors.data ?? [];

  return (
    <section aria-labelledby="mentors-heading" className="space-y-4">
      <div>
        <h2 id="mentors-heading" className={`font-display text-[24px] leading-tight ${ON_SILK}`}>
          All mentors
        </h2>
        <p className={`mt-1 max-w-2xl text-[14px] ${ON_SILK_MUTED}`}>
          Trained peer mentors, not clinicians on call. You already have one assigned to you — you
          can write to any of the others as well, and each conversation stays private to the two of
          you.
        </p>
      </div>

      {mentors.isError && (
        <div className={`${CARD} p-6`} role="alert">
          <p className={`flex items-start gap-2 text-[15px] font-semibold ${BAD}`}>
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            We could not load the mentors.
          </p>
          <p className={`mt-1.5 text-[14px] ${MUTED}`}>
            {mentors.error instanceof Error
              ? mentors.error.message
              : 'Something went wrong on the way to the server.'}
          </p>
          <button
            type="button"
            onClick={() => void mentors.refetch()}
            className={`${BTN_QUIET} mt-4`}
            disabled={mentors.isFetching}
          >
            <RefreshCcw className="h-4 w-4" aria-hidden="true" />
            {mentors.isFetching ? 'Trying…' : 'Try again'}
          </button>
        </div>
      )}

      {start.isError && (
        <p className={`${CARD} flex items-start gap-2 p-4 text-[14px] font-medium ${BAD}`} role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {start.error instanceof Error
            ? start.error.message
            : 'That conversation did not open. Try once more.'}
        </p>
      )}

      {!mentors.isError && !mentors.isPending && list.length === 0 && (
        <div className={`${CARD} p-6`}>
          <p className={`text-[15px] font-semibold ${INK}`}>No mentors are listed yet.</p>
          <p className={`mt-1.5 text-[14px] ${MUTED}`}>
            Nothing is missing from your account. The wellbeing team adds mentors as they finish
            training — the helplines in the top bar are open the whole time.
          </p>
        </div>
      )}

      {!mentors.isError && (mentors.isPending || list.length > 0) && (
        <ul className="grid gap-4 sm:grid-cols-2" aria-busy={mentors.isPending}>
          {mentors.isPending
            ? [0, 1, 2, 3].map((i) => (
                <li key={i} className={`${CARD} p-5`} aria-hidden="true">
                  <span className="block h-5 w-2/3 animate-pulse rounded bg-[#2B0B2E]/10" />
                  <span className="mt-3 block h-3 w-full animate-pulse rounded bg-[#2B0B2E]/10" />
                  <span className="mt-5 block h-9 w-40 animate-pulse rounded-full bg-[#2B0B2E]/10" />
                </li>
              ))
            : list.map((m, i) => {
                const known = talkingTo.has(m.id);
                const busy = start.isPending && start.variables === m.id;
                const presence = PRESENCE[m.status] ?? PRESENCE.offline;

                return (
                  <motion.li
                    key={m.id}
                    initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, delay: reduceMotion ? 0 : Math.min(i, 6) * 0.03 }}
                    className={`${CARD} flex flex-col p-5`}
                  >
                    <div className="flex gap-3">
                      <span
                        aria-hidden="true"
                        style={{
                          backgroundImage: `linear-gradient(135deg, ${MENTOR_TILE[0]}, ${MENTOR_TILE[1]})`,
                        }}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-display text-[15px] tracking-wide text-white"
                      >
                        {initials(m.name)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className={`font-display text-[19px] leading-tight ${INK}`}>{m.name}</h3>
                        <p className="mt-1 flex flex-wrap items-center gap-2">
                          <span className={MENTOR_PILL}>
                            <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                            Mentor
                          </span>
                          {m.badge && (
                            <span className={`text-[12px] font-semibold ${MENTOR_INK}`}>{m.badge}</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {m.specialization && (
                      <p className={`mt-3 text-[14px] font-medium ${INK}`}>{m.specialization}</p>
                    )}
                    {m.bio && (
                      <p className={`mt-1.5 line-clamp-3 text-[14px] leading-relaxed ${MUTED}`}>{m.bio}</p>
                    )}

                    <p className={`mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] ${MUTED}`}>
                      <span className="inline-flex items-center gap-1.5">
                        <span aria-hidden="true" className={`h-2 w-2 rounded-full ${presence.dot}`} />
                        {presence.label}
                      </span>
                      {m.rating > 0 && (
                        <span className="inline-flex items-center gap-1.5">
                          <Star className="h-3.5 w-3.5" aria-hidden="true" />
                          {m.rating.toFixed(1)} out of 5
                        </span>
                      )}
                      {m.totalSessions > 0 && (
                        <span>
                          {m.totalSessions} session{m.totalSessions === 1 ? '' : 's'}
                        </span>
                      )}
                    </p>

                    <div className="mt-auto pt-4">
                      {clerkId ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => start.mutate(m.id)}
                          className={`${BTN_SOLID} w-full`}
                          // Every card's button reads the same otherwise.
                          aria-label={
                            known
                              ? `Open your conversation with ${m.name}`
                              : `Start a conversation with ${m.name}`
                          }
                        >
                          <MessageSquare className="h-4 w-4" aria-hidden="true" />
                          {busy ? 'Opening…' : known ? 'Open conversation' : 'Message'}
                        </button>
                      ) : (
                        <p className={`text-[13px] ${MUTED}`}>Sign in to write to a mentor.</p>
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
