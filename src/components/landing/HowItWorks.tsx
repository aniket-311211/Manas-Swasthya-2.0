import Reveal from '@/components/visual/Reveal';
import { UserPlus, Sparkles, TrendingUp } from 'lucide-react';

const STEPS = [
  {
    icon: UserPlus,
    step: '01',
    title: 'Create your space',
    body: 'Sign up free with your email. Everything you share stays private to you.',
  },
  {
    icon: Sparkles,
    step: '02',
    title: 'Check in with yourself',
    body: 'Take the adaptive assessment or just start talking to Manas. No right answers, no judgment.',
  },
  {
    icon: TrendingUp,
    step: '03',
    title: 'Grow, gently',
    body: 'Journal, track moods, join the community — and watch your wellbeing trends over time.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="container mx-auto px-6 py-24">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl text-foreground md:text-4xl">How it works</h2>
        <p className="mt-4 text-muted-foreground">Three small steps toward feeling better.</p>
      </Reveal>
      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <Reveal key={s.step} delay={i * 0.12}>
            <div className="relative rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-md">
              <span className="font-display text-5xl text-white/10">{s.step}</span>
              <span className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-xl bg-sage/15">
                <s.icon className="h-5 w-5 text-sage" />
              </span>
              <h3 className="mt-4 text-base font-medium text-foreground">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
