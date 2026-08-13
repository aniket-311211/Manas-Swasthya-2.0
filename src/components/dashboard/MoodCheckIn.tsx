import { useId, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Check, Loader2 } from 'lucide-react';
import { MOODS } from './moodInsights';
import { api } from '@/lib/api';
import { GLASS } from '@/components/shell/theme';

/**
 * Full 1B editorial restyle of the Today check-in. Behaviour is unchanged from
 * the original: select a mood, optional note, save via the same mutation, and
 * the ['mood'] query is invalidated so the rhythm + streak refresh.
 */
export default function MoodCheckIn({ clerkId }: { clerkId: string }) {
  const queryClient = useQueryClient();
  const noteId = useId();
  const [selected, setSelected] = useState<number | null>(null);
  const [note, setNote] = useState('');

  const save = useMutation({
    mutationFn: (value: number) =>
      api.saveMood({
        clerkId,
        mood: MOODS.find((m) => m.value === value)?.emoji ?? '😐',
        notes: note.trim() || null,
      }),
    onSuccess: () => {
      setNote('');
      queryClient.invalidateQueries({ queryKey: ['mood', clerkId] });
    },
  });

  const clearStatus = () => {
    if (!save.isIdle) save.reset();
  };

  const submit = () => {
    if (selected !== null && clerkId) save.mutate(selected);
  };

  const status = save.isPending
    ? 'Saving your check-in…'
    : save.isSuccess
      ? 'Saved. Today’s check-in is recorded.'
      : save.isError
        ? 'Not saved. Your check-in is still here — try again.'
        : '';

  return (
    <div className={`h-full ${GLASS} p-6`}>
      <h2 className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#8A93A3]">How are you feeling now?</h2>

      <div className="mt-3 flex flex-wrap gap-2.5">
        {MOODS.map((m) => {
          const isSelected = selected === m.value;
          return (
            <button
              key={m.value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => {
                setSelected(m.value);
                clearStatus();
              }}
              className={`relative min-w-[4.25rem] flex-1 rounded-[14px] border py-3 text-center text-2xl transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E3A59] motion-reduce:transform-none ${
                isSelected ? 'border-2 border-[#2E3A59] bg-white/85' : 'border-white/70 bg-white/55'
              }`}
            >
              {isSelected && <Check aria-hidden="true" className="absolute right-1.5 top-1.5 h-3.5 w-3.5 text-[#2E3A59]" />}
              <span aria-hidden="true" className="leading-none">{m.emoji}</span>
              <span className={`mt-1 block text-[11px] ${isSelected ? 'font-semibold text-[#2E3A59]' : 'text-[#8A93A3]'}`}>{m.label}</span>
            </button>
          );
        })}
      </div>

      <label htmlFor={noteId} className="sr-only">Add a note (optional)</label>
      <textarea
        id={noteId}
        value={note}
        onChange={(e) => {
          setNote(e.target.value);
          clearStatus();
        }}
        placeholder="Add a note (optional) — anything you want to remember about today?"
        className="mt-3.5 min-h-[60px] w-full resize-y rounded-[12px] border border-white/70 bg-white/70 px-3.5 py-3 text-sm text-[#1B2430] focus:border-[#2E3A59] focus:outline-none focus:ring-2 focus:ring-[#2E3A59]/20"
      />

      <div className="mt-3.5 flex flex-wrap items-center gap-3.5">
        <button
          type="button"
          onClick={submit}
          disabled={selected === null || save.isPending || !clerkId}
          className="inline-flex items-center rounded-full bg-[#1B2430] px-5 py-2.5 text-sm font-semibold text-white transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E3A59] focus-visible:ring-offset-2 disabled:opacity-50"
        >
          {save.isPending && <Loader2 aria-hidden="true" className="mr-2 h-4 w-4 animate-spin" />}
          {save.isPending ? 'Saving…' : 'Save check-in'}
        </button>

        {save.isError && (
          <button type="button" onClick={submit} className="rounded-full border border-[#E4E7EE] px-4 py-2 text-sm text-[#1B2430] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E3A59]">
            Retry
          </button>
        )}

        {save.isSuccess && <Check aria-hidden="true" className="h-4 w-4 text-[#2E3A59]" />}
        {save.isError && <AlertTriangle aria-hidden="true" className="h-4 w-4 text-[#C0533F]" />}

        <p role="status" aria-live="polite" className={`text-sm ${save.isError ? 'text-[#C0533F]' : save.isSuccess ? 'text-[#2E3A59]' : 'text-[#5A6472]'}`}>
          {status}
        </p>
      </div>
    </div>
  );
}
