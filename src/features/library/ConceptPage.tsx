import { Link, useParams } from 'react-router-dom';
import { getConcept } from '@/content/index';
import { useConcept } from '@/content/localize';
import { CodeBlock } from '@/components/CodeBlock';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { GRADE_LABEL, CATEGORY_LABEL } from '@/lib/labels';
import { useStore } from '@/store/useStore';
import { useT } from '@/i18n/useT';

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="font-semibold mb-1">{title}</h3>
      <ul className="list-disc list-inside text-content space-y-1">{items.map((i) => <li key={i}>{i}</li>)}</ul>
    </div>
  );
}

export function ConceptPage() {
  const { conceptId } = useParams();
  const lang = useStore((s) => s.settings.lang);
  const t = useT();
  const c = useConcept(conceptId ?? '');
  if (!c) return <EmptyState icon="🧭" title={t('concept.notFoundTitle')} cta={{ to: '/library', label: t('concept.backToLibrary') }} />;

  return (
    <article className="space-y-6">
      <Link to="/library" className="text-sm text-accent-soft">{t('concept.backToLibrary')}</Link>
      <header>
        <h1 className="text-3xl font-bold">{c.name}</h1>
        <p className="mt-1 text-muted">{c.tagline}</p>
        <div className="mt-3 flex gap-2">
          <Badge tone="grade">{GRADE_LABEL[c.grade]}</Badge>
          <Badge tone="category">{CATEGORY_LABEL[lang][c.category]}</Badge>
        </div>
      </header>
      <section><h3 className="font-semibold mb-1">{t('concept.definition')}</h3><p className="text-content">{c.definition}</p></section>
      <section><h3 className="font-semibold mb-1">{t('concept.problem')}</h3><p className="text-content">{c.problem}</p></section>
      <section><h3 className="font-semibold mb-1">{t('concept.solution')}</h3><p className="text-content">{c.solution}</p></section>
      <section><h3 className="font-semibold mb-2">{t('concept.codeExample')}</h3><CodeBlock sample={c.codeExample} /></section>
      <div className="grid gap-6 sm:grid-cols-2">
        <List title={t('concept.pros')} items={c.pros} />
        <List title={t('concept.cons')} items={c.cons} />
      </div>
      <List title={t('concept.tradeoffs')} items={c.tradeoffs} />
      <List title={t('concept.whenToUse')} items={c.whenToUse} />
      {c.whenNotToUse && <List title={t('concept.whenNotToUse')} items={c.whenNotToUse} />}
      {c.related.length > 0 && (
        <section>
          <h3 className="font-semibold mb-2">{t('concept.related')}</h3>
          <div className="flex gap-2 flex-wrap">
            {c.related.map((r) => <Link key={r} to={`/library/${r}`} className="text-accent-soft underline">{getConcept(r)?.name ?? r}</Link>)}
          </div>
        </section>
      )}
    </article>
  );
}
