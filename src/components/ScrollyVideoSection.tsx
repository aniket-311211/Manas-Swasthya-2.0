import { useEffect, useState } from 'react';
import ScrollyVideo from 'scrolly-video/dist/ScrollyVideo.esm.jsx';
import './scrolly-video.css';

interface ScrollyVideoSectionProps {
  src: string;
  eyebrow?: string;
  title?: string;
  description?: string;
}

const usePrefersReducedMotion = () => {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener('change', updatePreference);
    return () => mediaQuery.removeEventListener('change', updatePreference);
  }, []);

  return reducedMotion;
};

const ScrollyVideoSection = ({
  src,
  eyebrow = 'Scroll-led storytelling',
  title = 'Let the page move at your pace.',
  description = 'This section turns your scroll position into a video timeline. Keep scrolling to move forward, or scroll back to revisit the moment that matters.',
}: ScrollyVideoSectionProps) => {
  const [isReady, setIsReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const reducedMotion = usePrefersReducedMotion();

  return (
    <section className="scrolly-story" aria-label="Scrollable video story">
      <div className="scrolly-story__stage">
        <div className="scrolly-story__video" aria-hidden="true">
          <ScrollyVideo
            src={src}
            cover
            full
            sticky={!reducedMotion}
            trackScroll={!reducedMotion}
            lockScroll
            transitionSpeed={10}
            onReady={() => setIsReady(true)}
            onChange={(percentage) => {
              setProgress(Math.max(0, Math.min(1, percentage)));
            }}
          />
        </div>

        <div className="scrolly-story__wash" />

        <div className="scrolly-story__copy">
          <div className="scrolly-story__copy-inner">
            <p className="scrolly-story__eyebrow">{eyebrow}</p>
            <h2>{title}</h2>
            <p className="scrolly-story__description">{description}</p>
            <div className="scrolly-story__status" aria-live="polite">
              <span className={`scrolly-story__dot${isReady ? ' is-ready' : ''}`} />
              {isReady ? 'Video ready' : 'Preparing the first frame'}
            </div>
          </div>
        </div>

        <div className="scrolly-story__progress" aria-hidden="true">
          <span style={{ transform: `scaleX(${progress})` }} />
        </div>

        <div className="scrolly-story__hint" aria-hidden="true">
          <span>Keep scrolling</span>
          <span className="scrolly-story__arrow">↓</span>
        </div>
      </div>
    </section>
  );
};

export default ScrollyVideoSection;
