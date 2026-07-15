import { useMemo, useState } from 'react';
import { useConcepts } from '@/content/localize';
import { ConceptCard } from './ConceptCard';
import { PillGroup } from '@/components/PillGroup';
import { EmptyState } from '@/components/EmptyState';
import { Icon } from '@/components/Icon';
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

  const list = useConcepts();
  const filtered = useMemo(
    () =>
      list.filter(
        (c) =>
          (category === 'all' || c.category === category) &&
          (query === '' || `${c.name} ${c.aka?.join(' ') ?? ''} ${c.tagline}`.toLowerCase().includes(query.toLowerCase())),
      ),
    [list, query, category],
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/10 text-accent" aria-hidden="true">
          <Icon name="library" className="h-5 w-5" />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight text-bright">{t('library.title')}</h1>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" aria-hidden="true">
            <Icon name="search" className="h-4 w-4" />
          </span>
          <input
            value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('library.searchPlaceholder')}
            aria-label={t('library.searchLabel')}
            className="w-full rounded-xl border border-line bg-surface-raised py-2.5 pl-10 pr-3.5 text-sm text-content placeholder:text-faint outline-none transition-colors hover:border-line-strong focus:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
        </div>
        <PillGroup options={CATEGORY_OPTIONS} value={category} onChange={setCategory} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="🔍" title={t('library.emptyTitle')} hint={t('library.emptyHint')} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => <ConceptCard key={c.id} concept={c} mastered={isMastered(state, c.id)} />)}
        </div>
      )}
    </div>
  );
}
