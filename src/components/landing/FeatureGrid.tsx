import { MessageCircleHeart, Brain, NotebookPen, Users, BookOpen, Pill } from 'lucide-react';
import GlassCard from '@/components/visual/GlassCard';
import Reveal from '@/components/visual/Reveal';

const FEATURES = [
  {
    icon: MessageCircleHeart,
    color: 'text-sage',
    bg: 'bg-sage/15',
    title: 'AI companion',
    body: 'Talk to Manas any time about stress, exams, relationships, or anything on your mind — with crisis support built in.',
  },
  {
    icon: Brain,
    color: 'text-lavender',
    bg: 'bg-lavender/15',
    title: 'Adaptive assessment',
    body: 'Not a static quiz. Each question adapts to your previous answers across six domains of wellbeing.',
  },
  {
    icon: NotebookPen,
    color: 'text-clay',
    bg: 'bg-clay/15',
    title: 'Mood journal',
    body: 'Capture how you feel, build streaks, and watch AI surface gentle insights from your own words.',
  },
  {
    icon: Users,
    color: 'text-sage',
    bg: 'bg-sage/15',
    title: 'Peer community',
    body: 'Join interest groups, attend events, and connect with trained peer mentors who get student life.',
  },
  {
    icon: BookOpen,
    color: 'text-lavender',
    bg: 'bg-lavender/15',
    title: 'Resource hub',
    body: 'Curated articles, exercises, and helplines — searchable and matched to what you are going through.',
  },
  {
    icon: Pill,
    color: 'text-clay',
    bg: 'bg-clay/15',
    title: 'Medicine AI',
    body: 'Understand any medicine: uses, dosage guidance, side effects, and safety warnings in plain language.',
  },
];

export default function FeatureGrid() {
  return (
    <section id="features" className="container mx-auto px-6 py-24">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl text-foreground md:text-4xl">
          Everything your mind needs, <em className="text-gradient not-italic">in one place</em>
        </h2>
        <p className="mt-4 text-muted-foreground">
          Six tools that work together to support you through college life.
        </p>
      </Reveal>
      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <Reveal key={f.title} delay={i * 0.08}>
            <GlassCard hoverLift className="h-full p-6">
              <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${f.bg}`}>
                <f.icon className={`h-5 w-5 ${f.color}`} />
              </span>
              <h3 className="mt-4 font-body text-base font-medium text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </GlassCard>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
