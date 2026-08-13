import type { MediaKind, MediaRef } from './types';

/**
 * Device-local blob store for journal photos and audio.
 *
 * WHY INDEXEDDB: there is no object storage in this project — `.env` has
 * Postgres and Gemini and nothing else. The alternatives were base64 inside a
 * Postgres text column (bloats every row, blows the 50k content cap after about
 * one photo) or localStorage (~5 MB for the whole origin, and synchronous).
 * IndexedDB holds blobs natively, is async, and has a quota in the hundreds of
 * MB. Entries store only a MediaRef; the bytes stay here.
 *
 * KNOWN CEILING: media is per-device. Clear site data or switch machines and
 * the text survives (it is in Postgres) but the photos do not. Fixing that
 * needs real blob storage — S3, Cloudinary, Vercel Blob — plus an upload
 * endpoint. Everything below is written so only `readBlob`/`putBlob` change.
 */

const DB_NAME = 'manas-journal-media';
const STORE = 'blobs';
const DB_VERSION = 1;

export const MEDIA_LIMITS = {
  photoBytes: 8 * 1024 * 1024,
  audioBytes: 12 * 1024 * 1024,
  photosPerEntry: 8,
  audioPerEntry: 4,
} as const;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('This browser has no IndexedDB, so photos and audio cannot be saved.'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('Could not open the media store.'));
  });
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const request = run(db.transaction(STORE, mode).objectStore(STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error('Media store request failed.'));
      }),
  );
}

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `m-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export function limitFor(kind: MediaKind): number {
  return kind === 'photo' ? MEDIA_LIMITS.photoBytes : MEDIA_LIMITS.audioBytes;
}

export class MediaTooLargeError extends Error {
  constructor(kind: MediaKind, bytes: number) {
    const mb = (limitFor(kind) / 1024 / 1024).toFixed(0);
    super(`That ${kind} is ${(bytes / 1024 / 1024).toFixed(1)} MB. The limit is ${mb} MB.`);
    this.name = 'MediaTooLargeError';
  }
}

/** Store a blob and return the reference to embed in the document. */
export async function putMedia(
  blob: Blob,
  kind: MediaKind,
  name: string,
  duration?: number,
): Promise<MediaRef> {
  if (blob.size > limitFor(kind)) throw new MediaTooLargeError(kind, blob.size);
  const id = newId();
  await tx('readwrite', (store) => store.put(blob, id));
  return {
    id,
    kind,
    name,
    mimeType: blob.type || (kind === 'photo' ? 'image/*' : 'audio/*'),
    bytes: blob.size,
    duration,
    createdAt: new Date().toISOString(),
  };
}

export async function getMedia(id: string): Promise<Blob | null> {
  const value = await tx<Blob | undefined>('readonly', (store) => store.get(id));
  return value ?? null;
}

export async function deleteMedia(id: string): Promise<void> {
  await tx('readwrite', (store) => store.delete(id));
}

/**
 * Object URL for a stored blob, or null if the blob is gone (different device,
 * cleared storage). Callers MUST revokeObjectURL when done.
 */
export async function mediaUrl(id: string): Promise<string | null> {
  const blob = await getMedia(id);
  return blob ? URL.createObjectURL(blob) : null;
}

/** Drop blobs no surviving entry references. Safe to call on load. */
export async function pruneMedia(keepIds: string[]): Promise<number> {
  const keep = new Set(keepIds);
  const all = await tx<IDBValidKey[]>('readonly', (store) => store.getAllKeys());
  const dead = all.map(String).filter((id) => !keep.has(id));
  await Promise.all(dead.map(deleteMedia));
  return dead.length;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
