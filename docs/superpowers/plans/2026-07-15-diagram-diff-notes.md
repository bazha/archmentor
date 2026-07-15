# Diagram: Visual Diff + Sticky Notes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Two independent canvas deepenings for `/diagram`: (A) a visual diff — after submit, show "Your diagram" and "Reference" as two read-only React Flow canvases side by side, highlighting matches / extra / missing; (B) sticky notes — free-text annotations on the build canvas (add, inline-edit, drag, delete).

**Architecture:** Diff comparison is a pure domain function (`diffDiagrams`). Two read-only `DiffCanvas` instances render the result in the report, replacing the text reference list. Sticky notes are view-state (like positions) in `ScenarioBuilder`, rendered as a second custom node type in `CanvasBuilder`. Domain `Diagram`, validation, and the list builder are unchanged.

**Tech Stack:** React + TS + Vite, React Flow (`@xyflow/react`, already a dep, lazy), Tailwind, Vitest.

## Global Constraints

- **Diff is illustrative, not a pass/fail.** The reference is one valid solution; grading passes alternatives. Colours are neutral: **match = good**, **missing (in ref, not yours) = muted/dashed**, **extra (yours, not in ref) = info** — never red.
- **Domain stays pure & unchanged** except a new pure `diff.ts`. Positions and notes never enter the domain `Diagram`.
- **Notes are view-state** in `ScenarioBuilder`, in-memory for the session; not part of submit/validate/diff/list.
- **List builder unchanged** (keyboard-accessible core). Canvases are React Flow visual layers — not unit-tested in jsdom (needs layout/ResizeObserver), browser-verified. Note × is a real `<button>` with aria-label.
- Bilingual (ru+en parity); themes via semantic tokens + `colorMode={theme}`. No new npm dependency.
- Tests via Vitest (`npm run test`); commit after each task; NO Co-Authored-By / Claude attribution in commit messages.

---

### Task 1: Diff domain — `diffDiagrams`

**Files:**
- Create: `src/domain/diagram/diff.ts`
- Test: `src/domain/diagram/diff.test.ts`

**Interfaces:**
- Produces: `NodeDiffStatus`/`EdgeDiffStatus`, `DiagramDiff`, `diffDiagrams(user: Diagram, reference: Diagram): DiagramDiff`.

- [ ] **Step 1: Write the failing test**

Create `src/domain/diagram/diff.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { diffDiagrams } from './diff';
import { addNode, addEdge, emptyDiagram } from './edit';
import type { Diagram } from './types';

function build(types: string[], edges: [number, number][] = []): Diagram {
  let d = emptyDiagram;
  types.forEach((t, i) => { d = addNode(d, t as never, `${t}-${i}`); });
  edges.forEach(([a, b]) => { d = addEdge(d, d.nodes[a].id, d.nodes[b].id); });
  return d;
}

describe('diffDiagrams', () => {
  it('marks user nodes match (type in reference) or extra (type not in reference)', () => {
    const user = build(['api-server', 'message-queue']);
    const ref = build(['api-server']);
    const diff = diffDiagrams(user, ref);
    expect(diff.userNodes['api-server-0']).toBe('match');
    expect(diff.userNodes['message-queue-1']).toBe('extra');
  });

  it('marks reference nodes match or missing (type absent from user)', () => {
    const user = build(['api-server']);
    const ref = build(['api-server', 'cache']);
    const diff = diffDiagrams(user, ref);
    expect(diff.refNodes['api-server-0']).toBe('match');
    expect(diff.refNodes['cache-1']).toBe('missing');
  });

  it('diffs edges by component type pair (match / extra / missing)', () => {
    const user = build(['api-server', 'cache'], [[0, 1]]);       // api-server -> cache
    const ref = build(['api-server', 'sql-db'], [[0, 1]]);       // api-server -> sql-db
    const diff = diffDiagrams(user, ref);
    expect(diff.userEdges[0]).toBe('extra');   // api->cache not in ref
    expect(diff.refEdges[0]).toBe('missing');  // api->sql not in user
  });

  it('matches by TYPE, not node id (different ids, same types → match)', () => {
    const user = build(['api-server', 'cache'], [[0, 1]]);
    const ref = build(['api-server', 'cache'], [[0, 1]]);
    const diff = diffDiagrams(user, ref);
    expect(Object.values(diff.userNodes)).toEqual(['match', 'match']);
    expect(diff.userEdges).toEqual(['match']);
    expect(diff.refEdges).toEqual(['match']);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run test -- src/domain/diagram/diff.test.ts`
