import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getConcept } from '@/content/index';
import { useConcept } from '@/content/localize';
import { CodeBlock } from '@/components/CodeBlock';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { GRADE_LABEL, CATEGORY_LABEL } from '@/lib/labels';
import { useStore } from '@/store/useStore';
import { useT } from '@/i18n/useT';

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <h2 className="text-lg font-bold tracking-tight text-bright">{children}</h2>
      <div className="h-px flex-1 bg-line" />
    </div>
  );
}

const MARKERS = {
  good: { cls: 'bg-good/15 text-good', sym: '+' },
  bad: { cls: 'bg-bad/15 text-bad', sym: '−' },
} as const;

function List({ title, items, marker }: { title: string; items: string[]; marker?: 'good' | 'bad' }) {
  return (
    <section className="space-y-4">
      <SectionHeading>{title}</SectionHeading>
      <ul className="space-y-2.5">
        {items.map((i) => (
          <li key={i} className="flex gap-3 leading-relaxed text-content">
            {marker ? (
              <span className={`mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-md text-sm font-bold ${MARKERS[marker].cls}`} aria-hidden="true">
                {MARKERS[marker].sym}
              </span>
            ) : (
              <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-accent" aria-hidden="true" />
            )}
            <span>{i}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ConceptPage() {
  const { conceptId } = useParams();
  const lang = useStore((s) => s.settings.lang);
  const t = useT();
  const c = useConcept(conceptId ?? '');
  if (!c) return <EmptyState icon="🧭" title={t('concept.notFoundTitle')} cta={{ to: '/library', label: t('concept.backToLibrary') }} />;

  return (
    <article className="space-y-8">
      <Link
        to="/library"
        className="inline-flex w-fit items-center rounded text-sm font-medium text-muted transition hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {t('concept.backToLibrary')}
      </Link>

      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="category" category={c.category}>{CATEGORY_LABEL[lang][c.category]}</Badge>
          <Badge tone="grade">{GRADE_LABEL[c.grade]}</Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-bright sm:text-4xl">{c.name}</h1>
        <p className="max-w-prose text-lg leading-relaxed text-muted">{c.tagline}</p>
      </header>

      <section className="space-y-4">
        <SectionHeading>{t('concept.definition')}</SectionHeading>
        <p className="max-w-prose leading-relaxed text-content">{c.definition}</p>
      </section>

      <section className="space-y-4">
        <SectionHeading>{t('concept.problem')}</SectionHeading>
        <p className="max-w-prose leading-relaxed text-content">{c.problem}</p>
      </section>

      <section className="space-y-4">
        <SectionHeading>{t('concept.solution')}</SectionHeading>
        <p className="max-w-prose leading-relaxed text-content">{c.solution}</p>
      </section>

      <section className="space-y-4">
        <SectionHeading>{t('concept.codeExample')}</SectionHeading>
        <CodeBlock sample={c.codeExample} />
      </section>

      <div className="grid gap-8 sm:grid-cols-2">
        <List title={t('concept.pros')} items={c.pros} marker="good" />
        <List title={t('concept.cons')} items={c.cons} marker="bad" />
      </div>

      <List title={t('concept.tradeoffs')} items={c.tradeoffs} />
      <List title={t('concept.whenToUse')} items={c.whenToUse} />
      {c.whenNotToUse && <List title={t('concept.whenNotToUse')} items={c.whenNotToUse} />}

      {c.related.length > 0 && (
        <section className="space-y-4">
          <SectionHeading>{t('concept.related')}</SectionHeading>
          <div className="flex flex-wrap gap-2">
            {c.related.map((r) => {
              const rc = getConcept(r);
              return (
                <Link
                  key={r}
                  to={`/library/${r}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-raised px-3 py-1 text-sm font-medium text-content shadow-card transition hover:-translate-y-0.5 hover:border-line-strong hover:text-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {rc && <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: `rgb(var(--cat-${rc.category}))` }} aria-hidden="true" />}
                  {rc?.name ?? r}
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </article>
  );
}
