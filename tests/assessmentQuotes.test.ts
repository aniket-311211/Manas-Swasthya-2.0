import { describe, it, expect } from 'vitest';
import {
  LOCAL_QUOTES,
  MAX_QUOTE_LEN,
  isGentleEnough,
  toneFor,
} from '../src/features/assessment/quotes';

describe('isGentleEnough', () => {
  it('accepts warm, ordinary lines', () => {
    for (const line of [
      'No feeling is final.',
      'Rest is not idleness.',
      'Be where your feet are, and let today be enough.',
      'You are allowed to be both a masterpiece and a work in progress.',
      'Hope is the thing with feathers that perches in the soul.',
    ]) {
      expect(isGentleEnough(line), line).toBe(true);
    }
  });

  it('rejects every banned framing', () => {
    const banned = [
      'Rise and grind, every single day.', // hustle
      'The hustle never sleeps.',
      'Do whatever it takes to get there.',
      'Success demands sacrifice.',
      'Weakness is a choice you keep making.', // toughness
      'Toughen up and keep moving.',
      'Man up and deal with it.',
      'Suck it up, buttercup.',
      'Be a beast about it.',
      'No pain, no gain.', // pain as teacher
      'Pain is temporary, quitting lasts forever.',
      'Your suffering is what makes you strong.',
      'No excuses, only results.', // blame
      'Stop making excuses and start moving.',
      'Only you can change your life.',
      'Nobody is going to save you but you.',
      'Losers quit when they are tired.', // winners and losers
      'Winners never rest.',
      'Refuse to live a mediocre life.',
    ];
    for (const line of banned) {
      expect(isGentleEnough(line), line).toBe(false);
    }
  });

  it('matches banned words case-insensitively', () => {
    expect(isGentleEnough('RISE AND GRIND.')).toBe(false);
    expect(isGentleEnough('No Pain, No Gain.')).toBe(false);
    expect(isGentleEnough('Only You Can decide.')).toBe(false);
  });

  it('matches on word boundaries, not naive substrings', () => {
    // "grind" is banned; the coffee is not.
    expect(isGentleEnough('There is a quiet joy in grinding coffee by hand.')).toBe(true);
    expect(isGentleEnough('The lamp glowed weakly in the hall.')).toBe(true); // "weakly" is not "weak"
    expect(isGentleEnough('Manage your morning, and the day follows.')).toBe(true); // "man up" needs the "up"
    expect(isGentleEnough('The paint is drying on the windowsill.')).toBe(true); // not "pain is temporary"
    // Over-rejection is the safe direction: this one still goes local.
    expect(isGentleEnough('The winner of the raffle was a stranger.')).toBe(false);
  });

  it('rejects anything longer than the cap, and empty text', () => {
    expect(isGentleEnough('a'.repeat(MAX_QUOTE_LEN))).toBe(true);
    expect(isGentleEnough('a'.repeat(MAX_QUOTE_LEN + 1))).toBe(false);
    expect(isGentleEnough('')).toBe(false);
    expect(isGentleEnough('   \n  ')).toBe(false);
  });
});

describe('toneFor', () => {
  it('maps a harder result to a gentler quote', () => {
    expect(toneFor(0)).toBe('gentle');
    expect(toneFor(20)).toBe('gentle');
    expect(toneFor(50)).toBe('steady');
    expect(toneFor(80)).toBe('bright');
    expect(toneFor(100)).toBe('bright');
  });

  it('is exact at the riskFrom() boundaries', () => {
    expect(toneFor(39)).toBe('gentle');
    expect(toneFor(40)).toBe('steady');
    expect(toneFor(64)).toBe('steady');
    expect(toneFor(65)).toBe('bright');
  });
});

describe('LOCAL_QUOTES', () => {
  it('are all usable', () => {
    expect(LOCAL_QUOTES.length).toBeGreaterThanOrEqual(8);
    for (const q of LOCAL_QUOTES) {
      expect(q.text.trim().length, q.text).toBeGreaterThan(0);
      expect(q.author.trim().length, q.text).toBeGreaterThan(0);
      expect(q.source).toBe('local');
    }
  });

  it('all pass the filter they are the fallback for', () => {
    for (const q of LOCAL_QUOTES) {
      expect(isGentleEnough(q.text), q.text).toBe(true);
    }
  });
});