Expected: FAIL — `Cannot find module './diff'`.

- [ ] **Step 3: Implement**

Create `src/domain/diagram/diff.ts`:

```ts
import type { Diagram, ComponentType } from './types';

export type NodeDiffStatus = 'match' | 'extra' | 'missing';
export type EdgeDiffStatus = 'match' | 'extra' | 'missing';

export interface DiagramDiff {
  /** User nodes keyed by id: match if the type exists in the reference, else extra. */
  userNodes: Record<string, 'match' | 'extra'>;
  /** User edges (parallel to user.edges): match if the type-pair exists in the reference, else extra. */
  userEdges: ('match' | 'extra')[];
  /** Reference nodes keyed by id: match if the type exists in the user diagram, else missing. */
  refNodes: Record<string, 'match' | 'missing'>;
  /** Reference edges (parallel to reference.edges): match if the type-pair exists in the user diagram, else missing. */
  refEdges: ('match' | 'missing')[];
}

function typeOf(d: Diagram, id: string): ComponentType | undefined {
  return d.nodes.find((n) => n.id === id)?.type;
}
function hasType(d: Diagram, t: ComponentType): boolean {
  return d.nodes.some((n) => n.type === t);
}
function hasEdgeType(d: Diagram, from: ComponentType, to: ComponentType): boolean {
  return d.edges.some((e) => typeOf(d, e.from) === from && typeOf(d, e.to) === to);
}

/** Illustrative comparison of a user diagram against a reference, by component type. */
export function diffDiagrams(user: Diagram, reference: Diagram): DiagramDiff {
  const userNodes: Record<string, 'match' | 'extra'> = {};
  for (const n of user.nodes) userNodes[n.id] = hasType(reference, n.type) ? 'match' : 'extra';

  const refNodes: Record<string, 'match' | 'missing'> = {};
  for (const n of reference.nodes) refNodes[n.id] = hasType(user, n.type) ? 'match' : 'missing';

  const userEdges = user.edges.map((e): 'match' | 'extra' => {
    const ft = typeOf(user, e.from);
    const tt = typeOf(user, e.to);
    return ft && tt && hasEdgeType(reference, ft, tt) ? 'match' : 'extra';
  });

  const refEdges = reference.edges.map((e): 'match' | 'missing' => {
    const ft = typeOf(reference, e.from);
    const tt = typeOf(reference, e.to);
    return ft && tt && hasEdgeType(user, ft, tt) ? 'match' : 'missing';
  });

  return { userNodes, userEdges, refNodes, refEdges };
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npm run test -- src/domain/diagram/diff.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/domain/diagram/diff.ts src/domain/diagram/diff.test.ts
git commit -m "feat(diagram): pure diffDiagrams (user vs reference, by type)"
```

---

### Task 2: DiffCanvas + report integration + i18n

**Files:**
- Create: `src/features/diagram/DiffCanvas.tsx`
- Modify: `src/i18n/messages.ts` (diff keys, ru+en)
- Modify: `src/features/diagram/Diagram.tsx` (`ScenarioBuilder` report block: replace the reference edge-list with two `DiffCanvas` + legend)

**Interfaces:**
- Consumes: `diffDiagrams`/`NodeDiffStatus`/`EdgeDiffStatus` (Task 1); `gridSlot`/`XY`; `useComponentName`; `useStore` (theme).
- Produces: `DiffCanvas` with props `{ diagram, positions, nodeStatus, edgeStatus, colorMode }`.

- [ ] **Step 1: Add i18n keys**

In `src/i18n/messages.ts`, add to the `ru` map (near the other `diagram.*` keys):

```ts
  'diagram.comparison': 'Сравнение с образцом',
  'diagram.yourDiagram': 'Твоя схема',
  'diagram.diffMatch': 'совпало',
  'diagram.diffMissing': 'нет у тебя',
  'diagram.diffExtra': 'лишнее',
```

