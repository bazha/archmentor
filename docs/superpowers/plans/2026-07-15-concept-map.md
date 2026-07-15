# Concept Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A new `/map` mode: an interactive React Flow graph of all 42 concepts wired by their `related` links, laid out in deterministic per-category clusters, with a click-to-select side panel that highlights neighbours and links into Learn/Library.

**Architecture:** Pure domain (`src/domain/graph/`) owns edge derivation + deterministic layout. A testable `ConceptPanel` renders the selection detail. The `Map` feature screen composes React Flow (already a dep) over that pure model. No schema/content/store changes.

**Tech Stack:** React + TS + Vite, React Flow (`@xyflow/react`, already installed, lazy on this route), Zustand (read-only for lang/theme), Tailwind, Vitest + Testing Library.

## Global Constraints

- **Domain is pure** (`src/domain/graph/`): no React/store/i18n/content imports; deterministic (no `Math.random`); layout is a pure function of concepts.
- **Edges = union of `related`** (edge if A→B OR B→A), undirected, deduped (ids sorted `a < b`), deterministic order; ignore links to unknown ids.
- **Layout = deterministic category clusters** (no new dependency).
- **No progress overlay** — node colour is by category only; the graph render does not depend on the store's SRS state.
- **Bilingual `{ru,en}`** for all new UI strings via i18n `MessageKey`s (both `ru` and `en` maps); reuse `GRADE_LABEL`/`CATEGORY_LABEL` for badges.
- **Themes** via existing semantic tokens (incl. `cat-*` for category colour); light + dark.
- **a11y:** `ConceptPanel` and its chips/links are fully keyboard-operable. The React Flow canvas is a visual layer (like the Diagram Builder canvas) — not unit-tested in jsdom, browser-verified.
- Tests via Vitest (`npm run test`); commit after each task; NO Co-Authored-By / Claude attribution in commit messages.

---

### Task 1: Domain — edges + deterministic layout

**Files:**
- Create: `src/domain/graph/edges.ts`
- Create: `src/domain/graph/layout.ts`
- Test: `src/domain/graph/edges.test.ts`
- Test: `src/domain/graph/layout.test.ts`

**Interfaces:**
- Produces:
  - `selectConceptEdges(concepts: RelatedLike[]): ConceptEdge[]` where `RelatedLike = {id, related}`, `ConceptEdge = {a, b}`
  - `CATEGORY_ORDER: Category[]`, `layoutConcepts(concepts: CategoryLike[]): Record<string, {x, y}>` where `CategoryLike = {id, category}`

- [ ] **Step 1: Write the failing edges test**

Create `src/domain/graph/edges.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { selectConceptEdges, type RelatedLike } from './edges';

const c = (id: string, related: string[]): RelatedLike => ({ id, related });

describe('selectConceptEdges', () => {
  it('creates an undirected edge from a one-directional related link', () => {
    const edges = selectConceptEdges([c('strategy', ['state']), c('state', [])]);
    expect(edges).toEqual([{ a: 'state', b: 'strategy' }]);
  });

  it('dedupes a mutual pair into a single unordered edge', () => {
    const edges = selectConceptEdges([c('a', ['b']), c('b', ['a'])]);
    expect(edges).toEqual([{ a: 'a', b: 'b' }]);
  });

  it('ignores links to unknown ids and self-links', () => {
    const edges = selectConceptEdges([c('a', ['ghost', 'a', 'b']), c('b', [])]);
    expect(edges).toEqual([{ a: 'a', b: 'b' }]);
  });

  it('is deterministic and sorted by a then b', () => {
    const edges = selectConceptEdges([
      c('b1', ['a1']), c('a1', []),
      c('a2', ['a3']), c('a3', []),
    ]);
    expect(edges).toEqual([{ a: 'a1', b: 'b1' }, { a: 'a2', b: 'a3' }]);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run test -- src/domain/graph/edges.test.ts`
Expected: FAIL — `Cannot find module './edges'`.

