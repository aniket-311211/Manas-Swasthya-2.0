import { Link } from 'react-router-dom';
import { Brain } from 'lucide-react';

export default function PublicNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-background/40 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2" aria-label="ManasSwasthya home">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-light to-primary-dark shadow-soft">
            <Brain className="h-5 w-5 text-primary-foreground" />
          </span>
          <span className="font-display text-lg text-foreground">
            Manas<span className="text-primary">Swasthya</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex" aria-label="Landing">
          <a href="#features" className="transition-colors hover:text-foreground">Features</a>
          <a href="#how-it-works" className="transition-colors hover:text-foreground">How it works</a>
          <a href="#stories" className="transition-colors hover:text-foreground">Stories</a>
          <Link to="/about" className="transition-colors hover:text-foreground">About</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            to="/sign-in"
            className="hidden rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            Sign in
          </Link>
          <Link
            to="/sign-up"
            className="pill-button bg-gradient-to-br from-primary-light to-primary-dark text-sm text-primary-foreground shadow-[0_0_18px_hsl(var(--sage)/0.45)]"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
