import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { concepts, getConcept } from '@/content/index';
import { FlipCard } from '@/components/FlipCard';
import { PillGroup } from '@/components/PillGroup';
import { Badge } from '@/components/Badge';
import { useStore } from '@/store/useStore';
import { todayISO } from '@/lib/date';
import { GRADE_ORDER, GRADE_LABEL, CATEGORY_LABEL } from '@/lib/labels';
import type { Grade } from '@/content/schema';

const GRADE_OPTIONS: { value: Grade | 'all'; label: string }[] = [
  { value: 'all', label: 'Все' },
  ...GRADE_ORDER.map((g) => ({ value: g, label: GRADE_LABEL[g] })),
];

export function Learn() {
  const { conceptId } = useParams();
  const [grade, setGrade] = useState<Grade | 'all'>('all');
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const markSeen = useStore((s) => s.markSeen);

  const deck = useMemo(() => {
    if (conceptId) { const c = getConcept(conceptId); return c ? [c] : []; }
    return concepts.filter((c) => grade === 'all' || c.grade === grade);
  }, [conceptId, grade]);

  const current = deck[index];

  function next() {
    if (current) markSeen(current.id, todayISO());
    setFlipped(false);
    setIndex((i) => (i + 1) % Math.max(deck.length, 1));
  }

  if (!current) return <p className="text-muted">Нет карточек для выбранного фильтра.</p>;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Учить</h1>
        <span className="text-sm text-muted">{index + 1} / {deck.length}</span>
      </div>
      {!conceptId && <PillGroup options={GRADE_OPTIONS} value={grade} onChange={(g) => { setGrade(g); setIndex(0); setFlipped(false); }} />}
      <div className="flex gap-2">
        <Badge tone="grade">{GRADE_LABEL[current.grade]}</Badge>
        <Badge tone="category">{CATEGORY_LABEL[current.category]}</Badge>
      </div>
      <FlipCard
        front={<span className="text-xl font-semibold">{current.name}<span className="block text-sm font-normal text-muted mt-2">{current.tagline}</span></span>}
        back={<span>{current.definition}<span className="block mt-3 text-sm text-muted">Когда: {current.whenToUse.join('; ')}</span></span>}
        flipped={flipped} onFlip={() => setFlipped((f) => !f)}
      />
      <div className="flex justify-end">
        <button onClick={next} className="rounded-lg bg-accent px-4 py-2 font-medium hover:bg-accent-soft">Следующая →</button>
      </div>
    </div>
  );
}
