import { useCallback, useEffect, useRef, useState } from 'react';
import { analyzeJournal, canAnalyze } from '../ai/moodAnalysis';
import type { MoodAnalysis } from '../types';

/**
 * Reads the entry's mood on its own, a beat after the save lands.
 *
 * The loop this has to survive: the analysis is written back into the document,
 * which makes the document dirty, which saves again, which reports 'saved'
 * again. Re-triggering on that second 'saved' would be an endless chain of
 * Gemini calls against a 20/min limit.
 *
 * The break is that nothing here watches the document. It watches the
 * normalised TEXT, and remembers the last text it sent in a ref. The save
 * caused by writing the mood back carries the same text, so the guard matches
 * and the chain stops on its first link.
 */

export type AutoMoodState = 'idle' | 'waiting' | 'running' | 'done' | 'error' | 'too-short';

/** Long enough that a pause mid-sentence is not mistaken for a finished thought. */
const SETTLE_MS = 4000;

/** Whitespace and case are not a change of mind. */
const normalise = (text: string): string => text.replace(/\s+/g, ' ').trim().toLowerCase();

export interface UseAutoMoodOptions {
  clerkId: string;
  text: string;
  /** True when useAutosave reports 'saved'. */
  saved: boolean;
  /** The analysis already on the entry, if it has one. */
  current?: MoodAnalysis;
  onMood: (mood: MoodAnalysis) => void;
}

export interface AutoMood {
  state: AutoMoodState;
  /** Why the last attempt failed. Never the entry, never the analysis. */
  error?: string;
  /** Explicit re-run, from the button. Ignores the changed-text guard. */
  runNow: () => void;
}

export function useAutoMood({
  clerkId,
  text,
  saved,
  current,
  onMood,
}: UseAutoMoodOptions): AutoMood {
  const [state, setState] = useState<AutoMoodState>('idle');
  const [error, setError] = useState<string | undefined>(undefined);

  /**
   * The last text sent, normalised. Set before the request, not after, so a
   * failure is one attempt and not a retry loop. An entry that arrives with a
   * mood already on it counts as read, so opening old entries costs nothing.
   */
  const attempted = useRef<string | null>(current ? normalise(text) : null);
  const running = useRef(false);
  const alive = useRef(true);
  useEffect(
    () => () => {
      alive.current = false;
    },
    [],
  );

  // No dep array: mirrors the current props after every commit, so a timer that
  // fires later always reads what is on screen now.
  const latest = useRef({ clerkId, text, onMood });
  useEffect(() => {
    latest.current = { clerkId, text, onMood };
  });

  const run = useCallback(async (force: boolean): Promise<void> => {
    const job = latest.current;
    if (!job.clerkId || running.current) return;
    if (!canAnalyze(job.text)) {
      setState('too-short');
      return;
    }
    const key = normalise(job.text);
    if (!force && key === attempted.current) return;

    attempted.current = key;
    running.current = true;
    setState('running');
    setError(undefined);
    try {
      // `crisis` is dropped deliberately: MoodReport rescans the live text with
      // the same lexicon on every render, so the helplines never depend on a
      // request landing.
      const { crisis: _crisis, ...mood } = await analyzeJournal(job.clerkId, job.text);
      if (!alive.current) return;
      latest.current.onMood(mood);
      setState('done');
    } catch (err) {
      if (!alive.current) return;
      // Surfaced, never thrown, never retried on its own.
      setError(err instanceof Error ? err.message : 'Could not read this entry just now.');
      setState('error');
    } finally {
      running.current = false;
    }
  }, []);

  useEffect(() => {
    if (!saved || !clerkId) return;
    if (!canAnalyze(text)) {
      if (!running.current) setState('too-short');
      return;
    }
    if (normalise(text) === attempted.current) return; // the loop breaker
    setState('waiting');
    const timer = setTimeout(() => void run(false), SETTLE_MS);
    return () => clearTimeout(timer);
  }, [saved, clerkId, text, run]);

  return { state, error, runNow: useCallback(() => void run(true), [run]) };
}
