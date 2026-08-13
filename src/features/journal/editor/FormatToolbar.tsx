import { Fragment, type CSSProperties } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Bold, Code, Heading2, Italic, List, ListOrdered, Quote, Strikethrough } from 'lucide-react';
import type { Mark } from '../markdown';

/**
 * The formatting row above the writing surface.
 *
 * It sits on the journal paper, not on a dashboard card, so every colour is a
 * prop and reaches the CSS through four local custom properties — hover and
 * focus-visible are pseudo-classes and an inline style cannot express them.
 *
 * ponytail: role="group", not role="toolbar". A real toolbar owes arrow-key
 * roving tabindex; a group of buttons is keyboard-correct as it stands.
 */

export interface FormatToolbarProps {
  onApply: (mark: Mark) => void;
  disabled?: boolean;
  /** Journal theme colours — the toolbar sits on the paper. */
  ink: string;
  muted: string;
  line: string;
  accent: string;
}

const MOD =
  typeof navigator !== 'undefined' && /Mac|iP(hone|ad|od)/.test(navigator.userAgent) ? '⌘' : 'Ctrl+';

/** Wrapping marks, then line marks. The gap between them is the separator. */
const GROUPS: { mark: Mark; label: string; Icon: typeof Bold; shortcut?: string }[][] = [
  [
    { mark: 'bold', label: 'Bold', Icon: Bold, shortcut: 'B' },
    { mark: 'italic', label: 'Italic', Icon: Italic, shortcut: 'I' },
    { mark: 'strike', label: 'Strikethrough', Icon: Strikethrough },
    { mark: 'code', label: 'Code', Icon: Code, shortcut: 'E' },
  ],
  [
    { mark: 'h2', label: 'Heading', Icon: Heading2 },
    { mark: 'quote', label: 'Quote', Icon: Quote },
    { mark: 'bullet', label: 'Bulleted list', Icon: List },
    { mark: 'number', label: 'Numbered list', Icon: ListOrdered },
  ],
];

const BUTTON =
  'grid h-8 w-8 shrink-0 place-items-center rounded-[10px] border border-transparent text-[color:var(--fmt-muted)] transition-colors hover:border-[color:var(--fmt-line)] hover:bg-[color:var(--fmt-line)] hover:text-[color:var(--fmt-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--fmt-ring)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-transparent disabled:hover:bg-transparent';

export default function FormatToolbar({
  onApply,
  disabled,
  ink,
  muted,
  line,
  accent,
}: FormatToolbarProps): JSX.Element {
  const reduceMotion = useReducedMotion();

  return (
    <div
      role="group"
      aria-label="Formatting"
      className="flex flex-wrap items-center gap-1"
      style={
        {
          '--fmt-ink': ink,
          '--fmt-muted': muted,
          '--fmt-line': line,
          '--fmt-ring': accent,
        } as CSSProperties
      }
    >
      {GROUPS.map((group, i) => (
        <Fragment key={i}>
          {i > 0 && (
            <span aria-hidden="true" className="mx-1 hidden h-5 w-px sm:block" style={{ background: line }} />
          )}
          {group.map(({ mark, label, Icon, shortcut }) => (
            <motion.button
              key={mark}
              type="button"
              disabled={disabled}
              aria-label={label}
              title={shortcut ? `${label} (${MOD}${shortcut})` : label}
              // Without this the textarea blurs on mousedown and the selection
              // is gone before the click lands.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onApply(mark)}
              whileTap={reduceMotion || disabled ? undefined : { scale: 0.9 }}
              className={BUTTON}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
            </motion.button>
          ))}
        </Fragment>
      ))}
    </div>
  );
}
