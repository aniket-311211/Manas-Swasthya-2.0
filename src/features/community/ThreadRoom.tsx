import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useReducedMotion } from 'motion/react';
import { AlertCircle, RefreshCcw, SendHorizonal, ShieldCheck, X } from 'lucide-react';
import { ApiError, api } from '@/lib/api';
import type { ThreadMessage } from '@/types/api';
import CrisisBanner from '@/features/chat/CrisisBanner';
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
  clockTime,
  initials,
  monogramTile,
} from './theme';
import { isMine, threadPartner, threadStamp, type Viewer } from './ThreadList';

/**
 * One private student ↔ mentor conversation, read and written by both sides.
 *
 * Same component for both seats: `Viewer` decides whether the request carries a
 * clerkId or a bearer token, and `isMine` decides which side of the thread each
 * message hangs on. Nothing here declares who wrote what — `isMentor` is stamped
 * by the server from a real session (api/mentors/threads.ts).
 *
 * NOT FOUND MEANS NOT FOUND. The server answers a thread that is not yours with
 * 404, never 403, precisely so it does not confirm the thread exists. This
 * screen keeps that promise: no "forbidden", no "you do not have permission" —
 * the conversation simply is not there, and the way out is back to the list.
 *
 * There is no websocket on this deployment, so the thread is POLLED, exactly as
 * the group rooms are. React Query pauses the interval in a background tab.
 */

const POLL_MS = 5_000;

const notFound = (e: unknown): boolean => e instanceof ApiError && e.status === 404;

interface Props {
  roomId: string;
  viewer: Viewer;
  onClose: () => void;
}

function Bubble({ m, mine }: { m: ThreadMessage; mine: boolean }) {
  const [from, to] = m.isMentor ? MENTOR_TILE : monogramTile(m.authorName);
  return (
    <li className={`flex gap-3 ${mine ? 'flex-row-reverse' : ''}`}>
      <span
        aria-hidden="true"
        style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-display text-[13px] tracking-wide text-white"
      >
        {initials(m.authorName)}
      </span>

      {/*
        A mentor's message carries four separate signals — the word "Mentor" in
        the pill, their badge beside it, a solid green rail down the block, and
        the green monogram. Which side it hangs on says "mine" or "theirs" and
        nothing about who is a mentor, so the two never collapse into colour.
      */}
      <div
        className={`min-w-0 max-w-[85%] ${m.isMentor ? `${MENTOR_RAIL} pl-3` : ''} ${
          mine ? 'text-right' : ''
        }`}
      >
        <p
          className={`flex flex-wrap items-center gap-x-2 gap-y-1 ${
            mine ? 'justify-end' : ''
          }`}
        >
          <span className={`text-[13px] font-semibold ${m.isMentor ? MENTOR_INK : INK}`}>
            {mine ? 'You' : m.authorName}
          </span>
          {m.isMentor && (
            <>
              <span className={MENTOR_PILL}>
                <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                Mentor
              </span>
              {m.badge && <span className={`text-[12px] ${MENTOR_INK}`}>{m.badge}</span>}
            </>
          )}
        </p>
        <p
          className={`mt-1 whitespace-pre-wrap break-words rounded-2xl border px-3.5 py-2.5 text-left text-[14px] leading-relaxed ${INK} ${
            m.isMentor ? 'border-[#0F5132]/30 bg-[#0F5132]/[0.07]' : 'border-white/70 bg-white/75'
          }`}
        >
          {m.content}
        </p>
        <time dateTime={m.timestamp} className={`mt-1 block text-[11px] ${MUTED}`}>
          {threadStamp(m.timestamp)}
        </time>
      </div>
    </li>
  );
}

