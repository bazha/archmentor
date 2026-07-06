import { useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { applyTheme } from './theme';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useT } from '@/i18n/useT';
import type { MessageKey } from '@/i18n/messages';

const NAV: { to: string; key: MessageKey; end?: boolean }[] = [
  { to: '/', key: 'nav.dashboard', end: true },
  { to: '/learn', key: 'nav.learn' },
  { to: '/review', key: 'nav.review' },
  { to: '/quiz', key: 'nav.quiz' },
  { to: '/library', key: 'nav.library' },
  { to: '/progress', key: 'nav.progress' },
];

export function Layout() {
  const theme = useStore((s) => s.settings.theme);
  const t = useT();
  useEffect(() => { applyTheme(theme); }, [theme]);

  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-3 focus:py-1.5 focus:text-white">
        {t('common.skipToContent')}
      </a>
      <header className="border-b border-surface-muted">
        <nav aria-label={t('common.mainNav')} className="max-w-5xl mx-auto flex items-center gap-1 px-4 py-3 overflow-x-auto">
          <span className="font-bold text-accent-soft mr-4">ArchMentor</span>
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft ${isActive ? 'bg-surface-raised text-content' : 'text-muted hover:text-content'}`}>
              {t(n.key)}
            </NavLink>
          ))}
          <span className="ml-auto flex items-center gap-1"><LanguageToggle /><ThemeToggle /></span>
        </nav>
      </header>
      <main id="main" tabIndex={-1} className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 focus:outline-none"><Outlet /></main>
    </div>
  );
}
