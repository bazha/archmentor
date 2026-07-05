import { useMemo, useState } from 'react';
import { concepts, getConcept } from '@/content/index';
import { FlipCard } from '@/components/FlipCard';
import { EmptyState } from '@/components/EmptyState';
import { useStore, selectReviewQueue } from '@/store/useStore';
import { QUALITY, type Quality } from '@/domain/srs/sm2';
import { todayISO } from '@/lib/date';
import { useT } from '@/i18n/useT';

const GRADES: { label: string; quality: Quality; cls: string }[] = [
  { label: 'Again', quality: QUALITY.again, cls: 'bg-red-500/80' },
  { label: 'Hard', quality: QUALITY.hard, cls: 'bg-amber-500/80' },
  { label: 'Good', quality: QUALITY.good, cls: 'bg-emerald-500/80' },
  { label: 'Easy', quality: QUALITY.easy, cls: 'bg-sky-500/80' },
];

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
  const concept = currentId ? getConcept(currentId) : undefined;

  function grade(q: Quality) {
    if (!concept) return;
    reviewConcept(concept.id, q, today);
    setFlipped(false);
  }

  if (!concept) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-semibold">{t('review.title')}</h1>
        <EmptyState icon="🎉" title={t('review.doneTitle')} hint={t('review.doneHint')} cta={{ to: '/learn', label: t('review.learnNew') }} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t('review.title')}</h1>
        <span className="text-sm text-muted">{t('review.remaining', { n: queue.length })}</span>
      </div>
      <FlipCard
        front={<span className="text-xl font-semibold">{concept.name}<span className="block text-sm font-normal text-muted mt-2">{concept.tagline}</span></span>}
        back={<span>{concept.definition}</span>}
        flipped={flipped} onFlip={() => setFlipped((f) => !f)}
      />
      {flipped && (
        <div className="grid grid-cols-4 gap-2">
          {GRADES.map((g) => (
            <button key={g.label} onClick={() => grade(g.quality)}
              className={`rounded-lg py-2 text-sm font-medium text-white ${g.cls} hover:opacity-90`}>{g.label}</button>
          ))}
        </div>
      )}
      {!flipped && <p className="text-center text-sm text-muted">{t('review.recallHint')}</p>}
    </div>
  );
}
