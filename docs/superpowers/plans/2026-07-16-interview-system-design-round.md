# Interview System-Design Round Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an optional system-design round to Interview — after the MC ladder, the candidate builds a diagram (reusing Diagram Builder) for a grade-matched scenario; the result is a separate section in the final report (it does not affect the grade).

**Architecture:** A pure `selectSdScenario` helper picks a scenario by reached grade. The Diagram Builder's building UI is extracted into a reusable `ScenarioWorkbench` (parametrized by `header` + `onSubmit`) so `/diagram` and Interview share it with zero duplication. Interview gains an intro toggle, a `system-design` phase after the MC ladder, and a "System design" report section. The adaptive machine and the `interviews` persist slice are unchanged.

**Tech Stack:** React + TS + Vite, Vitest.

## Global Constraints

- **SD round does not affect the grade.** `machine.ts` and the `interviews` store slice are unchanged; the SD result is session-only.
- **No duplication:** the interview reuses the extracted `ScenarioWorkbench`; `/diagram` behavior is unchanged (existing `Diagram.test.tsx` is the regression guard).
- **Optional** via an intro toggle; scenario matched to `verdict ?? 'junior'`.
- Bilingual (ru+en). No new npm dependency. No Co-Authored-By / Claude attribution in commits. Commit after each task.

---

### Task 1: Pure `selectSdScenario` helper

**Files:**
- Create: `src/domain/interview/sdScenario.ts`
- Test: `src/domain/interview/sdScenario.test.ts`

**Interfaces:**
- Produces: `GradedScenarioLike`, `selectSdScenario(scenarios, grade, shuffle): T | undefined`.

- [ ] **Step 1: Write the failing test**

Create `src/domain/interview/sdScenario.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { selectSdScenario, type GradedScenarioLike } from './sdScenario';
import type { Grade } from '@/content/schema';

const s = (id: string, grade: Grade): GradedScenarioLike => ({ id, grade });
function ident<U>(a: U[]): U[] { return a; } // deterministic "shuffle"

describe('selectSdScenario', () => {
  it('picks a scenario of the requested grade', () => {
    const list = [s('a', 'junior'), s('b', 'senior'), s('c', 'senior')];
    expect(selectSdScenario(list, 'senior', ident)?.grade).toBe('senior');
  });

  it('falls back to any scenario when none match the grade', () => {
    const list = [s('a', 'junior')];
    expect(selectSdScenario(list, 'lead', ident)?.id).toBe('a');
  });

  it('is deterministic given a deterministic shuffle', () => {
    const list = [s('a', 'middle'), s('b', 'middle')];
    expect(selectSdScenario(list, 'middle', ident)).toEqual(selectSdScenario(list, 'middle', ident));
  });

  it('returns undefined for empty input', () => {
    expect(selectSdScenario([], 'junior', ident)).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run it (fails: no module)**

Run: `npm run test -- src/domain/interview/sdScenario.test.ts` → FAIL (`Cannot find module './sdScenario'`).

- [ ] **Step 3: Implement**

Create `src/domain/interview/sdScenario.ts`:

```ts
import type { Grade } from '@/content/schema';

export interface GradedScenarioLike { id: string; grade: Grade }

/**
 * Picks a scenario of the reached grade (deterministic via the passed shuffle).
 * Falls back to any scenario if none match; undefined only for an empty list.
 */
export function selectSdScenario<T extends GradedScenarioLike>(
  scenarios: T[],
  grade: Grade,
  shuffle: <U>(a: U[]) => U[],
): T | undefined {
  const atGrade = shuffle(scenarios.filter((sc) => sc.grade === grade));
  if (atGrade.length > 0) return atGrade[0];
  return shuffle(scenarios)[0];
}
```

- [ ] **Step 4: Run it (passes)**

Run: `npm run test -- src/domain/interview/sdScenario.test.ts` → PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/domain/interview/sdScenario.ts src/domain/interview/sdScenario.test.ts
git commit -m "feat(interview): pure selectSdScenario helper"
```

---

### Task 2: Extract `ScenarioWorkbench` from the Diagram Builder