And the same keys in the `en` map:

```ts
  'diagram.comparison': 'Compared to the sample',
  'diagram.yourDiagram': 'Your diagram',
  'diagram.diffMatch': 'matches',
  'diagram.diffMissing': 'missing',
  'diagram.diffExtra': 'extra',
```

(The existing `diagram.reference` = "Пример решения" / "Sample solution" is reused as the reference-canvas caption.)

Run: `npx tsc --noEmit` → PASS.

- [ ] **Step 2: Implement DiffCanvas**

Create `src/features/diagram/DiffCanvas.tsx`:

```tsx
import { ReactFlow, Background, Handle, Position, type Node, type Edge, type NodeProps } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { Diagram } from '@/domain/diagram/types';
import type { XY } from '@/domain/diagram/positions';
import type { NodeDiffStatus, EdgeDiffStatus } from '@/domain/diagram/diff';
import { useComponentName } from './useComponentName';

const NODE_CLS: Record<NodeDiffStatus, string> = {
  match: 'border-good text-content',
  extra: 'border-info text-content',
  missing: 'border-dashed border-line text-muted opacity-70',
};

function DiffNode({ data }: NodeProps) {
  const d = data as { label: string; status: NodeDiffStatus };
  return (
    <div className={`rounded-lg border-2 bg-surface-raised px-3 py-1.5 text-xs font-medium ${NODE_CLS[d.status]}`}>
      <Handle type="target" position={Position.Top} className="!opacity-0" isConnectable={false} />
      {d.label}
      <Handle type="source" position={Position.Bottom} className="!opacity-0" isConnectable={false} />
    </div>
  );
}

const nodeTypes = { diff: DiffNode };

interface Props {
  diagram: Diagram;
  positions: Record<string, XY>;
  nodeStatus: Record<string, NodeDiffStatus>;
  edgeStatus: EdgeDiffStatus[];
  colorMode: 'light' | 'dark';
}

export function DiffCanvas({ diagram, positions, nodeStatus, edgeStatus, colorMode }: Props) {
  const name = useComponentName();

  const nodes: Node[] = diagram.nodes.map((nd) => ({
    id: nd.id, type: 'diff',
    position: positions[nd.id] ?? { x: 0, y: 0 },
    data: { label: name(nd.type), status: nodeStatus[nd.id] ?? 'match' },
    draggable: false, connectable: false, selectable: false,
  }));

  const edges: Edge[] = diagram.edges.map((e, i) => {
    const st = edgeStatus[i] ?? 'match';
    const style =
      st === 'missing' ? { strokeDasharray: '4 4', opacity: 0.5 }
      : st === 'extra' ? { stroke: 'rgb(var(--info))' }
      : {};
    return { id: `${e.from}->${e.to}`, source: e.from, target: e.to, style };
  });

  return (
    <div style={{ height: 300 }} className="overflow-hidden rounded-xl border border-line">
      <ReactFlow
        nodes={nodes} edges={edges} nodeTypes={nodeTypes}
        fitView colorMode={colorMode}
        nodesDraggable={false} nodesConnectable={false} elementsSelectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background />
      </ReactFlow>
    </div>
  );
}
```

- [ ] **Step 3: Wire the report block in ScenarioBuilder**

In `src/features/diagram/Diagram.tsx`:

Add imports (with the other feature/domain imports):

```ts
import { lazy } from 'react';
import { diffDiagrams } from '@/domain/diagram/diff';
```

Add a lazy import for `DiffCanvas` next to the existing `CanvasBuilder` lazy import (match the existing pattern, e.g.):

```ts
const DiffCanvas = lazy(() => import('./DiffCanvas').then((m) => ({ default: m.DiffCanvas })));
```

In `ScenarioBuilder`, add `theme` and derive the diff + reference positions (place near the other hooks/derived values, after `results` is defined):

```ts
  const theme = useStore((s) => s.settings.theme);
  const diff = useMemo(
    () => (results ? diffDiagrams(diagram, scenario.reference) : null),
    [results, diagram, scenario.reference],
  );
  const refPositions = useMemo(
    () => Object.fromEntries(scenario.reference.nodes.map((nd, i) => [nd.id, gridSlot(i)])),
    [scenario.reference],
  );
```

