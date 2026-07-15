# Diagram Builder: Scenarios + Difficulty Grades Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Grow the `/diagram` mode from 3 to 8 scenarios, tag each with a difficulty `grade` (junior→lead, 2 per grade), and group the scenario picker by grade with badges.

**Architecture:** Purely additive to the existing feature (spec `docs/superpowers/specs/2026-07-15-diagram-builder-design.md`, on master). Add a `grade` field to `Scenario` (reuse `GradeSchema`), author 5 new scenarios + regrade the 3 existing ones, and rewrite `ScenarioPicker` to render grade-grouped sections. The validation engine, store, canvas, report, and routes are untouched.

**Tech Stack:** React + TS + Vite, Zod, Zustand, Tailwind, Vitest + @testing-library/react.

## Global Constraints

- **Grade is a difficulty label only** — no mechanical effect. `validate`, `isPassed`, edit helpers, canvas, store: unchanged.
- **Rule-design invariant (per scenario):** the `reference` diagram MUST pass its own `constraints`, and a valid architecture differing from the reference must be able to pass. Only a missing `required-node` / an all-missing `any-of` / a present `severity:'fail'` `forbidden-node` cause `fail`; `required-edge` and `between` are warn-only. **Policy:** core-tier infrastructure the scenario is *about* (client/api-server/datastore/message-queue/worker/object-store/rate-limiter) may be `required-node`; optimizations (cache, CDN) are expressed as `required-edge`/`any-of` (warn-if-missing), never hard-required — this is exactly the news-feed CDN fix below.
- **All content bilingual `{ru,en}`** via `Localized`.
- **Soft gating:** every scenario visible and clickable; grades only group + label.
- Reuse `GRADE_ORDER`/`GRADE_LABEL` (`src/lib/labels.ts`) and the `Badge` component (`src/components/Badge.tsx`, `tone="grade"`). `GRADE_LABEL` values (`Junior`/`Middle`/`Senior`/`Lead`) are language-neutral and used as-is in both locales — no new i18n keys.
- Tests via Vitest (`npm run test`); commit after each task; NO Co-Authored-By / Claude attribution in commit messages.

---

### Task 1: Content — grade field, `worker` type, 8 scenarios, news-feed CDN fix

**Files:**
- Modify: `src/domain/diagram/types.ts` (add `worker` to `COMPONENT_TYPES`)
- Modify: `src/content/diagram.ts` (grade field on schema; `worker` in `componentNames`; regrade 3 + add 5 scenarios; news-feed CDN fix)
- Modify: `src/content/diagram.test.ts` (grade coverage, 8-count, news-feed-no-cdn-passes)

**Interfaces:**
- Consumes: `GradeSchema` from `@/content/schema`; existing `ScenarioSchema`, `validate`, `isPassed`.
- Produces: `Scenario` now has `grade: Grade`; `scenarios` has 8 entries covering all 4 grades; `COMPONENT_TYPES` includes `'worker'`.

- [ ] **Step 1: Add the `worker` component type**

In `src/domain/diagram/types.ts`, add `'worker'` to the `COMPONENT_TYPES` tuple (append before the closing `] as const`):

```ts
export const COMPONENT_TYPES = [
  'client', 'load-balancer', 'api-server', 'cache', 'sql-db', 'nosql-db',
  'message-queue', 'cdn', 'object-store', 'rate-limiter', 'worker',
] as const;
```

- [ ] **Step 2: Write the failing content tests**

Replace the contents of `src/content/diagram.test.ts` with:

