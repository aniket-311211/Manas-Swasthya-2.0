import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { INTENTION_TAG } from './ritual';
import { sortByCreatedAt } from './moodInsights';
import { GLASS_SOLID, EYEBROW, FOCUS } from '@/components/shell/theme';
// Rich journal entries store JSON in `content`; plainText unwraps them so this
// card never renders a serialised document at someone.
import { plainText } from '@/features/journal/doc';

const cardBase = `${GLASS_SOLID} p-6`;
const eyebrow = EYEBROW;
const focusRing = FOCUS;
const accents = ['#2E3A59', '#B08D57'];

function stamp(iso: string): string {
  const d = new Date(iso);
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOfDay(new Date()) - startOfDay(d)) / 86400000);
  if (days === 0) return `Today · ${d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}`;
  if (days === 1) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function Header() {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className={eyebrow}>Quick thoughts</h2>
      <Link to="/journal" className={`rounded text-[13px] font-semibold text-[#2E3A59] ${focusRing}`}>
        + New
      </Link>
    </div>
  );
}

export default function QuickThoughtsCard({ clerkId }: { clerkId: string }) {
  const { data: entries = [], isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['journal', clerkId],
    queryFn: () => api.getJournal(clerkId),
    enabled: !!clerkId,
  });

  if (isLoading) {
    return (
      <div className={cardBase}>
        <Header />
        <div aria-hidden="true" className="animate-pulse space-y-4">
          {accents.map((c) => (
            <div key={c} className="border-l-[3px] border-[#E4E7EE] pl-3">
              <div className="h-3.5 w-5/6 rounded bg-[#EEF0F5]" />
              <div className="mt-2 h-3 w-1/3 rounded bg-[#EEF0F5]" />
            </div>
          ))}
        </div>
        <span className="sr-only">Loading your journal…</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={cardBase}>
        <Header />
        <p role="status" className="text-[13px] leading-[1.5] text-[#5A6472]">
          We could not load your journal right now.
        </p>
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          className={`mt-3.5 rounded-full border border-[#E4E7EE] px-3 py-1.5 text-[13px] font-semibold text-[#2E3A59] disabled:opacity-60 ${focusRing}`}
        >
          {isFetching ? 'Retrying…' : 'Retry'}
        </button>
      </div>
    );
  }

  // Intentions are stored in the same table as journal entries but they are a
  // different thing — the shelf at /journal filters them out, so leaving them
  // in here made the card read "Intention / Intention" after the morning
  // ritual, with a "Write one →" link to a page where they do not appear.
  const written = entries.filter((e) => !(e.tags ?? []).includes(INTENTION_TAG));
  const latest = sortByCreatedAt(written).slice(-2).reverse();

  if (latest.length === 0) {
    return (
      <div className={cardBase}>
        <Header />
        <p className="text-[13px] leading-[1.5] text-[#5A6472]">
          Your first journal entry will appear here.
        </p>
        <Link to="/journal" className={`mt-3.5 inline-block rounded text-[13px] font-semibold text-[#2E3A59] ${focusRing}`}>
          Write one →
        </Link>
      </div>
    );
  }

  return (
    <div className={cardBase}>
      <Header />
      {latest.map((entry, i) => (
        <div
          key={entry.id}
          className={`min-w-0 border-l-[3px] pl-3 ${i > 0 ? 'mt-3' : ''}`}
          style={{ borderColor: accents[i % accents.length] }}
        >
          <p className="line-clamp-2 text-[13.5px] leading-[1.45] text-[#1B2430]">
            {entry.title?.trim() || plainText(entry.content)}
          </p>
          <span className="font-mono text-[11px] text-[#8A93A3]">{stamp(entry.createdAt)}</span>
        </div>
      ))}
    </div>
  );
}
