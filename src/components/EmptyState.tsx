import { Link } from 'react-router-dom';

export function EmptyState({
  icon = '🗂️', title, hint, cta,
}: { icon?: string; title: string; hint?: string; cta?: { to: string; label: string } }) {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <div className="mb-4 text-4xl" aria-hidden="true">{icon}</div>
      <p className="text-lg font-semibold text-bright">{title}</p>
      {hint && <p className="mt-2 text-sm text-muted">{hint}</p>}
      {cta && (
        <Link to={cta.to}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent shadow-card transition hover:-translate-y-0.5 hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
          {cta.label}
        </Link>
      )}
    </div>
  );
}
