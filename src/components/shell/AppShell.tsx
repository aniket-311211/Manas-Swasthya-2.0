import { useReducedMotion } from 'motion/react';
import Silk from '@/components/Silk/Silk';
import AppTopBar from './AppTopBar';

/**
 * The shell every authenticated page sits in: one sticky top bar at all
 * breakpoints, carrying its own mobile drawer below lg. There is no footer —
 * the top bar's crisis control owns helpline access instead.
 *
 * `backdrop` opts a page into the animated Silk field. Off by default:
 * a moving background behind long-form reading or a scrolling conversation is
 * a distraction, and it costs a GPU loop per page.
 */
export default function AppShell({
  children,
  backdrop = false,
}: {
  children: React.ReactNode;
  backdrop?: boolean;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative flex min-h-screen flex-col bg-[#FBF8F1] text-[#1B2430]">
      {/*
        Decorative only. `fixed` so it spans the viewport; `pointer-events-none`
        so it never intercepts a click.
        ponytail: skipped entirely under reduced motion, which falls back to the
        plain paper background. The shader has no speed-0 mode worth wiring.
      */}
      {backdrop && !reduceMotion && (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
          <Silk speed={5.8} scale={1.3} color="#3a8948" noiseIntensity={2.2} rotation={0} />
        </div>
      )}

      <AppTopBar />
      <main className="relative z-10 flex-1">{children}</main>
    </div>
  );
}
