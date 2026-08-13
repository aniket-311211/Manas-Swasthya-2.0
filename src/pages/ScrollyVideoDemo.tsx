import { ArrowLeft, ChevronDown, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import ScrollyVideoSection from '@/components/ScrollyVideoSection';
import './scrolly-video-demo.css';

const ScrollyVideoDemo = () => (
  <main className="scrolly-demo">
    <header className="scrolly-demo__topbar">
      <Link to="/" className="scrolly-demo__back">
        <ArrowLeft size={16} />
        ManasSwasthya
      </Link>
      <a
        href="https://github.com/dkaoster/scrolly-video"
        target="_blank"
        rel="noreferrer"
        className="scrolly-demo__source"
      >
        scrolly-video <ExternalLink size={14} />
      </a>
    </header>

    <section className="scrolly-demo__intro">
      <p className="scrolly-demo__kicker">A working integration</p>
      <h1>Scroll through a feeling.</h1>
      <p>
        The video below is controlled by your scroll position. It is a useful
        pattern for showing a process, a breathing rhythm, or a visual story
        without asking people to press play.
      </p>
      <div className="scrolly-demo__scroll-cue">
        <span>Scroll to begin</span>
        <ChevronDown size={18} />
      </div>
    </section>

    <ScrollyVideoSection
      src="/animation/Inside%20Out%20-%20Emotional%20Intelligence.mp4"
      eyebrow="A gentler way to notice"
      title="Make room for what you feel."
      description="The media stays quiet. Your movement becomes the control, so the story unfolds only when you are ready to move through it."
    />

    <section className="scrolly-demo__outro">
      <p className="scrolly-demo__kicker">What you can build next</p>
      <h2>Swap in your own MP4 and make the scroll mean something.</h2>
      <p>
        Keep the section as a reusable block, or use the same component inside
        a landing page, resource detail, or guided exercise.
      </p>
      <Link to="/" className="scrolly-demo__button">
        Back to home <ArrowLeft size={16} />
      </Link>
    </section>
  </main>
);

export default ScrollyVideoDemo;
