# Diagram Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Build the architecture" mode where the user assembles a system-design diagram for a scenario, submits it, and gets a per-constraint report against a forgiving rule set.

**Architecture:** A pure, framework-agnostic domain (`src/domain/diagram/`) owns the graph model, edit helpers, and constraint-based validation. Content (`src/content/diagram.ts`) provides the localized component palette and 3 scenarios (Zod-validated). A persisted store slice (v3→v4) records completions and feeds streak/progress. The feature screen (`src/features/diagram/`) has a keyboard-accessible **list builder as its required AA core**, with an optional React Flow canvas layered on top as a view/input adapter over the *same* `{nodes, edges}` model.

**Tech Stack:** React + TypeScript + Vite, Zustand (+persist), Zod, react-router-dom, Tailwind, Vitest + @testing-library/react, `@xyflow/react` (React Flow, added in Task 7).

## Global Constraints

- **All user-facing text is bilingual `{ ru, en }`** — content strings via `Localized` objects; UI strings via i18n `MessageKey`s added to BOTH the `ru` and `en` maps in `src/i18n/messages.ts` (the `en` map must contain every key in `ru` — `MessageKey = keyof typeof ru`).
- **Themes:** style with existing semantic Tailwind tokens only (`bg-surface`, `border-line`, `text-bright`, `text-muted`, `text-accent`, `bg-good`, `bg-bad`, etc.) so light/dark both work.
- **a11y = WCAG AA.** The list builder must be fully operable by keyboard with semantic elements and labels. The React Flow canvas is an *additional* input method, never the only one.
- **Domain is pure:** no imports from React, the store, i18n, or content inside `src/domain/diagram/`. Validation returns plain string `messageKey`s + id params; localization happens in the screen. No `Date.now()`/`Math.random()` in domain — ids are passed in.
- **Determinism:** validation is a pure function of `(diagram, constraints)`.
- **Rule design invariant:** a valid architecture that differs from the reference MUST be able to pass. Only missing required nodes / a present hard-forbidden node cause a `fail`; suboptimal wiring is a `warn`.
- **Store persistence:** bump persist `version` to `4` and extend `migrate`; existing progress must survive.
- **Tests:** `npm run test` (Vitest, `vitest run`). Commit after each task.

---

### Task 1: Diagram domain — model, edit helpers, validation

**Files:**
- Create: `src/domain/diagram/types.ts`
- Create: `src/domain/diagram/edit.ts`
- Create: `src/domain/diagram/validate.ts`
- Test: `src/domain/diagram/validate.test.ts`
- Test: `src/domain/diagram/edit.test.ts`

**Interfaces:**
- Produces:
  - `COMPONENT_TYPES: readonly ComponentType[]`, `type ComponentType`
  - `interface Diagram { nodes: {id:string;type:ComponentType}[]; edges: {from:string;to:string}[] }`
  - `type Constraint` (discriminated on `kind`), `type CheckResult { status:'ok'|'warn'|'fail'; messageKey:string; params?:Record<string,string> }`
  - `addNode/removeNode/addEdge/removeEdge(d, …): Diagram`, `emptyDiagram: Diagram`
  - `validate(d: Diagram, constraints: Constraint[]): CheckResult[]`, `isPassed(results: CheckResult[]): boolean`

- [ ] **Step 1: Create the domain types**

Create `src/domain/diagram/types.ts`:

```ts
export const COMPONENT_TYPES = [
  'client', 'load-balancer', 'api-server', 'cache', 'sql-db', 'nosql-db',
  'message-queue', 'cdn', 'object-store', 'rate-limiter',
] as const;
export type ComponentType = (typeof COMPONENT_TYPES)[number];

export interface DiagramNode { id: string; type: ComponentType }
export interface DiagramEdge { from: string; to: string } // from/to are node ids
export interface Diagram { nodes: DiagramNode[]; edges: DiagramEdge[] }

export type Status = 'ok' | 'warn' | 'fail';
export interface CheckResult {
  status: Status;
  messageKey: string;
  params?: Record<string, string>;
}

/** A required component type must be present. */
export interface RequiredNode { kind: 'required-node'; node: ComponentType }
/** At least one of `nodes` must be present (e.g. "some datastore"). */
export interface AnyOfNodes { kind: 'any-of'; nodes: ComponentType[] }
/** A component that should not appear; `warn` = discouraged, `fail` = wrong. */
export interface ForbiddenNode { kind: 'forbidden-node'; node: ComponentType; severity: 'warn' | 'fail' }
/** A directed connection between two component types should exist. */
export interface RequiredEdge { kind: 'required-edge'; from: ComponentType; to: ComponentType }
/** `middle` should sit on the path `from → middle → to`. */
export interface BetweenRelation { kind: 'between'; middle: ComponentType; from: ComponentType; to: ComponentType }
export type Constraint = RequiredNode | AnyOfNodes | ForbiddenNode | RequiredEdge | BetweenRelation;
```

- [ ] **Step 2: Write the failing edit-helper test**

Create `src/domain/diagram/edit.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { addNode, removeNode, addEdge, removeEdge, emptyDiagram } from './edit';

describe('diagram edit helpers', () => {
  it('addNode appends a typed node and ignores duplicate ids', () => {
    const d1 = addNode(emptyDiagram, 'cache', 'cache-0');
    expect(d1.nodes).toEqual([{ id: 'cache-0', type: 'cache' }]);
    const d2 = addNode(d1, 'cache', 'cache-0'); // duplicate id
    expect(d2.nodes).toHaveLength(1);
  });

  it('removeNode drops the node and any edges touching it', () => {
    let d = addNode(emptyDiagram, 'api-server', 'api-0');
    d = addNode(d, 'sql-db', 'db-0');
    d = addEdge(d, 'api-0', 'db-0');
    d = removeNode(d, 'db-0');
    expect(d.nodes).toEqual([{ id: 'api-0', type: 'api-server' }]);
    expect(d.edges).toEqual([]);
  });

  it('addEdge ignores self-loops and duplicates', () => {
    let d = addNode(emptyDiagram, 'api-server', 'api-0');
    d = addNode(d, 'cache', 'cache-0');
    d = addEdge(d, 'api-0', 'api-0'); // self loop
    expect(d.edges).toEqual([]);
    d = addEdge(d, 'api-0', 'cache-0');
    d = addEdge(d, 'api-0', 'cache-0'); // duplicate
    expect(d.edges).toHaveLength(1);
  });

  it('removeEdge removes the matching directed edge only', () => {
    let d = addNode(emptyDiagram, 'api-server', 'api-0');
    d = addNode(d, 'cache', 'cache-0');
    d = addEdge(d, 'api-0', 'cache-0');
    d = removeEdge(d, 'cache-0', 'api-0'); // wrong direction, no-op
    expect(d.edges).toHaveLength(1);
    d = removeEdge(d, 'api-0', 'cache-0');
    expect(d.edges).toEqual([]);
  });
});
```

- [ ] **Step 3: Run the edit test to verify it fails**

Run: `npm run test -- src/domain/diagram/edit.test.ts`
Expected: FAIL — `Cannot find module './edit'`.

- [ ] **Step 4: Implement the edit helpers**

Create `src/domain/diagram/edit.ts`:

```ts
import type { Diagram, ComponentType } from './types';

export const emptyDiagram: Diagram = { nodes: [], edges: [] };

export function addNode(d: Diagram, type: ComponentType, id: string): Diagram {
  if (d.nodes.some((n) => n.id === id)) return d;
  return { ...d, nodes: [...d.nodes, { id, type }] };
}

export function removeNode(d: Diagram, id: string): Diagram {
  return {
    nodes: d.nodes.filter((n) => n.id !== id),
    edges: d.edges.filter((e) => e.from !== id && e.to !== id),
  };
}

export function addEdge(d: Diagram, from: string, to: string): Diagram {
  if (from === to) return d;
  if (d.edges.some((e) => e.from === from && e.to === to)) return d;
  return { ...d, edges: [...d.edges, { from, to }] };
}

export function removeEdge(d: Diagram, from: string, to: string): Diagram {
  return { ...d, edges: d.edges.filter((e) => !(e.from === from && e.to === to)) };
}
```

