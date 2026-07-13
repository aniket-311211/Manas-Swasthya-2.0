export const HELPLINES = [
  { name: 'KIRAN (Govt of India, 24/7)', phone: '1800-599-0019' },
  { name: 'iCall (TISS)', phone: '9152987821' },
  { name: 'Vandrevala Foundation', phone: '9999666555' },
] as const;

const CRISIS_PATTERNS: RegExp[] = [
  /suicid/i,
  /kill\s*myself/i,
  /end\s*my\s*life/i,
  /want\s*to\s*die/i,
  /self[\s-]*harm/i,
  /hurt\s*myself/i,
  /no\s*reason\s*to\s*live/i,
  /better\s*off\s*dead/i,
  /marna\s*chahta/i,
  /jeena\s*nahi/i,
  /khudkushi/i,
  /cutting\s*myself/i,
  /overdose/i,
];

export function detectCrisis(text: string): boolean {
  return CRISIS_PATTERNS.some((p) => p.test(text));
}
