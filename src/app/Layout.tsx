import { NavLink, Outlet } from 'react-router-dom';

const NAV = [
  { to: '/', label: 'Дашборд', end: true },
  { to: '/learn', label: 'Учить' },
  { to: '/review', label: 'Повторение' },
  { to: '/quiz', label: 'Квиз' },
  { to: '/library', label: 'Библиотека' },
  { to: '/progress', label: 'Прогресс' },
];

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-surface-muted">
        <nav className="max-w-5xl mx-auto flex items-center gap-1 px-4 py-3 overflow-x-auto">
          <span className="font-bold text-accent-soft mr-4">ArchMentor</span>
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm whitespace-nowrap ${isActive ? 'bg-surface-raised text-white' : 'text-slate-400 hover:text-white'}`}>
              {n.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8"><Outlet /></main>
    </div>
  );
}
