import { useMemo, useState } from 'react';
import { concepts } from '@/content/index';
import { ConceptCard } from './ConceptCard';
import { PillGroup } from '@/components/PillGroup';
import { EmptyState } from '@/components/EmptyState';
import { CATEGORY_LABEL } from '@/lib/labels';
import { useStore, isMastered } from '@/store/useStore';
import { useT } from '@/i18n/useT';
import type { Category } from '@/content/schema';

export function Library() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | 'all'>('all');
  const state = useStore();
  const lang = useStore((s) => s.settings.lang);
  const t = useT();
  const CATEGORY_OPTIONS: { value: Category | 'all'; label: string }[] = [
    { value: 'all' as const, label: t('common.all') },
    ...(Object.keys(CATEGORY_LABEL[lang]) as Category[]).map((c) => ({ value: c, label: CATEGORY_LABEL[lang][c] })),
  ];

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
      <h1 className="text-2xl font-semibold">{t('library.title')}</h1>
      <input
        value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('library.searchPlaceholder')}
        aria-label={t('library.searchLabel')}
        className="w-full rounded-lg bg-surface-raised border border-surface-muted px-3 py-2 outline-none focus:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft"
      />
      <PillGroup options={CATEGORY_OPTIONS} value={category} onChange={setCategory} />
      {filtered.length === 0 ? (
        <EmptyState icon="🔍" title={t('library.emptyTitle')} hint={t('library.emptyHint')} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((c) => <ConceptCard key={c.id} concept={c} mastered={isMastered(state, c.id)} />)}
        </div>
      )}
    </div>
  );
}
