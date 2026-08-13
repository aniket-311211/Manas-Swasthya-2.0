import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { AlertTriangle, BookOpen, Check, Loader2, PenLine } from 'lucide-react';
import { EYEBROW, GLASS_SOLID } from '@/components/shell/theme';
import type { JournalEntry } from '@/types/api';
import { emptyDoc, readingMinutes, wordCount } from '../doc';
import { paperStyleWithPrefs, themeOf } from '../themes';
import { useJournalPrefs } from '../prefs';
import { applyMark, markForShortcut, type Mark, type Selection } from '../markdown';
import FormatToolbar from './FormatToolbar';
import MarkdownView from '../MarkdownView';
import { useAutoMood } from './useAutoMood';
import type { JournalDoc, JournalEntryView, MediaRef, PlacedSticker, ThemeId } from '../types';
import AudioClips from './AudioClips';
import PhotoStrip from './PhotoStrip';
import StickerLayer from './StickerLayer';
import { useAutosave, type SaveStatus } from './useAutosave';
import MoodReport from '../ai/MoodReport';

/**
 * The writing surface.
 *
 * ponytail: a plain <textarea> on a styled sheet, not a rich-text engine. The
 * document model stores `text: string`, so anything more would be a formatting
 * layer with nowhere to save itself. The 3D is transform-only — the sheet lifts
 * and flattens on focus and never moves the text it sits under.
 *
 * The editor owns the document. Re-open a different entry with a
 * `key={entry?.id ?? 'new'}` so the draft state starts fresh.
 */

export interface JournalEditorProps {
  clerkId: string;
  /** Existing row being edited, or undefined for a new entry. */
  entry?: JournalEntryView;
  /** Local calendar day selected for a new entry. */
  entryDate?: string;
  onSaved: (row: JournalEntry) => void;
  onClose: () => void;
  /**
   * Sticker chosen in the palette. The editor places it, then calls
   * onStickerPlaced so the palette can clear its selection.
   */
  pendingStickerId?: string | null;
  onStickerPlaced?: () => void;
  /** Theme picked outside the editor. Falls back to the entry's own theme. */
  theme?: ThemeId;
}

const SAVE_UI: Record<SaveStatus, { label: string; Icon: typeof Check; tone: string }> = {
  idle: { label: 'Nothing to save yet', Icon: PenLine, tone: '#8A93A3' },
  unsaved: { label: 'Unsaved changes', Icon: PenLine, tone: '#F8F6EE' },
  saving: { label: 'Saving…', Icon: Loader2, tone: '#5A6472' },
  saved: { label: 'Saved', Icon: Check, tone: '#2E3A59' },
  failed: { label: 'Not saved', Icon: AlertTriangle, tone: '#C0533F' },
};

const BUTTON =
  'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E3A59]';

