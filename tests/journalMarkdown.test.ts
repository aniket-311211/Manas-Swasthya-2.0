import { describe, it, expect } from 'vitest';
import {
  applyMark,
  markForShortcut,
  parseMarkdown,
  stripMarkdown,
  type EditResult,
  type Mark,
  type Selection,
} from '@/features/journal/markdown';

const at = (start: number, end: number = start): Selection => ({ start, end });
/** What the writer would still see highlighted after the edit. */
const held = (r: EditResult) => r.text.slice(r.selection.start, r.selection.end);

const INLINE: Mark[] = ['bold', 'italic', 'strike', 'code'];
const LINES: Mark[] = ['h2', 'quote', 'bullet', 'number'];

describe('applyMark — collapsed selection', () => {
  it.each([
    ['bold', '****', 2],
    ['italic', '**', 1],
    ['strike', '~~~~', 2],
    ['code', '``', 1],
  ] as [Mark, string, number][])('%s inserts the empty pair with the caret inside', (mark, text, caret) => {
    expect(applyMark('', at(0), mark)).toEqual({ text, selection: at(caret) });
  });

  it('lets typing continue inside the mark', () => {
    const r = applyMark('say ', at(4), 'bold');
    expect(r.text).toBe('say ****');
    expect(r.selection).toEqual(at(6));
    const typed = `${r.text.slice(0, 6)}hi${r.text.slice(6)}`;
    expect(typed).toBe('say **hi**');
    expect(stripMarkdown(typed)).toBe('say hi');
  });

  it('cleans up the empty pair when toggled straight back off', () => {
    expect(applyMark('****', at(2), 'bold')).toEqual({ text: '', selection: at(0) });
  });

  it('starts a list from an empty document with the caret after the marker', () => {
    expect(applyMark('', at(0), 'bullet')).toEqual({ text: '- ', selection: at(2) });
    expect(applyMark('', at(0), 'number')).toEqual({ text: '1. ', selection: at(3) });
  });
});

describe('applyMark — toggling off', () => {
  it('removes the pair when the selection includes the markers', () => {
    const r = applyMark('**hello**', at(0, 9), 'bold');
    expect(r.text).toBe('hello');
    expect(held(r)).toBe('hello');
  });

  it('removes the pair when the selection sits just inside them', () => {
    const r = applyMark('**hello**', at(2, 7), 'bold');
    expect(r.text).toBe('hello');
    expect(held(r)).toBe('hello');
  });

  it('is idempotent for every inline mark', () => {
    for (const mark of INLINE) {
      const on = applyMark('hello', at(0, 5), mark);
      const off = applyMark(on.text, on.selection, mark);
      expect(off.text, mark).toBe('hello');
      expect(off.selection, mark).toEqual(at(0, 5));
    }
  });

  it('leaves the prose either side of the mark alone', () => {
    expect(applyMark('a **b** c', at(2, 7), 'bold').text).toBe('a b c');
    expect(applyMark('a **b** c', at(4, 5), 'bold').text).toBe('a b c');
  });

  it('does not unwrap a bold pair when italic is applied to it', () => {
    const r = applyMark('**bold**', at(2, 6), 'italic');
    expect(r.text).toBe('***bold***');
    expect(held(r)).toBe('bold');
  });
});

describe('applyMark — the selection survives the edit', () => {
  it('keeps the same visible text selected for inline marks', () => {
    const r = applyMark('the quick fox', at(4, 9), 'bold');
    expect(r.text).toBe('the **quick** fox');
    expect(held(r)).toBe('quick');
    // Clicking the same button again with that selection must undo it.
    expect(applyMark(r.text, r.selection, 'bold').text).toBe('the quick fox');
  });

  it('keeps the marked lines selected for line marks', () => {
    const r = applyMark('one\ntwo', at(0, 7), 'quote');
    expect(r.text).toBe('> one\n> two');
    expect(held(r)).toBe('one\n> two');
    expect(applyMark(r.text, r.selection, 'quote').text).toBe('one\ntwo');
  });

  it('clamps a reversed or out-of-range selection instead of trusting it', () => {
    expect(applyMark('hi', { start: 2, end: 0 }, 'bold').text).toBe('**hi**');
    expect(applyMark('hi', { start: -5, end: 99 }, 'bold').text).toBe('**hi**');
  });
});

