import { useState, type ComponentProps } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'motion/react';
import { AlertCircle, Check, LogOut, SendHorizonal, ShieldCheck } from 'lucide-react';
import { ApiError, api } from '@/lib/api';
import {
  BAD,
  BTN_QUIET,
  BTN_SOLID,
  CARD,
  FOCUS,
  INK,
  MENTOR_INK,
  MENTOR_PILL,
  MENTOR_TILE,
  MUTED,
  initials,
} from './theme';
import MentorLogin from './MentorLogin';
import MentorSignup from './MentorSignup';
import ThreadList, { type Viewer } from './ThreadList';
import ThreadRoom from './ThreadRoom';
import { useMentorSession, type StoredSession } from './mentorSession';

/**
 * What a signed-in mentor sees: who they are, one composer that posts into any
 * peer circle under their badge, and the 1:1 threads students have opened with
 * them.
 *
 * THE INBOX IS THE OTHER HALF OF THE LOOP. A student can open a private thread
 * from /mentors, but it is only a conversation once somebody answers — so the
 * same ThreadList and ThreadRoom the student uses are mounted here with a mentor
 * `Viewer`. The server treats a bearer token and a clerkId as two seats at the
 * same table (api/mentors/threads.ts), so nothing below needed a second
 * component to say the same thing twice.
 *
 * The group composer is deliberately not a second dashboard: mentors read the
 * circles in GroupRoom below this panel.
 */

