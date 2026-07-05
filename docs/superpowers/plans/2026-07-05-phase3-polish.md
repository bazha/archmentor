# ArchMentor Phase 3 Polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship light/dark theming, accessibility, consistent empty states, and a clean bundle for ArchMentor.

**Architecture:** Colors become CSS-variable semantic tokens (`--surface`, `--content`, `--muted`, `--accent`) defined light-by-default with a `.dark` override; Tailwind maps them via `rgb(var(--token) / <alpha-value>)`, so one class works in both themes. A pre-paint inline script and a runtime effect keep the `.dark` class in sync with the persisted `settings.theme`. A11y, empty states, and a `manualChunks` content split follow.

**Tech Stack:** Vite 5, React 18, TypeScript (strict), Tailwind 3 (`darkMode: 'class'`), Zustand + persist, Vitest + Testing Library (jsdom).

## Global Constraints

- UI text in Russian; pattern/term names in English. (copy rule from prior phases)
- Persist key is exactly `archmentor`; persisted shape is `{ state: { settings: { theme, ... }, ... }, version: 1 }`. The theme lives at `state.settings.theme`, values `'dark' | 'light'`, default `'dark'`.
- No new runtime or dev dependencies.
- `settings.theme` is changed only via the existing `setSettings({ theme })` store action — do NOT add a new action.
- After every task: `npx tsc --noEmit` clean and the full suite (`npm test`) green.
- Single `muted` secondary-text tier and single `accent`/`accent-soft` pair — no extra tiers.

---

### Task 1: Semantic color tokens

**Files:**
- Modify: `src/styles/index.css` (whole file, currently 6 lines)
- Modify: `tailwind.config.js:6-11` (the `colors` block)

**Interfaces:**
- Produces: Tailwind color utilities `bg-surface`, `bg-surface-raised`, `bg-surface-muted`, `border-surface-muted`, `text-content`, `text-muted`, `bg-accent`, `bg-accent-soft`, `text-accent-soft`, `border-accent`, `border-accent-soft` — all theme-aware via CSS vars. Later tasks consume these.

No behavior change yet: `index.html` still carries `class="dark"` (removed in Task 4), so the app keeps rendering dark. This task only introduces the token layer.

- [ ] **Step 1: Replace `src/styles/index.css` with the token definitions**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --surface: 248 250 252;        /* slate-50  */
  --surface-raised: 255 255 255; /* white     */
  --surface-muted: 226 232 240;  /* slate-200 */
  --content: 15 23 42;           /* slate-900 */
  --muted: 71 85 105;            /* slate-600 */
  --accent: 79 70 229;           /* indigo-600 */
  --accent-soft: 99 102 241;     /* indigo-500 */
  color-scheme: light;
}

.dark {
  --surface: 15 23 42;           /* slate-900 */
  --surface-raised: 30 41 59;    /* slate-800 */
  --surface-muted: 51 65 85;     /* slate-700 */
  --content: 241 245 249;        /* slate-100 */
  --muted: 148 163 184;          /* slate-400 */
  --accent: 99 102 241;          /* indigo-500 */
  --accent-soft: 129 140 248;    /* indigo-400 */
  color-scheme: dark;
}

