import type { ReactNode } from 'react';
import { useReducedMotion } from 'motion/react';
import Silk from '@/components/Silk/Silk';
import { AUTH_FIELD } from './clerkTheme';

/**
 * The frame around Clerk's sign-in and sign-up cards.
 *
 * The auth screens were the last thing on the site still wearing the old
 * blue-to-indigo gradient, which made the first page a new student sees the one
 * page that looks like nothing else. Same Silk field as the rest of the app, in
 * the brand teal.
 *
 * CONTRAST: #1f9d8f has a relative luminance of 0.264 — white on it is 3.4:1,
 * fine for the large display heading with an outline, not for body copy. So the
 * only things sitting directly on the shader are the wordmark and the heading;
 * everything else is inside Clerk's white card.
 */

interface Props {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export default function AuthLayout({ title, subtitle, children }: Props) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-10">
      {/* Fixed so it spans the viewport; pointer-events-none so it never eats a
          click on the form. Reduced motion falls back to the flat colour — same
          hex, so contrast is identical. */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0" style={{ background: AUTH_FIELD }}>
        {!reduceMotion && (
          <Silk speed={4} scale={1} color={AUTH_FIELD} noiseIntensity={1.4} rotation={0} />
        )}
      </div>

      <div className="relative w-full max-w-[420px]">
        <header className="mb-6 text-center">
          <img
            src="/logos/manas_swasthya_logo_white.png"
            alt="Manas Swasthya"
            className="mx-auto h-14 w-auto drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)]"
          />
          <h1 className="mt-4 font-display text-[32px] leading-tight text-white [text-shadow:0_1px_0_rgba(0,0,0,0.6),0_0_3px_rgba(0,0,0,0.75),0_0_14px_rgba(0,0,0,0.45)]">
            {title}
          </h1>
          <p className="mt-1.5 text-[15px] text-white/95 [text-shadow:0_1px_2px_rgba(0,0,0,0.6)]">
            {subtitle}
          </p>
        </header>

        <div className="rounded-[22px] border border-white/50 bg-white/95 p-6 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          {children}
        </div>

        <p className="mt-5 text-center text-[13px] leading-relaxed text-white/90 [text-shadow:0_1px_2px_rgba(0,0,0,0.55)]">
          Manas Swasthya is a student wellbeing service, not an emergency one. If
          something is urgent right now, call KIRAN on 1800-599-0019 — free, 24/7.
        </p>
      </div>
    </div>
  );
}