- [ ] **Step 3: Implement edges**

Create `src/domain/graph/edges.ts`:

```ts
export interface RelatedLike { id: string; related: string[] }
export interface ConceptEdge { a: string; b: string }

/**
 * Union of all `related` links as undirected edges: an edge exists when a
 * concept lists the other (either direction). Each unordered pair appears once
 * (ids sorted so a < b), links to unknown ids and self-links are dropped, and
 * output is sorted (deterministic).
 */
export function selectConceptEdges(concepts: RelatedLike[]): ConceptEdge[] {
  const ids = new Set(concepts.map((c) => c.id));
  const seen = new Set<string>();
  const edges: ConceptEdge[] = [];
  for (const c of concepts) {
    for (const other of c.related) {
      if (other === c.id || !ids.has(other)) continue;
      const [a, b] = c.id < other ? [c.id, other] : [other, c.id];
      const key = `${a}|${b}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({ a, b });
    }
  }
  return edges.sort((p, q) => (p.a === q.a ? p.b.localeCompare(q.b) : p.a.localeCompare(q.a)));
}
```

- [ ] **Step 4: Write the failing layout test**

Create `src/domain/graph/layout.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { layoutConcepts, CATEGORY_ORDER, type CategoryLike } from './layout';
import type { Category } from '@/content/schema';

const c = (id: string, category: Category): CategoryLike => ({ id, category });

describe('layoutConcepts', () => {
  it('gives every concept a position', () => {
    const items = [c('srp', 'solid'), c('factory', 'creational'), c('layers', 'architecture')];
    const pos = layoutConcepts(items);
    for (const it of items) {
      expect(pos[it.id]).toBeDefined();
      expect(typeof pos[it.id].x).toBe('number');
      expect(typeof pos[it.id].y).toBe('number');
    }
  });

  it('is deterministic (same input -> same output)', () => {
    const items = [c('a', 'solid'), c('b', 'solid'), c('z', 'behavioral')];
    expect(layoutConcepts(items)).toEqual(layoutConcepts(items));
  });

  it('separates categories into distinct clusters', () => {
    const solid = layoutConcepts([c('a', 'solid')])['a'];
    const beh = layoutConcepts([c('a', 'behavioral')])['a'];
    // same id, different category -> different cluster centre
    expect(solid).not.toEqual(beh);
  });

  it('exposes all six categories in a fixed order', () => {
    expect(CATEGORY_ORDER).toEqual(['solid', 'creational', 'structural', 'behavioral', 'architecture', 'tradeoff']);
  });
});
```

- [ ] **Step 5: Run it to verify it fails**

Run: `npm run test -- src/domain/graph/layout.test.ts`
Expected: FAIL — `Cannot find module './layout'`.

- [ ] **Step 6: Implement layout**

Create `src/domain/graph/layout.ts`:

```ts
import type { Category } from '@/content/schema';

export interface CategoryLike { id: string; category: Category }
export interface NodePos { x: number; y: number }

/** Fixed cluster order (mirrors CategorySchema enum order). */
export const CATEGORY_ORDER: Category[] = [
  'solid', 'creational', 'structural', 'behavioral', 'architecture', 'tradeoff',
];

const CLUSTER_RADIUS = 560; // distance of each category cluster centre from origin
const NODE_RADIUS = 160;    // base radius of concepts around their cluster centre

/**
 * Deterministic layout: each category is a cluster on a ring around the origin;
 * concepts sit on a sub-ring around their cluster centre, ordered by id. Pure —
 * no randomness, same input always yields the same positions.
 */