function Console({ session, signOut }: { session: StoredSession; signOut: () => Promise<void> }) {
  const qc = useQueryClient();
  const [roomId, setRoomId] = useState('');
  const [draft, setDraft] = useState('');
  const { mentor, token } = session;

  // Same key and shape the student list uses, so this shares that cache entry
  // rather than opening a second one.
  const { data: groups, isPending, isError, error } = useQuery({
    queryKey: ['community-groups', ''],
    queryFn: () => api.getCommunityGroups(),
  });

  const rooms = groups ?? [];
  const active = rooms.some((g) => g.id === roomId) ? roomId : (rooms[0]?.id ?? '');
  const activeName = rooms.find((g) => g.id === active)?.name ?? 'the circle';

  const post = useMutation({
    mutationFn: (content: string) => api.postCommunityMessage({ roomId: active, content }, token),
    onSuccess: () => {
      setDraft('');
      void qc.invalidateQueries({ queryKey: ['community-messages', active] });
    },
    onError: (e) => {
      // The token died under us — revoked, or the session row was pruned. Ending
      // the session here is more honest than letting every post fail.
      if (e instanceof ApiError && e.status === 401) void signOut();
    },
  });

  return (
    <section aria-labelledby="mentor-console-heading" className={`${CARD} p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <span
            aria-hidden="true"
            style={{ backgroundImage: `linear-gradient(135deg, ${MENTOR_TILE[0]}, ${MENTOR_TILE[1]})` }}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-display text-[15px] tracking-wide text-white"
          >
            {initials(mentor.name)}
          </span>
          <div className="min-w-0">
            <h2
              id="mentor-console-heading"
              className={`font-display text-[21px] leading-tight ${INK}`}
            >
              {mentor.name}
            </h2>
            <p className="mt-1 flex flex-wrap items-center gap-2">
              <span className={MENTOR_PILL}>
                <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                Mentor
              </span>
              {mentor.badge && (
                <span className={`text-[13px] font-semibold ${MENTOR_INK}`}>{mentor.badge}</span>
              )}
              {mentor.specialization && (
                <span className={`text-[13px] ${MUTED}`}>{mentor.specialization}</span>
              )}
            </p>
          </div>
        </div>

        <button type="button" onClick={() => void signOut()} className={BTN_QUIET}>
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Sign out
        </button>
      </div>

      <div className="mt-5 space-y-3 border-t border-[#2B0B2E]/10 pt-5">
        {isError && (
          <p role="alert" className={`flex items-start gap-2 text-[14px] font-medium ${BAD}`}>
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {error instanceof Error ? error.message : 'The circles would not load.'}
          </p>
        )}

        {!isError && !isPending && rooms.length === 0 && (
          <p className={`text-[14px] ${MUTED}`}>
            There are no circles open yet, so there is nowhere to post. The wellbeing team opens
            them as facilitators become available.
          </p>
        )}

        {rooms.length > 0 && (
          <>
            <div>
              {/* Native select: the list is short, and it is keyboard- and
                  screen-reader-correct without a line of our own code. */}
              <label htmlFor="mentor-room" className={`block text-[13px] font-semibold ${INK}`}>
                Post into
              </label>
              <select
                id="mentor-room"
                value={active}
                onChange={(e) => setRoomId(e.target.value)}
                className={`mt-1.5 w-full rounded-xl border border-[#2B0B2E]/20 bg-white/85 px-3 py-2.5 text-[15px] text-[#2B0B2E] sm:max-w-sm ${FOCUS}`}
              >
                {rooms.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name ?? 'Peer circle'} · {g.memberCount ?? 0} member
                    {g.memberCount === 1 ? '' : 's'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="mentor-composer" className={`block text-[13px] font-semibold ${INK}`}>
                Your message
              </label>
              <textarea
                id="mentor-composer"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={3}
                maxLength={2000}
                className={`mt-1.5 w-full resize-y rounded-xl border border-[#2B0B2E]/20 bg-white/85 px-3.5 py-2.5 text-[15px] leading-relaxed text-[#2B0B2E] placeholder:text-[#6A3F70]/70 ${FOCUS}`}
                placeholder="Write to the circle…"
              />
              <p className={`mt-1.5 text-[12px] ${MUTED}`}>
                Everyone in {activeName} can read this, and it carries your mentor badge.
              </p>
            </div>

            {post.isError && (
              <div role="alert" className="rounded-xl border border-[#9B1C1C]/25 bg-white/80 p-3.5">
                <p className={`flex items-start gap-2 text-[14px] font-semibold ${BAD}`}>
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {post.error instanceof Error ? post.error.message : 'That did not send.'}
                </p>
                {/* The draft is still in the box above — nothing was lost. */}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={!draft.trim() || post.isPending}
                onClick={() => post.mutate(draft.trim())}
                className={BTN_SOLID}
              >
                <SendHorizonal className="h-4 w-4" aria-hidden="true" />
                {post.isPending ? 'Posting…' : 'Post as mentor'}
              </button>
              <p role="status" aria-live="polite" className={`text-[13px] ${MUTED}`}>
                {post.isPending && 'Posting…'}
                {post.isSuccess && !post.isPending && (
                  <span className={`inline-flex items-center gap-1.5 font-medium ${MENTOR_INK}`}>
                    <Check className="h-4 w-4" aria-hidden="true" />
                    Posted to {activeName}.
                  </span>
                )}
              </p>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default function MentorConsole() {
  const reduceMotion = useReducedMotion();
  const { session, signIn, signOut } = useMentorSession();
  const [tab, setTab] = useState<'in' | 'up'>('in');
  const [openId, setOpenId] = useState<string | null>(null);

  const signUp: ComponentProps<typeof MentorSignup>['onSubmit'] = async (fields) => {
    await api.mentorSignup(fields);
    // Signup answers with a session of its own, but mentorSession.ts is the only
    // module that knows where a token is kept — so a new mentor comes in through
    // the same door as everyone else rather than teaching a second place how to
    // store one. Either call rejects with the server's own message.
    await signIn(fields.email, fields.password);
  };

  // A thread id left over from the last session would open somebody else's
  // conversation — which the server answers with 404, but the cleaner fix is not
  // to ask.
  const endSession = async () => {
    setOpenId(null);
    await signOut();
  };

  const viewer: Viewer | null = session
    ? { mentorToken: session.token, isMentor: true, key: session.mentor.id }
    : null;

  const tabClass = (mine: 'in' | 'up') => (tab === mine ? BTN_SOLID : BTN_QUIET);

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/*
        Outside the swap on purpose. The form and the console each replace the
        other, so a live region inside either one unmounts before it can say
        anything; this one survives both and is the only announcement a screen
        reader gets that the sign-in worked. It is silent on first paint — a live
        region does not read its initial content — so a restored session does not
        talk over the page.
      */}
      <p role="status" aria-live="polite" className="sr-only">
        {session ? `Signed in as ${session.mentor.name}.` : ''}
      </p>

      {session && viewer ? (
        <div className="space-y-6">
          <Console session={session} signOut={endSession} />
          <ThreadList viewer={viewer} openId={openId} onOpen={setOpenId} />
          {/* Keyed by thread: switching students resets the draft, the crisis
              notice and the scroll rather than carrying them across. */}
          {openId && (
            <ThreadRoom
              key={openId}
              roomId={openId}
              viewer={viewer}
              onClose={() => setOpenId(null)}
            />
          )}
        </div>
      ) : (
        <div className="max-w-md space-y-3">
          {/* Two toggle buttons rather than a tablist: the state is carried by
              aria-pressed and by the fill, and there is no roving focus to get
              wrong for two controls. */}
          <div role="group" aria-label="Mentor access" className="flex flex-wrap gap-2">
            <button type="button" aria-pressed={tab === 'in'} onClick={() => setTab('in')} className={tabClass('in')}>
              I have an account
            </button>
            <button type="button" aria-pressed={tab === 'up'} onClick={() => setTab('up')} className={tabClass('up')}>
              I was invited to mentor
            </button>
          </div>

          {tab === 'in' ? <MentorLogin onSubmit={signIn} /> : <MentorSignup onSubmit={signUp} />}
        </div>
      )}
    </motion.div>
  );
}
