import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useTranslation } from 'react-i18next';
import { useReducedMotion } from 'motion/react';
import Silk from '@/components/Silk/Silk';
import ErrorBoundary from '@/components/ErrorBoundary';
import MentorConsole from '@/features/community/MentorConsole';
import MentorDirectory from '@/features/community/MentorDirectory';
import ThreadList, { type Viewer } from '@/features/community/ThreadList';
import ThreadRoom from '@/features/community/ThreadRoom';
import ActivityBoard from '@/features/community/ActivityBoard';
import GroupList from '@/features/community/GroupList';
import GroupRoom from '@/features/community/GroupRoom';
import { CARD, FOCUS, ON_SILK, ON_SILK_MUTED } from '@/features/community/theme';

/**
 * Everything social lives here: mentors, peer circles and activities behind one
 * sub-nav, on one Silk field, instead of three routes that looked identical.
 *
 * Mentors come first deliberately. Every account is assigned one at sign-up, so
 * the first thing this page can offer is a person who is already yours — not a
 * room of strangers.
 */

type Tab = 'mentors' | 'community' | 'events';

const TABS = [
  {
    id: 'mentors',
    labelKey: 'community.tabs.mentors',
    blurb:
      'One-to-one and private: only you and that mentor can read a conversation here. Mentors are trained students, not clinicians on call — if something is urgent, the helplines are one tap away in the bar above.',
  },
  {
    id: 'community',
    labelKey: 'community.tabs.community',
    blurb:
      'Peer circles run by students, with trained mentors dropping in. Nobody here is a clinician on call — if something is urgent, the helplines are one tap away inside any room.',
  },
  {
    id: 'events',
    labelKey: 'community.tabs.events',
    blurb:
      'Sessions you can take a place in. Cancelling is done in the same place as joining, so signing up for a room full of strangers is never a commitment you have to email someone to undo.',
  },
] as const satisfies readonly { id: Tab; labelKey: string; blurb: string }[];

export default function Community() {
  const { user } = useUser();
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const clerkId = user?.id ?? '';

  // The tab lives in the URL so the dashboard can link straight to an activity
  // (`/community?tab=events`) and a shared link opens where the sender was.
  // Replaced rather than pushed: back should leave the page, not walk the tabs.
  const [params, setParams] = useSearchParams();
  const raw = params.get('tab');
  const tab: Tab = raw === 'community' || raw === 'events' ? raw : 'mentors';
  const setTab = (next: Tab) => setParams({ tab: next }, { replace: true });

  // Two open panes, never shared: a circle and a mentor thread are different
  // rooms and one must not resolve to the other when you switch tabs.
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [openThread, setOpenThread] = useState<string | null>(null);

  // `|| undefined` rather than the empty string: an absent id must be absent
  // from the request, so the server answers "sign in" instead of rejecting a
  // blank field as malformed.
  const viewer: Viewer = { clerkId: clerkId || undefined, isMentor: false, key: clerkId };

  // Each room mounts below its list; nothing focusable is skipped over, so a
  // scroll is enough — tab order already continues into it. This runs after the
  // commit, so the heading it looks for is on the page by then.
  useEffect(() => {
    const id =
      tab === 'community' && openGroup
        ? 'room-heading'
        : tab === 'mentors' && openThread
          ? 'thread-heading-student'
          : null;
    if (!id) return;
    document.getElementById(id)?.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'center',
    });
  }, [tab, openGroup, openThread, reduceMotion]);

  const active = TABS.find((t) => t.id === tab)!;

  return (
    <div className="relative flex min-h-[calc(100vh-4.25rem)] flex-col">
      {/*
        Silk canvas. `fixed` so it spans the viewport under the sticky top bar;
        pointer-events-none so it never eats a click on a card. Reduced motion
        falls back to the flat colour — same hex, so contrast is identical.

        #e46cea is a bright pink-magenta, L≈0.33: white on it is 2.8:1 and
        unreadable on its own, so every surface above it is dark ink on frosted
        light and the copy on the shader itself is outlined.
      */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 bg-[#e46cea]">
        {!reduceMotion && (
          <Silk speed={5} scale={1} color="#e46cea" noiseIntensity={1.5} rotation={0} />
        )}
      </div>

      <div className="relative mx-auto w-full max-w-5xl flex-1 space-y-6 px-4 py-10 lg:px-6">
        <header>
          <h1 className={`flex items-center gap-3 font-display text-[34px] leading-tight ${ON_SILK}`}>
            <img
              src="/logos/manas_swasthya_logo_white.png"
              alt=""
              className="h-10 w-auto shrink-0 drop-shadow-[0_1px_3px_rgba(0,0,0,0.55)]"
            />
            {t('page.community')}
          </h1>
          <p className={`mt-2 max-w-2xl text-[15px] leading-relaxed ${ON_SILK_MUTED}`}>
            {active.blurb}
          </p>
        </header>

        <nav aria-label={t('community.sections')} className={`${CARD} flex w-fit flex-wrap gap-1 p-1.5`}>
          {/* `item`, not `t` — the loop variable used to shadow the translation
              function of the same name. */}
          {TABS.map((item) => {
            const on = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-current={on ? 'page' : undefined}
                onClick={() => setTab(item.id)}
                className={`rounded-full px-4 py-2 text-[14px] font-semibold transition-colors ${FOCUS} ${
                  on ? 'bg-[#2B0B2E] text-white' : 'text-[#2B0B2E] hover:bg-[#2B0B2E]/10'
                }`}
              >
                {t(item.labelKey)}
              </button>
            );
          })}
        </nav>

        {tab === 'mentors' && (
          <div className="space-y-6">
            {/* Mentors sign in here. It sat outside the tab switch, so a
                signed-in mentor's private student inbox rendered underneath the
                activities grid and the peer circles too. */}
            <ErrorBoundary label="the mentor console">
              <MentorConsole />
            </ErrorBoundary>

            <ErrorBoundary label="your conversations">
              <ThreadList viewer={viewer} openId={openThread} onOpen={setOpenThread} />
            </ErrorBoundary>

            {/* Keyed by thread: switching mentors resets the draft, the crisis
                notice and the scroll rather than carrying them across. */}
            {openThread && (
              <ErrorBoundary label="this conversation">
                <ThreadRoom
                  key={openThread}
                  roomId={openThread}
                  viewer={viewer}
                  onClose={() => setOpenThread(null)}
                />
              </ErrorBoundary>
            )}

            <ErrorBoundary label="the mentor list">
              <MentorDirectory clerkId={clerkId} onOpen={setOpenThread} />
            </ErrorBoundary>
          </div>
        )}

        {tab === 'community' && (
          <div className="space-y-6">
            {/* Wrapped like every other panel: a render error inside one circle
                used to blank the whole page. */}
            <ErrorBoundary label="the peer circles">
              <GroupList clerkId={clerkId} openId={openGroup} onOpen={(g) => setOpenGroup(g.id)} />

              {/* Keyed by room: switching circles resets the draft, the crisis
                  notice and the scroll position rather than carrying them across. */}
              {openGroup && (
                <GroupRoom
                  key={openGroup}
                  roomId={openGroup}
                  clerkId={clerkId}
                  onClose={() => setOpenGroup(null)}
                />
              )}
            </ErrorBoundary>
          </div>
        )}

        {tab === 'events' && (
          <ErrorBoundary label="the activities board">
            <ActivityBoard clerkId={clerkId} />
          </ErrorBoundary>
        )}

      </div>
    </div>
  );
}