**Files:**
- Create: `src/features/diagram/ScenarioWorkbench.tsx`
- Modify: `src/features/diagram/Diagram.tsx` (`ScenarioBuilder` becomes a thin wrapper; clean up now-unused imports)

**Interfaces:**
- Produces: `ScenarioWorkbench` component `{ scenario: Scenario; header?: ReactNode; onSubmit?: (results: CheckResult[], passed: boolean) => void }`.

**Goal:** move the building UI out of `ScenarioBuilder` verbatim, with two seams: a `header` slot and an `onSubmit` callback fired on Check (in addition to showing the report). `/diagram` behavior stays identical.

- [ ] **Step 1: Create ScenarioWorkbench**

Create `src/features/diagram/ScenarioWorkbench.tsx` with the exact content below (this is the current `ScenarioBuilder` body, with the header replaced by a `header` prop and `completeScenario` replaced by `onSubmit`):

```tsx
import { lazy, Suspense, useMemo, useState, type ReactNode } from 'react';
import { validate, isPassed } from '@/domain/diagram/validate';
import { diffDiagrams } from '@/domain/diagram/diff';
import { addNode, removeNode, addEdge, removeEdge, emptyDiagram } from '@/domain/diagram/edit';
import type { Diagram as Dgm, ComponentType, CheckResult } from '@/domain/diagram/types';
import { gridSlot, type XY } from '@/domain/diagram/positions';
import { useStore } from '@/store/useStore';
import { Icon } from '@/components/Icon';
import { useT } from '@/i18n/useT';
import type { Scenario } from '@/content/diagram';
import { ListBuilder } from './ListBuilder';
import { Report } from './Report';
import { useComponentName } from './useComponentName';
import { DND_MIME } from './dnd';
import type { Note } from './CanvasBuilder';

const CanvasBuilder = lazy(() => import('./CanvasBuilder').then((m) => ({ default: m.CanvasBuilder })));
const DiffCanvas = lazy(() => import('./DiffCanvas').then((m) => ({ default: m.DiffCanvas })));

interface Props {
  scenario: Scenario;
  header?: ReactNode;
  onSubmit?: (results: CheckResult[], passed: boolean) => void;
}

export function ScenarioWorkbench({ scenario, header, onSubmit }: Props) {
  const t = useT();
  const lang = useStore((s) => s.settings.lang);
  const theme = useStore((s) => s.settings.theme);
  const name = useComponentName();
  const [diagram, setDiagram] = useState<Dgm>(emptyDiagram);
  const [positions, setPositions] = useState<Record<string, XY>>({});
  const [counter, setCounter] = useState(0);
  const [results, setResults] = useState<CheckResult[] | null>(null);
  const [view, setView] = useState<'list' | 'canvas'>('list');
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
  const connect = (from: string, to: string) => { setDiagram((d) => addEdge(d, from, to)); setResults(null); };
  const disconnect = (from: string, to: string) => { setDiagram((d) => removeEdge(d, from, to)); setResults(null); };
  const reset = () => { setDiagram(emptyDiagram); setPositions({}); setNotes([]); setResults(null); };

  const submit = () => {
    const r = validate(diagram, scenario.constraints);
    setResults(r);
    onSubmit?.(r, isPassed(r));
  };

  const passed = results != null && isPassed(results);
  const diff = useMemo(
    () => (results ? diffDiagrams(diagram, scenario.reference) : null),
    [results, diagram, scenario.reference],
  );
  const refPositions = useMemo(
    () => Object.fromEntries(scenario.reference.nodes.map((nd, i) => [nd.id, gridSlot(i)])),
    [scenario.reference],
  );

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {header}

      <div className="flex gap-2" role="group" aria-label={t('diagram.title')}>
        <button type="button" onClick={() => setView('list')} aria-pressed={view === 'list'}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${view === 'list' ? 'bg-accent/10 text-accent' : 'text-muted hover:text-content'}`}>
          {t('diagram.viewList')}
        </button>
        <button type="button" onClick={() => setView('canvas')} aria-pressed={view === 'canvas'}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${view === 'canvas' ? 'bg-accent/10 text-accent' : 'text-muted hover:text-content'}`}>
          {t('diagram.viewCanvas')}
        </button>
      </div>

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
                <button key={type} type="button" draggable
                  onDragStart={(e) => e.dataTransfer.setData(DND_MIME, type)}
                  onClick={() => add(type)}
                  className="cursor-grab rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-content transition hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent active:cursor-grabbing">
                  + {name(type)}
                </button>
              ))}
              <button type="button" onClick={addNote}
                className="rounded-lg border border-dashed border-line px-3 py-2 text-sm font-medium text-muted transition hover:border-line-strong hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                {t('diagram.addNote')}
              </button>
            </div>
            <Suspense fallback={<div className="h-[420px] animate-pulse rounded-xl bg-surface" />}>
              <CanvasBuilder
                diagram={diagram} positions={positions} notes={notes}
                onAdd={add} onConnect={connect} onRemoveNode={rmNode} onDisconnect={disconnect} onMove={move}
                onEditNote={editNote} onMoveNote={moveNote} onRemoveNote={removeNote}
              />
            </Suspense>
          </div>
        )}
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
          <Report results={results} explanations={scenario.constraints.map((c) => c.explain?.[lang])} />
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
        </section>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Rewrite ScenarioBuilder as a thin wrapper**

In `src/features/diagram/Diagram.tsx`, replace the entire `ScenarioBuilder` function with:

```tsx
function ScenarioBuilder({ scenario }: { scenario: Scenario }) {
  const t = useT();
  const lang = useStore((s) => s.settings.lang);
  const completeScenario = useStore((s) => s.completeScenario);
  return (
    <ScenarioWorkbench
      scenario={scenario}
      header={
        <header className="space-y-2">
          <Link to="/diagram" className="text-sm font-medium text-accent hover:underline">← {t('diagram.title')}</Link>
          <h1 className="text-2xl font-semibold tracking-tight text-bright">{scenario.title[lang]}</h1>
          <p className="text-content [text-wrap:pretty]">{scenario.brief[lang]}</p>
        </header>
      }
      onSubmit={(_, passed) => completeScenario(scenario.id, passed, todayISO())}
    />
  );
}
```

- [ ] **Step 3: Fix Diagram.tsx imports**

Add: `import { ScenarioWorkbench } from './ScenarioWorkbench';`

Remove the imports now only used by the moved code (tsc `noUnusedLocals` will flag any missed): `lazy`, `Suspense` (keep `useMemo`, `useState` if still used by `Diagram`/`ScenarioPicker` — `useMemo` is used in `Diagram`; `useState` is likely no longer used → drop it if so), `validate`/`isPassed`, `diffDiagrams`, `addNode`/`removeNode`/`addEdge`/`removeEdge`/`emptyDiagram`, the `Diagram as Dgm`/`ComponentType`/`CheckResult` types, `gridSlot`/`XY`, `ListBuilder`, `Report`, `useComponentName`, `DND_MIME`, `Note`, and the `CanvasBuilder`/`DiffCanvas` `lazy(...)` consts. Keep: `useMemo`, `Link`, `useParams`, `scenarios`/`Scenario`, `useStore`, `todayISO`, `EmptyState`, `Icon`, `Badge`, `useT`, `GRADE_ORDER`/`GRADE_LABEL`.

Let `npx tsc --noEmit` drive this — remove exactly what it reports as unused, keep the rest.

- [ ] **Step 4: Typecheck, full suite, build**

Run: `npx tsc --noEmit && npm run test && npm run build`
Expected: all PASS. The existing `src/features/diagram/Diagram.test.tsx` (list-builder smoke) must stay green — it renders `ScenarioBuilder` → now `ScenarioWorkbench`; unchanged behavior. Confirm the `CanvasBuilder`/`DiffCanvas` lazy chunks still emit (`ls dist/assets | grep -iE 'CanvasBuilder|DiffCanvas'`).

- [ ] **Step 5: Commit**

```bash
git add src/features/diagram/ScenarioWorkbench.tsx src/features/diagram/Diagram.tsx
git commit -m "refactor(diagram): extract reusable ScenarioWorkbench (no behavior change)"
```

---

### Task 3: Interview system-design round

**Files:**
- Modify: `src/features/interview/Interview.tsx`
- Modify: `src/i18n/messages.ts` (ru+en)
- Test: `src/features/interview/Interview.test.tsx` (intro toggle) — create if absent, else extend

**Interfaces:**
- Consumes: `selectSdScenario` (Task 1), `ScenarioWorkbench` (Task 2), `scenarios` (`@/content/diagram`).

- [ ] **Step 1: Add i18n keys**

In `src/i18n/messages.ts`, add to `ru` (near other `interview.*`):

```ts
  'interview.includeSdRound': 'Включить system-design раунд',
  'interview.systemDesignRound': 'Раунд: System Design',
  'interview.finish': 'Завершить',
  'interview.systemDesign': 'System Design',
  'interview.sdPassed': 'схема принята',
  'interview.sdIssues': 'есть замечания',