export default function JournalEditor({
  clerkId,
  entry,
  entryDate,
  onSaved,
  onClose,
  pendingStickerId,
  onStickerPlaced,
  theme: themeId,
}: JournalEditorProps) {
  const [doc, setDoc] = useState<JournalDoc>(() => entry?.doc ?? emptyDoc(themeId));
  const [title, setTitle] = useState(entry?.title ?? '');
  const [writing, setWriting] = useState(false);
  const reduceMotion = useReducedMotion();

  const [prefs] = useJournalPrefs();
  const theme = themeOf(doc.theme);
  const textRef = useRef<HTMLTextAreaElement>(null);
  // applyMark hands back the range that should stay selected; the textarea only
  // honours it after React has committed the new value.
  const [nextSel, setNextSel] = useState<Selection | null>(null);
  // Without a read mode the Markdown renderer has no consumer and formatting
  // is invisible — you would only ever see the asterisks you typed.
  const [reading, setReading] = useState(false);
  const { status, error, saveNow } = useAutosave({
    clerkId,
    entryId: entry?.id,
    entryDate,
    title,
    doc,
    onSaved,
  });

  // The theme picker lives outside the editor; the document still owns the value.
  useEffect(() => {
    if (themeId) setDoc((d) => (d.theme === themeId ? d : { ...d, theme: themeId }));
  }, [themeId]);

  const photos = useMemo(() => doc.media.filter((m) => m.kind === 'photo'), [doc.media]);
  const clips = useMemo(() => doc.media.filter((m) => m.kind === 'audio'), [doc.media]);

  const addMedia = useCallback(
    (ref: MediaRef) => setDoc((d) => ({ ...d, media: [...d.media, ref] })),
    [],
  );
  const removeMedia = useCallback(
    (id: string) => setDoc((d) => ({ ...d, media: d.media.filter((m) => m.id !== id) })),
    [],
  );
  const setStickers = useCallback(
    (stickers: PlacedSticker[]) => setDoc((d) => ({ ...d, stickers })),
    [],
  );

  useLayoutEffect(() => {
    if (!nextSel || !textRef.current) return;
    textRef.current.focus();
    textRef.current.setSelectionRange(nextSel.start, nextSel.end);
    setNextSel(null);
  }, [nextSel]);

  const format = useCallback((mark: Mark) => {
    const el = textRef.current;
    if (!el) return;
    const result = applyMark(el.value, { start: el.selectionStart, end: el.selectionEnd }, mark);
    setDoc((d) => ({ ...d, text: result.text }));
    setNextSel(result.selection);
  }, []);

  // Mood is read automatically once a save lands and the writing has changed.
  const autoMood = useAutoMood({
    clerkId,
    text: doc.text,
    saved: status === 'saved',
    current: doc.mood,
    onMood: (mood) => setDoc((d) => ({ ...d, mood })),
  });

  const words = wordCount(doc.text);
  const { label, Icon, tone } = SAVE_UI[status];
  const done = () => {
    if (status === 'unsaved' || status === 'saving') saveNow();
    onClose();
  };

  return (
    <section aria-labelledby="journal-editor-heading" className="mx-auto w-full max-w-3xl space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <h2 id="journal-editor-heading" className="sr-only">
            {entry ? 'Edit entry' : 'New entry'}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <p
            role="status"
            aria-live="polite"
            className="inline-flex items-center gap-1.5 text-[12px] font-medium"
            style={{ color: tone }}
          >
            <Icon
              className={`h-3.5 w-3.5 ${status === 'saving' ? 'motion-safe:animate-spin' : ''}`}
              aria-hidden="true"
            />
            {label}
          </p>

          <button
            type="button"
            onClick={() => setReading((r) => !r)}
            aria-pressed={reading}
            className={`${BUTTON} border border-[#E4E7EE] bg-white text-[#1B2430] hover:bg-[#EEF0F5]`}
          >
            {reading ? (
              <PenLine className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {reading ? 'Write' : 'Read'}
          </button>

          {status === 'failed' ? (
            <>
              <button
                type="button"
                onClick={saveNow}
                className={`${BUTTON} bg-[#2E3A59] text-white hover:bg-[#243049]`}
              >
                Retry save
              </button>
              <button
                type="button"
                onClick={onClose}
                className={`${BUTTON} border border-[#E4E7EE] bg-white text-[#C0533F] hover:bg-[#FBE9E5]`}
              >
                Close without saving
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={done}
              className={`${BUTTON} bg-[#2E3A59] text-white hover:bg-[#243049]`}
            >
              Done
            </button>
          )}
        </div>
      </header>

      {status === 'failed' && error && (
        <p role="alert" className="text-[12px] text-[#C0533F]">
          {error} Your writing is still here — retry when you are back online.
        </p>
      )}

      {/* The sheet. Perspective on the wrapper, transform on the paper only. */}
      <div className="relative" style={{ perspective: 1400 }}>
        <div
          aria-hidden="true"
          className="absolute inset-x-4 -bottom-1.5 h-8 rounded-b-[20px] border opacity-70"
          style={{ borderColor: theme.edge, backgroundImage: theme.paper }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-8 -bottom-3 h-8 rounded-b-[20px] border opacity-45"
          style={{ borderColor: theme.edge, backgroundImage: theme.paper }}
        />

        <motion.div
          animate={{ rotateX: reduceMotion || writing ? 0 : 1.8, y: writing ? -4 : 0 }}
          transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 180, damping: 24 }}
          className="relative rounded-[20px] border p-5 sm:p-8"
          style={{ ...paperStyleWithPrefs(theme, prefs), transformOrigin: '50% 100%' }}
        >
          <label htmlFor="journal-title" className="sr-only">
            Entry title
          </label>
          <input
            id="journal-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled entry"
            maxLength={120}
            className="mb-4 block w-full border-b bg-transparent pb-2 text-[22px] outline-none placeholder:text-inherit placeholder:opacity-40 focus-visible:border-b-2"
            style={{ borderColor: theme.line, color: theme.ink, fontFamily: theme.display, caretColor: theme.accent }}
          />

          {reading ? (
            <div className="mt-3 min-h-[380px] text-[1em]" style={{ lineHeight: '1.75em' }}>
              {doc.text.trim() ? (
                <MarkdownView md={doc.text} />
              ) : (
                <p style={{ color: theme.muted }}>Nothing written yet.</p>
              )}
            </div>
          ) : (
          <>
          <FormatToolbar
            onApply={format}
            ink={theme.ink}
            muted={theme.muted}
            line={theme.line}
            accent={theme.accent}
          />

          <label htmlFor="journal-text" className="sr-only">
            Journal entry
          </label>
          <textarea
            id="journal-text"
            ref={textRef}
            value={doc.text}
            onChange={(e) => setDoc((d) => ({ ...d, text: e.target.value }))}
            onKeyDown={(e) => {
              const mark = markForShortcut(e);
              if (!mark) return;
              e.preventDefault();
              format(mark);
            }}
            onFocus={() => setWriting(true)}
            onBlur={() => setWriting(false)}
            placeholder="Start where you are…"
            spellCheck
            className="mt-3 block max-h-[60vh] min-h-[380px] w-full resize-none overflow-y-auto bg-transparent text-[1em] outline-none placeholder:text-inherit placeholder:opacity-40"
            style={{ color: theme.ink, caretColor: theme.accent, lineHeight: '1.75em' }}
          />
          </>
          )}

          <div
            className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-3 font-mono text-[11px] uppercase tracking-[0.14em]"
            style={{ borderColor: theme.line, color: theme.muted }}
          >
            <span>{words === 1 ? '1 word' : `${words} words`}</span>
            <span>{readingMinutes(doc.text)} min read</span>
            {doc.stickers.length > 0 && (
              <span>{doc.stickers.length === 1 ? '1 sticker' : `${doc.stickers.length} stickers`}</span>
            )}
          </div>

          <StickerLayer
            stickers={doc.stickers}
            theme={theme}
            pendingStickerId={pendingStickerId}
            onPlaced={onStickerPlaced}
            onChange={setStickers}
          />
        </motion.div>
      </div>

      <div className={`${GLASS_SOLID} space-y-5 p-4 sm:p-5`}>
        <PhotoStrip photos={photos} theme={theme} onAdd={addMedia} onRemove={removeMedia} />
        <hr className="border-[#E4E7EE]" />
        <AudioClips clips={clips} theme={theme} onAdd={addMedia} onRemove={removeMedia} />
      </div>

      {/*
        The mood read lives with the writing it describes, and writes straight
        into the doc so autosave persists it with everything else.
      */}
      <MoodReport
        clerkId={clerkId}
        text={doc.text}
        value={doc.mood}
        onAnalyzed={(mood) => setDoc((d) => ({ ...d, mood }))}
        auto={{ state: autoMood.state, error: autoMood.error }}
      />
    </section>
  );
}