- [ ] **Step 5: Run the edit test to verify it passes**

Run: `npm run test -- src/domain/diagram/edit.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Write the failing validation test**

Create `src/domain/diagram/validate.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { validate, isPassed } from './validate';
import { addNode, addEdge, emptyDiagram } from './edit';
import type { Constraint, Diagram } from './types';

// Helper: build a diagram from (type) nodes with auto ids, then wire edges by node index.
function build(types: string[], edges: [number, number][] = []): Diagram {
  let d = emptyDiagram;
  types.forEach((t, i) => { d = addNode(d, t as never, `${t}-${i}`); });
  edges.forEach(([a, b]) => { d = addEdge(d, d.nodes[a].id, d.nodes[b].id); });
  return d;
}

describe('validate', () => {
  it('required-node → ok when present, fail when missing', () => {
    const c: Constraint[] = [{ kind: 'required-node', node: 'cache' }];
    expect(validate(build(['cache']), c)[0].status).toBe('ok');
    expect(validate(build(['api-server']), c)[0].status).toBe('fail');
  });

  it('any-of → ok when at least one present, fail when none', () => {
    const c: Constraint[] = [{ kind: 'any-of', nodes: ['sql-db', 'nosql-db'] }];
    expect(validate(build(['nosql-db']), c)[0].status).toBe('ok');
    expect(validate(build(['sql-db']), c)[0].status).toBe('ok');
    expect(validate(build(['api-server']), c)[0].status).toBe('fail');
  });

  it('forbidden-node → severity when present, ok when absent', () => {
    const warn: Constraint[] = [{ kind: 'forbidden-node', node: 'message-queue', severity: 'warn' }];
    expect(validate(build(['message-queue']), warn)[0].status).toBe('warn');
    expect(validate(build(['api-server']), warn)[0].status).toBe('ok');
    const fail: Constraint[] = [{ kind: 'forbidden-node', node: 'message-queue', severity: 'fail' }];
    expect(validate(build(['message-queue']), fail)[0].status).toBe('fail');
  });

  it('required-edge → ok when a matching typed edge exists, warn otherwise', () => {
    const c: Constraint[] = [{ kind: 'required-edge', from: 'api-server', to: 'cache' }];
    expect(validate(build(['api-server', 'cache'], [[0, 1]]), c)[0].status).toBe('ok');
    expect(validate(build(['api-server', 'cache']), c)[0].status).toBe('warn'); // nodes present, no edge
    expect(validate(build(['api-server', 'cache'], [[1, 0]]), c)[0].status).toBe('warn'); // wrong direction
  });

  it('between → ok when from→middle and middle→to both exist, warn otherwise', () => {
    const c: Constraint[] = [{ kind: 'between', middle: 'rate-limiter', from: 'client', to: 'api-server' }];
    const ok = build(['client', 'rate-limiter', 'api-server'], [[0, 1], [1, 2]]);
    expect(validate(ok, c)[0].status).toBe('ok');
    const direct = build(['client', 'rate-limiter', 'api-server'], [[0, 2]]); // bypasses limiter
    expect(validate(direct, c)[0].status).toBe('warn');
  });

  it('isPassed is true when there are no fails (warns allowed)', () => {
    const results = validate(build(['api-server', 'cache']), [
      { kind: 'required-node', node: 'api-server' },
      { kind: 'required-edge', from: 'api-server', to: 'cache' }, // warn (no edge)
    ]);
    expect(results.map((r) => r.status)).toEqual(['ok', 'warn']);
    expect(isPassed(results)).toBe(true);
  });

  it('isPassed is false when a required node is missing', () => {
    const results = validate(build(['cache']), [{ kind: 'required-node', node: 'api-server' }]);
    expect(isPassed(results)).toBe(false);
  });
});
```

- [ ] **Step 7: Run the validation test to verify it fails**

Run: `npm run test -- src/domain/diagram/validate.test.ts`
Expected: FAIL — `Cannot find module './validate'`.

- [ ] **Step 8: Implement validation**

Create `src/domain/diagram/validate.ts`:

```ts
import type { Diagram, Constraint, CheckResult, ComponentType } from './types';

function typeOf(d: Diagram, id: string): ComponentType | undefined {
  return d.nodes.find((n) => n.id === id)?.type;
}
function hasType(d: Diagram, t: ComponentType): boolean {
  return d.nodes.some((n) => n.type === t);
}
function hasEdgeType(d: Diagram, from: ComponentType, to: ComponentType): boolean {
  return d.edges.some((e) => typeOf(d, e.from) === from && typeOf(d, e.to) === to);
}

export function checkOne(d: Diagram, c: Constraint): CheckResult {
  switch (c.kind) {
    case 'required-node':
      return hasType(d, c.node)
        ? { status: 'ok', messageKey: 'diagram.check.required', params: { node: c.node } }
        : { status: 'fail', messageKey: 'diagram.check.missing', params: { node: c.node } };
    case 'any-of': {
      const present = c.nodes.some((t) => hasType(d, t));
      return present
        ? { status: 'ok', messageKey: 'diagram.check.anyOf', params: { nodes: c.nodes.join(',') } }
        : { status: 'fail', messageKey: 'diagram.check.missingAnyOf', params: { nodes: c.nodes.join(',') } };
    }
    case 'forbidden-node':
      if (!hasType(d, c.node)) {
        return { status: 'ok', messageKey: 'diagram.check.noForbidden', params: { node: c.node } };
      }
      return c.severity === 'fail'
        ? { status: 'fail', messageKey: 'diagram.check.forbidden', params: { node: c.node } }
        : { status: 'warn', messageKey: 'diagram.check.discouraged', params: { node: c.node } };
    case 'required-edge':
      return hasEdgeType(d, c.from, c.to)
        ? { status: 'ok', messageKey: 'diagram.check.edge', params: { from: c.from, to: c.to } }
        : { status: 'warn', messageKey: 'diagram.check.missingEdge', params: { from: c.from, to: c.to } };
    case 'between':
      return hasEdgeType(d, c.from, c.middle) && hasEdgeType(d, c.middle, c.to)
        ? { status: 'ok', messageKey: 'diagram.check.between', params: { middle: c.middle, from: c.from, to: c.to } }
        : { status: 'warn', messageKey: 'diagram.check.missingBetween', params: { middle: c.middle, from: c.from, to: c.to } };
  }
}

export function validate(d: Diagram, constraints: Constraint[]): CheckResult[] {
  return constraints.map((c) => checkOne(d, c));
}