```
and to `en`:

```ts
  'interview.includeSdRound': 'Include a system-design round',
  'interview.systemDesignRound': 'Round: System Design',
  'interview.finish': 'Finish',
  'interview.systemDesign': 'System Design',
  'interview.sdPassed': 'diagram accepted',
  'interview.sdIssues': 'some notes',
```

- [ ] **Step 2: Wire the SD round into Interview.tsx**

In `src/features/interview/Interview.tsx`:

Add imports:
```ts
import { scenarios, type Scenario } from '@/content/diagram';
import { selectSdScenario } from '@/domain/interview/sdScenario';
import { ScenarioWorkbench } from '@/features/diagram/ScenarioWorkbench';
```

In the `Interview` component, add `lang` and the SD session state (next to the existing state):
```ts
  const lang = useStore((s) => s.settings.lang);
  const [includeSd, setIncludeSd] = useState(false);
  const [sdScenario, setSdScenario] = useState<Scenario | null>(null);
  const [sdResult, setSdResult] = useState<{ scenarioId: string; passed: boolean } | null>(null);
  const [finished, setFinished] = useState(false);
```

In `start()`, reset the SD fields (keep `includeSd` as the user set it):
```ts
  function start() {
    recorded.current = false;
    setSdScenario(null);
    setSdResult(null);
    setFinished(false);
    const { state, question } = drawNext(initInterview(), deck, shuffle);
    setSession(state);
    setCurrentId(question?.id ?? null);
  }
