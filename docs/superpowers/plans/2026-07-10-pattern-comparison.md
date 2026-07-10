# Side-by-Side Pattern Comparison — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 9th mode — a `/compare` screen that shows two concepts side by side field-by-field, with two searchable selectors and "commonly confused" preset pairs derived from each concept's `related` list.

**Architecture:** URL is the single source of truth: one lazy route `compare/:a?/:b?` renders the `Compare` screen, which reads the pair from `useParams`, resolves them via `useConcepts()`, and renders each field (definition, problem, solution, pros, cons, trade-offs, when-to-use, when-not-to-use, code) as a section whose 2-column grid collapses to one column on mobile. A tiny pure helper `selectConfusablePairs` computes mutual `related` pairs for the presets. No store, schema, or content changes.

**Tech Stack:** React 18 + TypeScript (strict), Vite, Tailwind (semantic CSS-variable tokens), Zustand, react-router-dom 6.30, Vitest + Testing Library. In-house i18n (`src/i18n/messages.ts`, `useT`).

## Global Constraints

- Tokens only: use semantic Tailwind tokens (`bg-surface-raised`, `border-line`/`border-line-strong`, `text-content`/`text-bright`/`text-muted`/`text-faint`, `accent`, `text-on-accent`). No hardcoded hex or raw palette colors (no `slate-*`, `indigo-*`, etc.). New colors-for-text are NOT allowed (keep `contrast.test.ts` green).
- i18n: every user-visible string goes through `t()`; add keys to BOTH `ru` and `en` in `src/i18n/messages.ts`. Parity is enforced by the type `en: Record<MessageKey, string>` and the i18n parity test. Field labels reuse existing `concept.*` keys — do NOT add new ones for them.
- Reuse existing components as-is: `CodeBlock` (`{ sample: ResolvedCodeSample }`), `Badge`, `EmptyState`, `Icon`. Reuse `GRADE_LABEL`/`CATEGORY_LABEL` from `src/lib/labels.ts`. No new dependencies.
- No store, schema, or content changes. Concept names are language-neutral plain strings; all other concept text comes localized from `useConcepts()`.
- Must stay bilingual (RU/EN) and work in both themes; page must not scroll horizontally (code lives in its own `overflow-x` via `CodeBlock`).

---

### Task 1: `selectConfusablePairs` domain helper

**Files:**
- Create: `src/domain/compare/pairs.ts`
- Test: `src/domain/compare/pairs.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `interface RelatedLike { id: string; related: string[] }`
  - `interface ConceptPair { a: string; b: string }`
  - `function selectConfusablePairs(concepts: RelatedLike[]): ConceptPair[]` — one entry per unordered mutual pair (A ∈ related(B) AND B ∈ related(A)); ids within a pair sorted ascending (`a < b`); result sorted by `a` then `b`; deterministic; no `{a,b}`+`{b,a}` duplicates.

- [ ] **Step 1: Write the failing test**

Create `src/domain/compare/pairs.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { selectConfusablePairs, type RelatedLike } from './pairs';

const c = (id: string, related: string[]): RelatedLike => ({ id, related });