/** A diagram passes when no constraint fails. Warnings are allowed (valid alternatives). */
export function isPassed(results: CheckResult[]): boolean {
  return results.every((r) => r.status !== 'fail');
}
```

- [ ] **Step 9: Run both domain tests to verify they pass**

Run: `npm run test -- src/domain/diagram/`
Expected: PASS (all edit + validate tests).

- [ ] **Step 10: Commit**

```bash
git add src/domain/diagram/
git commit -m "feat(diagram): pure graph model, edit helpers, constraint validation"
```

---

### Task 2: i18n keys for the diagram feature

**Files:**
- Modify: `src/i18n/messages.ts` (add keys to the `ru` map ~line 96 area and the mirrored `en` map ~line 240 area)

**Interfaces:**
- Produces: new `MessageKey`s used by content-agnostic screens and the report: `nav.diagram`, `diagram.*`, `diagram.check.*`, `dashboard.diagram*`, `progress.diagram`.

- [ ] **Step 1: Add the Russian keys**

In `src/i18n/messages.ts`, inside the `const ru = { … }` object (add near the other `nav.*`/feature groups, before the closing `}`), add:

```ts
  'nav.diagram': 'Схемы',
  'diagram.title': 'Собери архитектуру',
  'diagram.pickScenario': 'Выбери задачу',
  'diagram.components': 'Компоненты',
  'diagram.connections': 'Связи',
  'diagram.addComponent': 'Добавить компонент',
  'diagram.addConnection': 'Добавить связь',
  'diagram.from': 'Откуда',
  'diagram.to': 'Куда',
  'diagram.noComponents': 'Пока пусто — добавь компоненты из списка выше.',
  'diagram.noConnections': 'Связей пока нет.',
  'diagram.remove': 'Убрать',
  'diagram.check': 'Проверить',
  'diagram.reset': 'Сбросить',
  'diagram.report': 'Разбор',
  'diagram.reference': 'Пример решения',
  'diagram.passed': 'Схема принята',
  'diagram.hasIssues': 'Есть замечания',
  'diagram.viewList': 'Список',
  'diagram.viewCanvas': 'Канва',
  'diagram.done': 'Пройдено',
  'diagram.emptyTitle': 'Нет задач',
  'diagram.emptyHint': 'Сценарии ещё не добавлены.',
  'diagram.check.required': 'Есть {node} — верно',
  'diagram.check.missing': 'Не хватает: {node}',
  'diagram.check.anyOf': 'Есть хранилище ({nodes}) — верно',
  'diagram.check.missingAnyOf': 'Нужно хранилище: {nodes}',
  'diagram.check.forbidden': 'Лишний компонент: {node}',
  'diagram.check.discouraged': '{node} здесь обычно избыточен',
  'diagram.check.noForbidden': 'Правильно без {node}',
  'diagram.check.edge': 'Есть связь {from} → {to}',
  'diagram.check.missingEdge': 'Нет связи {from} → {to}',
  'diagram.check.between': '{middle} стоит между {from} и {to} — верно',
  'diagram.check.missingBetween': '{middle} должен стоять между {from} и {to}',
  'dashboard.diagramTitle': 'Собери архитектуру',
  'dashboard.diagramCta': 'Спроектировать систему →',
  'dashboard.diagramDone': 'Пройдено {done}/{total}',
  'progress.diagram': 'Схем собрано',
```

- [ ] **Step 2: Add the mirrored English keys**

In the `const en = { … }` object, add the exact same keys with English values:

```ts
  'nav.diagram': 'Diagrams',
  'diagram.title': 'Build the architecture',
  'diagram.pickScenario': 'Pick a task',
  'diagram.components': 'Components',
  'diagram.connections': 'Connections',
  'diagram.addComponent': 'Add component',
  'diagram.addConnection': 'Add connection',
  'diagram.from': 'From',
  'diagram.to': 'To',
  'diagram.noComponents': 'Empty so far — add components from the list above.',
  'diagram.noConnections': 'No connections yet.',
  'diagram.remove': 'Remove',
  'diagram.check': 'Check',
  'diagram.reset': 'Reset',
  'diagram.report': 'Report',
  'diagram.reference': 'Sample solution',
  'diagram.passed': 'Diagram accepted',
  'diagram.hasIssues': 'Some notes',
  'diagram.viewList': 'List',
  'diagram.viewCanvas': 'Canvas',
  'diagram.done': 'Completed',
  'diagram.emptyTitle': 'No tasks',
  'diagram.emptyHint': 'No scenarios added yet.',
  'diagram.check.required': '{node} is present — correct',
  'diagram.check.missing': 'Missing: {node}',
  'diagram.check.anyOf': 'A datastore is present ({nodes}) — correct',
  'diagram.check.missingAnyOf': 'A datastore is needed: {nodes}',
  'diagram.check.forbidden': 'Unneeded component: {node}',
  'diagram.check.discouraged': '{node} is usually overkill here',
  'diagram.check.noForbidden': 'Correctly no {node}',
  'diagram.check.edge': 'Connection {from} → {to} exists',
  'diagram.check.missingEdge': 'No connection {from} → {to}',
  'diagram.check.between': '{middle} sits between {from} and {to} — correct',
  'diagram.check.missingBetween': '{middle} should sit between {from} and {to}',
  'dashboard.diagramTitle': 'Build the architecture',
  'dashboard.diagramCta': 'Design a system →',
  'dashboard.diagramDone': 'Completed {done}/{total}',
  'progress.diagram': 'Diagrams built',
```

- [ ] **Step 3: Verify types compile (both maps in sync)**

Run: `npx tsc --noEmit`
Expected: PASS. (If a key exists in `ru` but not `en`, `MessageKey = keyof typeof ru` forces `messages: Record<Lang, Record<MessageKey, string>>` to error — that's the guard.)

- [ ] **Step 4: Commit**

```bash
git add src/i18n/messages.ts
git commit -m "feat(diagram): bilingual UI + per-constraint feedback strings"
```

---

### Task 3: Content — component palette + 3 scenarios (Zod-validated)

**Files:**
- Create: `src/content/diagram.ts`
- Test: `src/content/diagram.test.ts`
- Modify: `src/content/index.ts` (call `validateScenarios` in the DEV guard)

**Interfaces:**
- Consumes (Task 1): `COMPONENT_TYPES`, `ComponentType`, `Constraint`, `Diagram`.
- Produces:
  - `componentNames: Record<ComponentType, Localized>`
  - `interface Scenario { id; title: Localized; brief: Localized; palette: ComponentType[]; constraints: Constraint[]; reference: Diagram }`
  - `scenarios: Scenario[]` (3 items: `url-shortener`, `news-feed`, `rate-limiter`)
  - `validateScenarios(list: Scenario[]): void`

- [ ] **Step 1: Write the failing content test**

Create `src/content/diagram.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { scenarios, componentNames, validateScenarios } from './diagram';
import { COMPONENT_TYPES } from '@/domain/diagram/types';
import { validate, isPassed } from '@/domain/diagram/validate';

describe('diagram content', () => {
  it('has at least 3 scenarios and passes Zod + cross-ref validation', () => {
    expect(scenarios.length).toBeGreaterThanOrEqual(3);
    expect(() => validateScenarios(scenarios)).not.toThrow();
  });

  it('every component type has a bilingual name', () => {
    for (const t of COMPONENT_TYPES) {
      expect(componentNames[t].ru.length).toBeGreaterThan(0);
      expect(componentNames[t].en.length).toBeGreaterThan(0);
    }
  });

  it('every scenario reference passes its own constraints (rules are not over-rigid)', () => {
    for (const sc of scenarios) {
      expect(isPassed(validate(sc.reference, sc.constraints))).toBe(true);
    }
  });

  it('a valid alternative (NoSQL instead of SQL) still passes url-shortener', () => {
    const sc = scenarios.find((s) => s.id === 'url-shortener')!;
    // Swap the sql-db node type to nosql-db, keep everything else.
    const alt = {
      nodes: sc.reference.nodes.map((n) => (n.type === 'sql-db' ? { ...n, type: 'nosql-db' as const } : n)),
      edges: sc.reference.edges,
    };
    expect(isPassed(validate(alt, sc.constraints))).toBe(true);
  });
});
```

- [ ] **Step 2: Run the content test to verify it fails**

Run: `npm run test -- src/content/diagram.test.ts`
Expected: FAIL — `Cannot find module './diagram'`.

- [ ] **Step 3: Implement the content module**

Create `src/content/diagram.ts`:

```ts
import { z } from 'zod';
import { LocalizedSchema, type Localized } from './schema';
import { COMPONENT_TYPES, type ComponentType, type Constraint, type Diagram } from '@/domain/diagram/types';

const ComponentTypeSchema = z.enum(COMPONENT_TYPES);

const ConstraintSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('required-node'), node: ComponentTypeSchema }),
  z.object({ kind: z.literal('any-of'), nodes: z.array(ComponentTypeSchema).min(2) }),
  z.object({ kind: z.literal('forbidden-node'), node: ComponentTypeSchema, severity: z.enum(['warn', 'fail']) }),
  z.object({ kind: z.literal('required-edge'), from: ComponentTypeSchema, to: ComponentTypeSchema }),
  z.object({ kind: z.literal('between'), middle: ComponentTypeSchema, from: ComponentTypeSchema, to: ComponentTypeSchema }),
]);

