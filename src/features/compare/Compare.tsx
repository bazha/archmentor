import { useId, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useConcepts, type ConceptView } from '@/content/localize';
import { selectConfusablePairs } from '@/domain/compare/pairs';
import { CodeBlock } from '@/components/CodeBlock';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { GRADE_LABEL, CATEGORY_LABEL } from '@/lib/labels';
import { useStore } from '@/store/useStore';
import { useT } from '@/i18n/useT';
import type { MessageKey } from '@/i18n/messages';

type Row =
  | { key: string; label: MessageKey; kind: 'text'; get: (c: ConceptView) => string }
  | { key: string; label: MessageKey; kind: 'list'; get: (c: ConceptView) => string[] | undefined }
  | { key: string; label: MessageKey; kind: 'code' };

const ROWS: Row[] = [
  { key: 'definition', label: 'concept.definition', kind: 'text', get: (c) => c.definition },
  { key: 'problem', label: 'concept.problem', kind: 'text', get: (c) => c.problem },
  { key: 'solution', label: 'concept.solution', kind: 'text', get: (c) => c.solution },
  { key: 'pros', label: 'concept.pros', kind: 'list', get: (c) => c.pros },
  { key: 'cons', label: 'concept.cons', kind: 'list', get: (c) => c.cons },
  { key: 'tradeoffs', label: 'concept.tradeoffs', kind: 'list', get: (c) => c.tradeoffs },
  { key: 'whenToUse', label: 'concept.whenToUse', kind: 'list', get: (c) => c.whenToUse },
  { key: 'whenNotToUse', label: 'concept.whenNotToUse', kind: 'list', get: (c) => c.whenNotToUse },
  { key: 'codeExample', label: 'concept.codeExample', kind: 'code' },
];

