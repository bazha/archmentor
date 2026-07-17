# Interview Timed Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an optional "Timed mode" to Interview — a 30-second countdown per question with auto-advance on expiry (counts as a wrong answer). Screen-only; the machine and store are unchanged.

**Architecture:** `Interview.tsx` gains a `timed` intro toggle and a per-question countdown. Expiry reuses the incorrect-answer path via an extracted `resolve(correct)` helper. Two effects drive the timer (decrement + zero-watcher) with a ref to the latest `resolve` to avoid stale closures and double-fires.

**Tech Stack:** React + TS + Vite, Vitest.

## Global Constraints

- **Timeout = incorrect answer.** No `machine.ts` / `recordInterview` / `InterviewResult` changes; timeouts are tracked via the existing `missedIds` path.
- **Optional** via intro toggle (default off), alongside the SD-round toggle.
- Fixed **30s** per question.
- Bilingual (ru+en). No new dependency. No Co-Authored-By / Claude attribution. Commit after the task.

---

### Task 1: Timed mode (toggle, timer, auto-advance) + i18n + tests

**Files:**
- Modify: `src/features/interview/Interview.tsx`
- Modify: `src/i18n/messages.ts` (ru+en)
- Modify: `src/features/interview/Interview.test.tsx`

**Interfaces:**
- No new exports (screen-internal). Reuses `interviewReducer`/`drawNext`/`selectSdScenario` unchanged.

- [ ] **Step 1: Add i18n keys**

In `src/i18n/messages.ts`, add to `ru` (near other `interview.*`):
```ts
  'interview.timedMode': 'Таймер на вопрос',
  'interview.timeLeft': 'оставшееся время',
```
and to `en`:
```ts
  'interview.timedMode': 'Timed mode',
  'interview.timeLeft': 'time remaining',
```

- [ ] **Step 2: Add the constant + state**

In `src/features/interview/Interview.tsx`, add a module-level constant near `PRIMARY_BTN`:
```ts
const QUESTION_SECONDS = 30;
```

In the `Interview` component, add state next to the existing `includeSd`/`sdScenario` state:
```ts
  const [timed, setTimed] = useState(false);
  const [remaining, setRemaining] = useState(QUESTION_SECONDS);
```

- [ ] **Step 3: Extract `resolve` and add the timeout ref**

Replace the existing `answer(index)` function with `resolve` + a thin `answer`:
```ts
  function resolve(correct: boolean) {
    if (!session || session.status !== 'active' || !current) return;
    const advanced = interviewReducer(session, { type: 'answer', correct, questionId: current.id });
    const { state, question } = drawNext(advanced, deck, shuffle);
    setSession(state);
    setCurrentId(question?.id ?? null);
    if (state.status === 'done' && includeSd) {
      setSdScenario(selectSdScenario(scenarios, state.verdict ?? 'junior', shuffle) ?? null);
    }
  }
  function answer(index: number) {
    if (!current) return;
    resolve(isCorrect(current, index));
  }

  // Latest resolve, so the timer's zero-watcher never captures a stale closure.
  const onTimeoutRef = useRef<() => void>(() => {});
  onTimeoutRef.current = () => resolve(false);
```

- [ ] **Step 4: Add the timer effects**

Add these two effects (below the existing effects, e.g. after the persist effect):
```ts
  // Per-question countdown (timed mode only): reset to 30 and tick down.
  useEffect(() => {
    if (!timed || session?.status !== 'active' || !current) return;
    setRemaining(QUESTION_SECONDS);
    const iv = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timed, currentId, session?.status]);

  // Fire the timeout exactly once when the countdown reaches zero.
  useEffect(() => {
    if (timed && remaining === 0 && session?.status === 'active') onTimeoutRef.current();
  }, [remaining, timed, session?.status]);
```
(The decrement uses a functional updater with no side effects; the separate zero-watcher calls `onTimeoutRef.current()` — which advances the question, changing `currentId`, which re-runs the first effect and resets the countdown. Single fire per question.)

- [ ] **Step 5: Add the Timed mode toggle to the intro**

In the intro card, add a second checkbox right after the existing `includeSd` `<label>` (before the `<div className="flex justify-center">`):
```tsx
          <label className="flex items-center justify-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={timed} onChange={(e) => setTimed(e.target.checked)}
              className="h-4 w-4 rounded border-line-strong text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" />
            {t('interview.timedMode')}
          </label>
```

- [ ] **Step 6: Add the countdown pill to the active question header**

