import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useReducedMotion } from 'motion/react';
import {
  AlertCircle,
  RefreshCcw,
  SendHorizonal,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { ApiError, api } from '@/lib/api';
import type { CommunityMessage } from '@/types/api';
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
  groupMessages,
  initials,
  monogramTile,
  relativeTime,
} from './theme';

/**
 * One group's thread.
 *
 * THERE IS NO WEBSOCKET on this deployment — the API is serverless request /
 * response — so the thread is POLLED every POLL_MS. React Query pauses the
 * interval while the tab is in the background (refetchIntervalInBackground
 * defaults to false), so an idle tab is not a beacon.
 *
 * Nothing here decides who wrote what. `isMentor` and `badge` are stamped by
 * the server from a real mentor session (api/community/messages.ts); the client
 * only renders them. There is also no "this one is mine" styling: the payload
 * carries no author id, and guessing from a display name would eventually put
 * somebody else's disclosure in your own colours.
 */

/** Fast enough that a reply feels live, slow enough to be polite to the DB. */
const POLL_MS = 5_000;

interface Props {
  roomId: string;
  clerkId: string;
  onClose: () => void;
}

function Monogram({ name, isMentor }: { name: string; isMentor: boolean }) {
  const [from, to] = isMentor ? MENTOR_TILE : monogramTile(name);
  return (
    <span
      aria-hidden="true"
      style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-display text-[13px] tracking-wide text-white"
    >
      {initials(name)}
    </span>
  );
}

function Bubble({ m, mentor }: { m: CommunityMessage; mentor: boolean }) {
  return (
    <li
      className={`rounded-2xl border px-3.5 py-2.5 ${
        mentor ? 'border-[#0F5132]/30 bg-[#0F5132]/[0.07]' : 'border-white/70 bg-white/75'
      }`}
    >
      <p className={`whitespace-pre-wrap break-words text-[14px] leading-relaxed ${INK}`}>
        {m.content}
      </p>
      <time dateTime={m.timestamp} className={`mt-1 block text-[11px] ${MUTED}`}>
        {relativeTime(m.timestamp)}
      </time>
    </li>
  );
}

