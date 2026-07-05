import type { ReactNode } from 'react';

export function FlipCard({
  front, back, flipped, onFlip,
}: { front: ReactNode; back: ReactNode; flipped: boolean; onFlip: () => void }) {
  return (
    <button
      onClick={onFlip}
      aria-label="Перевернуть карточку"
      className="block w-full min-h-56 rounded-xl bg-surface-raised border border-surface-muted p-6 text-left transition hover:border-accent-soft"
    >
      <div className="text-xs uppercase tracking-wide text-muted mb-2">{flipped ? 'Определение' : 'Термин'}</div>
      <div className="text-lg">{flipped ? back : front}</div>
      {!flipped && <div className="mt-4 text-sm text-muted">Нажмите, чтобы увидеть ответ</div>}
    </button>
  );
}
