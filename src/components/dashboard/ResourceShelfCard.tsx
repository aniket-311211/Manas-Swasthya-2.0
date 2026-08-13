import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { GLASS } from '@/components/shell/theme';
import type { Resource } from '@/lib/resources';
import { categoryOf, suggestResources } from '@/features/resources/catalogue';
import { RECENT_EVENT, recentCodes, recentResources } from '@/features/resources/recent';

const EYEBROW = 'font-mono text-[11px] uppercase tracking-[0.14em] text-[#8A93A3]';
const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E3A59]';

function Row({ resource }: { resource: Resource }) {
  const cat = categoryOf(resource);
  return (
    <li>
      <Link
        to="/resources"
        className={`flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 hover:bg-[#EEF0F5] ${FOCUS}`}
      >
        <span
          aria-hidden="true"
          className="h-6 w-1 shrink-0 rounded-full"
          style={{ backgroundColor: cat.accent }}
        />
        <span className="min-w-0 flex-1 truncate text-[13px] text-[#1B2430]">{resource.title}</span>
        <span className="shrink-0 font-mono text-[10px] text-[#8A93A3]">{resource.code}</span>
      </Link>
    </li>
  );
}

/**
 * What you opened last, and one thing you might like next.
 *
 * Recents come from localStorage, so this listens for the RECENT_EVENT the
 * resources page dispatches — otherwise opening something in another tab would
 * leave this card stale until a reload.
 */
export default function ResourceShelfCard() {
  const [recent, setRecent] = useState<Resource[]>([]);
  const [suggestions, setSuggestions] = useState<Resource[]>([]);

  const refresh = useCallback(() => {
    setRecent(recentResources(3));
    setSuggestions(suggestResources({ recentCodes: recentCodes(), limit: 2 }));
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(RECENT_EVENT, refresh);
    return () => window.removeEventListener(RECENT_EVENT, refresh);
  }, [refresh]);

  return (
    <div className={`${GLASS} flex h-full flex-col p-6`}>
      <h2 className={EYEBROW}>Recently opened</h2>

      {recent.length > 0 ? (
        <ul className="mt-2 space-y-0.5">
          {recent.map((r) => (
            <Row key={r.id} resource={r} />
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-[13px] leading-relaxed text-[#5A6472]">
          Nothing opened yet. Music, books, films and short activities are all in one place.
        </p>
      )}

      {suggestions.length > 0 && (
        <>
          <h3 className={`${EYEBROW} mt-5 flex items-center gap-1.5`}>
            <Sparkles className="h-3 w-3" aria-hidden="true" /> You might like
          </h3>
          <ul className="mt-2 space-y-0.5">
            {suggestions.map((r) => (
              <Row key={r.id} resource={r} />
            ))}
          </ul>
        </>
      )}

      <Link to="/resources" className={`mt-auto pt-4 text-[13px] font-semibold text-[#2E3A59] ${FOCUS}`}>
        Browse resources →
      </Link>
    </div>
  );
}