In the active-question header row (the `<div className="flex flex-wrap items-center justify-between gap-3">` holding the tier badge and the "asked" counter), add a third pill AFTER the "asked" span, shown only when `timed`:
```tsx
          {timed && (
            <span aria-label={t('interview.timeLeft')}
              className={`inline-flex items-center rounded-full border border-line bg-surface-raised px-3.5 py-1 text-sm font-bold tabular-nums shadow-card ${remaining <= 5 ? 'text-bad' : 'text-muted'}`}>
              <span aria-hidden="true">{remaining}s</span>
            </span>
          )}
```

- [ ] **Step 7: Add tests**

In `src/features/interview/Interview.test.tsx`, add the toggle test (the file's `beforeEach` sets `lang: 'ru'`, so match the Russian label):
```tsx
  it('offers the Timed mode toggle on the intro, unchecked by default', () => {
    render(<MemoryRouter><Interview /></MemoryRouter>);
    const cb = screen.getByRole('checkbox', { name: /таймер/i });
    expect(cb).toBeInTheDocument();
    expect(cb).not.toBeChecked();
  });
```

Add the auto-advance test (import `fireEvent` alongside the existing `render, screen, act` from `@testing-library/react`, and `vi` from `vitest`):
```tsx
  it('auto-advances the current question when the timer runs out in timed mode', () => {
    vi.useFakeTimers();
    try {
      render(<MemoryRouter><Interview /></MemoryRouter>);
      fireEvent.click(screen.getByRole('checkbox', { name: /таймер/i }));
      fireEvent.click(screen.getByRole('button', { name: 'Начать собес' }));
      const first = document.querySelector('p.text-xl')?.textContent ?? '';
      expect(first.length).toBeGreaterThan(0); // an active question is shown
      act(() => { vi.advanceTimersByTime(QUESTION_SECONDS * 1000); });
      // The original question is no longer the current one (advanced to the next question or the report).
      const after = document.querySelector('p.text-xl')?.textContent ?? '';
      expect(after).not.toBe(first);
    } finally {
      vi.useRealTimers();
    }
  });
```
Note `QUESTION_SECONDS` isn't exported — use the literal `30 * 1000` in the test, or export the constant. Simplest: use `30000` in the test. If the fake-timer test proves flaky (userEvent/timer interplay, StrictMode), delete it and keep only the toggle test — the countdown/auto-advance is then covered by browser verification (Step 9). Do NOT leave a flaky test in.

- [ ] **Step 8: Typecheck, full suite, build**

Run: `npx tsc --noEmit && npm run test && npm run build`
Expected: all PASS.

- [ ] **Step 9: Browser-verify**

Run `npm run preview`, open `/interview`, enable **Timed mode**, Start. Confirm: a countdown pill ticks down each question; it turns accent/red at ≤5s; on reaching 0 the question auto-advances and that question is counted as missed (shows up in the final "weak topics"/lowered score); with Timed mode OFF, no pill and behavior is unchanged. Check dark + light.

- [ ] **Step 10: Commit**

```bash
git add src/features/interview/Interview.tsx src/i18n/messages.ts src/features/interview/Interview.test.tsx
git commit -m "feat(interview): optional timed mode (per-question countdown, auto-advance)"
```

---

## Self-Review

**Spec coverage:**
- `timed` intro toggle (default off), alongside SD toggle → Steps 2, 5. ✓
- 30s per-question countdown pill, accent at ≤5s → Steps 2, 6. ✓
- Auto-advance on expiry counts as incorrect (reuses `resolve(false)`) → Steps 3, 4. ✓
- Machine/store/`InterviewResult` unchanged (timeout via existing `missedIds`) → no such edits. ✓
- Timer single-fire (decrement effect + zero-watcher + ref) → Step 4. ✓
- i18n `timedMode`/`timeLeft` ru+en; a11y (ticking number `aria-hidden`, pill `aria-label`) → Steps 1, 6. ✓
- Tests: toggle + fake-timer auto-advance (with documented fallback); browser-verify → Steps 7, 9. ✓

**Placeholder scan:** none — all edits given verbatim. The "drop the fake-timer test if flaky" instruction is a concrete decision rule, not a vague deferral.

**Type consistency:** `resolve(correct: boolean)` matches both call sites (`answer` → `resolve(isCorrect(...))`, timeout → `resolve(false)`); `onTimeoutRef` is `useRef<() => void>`. `remaining`/`timed` are `number`/`boolean`. The zero-watcher reads `onTimeoutRef.current` (stable ref) so `resolve` need not be in its deps. `QUESTION_SECONDS` is module-scope; the test uses the literal `30000` since it isn't exported.