export function layoutConcepts(concepts: CategoryLike[]): Record<string, NodePos> {
  const centre = new Map<Category, NodePos>();
  CATEGORY_ORDER.forEach((cat, i) => {
    const ang = (2 * Math.PI * i) / CATEGORY_ORDER.length - Math.PI / 2;
    centre.set(cat, { x: Math.cos(ang) * CLUSTER_RADIUS, y: Math.sin(ang) * CLUSTER_RADIUS });
  });

  const pos: Record<string, NodePos> = {};
  for (const cat of CATEGORY_ORDER) {
    const items = concepts.filter((c) => c.category === cat).slice().sort((a, b) => a.id.localeCompare(b.id));
    const c0 = centre.get(cat)!;
    const n = items.length;
    const rr = NODE_RADIUS + Math.max(0, n - 6) * 12; // grow slightly to avoid overlap
    items.forEach((c, j) => {
      if (n === 1) { pos[c.id] = { x: c0.x, y: c0.y }; return; }
      const ang = (2 * Math.PI * j) / n - Math.PI / 2;
      pos[c.id] = { x: c0.x + Math.cos(ang) * rr, y: c0.y + Math.sin(ang) * rr };
    });
  }
  // Safety net: any concept whose category isn't in CATEGORY_ORDER lands at origin.
  for (const c of concepts) if (!(c.id in pos)) pos[c.id] = { x: 0, y: 0 };
  return pos;
}
```

- [ ] **Step 7: Run both domain tests**

Run: `npm run test -- src/domain/graph/`
Expected: PASS (all edges + layout tests).

- [ ] **Step 8: Commit**

```bash
git add src/domain/graph/
git commit -m "feat(map): pure concept-edge union + deterministic category layout"
```

---

### Task 2: i18n keys + ConceptPanel

**Files:**
- Modify: `src/i18n/messages.ts` (add `nav.map`, `map.*` to `ru` and `en`)
- Create: `src/features/map/ConceptPanel.tsx`
- Test: `src/features/map/ConceptPanel.test.tsx`

**Interfaces:**
- Consumes: `ConceptView` (`@/content/localize`), `Badge` (`@/components/Badge`), `GRADE_LABEL`/`CATEGORY_LABEL` (`@/lib/labels`), i18n keys.
- Produces: `ConceptPanel` component with props `{ concept: ConceptView | null; related: { id: string; name: string }[]; onSelect: (id: string) => void }`.

- [ ] **Step 1: Add i18n keys**

In `src/i18n/messages.ts`, add to the `ru` map (near other `nav.*`/feature groups):

```ts
  'nav.map': 'Карта',
  'map.title': 'Карта концептов',
  'map.pickHint': 'Выбери концепт на карте, чтобы увидеть его связи.',
  'map.related': 'Связанные',
  'map.openLibrary': 'В библиотеке',
```

And the identical keys in the `en` map:

```ts
  'nav.map': 'Map',
  'map.title': 'Concept map',
  'map.pickHint': 'Select a concept on the map to see its connections.',
  'map.related': 'Related',
  'map.openLibrary': 'Open in Library',
```

Run: `npx tsc --noEmit` → PASS (both maps in sync; `MessageKey` guard holds).

- [ ] **Step 2: Write the failing ConceptPanel test**

Create `src/features/map/ConceptPanel.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ConceptPanel } from './ConceptPanel';
import type { ConceptView } from '@/content/localize';
import { useStore } from '@/store/useStore';

const concept: ConceptView = {
  id: 'strategy', name: 'Strategy', category: 'behavioral', grade: 'middle',
  tagline: 'Swap algorithms at runtime', definition: 'd', problem: 'p', solution: 's',
  codeExample: { lang: 'typescript', code: 'x' },
  pros: ['a'], cons: ['a'], tradeoffs: ['a'], whenToUse: ['a'], related: ['state'],
};

beforeEach(() => useStore.getState().setSettings({ lang: 'en' }));

const renderPanel = (props: Partial<Parameters<typeof ConceptPanel>[0]> = {}) =>
  render(
    <MemoryRouter>
      <ConceptPanel concept={concept} related={[{ id: 'state', name: 'State' }]} onSelect={() => {}} {...props} />
    </MemoryRouter>,
  );