```

In `answer()`, after `setSession(state); setCurrentId(question?.id ?? null);`, pick the SD scenario once when the ladder ends:
```ts
    if (state.status === 'done' && includeSd) {
      setSdScenario(selectSdScenario(scenarios, state.verdict ?? 'junior', shuffle) ?? null);
    }
```

Add the SD toggle to the Intro card — insert this block just before the `<div className="flex justify-center">` that holds the Start button:
```tsx
          <label className="flex items-center justify-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={includeSd} onChange={(e) => setIncludeSd(e.target.checked)}
              className="h-4 w-4 rounded border-line-strong text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" />
            {t('interview.includeSdRound')}
          </label>
```

Replace the done-state line `if (session.status === 'done') return <Report … />;` with the SD-phase branch:
```tsx
  if (session.status === 'done') {
    if (includeSd && sdScenario && !finished) {
      return (
        <div className="space-y-6">
          <ScenarioWorkbench
            scenario={sdScenario}
            header={
              <header className="space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight text-bright">{t('interview.systemDesignRound')}</h1>
                <p className="text-content [text-wrap:pretty]">{sdScenario.brief[lang]}</p>
              </header>
            }
            onSubmit={(_, passed) => setSdResult({ scenarioId: sdScenario.id, passed })}
          />
          {sdResult && (
            <div className="mx-auto flex max-w-3xl justify-center">
              <button onClick={() => setFinished(true)} className={PRIMARY_BTN}>{t('interview.finish')}</button>
            </div>
          )}
        </div>
      );
    }
    return (
      <Report
        session={session} byId={byId} conceptName={conceptName} onRestart={start}
        sdResult={sdResult}
        sdScenarioTitle={sdScenario ? sdScenario.title[lang] : null}
      />
    );
  }