Replace the current reference block (the `<div className="border-t border-line pt-4">…reference edge <ul>…</div>`) inside the `{results && (…)}` section with:

```tsx
          {diff && (
            <div className="space-y-3 border-t border-line pt-4">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <h3 className="text-sm font-bold uppercase tracking-wide text-muted">{t('diagram.comparison')}</h3>
                <span className="flex items-center gap-1.5 text-xs text-muted"><span className="h-2 w-2 rounded-full bg-good" />{t('diagram.diffMatch')}</span>
                <span className="flex items-center gap-1.5 text-xs text-muted"><span className="h-2 w-2 rounded-full bg-info" />{t('diagram.diffExtra')}</span>
                <span className="flex items-center gap-1.5 text-xs text-muted"><span className="h-2 w-2 rounded-full border border-dashed border-line-strong" />{t('diagram.diffMissing')}</span>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <figure className="space-y-1.5">
                  <figcaption className="text-xs font-medium text-muted">{t('diagram.yourDiagram')}</figcaption>
                  <Suspense fallback={<div className="h-[300px] animate-pulse rounded-xl bg-surface" />}>
                    <DiffCanvas diagram={diagram} positions={positions} nodeStatus={diff.userNodes} edgeStatus={diff.userEdges} colorMode={theme} />
                  </Suspense>
                </figure>
                <figure className="space-y-1.5">
                  <figcaption className="text-xs font-medium text-muted">{t('diagram.reference')}</figcaption>
                  <Suspense fallback={<div className="h-[300px] animate-pulse rounded-xl bg-surface" />}>
                    <DiffCanvas diagram={scenario.reference} positions={refPositions} nodeStatus={diff.refNodes} edgeStatus={diff.refEdges} colorMode={theme} />
                  </Suspense>
                </figure>
              </div>
            </div>
          )}
```

The `referenceLabel` helper and the old reference `<ul>` are removed (no longer used — delete `referenceLabel` to keep tsc clean).

- [ ] **Step 4: Typecheck + full suite + build**

Run: `npx tsc --noEmit && npm run test && npm run build`
Expected: all PASS. `Diagram.test.tsx` (list smoke) unaffected — it never submits, so the diff block doesn't render. Confirm a lazy `DiffCanvas-*.js` chunk emits (separate from the main bundle).

- [ ] **Step 5: Browser-verify the diff**

Run `npm run preview`, open `/diagram/url-shortener`, build a partly-correct diagram (e.g. omit the cache, add an extra message-queue), press **Check**. Confirm the report shows two canvases: "Your diagram" (the extra node in info colour) and "Sample solution" (the missing node dashed/muted), matched nodes in good colour; legend present; light and dark legible.

- [ ] **Step 6: Commit**

```bash
git add src/features/diagram/DiffCanvas.tsx src/i18n/messages.ts src/features/diagram/Diagram.tsx
git commit -m "feat(diagram): visual diff vs reference (side-by-side canvases)"
```

---

### Task 3: Sticky notes on the build canvas

**Files:**
- Modify: `src/i18n/messages.ts` (note keys, ru+en)
- Modify: `src/features/diagram/CanvasBuilder.tsx` (`Note` type, `NoteNode`, merge note nodes, route changes)
- Modify: `src/features/diagram/Diagram.tsx` (`ScenarioBuilder`: notes state + actions, "+ Note" button, pass note props)

**Interfaces:**
- Consumes: React Flow; `useT`; `gridSlot`.
- Produces: `export interface Note { id: string; text: string; x: number; y: number }` (from `CanvasBuilder`); extended `CanvasBuilder` props `{ …, notes, onEditNote, onMoveNote, onRemoveNote }`.

- [ ] **Step 1: Add i18n keys**

In `src/i18n/messages.ts`, add to `ru`:

```ts
  'diagram.addNote': '+ Заметка',
  'diagram.removeNote': 'Удалить заметку',
  'diagram.notePlaceholder': 'Заметка…',
```

And to `en`:

```ts
  'diagram.addNote': '+ Note',
  'diagram.removeNote': 'Remove note',
  'diagram.notePlaceholder': 'Note…',
```

- [ ] **Step 2: Add Note type + NoteNode + merge into CanvasBuilder**

