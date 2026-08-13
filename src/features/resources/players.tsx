import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import {
  Download,
  FileWarning,
  Maximize2,
  Pause,
  Play,
  Volume2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type { Resource } from '@/lib/resources';
import { CARD, FOCUS, INK, MUTED, categoryOf } from './catalogue';
import { formatClock, hasFile, mediaUrlOf } from './media';

/**
 * One player per resource type. Each is a different interaction, not the same
 * card with a different icon — a PDF gets page chrome, audio gets a turntable,
 * video gets a cinema frame, and anything without a file gets an honest page
 * rather than a play button that does nothing.
 */

const CTRL =
  `inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#0E3A3D]/20 bg-white/80 text-[#0E3A3D] transition-colors hover:bg-white ${FOCUS}`;

/** Shown when the catalogue claims a file that is not on disk. */
export function MissingFile({ resource }: { resource: Resource }) {
  const cat = categoryOf(resource);
  return (
    <div className={`${CARD} p-6`}>
      <p className="flex items-center gap-2 text-[13px] font-semibold" style={{ color: cat.accent }}>
        <FileWarning className="h-4 w-4" aria-hidden="true" />
        No file attached yet
      </p>
      <p className={`mt-2 text-[14px] leading-relaxed ${MUTED}`}>
        This entry is catalogued but its file has not been uploaded, so there is nothing to play
        yet. Everything else about it is below.
      </p>
    </div>
  );
}

export function AudioPlayer({ resource }: { resource: Resource }) {
  const url = mediaUrlOf(resource);
  const cat = categoryOf(resource);
  const audioRef = useRef<HTMLAudioElement>(null);
  const reduceMotion = useReducedMotion();

  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);

  useEffect(() => {
    const el = audioRef.current;
    if (el) el.volume = volume;
  }, [volume]);

  if (!url || !hasFile(resource)) return <MissingFile resource={resource} />;

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) void el.play();
    else el.pause();
  };

  return (
    <div className={`${CARD} p-6`}>
      {/* The turntable. Spins while playing, holds position when paused. */}
      <div className="flex flex-col items-center">
        <div
          className="relative h-52 w-52 rounded-full shadow-[0_18px_50px_-20px_rgba(14,58,61,0.55)]"
          style={{
            background: `repeating-radial-gradient(circle at 50% 50%, ${cat.accent}12 0 3px, ${cat.accent}05 3px 6px), radial-gradient(circle at 50% 50%, #16181D 0 38%, #23262E 38% 100%)`,
            animation: playing && !reduceMotion ? 'discSpin 4s linear infinite' : undefined,
          }}
          aria-hidden="true"
        >
          <span
            className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-[11px] font-semibold text-white"
            style={{ backgroundColor: cat.accent }}
          >
            {resource.code}
          </span>
          <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/90" />
        </div>

        <p role="status" aria-live="polite" className={`mt-4 text-[13px] ${MUTED}`}>
          {playing ? 'Playing' : 'Paused'} · {formatClock(time)} of {formatClock(duration)}
        </p>
      </div>

      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        className="sr-only"
      >
        <track kind="captions" />
      </audio>

      <div className="mt-5 flex items-center gap-3">
        <button type="button" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'} className={CTRL}>
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>

        <label className="sr-only" htmlFor={`seek-${resource.id}`}>
          Seek
        </label>
        <input
          id={`seek-${resource.id}`}
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={time}
          onChange={(e) => {
            const el = audioRef.current;
            if (el) el.currentTime = Number(e.target.value);
          }}
          className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-[#0E3A3D]/15 accent-[#0E3A3D]"
          style={{ accentColor: cat.accent }}
        />

        <Volume2 className={`h-4 w-4 shrink-0 ${MUTED}`} aria-hidden="true" />
        <label className="sr-only" htmlFor={`vol-${resource.id}`}>
          Volume
        </label>
        <input
          id={`vol-${resource.id}`}
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="h-1.5 w-20 cursor-pointer appearance-none rounded-full bg-[#0E3A3D]/15"
          style={{ accentColor: cat.accent }}
        />
      </div>
    </div>
  );
}

export function VideoPlayer({ resource }: { resource: Resource }) {
  const url = mediaUrlOf(resource);
  const ref = useRef<HTMLVideoElement>(null);
  if (!url || !hasFile(resource)) return <MissingFile resource={resource} />;

  return (
    <div className={`${CARD} overflow-hidden p-3`}>
      {/* Native controls: keyboard, captions and picture-in-picture for free. */}
      <video
        ref={ref}
        src={url}
        controls
        preload="metadata"
        className="aspect-video w-full rounded-[14px] bg-black"
      >
        <track kind="captions" />
      </video>
      <div className="flex items-center justify-between px-2 pb-1 pt-3">
        <p className={`text-[12px] ${MUTED}`}>{resource.duration ?? 'Video'}</p>
        <button
          type="button"
          onClick={() => void ref.current?.requestFullscreen?.()}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold ${INK} ${FOCUS}`}
        >
          <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" /> Fullscreen
        </button>
      </div>
    </div>
  );
}

export function PdfReader({ resource }: { resource: Resource }) {
  const url = mediaUrlOf(resource);
  const [zoom, setZoom] = useState(100);
  if (!url || !hasFile(resource)) return <MissingFile resource={resource} />;

  return (
    <div className={`${CARD} p-3`}>
      <div className="flex flex-wrap items-center justify-between gap-2 px-2 pb-3">
        <p className={`font-mono text-[11px] uppercase tracking-[0.14em] ${MUTED}`}>
          {resource.pages ? `${resource.pages} pages` : 'Document'}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(60, z - 20))}
            aria-label="Zoom out"
            className={CTRL}
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className={`w-12 text-center font-mono text-[12px] ${INK}`}>{zoom}%</span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(200, z + 20))}
            aria-label="Zoom in"
            className={CTRL}
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <a href={url} download aria-label="Download this document" className={CTRL}>
            <Download className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/*
        The browser's own PDF viewer inside our page chrome. ponytail: pdf.js
        would be ~1MB of dependency to rebuild what every browser already ships,
        and page navigation comes free with it.
      */}
      <div className="overflow-auto rounded-[14px] bg-[#0E3A3D]/10 p-2">
        <iframe
          src={url}
          title={`${resource.title} — document`}
          className="mx-auto block h-[70vh] rounded-[10px] bg-white"
          style={{ width: `${zoom}%`, minWidth: '100%' }}
        />
      </div>
    </div>
  );
}

/** Books, activities and hobbies with nothing to play — a reading layout. */
export function ArticleReader({ resource }: { resource: Resource }) {
  const cat = categoryOf(resource);
  return (
    <div className={`${CARD} p-6 sm:p-8`}>
      <p className="font-mono text-[11px] uppercase tracking-[0.14em]" style={{ color: cat.accent }}>
        {cat.label}
      </p>
      <h3 className={`mt-2 font-display text-[24px] leading-snug ${INK}`}>{resource.title}</h3>
      <p className={`mt-1 text-[13px] ${MUTED}`}>
        {resource.author}
        {resource.pages ? ` · ${resource.pages} pages` : ''}
        {resource.duration ? ` · ${resource.duration}` : ''}
      </p>
      <p className={`mt-4 text-[15px] leading-relaxed ${INK}`}>{resource.description}</p>
      {resource.tags.length > 0 && (
        <ul className="mt-5 flex flex-wrap gap-2">
          {resource.tags.map((t) => (
            <li
              key={t}
              className="rounded-full px-3 py-1 text-[12px]"
              style={{ backgroundColor: `${cat.accent}1A`, color: cat.accent }}
            >
              {t}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
