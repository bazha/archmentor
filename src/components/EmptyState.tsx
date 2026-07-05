import { Link } from 'react-router-dom';

export function EmptyState({
  icon = '🗂️', title, hint, cta,
}: { icon?: string; title: string; hint?: string; cta?: { to: string; label: string } }) {
  return (
    <div className="text-center py-12 space-y-3">
      <div className="text-4xl" aria-hidden="true">{icon}</div>
      <p className="text-lg font-medium text-content">{title}</p>
      {hint && <p className="text-sm text-muted">{hint}</p>}
      {cta && (
        <Link to={cta.to}
          className="inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft">
          {cta.label}
        </Link>
      )}
    </div>
  );
}
