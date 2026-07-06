# Guided Course (Junior→Lead) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a single linear Junior→Lead guided course over the existing 42-concept catalog: an ordered path, a `/course` screen showing each step's status and the next step, and Dashboard "continue" that resumes at the next step — with soft gating (nothing locked).

**Architecture:** One authored ordering (`content/course.ts`) + pure selectors (`domain/course.ts`) that derive per-step status from existing `isMastered`/`conceptProgress` (no new persisted state). A `features/course/Course.tsx` screen consumes the selectors and the existing `useConcept` resolver, `ProgressBar`, `Badge`, `EmptyState`. Dashboard's continue link points at `selectNextStep`.

**Tech Stack:** React 18, TypeScript (strict), React Router (lazy routes), Zustand, Tailwind (semantic tokens), Vitest + Testing Library, bilingual i18n (`useT` catalog).

## Global Constraints

- No new dependencies. No new persisted store slice — course progress is derived from existing `srs`/`conceptProgress`. No backend.
- Soft gating: every step is a normal `<Link to="/learn/:conceptId">`; nothing is locked.
- The course is a faithful reordering of the catalog: all 42 concept ids appear exactly once; each id's `grade` matches its course group; groups follow `GRADE_ORDER` = `['junior','middle','senior','lead']`.
- Selectors are pure functions over `AppState` (mirroring `isMastered`/`selectGradeProgress` in `src/store/useStore.ts`); components read full state via `const state = useStore();`.
- `isMastered(state, id)` = SM-2 `repetitions >= 2`; status is `mastered` → else `inProgress` if `state.conceptProgress[id]?.seen` → else `notStarted`.
- Bilingual: every new UI string goes through `t(<key>)`; add keys to BOTH `ru` and `en` in `src/i18n/messages.ts` (a parity test enforces equal key sets). `GRADE_LABEL[grade]` is shared (English, both languages).
- After every task: `npx tsc --noEmit` clean and full suite (`npm test`) green.

---

### Task 1: Course data + validation

**Files:**
- Create: `src/content/course.ts`, `src/content/course.test.ts`

**Interfaces:**
- Produces: `COURSE: { grade: Grade; conceptIds: string[] }[]`; `COURSE_ORDER: string[]` (flat, in course order).

- [ ] **Step 1: Write the failing validation test** — `src/content/course.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { concepts, getConcept } from './index';
import { COURSE, COURSE_ORDER } from './course';
import { GRADE_ORDER } from '@/lib/labels';

describe('course ordering', () => {
  it('groups follow GRADE_ORDER', () => {
    expect(COURSE.map((g) => g.grade)).toEqual(GRADE_ORDER);
  });
  it('covers every concept exactly once', () => {
    expect(COURSE_ORDER.length).toBe(concepts.length);
    expect(new Set(COURSE_ORDER).size).toBe(COURSE_ORDER.length);
    expect([...COURSE_ORDER].sort()).toEqual(concepts.map((c) => c.id).sort());
  });
  it('each id exists and its grade matches its course group', () => {
    for (const group of COURSE)
      for (const id of group.conceptIds) {
        const c = getConcept(id);
        expect(c, `${id} should exist`).toBeDefined();
        expect(c!.grade, `${id} grade`).toBe(group.grade);
      }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/content/course.test.ts`
Expected: FAIL — cannot resolve `./course`.

- [ ] **Step 3: Implement `src/content/course.ts`** (the verified ordering — grade groups, category progression within each grade)

