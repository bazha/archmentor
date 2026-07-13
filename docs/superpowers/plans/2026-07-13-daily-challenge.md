# Daily Challenge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Daily Challenge" — one deterministic-by-date quiz question per day with its own day-streak, reachable from a Dashboard card and `/daily` (and ⌘K).

**Architecture:** A pure `selectDailyQuestion(questions, dateISO)` hashes the calendar date to a stable index into the existing question bank. A new persisted `daily` store slice tracks the day-streak and today's completion; `completeDaily` bumps both the daily streak and the global activity streak (no `quizResults` write). The `Daily` screen reuses the Quiz answer UI; a Dashboard card shows status + streak. Persist version bumps 2→3, preserving existing progress.

**Tech Stack:** React 18 + TypeScript (strict), Vite, Tailwind (semantic CSS-variable tokens), Zustand (+persist), react-router-dom 6.30, Vitest + Testing Library. In-house i18n (`src/i18n/messages.ts`, `useT`).

## Global Constraints

- Tokens only: semantic Tailwind tokens (`bg-surface-raised`, `border-line`/`border-line-strong`, `text-content`/`text-bright`/`text-muted`/`text-faint`, `accent`/`accent-strong`, `text-on-accent`, `good`/`bad`). No raw hex or palette colors (`slate-*`, `indigo-*`). No new colors-for-text (keep `contrast.test.ts` green).
- i18n: every user-visible string via `t()`; add keys to BOTH `ru` and `en` in `src/i18n/messages.ts` (parity enforced by the `en: Record<MessageKey, string>` type + parity test). Reuse `quiz.explanation` for the explanation label — do NOT add a new key for it.
- No `Math.random`, no `Date.now()`/`new Date()` in domain code — the date comes in as a string argument (`todayISO()` from `src/lib/date.ts`).
- No schema/content changes; no new dependencies; no sidebar nav item and no new mode icon (reuse the existing `bolt` icon for the ⌘K entry).
- Persist migration must preserve existing progress (srs/streak/quiz/interviews/conceptProgress/settings).
- Bilingual RU/EN, both themes.

---

### Task 1: `selectDailyQuestion` domain helper

**Files:**
- Create: `src/domain/daily/selection.ts`
- Test: `src/domain/daily/selection.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `function selectDailyQuestion<T>(questions: T[], dateISO: string): T | undefined` — deterministic pick by calendar date (stable within a day, varies by day); `undefined` when `questions` is empty.

- [ ] **Step 1: Write the failing test**

Create `src/domain/daily/selection.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { selectDailyQuestion } from './selection';

const bank = Array.from({ length: 10 }, (_, i) => ({ id: `q${i}` }));

