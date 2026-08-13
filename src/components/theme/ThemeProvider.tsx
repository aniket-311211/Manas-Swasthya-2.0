import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ReactNode } from 'react';

export default function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    // ponytail: forcedTheme kills the .dark class outright and ignores any stale
    // ms-theme=dark in localStorage. Site-wide redesign is light-only for now.
    <NextThemesProvider attribute="class" forcedTheme="light" defaultTheme="light" enableSystem={false} storageKey="ms-theme">
      {children}
    </NextThemesProvider>
  );
}