```ts
import { describe, it, expect } from 'vitest';
import { scenarios, componentNames, validateScenarios } from './diagram';
import { COMPONENT_TYPES } from '@/domain/diagram/types';
import { validate, isPassed } from '@/domain/diagram/validate';
import { GRADE_ORDER } from '@/lib/labels';

describe('diagram content', () => {
  it('has at least 8 scenarios and passes Zod + cross-ref validation', () => {
    expect(scenarios.length).toBeGreaterThanOrEqual(8);
    expect(() => validateScenarios(scenarios)).not.toThrow();
  });

  it('every component type has a bilingual name', () => {
    for (const t of COMPONENT_TYPES) {
      expect(componentNames[t].ru.length).toBeGreaterThan(0);
      expect(componentNames[t].en.length).toBeGreaterThan(0);
    }
  });

  it('every scenario has a valid grade and all four grades are covered', () => {
    for (const sc of scenarios) expect(GRADE_ORDER).toContain(sc.grade);
    for (const g of GRADE_ORDER) {
      expect(scenarios.filter((s) => s.grade === g).length).toBeGreaterThanOrEqual(1);
    }
  });

  it('every scenario reference passes its own constraints (rules are not over-rigid)', () => {
    for (const sc of scenarios) {
      expect(isPassed(validate(sc.reference, sc.constraints))).toBe(true);
    }
  });

  it('a valid alternative (NoSQL instead of SQL) still passes url-shortener', () => {
    const sc = scenarios.find((s) => s.id === 'url-shortener')!;
    const alt = {
      nodes: sc.reference.nodes.map((n) => (n.type === 'sql-db' ? { ...n, type: 'nosql-db' as const } : n)),
      edges: sc.reference.edges,
    };
    expect(isPassed(validate(alt, sc.constraints))).toBe(true);
  });

  it('news-feed passes without a CDN (CDN is warn-only, not hard-required)', () => {
    const sc = scenarios.find((s) => s.id === 'news-feed')!;
    const noCdn = {
      nodes: sc.reference.nodes.filter((n) => n.type !== 'cdn' && n.type !== 'object-store'),
      edges: sc.reference.edges.filter((e) => e.from !== 'cdn' && e.to !== 'cdn' && e.from !== 'object-store' && e.to !== 'object-store'),
    };
    expect(isPassed(validate(noCdn, sc.constraints))).toBe(true);
  });
});
```

- [ ] **Step 3: Run the content tests to verify they fail**

Run: `npm run test -- src/content/diagram.test.ts`
Expected: FAIL — `worker` missing from `componentNames`, `<8` scenarios, `grade` undefined, news-feed still hard-requires `cdn`.

- [ ] **Step 4: Add `grade` to the schema and `worker` to `componentNames`**

In `src/content/diagram.ts`:

Update the import line:
```ts
import { LocalizedSchema, GradeSchema, type Localized } from './schema';
```

Add `grade` to `ScenarioSchema` (after `id`):
```ts
export const ScenarioSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  grade: GradeSchema,
  title: LocalizedSchema,
  brief: LocalizedSchema,
  palette: z.array(ComponentTypeSchema).min(1),
  constraints: z.array(ConstraintSchema).min(1),
  reference: DiagramSchema,
});
```

Add the `worker` name to `componentNames` (after `rate-limiter`):
```ts
  'rate-limiter': { ru: 'Rate limiter', en: 'Rate limiter' },
  'worker': { ru: 'Воркер', en: 'Worker' },
```

- [ ] **Step 5: Replace the `scenarios` array with the 8 graded scenarios**

Replace the entire `export const scenarios: Scenario[] = [ ... ];` block (lines 45–126) with:

