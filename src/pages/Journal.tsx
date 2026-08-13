import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useReducedMotion } from 'motion/react';
import ErrorBoundary from '@/components/ErrorBoundary';
import Silk from '@/components/Silk/Silk';
import JournalEditor from '@/features/journal/editor/JournalEditor';
import StickerPalette from '@/features/journal/editor/StickerPalette';
import ThemePicker from '@/features/journal/editor/ThemePicker';
import CustomizePanel from '@/features/journal/editor/CustomizePanel';
import JournalShelf from '@/features/journal/browse/JournalShelf';
import { GLASS } from '@/components/shell/theme';
import { useJournalPrefs } from '@/features/journal/prefs';
import type { JournalEntryView, ThemeId } from '@/features/journal/types';

/**
 * Two modes, one route. The shelf is the resting state; the editor takes over
 * the page when writing, with the palette and theme picker docked beside it.
 */
export default function Journal() {
  const { user } = useUser();
  const clerkId = user?.id ?? '';
  const reduceMotion = useReducedMotion();

  const [editing, setEditing] = useState<{ entry?: JournalEntryView; entryDate?: string } | null>(null);
  const [pendingSticker, setPendingSticker] = useState<string | null>(null);
  const [prefs, setPrefs] = useJournalPrefs();
  /*
   * ONE SOURCE OF TRUTH FOR THE THEME. This used to be a second `useState`
   * seeded from `prefs.theme` and only ever written by the picker beside the
   * sheet. The Customize panel writes straight to prefs, so choosing Carbon
   * there repainted the panel's own preview while the writing sheet stayed
   * Bloom and the picker still said Bloom was selected — three controls
   * disagreeing about one setting.
   *
   * The standing preference is `prefs.theme`. Opening an existing entry
   * temporarily shows the theme it was written in; any explicit choice clears
   * that override and becomes the new preference.
   */
  const [entryTheme, setEntryTheme] = useState<ThemeId | null>(null);
  const theme = entryTheme ?? prefs.theme;

  const changePrefs: typeof setPrefs = (next) => {
    if (next.theme) setEntryTheme(null);
    setPrefs(next);
  };

  const openEntry = (entry: JournalEntryView) => {
    setEntryTheme(entry.doc.theme);
    setEditing({ entry });
  };

  const pickTheme = (id: ThemeId) => changePrefs({ theme: id });

  const closeEditor = () => {
    setEditing(null);
    setEntryTheme(null);
    setPendingSticker(null);
  };

  return (
    <div className="relative min-h-[calc(100vh-4.25rem)] overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[#bd7430]">
        {!reduceMotion && <Silk speed={5.8} scale={1.3} color="#bd7430" noiseIntensity={2.2} rotation={0} />}
      </div>
      <div className="relative z-10 mx-auto w-full max-w-[1320px] px-4 py-8 sm:px-6 lg:px-10">
      <header className="mb-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/75">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <h1 className="mt-1 flex items-center gap-3 font-display text-[34px] leading-tight text-[#F8F6EE] sm:text-[40px]">
          {!editing && (
            <img
              src="/logos/manas_swasthya_logo_white.png"
              alt="Manas Swasthya logo"
              className="h-10 w-12 object-contain sm:h-12 sm:w-14"
            />
          )}
          {editing ? (editing.entry ? 'Edit entry' : 'New entry') : 'Swasthya Journal'}
        </h1>
      </header>

      {editing ? (
        <div className="flex flex-col gap-[18px] lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1">
            <ErrorBoundary label="the journal editor">
              {/*
                Keyed so switching entries remounts: the editor owns draft state
                and deliberately does not re-sync a swapped `entry` prop.
              */}
              <JournalEditor
                key={editing.entry?.id ?? 'new'}
                clerkId={clerkId}
                entry={editing.entry}
                entryDate={editing.entryDate}
                theme={theme}
                pendingStickerId={pendingSticker}
                onStickerPlaced={() => setPendingSticker(null)}
                onSaved={() => undefined}
                onClose={closeEditor}
              />
            </ErrorBoundary>
          </div>

          <aside className="flex w-full shrink-0 flex-col gap-[18px] lg:w-[340px]">
            <ErrorBoundary label="the theme picker">
              <ThemePicker value={theme} onChange={pickTheme} />
            </ErrorBoundary>
            <ErrorBoundary label="the sticker palette">
              <StickerPalette theme={theme} value={pendingSticker} onPick={setPendingSticker} />
            </ErrorBoundary>
            <ErrorBoundary label="journal customisation">
              {/* Prefs are user-level and live in localStorage, so they persist
                  across entries rather than being saved into one document. */}
              <CustomizePanel prefs={prefs} onChange={changePrefs} />
            </ErrorBoundary>
          </aside>
        </div>
      ) : (
        <ErrorBoundary label="your journal entries">
          <JournalShelf
            clerkId={clerkId}
            onOpen={openEntry}
          onNew={(entryDate) => setEditing({ entryDate })}
          />
        </ErrorBoundary>
      )}

      {!editing && (
        <p className={`${GLASS} mt-[18px] p-4 text-[13px] leading-relaxed text-[#5A6472]`}>
          Your writing is saved to your account. Photos and voice clips stay on this device only —
          they are not uploaded anywhere, so they will not follow you to another browser.
        </p>
      )}
      </div>
    </div>
  );
}
