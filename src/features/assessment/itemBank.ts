import { DOMAINS, type AssessmentItem, type Domain } from './domain';

/**
 * The fixed item bank: 18 items, 3 per domain.
 *
 * Wording is original, written for this product and for Indian college life —
 * semesters, internals, placements, hostel, attendance, family calls. It is
 * deliberately NOT a reproduction of PHQ-9, GAD-7, PSS or any validated
 * instrument: those are licensed, and copying them would imply a diagnostic
 * claim this app must never make.
 *
 * Every item has exactly 4 options running most-positive → most-concerning with
 * weights 1 / 0.66 / 0.33 / 0. Even spacing, one direction, no per-item
 * weighting — a scale nobody has to remember the exceptions to is a scale that
 * still adds up correctly a year from now.
 *
 * `facets` decide which items feed the stress / anxiety / sleep headline
 * numbers. Each facet has two items inside a single domain (emotional for
 * stress and anxiety, physical for sleep) so that `pickSession`, which keeps 2
 * of every domain's 3 items, can never produce a session with zero inputs for a
 * facet.
 */
export const ITEMS: AssessmentItem[] = [
  {
    id: 'aca-deadlines',
    domain: 'academic',
    prompt: 'Submissions, internals and a viva landing in the same week — how has that been going for you lately?',
    facets: ['stress'],
    options: [
      { label: 'I sort them one by one and it usually works out', weight: 1 },
      { label: "It's a lot, but I get there in the end", weight: 0.66 },
      { label: 'I keep falling behind and finish things at the last minute', weight: 0.33 },
      { label: 'It stacks up faster than I can clear it', weight: 0 },
    ],
  },
  {
    id: 'aca-placements',
    domain: 'academic',
    prompt: "When placements, higher studies or 'what after this degree' come up, what usually happens for you?",
    facets: ['anxiety'],
    options: [
      { label: 'I have a rough plan and thinking about it feels okay', weight: 1 },
      { label: 'I wonder about it, then get back to what is in front of me', weight: 0.66 },
      { label: 'It sits in my head a lot and is hard to shake off', weight: 0.33 },
      { label: 'It winds me up so much that I would rather not think about it', weight: 0 },
    ],
  },
  {
    id: 'aca-attendance',
    domain: 'academic',
    prompt: 'How have classes and attendance been this semester?',
    options: [
      { label: 'I am going regularly and keeping up with what is covered', weight: 1 },
      { label: 'I miss a few, but nothing I cannot cover later', weight: 0.66 },
      { label: 'I am skipping more than I would like and the gap is showing', weight: 0.33 },
      { label: 'I have stopped going to most of them', weight: 0 },
    ],
  },

  {
    id: 'soc-belonging',
    domain: 'social',
    prompt: 'Around your hostel, class or friend circle, how much does it feel like you belong?',
    options: [
      { label: 'I have found my people here and it feels easy', weight: 1 },
      { label: 'There are a few people I am comfortable with', weight: 0.66 },
      { label: 'I am around people a lot but still feel a bit outside it', weight: 0.33 },
      { label: 'Mostly it feels like I am on my own here', weight: 0 },
    ],
  },
  {
    id: 'soc-reaching-out',
    domain: 'social',
    prompt: 'When you need to speak up — asking a doubt in class, messaging a senior, joining a table in the mess — how does that go?',
    facets: ['anxiety'],
    options: [
      { label: 'I just do it, it does not take much out of me', weight: 1 },
      { label: 'I hesitate for a moment, then go ahead', weight: 0.66 },
      { label: 'I rehearse it in my head and often let it pass', weight: 0.33 },
      { label: 'I avoid it, even when I really need to', weight: 0 },
    ],
  },
  {
    id: 'soc-family',
    domain: 'social',
    prompt: 'When you talk to family about how college is going, how does that usually leave you feeling?',
    facets: ['stress'],
    options: [
      { label: 'Lighter — I can be honest with them', weight: 1 },
      { label: 'Fine, though I keep some of it to myself', weight: 0.66 },
      { label: 'Tense — I mostly tell them what they want to hear', weight: 0.33 },
      { label: 'Under a lot of pressure to be doing better than I am', weight: 0 },
    ],
  },

  {
    id: 'emo-mood',
    domain: 'emotional',
    prompt: 'Thinking about the last two weeks, how has your mood been overall?',
    options: [
      { label: 'Steady, with plenty of days I enjoyed', weight: 1 },
      { label: 'Up and down, but it evens out', weight: 0.66 },
      { label: 'Low more often than not', weight: 0.33 },
      { label: 'Flat or heavy for most of the last two weeks', weight: 0 },
    ],
  },
  {
    id: 'emo-onedge',
    domain: 'emotional',
    prompt: 'How often have you felt on edge lately — keyed up, restless, like something is about to go wrong?',
    facets: ['stress', 'anxiety'],
    options: [
      { label: 'Rarely, and only around something big', weight: 1 },
      { label: 'Now and then, and it passes', weight: 0.66 },
      { label: 'Most days, and it takes a while to settle', weight: 0.33 },
      { label: 'Almost all the time, even when nothing is happening', weight: 0 },
    ],
  },
  {
    id: 'emo-worry',
    domain: 'emotional',
    prompt: 'When something is coming up — a presentation, a result, a call home — how much room does the worry take up beforehand?',
    facets: ['stress', 'anxiety'],
    options: [
      { label: 'A little, then I get on with the day', weight: 1 },
      { label: 'It comes and goes the day before', weight: 0.66 },
      { label: 'It takes over most of my week leading up to it', weight: 0.33 },
      { label: 'It crowds out everything else, long before the day arrives', weight: 0 },
    ],
  },

  {
    id: 'beh-putting-off',
    domain: 'behavioral',
    prompt: 'How are you doing with the things you have been meaning to get to — that assignment, that form, that reply?',
    options: [
      { label: 'I start them roughly when I plan to', weight: 1 },
      { label: 'I delay a bit, but they get done', weight: 0.66 },
      { label: 'I put them off until the deadline is on top of me', weight: 0.33 },
      { label: 'They are piling up and I cannot seem to start any of them', weight: 0 },
    ],
  },
  {
    id: 'beh-late-nights',
    domain: 'behavioral',
    prompt: 'What do your nights before a college day usually look like?',
    facets: ['sleep'],
    options: [
      { label: 'I wind down and get to bed at a reasonable hour', weight: 1 },
      { label: 'Later than I mean to, but the morning is fine', weight: 0.66 },
      { label: 'Up scrolling or working till very late most nights', weight: 0.33 },
      { label: 'My nights and days have basically swapped around', weight: 0 },
    ],
  },
  {
    id: 'beh-withdraw',
    domain: 'behavioral',
    prompt: 'The things you used to enjoy — cricket, music, a club, just chai with friends — how much are they still part of your week?',
    options: [
      { label: 'Still there, and they still lift me', weight: 1 },
      { label: 'Less than before, but I make time when I can', weight: 0.66 },
      { label: 'I have mostly dropped them', weight: 0.33 },
      { label: 'I say no to everything now, even things I miss', weight: 0 },
    ],
  },

  {
    id: 'cog-focus',
    domain: 'cognitive',
    prompt: 'When you sit down to study, or you are in a lecture, how is your focus holding up?',
    options: [
      { label: 'I settle in and stay with it', weight: 1 },
      { label: 'It drifts, but I can pull it back', weight: 0.66 },
      { label: 'I re-read the same page and it does not go in', weight: 0.33 },
      { label: 'I can barely hold my attention on anything', weight: 0 },
    ],
  },
  {
    id: 'cog-overthinking',
    domain: 'cognitive',
    prompt: 'How often do you find yourself replaying a conversation, or running through everything that could go wrong?',
    facets: ['anxiety'],
    options: [
      { label: 'Rarely — I think it through once and let it go', weight: 1 },
      { label: 'Sometimes, usually before something important', weight: 0.66 },
      { label: 'Most days, and it is hard to switch off', weight: 0.33 },
      { label: 'Constantly, and it follows me into the night', weight: 0 },
    ],
  },
  {
    id: 'cog-memory',
    domain: 'cognitive',
    prompt: 'How is your memory for everyday things — submission dates, where you kept your ID card, what a friend asked you to do?',
    options: [
      { label: 'Sharp enough, I rarely lose track', weight: 1 },
      { label: 'I forget small things, nothing serious', weight: 0.66 },
      { label: 'I am forgetting things that matter and it is costing me', weight: 0.33 },
      { label: 'I cannot keep track of much at all right now', weight: 0 },
    ],
  },

  {
    id: 'phy-falling-asleep',
    domain: 'physical',
    prompt: 'Once you are actually in bed, how long does it take you to fall asleep?',
    facets: ['sleep'],
    options: [
      { label: 'I am out fairly quickly', weight: 1 },
      { label: 'Twenty minutes or so, most nights', weight: 0.66 },
      { label: 'I lie awake a long while before I drop off', weight: 0.33 },
      { label: 'Hours, or sleep comes and goes all night', weight: 0 },
    ],
  },
  {
    id: 'phy-rested',
    domain: 'physical',
    prompt: 'How do you feel when the morning alarm goes off?',
    facets: ['sleep'],
    options: [
      { label: 'Rested enough to get going', weight: 1 },
      { label: 'Slow to start, but okay after a while', weight: 0.66 },
      { label: 'Tired most mornings, no matter when I slept', weight: 0.33 },
      { label: 'Wiped out before the day has even begun', weight: 0 },
    ],
  },
  {
    id: 'phy-body',
    domain: 'physical',
    prompt: 'Has your body been showing the strain — appetite off, headaches, a tight chest or stomach before something big?',
    facets: ['stress'],
    options: [
      { label: 'Not really, I am eating and feeling normal', weight: 1 },
      { label: 'Once in a while, around exams or presentations', weight: 0.66 },
      { label: 'Fairly often, and my eating has changed with it', weight: 0.33 },
      { label: 'Very often now, and it is hard to ignore', weight: 0 },
    ],
  },
];

