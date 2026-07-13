import type { Assessment } from '@/types/api';

export function wellnessScore(a: Assessment): number {
  return Math.round((100 - a.stress + (100 - a.anxiety) + a.sleep) / 3);
}
