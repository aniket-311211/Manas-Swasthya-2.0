import { describe, it, expect } from 'vitest';
import type { CommunityMessage } from '@/types/api';
import {
  clockTime,
  dayLabel,
  groupMessages,
  initials,
  monogramTile,
  relativeTime,
} from '@/features/community/theme';

/** Local time, so every assertion here lives in one timezone: the test's. */
const at = (y: number, m: number, d: number, h = 0, min = 0, s = 0) =>
  new Date(y, m - 1, d, h, min, s, 0);
const iso = (d: Date) => d.toISOString();

const NOW = at(2026, 8, 8, 14, 0);

function msg(over: Partial<CommunityMessage> & { id: string; timestamp: string }): CommunityMessage {
  return {
    roomId: 'room-1',
    content: 'hello',
    isMentor: false,
    authorName: 'Asha',
    badge: null,
    ...over,
  };
}

describe('clockTime', () => {
  it('reads as a 12-hour time', () => {
    expect(clockTime(iso(at(2026, 8, 8, 9, 5)))).toBe('9:05 am');
    expect(clockTime(iso(at(2026, 8, 8, 15, 30)))).toBe('3:30 pm');
  });

  it('says 12 rather than 0 at both ends of the day', () => {
    expect(clockTime(iso(at(2026, 8, 8, 0, 1)))).toBe('12:01 am');
    expect(clockTime(iso(at(2026, 8, 8, 12, 0)))).toBe('12:00 pm');
  });

  it('returns nothing readable rather than "Invalid Date"', () => {
    expect(clockTime('not a date')).toBe('');
    expect(clockTime('')).toBe('');
  });
});

describe('relativeTime', () => {
  it('calls the last three-quarters of a minute "just now"', () => {
    expect(relativeTime(iso(at(2026, 8, 8, 14, 0)), NOW)).toBe('just now');
    expect(relativeTime(iso(at(2026, 8, 8, 13, 59, 16)), NOW)).toBe('just now');
  });

  it('counts in minutes, then in hours, and never says "60 min ago"', () => {
    expect(relativeTime(iso(at(2026, 8, 8, 13, 55)), NOW)).toBe('5 min ago');
    expect(relativeTime(iso(at(2026, 8, 8, 13, 0, 1)), NOW)).toBe('1 h ago');
    expect(relativeTime(iso(at(2026, 8, 8, 3, 0)), NOW)).toBe('11 h ago');
  });

  it('falls back to the clock once a day has passed, since the divider carries the date', () => {
    expect(relativeTime(iso(at(2026, 8, 6, 9, 15)), NOW)).toBe('9:15 am');
  });

  it('treats a timestamp from the future as now — that is a clock disagreeing, not tomorrow', () => {
    expect(relativeTime(iso(at(2026, 8, 8, 14, 30)), NOW)).toBe('just now');
  });

  it('says nothing at all when the timestamp cannot be read', () => {
    expect(relativeTime('sometime', NOW)).toBe('');
  });
});

describe('dayLabel', () => {
  it('names today and yesterday in words', () => {
    expect(dayLabel(iso(at(2026, 8, 8, 1, 0)), NOW)).toBe('Today');
    expect(dayLabel(iso(at(2026, 8, 7, 23, 59)), NOW)).toBe('Yesterday');
  });

  it('rolls "yesterday" back across a month boundary', () => {
    expect(dayLabel(iso(at(2026, 7, 31, 20, 0)), at(2026, 8, 1, 9, 0))).toBe('Yesterday');
  });

  it('dates anything older', () => {
    expect(dayLabel(iso(at(2026, 8, 5, 10, 0)), NOW)).toBe('Wed, 5 Aug');
  });

  it('returns an empty label rather than a broken one', () => {
    expect(dayLabel('nope', NOW)).toBe('');
  });
});