```ts
export const scenarios: Scenario[] = [
  // ---- junior ----
  {
    id: 'blog-api',
    grade: 'junior',
    title: { ru: 'Блог / CRUD API', en: 'Blog / CRUD API' },
    brief: {
      ru: 'Спроектируй бэкенд простого блога: посты и комментарии, умеренная нагрузка на чтение и запись.',
      en: 'Design a simple blog backend: posts and comments, moderate read/write load.',
    },
    palette: ['client', 'load-balancer', 'api-server', 'sql-db', 'nosql-db', 'cache'],
    constraints: [
      { kind: 'required-node', node: 'client' },
      { kind: 'required-node', node: 'api-server' },
      { kind: 'any-of', nodes: ['sql-db', 'nosql-db'] },
    ],
    reference: {
      nodes: [n('client'), n('load-balancer'), n('api-server'), n('sql-db')],
      edges: [
        { from: 'client', to: 'load-balancer' },
        { from: 'load-balancer', to: 'api-server' },
        { from: 'api-server', to: 'sql-db' },
      ],
    },
  },
  {
    id: 'url-shortener',
    grade: 'junior',
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
  // ---- middle ----
  {
    id: 'rate-limiter',
    grade: 'middle',
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
  {
    id: 'file-upload',
    grade: 'middle',
    title: { ru: 'Загрузка файлов', en: 'File upload service' },
    brief: {
      ru: 'Спроектируй сервис загрузки и отдачи файлов/изображений. Большие бинарники, быстрая отдача пользователям.',
      en: 'Design a file/image upload and delivery service. Large binaries, fast delivery to users.',
    },
    palette: ['client', 'load-balancer', 'api-server', 'object-store', 'cdn', 'sql-db', 'nosql-db'],
    constraints: [
      { kind: 'required-node', node: 'client' },
      { kind: 'required-node', node: 'api-server' },
      { kind: 'required-node', node: 'object-store' },
      { kind: 'required-edge', from: 'api-server', to: 'object-store' },
      { kind: 'required-edge', from: 'client', to: 'cdn' },
    ],
    reference: {
      nodes: [n('client'), n('load-balancer'), n('api-server'), n('object-store'), n('cdn'), n('sql-db')],
      edges: [
        { from: 'client', to: 'load-balancer' },
        { from: 'load-balancer', to: 'api-server' },
        { from: 'api-server', to: 'object-store' },
        { from: 'client', to: 'cdn' },
        { from: 'cdn', to: 'object-store' },
        { from: 'api-server', to: 'sql-db' },
      ],
    },
  },
  // ---- senior ----
  {
    id: 'news-feed',
    grade: 'senior',
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
      { kind: 'any-of', nodes: ['sql-db', 'nosql-db'] },
      { kind: 'required-edge', from: 'api-server', to: 'cache' },
      { kind: 'required-edge', from: 'client', to: 'cdn' },
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
    id: 'chat',
    grade: 'senior',
    title: { ru: 'Чат / мессенджинг', en: 'Chat / messaging' },
    brief: {
      ru: 'Спроектируй мессенджер: доставка сообщений в реальном времени, presence, история переписки.',
      en: 'Design a messaging app: real-time delivery, presence, message history.',
    },
    palette: ['client', 'load-balancer', 'api-server', 'message-queue', 'cache', 'nosql-db', 'sql-db'],
    constraints: [
      { kind: 'required-node', node: 'client' },
      { kind: 'required-node', node: 'api-server' },
      { kind: 'required-node', node: 'message-queue' },
      { kind: 'required-node', node: 'cache' },
      { kind: 'any-of', nodes: ['nosql-db', 'sql-db'] },
      { kind: 'required-edge', from: 'api-server', to: 'message-queue' },
    ],
    reference: {
      nodes: [n('client'), n('load-balancer'), n('api-server'), n('message-queue'), n('cache'), n('nosql-db')],
      edges: [
        { from: 'client', to: 'load-balancer' },
        { from: 'load-balancer', to: 'api-server' },
        { from: 'api-server', to: 'message-queue' },
        { from: 'api-server', to: 'cache' },
        { from: 'api-server', to: 'nosql-db' },
      ],
    },
  },
  // ---- lead ----
  {
    id: 'notifications',
    grade: 'lead',
    title: { ru: 'Система нотификаций', en: 'Notification system' },
    brief: {
      ru: 'Спроектируй мультиканальную рассылку уведомлений (email/SMS/push) с фан-аутом. Отправители не должны блокироваться доставкой.',
      en: 'Design a multi-channel notification fan-out (email/SMS/push). Senders must not block on delivery.',
    },
    palette: ['client', 'load-balancer', 'api-server', 'message-queue', 'worker', 'cache', 'sql-db', 'nosql-db'],
    constraints: [
      { kind: 'required-node', node: 'api-server' },
      { kind: 'required-node', node: 'message-queue' },
      { kind: 'required-node', node: 'worker' },
      { kind: 'between', middle: 'message-queue', from: 'api-server', to: 'worker' },
      { kind: 'any-of', nodes: ['sql-db', 'nosql-db'] },
    ],
    reference: {
      nodes: [n('client'), n('load-balancer'), n('api-server'), n('message-queue'), n('worker'), n('sql-db')],
      edges: [
        { from: 'client', to: 'load-balancer' },
        { from: 'load-balancer', to: 'api-server' },
        { from: 'api-server', to: 'message-queue' },
        { from: 'message-queue', to: 'worker' },
        { from: 'worker', to: 'sql-db' },
      ],
    },
  },
  {
    id: 'video-streaming',
    grade: 'lead',
    title: { ru: 'Видеостриминг', en: 'Video streaming' },
    brief: {
      ru: 'Спроектируй видеосервис: загрузка, транскодинг в фоне, глобальная отдача с низкой задержкой.',
      en: 'Design a video service: upload, background transcoding, low-latency global delivery.',
    },
    palette: ['client', 'load-balancer', 'api-server', 'object-store', 'message-queue', 'worker', 'cdn', 'sql-db', 'nosql-db'],
    constraints: [
      { kind: 'required-node', node: 'api-server' },
      { kind: 'required-node', node: 'object-store' },
      { kind: 'required-node', node: 'message-queue' },
      { kind: 'required-node', node: 'worker' },
      { kind: 'between', middle: 'message-queue', from: 'api-server', to: 'worker' },
      { kind: 'required-edge', from: 'client', to: 'cdn' },
    ],
    reference: {
      nodes: [n('client'), n('load-balancer'), n('api-server'), n('object-store'), n('message-queue'), n('worker'), n('cdn'), n('sql-db')],
      edges: [
        { from: 'client', to: 'load-balancer' },
        { from: 'load-balancer', to: 'api-server' },
        { from: 'api-server', to: 'object-store' },
        { from: 'api-server', to: 'message-queue' },
        { from: 'message-queue', to: 'worker' },
        { from: 'worker', to: 'object-store' },
        { from: 'client', to: 'cdn' },
        { from: 'cdn', to: 'object-store' },
        { from: 'api-server', to: 'sql-db' },
      ],
    },
  },
];
```

