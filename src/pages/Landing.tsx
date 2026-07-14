import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { MessageCircleHeart, Brain, NotebookPen, ArrowRight, ShieldCheck } from 'lucide-react';
import Aurora from '@/components/visual/Aurora';
import PublicNav from '@/components/landing/PublicNav';
import StatsBand from '@/components/landing/StatsBand';
import HowItWorks from '@/components/landing/HowItWorks';
import FeatureGrid from '@/components/landing/FeatureGrid';
import Testimonials from '@/components/landing/Testimonials';
import Footer from '@/components/Footer';

const HERO_CARDS = [
  {
    icon: MessageCircleHeart,
    color: 'text-sage',
    bg: 'bg-sage/20',
    title: 'AI companion',
    body: '24/7 judgment-free chat with crisis support built in',
    delay: 0,
  },
  {
    icon: Brain,
    color: 'text-lavender',
    bg: 'bg-lavender/20',
    title: 'Adaptive assessment',
    body: 'Questions that adapt to you, across six domains',
    delay: 0.8,
  },
  {
    icon: NotebookPen,
    color: 'text-clay',
    bg: 'bg-clay/20',
    title: 'Mood journal',
    body: 'Track feelings, build streaks, see your patterns',
    delay: 1.6,
  },
];

export default function Landing() {
  const reduced = useReducedMotion();

  return (
    <div className="gradient-hero min-h-screen font-body text-foreground">
      <PublicNav />

      <section className="relative overflow-hidden">
        <Aurora variant="hero" />
        <div className="container relative mx-auto px-6 pb-24 pt-20 text-center md:pt-28">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mx-auto inline-flex items-center gap-2 rounded-full border border-sage/30 bg-sage/10 px-4 py-1.5 text-xs text-sage backdrop-blur-md"
          >
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-sage" />
            For Indian college students · free and confidential
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mx-auto mt-7 max-w-3xl font-display text-5xl leading-[1.1] text-foreground md:text-6xl"
          >
            Your mind deserves <em className="text-gradient not-italic">gentle care</em>, every day
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground"
          >
            Chat with Manas, take adaptive assessments, journal your moods, and find your community —
            anytime, judgment-free.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.65 }}
            className="mt-9 flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              to="/sign-up"
              className="pill-button inline-flex items-center gap-2 bg-gradient-to-br from-primary-light to-primary-dark text-sm text-primary-foreground shadow-[0_8px_28px_-6px_hsl(var(--sage)/0.6)]"
            >
              Start free assessment
            </Link>
            <Link
              to="/sign-in"
              className="pill-button inline-flex items-center gap-2 border border-white/15 bg-white/[0.08] text-sm text-foreground backdrop-blur-md hover:bg-white/[0.14]"
            >
              Talk to Manas <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>

          <div className="mt-16 grid gap-4 sm:grid-cols-3">
            {HERO_CARDS.map((c, i) => (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.85 + i * 0.15 }}
                className="glass-card p-5 text-left"
                style={
                  reduced
                    ? undefined
                    : { animation: `floaty 6s ease-in-out ${c.delay}s infinite` }
                }
              >
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${c.bg}`}>
                  <c.icon className={`h-4 w-4 ${c.color}`} />
                </span>
                <p className="mt-3 text-sm font-medium text-foreground">{c.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{c.body}</p>
              </motion.div>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6, duration: 1 }}
            className="mt-10 inline-flex items-center gap-2 text-xs text-muted-foreground"
          >
            <ShieldCheck className="h-4 w-4 text-sage" /> Private by design — your conversations stay yours.
          </motion.p>
        </div>
      </section>

      <StatsBand />
      <HowItWorks />
      <FeatureGrid />
      <Testimonials />

      <section className="relative overflow-hidden py-24">
        <Aurora variant="subtle" />
        <div className="container relative mx-auto px-6 text-center">
          <h2 className="mx-auto max-w-2xl font-display text-3xl text-foreground md:text-4xl">
            Ready to feel a little lighter?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-muted-foreground">
            It takes two minutes to start. It is free, and it always will be.
          </p>
          <Link
            to="/sign-up"
            className="pill-button mt-8 inline-flex items-center gap-2 bg-gradient-to-br from-primary-light to-primary-dark px-8 py-3.5 text-base text-primary-foreground shadow-[0_8px_28px_-6px_hsl(var(--sage)/0.6)]"
          >
            Begin your journey <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
