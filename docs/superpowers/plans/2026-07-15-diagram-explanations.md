# Diagram Per-Constraint Explanations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Under each ✓/⚠/✗ report line, show a short "why this constraint matters" explanation for the key (non-trivial) constraints of each scenario.

**Architecture:** Add an optional `explain: Localized` field to constraints (content only — the domain stays pure). `Report` gains an optional `explanations` prop rendered as muted sub-text; `ScenarioBuilder` localizes `constraint.explain` per index and passes it. Explanation is the constraint's rationale, shown regardless of ✓/⚠/✗.

**Tech Stack:** React + TS + Vite, Zod, Vitest + Testing Library.

## Global Constraints

- **Domain untouched.** `explain` is content (`Localized`); it never enters `src/domain/diagram/*` (`Constraint`, `validate`, `CheckResult`). The content constraint type is a structural superset of the domain `Constraint` (extra optional field), so `validate(diagram, scenario.constraints)` still typechecks.
- **`results[i]` ↔ `constraints[i]`** (`validate = constraints.map(checkOne)`), so `explanations[i]` aligns with `results[i]`.
- **Explanation shown regardless of status** (rationale of the constraint). Only key constraints get one; obvious ones (`required-node client`) have none — no sub-text there.
- **Bilingual `{ru,en}`**, non-empty where present. `Report` stays backward-compatible (`explanations` optional).
- Tests via Vitest (`npm run test`); commit after each task; NO Co-Authored-By / Claude attribution in commit messages.

---

### Task 1: Mechanism (schema + Report + wiring) + url-shortener slice

**Files:**
- Modify: `src/content/diagram.ts` (`explain` on `ConstraintSchema`; explanations on url-shortener)
- Modify: `src/features/diagram/Report.tsx` (optional `explanations` prop + render)
- Modify: `src/features/diagram/Diagram.tsx` (`ScenarioBuilder`: pass `explanations`)
- Create: `src/features/diagram/Report.test.tsx`
- Modify: `src/content/diagram.test.ts` (assert explanations valid)

**Interfaces:**
- Produces: `Report` prop `explanations?: (string | undefined)[]`; `Scenario` constraints gain optional `explain: Localized`.

- [ ] **Step 1: Add `explain` to ConstraintSchema + url-shortener explanations**

In `src/content/diagram.ts`, add `explain: LocalizedSchema.optional()` to **every** variant of `ConstraintSchema`:

```ts
const ConstraintSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('required-node'), node: ComponentTypeSchema, explain: LocalizedSchema.optional() }),
  z.object({ kind: z.literal('any-of'), nodes: z.array(ComponentTypeSchema).min(2), explain: LocalizedSchema.optional() }),
  z.object({ kind: z.literal('forbidden-node'), node: ComponentTypeSchema, severity: z.enum(['warn', 'fail']), explain: LocalizedSchema.optional() }),
  z.object({ kind: z.literal('required-edge'), from: ComponentTypeSchema, to: ComponentTypeSchema, explain: LocalizedSchema.optional() }),
  z.object({ kind: z.literal('between'), middle: ComponentTypeSchema, from: ComponentTypeSchema, to: ComponentTypeSchema, explain: LocalizedSchema.optional() }),
]);
```

Then add `explain` to the **url-shortener** scenario's key constraints (leave `required-node client`/`api-server` without):

```ts
    constraints: [
      { kind: 'required-node', node: 'client' },
      { kind: 'required-node', node: 'api-server' },
      { kind: 'any-of', nodes: ['sql-db', 'nosql-db'],
        explain: { ru: 'Короткие коды нужно где-то хранить постоянно — SQL или NoSQL.', en: 'Short codes need durable storage — SQL or NoSQL.' } },
      { kind: 'required-edge', from: 'api-server', to: 'cache',
        explain: { ru: 'Чтение >> запись: кэш перед БД держит latency < 50 мс на популярных ссылках.', en: 'Read-heavy: a cache in front of the DB keeps latency < 50ms on hot links.' } },
      { kind: 'forbidden-node', node: 'message-queue', severity: 'warn',
        explain: { ru: 'Редирект синхронный и простой — очередь сообщений тут избыточна.', en: 'A redirect is synchronous and simple — a message queue is overkill here.' } },
    ],
```

- [ ] **Step 2: Add the Report explanations prop + render**

In `src/features/diagram/Report.tsx`, change the signature and the list item to stack the line and an optional explanation:

```tsx
export function Report({ results, explanations }: { results: CheckResult[]; explanations?: (string | undefined)[] }) {
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
        <li key={i} className="rounded-xl border border-line bg-surface p-3">
          <div className="flex items-start gap-3">
            <Icon name={STATUS_ICON[r.status]} className={`mt-0.5 h-4 w-4 flex-none ${STATUS_CLS[r.status]}`} />
            <span className="text-sm text-content">{line(r)}</span>
          </div>
          {explanations?.[i] && <p className="mt-1.5 pl-7 text-xs text-muted">{explanations[i]}</p>}
        </li>
      ))}
    </ul>
  );
}
```

