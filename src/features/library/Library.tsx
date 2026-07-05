import { useMemo, useState } from 'react';
import { concepts } from '@/content/index';
import { ConceptCard } from './ConceptCard';
import { PillGroup } from '@/components/PillGroup';
import { CATEGORY_LABEL } from '@/lib/labels';
import { useStore, isMastered } from '@/store/useStore';
import type { Category } from '@/content/schema';

const CATEGORY_OPTIONS: { value: Category | 'all'; label: string }[] = [
  { value: 'all', label: 'Все' },
  ...(Object.keys(CATEGORY_LABEL) as Category[]).map((c) => ({ value: c, label: CATEGORY_LABEL[c] })),
];

export function Library() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | 'all'>('all');
  const state = useStore();

  const filtered = useMemo(
    () =>
      concepts.filter(
        (c) =>
          (category === 'all' || c.category === category) &&
          (query === '' || `${c.name} ${c.aka?.join(' ') ?? ''} ${c.tagline}`.toLowerCase().includes(query.toLowerCase())),
      ),
    [query, category],
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Библиотека</h1>
      <input
        value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск по названию…"
        aria-label="Поиск концептов"
        className="w-full rounded-lg bg-surface-raised border border-surface-muted px-3 py-2 outline-none focus:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      />
      <PillGroup options={CATEGORY_OPTIONS} value={category} onChange={setCategory} />
      {filtered.length === 0 ? (
        <p className="text-muted">Ничего не найдено.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((c) => <ConceptCard key={c.id} concept={c} mastered={isMastered(state, c.id)} />)}
        </div>
      )}
    </div>
  );
}
