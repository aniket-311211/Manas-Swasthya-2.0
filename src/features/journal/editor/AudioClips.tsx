import { useEffect, useRef, useState } from 'react';
import { Mic, Square, Trash2 } from 'lucide-react';
import {
  deleteMedia,
  formatBytes,
  formatDuration,
  MEDIA_LIMITS,
  MediaTooLargeError,
  mediaUrl,
  putMedia,
} from '../media';
import type { MediaRef } from '../types';
import type { JournalTheme } from '../themes';

/**
 * Voice notes for an entry.
 *
 * ponytail: playback is a native <audio controls>. It is keyboard accessible,
 * scrubbable and localised by the browser — a custom transport would be fifty
 * lines to be worse at all three.
 */

export interface AudioClipsProps {
  /** doc.media filtered to audio. Must be referentially stable per doc. */
  clips: MediaRef[];
  theme: JournalTheme;
  onAdd: (ref: MediaRef) => void;
  onRemove: (id: string) => void;
}

/** Stop a little short of the cap so the finished blob still fits. */
const STOP_AT_BYTES = MEDIA_LIMITS.audioBytes * 0.95;

export default function AudioClips({ clips, theme, onAdd, onRemove }: AudioClipsProps) {
  const [urls, setUrls] = useState<Record<string, string | null>>({});
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [notice, setNotice] = useState<{ text: string; bad: boolean } | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const supported =
    typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
  const full = clips.length >= MEDIA_LIMITS.audioPerEntry;

  // Same revoke discipline as PhotoStrip: this run owns exactly what it minted.
  useEffect(() => {
    let alive = true;
    const mine: string[] = [];
    void (async () => {
      const pairs = await Promise.all(clips.map(async (c) => [c.id, await mediaUrl(c.id)] as const));
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
  }, [clips]);

  const releaseMic = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recorderRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  // A microphone that outlives this component is not acceptable. Detach onstop
  // first so an in-progress clip is dropped rather than saved into a dead tree.
  useEffect(
    () => () => {
      const rec = recorderRef.current;
      if (rec) {
        rec.onstop = null;
        rec.ondataavailable = null;
        if (rec.state !== 'inactive') rec.stop();
      }
      releaseMic();
    },
    [],
  );

  const start = async () => {
    setNotice(null);
    if (!supported) {
      setNotice({ text: 'This browser cannot record audio. Try Chrome, Edge or Firefox.', bad: true });
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setNotice({
        text: 'No microphone access. Allow the microphone for this site in your browser settings, then try again.',
        bad: true,
      });
      return;
    }

    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream);
    } catch {
      stream.getTracks().forEach((t) => t.stop());
      setNotice({ text: 'This browser could not start a recording.', bad: true });
      return;
    }

    const chunks: Blob[] = [];
    let bytes = 0;
    let hitLimit = false;
    const startedAt = Date.now();

    recorder.ondataavailable = (e) => {
      if (!e.data.size) return;
      chunks.push(e.data);
      bytes += e.data.size;
      if (bytes >= STOP_AT_BYTES && recorder.state === 'recording') {
        hitLimit = true;
        recorder.stop();
      }
    };

    recorder.onstop = () => {
      const seconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
      const blob = new Blob(chunks, { type: chunks[0]?.type || 'audio/webm' });
      releaseMic();
      setRecording(false);
      setElapsed(0);
      void (async () => {
        try {
          const label = `Voice note ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
          onAdd(await putMedia(blob, 'audio', label, seconds));
          if (hitLimit) {
            setNotice({
              text: `Recording stopped at the ${(MEDIA_LIMITS.audioBytes / 1024 / 1024).toFixed(0)} MB limit. The clip up to that point was saved.`,
              bad: false,
            });
          }
        } catch (err) {
          setNotice({
            text:
              err instanceof MediaTooLargeError
                ? err.message
                : 'Could not save that voice note. Your browser may be out of storage.',
            bad: true,
          });
        }
      })();
    };

    streamRef.current = stream;
    recorderRef.current = recorder;
    recorder.start(1000); // one chunk a second, so the size cap can bite early
    setRecording(true);
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed(Math.round((Date.now() - startedAt) / 1000)), 250);
  };

  const stop = () => {
    const rec = recorderRef.current;
    if (rec && rec.state !== 'inactive') rec.stop();
  };

  const drop = async (id: string) => {
    try {
      await deleteMedia(id);
    } catch {
      // Reference goes either way; pruneMedia sweeps orphans later.
    }
    onRemove(id);
  };

  return (
    <section aria-labelledby="journal-audio-heading" className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 id="journal-audio-heading" className="text-[13px] font-semibold text-[#1B2430]">
          Voice notes
          <span className="ml-2 font-mono text-[11px] font-normal text-[#8A93A3]">
            {clips.length} / {MEDIA_LIMITS.audioPerEntry}
          </span>
        </h3>

        <div className="flex items-center gap-2">
          {recording && (
            <span className="font-mono text-[12px] tabular-nums text-[#C0533F]">
              {formatDuration(elapsed)}
            </span>
          )}
          <button
            type="button"
            onClick={() => (recording ? stop() : void start())}
            disabled={!supported || (full && !recording)}
            aria-label={recording ? 'Stop recording' : 'Record a voice note'}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors disabled:cursor-not-allowed disabled:text-[#8A93A3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E3A59] ${
              recording
                ? 'border-[#C0533F] bg-[#FBE9E5] text-[#C0533F]'
                : 'border-[#E4E7EE] bg-white text-[#2E3A59] hover:bg-[#EEF0F5]'
            }`}
          >
            {recording ? (
              <Square className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
            ) : (
              <Mic className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {recording ? 'Stop' : 'Record'}
          </button>
        </div>
      </div>

      <p role="status" aria-live="polite" className="flex items-center gap-2 text-[12px] text-[#5A6472]">
        {recording && (
          <span
            aria-hidden="true"
            className="h-2 w-2 shrink-0 rounded-full bg-[#C0533F] motion-safe:animate-pulse"
          />
        )}
        {recording
          ? 'Recording'
          : !supported
            ? 'Recording is not available in this browser.'
            : full
              ? `That is all ${MEDIA_LIMITS.audioPerEntry} voice notes for this entry.`
              : 'Not recording.'}
      </p>

      {notice && (
        <p
          role={notice.bad ? 'alert' : 'status'}
          className={`text-[12px] ${notice.bad ? 'text-[#C0533F]' : 'text-[#5A6472]'}`}
        >
          {notice.text}
        </p>
      )}

      <ul className="list-none space-y-2">
        {clips.map((c) => {
          const url = urls[c.id];
          return (
            <li
              key={c.id}
              className="flex items-center gap-3 rounded-xl border px-3 py-2"
              style={{ borderColor: theme.edge, background: theme.paper }}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-medium" style={{ color: theme.ink }}>
                  {c.name}
                </p>
                <p className="font-mono text-[10px]" style={{ color: theme.muted }}>
                  {c.duration ? `${formatDuration(c.duration)} · ` : ''}
                  {formatBytes(c.bytes)}
                </p>
                {url ? (
                  <audio
                    src={url}
                    controls
                    preload="metadata"
                    className="mt-1.5 h-8 w-full max-w-[280px]"
                    aria-label={`Play ${c.name}`}
                  />
                ) : (
                  <p className="mt-1 text-[11px]" style={{ color: theme.muted }}>
                    {url === null ? 'This clip was recorded on another device.' : 'Loading…'}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => void drop(c.id)}
                aria-label={`Delete ${c.name}`}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[#E4E7EE] bg-white text-[#C0533F] transition-colors hover:bg-[#FBE9E5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E3A59]"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