describe('applyMark — line marks', () => {
  const three = 'one\ntwo\nthree';

  it.each([
    ['h2', '## '],
    ['quote', '> '],
    ['bullet', '- '],
  ] as [Mark, string][])('%s applies to every line and toggles off cleanly', (mark, prefix) => {
    const on = applyMark(three, at(0, three.length), mark);
    expect(on.text).toBe(`${prefix}one\n${prefix}two\n${prefix}three`);
    const off = applyMark(on.text, on.selection, mark);
    expect(off.text).toBe(three);
    expect(held(off)).toBe(three);
  });

  it('numbers lines in order and renumbers rather than stacking', () => {
    const on = applyMark(three, at(0, three.length), 'number');
    expect(on.text).toBe('1. one\n2. two\n3. three');
    expect(applyMark(on.text, on.selection, 'number').text).toBe(three);
  });

  it('replaces one line mark with another', () => {
    const bullet = applyMark('one', at(0), 'bullet');
    const quote = applyMark(bullet.text, bullet.selection, 'quote');
    expect(quote.text).toBe('> one');
    expect(applyMark(quote.text, quote.selection, 'number').text).toBe('1. one');
  });

  it('only touches the lines the selection reaches', () => {
    const r = applyMark(three, at(4, 7), 'bullet');
    expect(r.text).toBe('one\n- two\nthree');
    expect(held(r)).toBe('two');
  });

  it('does not drag in the next line when the selection ends on the break', () => {
    expect(applyMark(three, at(0, 4), 'bullet').text).toBe('- one\ntwo\nthree');
  });

  it('steps over blank separators but still toggles off through them', () => {
    const on = applyMark('a\n\nb', at(0, 4), 'bullet');
    expect(on.text).toBe('- a\n\n- b');
    expect(applyMark(on.text, on.selection, 'bullet').text).toBe('a\n\nb');
  });

  it('marks a partly-marked selection whole rather than unmarking it', () => {
    expect(applyMark('- a\nb', at(0, 5), 'bullet').text).toBe('- a\n- b');
  });
});

describe('stripMarkdown', () => {
  it('removes every supported mark', () => {
    expect(stripMarkdown('## Title')).toBe('Title');
    expect(stripMarkdown('> quiet')).toBe('quiet');
    expect(stripMarkdown('- item')).toBe('item');
    expect(stripMarkdown('12. item')).toBe('item');
    expect(stripMarkdown('**b** *i* ~~s~~ `c`')).toBe('b i s c');
    expect(stripMarkdown('***both***')).toBe('both');
  });

  it('does not mangle prose with a lone asterisk or an underscore', () => {
    expect(stripMarkdown('2 * 3 = 6')).toBe('2 * 3 = 6');
    expect(stripMarkdown('4 * 5 and 6 * 7')).toBe('4 * 5 and 6 * 7');
    expect(stripMarkdown('snake_case and user_name_here')).toBe('snake_case and user_name_here');
    expect(stripMarkdown('a_b_c *unclosed')).toBe('a_b_c *unclosed');
    expect(stripMarkdown('5 - 3 is not a bullet')).toBe('5 - 3 is not a bullet');
  });

  it('keeps line structure so word counts and excerpts stay sane', () => {
    expect(stripMarkdown('- one\n\n- two')).toBe('one\n\ntwo');
    expect(stripMarkdown('')).toBe('');
  });

  it('round-trips everything applyMark produced', () => {
    for (const mark of [...INLINE, ...LINES]) {
      expect(stripMarkdown(applyMark('one two', at(0, 7), mark).text), mark).toBe('one two');
    }
    const bold = applyMark('one two three', at(4, 7), 'bold');
    expect(bold.text).toBe('one **two** three');
    expect(stripMarkdown(bold.text)).toBe('one two three');
  });
});

