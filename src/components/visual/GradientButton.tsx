import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost';
  size?: 'md' | 'lg';
}

const GradientButton = forwardRef<HTMLButtonElement, GradientButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'pill-button inline-flex items-center justify-center gap-2',
        size === 'lg' && 'px-8 py-3.5 text-base',
        size === 'md' && 'text-sm',
        variant === 'primary' &&
          'text-primary-foreground bg-gradient-to-br from-primary-light to-primary-dark shadow-[0_8px_28px_-6px_hsl(var(--sage)/0.6)] hover:shadow-[0_12px_32px_-6px_hsl(var(--sage)/0.7)]',
        variant === 'ghost' &&
          'border border-glass-border bg-[var(--glass)] text-foreground backdrop-blur-md hover:bg-muted/60',
        className,
      )}
      {...props}
    />
  ),
);
GradientButton.displayName = 'GradientButton';

export default GradientButton;
