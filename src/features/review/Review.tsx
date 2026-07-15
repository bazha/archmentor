import { useMemo, useState } from 'react';
import { concepts } from '@/content/index';
import { useConcept } from '@/content/localize';
import { FlipCard } from '@/components/FlipCard';
import { EmptyState } from '@/components/EmptyState';
import { useStore, selectReviewQueue } from '@/store/useStore';
import { QUALITY, type Quality } from '@/domain/srs/sm2';
import { todayISO } from '@/lib/date';
import { useT } from '@/i18n/useT';

const GRADES: { label: string; quality: Quality; cls: string }[] = [
  { label: 'Again', quality: QUALITY.again, cls: 'text-bad' },
  { label: 'Hard', quality: QUALITY.hard, cls: 'text-content' },
  { label: 'Good', quality: QUALITY.good, cls: 'text-good' },
  { label: 'Easy', quality: QUALITY.easy, cls: 'text-info' },
];

const GRADE_BTN =
  'inline-flex items-center justify-center rounded-xl border border-line bg-surface-raised px-4 py-2.5 text-sm font-semibold shadow-card transition hover:-translate-y-0.5 hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

export function Review() {
  const today = todayISO();
  const srs = useStore((s) => s.srs);
  const reviewConcept = useStore((s) => s.reviewConcept);
  const [flipped, setFlipped] = useState(false);
  const t = useT();

  // New concepts (no SRS state) count as due, plus existing due cards.
  // Subscribing to `srs` means grading a card re-renders and recomputes the
  // queue (the graded card's due date moves out), advancing to the next card.
  const queue = useMemo(
    () => selectReviewQueue(useStore.getState(), concepts, today),
    [srs, today],
  );

  const currentId = queue[0];
  const view = useConcept(currentId ?? '');
  const concept = currentId ? view : undefined;

  function grade(q: Quality) {
    if (!concept) return;
    reviewConcept(concept.id, q, today);
    setFlipped(false);
  }

  if (!concept) {
    return (
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-bright">{t('review.title')}</h1>
        <EmptyState icon="🎉" title={t('review.doneTitle')} hint={t('review.doneHint')} cta={{ to: '/learn', label: t('review.learnNew') }} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-bright">{t('review.title')}</h1>
        <span className="inline-flex items-center rounded-full border border-line bg-surface-raised px-3.5 py-1 text-sm font-bold tabular-nums text-muted shadow-card">
          {t('review.remaining', { n: queue.length })}
        </span>
      </div>

      <FlipCard
        front={
          <span className="block">
            <span className="text-2xl font-semibold tracking-tight text-bright">{concept.name}</span>
            <span className="mt-2 block text-sm font-normal text-muted">{concept.tagline}</span>
          </span>
        }
        back={<span>{concept.definition}</span>}
        flipped={flipped}
        onFlip={() => setFlipped((f) => !f)}
      />

      {flipped ? (
        <div className="grid grid-cols-4 gap-2.5">
          {GRADES.map((g) => (
            <button key={g.label} onClick={() => grade(g.quality)} className={`${GRADE_BTN} ${g.cls}`}>
              {g.label}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-center text-sm text-muted">{t('review.recallHint')}</p>
      )}
    </div>
  );
}
