/**
 * Formatting for the journal, stored as Markdown inside the existing
 * `doc.text` string.
 *
 * No schema change and no doc version bump: every entry ever written is already
 * valid Markdown, so nothing migrates. The editor stays a <textarea> and the
 * toolbar just rewrites the selection — a rich-text engine would need a document
 * model this project has nowhere to save.
 *
 * Supported, and nothing else: **bold**, *italic*, ~~strike~~, `code`,
 * `## heading`, `> quote`, `- bullet`, `1. numbered`. No links, images, tables
 * or nested lists. Unknown syntax is prose, not an error.
 *
 * Everything here is pure so it runs in the node vitest env.
 */

export type Mark = 'bold' | 'italic' | 'strike' | 'code' | 'h2' | 'quote' | 'bullet' | 'number';

export interface Selection {
  start: number;
  end: number;
}

export interface EditResult {
  text: string;
  selection: Selection;
}

type InlineMark = 'bold' | 'italic' | 'strike' | 'code';
type LineMark = 'h2' | 'quote' | 'bullet' | 'number';

/** Wrapping markers, by mark. */
const WRAP: Record<InlineMark, string> = { bold: '**', italic: '*', strike: '~~', code: '`' };

/** Line prefixes. `number` is renumbered on the way in, so this is only a shape. */
const PREFIX: Record<LineMark, string> = { h2: '## ', quote: '> ', bullet: '- ', number: '1. ' };

const LINE_RE: Record<LineMark, RegExp> = {
  h2: /^## /,
  quote: /^> /,
  bullet: /^- /,
  number: /^\d+\. /,
};

/**
 * Any line prefix. The four line marks are mutually exclusive — applying one
 * replaces another rather than stacking, because nothing renders `> - x`.
 */
