import { useEffect, useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import {
  deleteMedia,
  formatBytes,
  MEDIA_LIMITS,
  MediaTooLargeError,
  mediaUrl,
  putMedia,
} from '../media';
import type { MediaRef } from '../types';
import type { JournalTheme } from '../themes';

/**
 * Photos attached to an entry.
 *
 * Blobs live in IndexedDB (see media.ts); the document only carries MediaRefs.
 * Object URLs are minted here and revoked here — a writing session can run for
 * an hour, and leaked URLs pin the whole blob in memory for all of it.
 */

export interface PhotoStripProps {
  /** doc.media filtered to photos. Must be referentially stable per doc. */
  photos: MediaRef[];
  theme: JournalTheme;
  onAdd: (ref: MediaRef) => void;
  onRemove: (id: string) => void;
}

export default function PhotoStrip({ photos, theme, onAdd, onRemove }: PhotoStripProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [urls, setUrls] = useState<Record<string, string | null>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const remaining = MEDIA_LIMITS.photosPerEntry - photos.length;

  // ponytail: rebuilds every URL whenever the list changes rather than
  // diffing. A handful of photos, and it makes the revoke impossible to get
  // wrong — the cleanup owns exactly what this run created.
  useEffect(() => {
    let alive = true;
    const mine: string[] = [];
    void (async () => {
      const pairs = await Promise.all(
        photos.map(async (p) => [p.id, await mediaUrl(p.id)] as const),
      );
      pairs.forEach(([, url]) => url && mine.push(url));
      if (!alive) {
        mine.forEach(URL.revokeObjectURL);
        return;
      }
      setUrls(Object.fromEntries(pairs));
    })();
    return () => {
      alive = false;
      mine.forEach(URL.revokeObjectURL);
    };
  }, [photos]);

  const pick = async (files: FileList | null) => {
    if (!files?.length) return;
    setError(null);
    setBusy(true);
    const images = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (images.length > remaining) {
      setError(
        `You can attach ${MEDIA_LIMITS.photosPerEntry} photos to an entry. ${remaining === 0 ? 'This one is full.' : `Room for ${remaining} more.`}`,
      );
    }
    for (const file of images.slice(0, Math.max(0, remaining))) {
      try {
        onAdd(await putMedia(file, 'photo', file.name || 'Photo'));
      } catch (err) {
        // MediaTooLargeError is already written for a human — show it as-is.
        setError(
          err instanceof MediaTooLargeError
            ? err.message
            : `Could not save ${file.name || 'that photo'}. Your browser may be out of storage.`,
        );
      }
    }
    setBusy(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const drop = async (id: string) => {
    try {
      await deleteMedia(id);
    } catch {
      // The document reference goes either way; a stray blob is prunable later.
    }
    onRemove(id);
  };

  return (
    <section aria-labelledby="journal-photos-heading" className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 id="journal-photos-heading" className="text-[13px] font-semibold text-[#1B2430]">
          Photos
          <span className="ml-2 font-mono text-[11px] font-normal text-[#8A93A3]">
            {photos.length} / {MEDIA_LIMITS.photosPerEntry}
          </span>
        </h3>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={remaining <= 0 || busy}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#E4E7EE] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#2E3A59] transition-colors hover:bg-[#EEF0F5] disabled:cursor-not-allowed disabled:text-[#8A93A3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E3A59]"
        >
          <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />
          {busy ? 'Adding…' : 'Add photo'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          aria-label="Choose photos to attach"
          onChange={(e) => void pick(e.target.files)}
        />
      </div>

      {error && (
        <p role="alert" className="text-[12px] text-[#C0533F]">
          {error}
        </p>
      )}

      {photos.length === 0 ? (
        <p className="text-[12px] text-[#8A93A3]">
          Photos stay on this device — they are not uploaded anywhere.
        </p>
      ) : (
        <ul className="flex list-none gap-3 overflow-x-auto pb-1">
          {photos.map((p) => {
            const url = urls[p.id];
            return (
              <li key={p.id} className="relative shrink-0">
                <div
                  className="grid h-24 w-24 place-items-center overflow-hidden rounded-xl border"
                  style={{ borderColor: theme.edge, background: theme.paper }}
                >
                  {url ? (
                    <img src={url} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="px-2 text-center text-[10px] leading-tight" style={{ color: theme.muted }}>
                      {url === null ? 'Not on this device' : 'Loading…'}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => void drop(p.id)}
                  aria-label={`Remove photo ${p.name}`}
                  className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full border border-[#E4E7EE] bg-white text-[#C0533F] shadow-sm transition-colors hover:bg-[#FBE9E5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E3A59]"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <p className="mt-1 w-24 truncate font-mono text-[10px] text-[#8A93A3]" title={p.name}>
                  {formatBytes(p.bytes)}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
