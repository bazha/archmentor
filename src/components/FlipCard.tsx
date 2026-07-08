import type { ReactNode } from 'react';
import { useT } from '@/i18n/useT';

export function FlipCard({
  front, back, flipped, onFlip,
}: { front: ReactNode; back: ReactNode; flipped: boolean; onFlip: () => void }) {
  const t = useT();
  return (
    <button
      onClick={onFlip}
      aria-label={t('flip.aria')}
      className="block min-h-60 w-full rounded-2xl border border-line bg-surface-raised p-8 text-left shadow-card transition hover:border-line-strong hover:shadow-card-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-faint">
        {flipped ? t('flip.definition') : t('flip.term')}
      </div>
      <div className="text-lg leading-relaxed">{flipped ? back : front}</div>
      {!flipped && <div className="mt-5 text-sm text-muted">{t('flip.hint')}</div>}
    </button>
  );
}
