import { useReducedMotion } from 'motion/react';

export type OrbState = 'idle' | 'listening' | 'thinking';

/**
 * Manas as a presence rather than an avatar. Breathes when idle, ripples while
 * you speak, shimmers while it composes a reply.
 *
 * ponytail: CSS gradients and two keyframes, not the Prism/Iridescence shader.
 * A 100-step raymarch for a 64px circle would be absurd, and this has to sit on
 * screen for the length of a conversation.
 */
const SIZES = { sm: 'h-9 w-9', lg: 'h-24 w-24' } as const;

const STATE_LABEL: Record<OrbState, string> = {
  idle: 'Manas is here',
  listening: 'Manas is listening',
  thinking: 'Manas is thinking',
};

export default function ManasOrb({
  state = 'idle',
  size = 'sm',
}: {
  state?: OrbState;
  size?: keyof typeof SIZES;
}) {
  const reduceMotion = useReducedMotion();
  const animate = !reduceMotion;

  return (
    <span
      role="img"
      aria-label={STATE_LABEL[state]}
      className={`relative inline-flex shrink-0 items-center justify-center ${SIZES[size]}`}
    >
      {/* Halo — widens while thinking so the state is legible without colour. */}
      <span
        aria-hidden="true"
        className={`absolute inset-0 rounded-full transition-all duration-700 ${
          state === 'thinking' ? 'scale-125 opacity-70' : 'scale-100 opacity-40'
        } ${animate ? 'motion-safe:animate-[manasBreathe_4s_ease-in-out_infinite]' : ''}`}
        style={{
          background: 'radial-gradient(circle, rgba(91,108,147,0.45) 0%, rgba(91,108,147,0) 70%)',
        }}
      />

      {/* Core */}
      <span
        aria-hidden="true"
        className="relative h-full w-full rounded-full ring-1 ring-white/25 shadow-[inset_0_1px_2px_rgba(255,255,255,0.6)]"
        style={{
          background:
            state === 'thinking'
              ? 'conic-gradient(from 0deg,#2E3A59,#5B6C93,#9DA9C7,#5B6C93,#2E3A59)'
              : 'radial-gradient(circle at 32% 28%,#8494BC 0%,#4A5A82 45%,#1B2430 100%)',
          animation: animate && state === 'thinking' ? 'manasSpin 2.4s linear infinite' : undefined,
        }}
      />

      {/* Listening ripple */}
      {state === 'listening' && (
        <span
          aria-hidden="true"
          className={`absolute inset-0 rounded-full border border-[#5B6C93] ${
            animate ? 'motion-safe:animate-[manasRipple_1.6s_ease-out_infinite]' : ''
          }`}
        />
      )}
    </span>
  );
}