describe('selectConfusablePairs', () => {
  it('finds mutual pairs and ignores one-directional related', () => {
    const concepts = [
      c('strategy', ['state', 'observer']), // strategy->observer is one-way
      c('state', ['strategy']),
      c('observer', []),
    ];
    expect(selectConfusablePairs(concepts)).toEqual([{ a: 'state', b: 'strategy' }]);
  });

  it('returns each unordered pair once (no {a,b}+{b,a} duplicates)', () => {
    const concepts = [c('factory-method', ['abstract-factory']), c('abstract-factory', ['factory-method'])];
    const pairs = selectConfusablePairs(concepts);
    expect(pairs).toHaveLength(1);
    expect(pairs[0]).toEqual({ a: 'abstract-factory', b: 'factory-method' });
  });

  it('is deterministic and sorted by a then b', () => {
    const concepts = [
      c('b1', ['a1']), c('a1', ['b1']),
      c('a2', ['a3']), c('a3', ['a2']),
    ];
    expect(selectConfusablePairs(concepts)).toEqual([
      { a: 'a1', b: 'b1' },
      { a: 'a2', b: 'a3' },
    ]);
  });

  it('returns empty when there are no mutual pairs', () => {
    expect(selectConfusablePairs([c('x', ['y']), c('y', [])])).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/domain/compare/pairs.test.ts`
Expected: FAIL — cannot import `selectConfusablePairs` from `./pairs` (module/file does not exist yet).

- [ ] **Step 3: Write the implementation**

Create `src/domain/compare/pairs.ts`:

```ts
/** Structural subset needed to detect confusable pairs — satisfied by both `Concept` and `ConceptView`. */
export interface RelatedLike {
  id: string;
  related: string[];
}

export interface ConceptPair {
  a: string;
  b: string;
}

/**
 * Pairs of concepts that reference each other in `related` (mutual = "commonly confused").
 * Each unordered pair appears once, with ids sorted so `{a,b}` and `{b,a}` never both appear.
 * One-directional `related` links are ignored. Output is sorted by `a` then `b` (deterministic).
 */
export function selectConfusablePairs(concepts: RelatedLike[]): ConceptPair[] {
  const relatedOf = new Map(concepts.map((c) => [c.id, new Set(c.related)]));
  const seen = new Set<string>();
  const pairs: ConceptPair[] = [];
  for (const c of concepts) {
    for (const other of c.related) {
      if (!relatedOf.get(other)?.has(c.id)) continue; // must be mutual
      const [a, b] = c.id < other ? [c.id, other] : [other, c.id];
      const key = `${a}|${b}`;
      if (seen.has(key)) continue;
      seen.add(key);
      pairs.push({ a, b });
    }
  }
  return pairs.sort((p, q) => (p.a === q.a ? p.b.localeCompare(q.b) : p.a.localeCompare(q.a)));
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/domain/compare/pairs.test.ts`
Expected: PASS — all 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/domain/compare/pairs.ts src/domain/compare/pairs.test.ts
git commit -m "feat(compare): mutual-related pair helper for confusable presets"
```

---

### Task 2: `Compare` screen + i18n

**Files:**
- Modify: `src/i18n/messages.ts` (add `nav.compare` + `compare.*` to `ru` and `en`)
- Create: `src/features/compare/Compare.tsx`
- Test: `src/features/compare/Compare.test.tsx`

**Interfaces:**
- Consumes: `selectConfusablePairs(concepts: RelatedLike[]): ConceptPair[]` (Task 1). `ConceptView` has `related: string[]`, so it satisfies `RelatedLike`.
- Consumes: `useConcepts(): ConceptView[]` from `@/content/localize`. `ConceptView` fields used: `id, name, aka?, category, grade, tagline, definition, problem, solution, codeExample, pros, cons, tradeoffs, whenToUse, whenNotToUse?`.
- Consumes: `CodeBlock` — `({ sample }: { sample: ResolvedCodeSample })`; `ConceptView.codeExample` matches `ResolvedCodeSample`.
- Consumes: `Badge` — `({ children, tone?, category? }: { children: ReactNode; tone?: 'grade'|'category'|'neutral'|'done'; category?: Category })`.
- Consumes: `EmptyState` — `({ icon?, title, hint?, cta? })`.
- Consumes: `GRADE_LABEL: Record<Grade,string>` and `CATEGORY_LABEL: Record<Lang, Record<Category,string>>` from `@/lib/labels`.
- Consumes: `useT()` returning `t(key: MessageKey, vars?) => string`; `useStore((s) => s.settings.lang)` returns `'ru' | 'en'`.
- Produces: `export function Compare()` — the route component consumed by Task 3.

- [ ] **Step 1: Add the i18n keys**

In `src/i18n/messages.ts`, in the `ru` object add `nav.compare` immediately after the `'nav.interview': 'Собес',` line:

```ts
  'nav.compare': 'Сравнение',
```

Then, in the `ru` object, add the `compare.*` block immediately after the `'interview.cta': 'Пройти собес →',` line:

```ts
  'compare.title': 'Сравнение паттернов',
  'compare.selectA': 'Первый концепт…',
  'compare.selectB': 'Второй концепт…',
  'compare.confusable': 'Часто путают',
  'compare.emptyTitle': 'Выберите два концепта',
  'compare.emptyHint': 'Выберите два паттерна выше или начните с пары, которую часто путают.',
  'compare.openInLibrary': 'В библиотеке →',
```

In the `en` object add `nav.compare` immediately after `'nav.interview': 'Interview',`:

```ts
  'nav.compare': 'Compare',
```

Then, in the `en` object, add the `compare.*` block immediately after `'interview.cta': 'Take the interview →',`:

```ts
  'compare.title': 'Compare patterns',
  'compare.selectA': 'First concept…',
  'compare.selectB': 'Second concept…',
  'compare.confusable': 'Commonly confused',
  'compare.emptyTitle': 'Pick two concepts',
  'compare.emptyHint': 'Choose two patterns above, or start from a commonly confused pair.',
  'compare.openInLibrary': 'In library →',
```

- [ ] **Step 2: Write the failing test**

Create `src/features/compare/Compare.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Compare } from './Compare';
import { concepts as rawConcepts } from '@/content/index';
import { selectConfusablePairs } from '@/domain/compare/pairs';
import { useStore } from '@/store/useStore';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/compare/:a?/:b?" element={<Compare />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  useStore.getState().setSettings({ lang: 'en' });
});

describe('Compare', () => {
  it('renders both columns for a deep-linked pair', () => {
    const a = rawConcepts[0];
    const b = rawConcepts[1];
    renderAt(`/compare/${a.id}/${b.id}`);
    expect(screen.getByText(a.name)).toBeInTheDocument();
    expect(screen.getByText(b.name)).toBeInTheDocument();
    // Field labels only appear once both are chosen (comparison mode).
    expect(screen.getByText('Definition')).toBeInTheDocument();
  });

  it('shows confusable presets and opens a pair when one is clicked', async () => {
    const pairs = selectConfusablePairs(rawConcepts);
    expect(pairs.length).toBeGreaterThan(0); // sanity: real content has mutual related pairs
    renderAt('/compare');
    // no comparison yet
    expect(screen.queryByText('Definition')).not.toBeInTheDocument();
    const chip = screen.getAllByRole('button').find((el) => el.textContent?.includes('↔'))!;
    await userEvent.click(chip);
    // comparison now rendered
    expect(screen.getByText('Definition')).toBeInTheDocument();
  });

  it('excludes the already-selected concept from the other selector', async () => {
    const a = rawConcepts[0];
    renderAt(`/compare/${a.id}`); // left chosen, right empty
    const rightInput = screen.getAllByRole('combobox')[1];
    await userEvent.click(rightInput); // focus → dropdown lists options
    const optionTexts = screen.getAllByRole('option').map((o) => o.textContent ?? '');
    expect(optionTexts.some((txt) => txt.includes(a.name))).toBe(false);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run src/features/compare/Compare.test.tsx`
Expected: FAIL — cannot import `Compare` from `./Compare` (file does not exist yet).

- [ ] **Step 4: Write the `Compare` screen**

Create `src/features/compare/Compare.tsx`:

```tsx
import { useMemo, useState } from 'react';
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
        <h2 className="text-xl font-bold tracking-tight text-bright">{c.name}</h2>
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
  concepts, exclude, placeholder, onPick,
}: {
  concepts: ConceptView[];
  exclude?: string;
  placeholder: string;
  onPick: (id: string) => void;
}) {
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
        aria-label={placeholder}
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
        <ul role="listbox" className="absolute z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-line-strong bg-surface-raised p-1.5 shadow-card-lg">
          {filtered.map((c, i) => (
            <li key={c.id}>
              <button
                type="button"
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
        <h1 className="text-3xl font-bold tracking-tight text-bright">{t('compare.title')}</h1>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <ConceptSelect
          concepts={concepts}
          exclude={right?.id}
          placeholder={left ? left.name : t('compare.selectA')}
          onPick={(id) => go(id, right?.id ?? null)}
        />
        <ConceptSelect
          concepts={concepts}
          exclude={left?.id}
          placeholder={right ? right.name : t('compare.selectB')}
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
```

- [ ] **Step 5: Run the Compare tests to verify they pass**

Run: `npx vitest run src/features/compare/Compare.test.tsx`
Expected: PASS — all 3 tests pass. (If the second test's `pairs.length` sanity assertion fails, the real content has no mutual `related` pairs — stop and report; the presets feature has no data to show.)

- [ ] **Step 6: Run the full suite and typecheck**

Run: `npx tsc --noEmit && npx vitest run`
Expected: `tsc` prints nothing (clean); all tests pass (existing count + 3 new Compare tests + 4 from Task 1); the i18n parity test passes (new keys exist in both locales).

- [ ] **Step 7: Commit**

```bash
git add src/features/compare/Compare.tsx src/features/compare/Compare.test.tsx src/i18n/messages.ts
git commit -m "feat(compare): side-by-side pattern comparison screen"
```

---

### Task 3: Wire the route, nav, icon, and command palette

**Files:**
- Modify: `src/components/Icon.tsx` (add `'compare'` to `IconName` union + `PATHS`)
- Modify: `src/app/App.tsx` (add the lazy `compare/:a?/:b?` route)
- Modify: `src/app/Layout.tsx` (add `NAV` entry + `titleKeyFor` branch)
- Modify: `src/components/CommandPalette.tsx` (add screen entry)

**Interfaces:**
- Consumes: `Compare` — `export function Compare()` from `@/features/compare/Compare` (Task 2).
- Consumes: `nav.compare` message key (Task 2).
- Produces: nothing consumed by later tasks (final task).

- [ ] **Step 1: Add the `compare` icon**

In `src/components/Icon.tsx`, add `'compare'` to the `IconName` union. Change the first union line to:

```ts
  | 'dashboard' | 'course' | 'learn' | 'review' | 'quiz' | 'library' | 'progress' | 'interview' | 'compare'
```

Then add its path to the `PATHS` object, immediately after the `interview:` entry:

```tsx
  compare: (<><rect x="4" y="4" width="7" height="16" rx="1.8" /><rect x="13" y="4" width="7" height="16" rx="1.8" /></>),
```

- [ ] **Step 2: Add the route in App.tsx**

In `src/app/App.tsx`, add this child route immediately after the `interview` route line:

```tsx
      { path: 'compare/:a?/:b?', lazy: () => import('@/features/compare/Compare').then((m) => ({ Component: m.Compare })) },
```

- [ ] **Step 3: Add the nav entry and title mapping in Layout.tsx**

In `src/app/Layout.tsx`, in the `NAV` array add this entry immediately after the `interview` line:

```tsx
  { to: '/compare', key: 'nav.compare', icon: 'compare' },
```

In the same file, in `titleKeyFor`, add this branch immediately after the `interview` branch:

```tsx
  if (pathname.startsWith('/compare')) return 'nav.compare';
```

- [ ] **Step 4: Add the command-palette entry**

In `src/components/CommandPalette.tsx`, in the `SCREENS` array add this entry immediately after the `nav.interview` line:

```tsx
  { key: 'nav.compare', to: '/compare', icon: 'compare' },
```

- [ ] **Step 5: Run typecheck, full suite, and build**

Run: `npx tsc --noEmit && npx vitest run && npm run build`
Expected: `tsc` clean; all tests pass; build completes with no errors and emits a `Compare-*.js` chunk.

- [ ] **Step 6: Manual verification (dev server)**

Run: `npm run dev`, then in the browser:
- Sidebar shows a **Compare / Сравнение** item; `⌘K` lists it; both navigate to `/compare`.
- `/compare` shows two selectors + a **"Commonly confused / Часто путают"** row of preset chips; clicking a chip renders the two-column comparison and the URL becomes `/compare/:a/:b`.
- Typing in a selector filters concepts; picking one updates the URL; the other selector no longer offers the already-picked concept.
- Deep-link `/compare/<a>/<b>` (e.g. a confusable pair) opens directly into the comparison; an invalid id (`/compare/nope/nope`) falls back to the selectors, no crash.
- Toggle language mid-comparison → both columns re-localize; toggle theme → colors adapt; narrow the window → each field's two values stack (page does not scroll horizontally; code scrolls inside its own block).

- [ ] **Step 7: Commit**

```bash
git add src/components/Icon.tsx src/app/App.tsx src/app/Layout.tsx src/components/CommandPalette.tsx
git commit -m "feat(compare): add route, sidebar nav, icon, and command-palette entry"
```

---

## Self-Review

**1. Spec coverage** (against `docs/superpowers/specs/2026-07-10-pattern-comparison-design.md`):
- §1 goal / §2 route `/compare` + deep-link `/compare/:a?/:b?` → Task 3 Step 2 (single optional-param route). ✓
- §2 empty state + two selectors + confusable presets from `related` → Task 2 Step 4 (`EmptyState`, `ConceptSelect` ×2, presets from `selectConfusablePairs`). ✓
- §2 self-compare blocked (exclude in the other selector) → Task 2 Step 4 (`exclude` prop) + Task 2 test 3. ✓
- §2 selection/preset updates URL → `go()` and preset `navigate` (Task 2 Step 4). ✓
- §2 layout: per-field sections, 2-col grid collapsing on mobile, column headers with name+grade+category+library link, code in scrollable block → Task 2 Step 4 (`rows.map`, `md:grid-cols-2`, `ColumnHeader`, `Cell` code via `CodeBlock`). ✓
- §2 invalid id → fall back to selectors → `byId.get` returns undefined ⇒ `left/right` null ⇒ selection panel (Task 2 Step 4). ✓
- §3 module boundaries: `pairs.ts` (Task 1), `Compare.tsx` (Task 2), wiring files (Task 3). ✓
- §4 no persist/store changes; language reactivity via `useConcepts()` → Task 2 (URL + `useConcepts`, no store writes). ✓
- §5 i18n keys `nav.compare` + `compare.*`; field labels reuse `concept.*` → Task 2 Step 1. ✓
- §6 a11y: combobox/listbox roles + keyboard nav, real buttons/links with focus rings, tokens only → Task 2 Step 4. ✓
- §7 tests: `selectConfusablePairs` (Task 1) + component smoke ×3 (Task 2); regression/typecheck/build → Task 2 Step 6, Task 3 Step 5. ✓
- §8 done criteria → Task 3 Steps 5–6. ✓

**2. Placeholder scan:** No TBD/TODO; every code step shows complete code; commands have expected output. ✓

**3. Type consistency:** `selectConfusablePairs(concepts: RelatedLike[]): ConceptPair[]` defined in Task 1, consumed in Task 2 (`ConceptView` satisfies `RelatedLike` via `id`+`related`). `Row` union's `get` is only accessed after narrowing on `row.kind` in `Cell`. `ConceptView.codeExample` matches `CodeBlock`'s `ResolvedCodeSample`. `Badge` `tone`/`category` values match its prop types. `GRADE_LABEL[c.grade]` / `CATEGORY_LABEL[lang][c.category]` match label maps. `IconName` gains `'compare'` (Task 3) before Layout/CommandPalette/App reference it. Route param names `:a`/`:b` match `useParams()` destructuring `{ a, b }`. Message keys added in Task 2 Step 1 (`nav.compare`, `compare.title/selectA/selectB/confusable/emptyTitle/emptyHint/openInLibrary`) match every `t(...)` call. ✓
