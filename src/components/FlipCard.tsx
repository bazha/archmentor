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
      className="block w-full min-h-56 rounded-xl bg-surface-raised border border-surface-muted p-6 text-left transition hover:border-accent-soft"
    >
      <div className="text-xs uppercase tracking-wide text-muted mb-2">{flipped ? t('flip.definition') : t('flip.term')}</div>
      <div className="text-lg">{flipped ? back : front}</div>
      {!flipped && <div className="mt-4 text-sm text-muted">{t('flip.hint')}</div>}
    </button>
  );
}