export default function ThreadRoom({ roomId, viewer, onClose }: Props) {
  const reduceMotion = useReducedMotion();
  const qc = useQueryClient();
  const logRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState('');
  const [crisis, setCrisis] = useState(false);

  // Same key and function the list uses, so this reads that cache entry rather
  // than opening a second request just to learn the other person's name.
  const { data: threads } = useQuery({
    queryKey: ['threads', viewer.key],
    queryFn: () => api.getThreads(viewer.clerkId, viewer.mentorToken),
  });
  const partner = threadPartner(
    (threads ?? []).find((t) => t.id === roomId),
    viewer.isMentor,
  );

  const messages = useQuery({
    queryKey: ['thread', roomId],
    queryFn: () => api.getThreadMessages(roomId, viewer.clerkId, viewer.mentorToken),
    // A 404 is a settled answer, not a blip: retrying it or polling it would
    // hammer the server for a thread that will never be ours.
    retry: (count, err) => !notFound(err) && count < 2,
    refetchInterval: (q) => (q.state.error ? false : POLL_MS),
  });

  const send = useMutation({
    mutationFn: (text: string) =>
      api.sendThreadMessage({ roomId, content: text, clerkId: viewer.clerkId }, viewer.mentorToken),
    onSuccess: (res, text) => {
      // Cleared only once the server has it — a failed send leaves the words
      // exactly where they were typed. Newer typing survives too.
      setDraft((d) => (d.trim() === text ? '' : d));
      // The single most important field on this screen. A private thread is
      // where someone is most likely to say the thing they cannot say in a
      // group, so the helplines go up immediately, above their own composer.
      if (res.crisis) setCrisis(true);
      void qc.invalidateQueries({ queryKey: ['thread', roomId] });
      void qc.invalidateQueries({ queryKey: ['threads', viewer.key] });
    },
  });

  const list = messages.data ?? [];
  const count = list.length;
  const gone = notFound(messages.error) || notFound(send.error);
  // Per seat, not per file: a signed-in mentor on /mentors can have their own
  // inbox thread and a student thread open on the same page. Mentors.tsx scrolls
  // to the student one by this exact id.
  const headingId = `thread-heading-${viewer.isMentor ? 'mentor' : 'student'}`;

  // Follow the thread, but not for someone scrolled up reading back.
  useEffect(() => {
    const el = logRef.current;
    if (!el) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight > 200) return;
    el.scrollTo({ top: el.scrollHeight, behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [count, reduceMotion]);

  const submit = () => {
    const text = draft.trim();
    if (text && !send.isPending) send.mutate(text);
  };

  if (gone) {
    return (
      <section aria-labelledby={headingId} className={`${CARD} p-6`}>
        <h2 id={headingId} className={`font-display text-[21px] leading-tight ${INK}`}>
          Conversation not found
        </h2>
        <p className={`mt-1.5 max-w-prose text-[14px] leading-relaxed ${MUTED}`}>
          This one is not in your list. It may have been closed, or the link may be out of date.
          Your other conversations are untouched.
        </p>
        {/* Whatever they were mid-way through typing is still theirs to keep. */}
        {send.variables && (
          <p
            className={`mt-3 whitespace-pre-wrap break-words rounded-xl border border-white/70 bg-white/70 px-3 py-2 text-[13px] ${INK}`}
          >
            {send.variables}
          </p>
        )}
        <button type="button" onClick={onClose} className={`${BTN_SOLID} mt-4`}>
          Back to your conversations
        </button>
      </section>
    );
  }

  return (
    <section aria-labelledby={headingId} className={`${CARD} flex flex-col overflow-hidden`}>
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[#2B0B2E]/10 px-5 py-4">
        <div className="min-w-0">
          <h2
            id={headingId}
            className={`flex flex-wrap items-center gap-2 font-display text-[21px] leading-tight ${INK}`}
          >
            {partner.name}
            {partner.isMentor && (
              <span className={MENTOR_PILL}>
                <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                Mentor
              </span>
            )}
          </h2>
          <p className={`mt-0.5 text-[13px] ${MUTED}`}>
            {[partner.badge, partner.specialization].filter(Boolean).join(' · ') ||
              'Private — only the two of you can read this.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className={`${BTN_QUIET} h-9 w-9 !px-0`}
          aria-label="Close this conversation and go back to the list"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </header>

      <div
        ref={logRef}
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
        aria-label={`Messages with ${partner.name}`}
        aria-busy={messages.isPending}
        tabIndex={0}
        className="max-h-[26rem] min-h-[14rem] flex-1 overflow-y-auto px-5 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2B0B2E]"
      >
        {messages.isPending && <p className={`text-[14px] ${MUTED}`}>Opening the conversation…</p>}

        {messages.isError && (
          <div role="alert">
            <p className={`flex items-start gap-2 text-[14px] font-semibold ${BAD}`}>
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {messages.error instanceof Error
                ? messages.error.message
                : 'The conversation would not load.'}
            </p>
            <button
              type="button"
              onClick={() => void messages.refetch()}
              className={`${BTN_QUIET} mt-3`}
              disabled={messages.isFetching}
            >
              <RefreshCcw className="h-4 w-4" aria-hidden="true" />
              {messages.isFetching ? 'Trying…' : 'Try again'}
            </button>
          </div>
        )}

        {!messages.isPending && !messages.isError && count === 0 && (
          <p className={`max-w-prose text-[14px] leading-relaxed ${MUTED}`}>
            {viewer.isMentor
              ? 'Nothing here yet. This student has not written, and a first word from you is often what makes that easier.'
              : `Nothing here yet. ${partner.name} is here for exactly this — a first message can be as small as “hello”.`}
          </p>
        )}

        <ul className="space-y-4">
          {list.map((m) => (
            <Bubble key={m.id} m={m} mine={isMine(m, viewer.isMentor)} />
          ))}
        </ul>

        {send.isPending && send.variables && (
          <div className="mt-4 flex flex-row-reverse gap-3 opacity-70">
            <span aria-hidden="true" className="h-9 w-9 shrink-0 rounded-xl bg-[#2B0B2E]/10" />
            <div className="min-w-0 max-w-[85%]">
              <p className={`text-right text-[13px] font-semibold ${INK}`}>You · sending…</p>
              <p
                className={`mt-1 whitespace-pre-wrap break-words rounded-2xl border border-white/70 bg-white/60 px-3.5 py-2.5 text-[14px] leading-relaxed ${INK}`}
              >
                {send.variables}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3 border-t border-[#2B0B2E]/10 bg-white/40 px-5 py-4">
        {crisis && (
          <div className="space-y-2">
            <CrisisBanner />
            <button type="button" onClick={() => setCrisis(false)} className={BTN_QUIET}>
              Hide the helplines for now
            </button>
          </div>
        )}

        {send.isError && (
          <div role="alert" className="rounded-2xl border border-[#9B1C1C]/25 bg-white/80 p-3.5">
            <p className={`flex items-start gap-2 text-[14px] font-semibold ${BAD}`}>
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {send.error instanceof Error ? send.error.message : 'That message did not send.'}
            </p>
            <p className={`mt-1 text-[13px] ${MUTED}`}>Nothing was lost. This is still yours to send:</p>
            {send.variables && (
              <p
                className={`mt-2 whitespace-pre-wrap break-words rounded-xl border border-white/70 bg-white/70 px-3 py-2 text-[13px] ${INK}`}
              >
                {send.variables}
              </p>
            )}
            <button
              type="button"
              // Resends exactly what failed, not whatever is in the box now.
              onClick={() => send.variables && send.mutate(send.variables)}
              className={`${BTN_QUIET} mt-3`}
              disabled={!send.variables || send.isPending}
            >
              <RefreshCcw className="h-4 w-4" aria-hidden="true" /> Try sending again
            </button>
          </div>
        )}

        <div>
          <label htmlFor={`${headingId}-composer`} className={`text-[13px] font-semibold ${INK}`}>
            Write to {partner.name}
          </label>
          <div className="mt-1.5 flex items-end gap-2 rounded-[18px] border border-white/70 bg-white/80 p-2">
            <textarea
              id={`${headingId}-composer`}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              rows={2}
              maxLength={4000}
              placeholder="Take as long as you need…"
              className={`max-h-40 flex-1 resize-none bg-transparent px-2 py-1.5 text-[14px] leading-relaxed ${INK} placeholder:text-[#6A3F70]/70 focus:outline-none`}
            />
            <button
              type="button"
              onClick={submit}
              disabled={!draft.trim() || send.isPending}
              className={`${BTN_SOLID} h-10 w-10 !px-0`}
              aria-label={`Send to ${partner.name}`}
            >
              <SendHorizonal className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <p className={`mt-1.5 text-[12px] ${MUTED}`}>
            Enter sends · Shift + Enter starts a new line · only {partner.name} can read this
            {messages.dataUpdatedAt > 0 &&
              ` · last checked ${clockTime(new Date(messages.dataUpdatedAt).toISOString())}`}
          </p>
        </div>
      </div>
    </section>
  );
}