Note: the `news-feed` change is the CDN fix — the old `{ kind: 'required-node', node: 'cdn' }` is replaced by `{ kind: 'required-edge', from: 'client', to: 'cdn' }` (warn-only), so a valid CDN-less feed now passes.

- [ ] **Step 6: Run the content tests to verify they pass**

Run: `npm run test -- src/content/diagram.test.ts`
Expected: PASS (6 tests). If "every scenario reference passes its own constraints" fails for any scenario, that scenario's constraints are over-rigid relative to its reference — fix the scenario data (not the test), keeping the invariant.

- [ ] **Step 7: Run full suite + typecheck**

Run: `npm run test && npx tsc --noEmit`
Expected: PASS. (The `worker` type is exhaustively handled — `componentNames` now covers it; the domain's `checkOne` switch is over `Constraint.kind`, not component type, so no domain change is needed.)

- [ ] **Step 8: Commit**

```bash
git add src/domain/diagram/types.ts src/content/diagram.ts src/content/diagram.test.ts
git commit -m "feat(diagram): 8 graded scenarios (2 per grade) + worker type + news-feed CDN fix"
```

---

### Task 2: Picker grouped by grade

**Files:**
- Modify: `src/features/diagram/Diagram.tsx` (`ScenarioPicker` only)
- Modify: `src/features/diagram/Diagram.test.tsx` (assert grade grouping)

**Interfaces:**
- Consumes: `scenarios` (now with `grade`), `GRADE_ORDER`/`GRADE_LABEL` (`@/lib/labels`), `Badge` (`@/components/Badge`).
- Produces: no new exports; picker renders one section per non-empty grade in `GRADE_ORDER`.

- [ ] **Step 1: Rewrite `ScenarioPicker` to group by grade**

In `src/features/diagram/Diagram.tsx`, add these imports (merge with existing import lines where possible):

```ts
import { GRADE_ORDER, GRADE_LABEL } from '@/lib/labels';
import { Badge } from '@/components/Badge';
```

Replace the entire `ScenarioPicker` function with:

```tsx
function ScenarioPicker() {
  const t = useT();
  const lang = useStore((s) => s.settings.lang);
  const completed = useStore((s) => s.diagram.completed);
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-bright">{t('diagram.title')}</h1>
        <p className="text-sm text-muted">{t('diagram.pickScenario')}</p>
      </header>
      {GRADE_ORDER.map((grade) => {
        const inGrade = scenarios.filter((s) => s.grade === grade);
        if (inGrade.length === 0) return null;
        return (
          <section key={grade} className="space-y-3" aria-labelledby={`dg-grade-${grade}`}>
            <h2 id={`dg-grade-${grade}`} className="text-sm font-bold uppercase tracking-wide text-muted">
              {GRADE_LABEL[grade]}
            </h2>
            <ul className="space-y-3">
              {inGrade.map((sc) => (
                <li key={sc.id}>
                  <Link to={`/diagram/${sc.id}`}
                    className="flex items-center gap-4 rounded-2xl border border-line bg-surface-raised p-5 shadow-card transition hover:-translate-y-0.5 hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                    <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-accent/10 text-accent">
                      <Icon name="diagram" className="h-6 w-6" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="mb-1 flex items-center gap-2">
                        <span className="font-semibold text-bright">{sc.title[lang]}</span>
                        <Badge tone="grade">{GRADE_LABEL[sc.grade]}</Badge>
                      </span>
                      <span className="block truncate text-sm text-muted">{sc.brief[lang]}</span>
                    </span>
                    {completed[sc.id]?.passed && (
                      <span className="flex-none text-good">
                        <Icon name="check" className="h-5 w-5" />
                        <span className="sr-only">{t('diagram.done')}</span>
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
```

Note: the row icon changes from `compare` to `diagram` (the feature's own icon; `compare` was a placeholder in the original).

- [ ] **Step 2: Write the failing picker test**

In `src/features/diagram/Diagram.test.tsx`, add this case inside the existing `describe('Diagram screen', ...)` block:

```tsx
  it('groups the picker by grade with headings and badges', () => {
    renderAt('/diagram');
    // grade section headings (also used as badges → appear more than once)
    expect(screen.getAllByText('Junior').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Lead').length).toBeGreaterThan(0);
    // a known lead scenario renders under its group
    expect(screen.getByText('Video streaming')).toBeInTheDocument();
  });
```

(The existing `beforeEach` sets `lang: 'en'`, so `title.en` values like `Video streaming` render.)

- [ ] **Step 3: Run the picker test to verify it fails, then passes**

Run: `npm run test -- src/features/diagram/Diagram.test.tsx`
Expected: after Step 1, PASS (existing 3 + the new grouping test). If `getByText('Video streaming')` fails, confirm Task 1 added that scenario with `title.en === 'Video streaming'`.

- [ ] **Step 4: Full suite + typecheck + build**

Run: `npm run test && npx tsc --noEmit && npm run build`
Expected: all PASS; build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/features/diagram/Diagram.tsx src/features/diagram/Diagram.test.tsx
git commit -m "feat(diagram): group scenario picker by difficulty grade with badges"
```

---

## Self-Review

**Spec coverage:**
- `grade` field on `Scenario` (reuse `GradeSchema`) → Task 1 Step 4. ✓
- 8 scenarios, 2/2/2/2, 5 new + 3 regraded → Task 1 Step 5. ✓
- news-feed CDN softened to warn (required-edge) → Task 1 Step 5 + guard test Step 2. ✓
- New component type only if needed (`worker` for notifications/video) → Task 1 Steps 1,4. ✓
- Picker grouped by grade with badges, soft gating → Task 2 Step 1. ✓
- Progress/store/engine/canvas unchanged → nothing touches them. ✓
- Tests: grade coverage, 8-count, reference-passes-own-constraints (all 8), news-feed-no-cdn, picker grouping → Tasks 1–2. ✓

**Placeholder scan:** none. All 8 scenarios written in full; the "fix scenario data if over-rigid" note names the concrete action.

**Type consistency:** `grade: Grade` (from `GradeSchema`) used in schema and consumed via `GRADE_ORDER`/`GRADE_LABEL` (both keyed by `Grade`). `worker` added to `COMPONENT_TYPES` and `componentNames` together (the `Record<ComponentType, Localized>` type forces this or tsc fails). `Badge tone="grade"` matches the component's accepted tones. Scenario `title.en` values referenced in the test (`Video streaming`) match Step 5 data.

**Per-scenario invariant spot-check (reference vs constraints):**
- blog-api: req client/api ✓, any-of sql ✓ → passes.
- url-shortener: req client/api/cache ✓, any-of sql ✓, edge api→cache ✓, no message-queue ✓ → passes.
- rate-limiter: req client/rate-limiter/api/cache ✓, between client→rate-limiter→api ✓, edge rate-limiter→cache ✓ → passes.
- file-upload: req client/api/object-store ✓, edge api→object-store ✓, edge client→cdn ✓ → passes.
- news-feed: req client/api/cache ✓, any-of nosql ✓, edge api→cache ✓, edge client→cdn ✓ → passes; without cdn → both edges: client→cdn warn, still passes (guard test).
- chat: req client/api/message-queue/cache ✓, any-of nosql ✓, edge api→message-queue ✓ → passes.
- notifications: req api/message-queue/worker ✓, between api→message-queue→worker ✓, any-of sql ✓ → passes.
- video-streaming: req api/object-store/message-queue/worker ✓, between api→message-queue→worker ✓, edge client→cdn ✓ → passes.
