import { Link } from 'react-router-dom';
import { HELPLINES } from '@/lib/crisis';

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card/40 backdrop-blur-md">
      <div className="container mx-auto grid gap-10 px-6 py-12 md:grid-cols-3">
        <div>
          <p className="font-display text-xl text-foreground">
            Manas<span className="text-primary">Swasthya</span>
          </p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
            AI-powered mental wellness companion for Indian college students. Free, confidential,
            judgment-free.
          </p>
        </div>
        <div>
          <p className="mb-3 text-sm font-medium text-foreground">Explore</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link className="transition-colors hover:text-primary" to="/dashboard">Dashboard</Link></li>
            <li><Link className="transition-colors hover:text-primary" to="/chat">Talk to Manas</Link></li>
            <li><Link className="transition-colors hover:text-primary" to="/assessment">Assessment</Link></li>
            <li><Link className="transition-colors hover:text-primary" to="/community">Community</Link></li>
            <li><Link className="transition-colors hover:text-primary" to="/about">About</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-medium text-foreground">Need help right now?</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {HELPLINES.map((h) => (
              <li key={h.phone}>
                <span className="text-foreground">{h.name}:</span>{' '}
                <a className="font-medium text-primary hover:underline" href={`tel:${h.phone.replace(/-/g, '')}`}>
                  {h.phone}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60 px-6 py-4">
        <p className="container mx-auto text-xs leading-relaxed text-muted-foreground">
          ManasSwasthya is a wellbeing companion, not a substitute for professional medical care. If
          you are in crisis, please call a helpline above or reach out to someone you trust. ©{' '}
          {new Date().getFullYear()} ManasSwasthya.
        </p>
      </div>
    </footer>
  );
}
