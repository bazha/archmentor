# Interview Target-Grade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the interview start at a chosen grade instead of always Junior; the adaptive ladder runs from there, and a grade is credited only if the candidate actually cleared it.

**Architecture:** `machine.ts` gains a `startTier` and an honest verdict rule (credit only tiers promoted past the start). `Interview.tsx` gains an intro grade selector (valid grades only, default Junior) and report copy for the start grade / "not confirmed" case. No store/persist changes.

**Tech Stack:** React + TS + Vite, Vitest.

## Global Constraints

- **Default Junior = current behavior, byte-for-byte.** `predecessorGrade(junior)` is already `null`, so the new rule only changes outcomes for starts above Junior.
- **Honest verdict.** Credit a grade only for a tier the candidate promoted past (`tier > startTier`). Stopping at the start tier (never promoted) → `verdict = null`.
- **No changes** to `InterviewResult`, `recordInterview`, the store, or persist/migrations. The active `InterviewState` lives in component `useState`, not the store.
- Bilingual (ru+en, type-enforced parity). No new dependency. No Co-Authored-By / Claude attribution. Commit after each task.

---

### Task 1: Machine — startTier + honest verdict

**Files:**
- Modify: `src/domain/interview/machine.ts`
- Modify: `src/domain/interview/machine.test.ts`

**Interfaces:**
- Produces: `initInterview(startTier?: Grade)` (defaulted to `GRADE_ORDER[0]`); `InterviewState` gains `startTier: Grade`. Task 2 calls `initInterview(startTier)` and reads `session.startTier`.

- [ ] **Step 1: Add `startTier` to the state interface**

In `src/domain/interview/machine.ts`, add to the `InterviewState` interface (after `verdict`):
```ts
  /** Tier the session started at. A grade is credited only for tiers promoted past this. */
  startTier: Grade;
```

- [ ] **Step 2: Accept a start tier in `initInterview`**

Replace the current `initInterview`:
```ts
export function initInterview(startTier: Grade = GRADE_ORDER[0]): InterviewState {
  return {
    tier: startTier,
    correctInTier: 0,
    mistakesInTier: 0,
    askedIds: [],
    missedIds: [],
    status: 'active',
    verdict: null,
    startTier,
  };
}
```

- [ ] **Step 3: Add the honest-verdict helper**

Add just above `interviewReducer` (near `promote`):
```ts
/**
 * Highest grade genuinely cleared: the tier below where we stopped, or null if the candidate
 * never promoted past the starting tier (nothing demonstrated). You can only leave the start
 * tier via promote(), so `tier > startTier` guarantees startTier and every tier up to
 * `tier - 1` were passed — predecessorGrade(tier) never over-claims.
 */
function demonstratedVerdict(state: InterviewState): Grade | null {
  return state.tier === state.startTier ? null : predecessorGrade(state.tier);
}
```

- [ ] **Step 4: Use the helper in both completion paths**

In `interviewReducer`, the STOP branch — replace:
```ts
  if (next.mistakesInTier >= STOP) return { ...next, status: 'done', verdict: predecessorGrade(next.tier) };
```
with:
```ts
  if (next.mistakesInTier >= STOP) return { ...next, status: 'done', verdict: demonstratedVerdict(next) };
```

And the `exhausted` no-activity branch — replace:
```ts
    return { ...state, status: 'done', verdict: predecessorGrade(state.tier) };
```
with:
```ts
    return { ...state, status: 'done', verdict: demonstratedVerdict(state) };
```

(Leave the `promote()` top-tier path `verdict: state.tier` unchanged — that is a genuine pass of the top tier.)

- [ ] **Step 5: Add tests for the new semantics**

