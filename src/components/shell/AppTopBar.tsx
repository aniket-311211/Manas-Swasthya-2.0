import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useClerk, useUser } from '@clerk/clerk-react';
import { Globe, LifeBuoy, LogOut, Menu } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { HELPLINES } from '@/lib/crisis';
import { LANGUAGES, STORAGE_KEY, languageFor } from '@/lib/languages';
import { cn } from '@/lib/utils';
import { FOCUS } from './theme';

/**
 * Full 1B "Editorial Bento" top navigation. The single header at every
 * breakpoint: tabs above lg, a Sheet drawer below it.
 */
const NAV_ITEMS = [
  { key: 'nav.dashboard', path: '/dashboard' },
  { key: 'nav.chat', path: '/chat' },
  { key: 'nav.journal', path: '/journal' },
  { key: 'nav.assessment', path: '/assessment' },
  { key: 'nav.booking', path: '/booking' },
  { key: 'nav.resources', path: '/resources' },
  { key: 'nav.community', path: '/community' },
  { key: 'nav.medicine', path: '/medicine' },
];

// LANGUAGES is the single source; Navigation.tsx used to hold a second copy.
// Labels are each language's own name, never a translation of it — a Hindi
// speaker looks for "हिंदी", not for "Hindi" rendered in Odia.

const tel = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;

const focusRing = FOCUS;

const tabClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'rounded-full px-3.5 py-2 text-sm transition-colors',
    focusRing,
    isActive
      ? 'bg-[#1B2430] font-semibold text-white'
      : 'text-[#5A6472] hover:bg-[#EEF0F5] hover:text-[#1B2430]',
  );

const drawerTabClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'block rounded-xl px-3 py-2.5 text-sm transition-colors',
    focusRing,
    isActive
      ? 'bg-[#1B2430] font-semibold text-white'
      : 'text-[#5A6472] hover:bg-[#EEF0F5] hover:text-[#1B2430]',
  );

export default function AppTopBar() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { signOut } = useClerk();
  const { user } = useUser();

  const initial = user?.firstName?.[0]?.toUpperCase() ?? 'A';
  const accountName = user?.firstName ?? 'Account';
  const email = user?.primaryEmailAddress?.emailAddress;

  const setLang = (code: string) => {
    void i18n.changeLanguage(code);
    localStorage.setItem(STORAGE_KEY, code);
  };

  const current = languageFor(i18n.resolvedLanguage ?? i18n.language);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-white/50 bg-white/60 px-6 py-3.5 backdrop-blur-xl lg:px-10">
      <NavLink to="/dashboard" aria-label="ManasSwasthya home" className={cn('shrink-0 rounded-md', focusRing)}>
        <img src="/logos/manas_swasthya_logo_teal.png" alt="ManasSwasthya" className="h-8 w-auto" />
      </NavLink>

      <nav aria-label={t('nav.primary')} className="hidden flex-wrap items-center gap-0.5 lg:flex">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.path} to={item.path} className={tabClass} end={item.path === '/dashboard'}>
            {t(item.key)}
          </NavLink>
        ))}
      </nav>

      <div className="flex shrink-0 items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={t('lang.label')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border border-[#E4E7EE] bg-[#EEF0F5] px-3 py-1.5 font-mono text-xs font-medium text-[#3A4457]',
                focusRing,
              )}
            >
              <Globe className="h-3.5 w-3.5" aria-hidden="true" />
              {current.code.toUpperCase()}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 border-white/60 bg-white/90 text-[#1B2430] backdrop-blur-xl">
            {LANGUAGES.map((l) => (
              <DropdownMenuItem
                key={l.code}
                onClick={() => setLang(l.code)}
                lang={l.code}
                dir={l.dir}
                aria-current={l.code === current.code ? 'true' : undefined}
                className="focus:bg-[#EEF0F5] data-[current]:font-semibold"
              >
                {l.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/*
          There is no footer any more, so this control is the only helpline
          access in the app. It lists all three rather than dialling one, so
          nothing was lost when the footer went.
        */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={t('crisis.trigger')}
              className={cn('inline-flex items-center gap-1.5 rounded-md font-mono text-xs text-[#C0533F] hover:underline', focusRing)}
            >
              <LifeBuoy className="h-3.5 w-3.5" aria-hidden="true" />
              {t('crisis.title')}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 border-white/60 bg-white/95 backdrop-blur-xl">
            <p className="text-sm font-semibold text-[#1B2430]">{t('crisis.trigger')}</p>
            <p className="mt-1 text-xs leading-relaxed text-[#5A6472]">{t('crisis.blurb')}</p>
            <ul className="mt-3 space-y-2">
              {HELPLINES.map((h) => (
                <li key={h.phone}>
                  <a
                    href={tel(h.phone)}
                    className={cn('flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-[#EEF0F5]', focusRing)}
                  >
                    <span className="text-[#5A6472]">{h.name}</span>
                    <span className="font-mono text-[13px] font-semibold text-[#C0533F]">{h.phone}</span>
                  </a>
                </li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`${t('account.label')}: ${accountName}`}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#E2915B] to-[#D0729B] text-sm font-semibold text-white',
                focusRing,
              )}
            >
              {initial}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 border-white/60 bg-white/90 text-[#1B2430] backdrop-blur-xl">
            <DropdownMenuLabel className="font-normal">
              <span className="block truncate font-semibold">{accountName}</span>
              {email && <span className="block truncate text-xs text-[#5A6472]">{email}</span>}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[#E4E7EE]" />
            <DropdownMenuItem onClick={handleSignOut} className="focus:bg-[#EEF0F5]">
              <LogOut className="mr-2 h-4 w-4" aria-hidden="true" /> {t('account.signOut')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Sheet>
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label={t('nav.menu')}
              className={cn(
                'inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#E4E7EE] bg-[#EEF0F5] text-[#1B2430] lg:hidden',
                focusRing,
              )}
            >
              <Menu className="h-4 w-4" aria-hidden="true" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="border-white/60 bg-white/90 text-[#1B2430] backdrop-blur-xl">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <nav aria-label="Primary" className="mt-6 flex flex-col gap-1">
              {NAV_ITEMS.map((item) => (
                <SheetClose asChild key={item.path}>
                  <NavLink to={item.path} className={drawerTabClass} end={item.path === '/dashboard'}>
                    {t(item.key)}
                  </NavLink>
                </SheetClose>
              ))}
              {/* All three, same as the desktop popover. */}
              <p className="mt-3 px-3 font-mono text-[11px] uppercase tracking-[0.14em] text-[#8A93A3]">
                Need help right now?
              </p>
              {HELPLINES.map((h) => (
                <a
                  key={h.phone}
                  href={tel(h.phone)}
                  aria-label={`Call ${h.name} on ${h.phone}`}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-[#C0533F] hover:bg-[#EEF0F5]',
                    focusRing,
                  )}
                >
                  <LifeBuoy className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="flex-1 text-[#5A6472]">{h.name}</span>
                  <span className="font-mono text-[13px] font-semibold">{h.phone}</span>
                </a>
              ))}
              <SheetClose asChild>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-[#C0533F] hover:bg-[#EEF0F5]',
                    focusRing,
                  )}
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" /> {t('nav.signout', 'Sign out')}
                </button>
              </SheetClose>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