function Cell({ row, c }: { row: Row; c: ConceptView }) {
  if (row.kind === 'code') return <CodeBlock sample={c.codeExample} />;
  if (row.kind === 'text') return <p className="leading-relaxed text-content [text-wrap:pretty]">{row.get(c)}</p>;
  const items = row.get(c);
  if (!items || items.length === 0) return <p className="text-sm text-faint">—</p>;
  return (
    <ul className="space-y-1.5">
      {items.map((it, i) => (
        <li key={i} className="flex gap-2 text-content">
          <span aria-hidden="true" className="text-accent">•</span>
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

function ColumnHeader({ c, lang }: { c: ConceptView; lang: 'ru' | 'en' }) {
  const t = useT();
  return (
    <div className="space-y-2 rounded-2xl border border-line bg-surface-raised p-5 shadow-card">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-semibold tracking-tight text-bright">{c.name}</h2>
        <Badge tone="grade">{GRADE_LABEL[c.grade]}</Badge>
        <Badge tone="category" category={c.category}>{CATEGORY_LABEL[lang][c.category]}</Badge>
      </div>
      <p className="text-sm text-muted">{c.tagline}</p>
      <Link
        to={`/library/${c.id}`}
        className="inline-block rounded text-xs font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {t('compare.openInLibrary')}
      </Link>
    </div>
  );
}

function ConceptSelect({
  concepts, exclude, placeholder, label, onPick,
}: {
  concepts: ConceptView[];
  exclude?: string;
  placeholder: string;
  label: string;
  onPick: (id: string) => void;
}) {
  const base = useId();
  const listId = `${base}-list`;
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return concepts
      .filter((c) => c.id !== exclude)
      .filter(
        (c) =>
          !q ||
          c.name.toLowerCase().includes(q) ||
          c.tagline.toLowerCase().includes(q) ||
          (c.aka ?? []).some((a) => a.toLowerCase().includes(q)),
      )
      .slice(0, 8);
  }, [concepts, query, exclude]);

  const pick = (id: string) => { onPick(id); setQuery(''); setOpen(false); setActive(0); };

  return (
    <div className="relative">
      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-label={label}
        aria-controls={listId}
        aria-activedescendant={open && filtered[active] ? `${base}-opt-${active}` : undefined}
        aria-autocomplete="list"
        autoComplete="off"
        value={query}
        placeholder={placeholder}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); setActive(0); }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(i + 1, filtered.length - 1)); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
          else if (e.key === 'Enter') { e.preventDefault(); if (filtered[active]) pick(filtered[active].id); }
          else if (e.key === 'Escape') { setOpen(false); }
        }}
        className="w-full rounded-xl border border-line bg-surface-raised px-4 py-2.5 text-sm text-bright outline-none placeholder:text-faint focus-visible:ring-2 focus-visible:ring-accent"
      />
      {open && filtered.length > 0 && (
        <ul id={listId} role="listbox" className="absolute z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-line-strong bg-surface-raised p-1.5 shadow-card-lg">
          {filtered.map((c, i) => (
            <li key={c.id}>
              <button
                type="button"
                id={`${base}-opt-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => e.preventDefault()}
                onMouseMove={() => setActive(i)}
                onClick={() => pick(c.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm ${i === active ? 'bg-accent/10 text-bright' : 'text-content'}`}
              >
                <span className="flex-1 font-medium">{c.name}</span>
                <span className="hidden truncate text-xs text-faint sm:inline">{c.tagline}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Compare() {
  const t = useT();
  const navigate = useNavigate();
  const { a, b } = useParams();
  const concepts = useConcepts();
  const lang = useStore((s) => s.settings.lang);

  const byId = useMemo(() => new Map(concepts.map((c) => [c.id, c])), [concepts]);
  const pairs = useMemo(() => selectConfusablePairs(concepts), [concepts]);

  const left = a ? byId.get(a) ?? null : null;
  const right = b ? byId.get(b) ?? null : null;

  const go = (na: string | null, nb: string | null) => {
    const ids = [na, nb].filter((v): v is string => Boolean(v));
    navigate(ids.length ? `/compare/${ids.join('/')}` : '/compare');
  };

  const rows = ROWS.filter(
    (row) => !(row.key === 'whenNotToUse' && !left?.whenNotToUse && !right?.whenNotToUse),
  );

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-faint">{t('nav.compare')}</p>
        <h1 className="text-3xl font-semibold tracking-tight text-bright">{t('compare.title')}</h1>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <ConceptSelect
          concepts={concepts}
          exclude={right?.id}
          placeholder={left ? left.name : t('compare.selectA')}
          label={t('compare.selectA')}
          onPick={(id) => go(id, right?.id ?? null)}
        />
        <ConceptSelect
          concepts={concepts}
          exclude={left?.id}
          placeholder={right ? right.name : t('compare.selectB')}
          label={t('compare.selectB')}
          onPick={(id) => go(left?.id ?? null, id)}
        />
      </div>

      {!(left && right) && (
        <div className="space-y-6">
          <EmptyState icon="⚖️" title={t('compare.emptyTitle')} hint={t('compare.emptyHint')} />
          {pairs.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wide text-muted">{t('compare.confusable')}</h2>
              <ul className="flex flex-wrap gap-2">
                {pairs.map((p) => (
                  <li key={`${p.a}|${p.b}`}>
                    <button
                      type="button"
                      onClick={() => navigate(`/compare/${p.a}/${p.b}`)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-raised px-3.5 py-1.5 text-sm font-medium text-content shadow-card transition hover:-translate-y-0.5 hover:border-line-strong hover:text-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      {byId.get(p.a)?.name} ↔ {byId.get(p.b)?.name}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {left && right && (
        <div className="space-y-8">
          <div className="grid gap-4 md:grid-cols-2">
            <ColumnHeader c={left} lang={lang} />
            <ColumnHeader c={right} lang={lang} />
          </div>
          {rows.map((row) => (
            <section key={row.key} className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wide text-muted">{t(row.label)}</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <Cell row={row} c={left} />
                <Cell row={row} c={right} />
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
