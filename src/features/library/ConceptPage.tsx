import { Link, useParams } from 'react-router-dom';
import { getConcept } from '@/content/index';
import { CodeBlock } from '@/components/CodeBlock';
import { Badge } from '@/components/Badge';
import { GRADE_LABEL, CATEGORY_LABEL } from '@/lib/labels';

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
  const c = conceptId ? getConcept(conceptId) : undefined;
  if (!c) return <div><p className="text-muted">Концепт не найден.</p><Link to="/library" className="text-accent-soft">← В библиотеку</Link></div>;

  return (
    <article className="space-y-6">
      <Link to="/library" className="text-sm text-accent-soft">← В библиотеку</Link>
      <header>
        <h1 className="text-3xl font-bold">{c.name}</h1>
        <p className="mt-1 text-muted">{c.tagline}</p>
        <div className="mt-3 flex gap-2">
          <Badge tone="grade">{GRADE_LABEL[c.grade]}</Badge>
          <Badge tone="category">{CATEGORY_LABEL[c.category]}</Badge>
        </div>
      </header>
      <section><h3 className="font-semibold mb-1">Определение</h3><p className="text-content">{c.definition}</p></section>
      <section><h3 className="font-semibold mb-1">Проблема</h3><p className="text-content">{c.problem}</p></section>
      <section><h3 className="font-semibold mb-1">Решение</h3><p className="text-content">{c.solution}</p></section>
      <section><h3 className="font-semibold mb-2">Пример кода</h3><CodeBlock sample={c.codeExample} /></section>
      <div className="grid gap-6 sm:grid-cols-2">
        <List title="Плюсы" items={c.pros} />
        <List title="Минусы" items={c.cons} />
      </div>
      <List title="Trade-offs" items={c.tradeoffs} />
      <List title="Когда применять" items={c.whenToUse} />
      {c.whenNotToUse && <List title="Когда не стоит" items={c.whenNotToUse} />}
      {c.related.length > 0 && (
        <section>
          <h3 className="font-semibold mb-2">Похожие / путаемые</h3>
          <div className="flex gap-2 flex-wrap">
            {c.related.map((r) => <Link key={r} to={`/library/${r}`} className="text-accent-soft underline">{getConcept(r)?.name ?? r}</Link>)}
          </div>
        </section>
      )}
    </article>
  );
}