```ts
import type { Grade } from './schema';

/**
 * The single guided Junior→Lead path: all 42 concepts, grouped by grade in
 * GRADE_ORDER, ordered within each grade by category progression
 * (solid → creational → structural → behavioral → architecture → tradeoff),
 * then catalog order. A validation test guards completeness + grade-consistency.
 */
export const COURSE: { grade: Grade; conceptIds: string[] }[] = [
  { grade: 'junior', conceptIds: ['srp', 'ocp', 'lsp', 'isp', 'singleton', 'adapter', 'facade', 'iterator', 'layered', 'mvc'] },
  { grade: 'middle', conceptIds: ['dip', 'factory-method', 'builder', 'prototype', 'composite', 'decorator', 'proxy', 'strategy', 'observer', 'chain-of-responsibility', 'command', 'memento', 'template-method', 'mvvm', 'monolith', 'composition-vs-inheritance', 'coupling-cohesion', 'dry-vs-duplication'] },
  { grade: 'senior', conceptIds: ['abstract-factory', 'bridge', 'flyweight', 'state', 'interpreter', 'mediator', 'visitor', 'hexagonal', 'clean-architecture', 'event-driven', 'abstraction-cost', 'yagni-vs-flexibility'] },
  { grade: 'lead', conceptIds: ['microservices', 'performance-vs-readability'] },
];

/** Flat list of concept ids in course order. */
export const COURSE_ORDER: string[] = COURSE.flatMap((g) => g.conceptIds);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/content/course.test.ts`
Expected: PASS (3 tests). If "covers every concept exactly once" fails, an id is missing/duplicated/misspelled; if the grade test fails, an id is in the wrong group — fix `course.ts`, not the test.

- [ ] **Step 5: Commit**

```bash
git add src/content/course.ts src/content/course.test.ts
git commit -m "feat: guided course ordering (Junior to Lead path) with validation"
```

---

### Task 2: Course progress selectors

**Files:**
- Create: `src/domain/course.ts`, `src/domain/course.test.ts`

**Interfaces:**
- Consumes: `COURSE` (Task 1); `AppState`, `isMastered` from `@/store/useStore`; `Grade` from `@/content/schema`.
- Produces: `type StepStatus = 'mastered' | 'inProgress' | 'notStarted'`; `interface CourseStep { conceptId: string; grade: Grade; status: StepStatus; isNext: boolean }`; `selectCourseSteps(state): CourseStep[]`; `selectNextStep(state): string | undefined`; `selectCourseProgress(state): { mastered: number; total: number; pct: number }`.

- [ ] **Step 1: Write the failing test** — `src/domain/course.test.ts`

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '@/store/useStore';
import { selectCourseSteps, selectNextStep, selectCourseProgress } from './course';
import { COURSE_ORDER } from '@/content/course';

const master = (id: string) =>
  useStore.setState((s) => ({ srs: { ...s.srs, [id]: { conceptId: id, ease: 2.5, interval: 6, repetitions: 2, due: '2099-01-01' } } }));
const see = (id: string) =>
  useStore.setState((s) => ({ conceptProgress: { ...s.conceptProgress, [id]: { seen: true } } }));

