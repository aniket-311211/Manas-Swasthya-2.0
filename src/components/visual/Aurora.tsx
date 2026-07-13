interface AuroraProps {
  variant?: 'hero' | 'subtle';
}

/**
 * Decorative animated aurora background: drifting blurred blobs + pulsing particles.
 * Pure CSS animations (paused automatically under prefers-reduced-motion).
 */
export default function Aurora({ variant = 'hero' }: AuroraProps) {
  const opacity = variant === 'hero' ? 1 : 0.5;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true" style={{ opacity }}>
      <div
        className="absolute animate-drift1 rounded-full"
        style={{
          width: 340,
          height: 340,
          left: -60,
          top: -80,
          background: 'radial-gradient(circle, hsl(var(--sage) / 0.5), transparent 65%)',
          filter: 'blur(30px)',
        }}
      />
      <div
        className="absolute animate-drift2 rounded-full"
        style={{
          width: 300,
          height: 300,
          right: -40,
          top: -30,
          background: 'radial-gradient(circle, hsl(var(--lavender) / 0.45), transparent 65%)',
          filter: 'blur(34px)',
        }}
      />
      <div
        className="absolute animate-drift3 rounded-full"
        style={{
          width: 260,
          height: 260,
          left: '38%',
          bottom: -100,
          background: 'radial-gradient(circle, hsl(var(--clay) / 0.38), transparent 65%)',
          filter: 'blur(30px)',
        }}
      />
      {variant === 'hero' && (
        <>
          <span className="absolute h-[5px] w-[5px] rounded-full bg-sage animate-pulse-dot" style={{ left: '18%', top: '32%' }} />
          <span className="absolute h-1 w-1 rounded-full bg-lavender animate-pulse-dot" style={{ left: '74%', top: '24%', animationDelay: '1s' }} />
          <span className="absolute h-1 w-1 rounded-full bg-clay animate-pulse-dot" style={{ left: '62%', top: '64%', animationDelay: '2s' }} />
          <span className="absolute h-[3px] w-[3px] rounded-full bg-sage animate-pulse-dot" style={{ left: '32%', top: '70%', animationDelay: '3s' }} />
        </>
      )}
    </div>
  );
}