const DiagramNodeSchema = z.object({ id: z.string().min(1), type: ComponentTypeSchema });
const DiagramEdgeSchema = z.object({ from: z.string().min(1), to: z.string().min(1) });
const DiagramSchema = z.object({ nodes: z.array(DiagramNodeSchema), edges: z.array(DiagramEdgeSchema) });

export const ScenarioSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: LocalizedSchema,
  brief: LocalizedSchema,
  palette: z.array(ComponentTypeSchema).min(1),
  constraints: z.array(ConstraintSchema).min(1),
  reference: DiagramSchema,
});
export type Scenario = z.infer<typeof ScenarioSchema>;

export const componentNames: Record<ComponentType, Localized> = {
  'client': { ru: 'Клиент', en: 'Client' },
  'load-balancer': { ru: 'Балансировщик', en: 'Load balancer' },
  'api-server': { ru: 'API-сервер', en: 'API server' },
  'cache': { ru: 'Кэш (Redis)', en: 'Cache (Redis)' },
  'sql-db': { ru: 'SQL БД', en: 'SQL DB' },
  'nosql-db': { ru: 'NoSQL БД', en: 'NoSQL DB' },
  'message-queue': { ru: 'Очередь сообщений', en: 'Message queue' },
  'cdn': { ru: 'CDN', en: 'CDN' },
  'object-store': { ru: 'Объектное хранилище', en: 'Object store' },
  'rate-limiter': { ru: 'Rate limiter', en: 'Rate limiter' },
};

// Node-id convention in references: `${type}` (one instance per type is enough for grading).
const n = (type: ComponentType) => ({ id: type, type });

export const scenarios: Scenario[] = [
  {
    id: 'url-shortener',
    title: { ru: 'Сокращатель ссылок', en: 'URL shortener' },
    brief: {
      ru: 'Спроектируй сервис коротких ссылок (bit.ly). ~100M редиректов/день, чтение >> запись, латентность < 50 мс.',
      en: 'Design a URL shortener (bit.ly). ~100M redirects/day, read-heavy, latency < 50ms.',
    },
    palette: ['client', 'load-balancer', 'api-server', 'cache', 'sql-db', 'nosql-db', 'cdn', 'message-queue'],
    constraints: [
      { kind: 'required-node', node: 'client' },
      { kind: 'required-node', node: 'api-server' },
      { kind: 'required-node', node: 'cache' },
      { kind: 'any-of', nodes: ['sql-db', 'nosql-db'] },
      { kind: 'required-edge', from: 'api-server', to: 'cache' },
      { kind: 'forbidden-node', node: 'message-queue', severity: 'warn' },
    ],
    reference: {
      nodes: [n('client'), n('load-balancer'), n('api-server'), n('cache'), n('sql-db')],
      edges: [
        { from: 'client', to: 'load-balancer' },
        { from: 'load-balancer', to: 'api-server' },
        { from: 'api-server', to: 'cache' },
        { from: 'api-server', to: 'sql-db' },
      ],
    },
  },
  {
    id: 'news-feed',
    title: { ru: 'Лента новостей', en: 'News feed' },
    brief: {
      ru: 'Спроектируй ленту постов с медиа. Много чтений, нужна доставка картинок и низкая латентность.',
      en: 'Design a post feed with media. Read-heavy, needs image delivery and low latency.',
    },
    palette: ['client', 'load-balancer', 'api-server', 'cache', 'sql-db', 'nosql-db', 'cdn', 'object-store', 'message-queue'],
    constraints: [
      { kind: 'required-node', node: 'client' },
      { kind: 'required-node', node: 'api-server' },
      { kind: 'required-node', node: 'cache' },
      { kind: 'required-node', node: 'cdn' },
      { kind: 'any-of', nodes: ['sql-db', 'nosql-db'] },
      { kind: 'required-edge', from: 'api-server', to: 'cache' },
    ],
    reference: {
      nodes: [n('client'), n('load-balancer'), n('api-server'), n('cache'), n('nosql-db'), n('cdn'), n('object-store')],
      edges: [
        { from: 'client', to: 'load-balancer' },
        { from: 'load-balancer', to: 'api-server' },
        { from: 'api-server', to: 'cache' },
        { from: 'api-server', to: 'nosql-db' },
        { from: 'client', to: 'cdn' },
        { from: 'cdn', to: 'object-store' },
      ],
    },
  },
  {
    id: 'rate-limiter',
    title: { ru: 'Rate limiter', en: 'Rate limiter' },
    brief: {
      ru: 'Спроектируй ограничитель запросов перед API. Лимит на пользователя, счётчики должны переживать рестарт инстанса.',
      en: 'Design request rate limiting in front of the API. Per-user limits; counters must survive an instance restart.',
    },
    palette: ['client', 'load-balancer', 'rate-limiter', 'api-server', 'cache', 'sql-db'],
    constraints: [
      { kind: 'required-node', node: 'client' },
      { kind: 'required-node', node: 'rate-limiter' },
      { kind: 'required-node', node: 'api-server' },
      { kind: 'required-node', node: 'cache' },
      { kind: 'between', middle: 'rate-limiter', from: 'client', to: 'api-server' },
      { kind: 'required-edge', from: 'rate-limiter', to: 'cache' },
    ],
    reference: {
      nodes: [n('client'), n('rate-limiter'), n('api-server'), n('cache'), n('sql-db')],
      edges: [
        { from: 'client', to: 'rate-limiter' },
        { from: 'rate-limiter', to: 'api-server' },
        { from: 'rate-limiter', to: 'cache' },
        { from: 'api-server', to: 'sql-db' },
      ],
    },
  },
];