body {
  @apply bg-surface text-content antialiased;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 2: Replace the `colors` block in `tailwind.config.js` (lines 6-11)**

```js
      colors: {
        surface: {
          DEFAULT: 'rgb(var(--surface) / <alpha-value>)',
          raised: 'rgb(var(--surface-raised) / <alpha-value>)',
          muted: 'rgb(var(--surface-muted) / <alpha-value>)',
        },
        content: 'rgb(var(--content) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          soft: 'rgb(var(--accent-soft) / <alpha-value>)',
        },
      },
```

- [ ] **Step 3: Verify typecheck, tests, and a dark build still work**

Run: `npx tsc --noEmit && npm test 2>&1 | tail -3`
Expected: tsc clean; 57 tests pass (components still use legacy `text-slate-*` classes, which remain valid Tailwind utilities).

- [ ] **Step 4: Commit**

```bash
git add src/styles/index.css tailwind.config.js
git commit -m "feat: semantic color tokens via CSS variables"
```

---

### Task 2: Migrate hardcoded colors to semantic tokens

**Files:**
- Modify: `src/app/Layout.tsx:21`, `src/app/ErrorBoundary.tsx:11`, `src/features/quiz/Quiz.tsx:56,77`, `src/features/learn/Learn.tsx:37,43,51,52`, `src/features/library/ConceptCard.tsx:14`, `src/features/review/Review.tsx:42,51,54,66`, `src/features/progress/Progress.tsx:19,21,24,28,30`, `src/features/library/Library.tsx:38`, `src/features/dashboard/Dashboard.tsx:19,21,24,29`, `src/features/library/ConceptPage.tsx:11,19,26,32,33,34`, `src/components/FlipCard.tsx:12,14`, `src/components/ProgressBar.tsx:5`, `src/components/Badge.tsx:5,6`, `src/components/PillGroup.tsx:11`

**Interfaces:**
- Consumes: token utilities from Task 1.

**Migration rules (apply exactly — the two KEEP cases are load-bearing):**

| Old class | New class | Notes |
|---|---|---|
| `text-slate-400` | `text-muted` | all occurrences |
| `text-slate-500` | `text-muted` | all occurrences |
| `text-slate-300` | `text-muted` | labels/badges: `Badge.tsx:5`, `PillGroup.tsx:11` |
| `text-slate-300` | `text-content` | **prose/lists**: `ConceptPage.tsx:11,32,33,34`, `Quiz.tsx:77` |
| `text-white` (on `bg-surface-raised`) | `text-content` | `Layout.tsx:21` active link — white would be invisible on the light-mode white raised surface |
| `hover:text-white` | `hover:text-content` | `Layout.tsx:21` |
| `text-white` (on `bg-accent`) | **KEEP** `text-white` | `PillGroup.tsx:11` active pill — white on saturated indigo, correct in both themes |
| `text-white` (on colored button) | **KEEP** `text-white` | `Review.tsx:62` grade buttons — white on red/amber/green |

- [ ] **Step 1: Edit `Layout.tsx:21`** — change `bg-surface-raised text-white` → `bg-surface-raised text-content`, and `text-slate-400 hover:text-white` → `text-muted hover:text-content`.

- [ ] **Step 2: Edit the remaining files per the table.** Concretely:
  - `ErrorBoundary.tsx:11`: `text-slate-400` → `text-muted`
  - `Quiz.tsx:56`: `text-slate-400` → `text-muted`; `Quiz.tsx:77`: `text-slate-300` → `text-content`
  - `Learn.tsx:37,43,51,52`: each `text-slate-400` → `text-muted`
  - `ConceptCard.tsx:14`: `text-slate-400` → `text-muted`
  - `Review.tsx:42,51,54`: `text-slate-400` → `text-muted`; `Review.tsx:66`: `text-slate-500` → `text-muted`; `Review.tsx:62`: leave `text-white`
  - `Progress.tsx:19,24,28`: `text-slate-400` → `text-muted`; `Progress.tsx:21,30`: `text-slate-500` → `text-muted`
  - `Library.tsx:38`: `text-slate-400` → `text-muted`
  - `Dashboard.tsx:19,24,29`: `text-slate-400` → `text-muted`; `Dashboard.tsx:21`: `text-slate-500` → `text-muted`
  - `ConceptPage.tsx:11,32,33,34`: `text-slate-300` → `text-content`; `ConceptPage.tsx:19,26`: `text-slate-400` → `text-muted`
  - `FlipCard.tsx:12`: `text-slate-400` → `text-muted`; `FlipCard.tsx:14`: `text-slate-500` → `text-muted`
  - `ProgressBar.tsx:5`: `text-slate-400` → `text-muted`
  - `Badge.tsx:5`: `text-slate-300` → `text-muted`; `Badge.tsx:6`: `text-slate-400` → `text-muted`
  - `PillGroup.tsx:11`: inactive `text-slate-300` → `text-muted`; leave active `text-white`

- [ ] **Step 3: Verify no stray dark-only text classes remain except the two KEEP cases**

Run: `grep -rnE "text-(slate|gray|zinc|neutral)-[0-9]+" src --include="*.tsx"`
Expected: no output.

Run: `grep -rnE "text-white" src --include="*.tsx"`
Expected: exactly two lines — `PillGroup.tsx:11` and `Review.tsx:62`.

- [ ] **Step 4: Verify typecheck and tests**

Run: `npx tsc --noEmit && npm test 2>&1 | tail -3`
Expected: tsc clean; 57 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/app src/features src/components
git commit -m "refactor: migrate hardcoded colors to semantic tokens"
```

---

### Task 3: Theme apply helper

**Files:**
- Create: `src/app/theme.ts`
- Test: `src/app/theme.test.ts`

**Interfaces:**
- Produces: `export type Theme = 'dark' | 'light'`; `export function applyTheme(theme: Theme): void` — toggles the `dark` class on `document.documentElement`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { applyTheme } from './theme';

describe('applyTheme', () => {
  beforeEach(() => document.documentElement.classList.remove('dark'));

  it('adds the dark class for the dark theme', () => {
    applyTheme('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('removes the dark class for the light theme', () => {
    document.documentElement.classList.add('dark');
    applyTheme('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/theme.test.ts`
Expected: FAIL — cannot resolve `./theme`.

- [ ] **Step 3: Write the implementation**

```ts
export type Theme = 'dark' | 'light';

/** Sync the document's theme class with the given theme. */
export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/theme.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/theme.ts src/app/theme.test.ts
git commit -m "feat: applyTheme helper"
```

---

### Task 4: Theme toggle, runtime sync, and pre-paint FOUC guard

**Files:**
- Create: `src/components/ThemeToggle.tsx`
- Test: `src/components/ThemeToggle.test.tsx`
- Modify: `src/app/Layout.tsx` (add toggle + effect)
- Modify: `index.html` (remove `class="dark"`, add inline script)

**Interfaces:**
- Consumes: `applyTheme` (Task 3); store `settings.theme` and `setSettings` (existing).
- Produces: `export function ThemeToggle(): JSX.Element`.

- [ ] **Step 1: Write the failing ThemeToggle test**

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from './ThemeToggle';
import { useStore } from '@/store/useStore';

describe('ThemeToggle', () => {
  beforeEach(() => useStore.getState().setSettings({ theme: 'dark' }));

  it('exposes an accessible label and pressed state', () => {
    render(<ThemeToggle />);
    const btn = screen.getByRole('button', { name: /переключить/i });
    expect(btn).toHaveAttribute('aria-pressed', 'true');
  });

  it('toggles the persisted theme on click', async () => {
    render(<ThemeToggle />);
    await userEvent.click(screen.getByRole('button', { name: /переключить/i }));
    expect(useStore.getState().settings.theme).toBe('light');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/ThemeToggle.test.tsx`
Expected: FAIL — cannot resolve `./ThemeToggle`.

- [ ] **Step 3: Implement `ThemeToggle.tsx`**

```tsx
import { useStore } from '@/store/useStore';

export function ThemeToggle() {
  const theme = useStore((s) => s.settings.theme);
  const setSettings = useStore((s) => s.setSettings);
  const next = theme === 'dark' ? 'light' : 'dark';
  return (
    <button
      type="button"
      onClick={() => setSettings({ theme: next })}
      aria-label={`Переключить на ${next === 'dark' ? 'тёмную' : 'светлую'} тему`}
      aria-pressed={theme === 'dark'}
      className="rounded-lg px-2 py-1.5 text-muted hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/ThemeToggle.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Wire the toggle and runtime sync into `Layout.tsx`**

Replace the file with:

```tsx
import { useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { applyTheme } from './theme';
import { ThemeToggle } from '@/components/ThemeToggle';

const NAV = [
  { to: '/', label: 'Дашборд', end: true },
  { to: '/learn', label: 'Учить' },
  { to: '/review', label: 'Повторение' },
  { to: '/quiz', label: 'Квиз' },
  { to: '/library', label: 'Библиотека' },
  { to: '/progress', label: 'Прогресс' },
];

export function Layout() {
  const theme = useStore((s) => s.settings.theme);
  useEffect(() => { applyTheme(theme); }, [theme]);

  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-3 focus:py-1.5 focus:text-white">
        К содержимому
      </a>
      <header className="border-b border-surface-muted">
        <nav aria-label="Основная" className="max-w-5xl mx-auto flex items-center gap-1 px-4 py-3 overflow-x-auto">
          <span className="font-bold text-accent-soft mr-4">ArchMentor</span>
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${isActive ? 'bg-surface-raised text-content' : 'text-muted hover:text-content'}`}>
              {n.label}
            </NavLink>
          ))}
          <span className="ml-auto"><ThemeToggle /></span>
        </nav>
      </header>
      <main id="main" tabIndex={-1} className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 focus:outline-none"><Outlet /></main>
    </div>
  );
}
```

- [ ] **Step 6: Remove `class="dark"` from `index.html` and add the pre-paint script**

Change line 2 from `<html lang="ru" class="dark">` to `<html lang="ru">`, and add inside `<head>` (after the `<title>`):

```html
    <script>
      try {
        var s = JSON.parse(localStorage.getItem('archmentor') || '{}');
        if (s && s.state && s.state.settings && s.state.settings.theme === 'light') {
          document.documentElement.classList.remove('dark');
        } else {
          document.documentElement.classList.add('dark');
        }
      } catch (e) { document.documentElement.classList.add('dark'); }
    </script>
```

- [ ] **Step 7: Verify typecheck and full suite**

Run: `npx tsc --noEmit && npm test 2>&1 | tail -3`
Expected: tsc clean; all tests pass (App/Layout render tests must still find "ArchMentor" and nav links).

- [ ] **Step 8: Verify the toggle in the real app**

Run: `npm run dev` then open the app, click the toggle, confirm the whole UI flips light/dark and the choice survives a reload with no flash of the wrong theme. Stop the dev server.

- [ ] **Step 9: Commit**

```bash
git add src/components/ThemeToggle.tsx src/components/ThemeToggle.test.tsx src/app/Layout.tsx index.html
git commit -m "feat: theme toggle with persisted state and pre-paint guard"
```

---

### Task 5: Contrast & focus verification

**Files:**
- Modify: `src/features/library/Library.tsx` (search input accessible name)

**Interfaces:**
- Consumes: tokens (Task 1), focus-visible rings added in Task 4.

This task confirms WCAG AA contrast for the chosen palette and gives the search input an accessible name. (Skip-link, nav landmark, focus rings, and reduced-motion were delivered in Tasks 1 and 4.)

- [ ] **Step 1: Add an accessible name to the Library search input**

In `src/features/library/Library.tsx`, add `aria-label="Поиск концептов"` to the search `<input>` (the element with the `/поиск/i` placeholder). Add `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent` to its className if not already present.

- [ ] **Step 2: Add a failing test for the accessible name**

Append to `src/features/library/Library.test.tsx`:

```tsx
  it('search input has an accessible name', () => {
    renderLib();
    expect(screen.getByRole('textbox', { name: /поиск/i })).toBeInTheDocument();
  });
```

Run: `npx vitest run src/features/library/Library.test.tsx`
Expected: PASS (the `aria-label` from Step 1 satisfies it).

- [ ] **Step 3: Verify palette contrast meets WCAG AA (≥ 4.5:1)**

Create a throwaway script `/tmp/contrast.mjs`:

```js
const hex = { s50:'f8fafc', white:'ffffff', s900:'0f172a', s600:'475569', i600:'4f46e5',
              s800:'1e293b', s100:'f1f5f9', s400:'94a3b8', i400:'818cf8' };
const lin = (c) => { c/=255; return c <= 0.03928 ? c/12.92 : ((c+0.055)/1.055)**2.4; };
const L = (h) => 0.2126*lin(parseInt(h.slice(0,2),16)) + 0.7152*lin(parseInt(h.slice(2,4),16)) + 0.0722*lin(parseInt(h.slice(4,6),16));
const ratio = (a,b) => { const [x,y]=[L(a),L(b)].sort((p,q)=>q-p); return ((x+0.05)/(y+0.05)).toFixed(2); };
console.log('LIGHT content/surface', ratio(hex.s900,hex.s50));
console.log('LIGHT muted/surface  ', ratio(hex.s600,hex.s50));
console.log('LIGHT muted/raised   ', ratio(hex.s600,hex.white));
console.log('LIGHT accent/surface ', ratio(hex.i600,hex.s50));
console.log('DARK  content/surface', ratio(hex.s100,hex.s900));
console.log('DARK  muted/surface  ', ratio(hex.s400,hex.s900));
console.log('DARK  muted/raised   ', ratio(hex.s400,hex.s800));
console.log('DARK  accentSoft/surf', ratio(hex.i400,hex.s900));
```

Run: `node /tmp/contrast.mjs`
Expected: every ratio ≥ 4.5 (content pairs ~15+, muted pairs ~5+, accent pairs ~6+). If any pair is < 4.5, darken/lighten that token in `index.css` and re-run before committing.

- [ ] **Step 4: Verify typecheck and tests**

Run: `npx tsc --noEmit && npm test 2>&1 | tail -3`
Expected: tsc clean; all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/library/Library.tsx src/features/library/Library.test.tsx
git commit -m "feat: accessible search label and AA contrast verification"
```

---

### Task 6: Reusable EmptyState component

**Files:**
- Create: `src/components/EmptyState.tsx`
- Test: `src/components/EmptyState.test.tsx`

**Interfaces:**
- Produces: `export function EmptyState(props: { icon?: string; title: string; hint?: string; cta?: { to: string; label: string } }): JSX.Element`.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renders title and hint', () => {
    render(<MemoryRouter><EmptyState title="Ничего нет" hint="Загляните позже" /></MemoryRouter>);
    expect(screen.getByText('Ничего нет')).toBeInTheDocument();
    expect(screen.getByText('Загляните позже')).toBeInTheDocument();
  });

  it('renders a CTA link when provided', () => {
    render(<MemoryRouter><EmptyState title="Пусто" cta={{ to: '/quiz', label: 'В квиз' }} /></MemoryRouter>);
    expect(screen.getByRole('link', { name: 'В квиз' })).toHaveAttribute('href', '/quiz');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/EmptyState.test.tsx`
Expected: FAIL — cannot resolve `./EmptyState`.

- [ ] **Step 3: Implement `EmptyState.tsx`**

```tsx
import { Link } from 'react-router-dom';

export function EmptyState({
  icon = '🗂️', title, hint, cta,
}: { icon?: string; title: string; hint?: string; cta?: { to: string; label: string } }) {
  return (
    <div className="text-center py-12 space-y-3">
      <div className="text-4xl" aria-hidden="true">{icon}</div>
      <p className="text-lg font-medium text-content">{title}</p>
      {hint && <p className="text-sm text-muted">{hint}</p>}
      {cta && (
        <Link to={cta.to}
          className="inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
          {cta.label}
        </Link>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/EmptyState.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/EmptyState.tsx src/components/EmptyState.test.tsx
git commit -m "feat: reusable EmptyState component"
```

---

### Task 7: Adopt EmptyState across screens + Quiz empty-filter fix

**Files:**
- Modify: `src/features/learn/Learn.tsx:37`, `src/features/review/Review.tsx:41-43` (empty branch), `src/features/library/Library.tsx:38`, `src/features/library/ConceptPage.tsx:19`, `src/features/quiz/Quiz.tsx` (empty-deck branch), `src/features/progress/Progress.tsx` (no-attempts hint)
- Test: `src/features/quiz/Quiz.test.tsx` (add empty-filter case)

**Interfaces:**
- Consumes: `EmptyState` (Task 6).

- [ ] **Step 1: Replace the inline empty states with `EmptyState`**
  - `Learn.tsx:37`: replace `<p className="text-muted">Нет карточек для выбранного фильтра.</p>` with `<EmptyState icon="🃏" title="Нет карточек" hint="Для выбранного фильтра карточек нет." />` and add `import { EmptyState } from '@/components/EmptyState';`.
  - `Review.tsx` empty branch (around line 42, "На сегодня всё повторено"): replace the paragraph with `<EmptyState icon="🎉" title="На сегодня всё повторено" hint="Возвращайтесь завтра — карточки появятся по расписанию." cta={{ to: '/learn', label: 'Учить новое' }} />` and add the import.
  - `Library.tsx:38`: replace `<p className="text-muted">Ничего не найдено.</p>` with `<EmptyState icon="🔍" title="Ничего не найдено" hint="Попробуйте изменить запрос или фильтры." />` and add the import.
  - `ConceptPage.tsx:19`: replace the "Концепт не найден" block with `<EmptyState icon="🧭" title="Концепт не найден" cta={{ to: '/library', label: '← В библиотеку' }} />` and add the import.

- [ ] **Step 2: Fix the Quiz empty-filter branch**

In `src/features/quiz/Quiz.tsx`, add `import { EmptyState } from '@/components/EmptyState';`, and immediately before the `if (!q) {` score branch (line 41), insert:

```tsx
  if (deck.length === 0) {
    return <EmptyState icon="🧪" title="Нет вопросов" hint="Для выбранного режима вопросов пока нет." />;
  }
```

This distinguishes an empty filter from a finished session (the `!q` branch keeps showing "Готово!" only after answering a non-empty deck).

- [ ] **Step 3: Add a no-attempts hint to Progress**

In `src/features/progress/Progress.tsx`, after the stats `</section>` that holds the tiles, when `total === 0` render a hint. Add below the first `<section>` (the grid, ends at line 32):

```tsx
      {total === 0 && (
        <p className="text-sm text-muted">Пройдите квиз, чтобы увидеть точность и освоение.</p>
      )}
```

- [ ] **Step 4: Add the Quiz empty-filter test**

Append to `src/features/quiz/Quiz.test.tsx`:

```tsx
import { vi } from 'vitest';

describe('Quiz empty filter', () => {
  it('shows an empty state when no questions match', async () => {
    vi.doMock('@/content/index', () => ({ questions: [] }));
    vi.resetModules();
    const { Quiz: FreshQuiz } = await import('./Quiz');
    const { render, screen } = await import('@testing-library/react');
    const { MemoryRouter } = await import('react-router-dom');
    render(<MemoryRouter><FreshQuiz /></MemoryRouter>);
    expect(screen.getByText('Нет вопросов')).toBeInTheDocument();
    vi.doUnmock('@/content/index');
  });
});
```

- [ ] **Step 5: Run the affected tests**

Run: `npx vitest run src/features/quiz/Quiz.test.tsx src/features/library/Library.test.tsx`
Expected: PASS (existing cases plus the new empty-filter case).

- [ ] **Step 6: Verify typecheck and full suite**

Run: `npx tsc --noEmit && npm test 2>&1 | tail -3`
Expected: tsc clean; all tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/features src/components
git commit -m "feat: consistent empty states and quiz empty-filter handling"
```

---

### Task 8: Split content into its own chunk

**Files:**
- Modify: `vite.config.ts` (repo root) — the object returned by `defineConfig`

**Interfaces:**
- Consumes: nothing. Produces: a separate `content-*.js` build chunk.

- [ ] **Step 1: Add `manualChunks` to `vite.config.ts`**

Inside the object returned by `defineConfig(({ mode }) => ({ ... }))`, add a `build` key alongside `base`, `plugins`, `resolve`:

```ts
    build: {
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('/src/content/')) return 'content';
          },
        },
      },
    },
```

- [ ] **Step 2: Build and confirm the split + no size warning**

Run: `npm run build 2>&1 | tail -20`
Expected: a `dist/assets/content-*.js` chunk (~150-200 kB) appears; the main `index-*.js` chunk drops below 500 kB; the `(!) Some chunks are larger than 500 kB` warning is gone.

- [ ] **Step 3: Confirm the app still boots against the split build**

Run: `npm run preview` then load the app; navigate to Library and open a concept to confirm content loads. Stop the preview server.

- [ ] **Step 4: Commit**

```bash
git add vite.config.ts
git commit -m "perf: split content data into its own chunk"
```

---

### Task 9: Responsive audit at mobile width

**Files:**
- Modify (only if the audit finds problems): any feature/component file

**Interfaces:** none.

- [ ] **Step 1: Audit the app at 375 px**

Run: `npm run dev`, open the app, set the browser viewport to 375 px wide (device toolbar), and walk every route: Dashboard, Learn, Review, Quiz, Library, ConceptPage, Progress. Check:
  - nav bar scrolls horizontally without breaking layout (it uses `overflow-x-auto`);
  - stat/card grids collapse to one column (`sm:grid-cols-3` already handles this — verify);
  - the quiz/ConceptPage code block scrolls horizontally inside its container (`CodeBlock` has `overflow-x-auto` — verify no page-level horizontal scroll);
  - ConceptPage long text wraps and stays readable.

- [ ] **Step 2: Fix any overflow found**

For any element causing page-level horizontal scroll, wrap wide content in `overflow-x-auto` or add responsive spacing. If the audit finds nothing, record that and skip to Step 3. Do not restructure layouts that already work.

- [ ] **Step 3: Verify typecheck and full suite; stop the dev server**

Run: `npx tsc --noEmit && npm test 2>&1 | tail -3`
Expected: tsc clean; all tests pass.

- [ ] **Step 4: Commit (only if Step 2 changed files)**

```bash
git add -A && git commit -m "fix: responsive tweaks for mobile widths"
```

If nothing changed, note "responsive audit passed, no changes needed" and proceed.

---

### Task 10: Final verification & README status

**Files:**
- Modify: `README.md` (status section)

- [ ] **Step 1: Full verification**

Run: `npx tsc --noEmit && npm test 2>&1 | tail -3 && npm run build 2>&1 | tail -6`
Expected: tsc clean; all tests pass; build succeeds with no chunk-size warning.

- [ ] **Step 2: Update the README status section** to mark Phase 3 complete (light/dark theme, a11y, empty states, content chunk) and note the project is feature-complete.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: mark phase 3 complete"
```

---

## Self-Review Notes

- **Spec coverage:** §3 tokens → Task 1; migration → Task 2; §4 toggle/FOUC → Tasks 3-4; §5 a11y (skip-link/focus/nav landmark/reduced-motion delivered in Tasks 1&4; search label + contrast) → Task 5; §6 empty states → Tasks 6-7; §7 chunk → Task 8, responsive → Task 9; §9 tests folded into each task; §10 done-criteria → Task 10.
- **Spec correction:** the spec drafted the persist key as `archmentor:v1`; the actual zustand key is `archmentor` (see Global Constraints). The inline script and tests use `archmentor`.
- **Reuse:** no new `setTheme` action — the existing `setSettings({ theme })` is used, per Global Constraints.
- **The two `text-white` KEEP cases** (PillGroup active pill, Review grade buttons) are called out explicitly because a blind find-replace would break contrast on saturated backgrounds; the Layout active-nav `text-white` is the opposite case and must migrate.
