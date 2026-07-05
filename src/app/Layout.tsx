import { useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { applyTheme } from './theme';
import { ThemeToggle } from '@/components/ThemeToggle';

const NAV = [
  { to: '/', label: 'Дашборд', end: true },
  { to: '/learn', label: 'Учить' },
  { to: '/review', label: 'Повторение' },
  { to: '/quiz', label: 'Квиз' },
  { to: '/library', label: 'Библиотека' },
  { to: '/progress', label: 'Прогресс' },
];

export function Layout() {
  const theme = useStore((s) => s.settings.theme);
  useEffect(() => { applyTheme(theme); }, [theme]);

  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-3 focus:py-1.5 focus:text-white">
        К содержимому
      </a>
      <header className="border-b border-surface-muted">
        <nav aria-label="Основная" className="max-w-5xl mx-auto flex items-center gap-1 px-4 py-3 overflow-x-auto">
          <span className="font-bold text-accent-soft mr-4">ArchMentor</span>
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${isActive ? 'bg-surface-raised text-content' : 'text-muted hover:text-content'}`}>
              {n.label}
            </NavLink>
          ))}
          <span className="ml-auto"><ThemeToggle /></span>
        </nav>
      </header>
      <main id="main" tabIndex={-1} className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 focus:outline-none"><Outlet /></main>
    </div>
  );
}