export function validateScenarios(list: Scenario[]): void {
  const seen = new Set<string>();
  list.forEach((sc) => {
    ScenarioSchema.parse(sc);
    if (seen.has(sc.id)) throw new Error(`Duplicate scenario id: ${sc.id}`);
    seen.add(sc.id);
    const inPalette = new Set<ComponentType>(sc.palette);
    sc.reference.nodes.forEach((node) => {
      if (!inPalette.has(node.type)) throw new Error(`Scenario ${sc.id}: reference node type ${node.type} not in palette`);
    });
    const refIds = new Set(sc.reference.nodes.map((node) => node.id));
    sc.reference.edges.forEach((e) => {
      if (!refIds.has(e.from) || !refIds.has(e.to)) throw new Error(`Scenario ${sc.id}: reference edge ${e.from}->${e.to} references unknown node id`);
    });
    for (const c of sc.constraints) {
      const types: ComponentType[] =
        c.kind === 'between' ? [c.middle, c.from, c.to]
        : c.kind === 'required-edge' ? [c.from, c.to]
        : c.kind === 'any-of' ? c.nodes
        : [c.node];
      for (const t of types) {
        if (!inPalette.has(t)) throw new Error(`Scenario ${sc.id}: constraint type ${t} not in palette`);
      }
    }
  });
}
```

- [ ] **Step 4: Run the content test to verify it passes**

Run: `npm run test -- src/content/diagram.test.ts`
Expected: PASS (4 tests). If the "reference passes its own constraints" test fails, the rules are over-rigid — fix the constraints, not the test.

- [ ] **Step 5: Wire the DEV validation guard**

In `src/content/index.ts`, add the import and extend the DEV guard:

```ts
import { scenarios, validateScenarios } from './diagram';
```

Change the existing line:

```ts
if (import.meta.env?.DEV) validateContent(concepts, questions);
```

to:

```ts
if (import.meta.env?.DEV) {
  validateContent(concepts, questions);
  validateScenarios(scenarios);
}
```

- [ ] **Step 6: Run the full suite to confirm nothing broke**

Run: `npm run test`
Expected: PASS (all existing + new tests).

- [ ] **Step 7: Commit**

```bash
git add src/content/diagram.ts src/content/diagram.test.ts src/content/index.ts
git commit -m "feat(diagram): component palette + 3 scenarios with Zod validation"
```

---

### Task 4: Store slice — completions, selectors, v3→v4 migration

**Files:**
- Modify: `src/store/useStore.ts`
- Test: `src/store/useStore.test.ts` (add cases)

**Interfaces:**
- Produces:
  - `interface DiagramState { completed: Record<string, { at: string; passed: boolean }> }` on `AppState.diagram`
  - action `completeScenario(id: string, passed: boolean, today: string): void`
  - `isScenarioDone(state: AppState, id: string): boolean`
  - `selectDiagramProgress(state: AppState, scenarioIds: string[]): { done: number; total: number; pct: number }`
  - persist `version: 4`

- [ ] **Step 1: Write the failing store tests**

In `src/store/useStore.test.ts`, add these imports to the top import from `./useStore`: `isScenarioDone`, `selectDiagramProgress`. Then add this block inside the file (e.g. after the daily tests):

```ts
describe('diagram slice', () => {
  it('completeScenario records result and advances the streak', () => {
    useStore.getState().completeScenario('url-shortener', true, '2026-07-15');
    const s = useStore.getState();
    expect(s.diagram.completed['url-shortener']).toEqual({ at: '2026-07-15', passed: true });
    expect(isScenarioDone(s, 'url-shortener')).toBe(true);
    expect(isScenarioDone(s, 'news-feed')).toBe(false);
    expect(s.streak.current).toBe(1);
  });

  it('a later attempt overwrites the stored result', () => {
    const g = useStore.getState;
    g().completeScenario('news-feed', false, '2026-07-15');
    g().completeScenario('news-feed', true, '2026-07-15');
    expect(g().diagram.completed['news-feed'].passed).toBe(true);
  });

  it('selectDiagramProgress counts completed of total', () => {
    const g = useStore.getState;
    g().completeScenario('url-shortener', true, '2026-07-15');
    g().completeScenario('news-feed', false, '2026-07-15');
    const p = selectDiagramProgress(g(), ['url-shortener', 'news-feed', 'rate-limiter']);
    expect(p).toEqual({ done: 2, total: 3, pct: 67 });
  });
});
```

- [ ] **Step 2: Run the store test to verify it fails**

Run: `npm run test -- src/store/useStore.test.ts`
Expected: FAIL — `completeScenario`/`diagram` not on the store; `isScenarioDone`/`selectDiagramProgress` not exported.

- [ ] **Step 3: Add the state shape**

In `src/store/useStore.ts`:

Add the interface near the other slice interfaces (after `DailyState`):

```ts
export interface DiagramState { completed: Record<string, { at: string; passed: boolean }> }
```

Add `diagram: DiagramState;` to the `AppState` interface (with the other data fields), and add the action signature to `AppState`:

```ts
  completeScenario: (id: string, passed: boolean, today: string) => void;
```

Add `'diagram'` to the `PersistedState` `Pick<…>` union.

Add `diagram: { completed: {} },` to the object returned by `initialData()`.

- [ ] **Step 4: Add the action**

In the store creator (next to `completeDaily`), add:

```ts
      completeScenario: (id, passed, today) =>
        set((s) => ({
          diagram: { completed: { ...s.diagram.completed, [id]: { at: today, passed } } },
          streak: bumpStreak(s.streak, today),
        })),
```

- [ ] **Step 5: Update persist config (version + partialize)**

Change `version: 3,` to `version: 4,`.

In `partialize`, add `diagram: s.diagram,` to the returned object.

Update the `migrate` function’s range and its doc comment:

```ts
/**
 * Version migration hook. v1→v2 added `interviews`; v2→v3 added `daily`; v3→v4 added `diagram`.
 * All known shapes are accepted as-is — missing slices are backfilled from defaults by `merge`,
 * so existing progress is preserved. Unknown shapes reset safely.
 */
export function migrate(persisted: unknown, version: number): PersistedState {
  if (version >= 1 && version <= 4 && persisted && typeof persisted === 'object') return persisted as PersistedState;
  return initialData();
}
```

Note: `merge` already spreads persisted over current, so a v3 blob (no `diagram`) keeps the `diagram: { completed: {} }` default from `current`. No extra merge code needed.

- [ ] **Step 6: Add the selectors**

At the bottom of `useStore.ts`, with the other selectors, add:

```ts
export function isScenarioDone(state: AppState, id: string): boolean {
  return state.diagram.completed[id] != null;
}

export function selectDiagramProgress(
  state: AppState, scenarioIds: string[],
): { done: number; total: number; pct: number } {
  const total = scenarioIds.length;
  const done = scenarioIds.filter((id) => state.diagram.completed[id] != null).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return { done, total, pct };
}
```

- [ ] **Step 7: Run the store test to verify it passes**

Run: `npm run test -- src/store/useStore.test.ts`
Expected: PASS (existing + 3 new).

- [ ] **Step 8: Commit**

```bash
git add src/store/useStore.ts src/store/useStore.test.ts
git commit -m "feat(diagram): persisted completion slice (v4) + progress selectors"
```

---

### Task 5: List builder screen (AA core) + route

**Files:**
- Create: `src/features/diagram/useComponentName.ts`
- Create: `src/features/diagram/Report.tsx`
- Create: `src/features/diagram/ListBuilder.tsx`
- Create: `src/features/diagram/Diagram.tsx`
- Create: `src/features/diagram/Diagram.test.tsx`
- Modify: `src/app/App.tsx` (add the lazy route)

**Interfaces:**
- Consumes: `scenarios`, `componentNames`, `Scenario` (Task 3); `validate`, `isPassed` (Task 1); `addNode/removeNode/addEdge/removeEdge/emptyDiagram` (Task 1); `useStore`, `completeScenario`, `isScenarioDone` (Task 4); i18n keys (Task 2).
- Produces: exported `Diagram` component (route element); route path `diagram` and `diagram/:scenarioId?`.

- [ ] **Step 1: Create the component-name hook**

Create `src/features/diagram/useComponentName.ts`:

```ts
import { useStore } from '@/store/useStore';
import { componentNames } from '@/content/diagram';
import type { ComponentType } from '@/domain/diagram/types';

/** Returns a localizer that maps a component type id to its display name. */
export function useComponentName() {
  const lang = useStore((s) => s.settings.lang);
  return (type: ComponentType) => componentNames[type][lang];
}
```

- [ ] **Step 2: Create the report component**

Create `src/features/diagram/Report.tsx`:

```tsx
import { Icon } from '@/components/Icon';
import { useT } from '@/i18n/useT';
import type { MessageKey } from '@/i18n/messages';
import type { CheckResult, ComponentType } from '@/domain/diagram/types';
import { useComponentName } from './useComponentName';

const STATUS_ICON = { ok: 'check', warn: 'bolt', fail: 'close' } as const;
const STATUS_CLS = { ok: 'text-good', warn: 'text-accent', fail: 'text-bad' } as const;