export default function GroupRoom({ roomId, clerkId, onClose }: Props) {
  const reduceMotion = useReducedMotion();
  const qc = useQueryClient();
  const logRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState('');
  const [crisis, setCrisis] = useState(false);

  // Same key as the list, so this is the same cache entry — no second request,
  // and `joined` stays honest the moment a membership change invalidates it.
  const { data: groups } = useQuery({
    queryKey: ['community-groups', clerkId],
    queryFn: () => api.getCommunityGroups(clerkId || undefined),
  });
  const group = (groups ?? []).find((g) => g.id === roomId);
  const joined = group?.joined === true;
  const name = group?.name ?? 'Peer circle';

  const messages = useQuery({
    queryKey: ['community-messages', roomId],
    queryFn: () => api.getCommunityMessages(roomId),
    refetchInterval: POLL_MS,
  });

  const membership = useMutation({
    mutationFn: (action: 'join' | 'leave') => api.setGroupMembership(clerkId, roomId, action),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['community-groups', clerkId] }),
  });

  const send = useMutation({
    mutationFn: (text: string) => api.postCommunityMessage({ roomId, content: text, clerkId }),
    onSuccess: (res, text) => {
      // The box is cleared only once the server has the message — a send that
      // fails leaves the text exactly where the writer left it. If they kept
      // typing while it was in flight, their newer text stays.
      setDraft((d) => (d.trim() === text ? '' : d));
      // The server screens every post. `crisis` is the single most important
      // field on this page: it means the person who just typed may be in
      // danger, so the helplines go up immediately, above their own composer.
      if (res.crisis) setCrisis(true);
      void qc.invalidateQueries({ queryKey: ['community-messages', roomId] });
    },
  });

  const blocks = groupMessages(messages.data ?? []);
  const count = messages.data?.length ?? 0;

  // Follow the thread, but only for someone already at the bottom of it —
  // yanking the view mid-scroll while they are reading back is worse than a
  // missed line. 200px covers roughly one new message plus its author row.
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

  const sendStatus = send.error instanceof ApiError ? send.error.status : 0;

  return (
    <section
      aria-labelledby="room-heading"
      className={`${CARD} flex flex-col overflow-hidden`}
    >
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[#2B0B2E]/10 px-5 py-4">
        <div className="min-w-0">
          <h2 id="room-heading" className={`font-display text-[21px] leading-tight ${INK}`}>
            {name}
          </h2>
          <p className={`mt-0.5 flex flex-wrap items-center gap-x-3 text-[13px] ${MUTED}`}>
            {group?.topic && <span>{group.topic}</span>}
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" aria-hidden="true" />
              {group?.memberCount ?? 0} member{group?.memberCount === 1 ? '' : 's'}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {joined && (
            <button
              type="button"
              disabled={membership.isPending}
              onClick={() => membership.mutate('leave')}
              className={BTN_QUIET}
              aria-label={`Leave ${name}`}
            >
              {membership.isPending ? 'Saving…' : 'Leave'}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className={`${BTN_QUIET} h-9 w-9 !px-0`}
            aria-label="Close this circle and go back to the list"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </header>

      <div
        ref={logRef}
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
        aria-label={`Messages in ${name}`}
        aria-busy={messages.isPending}
        tabIndex={0}
        className="max-h-[26rem] min-h-[14rem] flex-1 space-y-5 overflow-y-auto px-5 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2B0B2E]"
      >
        {messages.isPending && <p className={`text-[14px] ${MUTED}`}>Opening the thread…</p>}

        {messages.isError && (
          <div role="alert">
            <p className={`flex items-start gap-2 text-[14px] font-semibold ${BAD}`}>
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {messages.error instanceof Error ? messages.error.message : 'The thread would not load.'}
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
          <p className={`text-[14px] leading-relaxed ${MUTED}`}>
            Nobody has written here yet. A first message can be as small as “hello” — someone else
            is almost certainly waiting for one too.
          </p>
        )}

        {blocks.map((b) => (
          <div key={b.id}>
            {b.dayLabel && (
              <p
                className={`mb-3 text-center font-mono text-[10px] uppercase tracking-[0.16em] ${MUTED}`}
              >
                {b.dayLabel}
              </p>
            )}
            {/*
              A mentor block carries four separate signals: the word "Mentor" in
              the badge, their role text next to it, a solid green rail down the
              side of the block, and the green monogram tile. Colour is the last
              of the four and never the only one.
            */}
            <div className={`flex gap-3 ${b.isMentor ? `${MENTOR_RAIL} pl-3` : ''}`}>
              <Monogram name={b.authorName} isMentor={b.isMentor} />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className={`text-[14px] font-semibold ${b.isMentor ? MENTOR_INK : INK}`}>
                    {b.authorName}
                  </span>
                  {b.isMentor && (
                    <>
                      <span className={MENTOR_PILL}>
                        <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                        Mentor
                      </span>
                      {b.badge && <span className={`text-[12px] ${MENTOR_INK}`}>{b.badge}</span>}
                    </>
                  )}
                </p>
                <ul className="mt-1.5 space-y-1.5">
                  {b.messages.map((m) => (
                    <Bubble key={m.id} m={m} mentor={b.isMentor} />
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}

        {send.isPending && send.variables && (
          <div className="flex gap-3 opacity-70">
            <span aria-hidden="true" className="h-9 w-9 shrink-0 rounded-xl bg-[#2B0B2E]/10" />
            <div className="min-w-0 flex-1">
              <p className={`text-[14px] font-semibold ${INK}`}>You · sending…</p>
              <p
                className={`mt-1.5 whitespace-pre-wrap break-words rounded-2xl border border-white/70 bg-white/60 px-3.5 py-2.5 text-[14px] leading-relaxed ${INK}`}
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
            <p className={`mt-1 text-[13px] ${MUTED}`}>
              Nothing was lost. This is still yours to send:
            </p>
            {/*
              Shown here as well as in the composer on purpose. A 403 can flip
              this room back to "not a member", which hides the composer — the
              words must not go with it.
            */}
            {send.variables && (
              <p
                className={`mt-2 whitespace-pre-wrap break-words rounded-xl border border-white/70 bg-white/70 px-3 py-2 text-[13px] ${INK}`}
              >
                {send.variables}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {sendStatus === 403 && clerkId && (
                <button
                  type="button"
                  disabled={membership.isPending}
                  onClick={() => membership.mutate('join')}
                  className={BTN_SOLID}
                >
                  {membership.isPending ? 'Joining…' : `Join ${name}`}
                </button>
              )}
              <button
                type="button"
                // Resends exactly what failed, not whatever is in the box now.
                onClick={() => send.variables && send.mutate(send.variables)}
                className={BTN_QUIET}
                disabled={!send.variables || send.isPending}
              >
                <RefreshCcw className="h-4 w-4" aria-hidden="true" /> Try sending again
              </button>
            </div>
          </div>
        )}

        {!clerkId ? (
          <p className={`text-[14px] ${MUTED}`}>
            You are reading as a guest. Sign in to join this circle and post in it.
          </p>
        ) : !joined ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className={`text-[14px] ${MUTED}`}>
              You are reading along. Join to write here — you can leave again at any time.
            </p>
            <button
              type="button"
              disabled={membership.isPending}
              onClick={() => membership.mutate('join')}
              className={BTN_SOLID}
            >
              {membership.isPending ? 'Joining…' : `Join ${name}`}
            </button>
            {membership.isError && (
              <p role="alert" className={`text-[13px] font-medium ${BAD}`}>
                {membership.error instanceof Error ? membership.error.message : 'That did not work.'}
              </p>
            )}
          </div>
        ) : (
          <div>
            <label htmlFor="community-composer" className={`text-[13px] font-semibold ${INK}`}>
              Write to {name}
            </label>
            <div className="mt-1.5 flex items-end gap-2 rounded-[18px] border border-white/70 bg-white/80 p-2">
              <textarea
                id="community-composer"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    submit();
                  }
                }}
                rows={2}
                maxLength={2000}
                placeholder="Say what you came to say…"
                className={`max-h-40 flex-1 resize-none bg-transparent px-2 py-1.5 text-[14px] leading-relaxed ${INK} placeholder:text-[#6A3F70]/70 focus:outline-none`}
              />
              <button
                type="button"
                onClick={submit}
                disabled={!draft.trim() || send.isPending}
                className={`${BTN_SOLID} h-10 w-10 !px-0`}
                aria-label="Send to the circle"
              >
                <SendHorizonal className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <p className={`mt-1.5 text-[12px] ${MUTED}`}>
              Enter sends · Shift + Enter starts a new line · everyone in the circle can read it
              {messages.dataUpdatedAt > 0 && ` · last checked ${clockTime(new Date(messages.dataUpdatedAt).toISOString())}`}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