export function itemsFor(domain: Domain): AssessmentItem[] {
  return ITEMS.filter((i) => i.domain === domain);
}

/** Numerical-Recipes LCG. Deterministic, seeded, and nine bytes of state. */
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/**
 * A balanced 12-item session: 2 from each domain, dealt in two rounds so the
 * student is not answering three academic questions in a row.
 *
 * WHY THE SEED IS FIXED: this defaulted to `Date.now()`, so every run drew a
 * different two-of-three per domain — 729 possible sessions. The whole point of
 * a fixed item bank is that "your sleep score went from 40 to 62" compares the
 * same questions; with a rolling seed it compared different ones, and the trend
 * line, the radar and the "what changed" narrative were all measuring noise.
 *
 * Pass a seed only to deliberately vary the wording — a study using two
 * matched forms, say. Everyday retakes must not.
 */
const STABLE_SEED = 20260101;

export function pickSession(seed: number = STABLE_SEED): AssessmentItem[] {
  const next = rng(seed);
  const first: AssessmentItem[] = [];
  const second: AssessmentItem[] = [];
  for (const domain of DOMAINS) {
    const items = itemsFor(domain);
    // Every domain is expected to carry three items; guard anyway, so adding a
    // thin one degrades the session instead of pushing `undefined` into it and
    // throwing on `item.options.map`.
    if (items.length < 2) continue;
    const drop = items.length > 2 ? Math.floor(next() * items.length) : -1;
    const kept = items.filter((_, i) => i !== drop);
    if (kept[0]) first.push(kept[0]);
    if (kept[1]) second.push(kept[1]);
  }
  return [...first, ...second];
}
