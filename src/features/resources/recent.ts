import { RESOURCES, type Resource } from '@/lib/resources';
import { resourceByCode } from './catalogue';

/**
 * Recently opened resources, per device.
 *
 * localStorage rather than a table: there is no `resource_views` model and
 * adding one for a browsing convenience would be a migration for very little.
 * Every read and write is guarded — private mode, a full quota and hand-edited
 * JSON all degrade to an empty list rather than taking the page down.
 */

const KEY = 'nmc:resources:recent:v1';
const CAP = 20;

/** Dispatched on window after a write, so open views can react without polling. */
export const RECENT_EVENT = 'manas:resources:recent';

function read(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === 'string' && v !== '').slice(0, CAP);
  } catch {
    return [];
  }
}

export function recentCodes(limit = CAP): string[] {
  return read().slice(0, Math.max(0, limit));
}

export function recordAccess(code: string): void {
  if (typeof code !== 'string' || code.trim() === '') return;
  const next = [code, ...read().filter((c) => c !== code)].slice(0, CAP);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Quota or private mode. Browsing still works; only the history is lost.
    return;
  }
  try {
    window.dispatchEvent(new CustomEvent(RECENT_EVENT));
  } catch {
    // Non-browser environment; nothing to notify.
  }
}

/** Codes that no longer match a catalogue entry are skipped, not rendered blank. */
export function recentResources(limit = 6, items: Resource[] = RESOURCES): Resource[] {
  const out: Resource[] = [];
  for (const code of read()) {
    const found = resourceByCode(code, items);
    if (found) out.push(found);
    if (out.length >= limit) break;
  }
  return out;
}

export function clearRecent(): void {
  try {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new CustomEvent(RECENT_EVENT));
  } catch {
    // Nothing to do — an unclearable history is not worth an error state.
  }
}
