# Diagram Canvas Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the Diagram Builder canvas into a real editor — draggable nodes (positions survive list↔canvas toggle), drag-a-component-from-palette-onto-canvas, and delete on the canvas (a visible × button on each node + the Delete key).

**Architecture:** Node positions are a view concern (validation ignores x/y), so a `positions` map is lifted to `ScenarioBuilder` and shared by both views. A minimal custom React Flow node hosts the label + × delete button + edge handles. The pure domain is unchanged except a tiny testable `gridSlot` position helper. The list builder (the keyboard-accessible core) is untouched.

**Tech Stack:** React + TS + Vite, React Flow (`@xyflow/react`, already a dep), Tailwind, Vitest.

## Global Constraints

- **Domain stays pure & position-free:** `Diagram` remains `{nodes, edges}`; x/y never enters it. Only new domain code is a pure `gridSlot`.
- **Positions live in `ScenarioBuilder`** (in-memory for the session, like the diagram itself — only scenario completion persists). They survive list↔canvas toggles.
- **List builder unchanged** — remains the fully keyboard-accessible way to add/remove/connect. The canvas is a mouse-first enhancement; its × button is a real `<button>` with an `aria-label`.
- **`nodeTypes` defined at module scope** (stable ref). Custom node is minimal (label + × + handles), **no per-type icons**.
- Themes via existing semantic tokens; `colorMode={theme}`. Bilingual (one new i18n key, ru+en).
- Tests via Vitest (`npm run test`); commit after each task; NO Co-Authored-By / Claude attribution in commit messages.

---

### Task 1: Pure position helper

**Files:**
- Create: `src/domain/diagram/positions.ts`
- Test: `src/domain/diagram/positions.test.ts`

**Interfaces:**
- Produces: `interface XY { x: number; y: number }`, `gridSlot(index: number): XY`.

- [ ] **Step 1: Write the failing test**

Create `src/domain/diagram/positions.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { gridSlot } from './positions';

describe('gridSlot', () => {
  it('is deterministic (same index -> same point)', () => {
    expect(gridSlot(3)).toEqual(gridSlot(3));
  });

  it('gives distinct points to distinct indices', () => {
    expect(gridSlot(0)).not.toEqual(gridSlot(1));
  });

  it('wraps to a new row after the column count (same x, greater y)', () => {
    expect(gridSlot(4).x).toBe(gridSlot(0).x);
    expect(gridSlot(4).y).toBeGreaterThan(gridSlot(0).y);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run test -- src/domain/diagram/positions.test.ts`
Expected: FAIL — `Cannot find module './positions'`.

- [ ] **Step 3: Implement**

Create `src/domain/diagram/positions.ts`:

```ts
export interface XY { x: number; y: number }

const COLS = 4;
const DX = 200;
const DY = 120;

/** Deterministic grid position for the index-th node (used for non-drop adds). */
export function gridSlot(index: number): XY {
  return { x: (index % COLS) * DX, y: Math.floor(index / COLS) * DY };
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npm run test -- src/domain/diagram/positions.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/domain/diagram/positions.ts src/domain/diagram/positions.test.ts
git commit -m "feat(diagram): pure gridSlot position helper"
```

---

### Task 2: Canvas editor — custom node, drag/drop/delete/move + wiring

**Files:**
- Modify: `src/i18n/messages.ts` (add `diagram.canvasHint` to `ru` and `en`)
- Rewrite: `src/features/diagram/CanvasBuilder.tsx`
- Modify: `src/features/diagram/Diagram.tsx` (`ScenarioBuilder`: positions state, `add(type, at?)`, `rmNode` drops position, `move`, draggable palette, updated `<CanvasBuilder>` props)

**Interfaces:**
- Consumes: `gridSlot`/`XY` (Task 1); `COMPONENT_TYPES`/`ComponentType`/`Diagram` (`@/domain/diagram/types`); `useComponentName`; `useT`; `useStore`.
- Produces: `DND_MIME` const + rewritten `CanvasBuilder` with props `{ diagram, positions, onAdd, onConnect, onRemoveNode, onDisconnect, onMove }`.

- [ ] **Step 1: Add the i18n key**

In `src/i18n/messages.ts`, add to the `ru` map (near the other `diagram.*` keys):

```ts
  'diagram.canvasHint': 'Перетащи компонент из палитры на канву · Del — удалить выбранное',
```

And to the `en` map:

```ts
  'diagram.canvasHint': 'Drag a component from the palette onto the canvas · Del to delete selected',
```

Run: `npx tsc --noEmit` → PASS (ru/en parity holds).

- [ ] **Step 2: Rewrite CanvasBuilder**

Replace the entire contents of `src/features/diagram/CanvasBuilder.tsx` with:

```tsx
import { useCallback, useMemo, useState } from 'react';
import {
  ReactFlow, Background, Controls, Handle, Position,
  type Node, type Edge, type Connection, type NodeChange, type NodeProps, type ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { COMPONENT_TYPES, type ComponentType, type Diagram } from '@/domain/diagram/types';
import type { XY } from '@/domain/diagram/positions';
import { useStore } from '@/store/useStore';
import { useT } from '@/i18n/useT';
import { useComponentName } from './useComponentName';

/** MIME type carrying the dragged component type from palette to canvas. */
export const DND_MIME = 'application/archmentor-node';

function ComponentNode({ data }: NodeProps) {
  const d = data as { label: string; removeLabel: string; onDelete: () => void };
  return (
    <div className="relative rounded-lg border border-line bg-surface-raised px-3 py-1.5 text-xs font-medium text-content shadow-card">
      <Handle type="target" position={Position.Top} className="!h-1.5 !w-1.5 !border-0 !bg-line-strong" />
      <span className="pr-3">{d.label}</span>
      <button
        type="button"
        onClick={d.onDelete}
        aria-label={d.removeLabel}
        className="absolute -right-2 -top-2 grid h-4 w-4 place-items-center rounded-full border border-line bg-surface-raised text-[0.7rem] leading-none text-faint transition hover:border-bad hover:text-bad focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        ×
      </button>
      <Handle type="source" position={Position.Bottom} className="!h-1.5 !w-1.5 !border-0 !bg-line-strong" />
    </div>
  );
}

const nodeTypes = { component: ComponentNode };

interface Props {
  diagram: Diagram;
  positions: Record<string, XY>;
  onAdd: (type: ComponentType, at: XY) => void;
  onConnect: (from: string, to: string) => void;
  onRemoveNode: (id: string) => void;
  onDisconnect: (from: string, to: string) => void;
  onMove: (id: string, at: XY) => void;
}

export function CanvasBuilder({ diagram, positions, onAdd, onConnect, onRemoveNode, onDisconnect, onMove }: Props) {
  const name = useComponentName();
  const t = useT();
  const theme = useStore((s) => s.settings.theme);
  const [rf, setRf] = useState<ReactFlowInstance | null>(null);

  const nodes: Node[] = useMemo(
    () => diagram.nodes.map((nd) => ({
      id: nd.id,
      type: 'component',
      position: positions[nd.id] ?? { x: 0, y: 0 },
      data: {
        label: name(nd.type),
        removeLabel: `${t('diagram.remove')}: ${name(nd.type)}`,
        onDelete: () => onRemoveNode(nd.id),
      },
    })),
    [diagram.nodes, positions, name, t, onRemoveNode],
  );

  const edges: Edge[] = useMemo(
    () => diagram.edges.map((e, i) => ({ id: `e-${i}`, source: e.from, target: e.to })),
    [diagram.edges],
  );

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    for (const c of changes) if (c.type === 'position' && c.position) onMove(c.id, c.position);
  }, [onMove]);

  const handleConnect = (c: Connection) => { if (c.source && c.target) onConnect(c.source, c.target); };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData(DND_MIME);
    if (!rf || !(COMPONENT_TYPES as readonly string[]).includes(type)) return;
    onAdd(type as ComponentType, rf.screenToFlowPosition({ x: e.clientX, y: e.clientY }));
  };

  return (
    <div>
      <div
        style={{ height: 420 }}
        className="overflow-hidden rounded-xl border border-line"
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
        onDrop={onDrop}
      >
        <ReactFlow
          nodes={nodes} edges={edges} nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onConnect={handleConnect}
          onNodesDelete={(ns) => ns.forEach((n) => onRemoveNode(n.id))}
          onEdgesDelete={(es) => es.forEach((e) => onDisconnect(e.source, e.target))}
          onInit={setRf}
          deleteKeyCode={['Delete', 'Backspace']}
          fitView colorMode={theme} proOptions={{ hideAttribution: true }}
        >
          <Background />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
      <p className="mt-2 text-xs text-faint">{t('diagram.canvasHint')}</p>
    </div>
  );
}
```

- [ ] **Step 3: Wire ScenarioBuilder (Diagram.tsx)**

In `src/features/diagram/Diagram.tsx`:

Add the import (with the other domain imports):

```ts
import { gridSlot, type XY } from '@/domain/diagram/positions';
import { DND_MIME } from './CanvasBuilder';
```

In `ScenarioBuilder`, add positions state next to the others:

```ts
  const [positions, setPositions] = useState<Record<string, XY>>({});
```

Replace the `add`, `rmNode`, and `reset` handlers with:

```ts
  const add = (type: ComponentType, at?: XY) => {
    const id = `${type}-${counter}`;
    setDiagram((d) => addNode(d, type, id));
    setPositions((p) => ({ ...p, [id]: at ?? gridSlot(counter) }));
    setCounter((c) => c + 1);
    setResults(null);
  };
  const rmNode = (id: string) => {
    setDiagram((d) => removeNode(d, id));
    setPositions((p) => { const { [id]: _drop, ...rest } = p; return rest; });
    setResults(null);
  };
  const move = (id: string, at: XY) => setPositions((p) => ({ ...p, [id]: at }));
  const reset = () => { setDiagram(emptyDiagram); setPositions({}); setResults(null); };
```

(Keep `connect`/`disconnect`/`submit` as they are. `move` is new.)

In the canvas branch, make the palette buttons draggable and update the `<CanvasBuilder>` call:

```tsx
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {scenario.palette.map((type) => (
                <button key={type} type="button" draggable
                  onDragStart={(e) => e.dataTransfer.setData(DND_MIME, type)}
                  onClick={() => add(type)}
                  className="cursor-grab rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-content transition hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent active:cursor-grabbing">
                  + {name(type)}
                </button>
              ))}
            </div>
            <Suspense fallback={<div className="h-[420px] animate-pulse rounded-xl bg-surface" />}>
              <CanvasBuilder
                diagram={diagram} positions={positions}
                onAdd={add} onConnect={connect} onRemoveNode={rmNode} onDisconnect={disconnect} onMove={move}
              />
            </Suspense>
          </div>
```

Note: the list branch still calls `<ListBuilder … onAdd={add} onRemoveNode={rmNode} …>` — `add(type)` with no position falls back to `gridSlot(counter)`, and `ListBuilder`'s `onAdd: (type) => void` signature is unaffected (the optional 2nd arg is ignored by the list).

- [ ] **Step 4: Typecheck + full suite + build**

Run: `npx tsc --noEmit && npm run test && npm run build`
Expected: all PASS. The list smoke test (`Diagram.test.tsx`) is unaffected (list is the default view). The canvas interaction is not unit-tested (React Flow needs layout/ResizeObserver jsdom lacks — same as before this change); it is browser-verified in Step 5. Confirm the build still emits the lazy `CanvasBuilder-*.js` chunk.

- [ ] **Step 5: Browser-verify the canvas editor**

Run `npm run preview`, open `/diagram/url-shortener`, switch to **Canvas**. Confirm:
- Drag a component from the palette onto the canvas → a node appears at the drop point.
- Drag an existing node → it moves; switch to **List** and back to **Canvas** → the moved position is retained.
- Draw an edge between two nodes' handles → connection appears; switch to List → the connection is listed.
- Click a node's × button → the node (and its edges) disappear; select a node/edge and press Delete → it disappears.
- Check still validates correctly after canvas edits; light and dark both legible.

- [ ] **Step 6: Commit**

```bash
git add src/i18n/messages.ts src/features/diagram/CanvasBuilder.tsx src/features/diagram/Diagram.tsx
git commit -m "feat(diagram): canvas editor — drag-from-palette, draggable nodes, delete on canvas"
```

---

## Self-Review

**Spec coverage:**
- Positions as a view concern, lifted to ScenarioBuilder, survive toggle, in-memory → Task 2 (state) + Task 1 (`gridSlot`). ✓
- Draggable nodes (`onNodesChange` position → `move`) → Task 2. ✓
- Drag-from-palette (draggable palette + `onDrop` + `screenToFlowPosition` + `onAdd(type, at)`) → Task 2. ✓
- Delete on canvas: visible × button on custom node + Delete/Backspace key → Task 2. ✓
- Minimal custom node (label + × + handles, no icons); `nodeTypes` module-level → Task 2. ✓
- Domain unchanged except pure `gridSlot` → Task 1. ✓
- List builder unchanged; remains keyboard-accessible core → Task 2 note. ✓
- Bilingual hint key; themes → Task 2. ✓
- Tests: `gridSlot` unit-tested; canvas browser-verified (documented) → Tasks 1–2. ✓

**Placeholder scan:** none. The "canvas not unit-tested / browser-verified" approach is explicit (matches the existing canvas precedent), not a vague deferral.

**Type consistency:** `XY`/`gridSlot` from Task 1 consumed in Task 2 (`positions: Record<string, XY>`, `add(type, at?: XY)`, `move(id, at: XY)`). `DND_MIME` exported from `CanvasBuilder` and imported in `Diagram.tsx` (single source, no drift). `CanvasBuilder` prop shape `{diagram, positions, onAdd, onConnect, onRemoveNode, onDisconnect, onMove}` defined in Task 2 and passed identically from `ScenarioBuilder`. `onAdd(type, at)` matches `add(type, at?)` (canvas always passes a position; list omits it). `COMPONENT_TYPES` guard narrows the dropped MIME string to a valid `ComponentType`.