(Imports and `STATUS_ICON`/`STATUS_CLS` are unchanged.)

- [ ] **Step 3: Pass explanations from ScenarioBuilder**

In `src/features/diagram/Diagram.tsx`, inside `ScenarioBuilder`, in the `{results && (…)}` report section, compute and pass the localized explanations. Replace the `<Report results={results} />` usage with:

```tsx
          <Report
            results={results}
            explanations={scenario.constraints.map((c) => c.explain?.[lang])}
          />
```

(`lang` is already read from the store in `ScenarioBuilder`.)

- [ ] **Step 4: Write the Report test**

Create `src/features/diagram/Report.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Report } from './Report';
import { useStore } from '@/store/useStore';
import type { CheckResult } from '@/domain/diagram/types';

const results: CheckResult[] = [
  { status: 'ok', messageKey: 'diagram.check.required', params: { node: 'client' } },
  { status: 'fail', messageKey: 'diagram.check.missing', params: { node: 'cache' } },
];

beforeEach(() => useStore.getState().setSettings({ lang: 'en' }));

describe('Report', () => {
  it('renders an explanation under a line when provided', () => {
    render(<Report results={results} explanations={['Because caching helps', undefined]} />);
    expect(screen.getByText('Because caching helps')).toBeInTheDocument();
  });

  it('renders no explanation sub-text when none is provided', () => {
    render(<Report results={results} />);
    expect(screen.queryByText('Because caching helps')).not.toBeInTheDocument();
    // both result lines still render
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });
});
```

- [ ] **Step 5: Extend the content test**

In `src/content/diagram.test.ts`, add:

```ts
  it('constraint explanations, where present, are valid bilingual', () => {
    let withExplain = 0;
    for (const sc of scenarios) {
      for (const c of sc.constraints) {
        if ('explain' in c && c.explain) {
          expect(c.explain.ru.length).toBeGreaterThan(0);
          expect(c.explain.en.length).toBeGreaterThan(0);
          withExplain++;
        }
      }
    }
    expect(withExplain).toBeGreaterThan(0); // url-shortener slice populated in Task 1
  });
```

- [ ] **Step 6: Typecheck + full suite + build**

Run: `npx tsc --noEmit && npm run test && npm run build`
Expected: all PASS. `validate(diagram, scenario.constraints)` still typechecks (content constraint is a structural superset of the domain `Constraint`). The list smoke test is unaffected.

- [ ] **Step 7: Commit**

```bash
git add src/content/diagram.ts src/features/diagram/Report.tsx src/features/diagram/Diagram.tsx src/features/diagram/Report.test.tsx src/content/diagram.test.ts
git commit -m "feat(diagram): per-constraint explanations in the report (mechanism + url-shortener)"
```

---

### Task 2: Explanations for the remaining 7 scenarios

**Files:**
- Modify: `src/content/diagram.ts` (add `explain` to key constraints of the other 7 scenarios)
- Modify: `src/content/diagram.test.ts` (raise the coverage assertion)

**Interfaces:**
- Consumes: the `explain` field + render mechanism from Task 1.

- [ ] **Step 1: Add explanations to the key constraints**

In `src/content/diagram.ts`, add an `explain: { ru, en }` to the listed constraints of each scenario (match the constraint by its `kind`+fields; leave obvious `required-node client`/`api-server` without). Use exactly these:

**blog-api** — `any-of ['sql-db','nosql-db']`:
```ts
        explain: { ru: 'Постам и комментариям нужно постоянное хранилище — SQL или NoSQL.', en: 'Posts and comments need durable storage — SQL or NoSQL.' },
```

**rate-limiter** — `between { middle:'rate-limiter', from:'client', to:'api-server' }`:
```ts
        explain: { ru: 'Rate limiter стоит ПЕРЕД API, чтобы отсекать лишние запросы до бизнес-логики.', en: 'The rate limiter sits BEFORE the API to reject excess requests before business logic.' },
```
and `required-edge { from:'rate-limiter', to:'cache' }`:
```ts
        explain: { ru: 'Счётчики лимитов в общем кэше (Redis) переживают рестарт инстанса и общие для всех нод.', en: 'Limit counters in a shared cache (Redis) survive instance restarts and are shared across nodes.' },
```