In `src/domain/interview/machine.test.ts`, add inside the `describe('interview machine', ...)` block:
```ts
  it('initInterview accepts a starting tier; default is the lowest grade', () => {
    expect(initInterview().startTier).toBe('junior');
    expect(initInterview().tier).toBe('junior');
    const s = initInterview('senior');
    expect(s.startTier).toBe('senior');
    expect(s.tier).toBe('senior');
  });

  it('honest verdict: stopping at the starting tier (never promoted) yields null', () => {
    let s = initInterview('senior');
    s = interviewReducer(s, { type: 'answer', correct: false, questionId: 's1' });
    s = interviewReducer(s, { type: 'answer', correct: false, questionId: 's2' });
    expect(s.status).toBe('done');
    expect(s.verdict).toBeNull(); // Middle NOT credited — never demonstrated
  });

  it('honest verdict: passing the start tier then failing higher credits the passed tier', () => {
    let s = initInterview('senior');
    s = interviewReducer(s, { type: 'answer', correct: true, questionId: 's1' });
    s = interviewReducer(s, { type: 'answer', correct: true, questionId: 's2' }); // → lead
    expect(s.tier).toBe('lead');
    s = interviewReducer(s, { type: 'answer', correct: false, questionId: 'l1' });
    s = interviewReducer(s, { type: 'answer', correct: false, questionId: 'l2' });
    expect(s.status).toBe('done');
    expect(s.verdict).toBe('senior'); // predecessor(lead), genuinely demonstrated
  });

  it('exhausting the starting tier with no activity yields null (no phantom credit)', () => {
    const s = interviewReducer(initInterview('senior'), { type: 'exhausted' });
    expect(s.status).toBe('done');
    expect(s.verdict).toBeNull();
  });
```

- [ ] **Step 6: Run the machine tests, typecheck**

Run: `npx vitest run src/domain/interview/machine.test.ts && npx tsc --noEmit`
Expected: all PASS (new tests + all pre-existing, which are default-Junior and unchanged), tsc clean.

- [ ] **Step 7: Commit**

```bash
git add src/domain/interview/machine.ts src/domain/interview/machine.test.ts
git commit -m "feat(interview): startTier + honest verdict (credit only cleared tiers)"
```

---

### Task 2: UI — intro grade selector + report copy + i18n

**Files:**
- Modify: `src/i18n/messages.ts` (ru+en)
- Modify: `src/features/interview/Interview.tsx`
- Modify: `src/features/interview/Interview.test.tsx`

**Interfaces:**
- Consumes: `initInterview(startTier)` and `session.startTier` from Task 1.

- [ ] **Step 1: Add i18n keys**

In `src/i18n/messages.ts`, add to `ru` (near other `interview.*`):
```ts
  'interview.startGrade': 'Стартовый уровень',
  'interview.startedAt': 'Стартовал с {grade}',
  'interview.notConfirmed': 'Не подтверждён {grade} — не хватило до потолка.',
```
and to `en`:
```ts
  'interview.startGrade': 'Starting level',
  'interview.startedAt': 'Started at {grade}',
  'interview.notConfirmed': '{grade} not confirmed — didn\'t clear the bar.',
```

- [ ] **Step 2: Add start-tier state + available grades**

In `src/features/interview/Interview.tsx`, add state next to the existing `timed`/`includeSd` state:
```ts
  const [startTier, setStartTier] = useState<Grade>(GRADE_ORDER[0]);
```

Add a memo next to the existing `byId`/`conceptName` memos:
```ts
  const startableGrades = useMemo(
    () => GRADE_ORDER.filter((g) => deck.some((q) => q.grade === g)),
    [deck],
  );
```

(If `Grade` is not already imported in this file, add it to the existing content-schema import: `import type { Grade } from '@/content/schema';` — check the top-of-file imports first and reuse the existing line if present.)

- [ ] **Step 3: Pass the start tier when starting**

In `start()`, replace:
```ts
    const { state, question } = drawNext(initInterview(), deck, shuffle);
```
with:
```ts
    const { state, question } = drawNext(initInterview(startTier), deck, shuffle);
```

- [ ] **Step 4: Add the grade selector to the intro**

In the intro card, insert this block right after the `introBody` `<p>` and before the first `<label>` (the `includeSd` checkbox):
```tsx
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted">{t('interview.startGrade')}</p>
            <div role="radiogroup" aria-label={t('interview.startGrade')} className="flex flex-wrap justify-center gap-2">
              {startableGrades.map((g) => (
                <button
                  key={g}
                  type="button"
                  role="radio"
                  aria-checked={startTier === g}
                  onClick={() => setStartTier(g)}
                  className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    startTier === g
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-line bg-surface text-muted hover:border-line-strong'
                  }`}
                >
                  {GRADE_LABEL[g]}
                </button>
              ))}
            </div>
          </div>
