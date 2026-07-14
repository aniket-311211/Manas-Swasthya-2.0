import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useClerk, useUser } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  MessageCircle,
  Edit3,
  ClipboardList,
  CalendarHeart,
  BookOpen,
  Users,
  Pill,
  LayoutDashboard,
  Globe,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ThemeToggle from '@/components/theme/ThemeToggle';
import { cn } from '@/lib/utils';

const LANGS = [
  { code: 'en', key: 'lang.english' },
  { code: 'hi', key: 'lang.hindi' },
  { code: 'or', key: 'lang.odia' },
  { code: 'ks', key: 'lang.kashmiri' },
] as const;

export default function Navigation() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useClerk();
  const { user } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('app_lang');
    if (saved && saved !== i18n.language) i18n.changeLanguage(saved);
  }, [i18n]);

  useEffect(() => setMobileOpen(false), [location.pathname]);

  const navItems = [
    { id: 'dashboard', label: t('nav.dashboard', 'Dashboard'), icon: LayoutDashboard, path: '/dashboard' },
    { id: 'chat', label: t('nav.chat', 'Chat'), icon: MessageCircle, path: '/chat' },
    { id: 'journal', label: t('nav.journal', 'Journal'), icon: Edit3, path: '/journal' },
    { id: 'assessment', label: t('nav.assessment', 'Assessment'), icon: ClipboardList, path: '/assessment' },
    { id: 'booking', label: t('nav.booking', 'Booking'), icon: CalendarHeart, path: '/booking' },
    { id: 'resources', label: t('nav.resources', 'Resources'), icon: BookOpen, path: '/resources' },
    { id: 'community', label: t('nav.community', 'Community'), icon: Users, path: '/community' },
    { id: 'medicine', label: t('nav.medicine', 'Medicine AI'), icon: Pill, path: '/medicine' },
  ];

  const isActive = (path: string) => location.pathname === path;

  const setLang = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('app_lang', code);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/70 bg-card/70 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-6">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2"
          aria-label="ManasSwasthya home"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-light to-primary-dark shadow-soft">
            <Brain className="h-5 w-5 text-primary-foreground" />
          </span>
          <span className="font-display text-lg text-foreground">
            Manas<span className="text-primary">Swasthya</span>
          </span>
        </button>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.path)}
                className={cn(
                  'relative flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-sm transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-full bg-primary/10"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <Icon className="relative h-4 w-4" />
                <span className="relative">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Change language"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card/60 text-foreground backdrop-blur-md transition-colors hover:bg-muted"
              >
                <Globe className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {LANGS.map((l) => (
                <DropdownMenuItem key={l.code} onClick={() => setLang(l.code)}>
                  {t(l.key)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Account menu"
                className="hidden h-9 items-center gap-2 rounded-full border border-border bg-card/60 px-3 text-sm text-foreground backdrop-blur-md transition-colors hover:bg-muted lg:inline-flex"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-primary-light to-primary-dark text-xs font-medium text-primary-foreground">
                  {(user?.firstName?.[0] ?? 'U').toUpperCase()}
                </span>
                <span className="max-w-[8rem] truncate">{user?.firstName ?? 'Account'}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" /> {t('nav.signout', 'Sign out')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            type="button"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileOpen((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card/60 text-foreground lg:hidden"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            aria-label="Mobile"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden border-t border-border/70 bg-card/95 backdrop-blur-xl lg:hidden"
          >
            <div className="grid grid-cols-2 gap-1 p-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigate(item.path)}
                    className={cn(
                      'flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm',
                      active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" /> {t('nav.signout', 'Sign out')}
              </button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
