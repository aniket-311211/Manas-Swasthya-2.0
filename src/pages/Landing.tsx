import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import type { CSSProperties, ReactNode } from 'react';

const F_BARLOW = "'Barlow', sans-serif";
const F_SERIF = "'Instrument Serif', serif";
const ACCENT = 'var(--accent, #9BE7C0)';

/* ---------- shared inline-style objects ---------- */

const tagPill: CSSProperties = {
  borderRadius: 999,
  padding: '4px 11px',
  fontSize: 11,
  color: 'rgba(255,255,255,0.9)',
  fontFamily: F_BARLOW,
  whiteSpace: 'nowrap',
};

const kicker: CSSProperties = {
  fontSize: 14,
  color: 'rgba(255,255,255,0.8)',
  margin: '0 0 18px',
  fontFamily: F_BARLOW,
  letterSpacing: '.5px',
};

const secH2: CSSProperties = {
  margin: 0,
  fontFamily: F_SERIF,
  fontStyle: 'italic',
  fontWeight: 400,
  color: '#fff',
};

const cardH3: CSSProperties = {
  margin: '0 0 10px',
  fontFamily: F_SERIF,
  fontStyle: 'italic',
  fontWeight: 400,
  fontSize: '2rem',
  letterSpacing: -1,
  lineHeight: 1,
  color: '#fff',
};

const glassSq = (size: number, radius: string): CSSProperties => ({
  display: 'grid',
  placeItems: 'center',
  height: size,
  width: size,
  borderRadius: radius,
  flexShrink: 0,
});

const navLink: CSSProperties = {
  padding: '8px 12px',
  fontSize: 14,
  fontWeight: 500,
  color: 'rgba(255,255,255,0.9)',
  fontFamily: F_BARLOW,
  borderRadius: 999,
};

const ctaPrimary: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 9,
  borderRadius: 999,
  padding: '12px 22px',
  fontSize: 15,
  fontWeight: 500,
  color: '#fff',
  fontFamily: F_BARLOW,
  boxShadow: `0 0 34px -8px ${ACCENT}, inset 0 1px 1px rgba(255,255,255,0.15)`,
};

const ctaGhost: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 9,
  fontSize: 15,
  fontWeight: 400,
  color: '#fff',
  fontFamily: F_BARLOW,
};

/* ---------- small svg icons (stroke: currentColor) ---------- */

