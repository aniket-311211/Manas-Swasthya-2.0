import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { JournalEntry } from '@/types/api';
import { encodeDoc } from '../doc';
import { JOURNAL_TAG, type JournalDoc } from '../types';

/**
 * Debounced save of the encoded journal document.
 *
 * ponytail: no mutation library, no offline queue, no optimistic cache write.
 * One timer, one in-flight guard, one invalidate of ['journal', clerkId] — the
 * key the dashboard and chat already read.
 */

export type SaveStatus = 'idle' | 'unsaved' | 'saving' | 'saved' | 'failed';

const DEBOUNCE_MS = 1200;

export interface UseAutosaveOptions {
  clerkId: string;
  /** Undefined for a new entry; set once the first create returns. */
  entryId?: string;
  /** Selected local calendar day for a new entry. */
  entryDate?: string;
  title: string;
  doc: JournalDoc;
  onSaved: (row: JournalEntry) => void;
}

export interface Autosave {
  status: SaveStatus;
  /** Server message for a failed save. Null otherwise. */
  error: string | null;
  /** Flush immediately — the retry button and the close-the-editor path. */
  saveNow: () => void;
}

export function useAutosave({
  clerkId,
  entryId,
  entryDate,
  title,
  doc,
  onSaved,
}: UseAutosaveOptions): Autosave {
  const queryClient = useQueryClient();

  const content = encodeDoc(doc);
  const key = `${title}\u0000${content}`;

  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');
  const [error, setError] = useState<string | null>(null);
  /** The payload the server has acknowledged. An opened entry starts in sync. */
  const [savedKey, setSavedKey] = useState<string | null>(entryId ? key : null);

  const idRef = useRef(entryId);
  const inFlight = useRef(false);
  const queued = useRef(false);
  const latest = useRef({ title, content, key, onSaved });
  // No dep array: mirrors the current payload after every commit, so the
  // debounce timer and any chained save always send what is on screen.
  useEffect(() => {
    latest.current = { title, content, key, onSaved };
  });

  const save = useCallback(
    async function save(): Promise<void> {
      if (!clerkId) return;
      if (inFlight.current) {
        // A newer draft arrived mid-request; run it when this one lands.
        queued.current = true;
        return;
      }
      const job = latest.current;
      inFlight.current = true;
      setState('saving');
      setError(null);
      try {
        const row = idRef.current
          ? await api.updateJournal({
              id: idRef.current,
              clerkId,
              title: job.title.trim() || null,
              content: job.content,
              tags: [JOURNAL_TAG],
            })
          : await api.createJournal({
              clerkId,
              title: job.title.trim() || null,
              content: job.content,
              tags: [JOURNAL_TAG],
              entryDate,
            });
        idRef.current = row.id;
        setSavedKey(job.key);
        setState('saved');
        job.onSaved(row);
        void queryClient.invalidateQueries({ queryKey: ['journal', clerkId] });
      } catch (err) {
        setState('failed');
        setError(
          err instanceof Error ? err.message : 'Could not reach the server to save this entry.',
        );
        // Never auto-retry a failure in a loop; the writer retries explicitly
        // or the next keystroke schedules a fresh attempt.
        queued.current = false;
      } finally {
        inFlight.current = false;
        if (queued.current) {
          queued.current = false;
          void save();
        }
      }
    },
    [clerkId, entryDate, queryClient],
  );

  const dirty = key !== savedKey;
  const blank = !doc.text.trim() && doc.stickers.length === 0 && doc.media.length === 0;

  useEffect(() => {
    if (!dirty || !clerkId) return;
    // Never create a row for an entry nobody has written in yet.
    if (blank && !idRef.current) return;
    const timer = setTimeout(() => void save(), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [dirty, blank, clerkId, key, save]);

  // Closing the tab mid-draft is the one loss this hook cannot recover from.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ''; // still required by Safari and older Chrome
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const status: SaveStatus =
    state === 'saving' ? 'saving' : state === 'failed' ? 'failed' : dirty ? 'unsaved' : savedKey ? 'saved' : 'idle';

  return { status, error, saveNow: useCallback(() => void save(), [save]) };
}
