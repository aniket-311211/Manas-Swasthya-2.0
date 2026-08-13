import { useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import {
  BentoCardGrid,
  GlobalSpotlight,
  ParticleCard,
  useMobileDetection,
} from '@/components/MagicBento/MagicBento';
import { FileWarning, Search, Sparkles } from 'lucide-react';
import { RESOURCES, type Resource } from '@/lib/resources';
import { CARD, CATEGORIES, FOCUS, INK, MUTED, ON_SILK, ON_SILK_PILL, categoryOf, searchResources, suggestResources } from './catalogue';
import { hasFile, mediaTypeOf } from './media';
import { recentCodes } from './recent';

const KIND_LABEL: Record<string, string> = {
  audio: 'Listen',
  video: 'Watch',
  pdf: 'Read',
};

/** Hex -> "r, g, b" for the glow custom property. */
function rgbTriplet(hex: string): string {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

function ResourceCard({
  resource,
  onOpen,
  disableAnimations,
}: {
  resource: Resource;
  onOpen: (r: Resource) => void;
  disableAnimations: boolean;
}) {
  const cat = categoryOf(resource);
  const kind = mediaTypeOf(resource);
  const missing = kind !== null && !hasFile(resource);
  const glow = rgbTriplet(cat.accent);

  return (
    <ParticleCard
      as="button"
      type="button"
      onClick={() => onOpen(resource)}
      aria-label={`${resource.title}, ${cat.label}, code ${resource.code}`}
      className="magic-bento-card magic-bento-card--text-autohide magic-bento-card--border-glow"
      disableAnimations={disableAnimations}
      particleCount={12}
      glowColor={glow}
      enableTilt
      clickEffect
      enableMagnetism
      style={{ '--glow-color': glow } as React.CSSProperties}
    >
      <div className="magic-bento-card__header">
        <span
          className="rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold tracking-[0.08em]"
          style={{ backgroundColor: `${cat.accent}33`, color: '#FFFFFF' }}
        >
          {resource.code}
        </span>
        <span aria-hidden="true" className="text-[28px] leading-none">
          {resource.thumbnail}
        </span>
      </div>

      <div className="magic-bento-card__content">
        <span
          className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em]"
          style={{ backgroundColor: `${cat.accent}40`, color: '#FFFFFF' }}
        >
          {cat.label}
          {kind ? ` · ${KIND_LABEL[kind]}` : ''}
        </span>
        <h3 className="magic-bento-card__title">{resource.title}</h3>
        <p className="magic-bento-card__description">{resource.description}</p>
        <p className="mt-2 flex items-center gap-2 text-[11px] text-white/55">
          <span className="truncate">{resource.author}</span>
          {resource.duration && <span>· {resource.duration}</span>}
          {resource.pages && <span>· {resource.pages}p</span>}
          {missing && (
            <span className="ml-auto inline-flex shrink-0 items-center gap-1 text-[10px] text-white/70">
              <FileWarning className="h-3 w-3" aria-hidden="true" /> No file
            </span>
          )}
        </p>
      </div>
    </ParticleCard>
  );
}

export default function ResourceGrid({ onOpen }: { onOpen: (r: Resource) => void }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('all');
  const reduceMotion = useReducedMotion();
  const isMobile = useMobileDetection();
  const gridRef = useRef<HTMLDivElement>(null);
  // Particles and tilt are decoration; skip them on small screens and
  // whenever the OS asks for less motion.
  const disableAnimations = isMobile || !!reduceMotion;

  const results = useMemo(() => {
    const found = searchResources(query);
    return category === 'all' ? found : found.filter((r) => categoryOf(r).id === category);
  }, [query, category]);

  // Suggestions are only interesting before you start searching.
  const suggestions = useMemo(
    () => (query.trim() === '' ? suggestResources({ recentCodes: recentCodes(), limit: 3 }) : []),
    [query],
  );

  return (
    <div className="space-y-5">
      <div className={`${CARD} p-4`}>
        <label htmlFor="resource-search" className="sr-only">
          Search resources by name or code
        </label>
        <div className="flex items-center gap-3">
          <Search className={`h-4 w-4 shrink-0 ${MUTED}`} aria-hidden="true" />
          <input
            id="resource-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, tag, or code — try MUS-101"
            className={`min-w-0 flex-1 bg-transparent text-[15px] outline-none ${INK} placeholder:text-[#3F5C5F]/60`}
          />
        </div>
      </div>

      <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-2">
        {[{ id: 'all', label: 'Everything', accent: '#0E3A3D' }, ...CATEGORIES].map((c) => {
          const on = category === c.id;
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={on}
              onClick={() => setCategory(c.id)}
              className={`rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${FOCUS}`}
              style={
                on
                  ? { backgroundColor: c.accent, borderColor: c.accent, color: '#FFFFFF' }
                  : { backgroundColor: 'rgba(255,255,255,0.65)', borderColor: `${c.accent}40`, color: c.accent }
              }
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {suggestions.length > 0 && (
        <div className={`${CARD} p-4`}>
          <p className={`flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] ${MUTED}`}>
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> You might like
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {suggestions.map((r) => {
              const cat = categoryOf(r);
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => onOpen(r)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] ${FOCUS}`}
                    style={{ borderColor: `${cat.accent}40`, color: cat.accent }}
                  >
                    <span aria-hidden="true">{r.thumbnail}</span>
                    {r.title}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <p role="status" aria-live="polite" className={`${ON_SILK_PILL} text-[13px] ${ON_SILK}`}>
        {results.length === 0
          ? 'Nothing matches that yet.'
          : `${results.length} ${results.length === 1 ? 'resource' : 'resources'}`}
      </p>

      <GlobalSpotlight
        gridRef={gridRef}
        disableAnimations={disableAnimations}
        enabled
        spotlightRadius={490}
        glowColor="132, 0, 255"
      />

      <BentoCardGrid gridRef={gridRef}>
        {results.map((r) => (
          <ResourceCard key={r.id} resource={r} onOpen={onOpen} disableAnimations={disableAnimations} />
        ))}
      </BentoCardGrid>

    </div>
  );
}

export { RESOURCES };
