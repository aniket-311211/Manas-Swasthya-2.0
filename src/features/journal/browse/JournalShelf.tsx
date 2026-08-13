import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, NotebookPen, Plus, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { EYEBROW, GLASS, GLASS_SOLID } from '@/components/shell/theme';
import { INTENTION_TAG } from '@/components/dashboard/ritual';
import { buildStats, isJournalRow, localDayKey, toView } from '../doc';
import type { JournalEntryView } from '../types';
import CalendarHeat from './CalendarHeat';
import EntryCard, { CARD_MIN_H } from './EntryCard';
import StatsBar from './StatsBar';
import MoodIndexCard from './MoodIndexCard';
import { computeMoodIndex, toMoodPoints } from '../moodIndex';

/**
 * The shelf owns the journal read model.
 *
 * The `['journal', clerkId]` key is shared with the dashboard and chat, so this
 * reads the same rows they do — including the dashboard's daily intentions,
 * which are journal rows by storage but not journal entries by intent. They are
 * filtered out here; everything else (rich docs and older plain-text rows) is
 * an entry.
 *
 * ponytail: the delete confirm is a native <dialog>. showModal() gives the
 * focus trap, the Escape key and the inert backdrop for free.
 */

const GRID = 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3';
const BTN =
  'inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E3A59]';

export default function JournalShelf({
  clerkId,
  onOpen,
  onNew,
}: {
  clerkId: string;
  onOpen: (entry: JournalEntryView) => void;
  onNew: (dayKey?: string) => void;
}) {
  const headingId = useId();
  const confirmId = useId();
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState<JournalEntryView | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const { data: rows = [], isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['journal', clerkId],
    queryFn: () => api.getJournal(clerkId),
    enabled: !!clerkId,
  });

  const entries = useMemo(
    () =>
      rows
        .filter((row) => isJournalRow(row) || !(row.tags ?? []).includes(INTENTION_TAG))
        .map(toView)
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [rows],
  );
  const stats = useMemo(() => buildStats(entries), [entries]);
  // Recomputed from every analysed entry, so it moves as they write.
  const moodIndex = useMemo(() => computeMoodIndex(toMoodPoints(entries)), [entries]);
  // A disabled query is not "loading" in v5, so an absent clerkId would flash the empty state.
  const busy = isLoading || !clerkId;

  const remove = useMutation({
    mutationFn: (entry: JournalEntryView) => api.deleteJournal(entry.id, clerkId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['journal', clerkId] });
      setConfirming(null); // only on success — a failed delete keeps the dialog and says so
    },
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (confirming && !dialog.open) dialog.showModal();
    else if (!confirming && dialog.open) dialog.close();
  }, [confirming]);

  const pickDay = (dayKey: string) => {
    const existing = entries.find((e) => localDayKey(e.createdAt) === dayKey);
    if (existing) onOpen(existing);
    else onNew(dayKey);
  };

  return (
    <div className="flex flex-col gap-5">
      {!busy && !isError && (
        <>
          <MoodIndexCard index={moodIndex} streak={stats.streak} />
          <StatsBar stats={stats} />
          <CalendarHeat entries={entries} onPickDay={pickDay} />
        </>
      )}

      <section aria-labelledby={headingId} className={`${GLASS_SOLID} p-4 sm:p-6`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E4E7EE] pb-3">
          <h2 id={headingId} className="font-display text-[20px] text-[#1B2430]">
            Your shelf
          </h2>
          <button type="button" onClick={() => onNew()} className={`${BTN} bg-[#2E3A59] text-white`}>
            <Plus aria-hidden="true" className="h-4 w-4" />
            New entry
          </button>
        </div>

        <p role="status" className="min-h-[1.25rem] pt-2 text-[13px] text-[#5A6472]">
          {remove.isSuccess ? 'Entry deleted.' : ''}
        </p>

        {busy ? (
          <>
            <p className="sr-only">Loading your entries…</p>
            <div className={`${GRID} mt-2`} aria-hidden="true" aria-busy="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className={`${CARD_MIN_H} animate-pulse rounded-[20px] bg-[#E9ECF2]`} />
              ))}
            </div>
          </>
        ) : isError ? (
          <div className="mt-2 flex flex-col items-start gap-3 py-6">
            <p className="text-sm text-[#5A6472]">
              We could not load your journal right now. Nothing has been lost — your entries are still saved.
            </p>
            <button
              type="button"
              onClick={() => void refetch()}
              disabled={isFetching}
              className={`${BTN} border border-[#E4E7EE] bg-white text-[#1B2430]`}
            >
              <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
              {isFetching ? 'Retrying…' : 'Retry'}
            </button>
          </div>
        ) : entries.length === 0 ? (
          <div className={`${GLASS} mt-4 flex flex-col items-start gap-3 p-6`}>
            <NotebookPen aria-hidden="true" className="h-6 w-6 text-[#2E3A59]" />
            <p className={EYEBROW}>Nothing on the shelf yet</p>
            <p className="max-w-prose text-[14px] text-[#5A6472]">
              This is yours alone. Write a line about today — how it went, what is sitting heavy, what made you
              laugh. There is no right length and no one marking it.
            </p>
            <button type="button" onClick={() => onNew()} className={`${BTN} bg-[#2E3A59] text-white`}>
              <Plus aria-hidden="true" className="h-4 w-4" />
              Write your first entry
            </button>
          </div>
        ) : (
          <ul className={`${GRID} mt-2 list-none p-0`}>
            {entries.map((entry) => (
              <li key={entry.id} className="min-w-0">
                <EntryCard
                  entry={entry}
                  onOpen={onOpen}
                  onDelete={(target) => {
                    remove.reset(); // clear the last result so old feedback never reads as this one's
                    setConfirming(target);
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <dialog
        ref={dialogRef}
        aria-labelledby={confirmId}
        onClose={() => setConfirming(null)}
        className="m-auto w-[min(92vw,26rem)] rounded-[20px] border border-white/60 bg-white p-6 text-[#1B2430] shadow-[0_24px_60px_-28px_rgba(27,36,48,0.55)] backdrop:bg-[#1B2430]/40"
      >
        {confirming && (
          <>
            <h2 id={confirmId} className="font-display text-[18px]">
              Delete this entry?
            </h2>
            <p className="mt-2 text-[13.5px] text-[#5A6472]">
              &ldquo;{confirming.title?.trim() || new Date(confirming.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}
              &rdquo; will be gone for good. This cannot be undone.
            </p>
            <p role="status" className="min-h-[1.25rem] pt-2 text-[13px] text-[#C0533F]">
              {remove.isPending ? 'Deleting…' : remove.isError ? 'That did not delete. Your entry is still here — try again.' : ''}
            </p>
            <div className="mt-3 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirming(null)}
                className={`${BTN} border border-[#E4E7EE] bg-white text-[#1B2430]`}
              >
                Keep it
              </button>
              <button
                type="button"
                onClick={() => remove.mutate(confirming)}
                disabled={remove.isPending}
                className={`${BTN} bg-[#C0533F] text-white disabled:opacity-70`}
              >
                {remove.isPending && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
                Delete entry
              </button>
            </div>
          </>
        )}
      </dialog>
    </div>
  );
}