const ANY_PREFIX = /^(?:## |> |- |\d+\. )/;

function isLineMark(mark: Mark): mark is LineMark {
  return mark in LINE_RE;
}

/**
 * Toggle a mark over the selection. Idempotent: applying twice removes it.
 *
 * The returned selection keeps the same visible text selected, so the toolbar
 * can be clicked twice in a row.
 */
export function applyMark(text: string, selection: Selection, mark: Mark): EditResult {
  const body = String(text ?? '');
  // The caller hands us a DOM selection; clamp rather than trust it.
  const lo = Math.max(0, Math.min(selection.start, selection.end, body.length));
  const hi = Math.max(lo, Math.min(Math.max(selection.start, selection.end), body.length));
  return isLineMark(mark) ? applyLine(body, lo, hi, mark) : applyWrap(body, lo, hi, mark);
}

function applyWrap(text: string, start: number, end: number, mark: InlineMark): EditResult {
  const m = WRAP[mark];
  const sel = text.slice(start, end);
  // '*' is also the first half of '**', so italic must never eat a bold pair.
  const italic = mark === 'italic';

  // Off: the selection swallowed the markers — **like this**.
  if (
    sel.length >= m.length * 2 &&
    sel.startsWith(m) &&
    sel.endsWith(m) &&
    !(italic && sel.startsWith('**'))
  ) {
    const inner = sel.slice(m.length, sel.length - m.length);
    return {
      text: text.slice(0, start) + inner + text.slice(end),
      selection: { start, end: start + inner.length },
    };
  }

  // Off: the selection sits just inside the markers — **[like this]**.
  const boldNeighbour =
    italic && (text.slice(Math.max(0, start - 2), start) === '**' || text.slice(end, end + 2) === '**');
  if (
    !boldNeighbour &&
    text.slice(Math.max(0, start - m.length), start) === m &&
    text.slice(end, end + m.length) === m
  ) {
    return {
      text: text.slice(0, start - m.length) + sel + text.slice(end + m.length),
      selection: { start: start - m.length, end: end - m.length },
    };
  }

  // On. A collapsed selection leaves the caret between the markers so typing
  // continues inside the mark.
  return {
    text: text.slice(0, start) + m + sel + m + text.slice(end),
    selection: { start: start + m.length, end: end + m.length },
  };
}

function applyLine(text: string, start: number, end: number, mark: LineMark): EditResult {
  const lineStart = start === 0 ? 0 : text.lastIndexOf('\n', start - 1) + 1;
  // A selection dragged to the start of the next line should not mark that line.
  const scanFrom = end > start && text[end - 1] === '\n' ? end - 1 : end;
  const nl = text.indexOf('\n', scanFrom);
  const lineEnd = nl === -1 ? text.length : nl;

  const lines = text.slice(lineStart, lineEnd).split('\n');
  const filled = lines.filter((l) => l.trim() !== '');
  // Blank separators do not vote, so a list with a gap in it still toggles off.
  const on = filled.length > 0 && filled.every((l) => LINE_RE[mark].test(l));

  let n = 0;
  const next = lines.map((line) => {
    if (filled.length > 0 && line.trim() === '') return line;
    const bare = line.replace(ANY_PREFIX, '');
    if (on) return bare;
    n += 1;
    return (mark === 'number' ? `${n}. ` : PREFIX[mark]) + bare;
  });

  const body = next.join('\n');
  const first = next[0].length - lines[0].length;
  const delta = body.length - (lineEnd - lineStart);
  const newStart = Math.max(lineStart, start + first);
  return {
    text: text.slice(0, lineStart) + body + text.slice(lineEnd),
    selection: { start: newStart, end: Math.max(newStart, end + delta) },
  };
}

/** Cmd/Ctrl + B / I / E. Anything else is just typing. */
export function markForShortcut(event: { key: string; metaKey: boolean; ctrlKey: boolean }): Mark | null {
  if (!event.metaKey && !event.ctrlKey) return null;
  switch (String(event.key ?? '').toLowerCase()) {
    case 'b':
      return 'bold';
    case 'i':
      return 'italic';
    case 'e':
      return 'code';
    default:
      return null;
  }
}

export type Inline = { type: 'text' | 'bold' | 'italic' | 'strike' | 'code'; value: string };

export type Block =
  | { type: 'p' | 'h2' | 'quote'; spans: Inline[] }
  | { type: 'ul' | 'ol'; items: Inline[][] };

/**
 * Inline scanner, tried in order at every position. Sticky so it only ever
 * matches where the cursor is.
 *
 * Content may not start or end with whitespace — that one rule is why "2 * 3"
 * and "4 * 5 and 6 * 7" stay arithmetic instead of turning into emphasis. `_`
 * is not a marker at all, so snake_case is safe for free. Code is matched first
 * so `**x**` inside backticks stays literal.
 */
const INLINE: [Exclude<Inline['type'], 'text'>, RegExp][] = [
  ['code', /`([^`\n]+)`/y],
  // `***x***` is bold+italic. A flat span list cannot nest, so it reads as bold
  // — matched before `**` so the third marker never leaks out as text.
  ['bold', /\*\*\*([^*\s](?:[^*\n]*?[^*\s])?)\*\*\*/y],
  ['bold', /\*\*(\S(?:[^\n]*?\S)?)\*\*/y],
  ['strike', /~~(\S(?:[^\n]*?\S)?)~~/y],
  ['italic', /\*([^*\s](?:[^*\n]*?[^*\s])?)\*/y],
];

function parseInline(line: string): Inline[] {
  const out: Inline[] = [];
  let plain = '';
  let i = 0;
  while (i < line.length) {
    let hit = false;
    for (const [type, re] of INLINE) {
      re.lastIndex = i;
      const m = re.exec(line);
      if (!m) continue;
      if (plain) {
        out.push({ type: 'text', value: plain });
        plain = '';
      }
      out.push({ type, value: m[1] });
      i = re.lastIndex;
      hit = true;
      break;
    }
    if (!hit) {
      plain += line[i];
      i += 1;
    }
  }
  if (plain) out.push({ type: 'text', value: plain });
  return out;
}

function pushItem(blocks: Block[], type: 'ul' | 'ol', item: Inline[]): void {
  const last = blocks[blocks.length - 1];
  if (last && (last.type === 'ul' || last.type === 'ol') && last.type === type) last.items.push(item);
  else blocks.push({ type, items: [item] });
}

/**
 * Parse Markdown into a block tree. Never throws; unknown syntax degrades to
 * text.
 *
 * One block per line. A journal is written with deliberate line breaks, and
 * CommonMark's "join consecutive lines into one paragraph" would silently eat
 * them. Blank lines separate blocks; consecutive list lines group into one list.
 */
export function parseMarkdown(md: string): Block[] {
  const blocks: Block[] = [];
  for (const raw of String(md ?? '').split('\n')) {
    const line = raw.replace(/\s+$/, '');
    if (!line) continue;

    const h2 = /^## +(.+)$/.exec(line);
    if (h2) {
      blocks.push({ type: 'h2', spans: parseInline(h2[1]) });
      continue;
    }
    const quote = /^> +(.+)$/.exec(line);
    if (quote) {
      blocks.push({ type: 'quote', spans: parseInline(quote[1]) });
      continue;
    }
    const ul = /^- +(.+)$/.exec(line);
    if (ul) {
      pushItem(blocks, 'ul', parseInline(ul[1]));
      continue;
    }
    const ol = /^\d+\. +(.+)$/.exec(line);
    if (ol) {
      pushItem(blocks, 'ol', parseInline(ol[1]));
      continue;
    }
    blocks.push({ type: 'p', spans: parseInline(line) });
  }
  return blocks;
}

/**
 * Strip all Markdown syntax. Used for excerpts, the dashboard and word counts.
 *
 * Line-by-line rather than via parseMarkdown, so blank lines survive and the
 * result round-trips with whatever applyMark produced.
 */
export function stripMarkdown(md: string): string {
  return String(md ?? '')
    .split('\n')
    .map((line) =>
      parseInline(line.replace(ANY_PREFIX, ''))
        .map((s) => s.value)
        .join(''),
    )
    .join('\n');
}
