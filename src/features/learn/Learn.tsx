import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useConcepts, useConcept } from '@/content/localize';
import { FlipCard } from '@/components/FlipCard';
import { EmptyState } from '@/components/EmptyState';
import { PillGroup } from '@/components/PillGroup';
import { Badge } from '@/components/Badge';
import { CodeBlock } from '@/components/CodeBlock';
import { Icon } from '@/components/Icon';
import { useStore } from '@/store/useStore';
import { todayISO } from '@/lib/date';
import { GRADE_ORDER, GRADE_LABEL, CATEGORY_LABEL } from '@/lib/labels';
import { useT } from '@/i18n/useT';
import type { Grade } from '@/content/schema';

export function Learn() {
  const { conceptId } = useParams();
  const [grade, setGrade] = useState<Grade | 'all'>('all');
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const markSeen = useStore((s) => s.markSeen);
  const lang = useStore((s) => s.settings.lang);
  const t = useT();

  const GRADE_OPTIONS: { value: Grade | 'all'; label: string }[] = [
    { value: 'all', label: t('common.all') },
    ...GRADE_ORDER.map((g) => ({ value: g, label: GRADE_LABEL[g] })),
  ];

  const allConcepts = useConcepts();
  const singleConcept = useConcept(conceptId ?? '');

  const deck = useMemo(() => {
    if (conceptId) return singleConcept ? [singleConcept] : [];
    return allConcepts.filter((c) => grade === 'all' || c.grade === grade);
  }, [conceptId, grade, allConcepts, singleConcept]);

  const current = deck[index];

  function next() {
    if (current) markSeen(current.id, todayISO());
    setFlipped(false);
    setShowCode(false);
    setIndex((i) => (i + 1) % Math.max(deck.length, 1));
  }

  if (!current) return <EmptyState icon="🃏" title={t('learn.emptyTitle')} hint={t('learn.emptyHint')} />;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-bright">{t('learn.title')}</h1>
        <span className="inline-flex items-center rounded-full border border-line bg-surface-raised px-3.5 py-1 text-sm font-bold tabular-nums text-muted shadow-card">{t('common.counter', { index: index + 1, total: deck.length })}</span>
      </div>
      {!conceptId && (
        <PillGroup
          options={GRADE_OPTIONS}
          value={grade}
          onChange={(g) => { setGrade(g); setIndex(0); setFlipped(false); }}
        />
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="grade">{GRADE_LABEL[current.grade]}</Badge>
        <Badge tone="category" category={current.category}>{CATEGORY_LABEL[lang][current.category]}</Badge>
      </div>
      <FlipCard
        front={
          <span className="block">
            <span className="block text-3xl font-bold tracking-tight text-bright">{current.name}</span>
            <span className="mt-2 block text-sm font-normal text-muted">{current.tagline}</span>
          </span>
        }
        back={
          <span className="block">
            <span className="text-content">{current.definition}</span>
            <span className="mt-4 block text-sm text-muted">{t('learn.whenPrefix', { list: current.whenToUse.join('; ') })}</span>
          </span>
        }
        flipped={flipped} onFlip={() => { setFlipped((f) => !f); setShowCode(false); }}
      />
      {flipped && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setShowCode((s) => !s)}
            aria-expanded={showCode}
            aria-controls="learn-code"
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface-raised px-4 py-2 text-sm font-semibold text-content shadow-card transition hover:-translate-y-0.5 hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Icon name="chevronRight" className={`h-4 w-4 transition-transform ${showCode ? 'rotate-90' : ''}`} />
            {showCode ? t('learn.hideCode') : t('learn.showCode')}
          </button>
          <div id="learn-code">
            {showCode && <CodeBlock sample={current.codeExample} />}
          </div>
        </div>
      )}
      <div className="flex justify-end">
        <button
          onClick={next}
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent shadow-card transition hover:-translate-y-0.5 hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {t('learn.next')}
        </button>
      </div>
    </div>
  );
}
