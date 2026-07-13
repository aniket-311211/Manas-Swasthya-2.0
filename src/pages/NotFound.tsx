import { Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Flower2, Home } from 'lucide-react';
import Aurora from '@/components/visual/Aurora';

export default function NotFound() {
  const location = useLocation();

  useEffect(() => {
    console.error('404: attempted to access', location.pathname);
  }, [location.pathname]);

  return (
    <div className="gradient-hero relative flex min-h-screen items-center justify-center overflow-hidden">
      <Aurora variant="subtle" />
      <div className="relative px-6 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-lavender/15">
          <Flower2 className="h-8 w-8 text-lavender" />
        </span>
        <h1 className="mt-6 font-display text-6xl text-foreground">404</h1>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
          This page seems to have wandered off to meditate. Let's take you somewhere calmer.
        </p>
        <Link
          to="/"
          className="pill-button mt-8 inline-flex items-center gap-2 bg-gradient-to-br from-primary-light to-primary-dark text-sm text-primary-foreground shadow-[0_8px_28px_-6px_hsl(var(--sage)/0.6)]"
        >
          <Home className="h-4 w-4" /> Back home
        </Link>
      </div>
    </div>
  );
}
