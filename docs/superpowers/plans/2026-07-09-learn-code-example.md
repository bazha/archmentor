# Code Example on Learn Flashcards — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Показать код" toggle below the Learn flashcard that reveals the concept's existing `codeExample` via the `CodeBlock` component (progressive disclosure).

**Architecture:** Presentation-only change to `src/features/learn/Learn.tsx`. A `showCode` boolean state gates a toggle + `CodeBlock` section rendered **below** the `FlipCard` (not inside it — `FlipCard` is a single `<button>`, so nesting a button would be invalid HTML and clicks would bubble to flip the card). The section only renders when the card is flipped to the answer. `showCode` resets to `false` on every flip and on advancing to the next card. Reuses the existing `CodeBlock` component and the `codeExample` already present on every `ConceptView` — no data, schema, or component changes.

**Tech Stack:** React 18 + TypeScript (strict), Vite, Tailwind (semantic CSS-variable tokens), Zustand, react-router-dom, Vitest + Testing Library. In-house i18n (`src/i18n/messages.ts`, `useT`).

## Global Constraints

- Presentation-only: do NOT change hooks, selectors, deck/next logic, props, or existing visible text. Only add the toggle + code section and the `showCode` state.
- Tokens only: use semantic Tailwind tokens (`bg-surface-raised`, `border-line`/`border-line-strong`, `text-content`, `accent`). No hardcoded hex or raw palette colors (no `slate-*`, `indigo-*`, etc.).
- i18n: every user-visible string goes through `t()`; add keys to BOTH `ru` and `en` in `src/i18n/messages.ts` (parity is enforced by the type `en: Record<MessageKey, string>` and the i18n parity test).
- Reuse `CodeBlock` (`src/components/CodeBlock.tsx`) and `Icon` (`src/components/Icon.tsx`) as-is. `FlipCard`, the content schema, and concept data are unchanged. No new dependencies.
- Must stay bilingual (RU/EN) and work in both themes.
- Preserve existing Learn test contracts: the flip button has accessible name matching `/перевернуть/i`, the Next button matches `/следующая/i`, and "Определение" appears after flipping.

---

### Task 1: "Показать код" toggle on the Learn flashcard

**Files:**
- Modify: `src/i18n/messages.ts` (add `learn.showCode` / `learn.hideCode` to `ru` and `en`)
- Modify: `src/features/learn/Learn.tsx` (add `showCode` state, imports, toggle + code section, reset logic)
- Test: `src/features/learn/Learn.test.tsx` (add one test)

**Interfaces:**
- Consumes: `CodeBlock` — `export function CodeBlock({ sample }: { sample: ResolvedCodeSample })` where `ResolvedCodeSample = { lang: 'typescript'; code: string; highlightLines?: number[] }`. `ConceptView.codeExample` already has exactly this shape.
- Consumes: `Icon` — `export function Icon({ name, className }: { name: IconName; className?: string })`; `'chevronRight'` is a valid `IconName`.
- Consumes: `useT()` returning `t(key: MessageKey, vars?) => string`.
- Produces: nothing consumed by later tasks (single-task feature).

- [ ] **Step 1: Write the failing test**

Add this test inside the existing `describe('Learn', …)` block in `src/features/learn/Learn.test.tsx` (after the existing two `it(...)` blocks, before the closing `});`). It relies on the `CodeBlock` header rendering the literal text `TypeScript`, which appears nowhere else on the Learn screen.

```tsx
  it('reveals the code example on the flipped card via the show-code toggle', async () => {
    render(<MemoryRouter><Learn /></MemoryRouter>);
    // Toggle is not present on the front (question) side
    expect(screen.queryByRole('button', { name: /показать код/i })).not.toBeInTheDocument();

    // Flip to the answer side
    await userEvent.click(screen.getByRole('button', { name: /перевернуть/i }));

    // Toggle appears; code is hidden by default (CodeBlock header "TypeScript" absent)
    const toggle = screen.getByRole('button', { name: /показать код/i });
    expect(screen.queryByText('TypeScript')).not.toBeInTheDocument();

    // Reveal the code
    await userEvent.click(toggle);
    expect(screen.getByText('TypeScript')).toBeInTheDocument();

    // Toggle now hides it again
    await userEvent.click(screen.getByRole('button', { name: /скрыть код/i }));
    expect(screen.queryByText('TypeScript')).not.toBeInTheDocument();
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/features/learn/Learn.test.tsx`
Expected: FAIL — the new test errors on `getByRole('button', { name: /показать код/i })` (no such button exists yet). The two existing Learn tests still pass.

- [ ] **Step 3: Add the i18n keys**