describe('parseMarkdown', () => {
  const text = (value: string) => ({ type: 'text', value });

  it('builds a block tree and groups consecutive list lines', () => {
    expect(parseMarkdown('## Head\n\nprose\n\n> quiet\n\n- a\n- b\n\n1. x\n2. y')).toEqual([
      { type: 'h2', spans: [text('Head')] },
      { type: 'p', spans: [text('prose')] },
      { type: 'quote', spans: [text('quiet')] },
      { type: 'ul', items: [[text('a')], [text('b')]] },
      { type: 'ol', items: [[text('x')], [text('y')]] },
    ]);
  });

  it('combines inline marks inside one block', () => {
    expect(parseMarkdown('a **b** and *c* and `d`')).toEqual([
      {
        type: 'p',
        spans: [
          text('a '),
          { type: 'bold', value: 'b' },
          text(' and '),
          { type: 'italic', value: 'c' },
          text(' and '),
          { type: 'code', value: 'd' },
        ],
      },
    ]);
  });

  it('keeps markdown inside code literal', () => {
    expect(parseMarkdown('`**x**`')).toEqual([{ type: 'p', spans: [{ type: 'code', value: '**x**' }] }]);
  });

  it('degrades unsupported syntax to text', () => {
    expect(parseMarkdown('# h1\n[link](url)\n![img](url)\n| a | b |')).toEqual([
      { type: 'p', spans: [text('# h1')] },
      { type: 'p', spans: [text('[link](url)')] },
      { type: 'p', spans: [text('![img](url)')] },
      { type: 'p', spans: [text('| a | b |')] },
    ]);
  });

  it('keeps a deliberate line break as its own block', () => {
    expect(parseMarkdown('one\ntwo')).toHaveLength(2);
  });

  it('never throws on unbalanced or hostile input', () => {
    const bits = ['**', '*', '~~', '`', '## ', '> ', '- ', '1. ', '\n', 'a', ' ', '<script>', '\\', '***', '_', '****'];
    let seed = 7;
    const rand = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
    for (let n = 0; n < 600; n += 1) {
      let s = '';
      for (let k = 0; k < 12; k += 1) s += bits[Math.floor(rand() * bits.length)];
      expect(() => parseMarkdown(s), s).not.toThrow();
      expect(Array.isArray(parseMarkdown(s)), s).toBe(true);
      expect(() => stripMarkdown(s), s).not.toThrow();
      expect(() => applyMark(s, at(0, s.length), 'bold'), s).not.toThrow();
    }
  });

  it('survives a missing document', () => {
    expect(parseMarkdown(undefined as unknown as string)).toEqual([]);
    expect(stripMarkdown(undefined as unknown as string)).toBe('');
    expect(parseMarkdown('')).toEqual([]);
  });
});

describe('markForShortcut', () => {
  it('maps the three inline shortcuts on either platform', () => {
    expect(markForShortcut({ key: 'b', metaKey: true, ctrlKey: false })).toBe('bold');
    expect(markForShortcut({ key: 'i', metaKey: false, ctrlKey: true })).toBe('italic');
    expect(markForShortcut({ key: 'E', metaKey: true, ctrlKey: false })).toBe('code');
  });

  it('ignores plain typing and unmapped chords', () => {
    expect(markForShortcut({ key: 'b', metaKey: false, ctrlKey: false })).toBeNull();
    expect(markForShortcut({ key: 'z', metaKey: true, ctrlKey: false })).toBeNull();
    expect(markForShortcut({ key: 'Enter', metaKey: true, ctrlKey: false })).toBeNull();
  });
});