export function Report({ results }: { results: CheckResult[] }) {
  const t = useT();
  const name = useComponentName();

  const line = (r: CheckResult): string => {
    const p = r.params ?? {};
    const vars: Record<string, string> = {};
    if (p.node) vars.node = name(p.node as ComponentType);
    if (p.from) vars.from = name(p.from as ComponentType);
    if (p.to) vars.to = name(p.to as ComponentType);
    if (p.middle) vars.middle = name(p.middle as ComponentType);
    if (p.nodes) vars.nodes = p.nodes.split(',').map((x) => name(x as ComponentType)).join(', ');
    return t(r.messageKey as MessageKey, vars);
  };

  return (
    <ul className="space-y-2" aria-label={t('diagram.report')}>
      {results.map((r, i) => (
        <li key={i} className="flex items-start gap-3 rounded-xl border border-line bg-surface p-3">
          <Icon name={STATUS_ICON[r.status]} className={`mt-0.5 h-4 w-4 flex-none ${STATUS_CLS[r.status]}`} />
          <span className="text-sm text-content">{line(r)}</span>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 3: Create the list builder**

Create `src/features/diagram/ListBuilder.tsx`:

```tsx
import { useState } from 'react';
import { Icon } from '@/components/Icon';
import { useT } from '@/i18n/useT';
import type { Diagram, ComponentType } from '@/domain/diagram/types';
import { useComponentName } from './useComponentName';

interface Props {
  diagram: Diagram;
  palette: ComponentType[];
  onAdd: (type: ComponentType) => void;
  onRemoveNode: (id: string) => void;
  onConnect: (from: string, to: string) => void;
  onDisconnect: (from: string, to: string) => void;
}

export function ListBuilder({ diagram, palette, onAdd, onRemoveNode, onConnect, onDisconnect }: Props) {
  const t = useT();
  const name = useComponentName();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const nodeLabel = (id: string) => {
    const node = diagram.nodes.find((n) => n.id === id);
    return node ? name(node.type) : id;
  };

  return (
    <div className="space-y-6">
      {/* Palette */}
      <section aria-labelledby="dg-add" className="space-y-3">
        <h2 id="dg-add" className="text-sm font-bold uppercase tracking-wide text-muted">{t('diagram.addComponent')}</h2>
        <div className="flex flex-wrap gap-2">
          {palette.map((type) => (
            <button key={type} type="button" onClick={() => onAdd(type)}
              className="rounded-lg border border-line bg-surface-raised px-3 py-2 text-sm font-medium text-content transition hover:border-line-strong hover:text-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
              + {name(type)}
            </button>
          ))}
        </div>
      </section>

      {/* Nodes */}
      <section aria-labelledby="dg-nodes" className="space-y-3">
        <h2 id="dg-nodes" className="text-sm font-bold uppercase tracking-wide text-muted">{t('diagram.components')}</h2>
        {diagram.nodes.length === 0 ? (
          <p className="text-sm text-faint">{t('diagram.noComponents')}</p>
        ) : (
          <ul className="space-y-2">
            {diagram.nodes.map((nd) => (
              <li key={nd.id} className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3">
                <span className="flex-1 text-sm text-content">{name(nd.type)}</span>
                <button type="button" onClick={() => onRemoveNode(nd.id)} aria-label={`${t('diagram.remove')}: ${name(nd.type)}`}
                  className="text-faint transition hover:text-bad focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                  <Icon name="close" className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Connections */}
      <section aria-labelledby="dg-edges" className="space-y-3">
        <h2 id="dg-edges" className="text-sm font-bold uppercase tracking-wide text-muted">{t('diagram.connections')}</h2>
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-xs text-muted">
            {t('diagram.from')}
            <select value={from} onChange={(e) => setFrom(e.target.value)}
              className="rounded-lg border border-line bg-surface-raised px-2.5 py-2 text-sm text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
              <option value="">—</option>
              {diagram.nodes.map((nd) => <option key={nd.id} value={nd.id}>{name(nd.type)}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted">
            {t('diagram.to')}
            <select value={to} onChange={(e) => setTo(e.target.value)}
              className="rounded-lg border border-line bg-surface-raised px-2.5 py-2 text-sm text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
              <option value="">—</option>
              {diagram.nodes.map((nd) => <option key={nd.id} value={nd.id}>{name(nd.type)}</option>)}
            </select>
          </label>
          <button type="button" disabled={!from || !to || from === to}
            onClick={() => { onConnect(from, to); setFrom(''); setTo(''); }}
            className="rounded-lg bg-accent px-3.5 py-2 text-sm font-semibold text-on-accent transition hover:bg-accent-strong disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            {t('diagram.addConnection')}
          </button>
        </div>
        {diagram.edges.length === 0 ? (
          <p className="text-sm text-faint">{t('diagram.noConnections')}</p>
        ) : (
          <ul className="space-y-2">
            {diagram.edges.map((e, i) => (
              <li key={i} className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3">
                <span className="flex-1 text-sm text-content">{nodeLabel(e.from)} → {nodeLabel(e.to)}</span>
                <button type="button" onClick={() => onDisconnect(e.from, e.to)} aria-label={`${t('diagram.remove')}: ${nodeLabel(e.from)} → ${nodeLabel(e.to)}`}
                  className="text-faint transition hover:text-bad focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                  <Icon name="close" className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Create the screen (picker + builder orchestration)**

Create `src/features/diagram/Diagram.tsx`:

```tsx
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { scenarios, type Scenario } from '@/content/diagram';
import { validate, isPassed } from '@/domain/diagram/validate';
import { addNode, removeNode, addEdge, removeEdge, emptyDiagram } from '@/domain/diagram/edit';
import type { Diagram as Dgm, ComponentType, CheckResult } from '@/domain/diagram/types';
import { useStore, isScenarioDone } from '@/store/useStore';
import { todayISO } from '@/lib/date';
import { EmptyState } from '@/components/EmptyState';
import { Icon } from '@/components/Icon';
import { useT } from '@/i18n/useT';
import { ListBuilder } from './ListBuilder';
import { Report } from './Report';

export function Diagram() {
  const { scenarioId } = useParams();
  const scenario = useMemo(() => scenarios.find((s) => s.id === scenarioId), [scenarioId]);
  if (scenarios.length === 0) return <DiagramEmpty />;
  if (!scenarioId || !scenario) return <ScenarioPicker />;
  return <ScenarioBuilder key={scenario.id} scenario={scenario} />;
}

function DiagramEmpty() {
  const t = useT();
  return <EmptyState icon="🧩" title={t('diagram.emptyTitle')} hint={t('diagram.emptyHint')} />;
}

function ScenarioPicker() {
  const t = useT();
  const lang = useStore((s) => s.settings.lang);
  const completed = useStore((s) => s.diagram.completed);
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-bright">{t('diagram.title')}</h1>
        <p className="text-sm text-muted">{t('diagram.pickScenario')}</p>
      </header>
      <ul className="space-y-3">
        {scenarios.map((sc) => (
          <li key={sc.id}>
            <Link to={`/diagram/${sc.id}`}
              className="flex items-center gap-4 rounded-2xl border border-line bg-surface-raised p-5 shadow-card transition hover:-translate-y-0.5 hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
              <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-accent/10 text-accent">
                <Icon name="compare" className="h-6 w-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-bright">{sc.title[lang]}</span>
                <span className="block truncate text-sm text-muted">{sc.brief[lang]}</span>
              </span>
              {completed[sc.id] && <Icon name="check" className="h-5 w-5 flex-none text-good" />}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ScenarioBuilder({ scenario }: { scenario: Scenario }) {
  const t = useT();
  const lang = useStore((s) => s.settings.lang);
  const completeScenario = useStore((s) => s.completeScenario);
  const [diagram, setDiagram] = useState<Dgm>(emptyDiagram);
  const [counter, setCounter] = useState(0);
  const [results, setResults] = useState<CheckResult[] | null>(null);

  const add = (type: ComponentType) => {
    setDiagram((d) => addNode(d, type, `${type}-${counter}`));
    setCounter((c) => c + 1);
    setResults(null);
  };
  const rmNode = (id: string) => { setDiagram((d) => removeNode(d, id)); setResults(null); };
  const connect = (from: string, to: string) => { setDiagram((d) => addEdge(d, from, to)); setResults(null); };
  const disconnect = (from: string, to: string) => { setDiagram((d) => removeEdge(d, from, to)); setResults(null); };
  const reset = () => { setDiagram(emptyDiagram); setResults(null); };

  const submit = () => {
    const r = validate(diagram, scenario.constraints);
    setResults(r);
    completeScenario(scenario.id, isPassed(r), todayISO());
  };

  const passed = results != null && isPassed(results);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-2">
        <Link to="/diagram" className="text-sm font-medium text-accent hover:underline">← {t('diagram.title')}</Link>
        <h1 className="text-2xl font-bold tracking-tight text-bright">{scenario.title[lang]}</h1>
        <p className="text-content [text-wrap:pretty]">{scenario.brief[lang]}</p>
      </header>

      <div className="rounded-2xl border border-line bg-surface-raised p-6 shadow-card">
        <ListBuilder
          diagram={diagram} palette={scenario.palette}
          onAdd={add} onRemoveNode={rmNode} onConnect={connect} onDisconnect={disconnect}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={submit} disabled={diagram.nodes.length === 0}
          className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent shadow-card transition hover:-translate-y-0.5 hover:bg-accent-strong disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
          {t('diagram.check')}
        </button>
        <button type="button" onClick={reset}
          className="rounded-xl border border-line px-5 py-2.5 text-sm font-semibold text-content transition hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
          {t('diagram.reset')}
        </button>
      </div>

      {results && (
        <section className="space-y-5 rounded-2xl border border-line bg-surface-raised p-6 shadow-card">
          <h2 className={`flex items-center gap-2 text-lg font-bold ${passed ? 'text-good' : 'text-accent'}`}>
            <Icon name={passed ? 'check' : 'bolt'} className="h-5 w-5" />
            {passed ? t('diagram.passed') : t('diagram.hasIssues')}
          </h2>
          <Report results={results} />
          <div className="border-t border-line pt-4">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">{t('diagram.reference')}</h3>
            <ul className="space-y-1.5 text-sm text-content">
              {scenario.reference.edges.map((e, i) => {
                const ln = (id: string) => scenario.reference.nodes.find((nd) => nd.id === id)?.type ?? id;
                return <li key={i} className="text-muted">{t(`diagram.check.edge` as const, {})} — {ln(e.from)} → {ln(e.to)}</li>;
              })}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}
```

Note: the reference block above lists raw type ids for brevity; localize them with `useComponentName()` if desired. Keep it simple — the test below does not depend on the reference labels.

- [ ] **Step 5: Add the route**

In `src/app/App.tsx`, add after the `daily` route line:

```ts
      { path: 'diagram/:scenarioId?', lazy: () => import('@/features/diagram/Diagram').then((m) => ({ Component: m.Diagram })) },
```

- [ ] **Step 6: Write the failing screen smoke test**

Create `src/features/diagram/Diagram.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Diagram } from './Diagram';
import { scenarios } from '@/content/diagram';
import { componentNames } from '@/content/diagram';
import { useStore } from '@/store/useStore';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/diagram/:scenarioId?" element={<Diagram />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  useStore.getState().resetProgress();
  useStore.getState().setSettings({ lang: 'en' });
});

describe('Diagram screen', () => {
  it('lists scenarios on the picker', () => {
    renderAt('/diagram');
    expect(screen.getByText(scenarios[0].title.en)).toBeInTheDocument();
  });

  it('builds a passing diagram and shows an accepted report', async () => {
    const user = userEvent.setup();
    renderAt('/diagram/url-shortener'); // requires client, api-server, cache, a datastore
    await user.click(screen.getByRole('button', { name: `+ ${componentNames.client.en}` }));
    await user.click(screen.getByRole('button', { name: `+ ${componentNames['api-server'].en}` }));
    await user.click(screen.getByRole('button', { name: `+ ${componentNames.cache.en}` }));
    await user.click(screen.getByRole('button', { name: `+ ${componentNames['sql-db'].en}` }));
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(screen.getByText('Diagram accepted')).toBeInTheDocument();
    expect(useStore.getState().diagram.completed['url-shortener'].passed).toBe(true);
  });

  it('marks a scenario missing a required node as having issues', async () => {
    const user = userEvent.setup();
    renderAt('/diagram/url-shortener');
    await user.click(screen.getByRole('button', { name: `+ ${componentNames.client.en}` }));
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(screen.getByText('Some notes')).toBeInTheDocument();
    expect(useStore.getState().diagram.completed['url-shortener'].passed).toBe(false);
  });
});
```

- [ ] **Step 7: Run the screen test to verify it fails, then passes**

Run: `npm run test -- src/features/diagram/Diagram.test.tsx`
Expected first run: FAIL if the route/exports aren’t wired. After Steps 1–5 exist: PASS (3 tests). Fix real issues if any surface (e.g. button accessible-name mismatch).

- [ ] **Step 8: Run the full suite + typecheck**

Run: `npm run test && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/features/diagram/ src/app/App.tsx
git commit -m "feat(diagram): accessible list-builder screen + route"
```

---

### Task 6: Surface integration — nav, palette, dashboard, progress, icon

**Files:**
- Modify: `src/components/Icon.tsx` (add a `diagram` icon)
- Modify: `src/app/Layout.tsx` (NAV entry + `titleKeyFor`)
- Modify: `src/components/CommandPalette.tsx` (SCREENS entry)
- Modify: `src/features/dashboard/Dashboard.tsx` (diagram card)
- Modify: `src/features/progress/Progress.tsx` (diagram stat)

**Interfaces:**
- Consumes: route `/diagram` (Task 5); `selectDiagramProgress` (Task 4); `scenarios` (Task 3); i18n keys (Task 2).

- [ ] **Step 1: Add the `diagram` icon**

In `src/components/Icon.tsx`, add `'diagram'` to the `IconName` union, and add to `PATHS`:

```tsx
  diagram: (<><rect x="3" y="4" width="6" height="5" rx="1.2" /><rect x="15" y="4" width="6" height="5" rx="1.2" /><rect x="9" y="15" width="6" height="5" rx="1.2" /><path d="M6 9v3h12V9M12 12v3" /></>),
```

- [ ] **Step 2: Add the sidebar nav entry + title mapping**

In `src/app/Layout.tsx`, add to the `NAV` array (after the `compare` entry):

```ts
  { to: '/diagram', key: 'nav.diagram', icon: 'diagram' },
```

And in `titleKeyFor`, add before the final `return 'nav.dashboard'`:

```ts
  if (pathname.startsWith('/diagram')) return 'nav.diagram';
```

- [ ] **Step 3: Add the command-palette entry**

In `src/components/CommandPalette.tsx`, add to the `SCREENS` array (after the `compare` entry):

```ts
  { key: 'nav.diagram', to: '/diagram', icon: 'diagram' },
```

- [ ] **Step 4: Add the Dashboard card**

In `src/features/dashboard/Dashboard.tsx`, add the imports:

```ts
import { selectDiagramProgress } from '@/store/useStore';
import { scenarios } from '@/content/diagram';
```

(Extend the existing `useStore`/selector import lines rather than duplicating — `selectDiagramProgress` joins the other `useStore, …` named imports.)

Inside the component body, after `const dailyStreak = …`:

```ts
  const diagramProgress = selectDiagramProgress(state, scenarios.map((s) => s.id));
```

Add this card right after the Daily challenge `<Link …to="/daily">…</Link>` block:

```tsx
      <Link
        to="/diagram"
        className="flex items-center gap-4 rounded-2xl border border-line bg-surface-raised p-5 shadow-card transition hover:-translate-y-0.5 hover:border-line-strong hover:shadow-card-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-accent/10 text-accent">
          <Icon name="diagram" className="h-6 w-6" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-base font-semibold text-bright">{t('dashboard.diagramTitle')}</span>
          <span className="block text-sm font-medium text-accent">{t('dashboard.diagramCta')}</span>
        </span>
        <span className="flex-none text-sm font-bold tabular-nums text-muted">
          {t('dashboard.diagramDone', { done: diagramProgress.done, total: diagramProgress.total })}
        </span>
      </Link>
```

- [ ] **Step 5: Add the Progress stat**

In `src/features/progress/Progress.tsx`, add imports:

```ts
import { selectDiagramProgress } from '@/store/useStore';
import { scenarios } from '@/content/diagram';
```

(Merge `selectDiagramProgress` into the existing `useStore` named import line.)

In the component body:

```ts
  const diagramProgress = selectDiagramProgress(state, scenarios.map((s) => s.id));
```

Add a stat card inside the stats `<section className="grid …">`:

```tsx
        <div className="rounded-2xl border border-line bg-surface-raised p-6 shadow-card">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/10 text-accent">
            <Icon name="diagram" className="h-5 w-5" />
          </span>
          <div className="mt-4 text-3xl font-bold tracking-tight text-bright tabular-nums">
            {diagramProgress.done}<span className="text-base font-medium text-muted">/{diagramProgress.total}</span>
          </div>
          <div className="mt-2 text-sm text-muted">{t('progress.diagram')}</div>
        </div>
```

- [ ] **Step 6: Manual/typecheck verification**

Run: `npx tsc --noEmit && npm run test`
Expected: PASS. Then run `npm run dev`, open the app, and confirm: the sidebar shows "Diagrams/Схемы", ⌘K lists it, the Dashboard card shows "0/3", `/diagram` opens the picker, and toggling language/theme keeps everything readable.

- [ ] **Step 7: Commit**

```bash
git add src/components/Icon.tsx src/app/Layout.tsx src/components/CommandPalette.tsx src/features/dashboard/Dashboard.tsx src/features/progress/Progress.tsx
git commit -m "feat(diagram): sidebar, command palette, dashboard card, progress stat"
```

---

### Task 7: React Flow canvas view (optional input adapter)

**Files:**
- Modify: `package.json` (add `@xyflow/react`)
- Create: `src/features/diagram/CanvasBuilder.tsx`
- Modify: `src/features/diagram/Diagram.tsx` (view toggle: list ⇄ canvas)

**Interfaces:**
- Consumes: the working `Diagram` model + the same `onAdd/onConnect/onRemoveNode` callbacks from `ScenarioBuilder` (Task 5).
- Produces: `CanvasBuilder` — a canvas that renders the current nodes/edges and lets the user draw new edges by dragging between node handles.

**Rationale:** This is UX polish only. The list builder (Task 5) is fully functional and AA-accessible; the ~50–90KB React Flow dependency buys mouse-friendly editing, nothing more. Adding nodes stays on the shared palette so both views use one path.

- [ ] **Step 1: Install React Flow**

Run: `npm install @xyflow/react`
Expected: adds `@xyflow/react` to `dependencies`.

- [ ] **Step 2: Create the canvas builder**

Create `src/features/diagram/CanvasBuilder.tsx`:

```tsx
import { useMemo } from 'react';
import { ReactFlow, Background, Controls, type Node, type Edge, type Connection } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { Diagram } from '@/domain/diagram/types';
import { useComponentName } from './useComponentName';

interface Props {
  diagram: Diagram;
  onConnect: (from: string, to: string) => void;
}

/** Read-mostly canvas: shows current nodes/edges (auto-gridded) and lets the user draw edges. */
export function CanvasBuilder({ diagram, onConnect }: Props) {
  const name = useComponentName();

  const nodes: Node[] = useMemo(
    () => diagram.nodes.map((nd, i) => ({
      id: nd.id,
      data: { label: name(nd.type) },
      position: { x: (i % 3) * 200, y: Math.floor(i / 3) * 120 },
    })),
    [diagram.nodes, name],
  );

  const edges: Edge[] = useMemo(
    () => diagram.edges.map((e, i) => ({ id: `e-${i}`, source: e.from, target: e.to })),
    [diagram.edges],
  );

  const handleConnect = (c: Connection) => { if (c.source && c.target) onConnect(c.source, c.target); };

  return (
    <div style={{ height: 420 }} className="overflow-hidden rounded-xl border border-line">
      <ReactFlow nodes={nodes} edges={edges} onConnect={handleConnect} fitView proOptions={{ hideAttribution: true }}>
        <Background />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
```

- [ ] **Step 3: Add the view toggle in ScenarioBuilder**

In `src/features/diagram/Diagram.tsx`, add a lazy import at the top:

```ts
import { lazy, Suspense } from 'react';
const CanvasBuilder = lazy(() => import('./CanvasBuilder').then((m) => ({ Component: m.CanvasBuilder })));
```

In `ScenarioBuilder`, add view state next to the others:

```ts
  const [view, setView] = useState<'list' | 'canvas'>('list');
```

Add a toggle above the builder card:

```tsx
      <div className="flex gap-2" role="group" aria-label={t('diagram.title')}>
        <button type="button" onClick={() => setView('list')}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${view === 'list' ? 'bg-accent/10 text-accent' : 'text-muted hover:text-content'}`}>
          {t('diagram.viewList')}
        </button>
        <button type="button" onClick={() => setView('canvas')}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${view === 'canvas' ? 'bg-accent/10 text-accent' : 'text-muted hover:text-content'}`}>
          {t('diagram.viewCanvas')}
        </button>
      </div>
```

Wrap the builder card content so canvas view still exposes the palette (add-node) plus the canvas:

```tsx
      <div className="rounded-2xl border border-line bg-surface-raised p-6 shadow-card">
        {view === 'list' ? (
          <ListBuilder
            diagram={diagram} palette={scenario.palette}
            onAdd={add} onRemoveNode={rmNode} onConnect={connect} onDisconnect={disconnect}
          />
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {scenario.palette.map((type) => (
                <button key={type} type="button" onClick={() => add(type)}
                  className="rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-content transition hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                  + {/* localized via ListBuilder normally; inline here */}{type}
                </button>
              ))}
            </div>
            <Suspense fallback={<div className="h-[420px] animate-pulse rounded-xl bg-surface" />}>
              <CanvasBuilder diagram={diagram} onConnect={connect} />
            </Suspense>
          </div>
        )}
      </div>
```

Note: to keep the canvas palette labels localized, import and use `useComponentName()` in `ScenarioBuilder` and replace `{type}` with `{name(type)}`. (The list view already localizes via `ListBuilder`.)

- [ ] **Step 4: Verify existing tests still pass (list is the default view)**

Run: `npm run test -- src/features/diagram/Diagram.test.tsx`
Expected: PASS — the smoke test uses the default list view and is unaffected.

- [ ] **Step 5: Manual verification of the canvas**

Run: `npm run dev`, open `/diagram/url-shortener`, switch to "Canvas". Confirm: added components appear as draggable nodes; dragging from one node handle to another creates a connection; switching back to "List" shows that same connection; "Check" reports correctly. Confirm light/dark both render the canvas legibly.

- [ ] **Step 6: Build to confirm the bundle is healthy**

Run: `npm run build`
Expected: succeeds; the diagram + React Flow code is in a lazily-loaded chunk (it’s a `lazy()` import), so the main bundle is not bloated.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src/features/diagram/CanvasBuilder.tsx src/features/diagram/Diagram.tsx
git commit -m "feat(diagram): optional React Flow canvas view"
```

---

## Self-Review

**Spec coverage:**
- Domain model + constraint validation (B: graph+connections) → Task 1. ✓
- Constraint-based, not golden-diagram; valid alternative passes → Task 1 (`isPassed` model) + Task 3 (invariant test). ✓
- Reference shown after submit as illustration → Task 5 (report block). ✓
- 3–4 scenarios + shared palette, Zod, `{ru,en}` → Task 3 (3 scenarios). ✓
- Composed per-constraint bilingual feedback as its own unit → Task 2. ✓
- Store slice + v3→v4 migration + streak + selectors → Task 4. ✓
- List builder as required AA core, keyboard-operable → Task 5. ✓
- React Flow as adapter over same model → Task 7. ✓
- Full integration (sidebar, ⌘K, Dashboard card, Progress) → Task 6. ✓
- Tests: domain, content, store, screen smoke; canvas not unit-tested (documented) → Tasks 1,3,4,5. ✓
- Order model → validation → content → store → list-builder → integration → canvas (a11y not last) → Tasks 1→7. ✓

**Placeholder scan:** No "TBD"/"handle edge cases"/"similar to Task N". Two inline notes (reference-label localization in Task 5 Step 4; canvas palette label localization in Task 7 Step 3) give the exact fix, not a vague deferral.

**Type consistency:** `Diagram`, `ComponentType`, `Constraint`, `CheckResult` defined in Task 1 and consumed with the same names/shapes in Tasks 3/5/7. `completeScenario(id, passed, today)`, `isScenarioDone`, `selectDiagramProgress` defined in Task 4 and called identically in Tasks 5/6. `messageKey` strings emitted in Task 1 exactly match keys added in Task 2. Component-name `params` convention (`node`/`from`/`to`/`middle`/`nodes` comma-joined) is produced in Task 1 `validate` and consumed in Task 5 `Report`.