In `src/i18n/messages.ts`, in the `ru` object, add two keys immediately after `'learn.next': 'Следующая →',`:

```ts
  'learn.showCode': 'Показать код',
  'learn.hideCode': 'Скрыть код',
```

In the `en` object, add immediately after `'learn.next': 'Next →',`:

```ts
  'learn.showCode': 'Show code',
  'learn.hideCode': 'Hide code',
```

- [ ] **Step 4: Add imports to Learn.tsx**

In `src/features/learn/Learn.tsx`, add these two imports alongside the existing component imports (after the `import { Badge } from '@/components/Badge';` line):

```tsx
import { CodeBlock } from '@/components/CodeBlock';
import { Icon } from '@/components/Icon';
```

- [ ] **Step 5: Add the `showCode` state**

In `Learn.tsx`, immediately after the existing `const [flipped, setFlipped] = useState(false);` line, add:

```tsx
  const [showCode, setShowCode] = useState(false);
```

- [ ] **Step 6: Reset `showCode` when advancing**

In the `next()` function, add a reset alongside the existing `setFlipped(false);`. The full function becomes:

```tsx
  function next() {
    if (current) markSeen(current.id, todayISO());
    setFlipped(false);
    setShowCode(false);
    setIndex((i) => (i + 1) % Math.max(deck.length, 1));
  }
```

- [ ] **Step 7: Reset `showCode` on flip + render the toggle/code section**

In the JSX, change the `FlipCard`'s `onFlip` to also reset `showCode` (so code is always hidden right after a flip):

```tsx
        flipped={flipped} onFlip={() => { setFlipped((f) => !f); setShowCode(false); }}
```

Then, between the `<FlipCard ... />` element and the `<div className="flex justify-end">` Next-button block, insert this section:

```tsx
      {flipped && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setShowCode((s) => !s)}
            aria-expanded={showCode}
            aria-controls="learn-code"
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface-raised px-4 py-2 text-sm font-semibold text-content shadow-card transition hover:-translate-y-0.5 hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Icon name="chevronRight" className={`h-4 w-4 transition-transform ${showCode ? 'rotate-90' : ''}`} />
            {showCode ? t('learn.hideCode') : t('learn.showCode')}
          </button>
          <div id="learn-code">
            {showCode && <CodeBlock sample={current.codeExample} />}
          </div>
        </div>
      )}
```

Notes: the container `<div id="learn-code">` is always present while flipped (so `aria-controls` always resolves) and holds the `CodeBlock` only when `showCode` is true. The chevron rotates 90° when expanded to signal open/closed. The whole section is gated on `flipped`, so the toggle never appears on the question side.

- [ ] **Step 8: Run the Learn tests to verify they pass**

Run: `npx vitest run src/features/learn/Learn.test.tsx`
Expected: PASS — all three Learn tests pass (the new toggle test plus the two existing ones).

- [ ] **Step 9: Run the full suite, typecheck, and build**

Run: `npx tsc --noEmit && npx vitest run && npm run build`
Expected: `tsc` prints nothing (clean); all tests pass (existing count + 1); the i18n parity test passes (the two new keys exist in both locales); build completes with no warnings.

- [ ] **Step 10: Commit**

```bash
git add src/features/learn/Learn.tsx src/features/learn/Learn.test.tsx src/i18n/messages.ts
git commit -m "feat(learn): reveal concept code example on flashcards via show-code toggle"
```

---

## Self-Review

**1. Spec coverage** (against `docs/superpowers/specs/2026-07-09-learn-code-example-design.md`):
- §2 Behavior — toggle below card, appears when flipped, reveals/hides code, hidden by default, reset on flip + next → Steps 6, 7 + test Step 1. ✓
- §3 Structure — section rendered below `FlipCard`, `FlipCard` untouched, reuse `CodeBlock` with `current.codeExample` → Step 7. ✓
- §4 i18n — `learn.showCode`/`learn.hideCode` in ru+en → Step 3. ✓
- §5 A11y — real `<button>` with `aria-expanded` + `aria-controls` → id region → Step 7. ✓
- §6 Testing — flip → toggle appears → reveal code → hide; existing contracts preserved → Steps 1, 8, 9. ✓
- §7 Done criteria — covered by Steps 8–9. ✓

**2. Placeholder scan:** No TBD/TODO; every code step shows the exact code. ✓

**3. Type consistency:** `showCode`/`setShowCode` used consistently (Steps 5, 6, 7). `CodeBlock`'s `sample` prop matches `current.codeExample` (`ResolvedCodeSample`). `Icon name="chevronRight"` is a valid `IconName`. `t('learn.showCode')`/`t('learn.hideCode')` match the keys added in Step 3. ✓
