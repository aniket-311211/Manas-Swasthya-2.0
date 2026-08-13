import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Minus, Plus, RotateCcw, RotateCw, Trash2 } from 'lucide-react';
import { glyphFor, STICKER_BY_ID } from '../stickers';
import type { PlacedSticker } from '../types';
import type { JournalTheme } from '../themes';

/**
 * Stickers layered over the paper.
 *
 * Positions are fractions of the layer (0–1), so a sticker sits in the same
 * spot on a phone and a 27" monitor. The layer itself is click-through; only
 * the stickers take pointer events, so the textarea underneath stays writable.
 *
 * ponytail: no drag library and no resize handles — pointer events for drag,
 * a five-button toolbar and the keyboard for everything else. Handles would
 * need their own hit targets, their own keyboard path and their own labels.
 */

export interface StickerLayerProps {
  stickers: PlacedSticker[];
  theme: JournalTheme;
  /**
   * Sticker chosen in the palette. Placing it calls onPlaced so the palette can
   * clear its selection; the same id can then be sent again for a second copy.
   */
  pendingStickerId?: string | null;
  onPlaced?: () => void;
  onChange: (stickers: PlacedSticker[]) => void;
}

const MIN_SIZE = 22;
const MAX_SIZE = 112;
const EDGE = 0.03;
const HELP_ID = 'journal-sticker-help';

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `s-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/** Deterministic scatter down the right margin, where prose is thinnest. */
function spotFor(index: number): Pick<PlacedSticker, 'x' | 'y' | 'rotation'> {
  return {
    x: 0.58 + ((index * 0.17) % 0.34),
    y: 0.14 + ((index * 0.23) % 0.64),
    rotation: ((index * 7) % 25) - 12,
  };
}

export default function StickerLayer({
  stickers,
  theme,
  pendingStickerId,
  onPlaced,
  onChange,
}: StickerLayerProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null);
  const lastPending = useRef<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();

  // The palette hands over an id; the layer decides where it lands.
  useEffect(() => {
    const pending = pendingStickerId ?? null;
    if (pending && pending !== lastPending.current) {
      const sticker: PlacedSticker = {
        id: newId(),
        stickerId: pending,
        size: 44,
        ...spotFor(stickers.length),
      };
      onChange([...stickers, sticker]);
      setSelected(sticker.id);
      onPlaced?.();
    }
    lastPending.current = pending;
  }, [pendingStickerId, stickers, onChange, onPlaced]);

  const patch = (id: string, next: Partial<PlacedSticker>) =>
    onChange(stickers.map((s) => (s.id === id ? { ...s, ...next } : s)));

  const remove = (id: string) => {
    onChange(stickers.filter((s) => s.id !== id));
    if (selected === id) setSelected(null);
  };

  const fractionOf = (clientX: number, clientY: number) => {
    const rect = layerRef.current?.getBoundingClientRect();
    if (!rect || !rect.width || !rect.height) return null;
    return { x: (clientX - rect.left) / rect.width, y: (clientY - rect.top) / rect.height };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>, s: PlacedSticker) => {
    setSelected(s.id);
    const at = fractionOf(e.clientX, e.clientY);
    if (!at) return;
    drag.current = { id: s.id, dx: s.x - at.x, dy: s.y - at.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d) return;
    const at = fractionOf(e.clientX, e.clientY);
    if (!at) return;
    patch(d.id, { x: clamp(at.x + d.dx, EDGE, 1 - EDGE), y: clamp(at.y + d.dy, EDGE, 1 - EDGE) });
  };

  const endDrag = (e: React.PointerEvent<HTMLButtonElement>) => {
    drag.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const onKeyDown = (e: React.KeyboardEvent, s: PlacedSticker) => {
    const step = e.shiftKey ? 0.05 : 0.01;
    const moves: Record<string, Partial<PlacedSticker>> = {
      ArrowLeft: { x: clamp(s.x - step, EDGE, 1 - EDGE) },
      ArrowRight: { x: clamp(s.x + step, EDGE, 1 - EDGE) },
      ArrowUp: { y: clamp(s.y - step, EDGE, 1 - EDGE) },
      ArrowDown: { y: clamp(s.y + step, EDGE, 1 - EDGE) },
      '+': { size: clamp(s.size + 6, MIN_SIZE, MAX_SIZE) },
      '=': { size: clamp(s.size + 6, MIN_SIZE, MAX_SIZE) },
      '-': { size: clamp(s.size - 6, MIN_SIZE, MAX_SIZE) },
      '[': { rotation: s.rotation - 15 },
      ']': { rotation: s.rotation + 15 },
    };
    if (moves[e.key]) {
      e.preventDefault();
      patch(s.id, moves[e.key]);
      return;
    }
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      remove(s.id);
      return;
    }
    if (e.key === 'Escape') setSelected(null);
  };

  const toolButton = `grid h-7 w-7 place-items-center rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2`;

  return (
    <div
      ref={layerRef}
      className="pointer-events-none absolute inset-0"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setSelected(null);
      }}
    >
      <p id={HELP_ID} className="sr-only">
        Drag to move. Arrow keys nudge, hold shift for a bigger step. Plus and minus resize, square
        brackets rotate, Delete removes.
      </p>

      {stickers.map((s) => {
        const meta = STICKER_BY_ID[s.stickerId];
        const isSelected = selected === s.id;
        return (
          <motion.div
            key={s.id}
            initial={reduceMotion ? false : { scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 26 }}
            className="pointer-events-none absolute"
            style={{ left: `${s.x * 100}%`, top: `${s.y * 100}%`, transform: 'translate(-50%,-50%)' }}
          >
            <button
              type="button"
              aria-label={`${meta?.name ?? 'Sticker'} sticker`}
              aria-pressed={isSelected}
              aria-describedby={HELP_ID}
              onPointerDown={(e) => onPointerDown(e, s)}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onKeyDown={(e) => onKeyDown(e, s)}
              onFocus={() => setSelected(s.id)}
              className="pointer-events-auto block cursor-grab rounded-lg leading-none focus-visible:outline-none active:cursor-grabbing"
              style={{
                fontSize: s.size,
                touchAction: 'none',
                padding: 2,
                transform: `rotate(${s.rotation}deg)`,
                outline: isSelected ? `2px dashed ${theme.accent}` : undefined,
                outlineOffset: 3,
              }}
            >
              <span aria-hidden="true">{glyphFor(s.stickerId)}</span>
            </button>

            {isSelected && (
              <div
                className="pointer-events-auto absolute left-1/2 top-full z-10 mt-2 flex -translate-x-1/2 gap-1 rounded-xl border p-1 shadow-lg"
                style={{ borderColor: theme.edge, background: theme.paper }}
                role="group"
                aria-label={`Edit ${meta?.name ?? 'sticker'}`}
              >
                {[
                  { key: 'rot-', label: 'Rotate left', Icon: RotateCcw, run: () => patch(s.id, { rotation: s.rotation - 15 }) },
                  { key: 'rot+', label: 'Rotate right', Icon: RotateCw, run: () => patch(s.id, { rotation: s.rotation + 15 }) },
                  { key: 'sz-', label: 'Smaller', Icon: Minus, run: () => patch(s.id, { size: clamp(s.size - 6, MIN_SIZE, MAX_SIZE) }) },
                  { key: 'sz+', label: 'Bigger', Icon: Plus, run: () => patch(s.id, { size: clamp(s.size + 6, MIN_SIZE, MAX_SIZE) }) },
                ].map(({ key, label, Icon, run }) => (
                  <button
                    key={key}
                    type="button"
                    aria-label={`${label}: ${meta?.name ?? 'sticker'}`}
                    onClick={run}
                    className={toolButton}
                    style={{ borderColor: theme.line, color: theme.ink }}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                ))}
                <button
                  type="button"
                  aria-label={`Remove ${meta?.name ?? 'sticker'}`}
                  onClick={() => remove(s.id)}
                  className={toolButton}
                  style={{ borderColor: theme.line, color: '#C0533F' }}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