In `src/features/diagram/CanvasBuilder.tsx`:

Export the note shape (near the top, after imports):

```ts
export interface Note { id: string; text: string; x: number; y: number }
```

Add the `NoteNode` component (module scope, after `ComponentNode`) and register it in `nodeTypes`:

```tsx
function NoteNode({ data }: NodeProps) {
  const d = data as { text: string; placeholder: string; removeLabel: string; onEdit: (t: string) => void; onDelete: () => void };
  return (
    <div className="relative rounded-md border border-accent/30 bg-accent/10 p-2 shadow-card" style={{ width: 160 }}>
      <textarea
        value={d.text}
        onChange={(e) => d.onEdit(e.target.value)}
        placeholder={d.placeholder}
        className="nodrag h-16 w-full resize-none bg-transparent text-xs text-content outline-none placeholder:text-faint"
      />
      <button
        type="button"
        onClick={d.onDelete}
        aria-label={d.removeLabel}
        className="nodrag absolute -right-2 -top-2 grid h-4 w-4 place-items-center rounded-full border border-line bg-surface-raised text-[0.7rem] leading-none text-faint transition hover:border-bad hover:text-bad focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        ×
      </button>
    </div>
  );
}
```

Change the `nodeTypes` line to:

```ts
const nodeTypes = { component: ComponentNode, note: NoteNode };
```

Extend `Props`:

```ts
interface Props {
  diagram: Diagram;
  positions: Record<string, XY>;
  notes: Note[];
  onAdd: (type: ComponentType, at: XY) => void;
  onConnect: (from: string, to: string) => void;
  onRemoveNode: (id: string) => void;
  onDisconnect: (from: string, to: string) => void;
  onMove: (id: string, at: XY) => void;
  onEditNote: (id: string, text: string) => void;
  onMoveNote: (id: string, at: XY) => void;
  onRemoveNote: (id: string) => void;
}
```

Update the component signature to destructure the new props, and build note nodes merged into the `nodes` array. Replace the `nodes` useMemo with:

```tsx
  const nodes: Node[] = useMemo(() => {
    const componentNodes: Node[] = diagram.nodes.map((nd) => ({
      id: nd.id, type: 'component',
      position: positions[nd.id] ?? { x: 0, y: 0 },
      selected: selectedNodeIds.has(nd.id),
      data: {
        label: name(nd.type),
        removeLabel: `${t('diagram.remove')}: ${name(nd.type)}`,
        onDelete: () => onRemoveNode(nd.id),
      },
    }));
    const noteNodes: Node[] = notes.map((nt) => ({
      id: nt.id, type: 'note',
      position: { x: nt.x, y: nt.y },
      selected: selectedNodeIds.has(nt.id),
      data: {
        text: nt.text,
        placeholder: t('diagram.notePlaceholder'),
        removeLabel: t('diagram.removeNote'),
        onEdit: (text: string) => onEditNote(nt.id, text),
        onDelete: () => onRemoveNote(nt.id),
      },
    }));
    return [...componentNodes, ...noteNodes];
  }, [diagram.nodes, positions, notes, name, t, onRemoveNode, onEditNote, onRemoveNote, selectedNodeIds]);
```

Route position changes and deletion by id prefix. In `onNodesChange`, change the position branch to:

```ts
      if (c.type === 'position' && c.position) {
        if (c.id.startsWith('note-')) onMoveNote(c.id, c.position);
        else onMove(c.id, c.position);
      }
```

(Leave the `'select'` and `'remove'` branches as-is — they prune the shared `selectedNodeIds` set for both kinds.)

Update `onNodesDelete` to route by prefix:

```tsx
          onNodesDelete={(ns) => ns.forEach((n) => (n.id.startsWith('note-') ? onRemoveNote(n.id) : onRemoveNode(n.id)))}
```

Add `onMoveNote` to the `onNodesChange` `useCallback` dependency array (it references it now): `}, [onMove, onMoveNote]);`.

- [ ] **Step 3: Wire notes state in ScenarioBuilder**

In `src/features/diagram/Diagram.tsx`, import the `Note` type:

```ts
import { DND_MIME, type Note } from './CanvasBuilder';
```

In `ScenarioBuilder`, add state + actions (near `positions`):