**file-upload** — `required-node 'object-store'`:
```ts
        explain: { ru: 'Большие бинарники хранят в объектном хранилище, а не в БД.', en: 'Large binaries belong in object storage, not a database.' },
```
and `required-edge { from:'client', to:'cdn' }`:
```ts
        explain: { ru: 'Отдача файлов через CDN ближе к пользователю и разгружает origin.', en: 'Serving files via a CDN is closer to users and offloads the origin.' },
```

**news-feed** — `required-edge { from:'api-server', to:'cache' }`:
```ts
        explain: { ru: 'Лента очень read-heavy — кэш горячих лент снижает нагрузку на БД.', en: 'A feed is very read-heavy — caching hot feeds cuts DB load.' },
```
and `required-edge { from:'client', to:'cdn' }`:
```ts
        explain: { ru: 'Картинки и медиа отдаём через CDN для низкой latency.', en: 'Serve images and media via a CDN for low latency.' },
```

**chat** — `required-edge { from:'api-server', to:'message-queue' }`:
```ts
        explain: { ru: 'Очередь развязывает отправку и доставку — сообщения не теряются при пиках и офлайн-получателях.', en: 'A queue decouples send from delivery — messages survive spikes and offline recipients.' },
```
and `required-edge { from:'api-server', to:'cache' }`:
```ts
        explain: { ru: 'Presence (кто онлайн) держат в кэше — быстрое чтение эфемерных данных.', en: 'Presence (who is online) lives in a cache — fast reads of ephemeral data.' },
```

**notifications** — `between { middle:'message-queue', from:'api-server', to:'worker' }`:
```ts
        explain: { ru: 'Очередь между API и воркерами даёт фан-аут: отправители не блокируются доставкой, воркеры масштабируются отдельно.', en: 'A queue between the API and workers enables fan-out: senders do not block on delivery and workers scale independently.' },
```

**video-streaming** — `between { middle:'message-queue', from:'api-server', to:'worker' }`:
```ts
        explain: { ru: 'Транскодинг тяжёлый и асинхронный — очередь между загрузкой и воркерами-транскодерами.', en: 'Transcoding is heavy and async — a queue sits between upload and transcoder workers.' },
```
and `required-edge { from:'client', to:'cdn' }`:
```ts
        explain: { ru: 'Глобальная отдача видео с низкой задержкой немыслима без CDN.', en: 'Low-latency global video delivery is unthinkable without a CDN.' },
```

- [ ] **Step 2: Raise the coverage assertion**

In `src/content/diagram.test.ts`, change the `expect(withExplain).toBeGreaterThan(0);` line (from Task 1) to:

```ts
    expect(withExplain).toBeGreaterThanOrEqual(12); // key constraints across all 8 scenarios
```

Also assert every scenario except the two pure-junior ones is covered — add:

```ts
    const scenariosWithExplain = scenarios.filter((sc) => sc.constraints.some((c) => 'explain' in c && c.explain));
    expect(scenariosWithExplain.length).toBeGreaterThanOrEqual(7);
```

- [ ] **Step 3: Typecheck + full suite + build**

Run: `npx tsc --noEmit && npm run test && npm run build`
Expected: all PASS (content Zod validation + the raised coverage assertions).

- [ ] **Step 4: Browser-verify**

Run `npm run preview`, open a couple of scenarios (e.g. `/diagram/rate-limiter`, `/diagram/notifications`), build and submit. Confirm the report shows the "why" sub-text under the key lines (between / cache / cdn / queue), in both RU and EN, both themes; obvious lines have none.

- [ ] **Step 5: Commit**

```bash
git add src/content/diagram.ts src/content/diagram.test.ts
git commit -m "feat(diagram): explanations for the remaining scenarios"
```

---

## Self-Review

**Spec coverage:**
- Optional `explain: Localized` on every `ConstraintSchema` variant; domain untouched → Task 1 Step 1. ✓
- Report renders explanation sub-text under each line, regardless of status, backward-compatible → Task 1 Steps 2, 4. ✓
- ScenarioBuilder localizes `constraint.explain[lang]` index-parallel → Task 1 Step 3. ✓
- Explanations for key constraints across all 8 scenarios (url-shortener in Task 1; other 7 in Task 2) → Tasks 1–2. ✓
- Content test validates `explain` bilingual + coverage; Report test covers render/no-render → Tasks 1–2. ✓
- Obvious constraints left without explanation → Steps specify which get one. ✓

**Placeholder scan:** none — every explanation string is given verbatim in the plan.

**Type consistency:** `explanations?: (string | undefined)[]` in `Report` matches `scenario.constraints.map((c) => c.explain?.[lang])` (array of `string | undefined`, index-parallel to `results` because `validate` maps constraints 1:1). Content constraint type (with optional `explain`) remains assignable to the domain `Constraint` param of `validate` (extra optional field). `LocalizedSchema`/`Localized` already imported in `content/diagram.ts`.
