import { useId, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Check, Flame, LifeBuoy, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { calcStreak } from '@/lib/streak';
import { detectCrisis, HELPLINES } from '@/lib/crisis';
import { MOODS } from './moodInsights';
import {
  greetingFor,
  INTENTION_TAG,
  pickRitual,
  RESOLUTION_COPY,
  RESOLUTIONS,
  resolutionOf,
  SKIES,
  skyNameFor,
  todaysIntention,
  type Resolution,
} from './ritual';

const FOCUS_LIGHT = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80';
const HELPLINE = HELPLINES[0];

/**
 * The hero. One adaptive action per visit: set an intention in the morning,
 * check in during the day, say how the intention went in the evening.
 */
export default function DailyRitual({ clerkId }: { clerkId: string }) {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const inputId = useId();
  const [draft, setDraft] = useState('');
  const enabled = !!clerkId;

  const moodsQuery = useQuery({
    queryKey: ['mood', clerkId],
    queryFn: () => api.getMoodHistory(clerkId),
    enabled,
  });
  const journalQuery = useQuery({
    queryKey: ['journal', clerkId],
    queryFn: () => api.getJournal(clerkId),
    enabled,
  });

  const moods = moodsQuery.data ?? [];
  const journals = journalQuery.data ?? [];

  const invalidateJournal = () => queryClient.invalidateQueries({ queryKey: ['journal', clerkId] });

  const setIntention = useMutation({
    mutationFn: (content: string) =>
      api.createJournal({ clerkId, title: 'Intention', content, tags: [INTENTION_TAG] }),
    onSuccess: () => {
      setDraft('');
      invalidateJournal();
    },
  });

  const resolveIntention = useMutation({
    mutationFn: ({ id, outcome }: { id: string; outcome: Resolution }) =>
      api.updateJournal({ id, clerkId, tags: [INTENTION_TAG, outcome] }),
    onSuccess: invalidateJournal,
  });

  const quickMood = useMutation({
    mutationFn: (emoji: string) => api.saveMood({ clerkId, mood: emoji }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mood', clerkId] }),
  });

  const now = new Date();
  const sky = SKIES[skyNameFor(now)];
  const phase = pickRitual({ moods, journals, now });
  const streak = calcStreak(moods.map((m) => m.createdAt));
  const intention = todaysIntention(journals, now);
  const outcome = resolutionOf(intention);
  const loading = moodsQuery.isLoading || journalQuery.isLoading;

  // The intention field is free text, so screen it the same way chat is screened.
  const crisis = detectCrisis(draft);

  const submitIntention = () => {
    const text = draft.trim();
    if (text && enabled && !setIntention.isPending) setIntention.mutate(text);
  };

  return (
    <section
      aria-label="Today"
      className="relative min-h-[230px] overflow-hidden rounded-[26px] shadow-[0_26px_60px_-30px_rgba(27,36,48,0.55)]"
      style={{ background: sky.gradient }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div
          className="absolute right-[14%] h-64 w-64 rounded-full"
          style={{ background: sky.sun, top: sky.sunTop }}
        />
        <div className="absolute bottom-[52px] left-10 right-10 h-0.5 bg-white/20" />
      </div>

      <div className="relative z-[2] px-6 py-7 text-[#E8ECF3] sm:px-10 sm:py-8">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#AEB8CA]">
            {now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          {streak > 0 && (
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.12em] text-white/70">
              <Flame className="h-3.5 w-3.5" aria-hidden="true" />
              {streak}-DAY STREAK
            </span>
          )}
        </div>

        <h1 className="mt-1.5 font-display text-[34px] leading-none tracking-[-0.02em] sm:text-[44px]">
          {greetingFor(now)}
          {user?.firstName ? `, ${user.firstName}` : ''}
        </h1>

        <div className="mt-4 min-h-[104px]">
          {loading ? (
            <div className="h-[76px] w-full max-w-[560px] animate-pulse rounded-2xl bg-white/10" />
          ) : phase.kind === 'intention' ? (
            <div>
              <label htmlFor={inputId} className="text-[15px] text-[#CBD3E2]">
                What is one thing you want to get through today?
              </label>
              <div className="mt-2.5 flex max-w-[560px] flex-wrap gap-2">
                <input
                  id={inputId}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') submitIntention();
                  }}
                  placeholder="Finish the problem set, call home, get to bed early…"
                  className={`min-w-0 flex-1 rounded-full border border-white/25 bg-white/10 px-4 py-2.5 text-[15px] text-white placeholder:text-white/45 ${FOCUS_LIGHT}`}
                />
                <button
                  type="button"
                  onClick={submitIntention}
                  disabled={!draft.trim() || setIntention.isPending || !enabled}
                  className={`inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[13px] font-semibold text-[#1B2430] disabled:opacity-50 ${FOCUS_LIGHT}`}
                >
                  {setIntention.isPending && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
                  Set intention
                </button>
              </div>
              {crisis && (
                <p className="mt-2.5 flex max-w-[560px] items-start gap-2 text-[13px] text-[#FFD9D2]">
                  <LifeBuoy className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>
                    That sounds really heavy, and you do not have to carry it alone.{' '}
                    <a href={`tel:${HELPLINE.phone.replace(/[^\d+]/g, '')}`} className="underline">
                      {HELPLINE.name} · {HELPLINE.phone}
                    </a>{' '}
                    is free and open right now.
                  </span>
                </p>
              )}
            </div>
          ) : phase.kind === 'checkin' ? (
            <div>
              <p className="text-[15px] text-[#CBD3E2]">
                {intention ? 'Noted. How are you feeling right now?' : 'How are you feeling right now?'}
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {MOODS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => quickMood.mutate(m.emoji)}
                    disabled={quickMood.isPending || !enabled}
                    className={`inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-2 text-[13px] text-white transition-colors hover:bg-white/20 disabled:opacity-50 ${FOCUS_LIGHT}`}
                  >
                    <span aria-hidden="true" className="text-base leading-none">
                      {m.emoji}
                    </span>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          ) : phase.kind === 'reflect' ? (
            <div>
              <p className="text-[15px] text-[#CBD3E2]">This morning you wanted to:</p>
              <p className="mt-1 max-w-[560px] font-display text-[20px] text-white">{phase.entry.content}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-[13px] text-[#CBD3E2]">Did it happen?</span>
                {RESOLUTIONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => resolveIntention.mutate({ id: phase.entry.id, outcome: r })}
                    disabled={resolveIntention.isPending}
                    className={`rounded-full border border-white/25 bg-white/10 px-4 py-2 text-[13px] capitalize text-white transition-colors hover:bg-white/20 disabled:opacity-50 ${FOCUS_LIGHT}`}
                  >
                    {r === 'done' ? 'Yes' : r === 'partly' ? 'Partly' : 'Not today'}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              {intention ? (
                <>
                  <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#AEB8CA]">
                    Today&rsquo;s intention
                  </p>
                  <p className="mt-1 flex max-w-[560px] items-start gap-2 font-display text-[20px] text-white">
                    {outcome === 'done' && <Check className="mt-1.5 h-4 w-4 shrink-0" aria-hidden="true" />}
                    {phaseIntentionText(intention.content)}
                  </p>
                  {outcome && <p className="mt-1 text-[13px] text-[#CBD3E2]">{RESOLUTION_COPY[outcome]}.</p>}
                </>
              ) : (
                <p className="max-w-[520px] text-[15px] text-[#CBD3E2]">
                  You are checked in for today. Nothing else is asked of you here.
                </p>
              )}
            </div>
          )}
        </div>

        <p role="status" aria-live="polite" className="mt-2 min-h-[20px] text-[13px] text-[#CBD3E2]">
          {setIntention.isPending && 'Saving your intention…'}
          {setIntention.isError && `That did not save. Your words are still here — try again.${reasonFor(setIntention.error)}`}
          {quickMood.isPending && 'Saving your check-in…'}
          {quickMood.isError && `That check-in did not save. Try again.${reasonFor(quickMood.error)}`}
          {resolveIntention.isPending && 'Saving…'}
          {resolveIntention.isError && `That did not save. Try again.${reasonFor(resolveIntention.error)}`}
        </p>

        {phase.kind === 'settled' && !intention && (
          <a
            href="#rhythm"
            className={`mt-1 inline-flex items-center gap-1.5 rounded text-[13px] font-semibold text-white/85 hover:underline ${FOCUS_LIGHT}`}
          >
            See your rhythm <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        )}
      </div>
    </section>
  );
}

/**
 * Surface the underlying failure alongside the friendly line. A bare "that did
 * not save" hides the difference between a dead API server, an unsynced user and
 * a validation error — which is exactly what you need to know. The API never puts
 * user content in error messages, so nothing private leaks here.
 */
function reasonFor(error: unknown): string {
  const message = error instanceof Error ? error.message.trim() : '';
  return message ? ` (${message})` : '';
}

/** ponytail: one-line guard so a long intention never blows out the hero. */
function phaseIntentionText(text: string): string {
  return text.length > 120 ? `${text.slice(0, 119)}…` : text;
}
