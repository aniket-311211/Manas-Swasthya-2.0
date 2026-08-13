import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { Resource } from '@/lib/resources';
import { BTN_QUIET, CARD, INK, MUTED, ON_SILK, ON_SILK_PANEL, categoryOf } from './catalogue';
import { mediaTypeOf } from './media';
import { recordAccess } from './recent';
import { ArticleReader, AudioPlayer, PdfReader, VideoPlayer } from './players';

/**
 * Opening a resource replaces the grid with an experience shaped to its type,
 * rather than a modal with a description in it.
 */
export default function ResourceViewer({
  resource,
  onBack,
}: {
  resource: Resource;
  onBack: () => void;
}) {
  const cat = categoryOf(resource);
  const kind = mediaTypeOf(resource);

  // Opening counts as accessing it; the dashboard reads this list.
  useEffect(() => {
    recordAccess(resource.code);
  }, [resource.code]);

  return (
    <section aria-labelledby="viewer-heading" className="space-y-4">
      <button type="button" onClick={onBack} className={BTN_QUIET}>
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All resources
      </button>

      <header className={ON_SILK_PANEL}>
        <p className={`font-mono text-[11px] uppercase tracking-[0.16em] ${ON_SILK}`}>
          {resource.code} · {cat.label}
        </p>
        <h1 id="viewer-heading" className={`mt-1 flex items-center gap-3 font-display text-[30px] leading-tight ${ON_SILK}`}>
          <span aria-hidden="true" className="text-[32px] leading-none">{resource.thumbnail}</span>
          {resource.title}
        </h1>
      </header>

      {kind === 'audio' ? (
        <AudioPlayer resource={resource} />
      ) : kind === 'video' ? (
        <VideoPlayer resource={resource} />
      ) : kind === 'pdf' ? (
        <PdfReader resource={resource} />
      ) : (
        <ArticleReader resource={resource} />
      )}

      {/* Media types show the file above; the written detail belongs underneath. */}
      {kind !== null && (
        <div className={`${CARD} p-6`}>
          <h2 className={`font-display text-[18px] ${INK}`}>About this</h2>
          <p className={`mt-2 text-[14px] leading-relaxed ${MUTED}`}>{resource.description}</p>
          <p className={`mt-3 text-[13px] ${MUTED}`}>
            {resource.author}
            {resource.duration ? ` · ${resource.duration}` : ''}
            {resource.pages ? ` · ${resource.pages} pages` : ''}
          </p>
          {resource.tags.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {resource.tags.map((t) => (
                <li
                  key={t}
                  className="rounded-full px-3 py-1 text-[12px]"
                  style={{ backgroundColor: `${cat.accent}1A`, color: cat.accent }}
                >
                  {t}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