describe('course selectors', () => {
  beforeEach(() => useStore.getState().resetProgress());

  it('fresh state: all notStarted, next = first course step, 0% progress', () => {
    const state = useStore.getState();
    const first = COURSE_ORDER[0];
    expect(selectNextStep(state)).toBe(first);
    const steps = selectCourseSteps(state);
    expect(steps.length).toBe(COURSE_ORDER.length);
    expect(steps.every((s) => s.status === 'notStarted')).toBe(true);
    expect(steps.find((s) => s.isNext)!.conceptId).toBe(first);
    expect(selectCourseProgress(state)).toEqual({ mastered: 0, total: COURSE_ORDER.length, pct: 0 });
  });

  it('seen -> inProgress; mastering the first advances next to the second', () => {
    const [first, second] = COURSE_ORDER;
    see(first);
    expect(selectCourseSteps(useStore.getState()).find((s) => s.conceptId === first)!.status).toBe('inProgress');
    master(first);
    const state = useStore.getState();
    expect(selectCourseSteps(state).find((s) => s.conceptId === first)!.status).toBe('mastered');
    expect(selectNextStep(state)).toBe(second);
    expect(selectCourseProgress(state).mastered).toBe(1);
  });

  it('all mastered -> next is undefined', () => {
    COURSE_ORDER.forEach(master);
    const state = useStore.getState();
    expect(selectNextStep(state)).toBeUndefined();
    expect(selectCourseProgress(state).pct).toBe(100);
    expect(selectCourseSteps(state).some((s) => s.isNext)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/domain/course.test.ts`
Expected: FAIL — cannot resolve `./course`.

- [ ] **Step 3: Implement `src/domain/course.ts`**

```ts
import type { AppState } from '@/store/useStore';
import { isMastered } from '@/store/useStore';
import { COURSE } from '@/content/course';
import type { Grade } from '@/content/schema';

export type StepStatus = 'mastered' | 'inProgress' | 'notStarted';
export interface CourseStep { conceptId: string; grade: Grade; status: StepStatus; isNext: boolean; }

function stepStatus(state: AppState, id: string): StepStatus {
  if (isMastered(state, id)) return 'mastered';
  if (state.conceptProgress[id]?.seen) return 'inProgress';
  return 'notStarted';
}

/** First concept in course order that is not yet mastered; undefined when all are mastered. */
export function selectNextStep(state: AppState): string | undefined {
  for (const group of COURSE)
    for (const id of group.conceptIds)
      if (!isMastered(state, id)) return id;
  return undefined;
}

export function selectCourseSteps(state: AppState): CourseStep[] {
  const nextId = selectNextStep(state);
  return COURSE.flatMap((group) =>
    group.conceptIds.map((conceptId) => ({
      conceptId,
      grade: group.grade,
      status: stepStatus(state, conceptId),
      isNext: conceptId === nextId,
    })),
  );
}

export function selectCourseProgress(state: AppState): { mastered: number; total: number; pct: number } {
  const ids = COURSE.flatMap((g) => g.conceptIds);
  const mastered = ids.filter((id) => isMastered(state, id)).length;
  const total = ids.length;
  return { mastered, total, pct: total === 0 ? 0 : Math.round((mastered / total) * 100) };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/domain/course.test.ts && npx tsc --noEmit`
Expected: PASS (3 tests); tsc clean.

- [ ] **Step 5: Commit**

```bash
git add src/domain/course.ts src/domain/course.test.ts
git commit -m "feat: course progress selectors (next step, per-step status, progress)"
```

---

### Task 3: Course screen + route + nav + i18n keys

**Files:**
- Create: `src/features/course/Course.tsx`, `src/features/course/Course.test.tsx`
- Modify: `src/i18n/messages.ts` (add course keys to `ru` and `en`), `src/app/App.tsx` (route), `src/app/Layout.tsx` (nav item)

**Interfaces:**
- Consumes: `selectCourseSteps`, `selectNextStep`, `selectCourseProgress`, `CourseStep` (Task 2); `useConcept` (`@/content/localize`); `ProgressBar`, `Badge`, `EmptyState`; `useT`; `GRADE_ORDER`, `GRADE_LABEL`.
- Produces: `export function Course(): JSX.Element`.

- [ ] **Step 1: Add course keys to `src/i18n/messages.ts`**

In the `ru` object (before the closing `} as const;`), add:

```ts
  'nav.course': 'Курс',
  'course.title': 'Курс',
  'course.continue': 'Продолжить →',
  'course.progress': 'Освоено {mastered}/{total}',
  'course.mastered': 'Освоено',
  'course.inProgress': 'В процессе',
  'course.notStarted': 'Не начато',
  'course.done': 'Курс пройден! 🎓',
```

In the `en` object (`const en: Record<MessageKey, string> = { ... }`), add the matching keys:

```ts
  'nav.course': 'Course',
  'course.title': 'Course',
  'course.continue': 'Continue →',
  'course.progress': '{mastered}/{total} mastered',
  'course.mastered': 'Mastered',
  'course.inProgress': 'In progress',
  'course.notStarted': 'Not started',
  'course.done': 'Course complete! 🎓',
```

Run: `npx vitest run src/i18n/messages.test.ts` → PASS (key-parity test still green; if it fails, a key is missing from one language).

- [ ] **Step 2: Write the failing Course screen test** — `src/features/course/Course.test.tsx`

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Course } from './Course';
import { useStore } from '@/store/useStore';

describe('Course screen', () => {
  beforeEach(() => useStore.getState().resetProgress());

  it('renders the four grade sections and the progress summary (ru)', () => {
    useStore.getState().setSettings({ lang: 'ru' });
    render(<MemoryRouter><Course /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: 'Курс' })).toBeInTheDocument();
    for (const g of ['Junior', 'Middle', 'Senior', 'Lead'])
      expect(screen.getByRole('heading', { name: g })).toBeInTheDocument();
    // first step highlighted with its concept name (srp = "Single Responsibility Principle")
    expect(screen.getByText('Single Responsibility Principle')).toBeInTheDocument();
  });

  it('renders in English', () => {
    useStore.getState().setSettings({ lang: 'en' });
    render(<MemoryRouter><Course /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: 'Course' })).toBeInTheDocument();
    expect(screen.getAllByText('Not started').length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/features/course/Course.test.tsx`
Expected: FAIL — cannot resolve `./Course`.

- [ ] **Step 4: Implement `src/features/course/Course.tsx`**

```tsx
import { Link } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { selectCourseSteps, selectCourseProgress, selectNextStep, type CourseStep } from '@/domain/course';
import { useConcept } from '@/content/localize';
import { ProgressBar } from '@/components/ProgressBar';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { useT } from '@/i18n/useT';
import { GRADE_ORDER, GRADE_LABEL } from '@/lib/labels';

function StepRow({ step }: { step: CourseStep }) {
  const c = useConcept(step.conceptId);
  const t = useT();
  if (!c) return null;
  const statusKey =
    step.status === 'mastered' ? 'course.mastered' : step.status === 'inProgress' ? 'course.inProgress' : 'course.notStarted';
  return (
    <Link to={`/learn/${step.conceptId}`}
      className={`block rounded-xl border p-4 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft ${step.isNext ? 'border-accent-soft bg-surface-raised' : 'border-surface-muted hover:border-accent-soft'}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold">{step.status === 'mastered' ? '✓ ' : ''}{c.name}</span>
        <Badge tone={step.status === 'mastered' ? 'grade' : 'neutral'}>{t(statusKey)}</Badge>
      </div>
      <p className="mt-1 text-sm text-muted">{c.tagline}</p>
      {step.isNext && <div className="mt-2 text-xs text-accent-soft">{t('course.continue')}</div>}
    </Link>
  );
}

export function Course() {
  const state = useStore();
  const t = useT();
  const steps = selectCourseSteps(state);
  const progress = selectCourseProgress(state);
  const done = selectNextStep(state) === undefined;

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold">{t('course.title')}</h1>
        <ProgressBar value={progress.pct} label={t('course.progress', { mastered: progress.mastered, total: progress.total })} />
      </header>
      {done && <EmptyState icon="🎓" title={t('course.done')} />}
      {GRADE_ORDER.map((g) => (
        <section key={g} className="space-y-3">
          <h2 className="text-xl font-semibold">{GRADE_LABEL[g]}</h2>
          <div className="space-y-2">
            {steps.filter((s) => s.grade === g).map((s) => <StepRow key={s.conceptId} step={s} />)}
          </div>
        </section>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Register the route in `src/app/App.tsx`**

In the `children` array, add after the `learn/:conceptId?` entry:

```tsx
      { path: 'course', lazy: () => import('@/features/course/Course').then((m) => ({ Component: m.Course })) },
```

- [ ] **Step 6: Add the nav item in `src/app/Layout.tsx`**

In the `NAV` array, insert after the dashboard entry:

```tsx
  { to: '/course', key: 'nav.course' },
```

- [ ] **Step 7: Run tests + typecheck**

Run: `npx vitest run src/features/course/Course.test.tsx src/i18n/messages.test.ts && npx tsc --noEmit`
Expected: Course tests PASS (2); messages parity PASS; tsc clean.

- [ ] **Step 8: Commit**

```bash
git add src/features/course src/i18n/messages.ts src/app/App.tsx src/app/Layout.tsx
git commit -m "feat: course screen, route, nav item, and i18n keys"
```

---

### Task 4: Dashboard resume wiring + final verification

**Files:**
- Modify: `src/features/dashboard/Dashboard.tsx`; `src/features/dashboard/Dashboard.test.tsx` (only if it asserts the continue-link target)

**Interfaces:**
- Consumes: `selectNextStep`, `selectCourseProgress` (Task 2); `useT`.

- [ ] **Step 1: Wire the "continue" link to the next step + add a course-progress link**

In `src/features/dashboard/Dashboard.tsx`:
- Add imports: `import { selectNextStep, selectCourseProgress } from '@/domain/course';`
- Inside `Dashboard()`, after `const state = useStore();`, add:
  ```tsx
  const next = selectNextStep(state);
  const courseProgress = selectCourseProgress(state);
  ```
- Change the continue `Link` target from `to="/learn"` to:
  ```tsx
  <Link to={next ? `/learn/${next}` : '/course'} className="inline-block rounded-lg bg-accent px-5 py-2.5 font-medium text-white hover:bg-accent-strong">
    {t('dashboard.continueLearning')}
  </Link>
  ```
- Directly below that link, add a course-progress link:
  ```tsx
  <Link to="/course" className="block mt-3 text-sm text-accent-soft hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft rounded">
    {t('course.progress', { mastered: courseProgress.mastered, total: courseProgress.total })}
  </Link>
  ```

- [ ] **Step 2: Keep the Dashboard test green**

Run: `npx vitest run src/features/dashboard/Dashboard.test.tsx`
If it fails only because it asserted the old `to="/learn"` link or a single "continue" link, update the assertion: with a fresh store `selectNextStep` returns `'srp'`, so the continue link points to `/learn/srp`. Adjust the test to match (do not weaken unrelated assertions). If it passes, make no change.

- [ ] **Step 3: Full verification**

Run: `npx tsc --noEmit && npm test 2>&1 | tail -5 && npm run build 2>&1 | tail -6`
Expected: tsc clean; all tests pass; build succeeds with no chunk-size warning.

- [ ] **Step 4: Manual browser check (coordinator)** — open `/course`: four grade sections, statuses, the next step highlighted with "Continue"; Dashboard "continue" jumps to the next step's Learn page; toggle RU↔EN and confirm the course screen is bilingual.

- [ ] **Step 5: Commit**

```bash
git add src/features/dashboard/Dashboard.tsx src/features/dashboard/Dashboard.test.tsx
git commit -m "feat: dashboard resumes at the next course step"
```

---

## Self-Review Notes

- **Spec coverage:** §2 course model → Task 1; §3 selectors → Task 2; §4 screen/route/nav + Dashboard wiring → Tasks 3-4; §5 i18n keys → Task 3 Step 1; §7 tests → each task's tests + Task 4 verification. §1 soft gating (all steps are plain Links) honored in Task 3's `StepRow`.
- **No new persisted state:** selectors derive from `srs`/`conceptProgress` (Task 2) — matches spec §1/§3.
- **Type consistency:** `StepStatus`/`CourseStep`/`selectCourseSteps`/`selectNextStep`/`selectCourseProgress`/`COURSE`/`COURSE_ORDER` names identical across Tasks 1-4. `ProgressBar` uses `{value,label}`; `Badge` tones `grade`/`neutral`; `GRADE_LABEL[grade]` (shared, not `[lang]`). Course i18n keys used in Task 3 are all defined in Task 3 Step 1.
- **Rules of hooks:** `StepRow` calls `useConcept`/`useT` unconditionally before its `if (!c) return null`; each step is its own component, so the hook is not called in a loop within one component.
- **Known:** `resetProgress()` in tests also re-defaults settings (theme/lang) — harmless; tests set `lang` explicitly where they assert language.
