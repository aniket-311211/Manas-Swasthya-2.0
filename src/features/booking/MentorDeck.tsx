import { useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'motion/react';
import { AlertCircle, ChevronLeft, ChevronRight, RefreshCcw, Star } from 'lucide-react';
import { api } from '@/lib/api';
import type { Mentor } from '@/types/api';
import { BTN_QUIET, BTN_SOLID, CARD, FOCUS, INK, MUTED, ON_SILK, ON_SILK_PILL, initials } from './booking';

/**
 * The consultant deck: a horizontally snapping rail, filtered by speciality,
 * rather than a wall of identical cards. Scroll-snap is CSS — no carousel
 * dependency, no JS animation loop, and it stays a plain scroll container for
 * anyone using a trackpad, a touch screen or a keyboard.
 *
 * There are no placeholder faces here on purpose. A real photo when the mentor
 * has one, and their initials on a coloured tile when they do not. A stock
 * emoji doctor tells you nothing about the person you are about to talk to.
 */

/** Stable per-name tile colours. Dark enough that white sits at 7:1 or better. */
const TILES: [string, string][] = [
  ['#2F4858', '#4A6E7E'],
  ['#3A3F58', '#5A5F80'],
  ['#1F4B43', '#356F63'],
  ['#4A3350', '#6E4E76'],
  ['#4A3A28', '#71583C'],
  ['#243C5A', '#3C5D85'],
];

function tileFor(name: string): [string, string] {
  let sum = 0;
  for (const ch of name ?? '') sum += ch.charCodeAt(0);
  return TILES[sum % TILES.length];
}

const isImageUrl = (v: string | null): v is string =>
  !!v && (/^https?:\/\//i.test(v) || v.startsWith('/') || v.startsWith('data:image/'));

const STATUS: Record<Mentor['status'], { label: string; dot: string; ink: string }> = {
  online: { label: 'Available now', dot: 'bg-[#146356]', ink: 'text-[#146356]' },
  away: { label: 'Away today', dot: 'bg-[#8A5A00]', ink: 'text-[#8A5A00]' },
  offline: { label: 'Replies later', dot: 'bg-[#5A6472]', ink: 'text-[#5A6472]' },
};

function Monogram({ mentor }: { mentor: Mentor }) {
  const [broken, setBroken] = useState(false);
  const [from, to] = tileFor(mentor.name);

  if (isImageUrl(mentor.avatar) && !broken) {
    return (
      <img
        src={mentor.avatar}
        alt=""
        onError={() => setBroken(true)}
        className="h-14 w-14 shrink-0 rounded-2xl object-cover"
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl font-display text-[19px] tracking-wide text-white"
    >
      {initials(mentor.name)}
    </span>
  );
}

function MentorCard({
  mentor,
  selected,
  index,
  onSelect,
}: {
  mentor: Mentor;
  selected: boolean;
  index: number;
  onSelect: (m: Mentor) => void;
}) {
  const reduceMotion = useReducedMotion();
  const status = STATUS[mentor.status] ?? STATUS.offline;

  return (
    <motion.li
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: reduceMotion ? 0 : Math.min(index, 6) * 0.03 }}
      className={`w-[19rem] shrink-0 snap-center ${CARD} p-5 ${
        selected ? 'ring-2 ring-[#1B2430]' : ''
      }`}
    >
      <div className="flex items-start gap-3.5">
        <Monogram mentor={mentor} />
        <div className="min-w-0 flex-1">
          <h3 className={`truncate font-display text-[19px] leading-tight ${INK}`}>{mentor.name}</h3>
          <p className={`mt-0.5 line-clamp-2 text-[13px] ${MUTED}`}>
            {mentor.specialization ?? 'General wellbeing support'}
          </p>
        </div>
      </div>

      <div className="mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className={`inline-flex items-center gap-1 text-[13px] font-semibold ${INK}`}>
          <Star className="h-3.5 w-3.5 fill-[#1B2430]" aria-hidden="true" />
          {(mentor.rating ?? 0).toFixed(1)}
          <span className={`font-normal ${MUTED}`}>
            · {mentor.totalSessions ?? 0} session{mentor.totalSessions === 1 ? '' : 's'}
          </span>
        </span>
        {mentor.badge && (
          <span className="rounded-full border border-[#1B2430]/20 bg-white/70 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#1B2430]">
            {mentor.badge}
          </span>
        )}
      </div>

      {/* The dot is decoration; the words carry the meaning. */}
      <p className={`mt-2.5 flex items-center gap-1.5 text-[12px] font-medium ${status.ink}`}>
        <span aria-hidden="true" className={`h-2 w-2 rounded-full ${status.dot}`} />
        {status.label}
      </p>

      {mentor.bio && <p className={`mt-3 line-clamp-3 text-[13px] leading-relaxed ${MUTED}`}>{mentor.bio}</p>}

      <button type="button" onClick={() => onSelect(mentor)} className={`${BTN_SOLID} mt-4 w-full`}>
        {selected ? 'Selected' : 'Book with ' + mentor.name.split(' ')[0]}
      </button>
    </motion.li>
  );
}

function Skeleton() {
  return (
    <li className={`w-[19rem] shrink-0 snap-center ${CARD} p-5`} aria-hidden="true">
      <div className="flex items-start gap-3.5">
        <span className="h-14 w-14 shrink-0 animate-pulse rounded-2xl bg-[#1B2430]/10" />
        <div className="flex-1 space-y-2 pt-1">
          <span className="block h-4 w-3/4 animate-pulse rounded bg-[#1B2430]/10" />
          <span className="block h-3 w-1/2 animate-pulse rounded bg-[#1B2430]/10" />
        </div>
      </div>
      <span className="mt-5 block h-3 w-full animate-pulse rounded bg-[#1B2430]/10" />
      <span className="mt-2 block h-3 w-2/3 animate-pulse rounded bg-[#1B2430]/10" />
      <span className="mt-5 block h-10 w-full animate-pulse rounded-full bg-[#1B2430]/10" />
    </li>
  );
}

export default function MentorDeck({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (m: Mentor) => void;
}) {
  const reduceMotion = useReducedMotion();
  const rail = useRef<HTMLUListElement>(null);
  const [filter, setFilter] = useState<string>('all');

  const { data: mentors, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['mentors'],
    queryFn: () => api.getMentors(),
  });

  const specialities = useMemo(() => {
    const seen = new Set<string>();
    for (const m of mentors ?? []) if (m.specialization) seen.add(m.specialization);
    return [...seen].sort();
  }, [mentors]);

  const shown = useMemo(
    () => (filter === 'all' ? (mentors ?? []) : (mentors ?? []).filter((m) => m.specialization === filter)),
    [mentors, filter],
  );

  // One card plus its gap. Reading the first child keeps this honest if the
  // card width ever changes.
  const nudge = (dir: 1 | -1) => {
    const el = rail.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const step = card ? card.offsetWidth + 16 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step, behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  return (
    <section aria-labelledby="deck-heading" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="deck-heading" className={`${ON_SILK_PILL} font-display text-[24px] leading-tight ${ON_SILK}`}>
            Who you could talk to
          </h2>
          <p className={`mt-1 text-[14px] ${ON_SILK}`}>
            Swipe the deck or use the arrows. Pick anyone — the sheet below opens with them in it.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => nudge(-1)} className={`${BTN_QUIET} h-10 w-10 !px-0`}>
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Scroll to earlier consultants</span>
          </button>
          <button type="button" onClick={() => nudge(1)} className={`${BTN_QUIET} h-10 w-10 !px-0`}>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Scroll to more consultants</span>
          </button>
        </div>
      </div>

      {specialities.length > 1 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter consultants by speciality">
          {['all', ...specialities].map((s) => {
            const on = filter === s;
            return (
              <button
                key={s}
                type="button"
                aria-pressed={on}
                onClick={() => setFilter(s)}
                className={`rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors ${FOCUS} ${
                  on
                    ? 'border-[#1B2430] bg-[#1B2430] text-white'
                    : 'border-[#1B2430]/20 bg-white/60 text-[#1B2430] hover:bg-white'
                }`}
              >
                {s === 'all' ? `Everyone (${mentors?.length ?? 0})` : s}
              </button>
            );
          })}
        </div>
      )}

      {isError && (
        <div className={`${CARD} p-6`} role="alert">
          <p className={`flex items-start gap-2 text-[15px] font-semibold text-[#9B1C1C]`}>
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            We could not load the consultants.
          </p>
          <p className={`mt-1.5 text-[14px] ${MUTED}`}>
            {error instanceof Error ? error.message : 'Something went wrong on the way to the server.'}
          </p>
          <button type="button" onClick={() => void refetch()} className={`${BTN_QUIET} mt-4`} disabled={isFetching}>
            <RefreshCcw className="h-4 w-4" aria-hidden="true" /> {isFetching ? 'Trying…' : 'Try again'}
          </button>
        </div>
      )}

      {!isError && !isPending && shown.length === 0 && (
        <div className={`${CARD} p-6`}>
          <p className={`text-[15px] font-semibold ${INK}`}>
            {filter === 'all' ? 'No consultants are listed yet.' : `Nobody is listed under ${filter}.`}
          </p>
          <p className={`mt-1.5 text-[14px] ${MUTED}`}>
            {filter === 'all'
              ? 'The team is still being set up. Check back shortly, or write to us about joining it.'
              : 'Try another speciality, or look at everyone.'}
          </p>
          {filter !== 'all' && (
            <button type="button" onClick={() => setFilter('all')} className={`${BTN_QUIET} mt-4`}>
              Show everyone
            </button>
          )}
        </div>
      )}

      {!isError && (isPending || shown.length > 0) && (
        <ul
          ref={rail}
          tabIndex={0}
          aria-label="Consultants"
          aria-busy={isPending}
          className={`flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:thin] ${FOCUS}`}
        >
          {isPending
            ? [0, 1, 2].map((i) => <Skeleton key={i} />)
            : shown.map((m, i) => (
                <MentorCard
                  key={m.id}
                  mentor={m}
                  index={i}
                  selected={m.id === selectedId}
                  onSelect={onSelect}
                />
              ))}
        </ul>
      )}
    </section>
  );
}