describe('groupMessages', () => {
  it('collapses consecutive messages from one person into a single block', () => {
    const blocks = groupMessages(
      [
        msg({ id: 'a', timestamp: iso(at(2026, 8, 8, 10, 0)) }),
        msg({ id: 'b', timestamp: iso(at(2026, 8, 8, 10, 1)), content: 'and another thing' }),
      ],
      NOW,
    );
    expect(blocks).toHaveLength(1);
    expect(blocks[0].id).toBe('a');
    expect(blocks[0].messages.map((m) => m.id)).toEqual(['a', 'b']);
  });

  it('starts a new block when the author changes', () => {
    const blocks = groupMessages(
      [
        msg({ id: 'a', timestamp: iso(at(2026, 8, 8, 10, 0)) }),
        msg({ id: 'b', timestamp: iso(at(2026, 8, 8, 10, 1)), authorName: 'Ravi' }),
        msg({ id: 'c', timestamp: iso(at(2026, 8, 8, 10, 2)) }),
      ],
      NOW,
    );
    expect(blocks.map((b) => b.authorName)).toEqual(['Asha', 'Ravi', 'Asha']);
  });

  it('never lets a student share a block, or a badge, with a mentor of the same name', () => {
    const blocks = groupMessages(
      [
        msg({ id: 'a', timestamp: iso(at(2026, 8, 8, 10, 0)) }),
        msg({
          id: 'b',
          timestamp: iso(at(2026, 8, 8, 10, 1)),
          isMentor: true,
          badge: 'Counsellor',
        }),
      ],
      NOW,
    );
    expect(blocks).toHaveLength(2);
    expect(blocks[0].isMentor).toBe(false);
    expect(blocks[0].badge).toBeNull();
    expect(blocks[1].isMentor).toBe(true);
    expect(blocks[1].badge).toBe('Counsellor');
  });

  it('draws a divider on the first block of each day and nowhere else', () => {
    const blocks = groupMessages(
      [
        msg({ id: 'a', timestamp: iso(at(2026, 8, 7, 23, 50)) }),
        msg({ id: 'b', timestamp: iso(at(2026, 8, 8, 0, 10)) }),
        msg({ id: 'c', timestamp: iso(at(2026, 8, 8, 0, 11)), authorName: 'Ravi' }),
      ],
      NOW,
    );
    expect(blocks.map((b) => b.dayLabel)).toEqual(['Yesterday', 'Today', null]);
  });

  it('keeps the server order — this never re-sorts a thread', () => {
    const blocks = groupMessages(
      [
        msg({ id: 'late', timestamp: iso(at(2026, 8, 8, 11, 0)), authorName: 'Ravi' }),
        msg({ id: 'early', timestamp: iso(at(2026, 8, 8, 9, 0)) }),
      ],
      NOW,
    );
    expect(blocks.map((b) => b.id)).toEqual(['late', 'early']);
  });

  it('keeps an unnamed author readable and groups them together', () => {
    const blocks = groupMessages(
      [
        msg({ id: 'a', timestamp: iso(at(2026, 8, 8, 10, 0)), authorName: '' }),
        msg({ id: 'b', timestamp: iso(at(2026, 8, 8, 10, 1)), authorName: '' }),
      ],
      NOW,
    );
    expect(blocks).toHaveLength(1);
    expect(blocks[0].authorName).toBe('Someone');
  });

  it('survives an unreadable timestamp without inventing a divider', () => {
    const blocks = groupMessages([msg({ id: 'a', timestamp: 'whenever' })], NOW);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].dayLabel).toBeNull();
  });

  it('survives an empty, non-array or holey input', () => {
    expect(groupMessages([], NOW)).toEqual([]);
    expect(groupMessages(null as unknown as CommunityMessage[], NOW)).toEqual([]);
    expect(
      groupMessages(
        [null as unknown as CommunityMessage, msg({ id: 'a', timestamp: iso(NOW) })],
        NOW,
      ),
    ).toHaveLength(1);
  });
});

describe('monogramTile', () => {
  it('gives one person the same tile every time', () => {
    expect(monogramTile('Asha Verma')).toEqual(monogramTile('Asha Verma'));
  });

  it('always returns a usable pair of hex colours', () => {
    for (const name of ['Asha', 'Ravi Kumar', '', 'ਗੁਰਪ੍ਰੀਤ']) {
      const tile = monogramTile(name);
      expect(tile).toHaveLength(2);
      expect(tile[0]).toMatch(/^#[0-9a-f]{6}$/i);
      expect(tile[1]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('does not put everyone on one colour', () => {
    const seen = new Set(['Asha', 'Ravi', 'Meera', 'Dev', 'Iqbal', 'Tara'].map((n) => monogramTile(n)[0]));
    expect(seen.size).toBeGreaterThan(1);
  });
});

describe('initials', () => {
  it('is the booking monogram helper, re-exported rather than re-written', () => {
    expect(initials('Dr. Ashish Mohanty')).toBe('AM');
    expect(initials('')).toBe('?');
  });
});