```ts
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteCounter, setNoteCounter] = useState(0);
  const addNote = () => {
    const id = `note-${noteCounter}`;
    const off = (noteCounter % 5) * 24;
    setNotes((n) => [...n, { id, text: '', x: 40 + off, y: 40 + off }]);
    setNoteCounter((c) => c + 1);
  };
  const editNote = (id: string, text: string) => setNotes((n) => n.map((x) => (x.id === id ? { ...x, text } : x)));
  const moveNote = (id: string, at: XY) => setNotes((n) => n.map((x) => (x.id === id ? { ...x, x: at.x, y: at.y } : x)));
  const removeNote = (id: string) => setNotes((n) => n.filter((x) => x.id !== id));
```

Add `setNotes([])` to `reset`:

```ts
  const reset = () => { setDiagram(emptyDiagram); setPositions({}); setNotes([]); setResults(null); };
```

In the canvas branch, add a "+ Note" button in the palette row (after the palette map, still inside the flex-wrap div):

```tsx
              <button type="button" onClick={addNote}
                className="rounded-lg border border-dashed border-line px-3 py-2 text-sm font-medium text-muted transition hover:border-line-strong hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                {t('diagram.addNote')}
              </button>
```

And pass the note props to `<CanvasBuilder>`:

```tsx
              <CanvasBuilder
                diagram={diagram} positions={positions} notes={notes}
                onAdd={add} onConnect={connect} onRemoveNode={rmNode} onDisconnect={disconnect} onMove={move}
                onEditNote={editNote} onMoveNote={moveNote} onRemoveNote={removeNote}
              />
```

- [ ] **Step 4: Typecheck + full suite + build**

Run: `npx tsc --noEmit && npm run test && npm run build`
Expected: all PASS. `Diagram.test.tsx` list smoke unaffected. `CanvasBuilder-*.js` still a lazy chunk.

- [ ] **Step 5: Browser-verify the notes**

Run `npm run preview`, open `/diagram/url-shortener`, switch to **Canvas**. Confirm: "+ Note" adds a sticky note; typing in it edits inline (and does not drag the node); dragging the note body moves it; the × removes it; component nodes still add/drag/connect/delete as before; Reset clears notes; light and dark legible.

- [ ] **Step 6: Commit**

```bash
git add src/i18n/messages.ts src/features/diagram/CanvasBuilder.tsx src/features/diagram/Diagram.tsx
git commit -m "feat(diagram): sticky notes on the build canvas"
```

---

## Self-Review

**Spec coverage:**
- Diff domain (by type, match/extra/missing for user + reference nodes/edges) → Task 1. ✓
- Side-by-side read-only canvases replacing the text reference list; neutral colours (no red); legend → Task 2. ✓
- Diff is illustrative; per-constraint report untouched above it → Task 2 (block added below `<Report>`). ✓
- Sticky notes: add / inline-edit / drag / delete; view-state, in-memory; canvas-only; not in submit/validate → Task 3. ✓
- List builder + domain `Diagram`/validate unchanged → confirmed (only new `diff.ts` in domain; list branch untouched). ✓
- Bilingual keys; themes; lazy canvases; no new dep → Tasks 2–3. ✓
- Tests: `diffDiagrams` unit-tested; canvases browser-verified (documented) → Tasks 1–3. ✓

**Placeholder scan:** none. Canvas-not-unit-tested is explicit (matches the existing canvas precedent).

**Type consistency:** `DiagramDiff`/`NodeDiffStatus`/`EdgeDiffStatus` from Task 1 consumed by `DiffCanvas` + `diff` derivation (Task 2). `DiffCanvas` prop shape defined in Task 2, passed identically from `ScenarioBuilder`. `edgeStatus` arrays are parallel to `diagram.edges` (both produced index-parallel by `diffDiagrams` and consumed index-parallel by `DiffCanvas`). `Note` exported from `CanvasBuilder` and imported in `Diagram.tsx`; `notes`/`onEditNote`/`onMoveNote`/`onRemoveNote` prop names match between the two. Note ids use the `note-` prefix that `CanvasBuilder`'s change-routing keys on. `refPositions` built with `gridSlot` (Task 1 of the canvas-editor feature, already on branch base).