describe('selectDailyQuestion', () => {
  it('is stable for a given date and returns an item from the pool', () => {
    const a = selectDailyQuestion(bank, '2026-07-13');
    const b = selectDailyQuestion(bank, '2026-07-13');
    expect(a).toBe(b);
    expect(bank).toContain(a);
  });

  it('varies across a month of dates (covers more than one question)', () => {
    const picks = Array.from({ length: 28 }, (_, i) => {
      const day = String(i + 1).padStart(2, '0');
      return selectDailyQuestion(bank, `2026-07-${day}`)!.id;
    });
    expect(new Set(picks).size).toBeGreaterThan(1); // deterministic hash spreads across days
  });

  it('is deterministic — same date always yields the same pick', () => {
    expect(selectDailyQuestion(bank, '2026-01-01')).toBe(selectDailyQuestion(bank, '2026-01-01'));
    expect(selectDailyQuestion(bank, '2026-12-31')).toBe(selectDailyQuestion(bank, '2026-12-31'));
  });

  it('returns undefined for an empty pool', () => {
    expect(selectDailyQuestion([], '2026-07-13')).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/domain/daily/selection.test.ts`
Expected: FAIL — cannot import `selectDailyQuestion` from `./selection` (file does not exist).

- [ ] **Step 3: Write the implementation**

Create `src/domain/daily/selection.ts`:

```ts
/** Deterministic FNV-1a hash of the date string. Pure — no Date/Math.random. */
function hashDate(dateISO: string): number {
  let h = 2166136261;
  for (let i = 0; i < dateISO.length; i++) {
    h ^= dateISO.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0; // force unsigned 32-bit
}

/**
 * The day's question: deterministic by calendar date (`YYYY-MM-DD`). The same date
 * always yields the same item (stable within a day); a new day picks a new one.
 * Returns `undefined` when the pool is empty.
 */
export function selectDailyQuestion<T>(questions: T[], dateISO: string): T | undefined {
  if (questions.length === 0) return undefined;
  return questions[hashDate(dateISO) % questions.length];
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/domain/daily/selection.test.ts`
Expected: PASS — all 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/domain/daily/selection.ts src/domain/daily/selection.test.ts
git commit -m "feat(daily): deterministic date-seeded question selector"
```

---

### Task 2: `daily` store slice, `completeDaily`, `isDailyDone`, migration v2→v3

**Files:**
- Modify: `src/store/useStore.ts`
- Test: `src/store/useStore.test.ts`

**Interfaces:**
- Consumes: existing `bumpStreak` (module-private), `daysBetween` (already imported), `initialData`, `migrate`, persist config.
- Produces:
  - `interface DailyState { streak: number; longest: number; lastCompletedDate: string | null; lastSelectedIndex: number | null }`
  - `AppState.daily: DailyState`
  - `completeDaily: (selectedIndex: number, today: string) => void` — no-op if already completed today; else bumps daily streak (consecutive-day logic) + sets `lastCompletedDate`/`lastSelectedIndex`, and bumps the global `streak`.
  - `function isDailyDone(state: AppState, today: string): boolean`

- [ ] **Step 1: Write the failing tests**

Add these tests to `src/store/useStore.test.ts`. First, update the import line to include the new selector:

```ts
import { useStore, selectDueConceptIds, selectGradeProgress, selectReviewQueue, isMastered, selectBestInterviewGrade, isDailyDone } from './useStore';
```

Then add this block inside the top-level `describe('store', …)` (after the `recordInterview`/`selectBestInterviewGrade` tests, before the block closes):

```ts
  it('completeDaily records the day, sets streak to 1, stores the pick, and advances the global streak', () => {
    useStore.getState().completeDaily(2, '2026-07-13');
    const s = useStore.getState();
    expect(s.daily.streak).toBe(1);
    expect(s.daily.longest).toBe(1);
    expect(s.daily.lastCompletedDate).toBe('2026-07-13');
    expect(s.daily.lastSelectedIndex).toBe(2);
    expect(s.streak.current).toBe(1); // daily counts as activity
    expect(isDailyDone(s, '2026-07-13')).toBe(true);
    expect(isDailyDone(s, '2026-07-14')).toBe(false);
  });

  it('completeDaily is a no-op when already completed today', () => {
    const g = useStore.getState;
    g().completeDaily(1, '2026-07-13');
    g().completeDaily(3, '2026-07-13'); // same day again
    expect(g().daily.streak).toBe(1);
    expect(g().daily.lastSelectedIndex).toBe(1); // unchanged
  });

  it('daily streak grows on consecutive days and resets after a gap', () => {
    const g = useStore.getState;
    g().completeDaily(0, '2026-07-13');
    g().completeDaily(0, '2026-07-14');
    expect(g().daily.streak).toBe(2);
    g().completeDaily(0, '2026-07-17'); // gap
    expect(g().daily.streak).toBe(1);
    expect(g().daily.longest).toBe(2);
  });
```

And add a migration test inside the `describe('persisted settings merge (rehydration)', …)` block (which already `afterEach`-removes the `archmentor` key), after the existing v1 migration test:

```ts
  it('migrates a v2 payload (no daily slice) without wiping progress and backfills daily', async () => {
    localStorage.setItem('archmentor', JSON.stringify({
      state: {
        srs: { srp: { conceptId: 'srp', ease: 2.5, interval: 1, repetitions: 3, due: '2026-07-14', lastReviewed: '2026-07-13' } },
        quizResults: [{ questionId: 'q1', selectedIndex: 0, correct: true, at: '2026-07-13' }],
        interviews: [{ at: '2026-07-13', grade: 'middle', asked: 6, correct: 4, missedQuestionIds: [] }],
        conceptProgress: { srp: { seen: true } },
        streak: { current: 5, longest: 9, lastActiveDate: '2026-07-13' },
        settings: { theme: 'dark', lang: 'en', gradeFilter: 'all', categoryFilter: 'all' },
      },
      version: 2,
    }));
    await useStore.persist.rehydrate();
    const s = useStore.getState();
    expect(s.srs['srp'].repetitions).toBe(3);       // preserved
    expect(s.interviews).toHaveLength(1);            // preserved
    expect(s.streak.current).toBe(5);                // preserved
    expect(s.daily).toEqual({ streak: 0, longest: 0, lastCompletedDate: null, lastSelectedIndex: null }); // backfilled
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/store/useStore.test.ts`
Expected: FAIL — `completeDaily`/`isDailyDone`/`daily` don't exist yet (type errors / undefined).

- [ ] **Step 3: Add the `DailyState` type**

In `src/store/useStore.ts`, immediately after the `Streak` interface (line 12), add:

```ts
export interface DailyState { streak: number; longest: number; lastCompletedDate: string | null; lastSelectedIndex: number | null; }
```

- [ ] **Step 4: Add `daily` + `completeDaily` to `AppState`**

In the `AppState` interface, add the `daily` field (after `interviews`) and the `completeDaily` action (after `recordInterview`):

```ts
  interviews: InterviewResult[];
  daily: DailyState;
```
```ts
  recordInterview: (result: InterviewResult, today: string) => void;
  completeDaily: (selectedIndex: number, today: string) => void;
```

- [ ] **Step 5: Add `daily` to `PersistedState` and `initialData`**

Change the `PersistedState` type to include `'daily'`:

```ts
type PersistedState = Pick<AppState, 'srs' | 'quizResults' | 'interviews' | 'daily' | 'conceptProgress' | 'streak' | 'settings'>;
```

In `initialData()`, add the `daily` default (after `interviews: []`):

```ts
  interviews: [],
  daily: { streak: 0, longest: 0, lastCompletedDate: null, lastSelectedIndex: null },
```

- [ ] **Step 6: Implement `completeDaily`**

In the store creator, add the action after `recordInterview`:

```ts
      completeDaily: (selectedIndex, today) =>
        set((s) => {
          if (s.daily.lastCompletedDate === today) return {}; // already solved today — no-op
          const consecutive = s.daily.lastCompletedDate != null && daysBetween(s.daily.lastCompletedDate, today) === 1;
          const streak = consecutive ? s.daily.streak + 1 : 1;
          return {
            daily: {
              streak,
              longest: Math.max(s.daily.longest, streak),
              lastCompletedDate: today,
              lastSelectedIndex: selectedIndex,
            },
            streak: bumpStreak(s.streak, today), // a solved daily counts as activity
          };
        }),
```

- [ ] **Step 7: Add `daily` to `partialize` and bump version + migrate**

In `partialize`, add `daily: s.daily,`:

```ts
      partialize: (s): PersistedState => ({
        srs: s.srs, quizResults: s.quizResults, interviews: s.interviews, daily: s.daily,
        conceptProgress: s.conceptProgress, streak: s.streak, settings: s.settings,
      }),
```

Change `version: 2,` to `version: 3,`. Update the `migrate` function to accept v3 and refresh its doc comment:

```ts
/**
 * Version migration hook. v1→v2 added `interviews`; v2→v3 added `daily`. All known shapes
 * are accepted as-is — missing slices are backfilled from defaults by `merge`, so existing
 * srs/streak/quiz/interviews progress is preserved. Unknown shapes reset safely.
 */
export function migrate(persisted: unknown, version: number): PersistedState {
  if (version >= 1 && version <= 3 && persisted && typeof persisted === 'object') return persisted as PersistedState;
  return initialData();
}
```

- [ ] **Step 8: Add the `isDailyDone` selector**

Add near the other selectors (e.g., after `selectBestInterviewGrade`):

```ts
/** True when today's daily challenge has already been completed. */
export function isDailyDone(state: AppState, today: string): boolean {
  return state.daily.lastCompletedDate === today;
}
```

- [ ] **Step 9: Run the store tests to verify they pass**

Run: `npx vitest run src/store/useStore.test.ts`
Expected: PASS — all store tests pass, including the 3 new `completeDaily`/`isDailyDone` tests and the v2→v3 migration test.

- [ ] **Step 10: Commit**

```bash
git add src/store/useStore.ts src/store/useStore.test.ts
git commit -m "feat(daily): persisted daily slice, completeDaily, isDailyDone, migration v2->v3"
```

---

### Task 3: `Daily` screen + i18n

**Files:**
- Modify: `src/i18n/messages.ts` (add `daily.*` + `dashboard.daily*` to `ru` and `en`)
- Create: `src/features/daily/Daily.tsx`
- Test: `src/features/daily/Daily.test.tsx`

**Interfaces:**
- Consumes: `selectDailyQuestion(questions, dateISO)` (Task 1); `useStore`, `isDailyDone`, `completeDaily`, `daily` slice (Task 2).
- Consumes: `useQuestions(): QuestionView[]` from `@/content/localize` (fields used: `id, prompt, code?, options, correctIndex, explanation`); `isCorrect(q, i)` from `@/domain/quiz/selection`; `todayISO()` from `@/lib/date`; `CodeBlock`, `EmptyState`, `Icon`, `useT`.
- Produces: `export function Daily()` — the route component consumed by Task 4.

- [ ] **Step 1: Add the i18n keys**

In `src/i18n/messages.ts`, in the `ru` object add this block immediately after the `interview.*` block (after `'interview.cta': 'Пройти собес →',`):

```ts
  'daily.title': 'Задача дня',
  'daily.streak': 'Дней подряд',
  'daily.doneToday': 'Задача дня решена',
  'daily.comeBackTomorrow': 'Возвращайтесь завтра за новой.',
  'daily.emptyTitle': 'Нет вопросов',
  'daily.emptyHint': 'Банк вопросов пуст.',
  'dashboard.dailyTitle': 'Задача дня',
  'dashboard.dailyCta': 'Решить задачу дня →',
  'dashboard.dailyDone': 'Решено ✓',
```

In the `en` object add immediately after `'interview.cta': 'Take the interview →',`:

```ts
  'daily.title': 'Daily challenge',
  'daily.streak': 'Day streak',
  'daily.doneToday': "Today's challenge solved",
  'daily.comeBackTomorrow': 'Come back tomorrow for a new one.',
  'daily.emptyTitle': 'No questions',
  'daily.emptyHint': 'The question bank is empty.',
  'dashboard.dailyTitle': 'Daily challenge',
  'dashboard.dailyCta': "Solve today's challenge →",
  'dashboard.dailyDone': 'Solved ✓',
```

- [ ] **Step 2: Write the failing test**

Create `src/features/daily/Daily.test.tsx`:

```tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Daily } from './Daily';
import { useStore } from '@/store/useStore';
import { todayISO } from '@/lib/date';

beforeEach(() => {
  useStore.getState().resetProgress();
  useStore.getState().setSettings({ lang: 'ru' });
});

const options = () => screen.getAllByRole('button').filter((b) => b.getAttribute('data-option') !== null);

describe('Daily', () => {
  it('answers the daily question: reveals the explanation, marks it done, and streaks', async () => {
    render(<MemoryRouter><Daily /></MemoryRouter>);
    expect(useStore.getState().daily.lastCompletedDate).toBeNull();

    await userEvent.click(options()[0]);

    expect(screen.getByText(/Разбор/i)).toBeInTheDocument();
    expect(screen.getByText('Возвращайтесь завтра за новой.')).toBeInTheDocument();
    const s = useStore.getState();
    expect(s.daily.lastCompletedDate).toBe(todayISO());
    expect(s.daily.streak).toBe(1);
  });

  it('when already solved today, shows the revealed answer with no answerable options', () => {
    useStore.getState().completeDaily(0, todayISO()); // pre-solved
    render(<MemoryRouter><Daily /></MemoryRouter>);
    expect(screen.getByText('Задача дня решена')).toBeInTheDocument();
    // every option button is disabled (cannot re-answer)
    expect(options().every((b) => (b as HTMLButtonElement).disabled)).toBe(true);
  });
});

describe('Daily empty bank', () => {
  it('shows an empty state when there are no questions', async () => {
    vi.doMock('@/content/index', () => ({ questions: [], concepts: [], getConcept: () => undefined }));
    vi.resetModules();
    const { Daily: FreshDaily } = await import('./Daily');
    const { render: r, screen: sc } = await import('@testing-library/react');
    const { MemoryRouter: MR } = await import('react-router-dom');
    const { useStore: fresh } = await import('@/store/useStore');
    fresh.getState().setSettings({ lang: 'ru' });
    r(<MR><FreshDaily /></MR>);
    expect(sc.getByText('Нет вопросов')).toBeInTheDocument();
    vi.doUnmock('@/content/index');
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run src/features/daily/Daily.test.tsx`
Expected: FAIL — cannot import `Daily` from `./Daily` (file does not exist).

- [ ] **Step 4: Write the `Daily` screen**

Create `src/features/daily/Daily.tsx`:

```tsx
import { useMemo, useState } from 'react';
import { useQuestions } from '@/content/localize';
import { selectDailyQuestion } from '@/domain/daily/selection';
import { isCorrect } from '@/domain/quiz/selection';
import { useStore, isDailyDone } from '@/store/useStore';
import { todayISO } from '@/lib/date';
import { CodeBlock } from '@/components/CodeBlock';
import { EmptyState } from '@/components/EmptyState';
import { Icon } from '@/components/Icon';
import { useT } from '@/i18n/useT';

export function Daily() {
  const t = useT();
  const questions = useQuestions();
  const daily = useStore((s) => s.daily);
  const completeDaily = useStore((s) => s.completeDaily);

  const today = todayISO();
  const q = useMemo(() => selectDailyQuestion(questions, today), [questions, today]);
  const done = daily.lastCompletedDate === today;

  const [justPicked, setJustPicked] = useState<number | null>(null);
  const selected = justPicked ?? (done ? daily.lastSelectedIndex : null);
  const answered = selected !== null;

  function answer(index: number) {
    if (answered || !q) return;
    setJustPicked(index);
    completeDaily(index, today);
  }

  if (!q) {
    return <EmptyState icon="📅" title={t('daily.emptyTitle')} hint={t('daily.emptyHint')} />;
  }

  const answeredCorrectly = selected === q.correctIndex;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-bright">{t('daily.title')}</h1>
        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-raised px-3.5 py-1 text-sm font-bold text-bright shadow-card">
          {daily.streak}🔥 <span className="font-medium text-muted">{t('daily.streak')}</span>
        </span>
      </div>

      <div className="space-y-6 rounded-2xl border border-line bg-surface-raised p-6 shadow-card sm:p-7">
        <p className="text-xl font-semibold leading-snug tracking-tight text-bright [text-wrap:pretty]">{q.prompt}</p>
        {q.code && <CodeBlock sample={q.code} />}

        <div className="space-y-2.5">
          {q.options.map((opt, idx) => {
            const isAnswer = idx === q.correctIndex;
            const chosen = selected === idx;
            const rowCls = !answered
              ? 'border-line bg-surface hover:translate-x-0.5 hover:border-line-strong hover:bg-surface-muted'
              : isAnswer
                ? 'border-good bg-good/10 text-bright'
                : chosen
                  ? 'border-bad bg-bad/10'
                  : 'border-line opacity-50';
            const keyCls = !answered
              ? 'border-line-strong text-muted group-hover:border-accent group-hover:text-accent'
              : isAnswer
                ? 'border-good bg-good text-on-accent'
                : chosen
                  ? 'border-bad bg-bad text-on-accent'
                  : 'border-line text-muted';
            return (
              <button
                key={idx}
                data-option={idx}
                onClick={() => answer(idx)}
                disabled={answered}
                className={`group flex w-full items-center gap-4 rounded-xl border px-4 py-3.5 text-left transition ${rowCls}`}
              >
                <span aria-hidden="true" className={`grid h-8 w-8 flex-none place-items-center rounded-lg border text-sm font-bold transition ${keyCls}`}>
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="flex-1">{opt}</span>
                <span className="flex-none">
                  {answered && isAnswer && <Icon name="check" className="h-5 w-5 text-good" />}
                  {answered && chosen && !isAnswer && <Icon name="close" className="h-5 w-5 text-bad" />}
                </span>
              </button>
            );
          })}
        </div>

        {answered && (
          <div className="space-y-4 border-t border-line pt-5">
            <div className={`rounded-xl border p-4 ${answeredCorrectly ? 'border-good/30 bg-good/10' : 'border-bad/30 bg-bad/10'}`}>
              <h3 className={`mb-1.5 flex items-center gap-2 text-sm font-bold uppercase tracking-wide ${answeredCorrectly ? 'text-good' : 'text-bad'}`}>
                <Icon name={answeredCorrectly ? 'check' : 'close'} className="h-4 w-4" />
                {t('quiz.explanation')}
              </h3>
              <p className="leading-relaxed text-content">{q.explanation}</p>
            </div>
            <p className="text-sm font-medium text-muted">{t('daily.doneToday')} — {t('daily.comeBackTomorrow')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

Notes: `isCorrect` is imported per the interface contract but the reveal uses the direct `selected === q.correctIndex` comparison already present in Quiz; if the implementer prefers, `answeredCorrectly` may instead be written `selected !== null && isCorrect(q, selected)` — either is correct. The option buttons are always `disabled` once answered, covering both the just-answered and already-solved-on-load cases (`selected` resolves from `justPicked` or the persisted `lastSelectedIndex`).

- [ ] **Step 5: Run the Daily tests to verify they pass**

Run: `npx vitest run src/features/daily/Daily.test.tsx`
Expected: PASS — all 3 tests pass (answer→reveal→done+streak; pre-solved shows disabled options + "Задача дня решена"; empty bank shows "Нет вопросов").

- [ ] **Step 6: Run the full suite and typecheck**

Run: `npx tsc --noEmit && npx vitest run`
Expected: `tsc` clean; all tests pass (existing + Task 1 (4) + Task 2 (4) + Task 3 (3)); i18n parity test green.

- [ ] **Step 7: Commit**

```bash
git add src/features/daily/Daily.tsx src/features/daily/Daily.test.tsx src/i18n/messages.ts
git commit -m "feat(daily): daily challenge screen"
```

---

### Task 4: Wire the route, command palette, and Dashboard card

**Files:**
- Modify: `src/app/App.tsx` (add the lazy `daily` route)
- Modify: `src/components/CommandPalette.tsx` (add screen entry)
- Modify: `src/features/dashboard/Dashboard.tsx` (add the daily card)

**Interfaces:**
- Consumes: `Daily` — `export function Daily()` from `@/features/daily/Daily` (Task 3).
- Consumes: `isDailyDone` and the `daily` slice from the store (Task 2); message keys `daily.title`, `dashboard.dailyTitle`/`dailyCta`/`dailyDone` (Task 3).
- Produces: nothing consumed later (final task).

- [ ] **Step 1: Add the route in App.tsx**

In `src/app/App.tsx`, add this child route immediately after the `interview` route line:

```tsx
      { path: 'daily', lazy: () => import('@/features/daily/Daily').then((m) => ({ Component: m.Daily })) },
```

- [ ] **Step 2: Add the command-palette entry**

In `src/components/CommandPalette.tsx`, in the `SCREENS` array add this entry immediately after the `nav.interview` line:

```tsx
  { key: 'daily.title', to: '/daily', icon: 'bolt' },
```

(`'daily.title'` is a valid `MessageKey` from Task 3; `'bolt'` is an existing `IconName` — no new icon.)

- [ ] **Step 3: Add the daily card to the Dashboard**

In `src/features/dashboard/Dashboard.tsx`, update the store import to include `isDailyDone`:

```tsx
import { useStore, selectGradeProgress, selectReviewQueue, selectBestInterviewGrade, isDailyDone } from '@/store/useStore';
```

Add the derived values right after the existing `const bestInterview = selectBestInterviewGrade(state);` line:

```tsx
  const dailyDone = isDailyDone(state, today);
  const dailyStreak = state.daily.streak;
```

Then insert this card as its own block immediately after the `</header>` hero closing tag and before the `{/* Continue learning */}` block:

```tsx
      {/* Daily challenge */}
      <Link
        to="/daily"
        className="flex items-center gap-4 rounded-2xl border border-line bg-surface-raised p-5 shadow-card transition hover:-translate-y-0.5 hover:border-line-strong hover:shadow-card-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-accent/10 text-accent">
          <Icon name="bolt" className="h-6 w-6" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-base font-semibold text-bright">{t('dashboard.dailyTitle')}</span>
          <span className="block text-sm font-medium text-accent">{dailyDone ? t('dashboard.dailyDone') : t('dashboard.dailyCta')}</span>
        </span>
        <span className="flex-none text-lg font-bold tabular-nums text-bright">{dailyStreak}🔥</span>
      </Link>
```

(`Link`, `Icon`, `t`, `state`, and `today` are already imported/defined in `Dashboard.tsx`.)

- [ ] **Step 4: Run typecheck, full suite, and build**

Run: `npx tsc --noEmit && npx vitest run && npm run build`
Expected: `tsc` clean; all tests pass; build completes and emits a `Daily-*.js` chunk.

- [ ] **Step 5: Manual verification (dev server)**

Run: `npm run dev`, then in the browser:
- Dashboard shows a **Daily challenge / Задача дня** card with the current streak and a "Solve today's challenge" CTA; `⌘K` lists "Daily challenge / Задача дня"; both open `/daily`.
- `/daily` shows one question; answering reveals correct/incorrect + explanation and a "come back tomorrow" note; the card CTA now reads "Solved ✓".
- Reload `/daily` → the same question is shown with the answer already revealed and options disabled (can't re-answer). The Dashboard streak persists.
- Toggle language → question and labels re-localize; toggle theme → colors adapt; the page does not scroll horizontally.

- [ ] **Step 6: Commit**

```bash
git add src/app/App.tsx src/components/CommandPalette.tsx src/features/dashboard/Dashboard.tsx
git commit -m "feat(daily): route, command-palette entry, and Dashboard card"
```

---

## Self-Review

**1. Spec coverage** (against `docs/superpowers/specs/2026-07-13-daily-challenge-design.md`):
- §2 deterministic selection (`selectDailyQuestion`, stable/day, empty→undefined, no Math.random) → Task 1. ✓
- §2 `/daily` behavior — unsolved: question + immediate feedback + `completeDaily`; solved: revealed answer, no re-answer → Task 3 Step 4 (`answered`/`selected`/`disabled`) + tests. ✓
- §2 Dashboard card (streak + status + link) → Task 4 Step 3. ✓
- §3 streak rule (on completion, any answer), `DailyState`, `completeDaily` no-op-if-done + bumps daily & global streak, no `quizResults` write, `isDailyDone` → Task 2 Steps 3–8 + tests. ✓
- §3 migration v2→v3 preserving progress + backfilling `daily` → Task 2 Step 7 + migration test. ✓
- §4 module boundaries: `daily/selection.ts`, store, `Daily.tsx`, wiring → Tasks 1–4. ✓
- §5 i18n `daily.*` + `dashboard.daily*` (ru/en), reuse `quiz.explanation` → Task 3 Step 1. ✓
- §6 a11y: real `<button>` options, disabled after answer, correct/incorrect shown via icon not only color, focus rings → Task 3 Step 4, Task 4 Step 3. ✓
- §7 tests: selector (4), store (4), component smoke (3, incl. empty bank) → Tasks 1–3. ✓
- §8 done criteria → Task 4 Steps 4–5. ✓
- §1 YAGNI exclusions honored: single question, no repeat-tracking, no sidebar item/mode icon (reuse `bolt`), no `quizResults` write. ✓

**2. Placeholder scan:** No TBD/TODO; every code step shows complete code; commands have expected output. ✓

**3. Type consistency:** `selectDailyQuestion<T>(questions: T[], dateISO: string): T | undefined` (Task 1) consumed in Task 3. `DailyState` fields (`streak`/`longest`/`lastCompletedDate`/`lastSelectedIndex`) identical across Task 2 (type, `initialData`, `completeDaily`, migration test) and Task 3 (`daily.streak`, `daily.lastSelectedIndex`, `daily.lastCompletedDate`). `completeDaily(selectedIndex, today)` signature matches its calls in Task 3 (`completeDaily(index, today)`) and tests. `isDailyDone(state, today)` matches usage in Task 3/4. Route path `'daily'`, palette `to: '/daily'`, and Dashboard `to="/daily"` are consistent. Message keys added in Task 3 Step 1 match every `t(...)` call in Tasks 3–4. `data-option` attribute on options matches the test's `options()` filter. ✓
