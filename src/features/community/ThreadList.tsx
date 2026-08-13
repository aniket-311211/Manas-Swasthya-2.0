/* eslint-disable react-refresh/only-export-components --
   The pure helpers below sit beside the list they serve rather than in a module
   of their own; ThreadRoom, MentorDirectory and tests/threadHelpers.test.ts all
   import them from here. The cost is a dev-time fast refresh, nothing at
   runtime. */

import { useQuery } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'motion/react';
import { AlertCircle, ArrowRight, MessageSquare, RefreshCcw, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';
import type { MentorThread } from '@/types/api';
import {
  BAD,
  BTN_QUIET,
  BTN_SOLID,
  CARD,
  INK,
  MENTOR_INK,
  MENTOR_PILL,
  MENTOR_RAIL,
  MENTOR_TILE,
  MUTED,
  ON_SILK,
  ON_SILK_MUTED,
  clockTime,
  dayLabel,
  initials,
  monogramTile,
  relativeTime,
} from './theme';

/**
 * Someone's 1:1 conversations, from whichever side of them they sit on.
 *
 * ONE LIST, TWO SEATS. `api/mentors/threads.ts` answers the same request for a
 * student (by clerkId) and for a mentor (by bearer token), and returns the same
 * row shape to both — so this component takes a `Viewer` and never branches on
 * anything else. Everything that differs between the two seats is "who is the
 * other person", which is `threadPartner`.
 *
 * The pure half takes its clock as an argument, so every branch is reachable in
 * the node vitest env (tests/threadHelpers.test.ts).
 */

/** Which seat the caller is in. The token never goes in a React Query key. */
export interface Viewer {
  /** Set for a student. */
  clerkId?: string;
  /** Set for a mentor. */
  mentorToken?: string;
  isMentor: boolean;
  /** Cache key for `['threads', key]`: the clerk id, or the mentor's own id. */
  key: string;
}

/* ---------------------------------------------------------------------------
 * Pure
 * ------------------------------------------------------------------------- */

/** Milliseconds of a thread's last activity; 0 for a date we cannot read. */
function stamp(t: MentorThread): number {
  const n = new Date(t?.lastAt ?? '').getTime();
  return Number.isNaN(n) ? 0 : n;
}

/**
 * Newest activity first, on a copy — the server's array is React Query's cached
 * object and sorting it in place would mutate the cache.
 *
 * The server already orders by `updatedAt`, but `lastAt` is the timestamp the
 * row actually prints, and the two drift apart the moment a room is touched
 * without a message. Sorting on the field the eye reads is what stops the list
 * looking mis-ordered.
 */
export function sortThreads(threads: MentorThread[]): MentorThread[] {
  if (!Array.isArray(threads)) return [];
  return threads.filter(Boolean).sort((a, b) => stamp(b) - stamp(a));
}

export interface Partner {
  name: string;
  badge: string | null;
  specialization: string | null;
  /** True when the other person is the mentor — i.e. the viewer is the student. */
  isMentor: boolean;
}

/**
 * The person on the other side, from the viewer's seat. A mentor looks across
 * at a student, a student looks across at a mentor.
 *
 * Falls back to a role word rather than an empty string: a deleted account must
 * still leave a readable row instead of a nameless one.
 */
export function threadPartner(thread: MentorThread | undefined | null, viewerIsMentor: boolean): Partner {
  const other = viewerIsMentor ? thread?.student : thread?.mentor;
  const mentorSide = !viewerIsMentor;
  return {
    name: other?.name?.trim() || (viewerIsMentor ? 'Student' : 'Mentor'),
    badge: (mentorSide && thread?.mentor?.badge) || null,
    specialization: (mentorSide && thread?.mentor?.specialization) || null,
    isMentor: mentorSide,
  };
}

/**
 * The auto-assigned mentor, when we can be sure which one it is.
 *
 * `api/_lib/assignMentor.ts` gives every student exactly one mentor at sign-up,
 * so a student holding a single thread is holding that assignment. Past one we
 * cannot tell which came first — the payload carries no `createdAt` — and
 * labelling the wrong person "your mentor" is worse than labelling nobody, so
 * this returns null rather than guessing.
 */
export function assignedThread(threads: MentorThread[]): MentorThread | null {
  return Array.isArray(threads) && threads.length === 1 ? threads[0] : null;
}

/**
 * Which side of the thread a message came from. There are only two people in
 * here, so "was this mine" is the author's side against the reader's seat — no
 * name matching, which would eventually mis-attribute a disclosure.
 */
export function isMine(message: { isMentor: boolean } | null | undefined, viewerIsMentor: boolean): boolean {
  return Boolean(message?.isMentor) === viewerIsMentor;
}

/**
 * What a message's time reads as. Inside today the relative form is enough;
 * older than that it needs the day, because "9:15 am" on its own could be any
 * date in the thread. Empty string for a timestamp we cannot read.
 */
export function threadStamp(iso: string, now: Date = new Date()): string {
  const day = dayLabel(iso, now);
  if (day === '') return '';
  return day === 'Today' ? relativeTime(iso, now) : `${day} · ${clockTime(iso)}`;
}

/* ---------------------------------------------------------------------------
 * View
 * ------------------------------------------------------------------------- */

interface Props {
  viewer: Viewer;
  openId: string | null;
  onOpen: (roomId: string) => void;
}

function Row({
  thread,
  viewer,
  open,
  assigned,
  onOpen,
}: {
  thread: MentorThread;
  viewer: Viewer;
  open: boolean;
  assigned: boolean;
  onOpen: (roomId: string) => void;
}) {
  const p = threadPartner(thread, viewer.isMentor);
  const [from, to] = p.isMentor ? MENTOR_TILE : monogramTile(p.name);
  const closed = thread.status === 'closed';

  return (
    <div className={`flex gap-3 ${p.isMentor ? `${MENTOR_RAIL} pl-3` : ''}`}>
      <span
        aria-hidden="true"
        style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-display text-[15px] tracking-wide text-white"
      >
        {initials(p.name)}
      </span>

      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className={`font-display text-[18px] leading-tight ${p.isMentor ? MENTOR_INK : INK}`}>
            {p.name}
          </span>
          {p.isMentor && (
            <span className={MENTOR_PILL}>
              <ShieldCheck className="h-3 w-3" aria-hidden="true" />
              Mentor
            </span>
          )}
          {assigned && (
            <span
              className={`rounded-full border border-[#2B0B2E]/25 bg-white/70 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] ${INK}`}
            >
              Your mentor
            </span>
          )}
        </p>

        {(p.badge || p.specialization) && (
          <p className={`mt-0.5 text-[13px] ${MENTOR_INK}`}>
            {[p.badge, p.specialization].filter(Boolean).join(' · ')}
          </p>
        )}

        <p className={`mt-1.5 line-clamp-2 text-[14px] leading-relaxed ${MUTED}`}>
          {thread.lastMessage?.trim() || 'Nothing has been written here yet.'}
        </p>

        <p className={`mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] ${MUTED}`}>
          <time dateTime={thread.lastAt}>{threadStamp(thread.lastAt)}</time>
          {/* The word carries it; there is no colour-only state on this row. */}
          {closed && <span className={`font-semibold ${INK}`}>Closed</span>}
        </p>

        {/* Every row's button would otherwise read "Open conversation" — the
            label is what tells a screen-reader user which one they are on. */}
        <button
          type="button"
          onClick={() => onOpen(thread.id)}
          className={`${BTN_SOLID} mt-3`}
          aria-current={open ? 'true' : undefined}
          aria-label={
            open ? `Reading your conversation with ${p.name}` : `Open conversation with ${p.name}`
          }
        >
          {open ? 'Reading now' : 'Open conversation'}
          {!open && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}

export default function ThreadList({ viewer, openId, onOpen }: Props) {
  const reduceMotion = useReducedMotion();

  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['threads', viewer.key],
    queryFn: () => api.getThreads(viewer.clerkId, viewer.mentorToken),
  });

  const threads = sortThreads(data ?? []);
  const assignedId = assignedThread(threads)?.id ?? null;
  // A signed-in mentor browsing /mentors gets both lists on one page — their
  // inbox and their own student threads — so the id is per seat, not per file.
  const headingId = `threads-heading-${viewer.isMentor ? 'mentor' : 'student'}`;

  return (
    <section aria-labelledby={headingId} className="space-y-4">
      <div>
        <h2 id={headingId} className={`font-display text-[24px] leading-tight ${ON_SILK}`}>
          {viewer.isMentor ? 'Students writing to you' : 'Your conversations'}
        </h2>
        <p className={`mt-1 max-w-2xl text-[14px] ${ON_SILK_MUTED}`}>
          {viewer.isMentor
            ? 'One thread per student, private to the two of you. Nobody else can read them — not other mentors, not other students.'
            : 'Private, one-to-one, and only ever between you and that mentor. Nobody else on the platform can read them.'}
        </p>
      </div>

      {isError && (
        <div className={`${CARD} p-6`} role="alert">
          <p className={`flex items-start gap-2 text-[15px] font-semibold ${BAD}`}>
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            We could not load your conversations.
          </p>
          <p className={`mt-1.5 text-[14px] ${MUTED}`}>
            {error instanceof Error ? error.message : 'Something went wrong on the way to the server.'}
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

      {isPending && (
        <div className={`${CARD} p-6`} aria-hidden="true">
          <span className="block h-5 w-1/3 animate-pulse rounded bg-[#2B0B2E]/10" />
          <span className="mt-3 block h-3 w-4/5 animate-pulse rounded bg-[#2B0B2E]/10" />
          <span className="mt-5 block h-9 w-56 animate-pulse rounded-full bg-[#2B0B2E]/10" />
        </div>
      )}

      {!isError && !isPending && threads.length === 0 && (
        <div className={`${CARD} p-6`}>
          <p className={`flex items-center gap-2 text-[15px] font-semibold ${INK}`}>
            <MessageSquare className="h-4 w-4 shrink-0" aria-hidden="true" />
            {viewer.isMentor ? 'No student has opened a thread with you yet.' : 'No conversations yet.'}
          </p>
          <p className={`mt-1.5 text-[14px] leading-relaxed ${MUTED}`}>
            {viewer.isMentor
              ? 'Students start these, never the other way round — you will see each one here the moment it opens.'
              : 'A mentor is assigned to you when your account is created. If nothing is here, pick someone from the list below and say hello; a first message can be as small as that.'}
          </p>
        </div>
      )}

      {threads.length > 0 && (
        <ul className="space-y-4" aria-busy={isFetching}>
          {threads.map((t, i) => (
            <motion.li
              key={t.id}
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, delay: reduceMotion ? 0 : Math.min(i, 6) * 0.03 }}
              className={`${CARD} p-5 ${t.id === openId ? 'ring-2 ring-[#2B0B2E]' : ''}`}
            >
              <Row
                thread={t}
                viewer={viewer}
                open={t.id === openId}
                assigned={t.id === assignedId && !viewer.isMentor}
                onOpen={onOpen}
              />
            </motion.li>
          ))}
        </ul>
      )}
    </section>
  );
}