```

- [ ] **Step 3: Add the System Design section to the Report**

In the `Report` function signature, add the two optional props:
```tsx
function Report({
  session, byId, conceptName, onRestart, sdResult, sdScenarioTitle,
}: {
  session: InterviewState;
  byId: Map<string, QuestionView>;
  conceptName: Map<string, string>;
  onRestart: () => void;
  sdResult?: { scenarioId: string; passed: boolean } | null;
  sdScenarioTitle?: string | null;
}) {
```

Add this section inside the report (e.g. right after the per-grade `{perGrade.length > 0 && …}` section):
```tsx
      {sdResult && (
        <section className="space-y-2 rounded-2xl border border-line bg-surface-raised p-6 shadow-card">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">{t('interview.systemDesign')}</h2>
          <p className="flex items-center gap-2 text-content">
            <Icon name={sdResult.passed ? 'check' : 'bolt'} className={`h-4 w-4 ${sdResult.passed ? 'text-good' : 'text-accent'}`} />
            <span>{sdScenarioTitle}{sdScenarioTitle ? ' — ' : ''}{sdResult.passed ? t('interview.sdPassed') : t('interview.sdIssues')}</span>
          </p>
        </section>
      )}
```

- [ ] **Step 4: Add an intro-toggle test**

Create (or extend) `src/features/interview/Interview.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Interview } from './Interview';
import { useStore } from '@/store/useStore';

beforeEach(() => useStore.getState().setSettings({ lang: 'en' }));

const renderInterview = () => render(<MemoryRouter><Interview /></MemoryRouter>);

describe('Interview intro', () => {
  it('offers the system-design round toggle, unchecked by default', () => {
    renderInterview();
    const cb = screen.getByRole('checkbox', { name: /system-design round/i });
    expect(cb).toBeInTheDocument();
    expect(cb).not.toBeChecked();
  });
});
```

- [ ] **Step 5: Typecheck, full suite, build**

Run: `npx tsc --noEmit && npm run test && npm run build`
Expected: all PASS (new intro test + existing interview/diagram tests green).

- [ ] **Step 6: Browser-verify**

Run `npm run preview`, open `/interview`. With the SD toggle ON, answer questions until the ladder ends → confirm a "Round: System Design" screen appears with a scenario matched to the reached grade, build+Check shows the ✓/⚠/✗ report + diff, then "Finish" → the final report shows a "System Design" section (passed/issues). Repeat with the toggle OFF → the interview ends at the report with no SD round. Check dark + light.

- [ ] **Step 7: Commit**

```bash
git add src/features/interview/Interview.tsx src/i18n/messages.ts src/features/interview/Interview.test.tsx
git commit -m "feat(interview): optional system-design round after the MC ladder"
```

---

## Self-Review

**Spec coverage:**
- Pure `selectSdScenario` (grade match + fallback + deterministic) → Task 1. ✓
- Reusable `ScenarioWorkbench` (header + onSubmit seams); `/diagram` unchanged → Task 2. ✓
- Intro toggle; SD phase after the MC ladder; scenario by `verdict ?? 'junior'`; Finish → report → Task 3. ✓
- SD result is a separate report section, session-only; machine + `interviews` persist unchanged → Task 3 (no store/machine edits). ✓
- Bilingual keys; intro-toggle test; existing tests as regression guard; SD phase browser-verified → Tasks 1–3. ✓

**Placeholder scan:** none — full ScenarioWorkbench, wrapper, Interview edits, i18n, and tests are given verbatim. The import-cleanup step is driven by `tsc` (concrete), not a vague "clean up".

**Type consistency:** `ScenarioWorkbench` props `{ scenario, header?, onSubmit? }` — `/diagram` passes `header` + `onSubmit` (completeScenario); Interview passes `header` + `onSubmit` (setSdResult). `onSubmit(results: CheckResult[], passed: boolean)` matches both call sites. `selectSdScenario(scenarios, Grade, shuffle)` — `scenarios` (from `@/content/diagram`) items are `{id, grade, …}` (satisfy `GradedScenarioLike`); `shuffle` is the existing `Interview` shuffle `<T>(a:T[])=>T[]`. `Report` gains optional `sdResult`/`sdScenarioTitle`; `/diagram` never renders this `Report` (it's Interview-local), so no other caller. `sdScenario` state typed `Scenario | null`.