```

- [ ] **Step 5: Report — start annotation + honest null-verdict copy**

In the `Report` component, replace the verdict block:
```tsx
        {session.verdict ? (
          <p className="text-2xl font-semibold tracking-tight text-accent">
            {t('interview.verdict', { grade: GRADE_LABEL[session.verdict as Grade] })}
          </p>
        ) : (
          <p className="text-lg font-semibold text-content">{t('interview.verdictNone')}</p>
        )}
```
with:
```tsx
        {session.verdict ? (
          <p className="text-2xl font-semibold tracking-tight text-accent">
            {t('interview.verdict', { grade: GRADE_LABEL[session.verdict as Grade] })}
          </p>
        ) : session.startTier !== GRADE_ORDER[0] ? (
          <p className="text-lg font-semibold text-content">
            {t('interview.notConfirmed', { grade: GRADE_LABEL[session.startTier] })}
          </p>
        ) : (
          <p className="text-lg font-semibold text-content">{t('interview.verdictNone')}</p>
        )}
        {session.startTier !== GRADE_ORDER[0] && (
          <p className="text-sm text-muted">{t('interview.startedAt', { grade: GRADE_LABEL[session.startTier] })}</p>
        )}
```

(The `Report` component already receives `session`, so `session.startTier` is available — no new prop.)

- [ ] **Step 6: Add a component test**

In `src/features/interview/Interview.test.tsx`, add inside the `describe('Interview', ...)` block:
```tsx
  it('offers a starting-grade selector on the intro, defaulting to Junior', () => {
    render(<MemoryRouter><Interview /></MemoryRouter>);
    const radios = screen.getAllByRole('radio');
    expect(radios.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole('radio', { name: 'Junior' })).toHaveAttribute('aria-checked', 'true');
  });
```
(Grade labels are language-neutral — `'Junior'` matches regardless of the `beforeEach` `lang: 'ru'`.)

- [ ] **Step 7: Typecheck, full suite, build**

Run: `npx tsc --noEmit && npm run test && npm run build`
Expected: all PASS.

- [ ] **Step 8: Browser-verify**

Run `npm run preview`, open `/interview`. Confirm: intro shows a "Starting level" selector with Junior selected by default; picking **Senior** and answering the first two questions wrong ends with "Senior not confirmed" + "Started at Senior" (no "Middle" verdict); picking **Junior** and running through behaves exactly as before (no start annotation). Check dark + light.

- [ ] **Step 9: Commit**

```bash
git add src/i18n/messages.ts src/features/interview/Interview.tsx src/features/interview/Interview.test.tsx
git commit -m "feat(interview): starting-grade selector on intro + honest report copy"
```

---

## Self-Review

**Spec coverage:**
- Start-tier selector on intro (valid grades only, default Junior) → Task 2 Steps 2, 4. ✓
- Ladder starts from the chosen grade → Task 2 Step 3 + Task 1 Step 2. ✓
- Honest verdict (credit only cleared tiers; fail-at-start → null) → Task 1 Steps 3-4. ✓
- Default Junior unchanged → Task 1 (predecessor(junior)=null; new rule no-ops), covered by pre-existing tests still green. ✓
- Report: "Started at {grade}" + "not confirmed {grade}" → Task 2 Step 5. ✓
- No store/`InterviewResult`/persist changes → no such edits. ✓
- i18n ru+en parity → Task 2 Step 1. ✓
- Tests: machine verdict semantics + component selector → Task 1 Step 5, Task 2 Step 6. ✓

**Placeholder scan:** none — all edits verbatim.

**Type consistency:** `startTier: Grade`; `initInterview(startTier: Grade = GRADE_ORDER[0])`; `demonstratedVerdict(state): Grade | null`; selector uses `GRADE_LABEL[g]` / `setStartTier(g)` with `g: Grade`; report reads `session.startTier` (present on `InterviewState`). `GRADE_ORDER`/`GRADE_LABEL` already imported in both files; `Grade` import guarded in Task 2 Step 2.
