import { useEffect, useMemo } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useStore, type AppState } from '@/store/useStore';
import { selectCourseProgress } from '@/domain/course';
import { applyTheme } from './theme';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { CommandPalette } from '@/components/CommandPalette';
import { Icon, type IconName } from '@/components/Icon';
import { useT } from '@/i18n/useT';
import type { MessageKey } from '@/i18n/messages';

const NAV: { to: string; key: MessageKey; icon: IconName; end?: boolean }[] = [
  { to: '/', key: 'nav.dashboard', icon: 'dashboard', end: true },
  { to: '/course', key: 'nav.course', icon: 'course' },
  { to: '/learn', key: 'nav.learn', icon: 'learn' },
  { to: '/review', key: 'nav.review', icon: 'review' },
  { to: '/quiz', key: 'nav.quiz', icon: 'quiz' },
  { to: '/interview', key: 'nav.interview', icon: 'interview' },
  { to: '/compare', key: 'nav.compare', icon: 'compare' },
  { to: '/diagram', key: 'nav.diagram', icon: 'diagram' },
  { to: '/library', key: 'nav.library', icon: 'library' },
  { to: '/progress', key: 'nav.progress', icon: 'progress' },
];

function titleKeyFor(pathname: string): MessageKey {
  if (pathname.startsWith('/course')) return 'nav.course';
  if (pathname.startsWith('/learn')) return 'nav.learn';
  if (pathname.startsWith('/review')) return 'nav.review';
  if (pathname.startsWith('/quiz')) return 'nav.quiz';
  if (pathname.startsWith('/interview')) return 'nav.interview';
  if (pathname.startsWith('/compare')) return 'nav.compare';
  if (pathname.startsWith('/diagram')) return 'nav.diagram';
  if (pathname.startsWith('/library')) return 'nav.library';
  if (pathname.startsWith('/progress')) return 'nav.progress';
  return 'nav.dashboard';
}

export function Layout() {
  const theme = useStore((s) => s.settings.theme);
  const srs = useStore((s) => s.srs);
  const t = useT();
  const { pathname } = useLocation();
  useEffect(() => { applyTheme(theme); }, [theme]);

  const progress = useMemo(() => selectCourseProgress({ srs } as AppState), [srs]);

  return (
    <div className="min-h-screen md:grid md:grid-cols-[15.5rem_1fr]">
      <a href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-accent focus:px-3 focus:py-1.5 focus:text-on-accent">
        {t('common.skipToContent')}
      </a>

      {/* Sidebar (horizontal strip on mobile, rail on md+) */}
      <aside className="flex items-center gap-1 overflow-x-auto border-b border-line px-3 py-2.5 md:sticky md:top-0 md:h-screen md:flex-col md:items-stretch md:gap-0.5 md:overflow-y-auto md:overflow-x-visible md:border-b-0 md:border-r md:px-3.5 md:py-5">
        <div className="mr-3 flex flex-none items-center gap-2.5 md:mb-5 md:mr-0 md:px-2">
          <svg viewBox="0 0 24 24" className="h-7 w-7 flex-none text-accent" aria-hidden="true">
            <path d="m12 2.5 8.5 4.75L12 12 3.5 7.25 12 2.5Z" fill="currentColor" />
            <path d="m3.5 12 8.5 4.75L20.5 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" opacity="0.55" />
            <path d="m3.5 16.75 8.5 4.75 8.5-4.75" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" opacity="0.3" />
          </svg>
          <span className="text-[1.05rem] font-bold tracking-tight text-bright">ArchMentor</span>
        </div>

        <nav aria-label={t('common.mainNav')} className="flex flex-none items-center gap-1 md:flex-col md:items-stretch md:gap-0.5">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}
              className={({ isActive }) =>
                `flex items-center gap-3 whitespace-nowrap rounded-xl px-2.5 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent md:px-3 ${
                  isActive ? 'bg-accent/10 font-semibold text-accent' : 'text-muted hover:bg-surface-raised hover:text-content'
                }`}>
              <Icon name={n.icon} className="h-[1.15rem] w-[1.15rem] flex-none" />
              <span>{t(n.key)}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto hidden pt-4 md:block">
          <div className="rounded-xl border border-line bg-surface-raised p-3.5 shadow-card">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-xs text-muted">{t('common.mastered')}</span>
              <span className="text-sm font-bold tabular-nums text-bright">
                {progress.mastered}<span className="text-xs font-medium text-muted">/{progress.total}</span>
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
              <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${progress.pct}%` }} />
            </div>
          </div>
        </div>
      </aside>

      {/* Content */}
      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-line bg-surface/70 px-4 backdrop-blur-xl md:px-7">
          <div className="text-[1.05rem] font-bold tracking-tight text-bright">{t(titleKeyFor(pathname))}</div>
          <div className="ml-auto flex items-center gap-2">
            <CommandPalette />
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </header>
        <main id="main" tabIndex={-1} className="flex-1 px-4 py-10 focus:outline-none md:px-8 md:py-14">
          <div className="mx-auto w-full max-w-5xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