describe('ConceptPanel', () => {
  it('shows a hint when nothing is selected', () => {
    render(<MemoryRouter><ConceptPanel concept={null} related={[]} onSelect={() => {}} /></MemoryRouter>);
    expect(screen.getByText('Select a concept on the map to see its connections.')).toBeInTheDocument();
  });

  it('renders the concept name, tagline, and a Library link', () => {
    renderPanel();
    expect(screen.getByText('Strategy')).toBeInTheDocument();
    expect(screen.getByText('Swap algorithms at runtime')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Library/ })).toHaveAttribute('href', '/library/strategy');
  });

  it('calls onSelect when a related chip is clicked', async () => {
    const onSelect = vi.fn();
    renderPanel({ onSelect });
    await userEvent.click(screen.getByRole('button', { name: 'State' }));
    expect(onSelect).toHaveBeenCalledWith('state');
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npm run test -- src/features/map/ConceptPanel.test.tsx`
Expected: FAIL — `Cannot find module './ConceptPanel'`.

- [ ] **Step 4: Implement ConceptPanel**

Create `src/features/map/ConceptPanel.tsx`:

```tsx
import { Link } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { Badge } from '@/components/Badge';
import { GRADE_LABEL, CATEGORY_LABEL } from '@/lib/labels';
import { useT } from '@/i18n/useT';
import type { ConceptView } from '@/content/localize';

interface Props {
  concept: ConceptView | null;
  related: { id: string; name: string }[];
  onSelect: (id: string) => void;
}

export function ConceptPanel({ concept, related, onSelect }: Props) {
  const t = useT();
  const lang = useStore((s) => s.settings.lang);

  if (!concept) {
    return (
      <div className="rounded-2xl border border-line bg-surface-raised p-6 text-sm text-muted shadow-card">
        {t('map.pickHint')}
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-line bg-surface-raised p-6 shadow-card">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight text-bright">{concept.name}</h2>
        <div className="flex flex-wrap gap-2">
          <Badge tone="category" category={concept.category}>{CATEGORY_LABEL[lang][concept.category]}</Badge>
          <Badge tone="grade">{GRADE_LABEL[concept.grade]}</Badge>
        </div>
        <p className="text-sm text-content">{concept.tagline}</p>
      </div>

      {related.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wide text-muted">{t('map.related')}</h3>
          <div className="flex flex-wrap gap-2">
            {related.map((r) => (
              <button key={r.id} type="button" onClick={() => onSelect(r.id)}
                className="rounded-lg border border-line px-2.5 py-1 text-sm text-content transition hover:border-line-strong hover:text-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                {r.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-t border-line pt-4">
        <Link to={`/learn/${concept.id}`}
          className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-on-accent shadow-card transition hover:-translate-y-0.5 hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
          {t('nav.learn')}
        </Link>
        <Link to={`/library/${concept.id}`}
          className="rounded-xl border border-line px-4 py-2 text-sm font-semibold text-content transition hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
          {t('map.openLibrary')}
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run the panel test**

Run: `npm run test -- src/features/map/ConceptPanel.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/i18n/messages.ts src/features/map/ConceptPanel.tsx src/features/map/ConceptPanel.test.tsx
git commit -m "feat(map): i18n keys + testable ConceptPanel"
```

---

### Task 3: Map screen (React Flow) + integration

**Files:**
- Create: `src/features/map/Map.tsx`
- Modify: `src/app/App.tsx` (lazy route)
- Modify: `src/components/Icon.tsx` (add `map` icon)
- Modify: `src/app/Layout.tsx` (NAV + `titleKeyFor`)
- Modify: `src/components/CommandPalette.tsx` (SCREENS)

**Interfaces:**
- Consumes: `selectConceptEdges`, `layoutConcepts` (Task 1); `ConceptPanel` (Task 2); `useConcepts` (`@/content/localize`); React Flow; `useStore` (theme).
- Produces: exported `Map` component; route `map`.

- [ ] **Step 1: Add the `map` icon**

In `src/components/Icon.tsx`, add `'map'` to the `IconName` union and to `PATHS`:

```tsx
  map: (<><circle cx="6" cy="7" r="2" /><circle cx="18" cy="7" r="2" /><circle cx="12" cy="17" r="2" /><path d="M7.7 8.4 10.6 15M16.3 8.4 13.4 15M8 7h8" /></>),
```

- [ ] **Step 2: Implement the Map screen**

Create `src/features/map/Map.tsx`:

```tsx
import { useMemo, useState } from 'react';
import { ReactFlow, Background, Controls, Handle, Position, type Node, type Edge, type NodeProps } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useConcepts } from '@/content/localize';
import { selectConceptEdges } from '@/domain/graph/edges';
import { layoutConcepts } from '@/domain/graph/layout';
import { useStore } from '@/store/useStore';
import { useT } from '@/i18n/useT';
import type { Category } from '@/content/schema';
import { ConceptPanel } from './ConceptPanel';

const CAT_DOT: Record<Category, string> = {
  solid: 'bg-cat-solid', creational: 'bg-cat-creational', structural: 'bg-cat-structural',
  behavioral: 'bg-cat-behavioral', architecture: 'bg-cat-architecture', tradeoff: 'bg-cat-tradeoff',
};

function ConceptNode({ data }: NodeProps) {
  const d = data as { label: string; category: Category; selected: boolean; dim: boolean };
  return (
    <div className={`rounded-lg border bg-surface-raised px-3 py-1.5 text-xs font-medium shadow-card transition
      ${d.dim ? 'opacity-25' : ''}
      ${d.selected ? 'border-accent text-bright ring-2 ring-accent' : 'border-line text-content'}`}>
      <Handle type="target" position={Position.Top} className="!opacity-0" isConnectable={false} />
      <span className="flex items-center gap-1.5">
        <span className={`h-2 w-2 flex-none rounded-full ${CAT_DOT[d.category]}`} aria-hidden="true" />
        {d.label}
      </span>
      <Handle type="source" position={Position.Bottom} className="!opacity-0" isConnectable={false} />
    </div>
  );
}

const nodeTypes = { concept: ConceptNode };

export function Map() {
  const t = useT();
  const theme = useStore((s) => s.settings.theme);
  const concepts = useConcepts();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const pos = useMemo(() => layoutConcepts(concepts), [concepts]);
  const edgePairs = useMemo(() => selectConceptEdges(concepts), [concepts]);
  const neighbours = useMemo(() => {
    if (!selectedId) return null;
    const s = new Set<string>([selectedId]);
    for (const e of edgePairs) { if (e.a === selectedId) s.add(e.b); if (e.b === selectedId) s.add(e.a); }
    return s;
  }, [selectedId, edgePairs]);

  const nodes: Node[] = useMemo(() => concepts.map((c) => ({
    id: c.id, type: 'concept', position: pos[c.id] ?? { x: 0, y: 0 },
    data: { label: c.name, category: c.category, selected: c.id === selectedId, dim: neighbours ? !neighbours.has(c.id) : false },
  })), [concepts, pos, selectedId, neighbours]);

  const edges: Edge[] = useMemo(() => edgePairs.map((e, i) => {
    const incident = selectedId != null && (e.a === selectedId || e.b === selectedId);
    return {
      id: `e-${i}`, source: e.a, target: e.b,
      style: selectedId ? { opacity: incident ? 1 : 0.08, strokeWidth: incident ? 2 : 1 } : { opacity: 0.35 },
      className: incident ? 'stroke-accent' : '',
    };
  }), [edgePairs, selectedId]);

  const selected = selectedId ? concepts.find((c) => c.id === selectedId) ?? null : null;
  const related = selected
    ? selected.related.map((id) => ({ id, name: concepts.find((c) => c.id === id)?.name ?? id }))
    : [];

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-bright">{t('map.title')}</h1>
      </header>
      <div className="flex flex-col gap-5 lg:flex-row">
        <div className="h-[70vh] min-w-0 flex-1 overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
          <ReactFlow
            nodes={nodes} edges={edges} nodeTypes={nodeTypes}
            colorMode={theme} fitView minZoom={0.2}
            nodesDraggable={false} nodesConnectable={false} elementsSelectable
            onNodeClick={(_, n) => setSelectedId(n.id)}
            onPaneClick={() => setSelectedId(null)}
            proOptions={{ hideAttribution: true }}
          >
            <Background />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>
        <aside className="lg:w-80 lg:flex-none">
          <ConceptPanel concept={selected} related={related} onSelect={setSelectedId} />
        </aside>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add the lazy route**

In `src/app/App.tsx`, add after the `compare` route line:

```ts
      { path: 'map', lazy: () => import('@/features/map/Map').then((m) => ({ Component: m.Map })) },
```

- [ ] **Step 4: Add nav entry, title mapping, and command-palette entry**

In `src/app/Layout.tsx` `NAV` array (after `compare`):

```ts
  { to: '/map', key: 'nav.map', icon: 'map' },
```

In `titleKeyFor` (before the final `return 'nav.dashboard'`):

```ts
  if (pathname.startsWith('/map')) return 'nav.map';
```

In `src/components/CommandPalette.tsx` `SCREENS` (after `compare`):

```ts
  { key: 'nav.map', to: '/map', icon: 'map' },
```

- [ ] **Step 5: Verify build, typecheck, and full suite**

Run: `npx tsc --noEmit && npm run test && npm run build`
Expected: all PASS. The Map (React Flow) screen has no jsdom unit test — the canvas is browser-verified (same call the Diagram Builder canvas makes; jsdom lacks the layout/ResizeObserver React Flow needs). Coverage lives in the domain tests (Task 1) and `ConceptPanel` test (Task 2). Confirm the build emits a lazy `Map-*.js` chunk.

- [ ] **Step 6: Browser-verify the graph**

Run `npm run preview`, open `/map`. Confirm: all 42 concepts render in category clusters; edges connect related concepts (including cross-category); clicking a node highlights it + its neighbours and dims the rest, and opens the panel; clicking a related chip re-selects; Learn/Library links work; clicking empty canvas clears selection; light and dark both legible.

- [ ] **Step 7: Commit**

```bash
git add src/features/map/Map.tsx src/app/App.tsx src/components/Icon.tsx src/app/Layout.tsx src/components/CommandPalette.tsx
git commit -m "feat(map): concept relationship graph screen + sidebar/palette integration"
```

---

## Self-Review

**Spec coverage:**
- Domain edges (union `related`, undirected, deduped, deterministic) → Task 1. ✓
- Deterministic category-cluster layout, no new dep → Task 1. ✓
- ConceptPanel (name/tagline/badges/related chips/Learn+Library links, empty state), testable without React Flow → Task 2. ✓
- Map screen: React Flow, category-coloured nodes, click → select + highlight neighbours + dim others + panel, `colorMode` theme, no progress overlay → Task 3. ✓
- Integration: route, sidebar, `titleKeyFor`, ⌘K, icon → Task 3. ✓
- i18n bilingual keys → Task 2. ✓
- a11y: panel + chips keyboard-operable; canvas visual-only, browser-verified → Task 2/3. ✓
- No schema/content/store changes → confirmed (store read-only for lang/theme). ✓

**Placeholder scan:** none. Testing approach for the RF screen is explicit (no jsdom test, browser-verified — matching the Diagram Builder canvas precedent), not a vague deferral.

**Type consistency:** `selectConceptEdges`/`ConceptEdge`/`RelatedLike` and `layoutConcepts`/`CATEGORY_ORDER`/`CategoryLike` defined in Task 1, consumed with the same names in Task 3. `ConceptPanel` prop shape `{concept, related, onSelect}` defined in Task 2, used identically in Task 3. `CAT_DOT` uses static `bg-cat-*` classes (Tailwind-visible). `Badge tone="category" category=…` matches the component's signature. Route `map` + `nav.map` key consistent across App/Layout/CommandPalette/i18n.
