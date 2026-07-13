import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverLift?: boolean;
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, hoverLift = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('glass-card', hoverLift && 'glass-card-hover', className)}
      {...props}
    />
  ),
);
GlassCard.displayName = 'GlassCard';

export default GlassCard;