const ArrowIcon = ({ size = 17 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 17L17 7" />
    <path d="M7 7h10v10" />
  </svg>
);

const ChatIcon = ({ size = 18, strokeWidth = 1.8 }: { size?: number; strokeWidth?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7A8.4 8.4 0 0 1 4 11.5 8.5 8.5 0 0 1 21 11.5z" />
  </svg>
);

const PhoneIcon = ({ size = 20, strokeWidth = 1.6 }: { size?: number; strokeWidth?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

/* ---------- content data ---------- */

const FEATURES: { icon: ReactNode; tags: string[]; title: string; body: string; delay?: string }[] = [
  {
    icon: <ChatIcon size={22} strokeWidth={1.7} />,
    tags: ['24/7', 'Judgment-free', 'Crisis-aware'],
    title: 'AI Chat Companion',
    body: 'Talk to Manas about stress, anxiety, relationships or exam pressure — anytime. Real-time crisis detection surfaces verified Indian helplines the moment it matters.',
  },
  {
    icon: (
      <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z" />
        <path d="M18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8z" />
      </svg>
    ),
    tags: ['Academic', 'Emotional', '+4 domains'],
    title: 'Adaptive Assessment',
    body: 'Not a static form. Each question is generated live from your previous answers across six domains — adapting the way a thoughtful counselor would.',
    delay: '.08s',
  },
  {
    icon: (
      <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
        <circle cx={9} cy={8} r={3} />
        <path d="M3 20a6 6 0 0 1 12 0" />
        <circle cx={17} cy={9} r={2.4} />
        <path d="M15.5 20a5.5 5.5 0 0 1 6.5-4.6" />
      </svg>
    ),
    tags: ['Anonymous groups', 'Peer mentors', 'Events'],
    title: 'Community & Mentors',
    body: 'Connect with students who get it. Join anonymous discussions, talk one-on-one with trained peer mentors, and sign up for campus wellness events.',
    delay: '.16s',
  },
  {
    icon: (
      <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12h4l2-6 4 12 2-6h6" />
      </svg>
    ),
    tags: ['Daily mood log', 'Medicine scan'],
    title: 'Mood & Medicine Insights',
    body: 'Log how you feel and let AI surface patterns over time. Snap a photo of a medicine label to understand its uses, side effects and safety — clearly explained.',
    delay: '.24s',
  },
];

const STEPS: { num: string; title: string; body: string; delay?: string }[] = [
  {
    num: '01',
    title: 'Start where you are',
    body: 'Take a free adaptive check-in, or just start talking to Manas. No forms, no waiting rooms.',
  },
  {
    num: '02',
    title: 'Understand what you carry',
    body: 'AI reflects your stress across six domains in plain language — never a diagnosis, always a starting point.',
    delay: '.08s',
  },
  {
    num: '03',
    title: 'Get real support',
    body: 'Chat 24/7, meet peer mentors, or join anonymous circles. Crisis language instantly surfaces verified helplines.',
    delay: '.16s',
  },
  {
    num: '04',
    title: 'Track and grow',
    body: 'Log daily moods, watch patterns emerge, and revisit resources whenever you need them.',
    delay: '.24s',
  },
];

const SAFETY: { icon: ReactNode; title: string; body: string; delay?: string }[] = [
  {
    icon: (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l7 3v5c0 4.2-2.8 7.4-7 9-4.2-1.6-7-4.8-7-9V6z" />
        <path d="M12 9v4" />
        <path d="M12 16h.01" />
      </svg>
    ),
    title: 'Multi-layer crisis detection',
    body: 'Every message and answer is scanned in real time. Strong signals trigger an immediate, human-first response.',
  },
  {
    icon: <PhoneIcon />,
    title: 'Verified Indian helplines',
    body: "We route to Tele MANAS, KIRAN, Vandrevala and more — real, reachable, and available 24/7.",
    delay: '.08s',
  },
  {
    icon: (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <rect x={4} y={10} width={16} height={10} rx={2} />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </svg>
    ),
    title: 'Private by default',
    body: 'Confidential and judgment-free. Your words stay yours — no stigma, no exposure.',
    delay: '.16s',
  },
];

const STORIES: { quote: string; who: string; delay?: string }[] = [
  {
    quote: '"I talked to Manas at 2 a.m. before an exam when I couldn\'t tell anyone. It didn\'t judge me — it just listened."',
    who: 'Ananya · 2nd year',
  },
  {
    quote: '"The check-in put words to what I\'d been feeling for months. That was the first step to actually asking for help."',
    who: 'Rohit · final year',
    delay: '.08s',
  },
  {
    quote: '"Finding an anonymous group going through the same placement stress made me feel a lot less alone."',
    who: 'Priya · 3rd year',
    delay: '.16s',
  },
];

const EXPLORE_LINKS: { to: string; label: string }[] = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/chat', label: 'Talk to Manas' },
  { to: '/assessment', label: 'Assessment' },
  { to: '/community', label: 'Community' },
  { to: '/resources', label: 'Resources' },
  { to: '/about', label: 'About' },
];

const HELPLINES: { name: string; note: string; tel: string; display: string }[] = [
  { name: 'Tele MANAS', note: '· govt · 24/7', tel: 'tel:14416', display: '14416' },
  { name: 'KIRAN', note: '· 24/7', tel: 'tel:18005990019', display: '1800-599-0019' },
  { name: 'Vandrevala', note: '· 24/7', tel: 'tel:18602662345', display: '1860-266-2345' },
  { name: 'AASRA', note: '· 24/7', tel: 'tel:9820466726', display: '98204-66726' },
  { name: 'iCall', note: '· Mon–Sat, 10–8', tel: 'tel:9152987821', display: '9152987821' },
  { name: 'Emergency', note: '· all-India', tel: 'tel:112', display: '112' },
];

/* ---------- page css (from template, fonts loaded via index.html) ---------- */

const PAGE_CSS = `
  .ms-landing, .ms-landing * { box-sizing: border-box; }
  .ms-landing { margin: 0; padding: 0; background: #000; color: #fff; font-family: 'Barlow', sans-serif; -webkit-font-smoothing: antialiased; }
  html { scroll-behavior: smooth; }
  .ms-landing a { color: #fff; text-decoration: none; }
  .ms-landing a:hover { color: var(--accent, #9BE7C0); }
  .ms-landing section[id] { scroll-margin-top: 90px; }

  @keyframes blurIn { from { filter: blur(10px); opacity: 0; transform: translateY(20px); } to { filter: blur(0); opacity: 1; transform: none; } }
  @keyframes blurWord { from { filter: blur(10px); opacity: 0; transform: translateY(50px); } to { filter: blur(0); opacity: 1; transform: none; } }

  .ms-landing .anim { animation: blurIn .8s cubic-bezier(.22,1,.36,1) both; }
  .ms-landing .word { display: inline-block; margin-right: .28em; animation: blurWord .7s cubic-bezier(.22,1,.36,1) both; }
  .ms-landing .reveal { filter: blur(10px); opacity: 0; transform: translateY(30px); transition: filter .7s cubic-bezier(.22,1,.36,1), opacity .7s ease, transform .7s cubic-bezier(.22,1,.36,1); }
  .ms-landing .reveal.in { filter: none; opacity: 1; transform: none; }

  .m-calm .anim { animation-duration: 1.5s; } .m-calm .word { animation-duration: 1.15s; }
  .m-off .anim, .m-off .word { animation: none !important; opacity: 1 !important; filter: none !important; transform: none !important; }
  .m-off .reveal { opacity: 1 !important; filter: none !important; transform: none !important; transition: none !important; }
  @media (prefers-reduced-motion: reduce) {
    .ms-landing .anim, .ms-landing .word { animation: none !important; opacity: 1 !important; filter: none !important; transform: none !important; }
    .ms-landing .reveal { opacity: 1 !important; filter: none !important; transform: none !important; transition: none !important; }
  }

  .liquid-glass { position: relative; overflow: hidden; background: rgba(255,255,255,0.01); background-blend-mode: luminosity; backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); box-shadow: inset 0 1px 1px rgba(255,255,255,0.1); }
  .liquid-glass::before { content: ""; position: absolute; inset: 0; border-radius: inherit; padding: 1.4px; background: linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.15) 20%, rgba(255,255,255,0) 40%, rgba(255,255,255,0) 60%, rgba(255,255,255,0.15) 80%, rgba(255,255,255,0.45) 100%); -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none; }
  .liquid-glass-strong { position: relative; overflow: hidden; background: rgba(255,255,255,0.01); background-blend-mode: luminosity; backdrop-filter: blur(50px); -webkit-backdrop-filter: blur(50px); box-shadow: 4px 4px 4px rgba(0,0,0,0.05), inset 0 1px 1px rgba(255,255,255,0.15); }
  .liquid-glass-strong::before { content: ""; position: absolute; inset: 0; border-radius: inherit; padding: 1.4px; background: linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 20%, rgba(255,255,255,0) 40%, rgba(255,255,255,0) 60%, rgba(255,255,255,0.2) 80%, rgba(255,255,255,0.5) 100%); -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none; }

  /* ---- global aurora (northern lights) ---- */
  .aurora-fixed { position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }
  .aurora-band { position: absolute; border-radius: 50%; filter: blur(72px); will-change: transform; opacity: 0.9; }
  @keyframes auroraDrift1 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(6vw,4vh) scale(1.18); } }
  @keyframes auroraDrift2 { 0%,100% { transform: translate(0,0) scale(1.05); } 50% { transform: translate(-7vw,-5vh) scale(1.22); } }
  @keyframes auroraDrift3 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(4vw,-4vh) scale(1.15); } }

  /* ---- animated section backdrops ---- */
  .backdrop { position: absolute; inset: 0; z-index: 0; overflow: hidden; pointer-events: none; }
  .blob { position: absolute; border-radius: 50%; filter: blur(52px); will-change: transform; }
  .m-off .bg-anim { animation-play-state: paused !important; }
  @media (prefers-reduced-motion: reduce) { .bg-anim { animation-play-state: paused !important; } }

  @keyframes auroraA { 0% { transform: translate(-10%,-6%) scale(1); } 50% { transform: translate(8%,6%) scale(1.25); } 100% { transform: translate(-10%,-6%) scale(1); } }
  @keyframes auroraB { 0% { transform: translate(10%,8%) scale(1.1); } 50% { transform: translate(-8%,-6%) scale(1.32); } 100% { transform: translate(10%,8%) scale(1.1); } }
  @keyframes panA { 0% { transform: translate(0,0); } 100% { transform: translate(44px,44px); } }
  @keyframes panB { 0% { transform: translate(0,0); } 100% { transform: translate(-70px,70px); } }
  @keyframes flowA { 0% { transform: translate(0,0); } 100% { transform: translate(130px,60px); } }
  @keyframes flowB { 0% { transform: translate(0,0); } 100% { transform: translate(200px,93px); } }
  @keyframes ripple { 0% { transform: translate(-50%,-50%) scale(.15); opacity: .55; } 80% { opacity: .04; } 100% { transform: translate(-50%,-50%) scale(2.6); opacity: 0; } }
  @keyframes bloomDrift { 0% { transform: translate(-8%,4%) scale(1); } 50% { transform: translate(6%,-6%) scale(1.2); } 100% { transform: translate(-8%,4%) scale(1); } }
  @keyframes breathe { 0%,100% { transform: scale(.9); opacity: .35; } 50% { transform: scale(1.15); opacity: .62; } }

  .nav-pad { padding: 0 32px; }
  @media (min-width: 1024px) { .nav-pad { padding: 0 64px; } }
  .nav-center { display: none; }
  @media (min-width: 768px) { .nav-center { display: flex; } }

  .sec-pad { padding: 100px 24px; }
  @media (min-width: 768px) { .sec-pad { padding: 128px 64px; } }
  .wrap { max-width: 1180px; margin: 0 auto; width: 100%; }

  .hero-h1 { font-size: 3.4rem; line-height: 0.8; letter-spacing: -3px; }
  @media (min-width: 768px) { .hero-h1 { font-size: 4.6rem; letter-spacing: -4px; } }
  @media (min-width: 1024px) { .hero-h1 { font-size: 5.5rem; } }

  .sec-h2 { font-size: 3rem; line-height: 0.9; letter-spacing: -2px; }
  @media (min-width: 768px) { .sec-h2 { font-size: 4.2rem; letter-spacing: -3px; } }
  @media (min-width: 1024px) { .sec-h2 { font-size: 5.2rem; } }

  .cards-grid { display: grid; grid-template-columns: 1fr; gap: 22px; }
  @media (min-width: 768px) { .cards-grid { grid-template-columns: 1fr 1fr; } }

  .steps-grid { display: grid; grid-template-columns: 1fr; gap: 18px; }
  @media (min-width: 640px) { .steps-grid { grid-template-columns: 1fr 1fr; } }
  @media (min-width: 1024px) { .steps-grid { grid-template-columns: repeat(4, 1fr); } }

  .three-grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
  @media (min-width: 768px) { .three-grid { grid-template-columns: repeat(3, 1fr); } }

  .safety-grid { display: grid; grid-template-columns: 1fr; gap: 40px; align-items: start; }
  @media (min-width: 900px) { .safety-grid { grid-template-columns: 0.9fr 1.1fr; } }

  .foot-grid { display: grid; grid-template-columns: 1fr; gap: 40px; }
  @media (min-width: 768px) { .foot-grid { grid-template-columns: 1.6fr 1fr 1.2fr; } }

  .glass-sq { color: var(--accent, #9BE7C0); }
`;

/* ---------- component ---------- */

export default function Landing() {
  const rootRef = useRef<HTMLDivElement>(null);
  const rainCanvasRef = useRef<HTMLCanvasElement>(null);

  // Scroll-triggered reveal animation
  useEffect(() => {
    const scope = rootRef.current;
    if (!scope) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    scope.querySelectorAll('.reveal:not(.in)').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Gentle "rain" canvas backdrop for the features section
  useEffect(() => {
    const c = rainCanvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 1;
    let h = 1;
    let raf = 0;
    let drops: { x: number; y: number; len: number; sp: number; a: number }[] = [];

    const resize = () => {
      const r = c.getBoundingClientRect();
      w = c.width = Math.max(1, Math.round(r.width * dpr));
      h = c.height = Math.max(1, Math.round(r.height * dpr));
    };
    const make = () => {
      const n = Math.max(24, Math.round(w / dpr / 11));
      drops = Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        len: (7 + Math.random() * 16) * dpr,
        sp: (2.4 + Math.random() * 4.2) * dpr,
        a: 0.12 + Math.random() * 0.4,
      }));
    };
    resize();
    make();
    const onResize = () => {
      resize();
      make();
    };
    window.addEventListener('resize', onResize);

    const slant = 0.22;
    const isOff = () =>
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const step = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.lineCap = 'round';
      const moving = !isOff();
      for (const d of drops) {
        const x2 = d.x + d.len * slant;
        const y2 = d.y + d.len;
        ctx.strokeStyle = 'rgba(190,238,214,' + d.a * 0.55 + ')';
        ctx.lineWidth = Math.max(1, 1.1 * dpr);
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(214,248,230,' + d.a + ')';
        ctx.beginPath();
        ctx.arc(x2, y2, 1.35 * dpr, 0, 6.2832);
        ctx.fill();
        if (moving) {
          d.y += d.sp;
          d.x += d.sp * slant;
          if (d.y > h + d.len) {
            d.y = -d.len;
            d.x = Math.random() * w;
          }
        }
      }
      raf = requestAnimationFrame(step);
    };
    step();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="ms-landing m-full"
      style={{ background: '#000', '--accent': '#9BE7C0' } as CSSProperties}
    >
      <style>{PAGE_CSS}</style>

      <div className="aurora-fixed">
        <div
          className="aurora-band bg-anim"
          style={{
            width: '72vw', height: '58vh', left: '-12vw', top: '-14vh',
            background: 'radial-gradient(closest-side, rgba(120,222,182,0.85), transparent 72%)',
            animation: 'auroraDrift1 26s ease-in-out infinite',
          }}
        />
        <div
          className="aurora-band bg-anim"
          style={{
            width: '66vw', height: '62vh', right: '-14vw', top: '16vh',
            background: 'radial-gradient(closest-side, rgba(150,130,240,0.8), transparent 72%)',
            animation: 'auroraDrift2 32s ease-in-out infinite',
          }}
        />
        <div
          className="aurora-band bg-anim"
          style={{
            width: '82vw', height: '52vh', left: '4vw', bottom: '-16vh',
            background: 'radial-gradient(closest-side, rgba(110,212,202,0.7), transparent 72%)',
            animation: 'auroraDrift3 38s ease-in-out infinite',
          }}
        />
      </div>

      {/* ============ NAV (fixed) ============ */}
      <header
        className="nav-pad"
        style={{
          position: 'fixed', top: 16, left: 0, right: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <Link to="/" aria-label="ManasSwasthya home" style={{ display: 'inline-flex', alignItems: 'center' }}>
          <img src="/landing/logo.png" alt="ManasSwasthya" style={{ height: 52, width: 'auto', display: 'block' }} />
        </Link>
        <nav
          className="liquid-glass nav-center"
          aria-label="Primary"
          style={{ alignItems: 'center', gap: 2, borderRadius: 999, padding: 6 }}
        >
          <a href="#features" style={navLink}>Features</a>
          <a href="#how-it-works" style={navLink}>How it works</a>
          <a href="#safety" style={navLink}>Safety</a>
          <a href="#stories" style={navLink}>Stories</a>
          <Link to="/about" style={navLink}>About</Link>
          <Link
            to="/sign-up"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: 4,
              padding: '8px 15px', fontSize: 14, fontWeight: 600, color: '#000',
              background: '#fff', borderRadius: 999, fontFamily: F_BARLOW,
            }}
          >
            Get started
            <ArrowIcon size={15} />
          </Link>
        </nav>
        <div style={{ minWidth: 48, display: 'flex', justifyContent: 'flex-end' }}>
          <Link to="/sign-in" style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.9)', fontFamily: F_BARLOW }}>
            Sign in
          </Link>
        </div>
      </header>

      {/* ============ SECTION 1 — HERO ============ */}
      <section style={{ position: 'relative', height: '100vh', minHeight: 680, overflow: 'hidden', background: 'transparent' }}>
        <video
          className="bgvid"
          autoPlay
          loop
          muted
          playsInline
          src="/landing/hero-bg.mp4"
          style={{
            position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
            width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', zIndex: 0,
          }}
        />
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 1,
            background: 'radial-gradient(120% 90% at 50% 0%, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.62) 100%)',
          }}
        />

        <div
          style={{
            position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', padding: '96px 16px 40px', textAlign: 'center',
          }}
        >
          <div
            className="liquid-glass anim"
            style={{ animationDelay: '.4s', display: 'inline-flex', alignItems: 'center', gap: 9, borderRadius: 999, padding: 6 }}
          >
            <span
              style={{
                background: ACCENT, color: '#000', fontWeight: 600, fontSize: 11,
                letterSpacing: '.3px', padding: '3px 9px', borderRadius: 999, fontFamily: F_BARLOW,
              }}
            >
              FREE
            </span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.92)', paddingRight: 8, fontFamily: F_BARLOW }}>
              100% confidential · built for Indian college students
            </span>
          </div>

          <h1
            className="hero-h1"
            style={{
              margin: '24px 0 0', maxWidth: '52rem', fontFamily: F_SERIF, fontStyle: 'italic',
              fontWeight: 400, color: '#fff', textWrap: 'balance',
            }}
          >
            <span className="word" style={{ animationDelay: '0s' }}>A</span>
            <span className="word" style={{ animationDelay: '.1s' }}>calmer</span>
            <span className="word" style={{ animationDelay: '.2s' }}>mind,</span>
            <span className="word" style={{ animationDelay: '.3s' }}>closer</span>
            <span className="word" style={{ animationDelay: '.4s' }}>than</span>
            <span className="word" style={{ animationDelay: '.5s' }}>you</span>
            <span className="word" style={{ animationDelay: '.6s' }}>think.</span>
          </h1>

          <p
            className="anim"
            style={{
              animationDelay: '.8s', margin: '20px 0 0', maxWidth: '40rem', fontSize: 15,
              lineHeight: 1.45, color: 'rgba(255,255,255,0.92)', fontFamily: F_BARLOW, fontWeight: 300,
            }}
          >
            ManasSwasthya is a free, confidential AI wellness companion made for Indian college students. Talk through
            stress, understand what you're carrying, and find real support — without cost, judgment, or the wait.
          </p>

          <div
            className="anim"
            style={{
              animationDelay: '1.1s', margin: '26px 0 0', display: 'flex', flexWrap: 'wrap',
              gap: 22, alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Link to="/sign-up" className="liquid-glass-strong" style={ctaPrimary}>
              Start free assessment
              <ArrowIcon />
            </Link>
            <Link to="/chat" style={ctaGhost}>
              <ChatIcon />
              Talk to Manas
            </Link>
          </div>

          <div
            className="anim"
            style={{ animationDelay: '1.3s', margin: '32px 0 0', display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center' }}
          >
            <div className="liquid-glass" style={{ width: 232, padding: 20, borderRadius: '1.25rem', textAlign: 'left' }}>
              <span className="liquid-glass glass-sq" style={glassSq(40, '.7rem')}>
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx={12} cy={12} r={9} />
                  <path d="M12 7v5l3 2" />
                </svg>
              </span>
              <div style={{ fontFamily: F_SERIF, fontStyle: 'italic', fontSize: '2.25rem', letterSpacing: -1, lineHeight: 1, marginTop: 16, color: '#fff' }}>
                24/7
              </div>
              <p style={{ margin: '6px 0 0', fontSize: 12.5, color: 'rgba(255,255,255,0.8)', fontFamily: F_BARLOW, fontWeight: 300, lineHeight: 1.35 }}>
                Always-on support, in a judgment-free space
              </p>
            </div>
            <div className="liquid-glass" style={{ width: 232, padding: 20, borderRadius: '1.25rem', textAlign: 'left' }}>
              <span className="liquid-glass glass-sq" style={glassSq(40, '.7rem')}>
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3l7 3v5c0 4.2-2.8 7.4-7 9-4.2-1.6-7-4.8-7-9V6z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </span>
              <div style={{ fontFamily: F_SERIF, fontStyle: 'italic', fontSize: '2.25rem', letterSpacing: -1, lineHeight: 1, marginTop: 16, color: '#fff' }}>
                100% Free
              </div>
              <p style={{ margin: '6px 0 0', fontSize: 12.5, color: 'rgba(255,255,255,0.8)', fontFamily: F_BARLOW, fontWeight: 300, lineHeight: 1.35 }}>
                Private &amp; confidential, and built for India
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ SECTION 2 — CAPABILITIES ============ */}
      <section id="features" className="sec-pad" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}>
        <div className="backdrop">
          <canvas ref={rainCanvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }} />
        </div>
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 1,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.32) 0%, rgba(0,0,0,0.16) 40%, rgba(0,0,0,0.45) 100%)',
          }}
        />

        <div className="wrap" style={{ position: 'relative', zIndex: 10 }}>
          <p className="reveal" style={kicker}>// What Manas offers</p>
          <h2 className="sec-h2 reveal" style={{ ...secH2, transitionDelay: '.1s' }}>
            Care that adapts<br />to you
          </h2>

          <div className="cards-grid" style={{ marginTop: 56 }}>
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="liquid-glass reveal"
                style={{
                  ...(f.delay ? { transitionDelay: f.delay } : {}),
                  borderRadius: '1.25rem', padding: 24, minHeight: 300, display: 'flex', flexDirection: 'column',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <span className="liquid-glass glass-sq" style={glassSq(44, '.75rem')}>
                    {f.icon}
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end' }}>
                    {f.tags.map((t) => (
                      <span key={t} className="liquid-glass" style={tagPill}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ flex: 1 }} />
                <h3 style={cardH3}>{f.title}</h3>
                <p
                  style={{
                    margin: 0, fontSize: 13.5, color: 'rgba(255,255,255,0.9)', fontFamily: F_BARLOW,
                    fontWeight: 300, lineHeight: 1.4, maxWidth: '34ch',
                  }}
                >
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ SECTION 3 — HOW IT WORKS ============ */}
      <section id="how-it-works" className="sec-pad" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}>
        <div className="backdrop">
          <div
            className="bg-anim"
            style={{
              position: 'absolute', inset: '-22%',
              backgroundImage: 'repeating-linear-gradient(115deg, transparent 0 38px, rgba(255,255,255,0.11) 38px 39px)',
              animation: 'flowA 24s linear infinite',
            }}
          />
          <div
            className="bg-anim"
            style={{
              position: 'absolute', inset: '-22%',
              backgroundImage: 'repeating-linear-gradient(115deg, transparent 0 90px, rgba(155,231,192,0.13) 90px 91px)',
              animation: 'flowB 38s linear infinite',
            }}
          />
        </div>
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 1,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.2) 45%, rgba(0,0,0,0.45) 100%)',
          }}
        />
        <div className="wrap" style={{ position: 'relative', zIndex: 10 }}>
          <p className="reveal" style={kicker}>// How it works</p>
          <h2 className="sec-h2 reveal" style={{ ...secH2, transitionDelay: '.1s' }}>
            Four steps,<br />at your pace
          </h2>

          <div className="steps-grid" style={{ marginTop: 56 }}>
            {STEPS.map((s) => (
              <div
                key={s.num}
                className="liquid-glass reveal"
                style={{
                  ...(s.delay ? { transitionDelay: s.delay } : {}),
                  borderRadius: '1.25rem', padding: 24, minHeight: 220, display: 'flex', flexDirection: 'column',
                }}
              >
                <div style={{ fontFamily: F_SERIF, fontStyle: 'italic', fontSize: '2.75rem', lineHeight: 1, color: ACCENT }}>
                  {s.num}
                </div>
                <div style={{ flex: 1 }} />
                <h3
                  style={{
                    margin: '0 0 8px', fontFamily: F_SERIF, fontStyle: 'italic', fontWeight: 400,
                    fontSize: '1.6rem', letterSpacing: '-.5px', lineHeight: 1.05, color: '#fff',
                  }}
                >
                  {s.title}
                </h3>
                <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.85)', fontFamily: F_BARLOW, fontWeight: 300, lineHeight: 1.4 }}>
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ SECTION 4 — SAFETY ============ */}
      <section id="safety" className="sec-pad" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}>
        <div className="backdrop" style={{ display: 'grid', placeItems: 'center' }}>
          <div
            className="bg-anim"
            style={{
              position: 'absolute', left: '50%', top: '50%', width: '34vw', height: '34vw',
              border: '2px solid rgba(155,231,192,0.55)', borderRadius: '50%', animation: 'ripple 8s ease-out infinite',
            }}
          />
          <div
            className="bg-anim"
            style={{
              position: 'absolute', left: '50%', top: '50%', width: '34vw', height: '34vw',
              border: '2px solid rgba(169,148,255,0.55)', borderRadius: '50%',
              animation: 'ripple 8s ease-out infinite', animationDelay: '2.6s',
            }}
          />
          <div
            className="bg-anim"
            style={{
              position: 'absolute', left: '50%', top: '50%', width: '34vw', height: '34vw',
              border: '2px solid rgba(155,231,192,0.45)', borderRadius: '50%',
              animation: 'ripple 8s ease-out infinite', animationDelay: '5.3s',
            }}
          />
        </div>
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 1,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.32) 0%, rgba(0,0,0,0.18) 45%, rgba(0,0,0,0.45) 100%)',
          }}
        />

        <div className="wrap safety-grid" style={{ position: 'relative', zIndex: 10 }}>
          <div>
            <p className="reveal" style={kicker}>// Safety</p>
            <h2 className="sec-h2 reveal" style={{ ...secH2, transitionDelay: '.1s', margin: '0 0 20px' }}>
              Crisis-first<br />by design
            </h2>
            <p
              className="reveal"
              style={{
                transitionDelay: '.16s', margin: 0, maxWidth: '34ch', fontSize: 15,
                color: 'rgba(255,255,255,0.88)', fontFamily: F_BARLOW, fontWeight: 300, lineHeight: 1.5,
              }}
            >
              We're not here to replace counselors — we're here so no student has to wait until it's too late.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {SAFETY.map((item) => (
              <div
                key={item.title}
                className="liquid-glass reveal"
                style={{
                  ...(item.delay ? { transitionDelay: item.delay } : {}),
                  borderRadius: '1.1rem', padding: 22, display: 'flex', gap: 16, alignItems: 'flex-start',
                }}
              >
                <span className="liquid-glass glass-sq" style={glassSq(42, '.7rem')}>
                  {item.icon}
                </span>
                <div>
                  <h3
                    style={{
                      margin: '0 0 5px', fontFamily: F_SERIF, fontStyle: 'italic', fontWeight: 400,
                      fontSize: '1.35rem', letterSpacing: '-.5px', color: '#fff',
                    }}
                  >
                    {item.title}
                  </h3>
                  <p style={{ margin: 0, fontSize: 13.5, color: 'rgba(255,255,255,0.85)', fontFamily: F_BARLOW, fontWeight: 300, lineHeight: 1.45 }}>
                    {item.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ SECTION 5 — STORIES ============ */}
      <section id="stories" className="sec-pad" style={{ position: 'relative', overflow: 'hidden', background: 'transparent' }}>
        <div className="backdrop">
          <div
            className="blob bg-anim"
            style={{
              width: '56vw', height: '56vw', left: '-6vw', top: '8vw',
              background: 'radial-gradient(circle, rgba(169,148,255,0.46), transparent 66%)',
              animation: 'bloomDrift 34s ease-in-out infinite',
            }}
          />
          <div
            className="blob bg-anim"
            style={{
              width: '46vw', height: '46vw', right: '-4vw', bottom: '-12vw',
              background: 'radial-gradient(circle, rgba(155,231,192,0.4), transparent 66%)',
              animation: 'bloomDrift 42s ease-in-out infinite reverse',
            }}
          />
        </div>
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 1,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.32) 0%, rgba(0,0,0,0.18) 45%, rgba(0,0,0,0.48) 100%)',
          }}
        />
        <div className="wrap" style={{ position: 'relative', zIndex: 10 }}>
          <p className="reveal" style={kicker}>// Stories</p>
          <h2 className="sec-h2 reveal" style={{ ...secH2, transitionDelay: '.1s' }}>
            In students'<br />own words
          </h2>

          <div className="three-grid" style={{ marginTop: 56 }}>
            {STORIES.map((s) => (
              <div
                key={s.who}
                className="liquid-glass reveal"
                style={{
                  ...(s.delay ? { transitionDelay: s.delay } : {}),
                  borderRadius: '1.25rem', padding: 28, display: 'flex', flexDirection: 'column', gap: 20, minHeight: 260,
                }}
              >
                <p
                  style={{
                    margin: 0, fontFamily: F_SERIF, fontStyle: 'italic', fontSize: '1.5rem',
                    lineHeight: 1.25, letterSpacing: '-.5px', color: '#fff',
                  }}
                >
                  {s.quote}
                </p>
                <div style={{ marginTop: 'auto', fontSize: 13, color: 'rgba(255,255,255,0.7)', fontFamily: F_BARLOW }}>
                  {s.who}
                </div>
              </div>
            ))}
          </div>
          <p
            className="reveal"
            style={{
              transitionDelay: '.2s', margin: '28px 0 0', fontSize: 12,
              color: 'rgba(255,255,255,0.5)', fontFamily: F_BARLOW, fontWeight: 300,
            }}
          >
            Illustrative reflections representative of student experiences. Names changed for privacy.
          </p>
        </div>
      </section>

      {/* ============ SECTION 6 — FINAL CTA ============ */}
      <section
        style={{
          position: 'relative', minHeight: '88vh', overflow: 'hidden', background: 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <video
          className="bgvid"
          autoPlay
          loop
          muted
          playsInline
          src="/landing/section-bg.mp4"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
        />
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 1,
            background: 'radial-gradient(120% 100% at 50% 50%, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.65) 100%)',
          }}
        />

        <div className="wrap" style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '40px 20px' }}>
          <h2 className="sec-h2 reveal" style={{ ...secH2, margin: '0 auto', maxWidth: '20ch', textWrap: 'balance' }}>
            You don't have to carry it alone.
          </h2>
          <p
            className="reveal"
            style={{
              transitionDelay: '.1s', margin: '22px auto 0', maxWidth: '44ch', fontSize: 15,
              color: 'rgba(255,255,255,0.9)', fontFamily: F_BARLOW, fontWeight: 300, lineHeight: 1.5,
            }}
          >
            No pressure. No judgment. Just a private, intelligent companion in your pocket — free for every student,
            whenever you need it.
          </p>
          <div
            className="reveal"
            style={{
              transitionDelay: '.18s', margin: '30px 0 0', display: 'flex', flexWrap: 'wrap',
              gap: 22, alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Link to="/sign-up" className="liquid-glass-strong" style={{ ...ctaPrimary, padding: '13px 24px' }}>
              Start free assessment
              <ArrowIcon />
            </Link>
            <Link to="/chat" style={ctaGhost}>
              <ChatIcon />
              Talk to Manas
            </Link>
          </div>
        </div>
      </section>

      {/* ============ FOOTER — HELPLINES ============ */}
      <footer
        style={{
          position: 'relative', background: 'transparent',
          borderTop: '1px solid rgba(255,255,255,0.08)', padding: '64px 24px 40px',
        }}
      >
        <div className="wrap">
          <div
            className="liquid-glass reveal"
            style={{
              borderRadius: '1.25rem', padding: '26px 28px', display: 'flex', flexWrap: 'wrap',
              alignItems: 'center', justifyContent: 'space-between', gap: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span className="liquid-glass glass-sq" style={glassSq(44, '.8rem')}>
                <PhoneIcon size={22} />
              </span>
              <div>
                <div style={{ fontFamily: F_SERIF, fontStyle: 'italic', fontSize: '1.5rem', letterSpacing: '-.5px', color: '#fff', lineHeight: 1.1 }}>
                  In crisis? Reach a real person now.
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontFamily: F_BARLOW, marginTop: 2 }}>
                  Tele MANAS is the Govt. of India helpline — free &amp; confidential, 24/7. If life is in danger, call 112.
                </div>
              </div>
            </div>
            <a
              href="tel:14416"
              className="liquid-glass-strong"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 9, borderRadius: 999,
                padding: '12px 22px', fontSize: 15, fontWeight: 600, color: '#fff', fontFamily: F_BARLOW,
              }}
            >
              Call Tele MANAS · 14416
            </a>
          </div>

          <div className="foot-grid" style={{ marginTop: 48 }}>
            <div>
              <Link to="/" aria-label="ManasSwasthya home" style={{ display: 'inline-block' }}>
                <img src="/landing/logo.png" alt="ManasSwasthya" style={{ height: 96, width: 'auto', display: 'block' }} />
              </Link>
              <p
                style={{
                  margin: '18px 0 0', maxWidth: '34ch', fontSize: 14, color: 'rgba(255,255,255,0.7)',
                  fontFamily: F_BARLOW, fontWeight: 300, lineHeight: 1.5,
                }}
              >
                Mental wellness for every Indian college student — accessible, confidential, and free. We support
                students; we do not provide medical diagnosis or prescriptions.
              </p>
            </div>

            <div>
              <p style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: F_BARLOW }}>Explore</p>
              <ul
                style={{
                  listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column',
                  gap: 10, fontSize: 14, fontFamily: F_BARLOW,
                }}
              >
                {EXPLORE_LINKS.map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} style={{ color: 'rgba(255,255,255,0.75)' }}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: F_BARLOW }}>
                Helplines (India)
              </p>
              <ul
                style={{
                  listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column',
                  gap: 13, fontSize: 14, fontFamily: F_BARLOW, color: 'rgba(255,255,255,0.75)',
                }}
              >
                {HELPLINES.map((h) => (
                  <li key={h.name} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
                    <span>
                      {h.name}{' '}
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{h.note}</span>
                    </span>
                    <a href={h.tel} style={{ color: ACCENT, fontWeight: 500, whiteSpace: 'nowrap' }}>
                      {h.display}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div
            style={{
              marginTop: 48, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between',
              fontSize: 12.5, color: 'rgba(255,255,255,0.5)', fontFamily: F_BARLOW,
            }}
          >
            <span>© 2026 ManasSwasthya · Mental Wellness, in Sanskrit.</span>
            <span>Not a substitute for professional care. In an emergency, call 112.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
