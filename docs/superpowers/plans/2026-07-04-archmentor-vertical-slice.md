# ArchMentor Vertical Slice — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully working client-side learning app (ArchMentor) on a *seed* content set, proving the full loop — learn flashcards → SRS review → quiz → tracked progress — and freezing the content schema before bulk content generation.

**Architecture:** Clean layer boundaries — `content` (typed data + zod validation) ↔ `domain` (pure SRS/quiz logic, unit-tested) ↔ `store` (Zustand + persist) ↔ `features`/`components` (React UI). Domain and content are framework-agnostic and fully tested; UI reads content and domain output through the store.

**Tech Stack:** Vite, React 18, TypeScript (strict), React Router v6, Zustand (+persist), Tailwind CSS, Vitest + Testing Library, react-syntax-highlighter (Prism), zod.

## Global Constraints

- **TypeScript strict mode** — `"strict": true` in tsconfig; no `any` in committed code.
- **Language rule** — UI copy and explanations in **Russian**; pattern/principle names and technical terms in **English** (e.g. `Strategy`, `Single Responsibility Principle`).
- **Code samples** — all `codeExample`/`Question.code` are `lang: 'typescript'`, idiomatic, and demonstrate exactly one concept.
- **Purity rule** — domain functions (`src/domain/**`) and all date helpers except `todayISO` never call `Date.now()` / `new Date()` internally; the current date is always passed in as an ISO `YYYY-MM-DD` string argument. **`todayISO` is the single sanctioned clock boundary** — it is the only function permitted to read the current time (via a `new Date()` default arg), and UI code obtains "today" only by calling it.
- **Node** — Node 18+ (Vite 5 requirement).
- **Package manager** — npm.
- **Test runner** — Vitest; test files are colocated as `*.test.ts(x)`.
- **Persist key** — `archmentor` with numeric `version` (starts at `1`).

---

## Shared Type Reference (defined in Task 2, referenced everywhere)

These names/signatures are authoritative. Every later task uses them verbatim.

```ts
// src/content/schema.ts (types inferred from zod)
type Grade = 'junior' | 'middle' | 'senior' | 'lead';
type Category = 'solid' | 'creational' | 'structural' | 'behavioral' | 'architecture' | 'tradeoff';
type QuestionType = 'identify-pattern' | 'concept' | 'tradeoff' | 'code-smell';

interface CodeSample { lang: 'typescript'; code: string; highlightLines?: number[]; }

interface Concept {
  id: string; name: string; aka?: string[];
  category: Category; grade: Grade;
  tagline: string; definition: string; problem: string; solution: string;
  codeExample: CodeSample;
  pros: string[]; cons: string[]; tradeoffs: string[];
  whenToUse: string[]; whenNotToUse?: string[];
  related: string[]; tags?: string[];
}

interface Question {
  id: string; type: QuestionType; category: Category; grade: Grade;
  prompt: string; code?: CodeSample;
  options: string[]; correctIndex: number; explanation: string; conceptId?: string;
}
```

Other cross-task signatures:

```ts
// src/lib/date.ts
function todayISO(now?: Date): string;              // 'YYYY-MM-DD' (UTC-safe)
function addDays(iso: string, days: number): string;
function daysBetween(fromISO: string, toISO: string): number; // to - from, in whole days
function isDue(dueISO: string, todayISO: string): boolean;     // dueISO <= todayISO

// src/domain/srs/sm2.ts
type Quality = 0 | 1 | 2 | 3 | 4 | 5;
const QUALITY: { again: 2; hard: 3; good: 4; easy: 5 };
interface SrsState { conceptId: string; ease: number; interval: number; repetitions: number; due: string; lastReviewed?: string; }
function initSrs(conceptId: string, today: string): SrsState;
function review(state: SrsState, quality: Quality, today: string): SrsState;

// src/domain/quiz/selection.ts
interface QuizFilter { category?: Category; grade?: Grade; type?: QuestionType; limit?: number; }
type Shuffle = <T>(arr: T[]) => T[];
function selectQuestions(all: Question[], filter: QuizFilter, shuffle: Shuffle): Question[];
function isCorrect(q: Question, selectedIndex: number): boolean;
function scoreSession(questions: Question[], answers: Record<string, number>): { correct: number; total: number };

// src/store/useStore.ts
interface QuizResult { questionId: string; selectedIndex: number; correct: boolean; at: string; }
interface Streak { current: number; longest: number; lastActiveDate: string | null; }
interface Settings { theme: 'dark' | 'light'; gradeFilter: Grade | 'all'; categoryFilter: Category | 'all'; }
// store actions: reviewConcept(conceptId, quality, today), recordQuiz(questionId, selectedIndex, correct, today),
//                markSeen(conceptId, today), setSettings(partial), resetProgress()
// selectors (pure, exported): selectDueConceptIds(state, today), selectGradeProgress(state, concepts, grade), isMastered(state, conceptId)
```

---

### Task 1: Project scaffold & tooling

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `postcss.config.js`, `tailwind.config.js`, `src/main.tsx`, `src/app/App.tsx`, `src/styles/index.css`, `src/vite-env.d.ts`, `src/test-setup.ts`
- Test: `src/lib/smoke.test.ts`

**Interfaces:**
- Produces: a runnable Vite app (`npm run dev`), passing test run (`npm test`), clean build (`npm run build`), and Tailwind available.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "archmentor",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.0",
    "zustand": "^4.5.5",
    "zod": "^3.23.8",
    "react-syntax-highlighter": "^15.5.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.8",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@types/react-syntax-highlighter": "^15.5.13",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.20",
    "jsdom": "^24.1.1",
    "postcss": "^8.4.41",
    "tailwindcss": "^3.4.10",
    "typescript": "^5.5.4",
    "vite": "^5.4.2",
    "vitest": "^2.0.5"
  }
}
```

- [ ] **Step 2: Create config files**

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": false,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] },
    "types": ["vitest/globals"]
  },
  "include": ["src"]
}
```

Note: jest-dom matcher types (`toBeInTheDocument`, etc.) are made available to `tsc` via the `src/test-setup.ts` import below (it augments `vitest`'s `Assertion` interface, and `test-setup.ts` is inside `include`), so no extra `types` entry is needed.

`vite.config.ts`:
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
} as any);
```

`postcss.config.js`:
```js
export default { plugins: { tailwindcss: {}, autoprefixer: {} } };
```

`tailwind.config.js`:
```js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: { DEFAULT: '#0f172a', raised: '#1e293b', muted: '#334155' },
        accent: { DEFAULT: '#6366f1', soft: '#818cf8' },
      },
    },
  },
  plugins: [],
};
```

`index.html`:
```html
<!doctype html>
<html lang="ru" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ArchMentor</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 3: Create entry files**

`src/vite-env.d.ts`:
```ts
/// <reference types="vite/client" />
```

`src/test-setup.ts`:
```ts
import '@testing-library/jest-dom/vitest';
```

`src/styles/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root { color-scheme: dark; }
body { @apply bg-surface text-slate-100 antialiased; }
```

`src/app/App.tsx`:
```tsx
export default function App() {
  return <div className="p-8 text-2xl font-semibold">ArchMentor</div>;
}
```

`src/main.tsx`:
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 4: Write the smoke test**

`src/lib/smoke.test.ts`:
```ts
import { describe, it, expect } from 'vitest';

describe('toolchain', () => {
  it('runs vitest', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Install and verify**

```bash
npm install
npm test
```
Expected: 1 passing test.

```bash
npm run build
```
Expected: `tsc --noEmit` passes and `vite build` writes `dist/` with no errors.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + React + TS + Tailwind + Vitest"
```

---

### Task 2: Content schema & validation (zod)

**Files:**
- Create: `src/content/schema.ts`
- Test: `src/content/schema.test.ts`

**Interfaces:**
- Produces: zod schemas `ConceptSchema`, `QuestionSchema`; inferred types `Concept`, `Question`, `Grade`, `Category`, `QuestionType`, `CodeSample`; and `validateContent(concepts, questions)` which throws on integrity violations. Consumed by Tasks 6, 7, and every UI task.

- [ ] **Step 1: Write the failing test**

`src/content/schema.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { ConceptSchema, QuestionSchema, validateContent } from './schema';
import type { Concept, Question } from './schema';

const concept: Concept = {
  id: 'strategy', name: 'Strategy', category: 'behavioral', grade: 'middle',
  tagline: 'Меняем алгоритм на лету',
  definition: 'Определяет семейство алгоритмов и делает их взаимозаменяемыми.',
  problem: 'Жёстко зашитый алгоритм трудно менять.',
  solution: 'Выносим алгоритм за интерфейс и внедряем его.',
  codeExample: { lang: 'typescript', code: 'interface S { run(): void }' },
  pros: ['Гибкость'], cons: ['Больше классов'], tradeoffs: ['Гибкость против простоты'],
  whenToUse: ['Много вариантов поведения'], related: ['state'],
};

const question: Question = {
  id: 'q-strategy-1', type: 'identify-pattern', category: 'behavioral', grade: 'middle',
  prompt: 'Какой паттерн?', code: { lang: 'typescript', code: 'class C {}' },
  options: ['Strategy', 'State'], correctIndex: 0,
  explanation: 'Алгоритм внедряется извне — это Strategy, а не State.',
  conceptId: 'strategy',
};

describe('schema', () => {
  it('accepts a valid concept and question', () => {
    expect(ConceptSchema.parse(concept)).toEqual(concept);
    expect(QuestionSchema.parse(question)).toEqual(question);
  });

  it('rejects correctIndex out of range', () => {
    expect(() => validateContent([concept], [{ ...question, correctIndex: 5 }])).toThrow(/correctIndex/);
  });

  it('rejects duplicate concept ids', () => {
    expect(() => validateContent([concept, concept], [])).toThrow(/duplicate/i);
  });

  it('rejects related pointing to unknown concept', () => {
    expect(() => validateContent([{ ...concept, related: ['ghost'] }], [])).toThrow(/related/);
  });

  it('rejects question.conceptId pointing to unknown concept', () => {
    expect(() => validateContent([concept], [{ ...question, conceptId: 'ghost' }])).toThrow(/conceptId/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/content/schema.test.ts`
Expected: FAIL — cannot import from `./schema`.

- [ ] **Step 3: Write the schema**

`src/content/schema.ts`:
```ts
import { z } from 'zod';

export const GradeSchema = z.enum(['junior', 'middle', 'senior', 'lead']);
export const CategorySchema = z.enum(['solid', 'creational', 'structural', 'behavioral', 'architecture', 'tradeoff']);
export const QuestionTypeSchema = z.enum(['identify-pattern', 'concept', 'tradeoff', 'code-smell']);

export const CodeSampleSchema = z.object({
  lang: z.literal('typescript'),
  code: z.string().min(1),
  highlightLines: z.array(z.number().int().nonnegative()).optional(),
});

export const ConceptSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  aka: z.array(z.string()).optional(),
  category: CategorySchema,
  grade: GradeSchema,
  tagline: z.string().min(1),
  definition: z.string().min(1),
  problem: z.string().min(1),
  solution: z.string().min(1),
  codeExample: CodeSampleSchema,
  pros: z.array(z.string()).min(1),
  cons: z.array(z.string()).min(1),
  tradeoffs: z.array(z.string()).min(1),
  whenToUse: z.array(z.string()).min(1),
  whenNotToUse: z.array(z.string()).optional(),
  related: z.array(z.string()),
  tags: z.array(z.string()).optional(),
});

export const QuestionSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  type: QuestionTypeSchema,
  category: CategorySchema,
  grade: GradeSchema,
  prompt: z.string().min(1),
  code: CodeSampleSchema.optional(),
  options: z.array(z.string().min(1)).min(2),
  correctIndex: z.number().int().nonnegative(),
  explanation: z.string().min(1),
  conceptId: z.string().optional(),
});

export type Grade = z.infer<typeof GradeSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type QuestionType = z.infer<typeof QuestionTypeSchema>;
export type CodeSample = z.infer<typeof CodeSampleSchema>;
export type Concept = z.infer<typeof ConceptSchema>;
export type Question = z.infer<typeof QuestionSchema>;

/** Validates shape + cross-references. Throws Error with a descriptive message on any violation. */
export function validateContent(concepts: Concept[], questions: Question[]): void {
  concepts.forEach((c) => ConceptSchema.parse(c));
  questions.forEach((q) => QuestionSchema.parse(q));

  const ids = new Set<string>();
  for (const c of concepts) {
    if (ids.has(c.id)) throw new Error(`duplicate concept id: ${c.id}`);
    ids.add(c.id);
  }

  const qIds = new Set<string>();
  for (const q of questions) {
    if (qIds.has(q.id)) throw new Error(`duplicate question id: ${q.id}`);
    qIds.add(q.id);
  }

  // Question checks run before the concept `related` check so that a
  // dangling `related` in a fixture doesn't mask a correctIndex/conceptId
  // assertion. All checks are fail-fast and independent — order only affects
  // which error surfaces first when multiple violations coexist.
  for (const q of questions) {
    if (q.correctIndex >= q.options.length) {
      throw new Error(`question "${q.id}" correctIndex ${q.correctIndex} is out of range (${q.options.length} options)`);
    }
    if (q.conceptId && !ids.has(q.conceptId)) {
      throw new Error(`question "${q.id}" conceptId "${q.conceptId}" is not a known concept`);
    }
  }

  for (const c of concepts) {
    for (const r of c.related) {
      if (!ids.has(r)) throw new Error(`concept "${c.id}" has related "${r}" that is not a known concept`);
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/content/schema.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/content/schema.ts src/content/schema.test.ts
git commit -m "feat: content schema with zod validation and integrity checks"
```

---

### Task 3: Date utilities

**Files:**
- Create: `src/lib/date.ts`
- Test: `src/lib/date.test.ts`

**Interfaces:**
- Produces: `todayISO`, `addDays`, `daysBetween`, `isDue` (signatures in Shared Type Reference). Consumed by Tasks 4, 7, and Dashboard.

- [ ] **Step 1: Write the failing test**

`src/lib/date.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { todayISO, addDays, daysBetween, isDue } from './date';

describe('date utils', () => {
  it('todayISO formats a given date as YYYY-MM-DD (UTC)', () => {
    expect(todayISO(new Date('2026-07-04T23:30:00Z'))).toBe('2026-07-04');
  });

  it('addDays adds days across month boundary', () => {
    expect(addDays('2026-07-30', 3)).toBe('2026-08-02');
  });

  it('addDays handles zero', () => {
    expect(addDays('2026-07-04', 0)).toBe('2026-07-04');
  });

  it('daysBetween returns whole-day difference', () => {
    expect(daysBetween('2026-07-04', '2026-07-06')).toBe(2);
    expect(daysBetween('2026-07-06', '2026-07-04')).toBe(-2);
  });

  it('isDue is true when due date is today or earlier', () => {
    expect(isDue('2026-07-03', '2026-07-04')).toBe(true);
    expect(isDue('2026-07-04', '2026-07-04')).toBe(true);
    expect(isDue('2026-07-05', '2026-07-04')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/date.test.ts`
Expected: FAIL — cannot import from `./date`.

- [ ] **Step 3: Write the implementation**

`src/lib/date.ts`:
```ts
/** Formats a Date as a UTC 'YYYY-MM-DD' string. Defaults to now (only non-pure call site). */
export function todayISO(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

const MS_PER_DAY = 86_400_000;

function toUTC(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

export function addDays(iso: string, days: number): string {
  return new Date(toUTC(iso) + days * MS_PER_DAY).toISOString().slice(0, 10);
}

export function daysBetween(fromISO: string, toISO: string): number {
  return Math.round((toUTC(toISO) - toUTC(fromISO)) / MS_PER_DAY);
}

export function isDue(dueISO: string, todayISOValue: string): boolean {
  return toUTC(dueISO) <= toUTC(todayISOValue);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/date.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/date.ts src/lib/date.test.ts
git commit -m "feat: pure date utilities (todayISO, addDays, daysBetween, isDue)"
```

---

### Task 4: SM-2 SRS engine

**Files:**
- Create: `src/domain/srs/sm2.ts`
- Test: `src/domain/srs/sm2.test.ts`

**Interfaces:**
- Consumes: `addDays` from `@/lib/date`.
- Produces: `Quality`, `QUALITY`, `SrsState`, `initSrs`, `review` (signatures in Shared Type Reference). Consumed by Task 7 (store) and Task 12 (review UI).

- [ ] **Step 1: Write the failing test**

`src/domain/srs/sm2.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { initSrs, review, QUALITY } from './sm2';

describe('SM-2', () => {
  it('initSrs sets defaults due today', () => {
    const s = initSrs('strategy', '2026-07-04');
    expect(s).toEqual({ conceptId: 'strategy', ease: 2.5, interval: 0, repetitions: 0, due: '2026-07-04' });
  });

  it('first successful review sets interval 1 day', () => {
    const s = review(initSrs('x', '2026-07-04'), QUALITY.good, '2026-07-04');
    expect(s.repetitions).toBe(1);
    expect(s.interval).toBe(1);
    expect(s.due).toBe('2026-07-05');
    expect(s.lastReviewed).toBe('2026-07-04');
  });

  it('second successful review sets interval 6 days', () => {
    let s = review(initSrs('x', '2026-07-04'), QUALITY.good, '2026-07-04');
    s = review(s, QUALITY.good, '2026-07-05');
    expect(s.repetitions).toBe(2);
    expect(s.interval).toBe(6);
    expect(s.due).toBe('2026-07-11');
  });

  it('third review multiplies interval by ease and rounds', () => {
    let s = review(initSrs('x', '2026-07-04'), QUALITY.good, '2026-07-04'); // int 1, ease 2.5
    s = review(s, QUALITY.good, '2026-07-05'); // int 6, ease 2.5
    s = review(s, QUALITY.good, '2026-07-11'); // int round(6 * 2.5) = 15
    expect(s.interval).toBe(15);
  });

  it('rep>=3 interval uses PRE-update ease, then ease drops (canonical SM-2)', () => {
    // Regression guard: earlier tests only used QUALITY.good (q=4, ease delta 0),
    // so they could not distinguish pre- vs post-update ease. Here the third
    // review lowers the grade, which MUST NOT retroactively shrink this interval.
    let s = review(initSrs('x', '2026-07-04'), QUALITY.good, '2026-07-04'); // int 1, ease 2.5
    s = review(s, QUALITY.good, '2026-07-05'); // int 6, ease 2.5
    s = review(s, QUALITY.hard, '2026-07-11'); // int = round(6 * 2.5) = 15 (pre-update ease)
    expect(s.interval).toBe(15);           // NOT round(6 * 2.36) = 14
    expect(s.ease).toBeCloseTo(2.36, 5);   // ease still updated on the returned state
  });

  it('failure (Again) resets repetitions and interval to 1', () => {
    let s = review(initSrs('x', '2026-07-04'), QUALITY.good, '2026-07-04');
    s = review(s, QUALITY.good, '2026-07-05');
    s = review(s, QUALITY.again, '2026-07-11');
    expect(s.repetitions).toBe(0);
    expect(s.interval).toBe(1);
    expect(s.due).toBe('2026-07-12');
  });

  it('ease never drops below 1.3', () => {
    let s = initSrs('x', '2026-07-04');
    for (let i = 0; i < 10; i++) s = review(s, QUALITY.hard, addISO(i));
    expect(s.ease).toBeGreaterThanOrEqual(1.3);
  });

  it('Easy raises ease above 2.5', () => {
    const s = review(initSrs('x', '2026-07-04'), QUALITY.easy, '2026-07-04');
    expect(s.ease).toBeGreaterThan(2.5);
  });
});

function addISO(i: number): string {
  const d = new Date(Date.UTC(2026, 6, 4) + i * 86400000);
  return d.toISOString().slice(0, 10);
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/domain/srs/sm2.test.ts`
Expected: FAIL — cannot import from `./sm2`.

- [ ] **Step 3: Write the implementation**

`src/domain/srs/sm2.ts`:
```ts
import { addDays } from '@/lib/date';

export type Quality = 0 | 1 | 2 | 3 | 4 | 5;
export const QUALITY = { again: 2, hard: 3, good: 4, easy: 5 } as const;

export interface SrsState {
  conceptId: string;
  ease: number;
  interval: number;
  repetitions: number;
  due: string;
  lastReviewed?: string;
}

const MIN_EASE = 1.3;
const START_EASE = 2.5;

export function initSrs(conceptId: string, today: string): SrsState {
  return { conceptId, ease: START_EASE, interval: 0, repetitions: 0, due: today };
}

/** Faithful SM-2 update. `today` is the review date (ISO YYYY-MM-DD). */
export function review(state: SrsState, quality: Quality, today: string): SrsState {
  // Ease update (applied every review), clamped to MIN_EASE.
  const ease = Math.max(MIN_EASE, state.ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

  let repetitions: number;
  let interval: number;

  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    repetitions = state.repetitions + 1;
    if (repetitions === 1) interval = 1;
    else if (repetitions === 2) interval = 6;
    // Canonical SM-2: the interval uses the E-Factor as it stood BEFORE this
    // review's update (state.ease), NOT the freshly-updated `ease`. The ease
    // update above is applied to the returned state, but not to this multiply.
    else interval = Math.round(state.interval * state.ease);
  }

  return {
    conceptId: state.conceptId,
    ease,
    interval,
    repetitions,
    due: addDays(today, interval),
    lastReviewed: today,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/domain/srs/sm2.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/domain/srs/sm2.ts src/domain/srs/sm2.test.ts
git commit -m "feat: SM-2 spaced-repetition engine (pure, tested)"
```

---

### Task 5: Quiz domain (selection + scoring)

**Files:**
- Create: `src/domain/quiz/selection.ts`
- Test: `src/domain/quiz/selection.test.ts`

**Interfaces:**
- Consumes: `Question`, `Category`, `Grade`, `QuestionType` from `@/content/schema`.
- Produces: `QuizFilter`, `Shuffle`, `selectQuestions`, `isCorrect`, `scoreSession`. Consumed by Task 13 (quiz UI).

- [ ] **Step 1: Write the failing test**

`src/domain/quiz/selection.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { selectQuestions, isCorrect, scoreSession } from './selection';
import type { Question } from '@/content/schema';

const identity = <T,>(a: T[]) => a; // deterministic shuffle for tests

const q = (over: Partial<Question>): Question => ({
  id: 'q1', type: 'concept', category: 'solid', grade: 'junior',
  prompt: 'p', options: ['a', 'b'], correctIndex: 0, explanation: 'e', ...over,
});

const pool: Question[] = [
  q({ id: 'q1', category: 'solid', grade: 'junior', type: 'concept' }),
  q({ id: 'q2', category: 'behavioral', grade: 'middle', type: 'identify-pattern' }),
  q({ id: 'q3', category: 'behavioral', grade: 'middle', type: 'concept' }),
  q({ id: 'q4', category: 'structural', grade: 'senior', type: 'identify-pattern' }),
];

describe('quiz selection', () => {
  it('filters by category', () => {
    const r = selectQuestions(pool, { category: 'behavioral' }, identity);
    expect(r.map((x) => x.id)).toEqual(['q2', 'q3']);
  });

  it('filters by grade and type together', () => {
    const r = selectQuestions(pool, { grade: 'middle', type: 'identify-pattern' }, identity);
    expect(r.map((x) => x.id)).toEqual(['q2']);
  });

  it('applies limit after filtering', () => {
    const r = selectQuestions(pool, { limit: 2 }, identity);
    expect(r).toHaveLength(2);
  });

  it('empty filter returns all', () => {
    expect(selectQuestions(pool, {}, identity)).toHaveLength(4);
  });

  it('isCorrect compares selected index to correctIndex', () => {
    expect(isCorrect(q({ correctIndex: 1 }), 1)).toBe(true);
    expect(isCorrect(q({ correctIndex: 1 }), 0)).toBe(false);
  });

  it('scoreSession counts correct answers', () => {
    const questions = [q({ id: 'a', correctIndex: 0 }), q({ id: 'b', correctIndex: 1 })];
    const result = scoreSession(questions, { a: 0, b: 0 });
    expect(result).toEqual({ correct: 1, total: 2 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/domain/quiz/selection.test.ts`
Expected: FAIL — cannot import from `./selection`.

- [ ] **Step 3: Write the implementation**

`src/domain/quiz/selection.ts`:
```ts
import type { Question, Category, Grade, QuestionType } from '@/content/schema';

export interface QuizFilter {
  category?: Category;
  grade?: Grade;
  type?: QuestionType;
  limit?: number;
}

export type Shuffle = <T>(arr: T[]) => T[];

export function selectQuestions(all: Question[], filter: QuizFilter, shuffle: Shuffle): Question[] {
  let out = all.filter(
    (q) =>
      (!filter.category || q.category === filter.category) &&
      (!filter.grade || q.grade === filter.grade) &&
      (!filter.type || q.type === filter.type),
  );
  out = shuffle(out);
  if (filter.limit != null) out = out.slice(0, filter.limit);
  return out;
}

export function isCorrect(q: Question, selectedIndex: number): boolean {
  return q.correctIndex === selectedIndex;
}

export function scoreSession(questions: Question[], answers: Record<string, number>): { correct: number; total: number } {
  let correct = 0;
  for (const q of questions) {
    if (q.id in answers && isCorrect(q, answers[q.id])) correct++;
  }
  return { correct, total: questions.length };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/domain/quiz/selection.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/domain/quiz/selection.ts src/domain/quiz/selection.test.ts
git commit -m "feat: quiz selection, scoring, and correctness helpers"
```

---

### Task 6: Seed content

**Files:**
- Create: `src/content/concepts/solid.ts`, `src/content/concepts/patterns.ts`, `src/content/questions.ts`, `src/content/index.ts`
- Test: `src/content/index.test.ts`

**Interfaces:**
- Consumes: `Concept`, `Question`, `validateContent` from `./schema`.
- Produces: `concepts: Concept[]`, `questions: Question[]`, `conceptById: Map<string, Concept>`, and `getConcept(id)`. Consumed by all UI tasks and store selectors.
- **Content bar:** seed = 5 SOLID principles + `strategy`, `observer`, `factory-method` + `state` & `abstract-factory` (as distractor targets, `grade: 'middle'`/`'senior'`), and ≥10 questions with ≥4 `identify-pattern`. Distractors for identify-pattern questions must be sibling concepts (Strategy↔State, Factory Method↔Abstract Factory).

- [ ] **Step 1: Write the failing test**

`src/content/index.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { concepts, questions, getConcept } from './index';
import { validateContent } from './schema';

describe('seed content', () => {
  it('passes full content validation', () => {
    expect(() => validateContent(concepts, questions)).not.toThrow();
  });

  it('includes all 5 SOLID principles', () => {
    const solid = concepts.filter((c) => c.category === 'solid');
    expect(solid).toHaveLength(5);
  });

  it('includes the seed patterns', () => {
    for (const id of ['strategy', 'observer', 'factory-method']) {
      expect(getConcept(id)).toBeDefined();
    }
  });

  it('has at least 10 questions with >= 4 identify-pattern', () => {
    expect(questions.length).toBeGreaterThanOrEqual(10);
    expect(questions.filter((q) => q.type === 'identify-pattern').length).toBeGreaterThanOrEqual(4);
  });

  it('identify-pattern distractors are real sibling concepts by name', () => {
    const names = new Set(concepts.map((c) => c.name));
    for (const q of questions.filter((q) => q.type === 'identify-pattern')) {
      for (const opt of q.options) expect(names.has(opt)).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/content/index.test.ts`
Expected: FAIL — cannot import from `./index`.

- [ ] **Step 3: Write `src/content/concepts/solid.ts`**

Author 5 `Concept` objects (`srp`, `ocp`, `lsp`, `isp`, `dip`), `category: 'solid'`, `grade: 'junior'` (dip → `'middle'`), each with RU text and one idiomatic TS `codeExample`. Example (write all 5 in this shape):

```ts
import type { Concept } from '../schema';

export const solid: Concept[] = [
  {
    id: 'srp', name: 'Single Responsibility Principle', aka: ['SRP'],
    category: 'solid', grade: 'junior',
    tagline: 'У класса должна быть одна причина для изменения',
    definition: 'Модуль должен отвечать за одну и только одну часть функциональности, инкапсулируя одну причину для изменения.',
    problem: 'Класс, который и считает зарплату, и форматирует отчёт, и сохраняет в БД, ломается от любого из трёх изменений и тяжело тестируется.',
    solution: 'Разделяем ответственности на отдельные классы: расчёт, форматирование, хранение — каждый меняется независимо.',
    codeExample: {
      lang: 'typescript',
      code: [
        '// Нарушение: три причины для изменения в одном классе',
        'class Employee {',
        '  calculatePay() { /* бизнес-логика */ }',
        '  save() { /* работа с БД */ }',
        '  toReport() { /* форматирование */ }',
        '}',
        '',
        '// SRP: каждая ответственность отдельно',
        'class PayCalculator { calculate(e: Employee) { /* ... */ } }',
        'class EmployeeRepository { save(e: Employee) { /* ... */ } }',
        'class EmployeeReport { render(e: Employee) { /* ... */ } }',
      ].join('\n'),
    },
    pros: ['Проще тестировать', 'Меньше связность', 'Изменения локальны'],
    cons: ['Больше классов', 'Риск преждевременного дробления'],
    tradeoffs: ['Гранулярность против простоты навигации по коду'],
    whenToUse: ['Класс растёт и меняется по разным причинам', 'Логика смешивает уровни абстракции'],
    whenNotToUse: ['Крошечная сущность, дробление которой добавит только шум'],
    related: ['ocp', 'dip'],
  },
  // ... ocp, lsp, isp, dip — same shape, RU text, idiomatic TS examples
];
```

- [ ] **Step 4: Write `src/content/concepts/patterns.ts`**

Author `Concept` objects for `strategy` (behavioral, middle), `observer` (behavioral, middle), `factory-method` (creational, middle), plus sibling/distractor concepts `state` (behavioral, senior) and `abstract-factory` (creational, senior). Each with RU text, idiomatic TS `codeExample`, and `related` pointing to its sibling (e.g. `strategy.related = ['state']`, `factory-method.related = ['abstract-factory']`).

```ts
import type { Concept } from '../schema';

export const patterns: Concept[] = [
  {
    id: 'strategy', name: 'Strategy', category: 'behavioral', grade: 'middle',
    tagline: 'Взаимозаменяемые алгоритмы за общим интерфейсом',
    definition: 'Определяет семейство алгоритмов, инкапсулирует каждый и делает их взаимозаменяемыми во время выполнения.',
    problem: 'Класс жёстко зашивает один способ поведения (сортировку, оплату, сжатие), и добавление нового требует правки самого класса.',
    solution: 'Выносим алгоритм за интерфейс `Strategy`, а контекст хранит ссылку на выбранную стратегию и делегирует ей.',
    codeExample: {
      lang: 'typescript',
      code: [
        'interface PricingStrategy { price(base: number): number; }',
        'class Regular implements PricingStrategy { price(b: number) { return b; } }',
        'class Vip implements PricingStrategy { price(b: number) { return b * 0.8; } }',
        '',
        'class Checkout {',
        '  constructor(private strategy: PricingStrategy) {}',
        '  setStrategy(s: PricingStrategy) { this.strategy = s; }',
        '  total(base: number) { return this.strategy.price(base); }',
        '}',
      ].join('\n'),
    },
    pros: ['Замена алгоритма во время выполнения', 'Изоляция вариантов поведения'],
    cons: ['Рост числа классов', 'Клиент должен знать о стратегиях'],
    tradeoffs: ['Гибкость против количества классов'],
    whenToUse: ['Много вариантов одного поведения', 'Нужно менять алгоритм в рантайме'],
    related: ['state'],
  },
  // ... observer, factory-method, state, abstract-factory — same shape
];
```

- [ ] **Step 5: Write `src/content/questions.ts`**

Author ≥10 `Question` objects. Include ≥4 `identify-pattern` where `code` idiomatically shows one pattern and `options` are the concept `name`s of siblings (e.g. `['Strategy','State','Observer','Factory Method']`), `correctIndex` marks the right one, and `explanation` (RU) says why it's the answer AND why each sibling is not. Add `concept` and `tradeoff` questions for SOLID. Example:

```ts
import type { Question } from './schema';

export const questions: Question[] = [
  {
    id: 'ip-strategy-1', type: 'identify-pattern', category: 'behavioral', grade: 'middle',
    prompt: 'Какой паттерн проектирования использован в этом коде?',
    code: {
      lang: 'typescript',
      code: [
        'interface Compressor { compress(data: Buffer): Buffer; }',
        'class Zip implements Compressor { compress(d: Buffer) { return d; } }',
        'class Gzip implements Compressor { compress(d: Buffer) { return d; } }',
        'class Archiver {',
        '  constructor(private algo: Compressor) {}',
        '  use(algo: Compressor) { this.algo = algo; }',
        '  run(d: Buffer) { return this.algo.compress(d); }',
        '}',
      ].join('\n'),
    },
    options: ['Strategy', 'State', 'Observer', 'Factory Method'],
    correctIndex: 0,
    explanation:
      'Алгоритм сжатия внедряется извне и заменяется методом use() — это Strategy. Это не State: смена не вызвана внутренними переходами объекта. Не Observer: нет подписки на события. Не Factory Method: объект не создаётся, а подставляется готовым.',
    conceptId: 'strategy',
  },
  // ... ≥3 more identify-pattern (observer, factory-method vs abstract-factory, state vs strategy)
  // ... ≥6 concept/tradeoff questions across SOLID principles
];
```

- [ ] **Step 6: Write `src/content/index.ts`**

```ts
import { solid } from './concepts/solid';
import { patterns } from './concepts/patterns';
import { questions as allQuestions } from './questions';
import { validateContent, type Concept, type Question } from './schema';

export const concepts: Concept[] = [...solid, ...patterns];
export const questions: Question[] = allQuestions;

// Fail fast in dev if content is inconsistent.
if (import.meta.env?.DEV) validateContent(concepts, questions);

export const conceptById = new Map(concepts.map((c) => [c.id, c]));
export function getConcept(id: string): Concept | undefined {
  return conceptById.get(id);
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npx vitest run src/content/index.test.ts`
Expected: PASS (5 tests). If a distractor name isn't a real concept name, either add the concept or fix the option — do not weaken the test.

- [ ] **Step 8: Commit**

```bash
git add src/content
git commit -m "feat: seed content (SOLID + Strategy/Observer/Factory Method + siblings + quizzes)"
```

---

### Task 7: Zustand store with persistence

**Files:**
- Create: `src/store/useStore.ts`
- Test: `src/store/useStore.test.ts`

**Interfaces:**
- Consumes: `SrsState`, `Quality`, `initSrs`, `review` from `@/domain/srs/sm2`; `daysBetween` from `@/lib/date`; `Concept`, `Grade`, `Category` from `@/content/schema`.
- Produces: `useStore` hook; exported pure selectors `selectDueConceptIds(state, today)`, `selectGradeProgress(state, concepts, grade)`, `isMastered(state, conceptId)`; exported `migrate(persisted, version)`; types `QuizResult`, `Streak`, `Settings`, `AppState`. Consumed by all UI tasks.

- [ ] **Step 1: Write the failing test**

`src/store/useStore.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useStore, selectDueConceptIds, selectGradeProgress, isMastered } from './useStore';
import type { Concept } from '@/content/schema';

const c = (id: string, grade: Concept['grade']): Concept => ({
  id, name: id, category: 'solid', grade, tagline: 't', definition: 'd', problem: 'p', solution: 's',
  codeExample: { lang: 'typescript', code: 'x' }, pros: ['a'], cons: ['a'], tradeoffs: ['a'], whenToUse: ['a'], related: [],
});

beforeEach(() => {
  useStore.getState().resetProgress();
});

describe('store', () => {
  it('reviewConcept creates SRS state, marks seen, and advances streak', () => {
    useStore.getState().reviewConcept('srp', 4, '2026-07-04');
    const s = useStore.getState();
    expect(s.srs['srp'].repetitions).toBe(1);
    expect(s.conceptProgress['srp'].seen).toBe(true);
    expect(s.streak.current).toBe(1);
    expect(s.streak.lastActiveDate).toBe('2026-07-04');
  });

  it('activity on consecutive days increments streak; gap resets it', () => {
    const g = useStore.getState;
    g().reviewConcept('srp', 4, '2026-07-04');
    g().reviewConcept('srp', 4, '2026-07-05');
    expect(g().streak.current).toBe(2);
    g().reviewConcept('srp', 4, '2026-07-08'); // gap
    expect(g().streak.current).toBe(1);
    expect(g().streak.longest).toBe(2);
  });

  it('recordQuiz stores a result', () => {
    useStore.getState().recordQuiz('q1', 0, true, '2026-07-04');
    expect(useStore.getState().quizResults).toHaveLength(1);
    expect(useStore.getState().quizResults[0].correct).toBe(true);
  });

  it('selectDueConceptIds returns concepts whose due date has arrived', () => {
    useStore.getState().reviewConcept('srp', 4, '2026-07-04'); // due 2026-07-05
    expect(selectDueConceptIds(useStore.getState(), '2026-07-04')).not.toContain('srp');
    expect(selectDueConceptIds(useStore.getState(), '2026-07-05')).toContain('srp');
  });

  it('isMastered is true after 2 successful repetitions', () => {
    useStore.getState().reviewConcept('srp', 4, '2026-07-04');
    expect(isMastered(useStore.getState(), 'srp')).toBe(false);
    useStore.getState().reviewConcept('srp', 4, '2026-07-05');
    expect(isMastered(useStore.getState(), 'srp')).toBe(true);
  });

  it('selectGradeProgress reports totals, seen, mastered', () => {
    const concepts = [c('srp', 'junior'), c('ocp', 'junior'), c('strategy', 'middle')];
    useStore.getState().reviewConcept('srp', 4, '2026-07-04');
    const p = selectGradeProgress(useStore.getState(), concepts, 'junior');
    expect(p.total).toBe(2);
    expect(p.seen).toBe(1);
    expect(p.mastered).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/store/useStore.test.ts`
Expected: FAIL — cannot import from `./useStore`.

- [ ] **Step 3: Write the store**

`src/store/useStore.ts`:
```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { initSrs, review, type SrsState, type Quality } from '@/domain/srs/sm2';
import { daysBetween, isDue } from '@/lib/date';
import type { Concept, Grade, Category } from '@/content/schema';

export interface QuizResult { questionId: string; selectedIndex: number; correct: boolean; at: string; }
export interface Streak { current: number; longest: number; lastActiveDate: string | null; }
export interface Settings { theme: 'dark' | 'light'; gradeFilter: Grade | 'all'; categoryFilter: Category | 'all'; }

const MASTERY_REPETITIONS = 2;

export interface AppState {
  srs: Record<string, SrsState>;
  quizResults: QuizResult[];
  conceptProgress: Record<string, { seen: boolean }>;
  streak: Streak;
  settings: Settings;
  reviewConcept: (conceptId: string, quality: Quality, today: string) => void;
  recordQuiz: (questionId: string, selectedIndex: number, correct: boolean, today: string) => void;
  markSeen: (conceptId: string, today: string) => void;
  setSettings: (partial: Partial<Settings>) => void;
  resetProgress: () => void;
}

const initialData = (): Pick<AppState, 'srs' | 'quizResults' | 'conceptProgress' | 'streak' | 'settings'> => ({
  srs: {},
  quizResults: [],
  conceptProgress: {},
  streak: { current: 0, longest: 0, lastActiveDate: null },
  settings: { theme: 'dark', gradeFilter: 'all', categoryFilter: 'all' },
});

function bumpStreak(streak: Streak, today: string): Streak {
  if (streak.lastActiveDate === today) return streak;
  const current = streak.lastActiveDate && daysBetween(streak.lastActiveDate, today) === 1 ? streak.current + 1 : 1;
  return { current, longest: Math.max(streak.longest, current), lastActiveDate: today };
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialData(),

      reviewConcept: (conceptId, quality, today) =>
        set((s) => {
          const prev = s.srs[conceptId] ?? initSrs(conceptId, today);
          return {
            srs: { ...s.srs, [conceptId]: review(prev, quality, today) },
            conceptProgress: { ...s.conceptProgress, [conceptId]: { seen: true } },
            streak: bumpStreak(s.streak, today),
          };
        }),

      recordQuiz: (questionId, selectedIndex, correct, today) =>
        set((s) => ({
          quizResults: [...s.quizResults, { questionId, selectedIndex, correct, at: today }],
          streak: bumpStreak(s.streak, today),
        })),

      markSeen: (conceptId, today) =>
        set((s) => ({
          conceptProgress: { ...s.conceptProgress, [conceptId]: { seen: true } },
          streak: bumpStreak(s.streak, today),
        })),

      setSettings: (partial) => set((s) => ({ settings: { ...s.settings, ...partial } })),

      resetProgress: () => set(() => ({ ...initialData() })),
    }),
    {
      name: 'archmentor',
      version: 1,
      migrate: (persisted, version) => migrate(persisted, version),
      partialize: (s) => ({
        srs: s.srs, quizResults: s.quizResults, conceptProgress: s.conceptProgress,
        streak: s.streak, settings: s.settings,
      }),
    },
  ),
);

/** Version migration hook. v1 is the baseline; unknown/older shapes reset progress safely. */
export function migrate(persisted: unknown, version: number): Partial<AppState> {
  if (version === 1 && persisted && typeof persisted === 'object') return persisted as Partial<AppState>;
  return initialData();
}

// ---- Pure selectors (framework-agnostic, unit-tested) ----
export function selectDueConceptIds(state: AppState, today: string): string[] {
  return Object.values(state.srs).filter((s) => isDue(s.due, today)).map((s) => s.conceptId);
}

export function isMastered(state: AppState, conceptId: string): boolean {
  return (state.srs[conceptId]?.repetitions ?? 0) >= MASTERY_REPETITIONS;
}

export function selectGradeProgress(
  state: AppState, concepts: Concept[], grade: Grade,
): { total: number; seen: number; mastered: number; pct: number } {
  const inGrade = concepts.filter((c) => c.grade === grade);
  const seen = inGrade.filter((c) => state.conceptProgress[c.id]?.seen).length;
  const mastered = inGrade.filter((c) => isMastered(state, c.id)).length;
  const pct = inGrade.length === 0 ? 0 : Math.round((mastered / inGrade.length) * 100);
  return { total: inGrade.length, seen, mastered, pct };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/store/useStore.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/store
git commit -m "feat: Zustand store with persist, streak, and pure selectors"
```

---

### Task 8: Shared UI components

**Files:**
- Create: `src/components/CodeBlock.tsx`, `src/components/FlipCard.tsx`, `src/components/ProgressBar.tsx`, `src/components/Badge.tsx`, `src/components/PillGroup.tsx`
- Test: `src/components/components.test.tsx`

**Interfaces:**
- Consumes: `CodeSample` from `@/content/schema`.
- Produces:
  - `CodeBlock({ sample }: { sample: CodeSample })`
  - `FlipCard({ front, back, flipped, onFlip }: { front: ReactNode; back: ReactNode; flipped: boolean; onFlip: () => void })`
  - `ProgressBar({ value, label }: { value: number; label?: string })` — value 0–100
  - `Badge({ children, tone }: { children: ReactNode; tone?: 'grade' | 'category' | 'neutral' })`
  - `PillGroup<T>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void })`

- [ ] **Step 1: Write the failing test**

`src/components/components.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CodeBlock } from './CodeBlock';
import { FlipCard } from './FlipCard';
import { ProgressBar } from './ProgressBar';
import { PillGroup } from './PillGroup';

describe('shared components', () => {
  it('CodeBlock renders the code text', () => {
    render(<CodeBlock sample={{ lang: 'typescript', code: 'const answer = 42;' }} />);
    expect(screen.getByText(/const answer = 42/)).toBeInTheDocument();
  });

  it('FlipCard shows front, then back after onFlip driven by parent', async () => {
    const onFlip = vi.fn();
    const { rerender } = render(<FlipCard front="ЛИЦО" back="ОБОРОТ" flipped={false} onFlip={onFlip} />);
    await userEvent.click(screen.getByRole('button', { name: /перевернуть/i }));
    expect(onFlip).toHaveBeenCalled();
    rerender(<FlipCard front="ЛИЦО" back="ОБОРОТ" flipped={true} onFlip={onFlip} />);
    expect(screen.getByText('ОБОРОТ')).toBeVisible();
  });

  it('ProgressBar exposes value via aria', () => {
    render(<ProgressBar value={40} label="Junior" />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '40');
  });

  it('PillGroup calls onChange with the picked value', async () => {
    const onChange = vi.fn();
    render(<PillGroup options={[{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }]} value="a" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'B' }));
    expect(onChange).toHaveBeenCalledWith('b');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/components.test.tsx`
Expected: FAIL — components don't exist.

- [ ] **Step 3: Write the components**

`src/components/CodeBlock.tsx`:
```tsx
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { CodeSample } from '@/content/schema';

export function CodeBlock({ sample }: { sample: CodeSample }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-surface-muted text-sm">
      <SyntaxHighlighter
        language="typescript"
        style={oneDark}
        wrapLongLines={false}
        customStyle={{ margin: 0, background: '#1e293b', padding: '1rem' }}
        lineProps={(n: number) =>
          sample.highlightLines?.includes(n) ? { style: { background: 'rgba(99,102,241,0.15)', display: 'block' } } : {}
        }
        showLineNumbers
      >
        {sample.code}
      </SyntaxHighlighter>
    </div>
  );
}
```

`src/components/FlipCard.tsx`:
```tsx
import type { ReactNode } from 'react';

export function FlipCard({
  front, back, flipped, onFlip,
}: { front: ReactNode; back: ReactNode; flipped: boolean; onFlip: () => void }) {
  return (
    <button
      onClick={onFlip}
      aria-label="Перевернуть карточку"
      className="block w-full min-h-56 rounded-xl bg-surface-raised border border-surface-muted p-6 text-left transition hover:border-accent-soft"
    >
      <div className="text-xs uppercase tracking-wide text-slate-400 mb-2">{flipped ? 'Определение' : 'Термин'}</div>
      <div className="text-lg">{flipped ? back : front}</div>
      {!flipped && <div className="mt-4 text-sm text-slate-500">Нажмите, чтобы увидеть ответ</div>}
    </button>
  );
}
```

`src/components/ProgressBar.tsx`:
```tsx
export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div>
      {label && <div className="flex justify-between text-sm mb-1"><span>{label}</span><span className="text-slate-400">{pct}%</span></div>}
      <div role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}
           className="h-2 rounded-full bg-surface-muted overflow-hidden">
        <div className="h-full bg-accent transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
```

`src/components/Badge.tsx`:
```tsx
import type { ReactNode } from 'react';

const TONES: Record<string, string> = {
  grade: 'bg-accent/20 text-accent-soft',
  category: 'bg-surface-muted text-slate-300',
  neutral: 'bg-surface-muted text-slate-400',
};

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'grade' | 'category' | 'neutral' }) {
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${TONES[tone]}`}>{children}</span>;
}
```

`src/components/PillGroup.tsx`:
```tsx
export function PillGroup<T extends string>({
  options, value, onChange,
}: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-full px-3 py-1 text-sm border transition ${
            o.value === value ? 'bg-accent border-accent text-white' : 'border-surface-muted text-slate-300 hover:border-accent-soft'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/components.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components
git commit -m "feat: shared UI components (CodeBlock, FlipCard, ProgressBar, Badge, PillGroup)"
```

---

### Task 9: App shell — router, layout, theme, ErrorBoundary

**Files:**
- Create: `src/app/Layout.tsx`, `src/app/ErrorBoundary.tsx`, `src/lib/labels.ts`
- Modify: `src/app/App.tsx` (replace placeholder with router)
- Test: `src/app/App.test.tsx`

**Interfaces:**
- Consumes: feature screens from Tasks 10–15. **During this task**, create minimal placeholder exports for the six screens so routing compiles; Tasks 10–15 replace each placeholder's body. Placeholders live at `src/features/<name>/<Name>.tsx` and export a component of that name.
- Produces: `labels.ts` with RU display maps: `GRADE_LABEL: Record<Grade,string>`, `CATEGORY_LABEL: Record<Category,string>`, `GRADE_ORDER: Grade[]`. Consumed by every UI task.

- [ ] **Step 1: Write `src/lib/labels.ts`**

```ts
import type { Grade, Category } from '@/content/schema';

export const GRADE_ORDER: Grade[] = ['junior', 'middle', 'senior', 'lead'];

export const GRADE_LABEL: Record<Grade, string> = {
  junior: 'Junior', middle: 'Middle', senior: 'Senior', lead: 'Lead',
};

export const CATEGORY_LABEL: Record<Category, string> = {
  solid: 'SOLID',
  creational: 'Порождающие',
  structural: 'Структурные',
  behavioral: 'Поведенческие',
  architecture: 'Архитектурные стили',
  tradeoff: 'Trade-offs',
};
```

- [ ] **Step 2: Write placeholder screens**

Create each of these six files with a minimal export (bodies filled by later tasks):
`src/features/dashboard/Dashboard.tsx`, `src/features/learn/Learn.tsx`, `src/features/review/Review.tsx`, `src/features/quiz/Quiz.tsx`, `src/features/library/Library.tsx`, `src/features/progress/Progress.tsx`.

Example (repeat for each, changing name + heading):
```tsx
export function Dashboard() {
  return <h1 className="text-2xl font-semibold">Дашборд</h1>;
}
```

- [ ] **Step 3: Write the ErrorBoundary**

`src/app/ErrorBoundary.tsx`:
```tsx
import { Component, type ReactNode } from 'react';

export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div className="p-8">
          <h1 className="text-xl font-semibold text-red-400">Что-то пошло не так</h1>
          <pre className="mt-2 text-sm text-slate-400">{this.state.error.message}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
```

- [ ] **Step 4: Write the Layout**

`src/app/Layout.tsx`:
```tsx
import { NavLink, Outlet } from 'react-router-dom';

const NAV = [
  { to: '/', label: 'Дашборд', end: true },
  { to: '/learn', label: 'Учить' },
  { to: '/review', label: 'Повторение' },
  { to: '/quiz', label: 'Квиз' },
  { to: '/library', label: 'Библиотека' },
  { to: '/progress', label: 'Прогресс' },
];

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-surface-muted">
        <nav className="max-w-5xl mx-auto flex items-center gap-1 px-4 py-3 overflow-x-auto">
          <span className="font-bold text-accent-soft mr-4">ArchMentor</span>
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm whitespace-nowrap ${isActive ? 'bg-surface-raised text-white' : 'text-slate-400 hover:text-white'}`}>
              {n.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8"><Outlet /></main>
    </div>
  );
}
```

- [ ] **Step 5: Replace `src/app/App.tsx` with the router**

```tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Layout } from './Layout';
import { ErrorBoundary } from './ErrorBoundary';
import { Dashboard } from '@/features/dashboard/Dashboard';
import { Learn } from '@/features/learn/Learn';
import { Review } from '@/features/review/Review';
import { Quiz } from '@/features/quiz/Quiz';
import { Library } from '@/features/library/Library';
import { Progress } from '@/features/progress/Progress';

const router = createBrowserRouter([
  {
    path: '/', element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'learn/:conceptId?', element: <Learn /> },
      { path: 'review', element: <Review /> },
      { path: 'quiz', element: <Quiz /> },
      { path: 'library', element: <Library /> },
      { path: 'progress', element: <Progress /> },
    ],
  },
]);

export default function App() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}
```

- [ ] **Step 6: Write the routing test**

`src/app/App.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { Layout } from './Layout';
import { Dashboard } from '@/features/dashboard/Dashboard';
import { Library } from '@/features/library/Library';

function renderAt(path: string) {
  const router = createMemoryRouter(
    [{ path: '/', element: <Layout />, children: [
      { index: true, element: <Dashboard /> },
      { path: 'library', element: <Library /> },
    ] }],
    { initialEntries: [path] },
  );
  return render(<RouterProvider router={router} />);
}

describe('app shell', () => {
  it('renders nav and dashboard at /', () => {
    renderAt('/');
    expect(screen.getByText('ArchMentor')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Библиотека' })).toBeInTheDocument();
  });

  it('renders library at /library', () => {
    renderAt('/library');
    expect(screen.getByText(/Библиотека/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `npx vitest run src/app/App.test.tsx`
Expected: PASS (2 tests). Then `npm run build` — expected clean.

- [ ] **Step 8: Commit**

```bash
git add src/app src/features src/lib/labels.ts
git commit -m "feat: app shell — router, layout, theme classes, error boundary"
```

---

### Task 10: Library feature (catalog + concept page)

**Files:**
- Modify: `src/features/library/Library.tsx`
- Create: `src/features/library/ConceptPage.tsx`, `src/features/library/ConceptCard.tsx`
- Modify: `src/app/App.tsx` (add `library/:conceptId` route)
- Test: `src/features/library/Library.test.tsx`

**Interfaces:**
- Consumes: `concepts`, `getConcept` from `@/content/index`; `GRADE_LABEL`, `CATEGORY_LABEL`, `GRADE_ORDER` from `@/lib/labels`; `CodeBlock`, `Badge`, `PillGroup` from `@/components/*`; `useStore`, `isMastered`.
- Produces: `Library`, `ConceptPage`, `ConceptCard`.

- [ ] **Step 1: Write the failing test**

`src/features/library/Library.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { Library } from './Library';
import { ConceptPage } from './ConceptPage';

function renderLib(path = '/library') {
  const router = createMemoryRouter(
    [{ path: 'library', element: <Library /> }, { path: 'library/:conceptId', element: <ConceptPage /> }],
    { initialEntries: [path] },
  );
  return render(<RouterProvider router={router} />);
}

describe('Library', () => {
  it('lists concept cards including Strategy', () => {
    renderLib();
    expect(screen.getByText('Strategy')).toBeInTheDocument();
  });

  it('filters by search query', async () => {
    renderLib();
    await userEvent.type(screen.getByPlaceholderText(/поиск/i), 'Observer');
    expect(screen.getByText('Observer')).toBeInTheDocument();
    expect(screen.queryByText('Strategy')).not.toBeInTheDocument();
  });

  it('concept page shows definition, code, pros and cons', () => {
    renderLib('/library/strategy');
    expect(screen.getByText(/семейство алгоритмов/i)).toBeInTheDocument();
    expect(screen.getByText(/Плюсы/)).toBeInTheDocument();
    expect(screen.getByText(/Минусы/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/library/Library.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Write `ConceptCard.tsx`**

```tsx
import { Link } from 'react-router-dom';
import type { Concept } from '@/content/schema';
import { Badge } from '@/components/Badge';
import { GRADE_LABEL, CATEGORY_LABEL } from '@/lib/labels';

export function ConceptCard({ concept, mastered }: { concept: Concept; mastered: boolean }) {
  return (
    <Link to={`/library/${concept.id}`}
      className="block rounded-xl border border-surface-muted bg-surface-raised p-4 hover:border-accent-soft transition">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold">{concept.name}</h3>
        {mastered && <Badge tone="grade">✓ освоено</Badge>}
      </div>
      <p className="mt-1 text-sm text-slate-400">{concept.tagline}</p>
      <div className="mt-3 flex gap-2">
        <Badge tone="grade">{GRADE_LABEL[concept.grade]}</Badge>
        <Badge tone="category">{CATEGORY_LABEL[concept.category]}</Badge>
      </div>
    </Link>
  );
}
```

- [ ] **Step 4: Write `Library.tsx`**

```tsx
import { useMemo, useState } from 'react';
import { concepts } from '@/content/index';
import { ConceptCard } from './ConceptCard';
import { PillGroup } from '@/components/PillGroup';
import { CATEGORY_LABEL } from '@/lib/labels';
import { useStore, isMastered } from '@/store/useStore';
import type { Category } from '@/content/schema';

const CATEGORY_OPTIONS: { value: Category | 'all'; label: string }[] = [
  { value: 'all', label: 'Все' },
  ...(Object.keys(CATEGORY_LABEL) as Category[]).map((c) => ({ value: c, label: CATEGORY_LABEL[c] })),
];

export function Library() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | 'all'>('all');
  const state = useStore();

  const filtered = useMemo(
    () =>
      concepts.filter(
        (c) =>
          (category === 'all' || c.category === category) &&
          (query === '' || `${c.name} ${c.aka?.join(' ') ?? ''} ${c.tagline}`.toLowerCase().includes(query.toLowerCase())),
      ),
    [query, category],
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Библиотека</h1>
      <input
        value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск по названию…"
        className="w-full rounded-lg bg-surface-raised border border-surface-muted px-3 py-2 outline-none focus:border-accent"
      />
      <PillGroup options={CATEGORY_OPTIONS} value={category} onChange={setCategory} />
      {filtered.length === 0 ? (
        <p className="text-slate-400">Ничего не найдено.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((c) => <ConceptCard key={c.id} concept={c} mastered={isMastered(state, c.id)} />)}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Write `ConceptPage.tsx`**

```tsx
import { Link, useParams } from 'react-router-dom';
import { getConcept } from '@/content/index';
import { CodeBlock } from '@/components/CodeBlock';
import { Badge } from '@/components/Badge';
import { GRADE_LABEL, CATEGORY_LABEL } from '@/lib/labels';

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="font-semibold mb-1">{title}</h3>
      <ul className="list-disc list-inside text-slate-300 space-y-1">{items.map((i) => <li key={i}>{i}</li>)}</ul>
    </div>
  );
}

export function ConceptPage() {
  const { conceptId } = useParams();
  const c = conceptId ? getConcept(conceptId) : undefined;
  if (!c) return <div><p className="text-slate-400">Концепт не найден.</p><Link to="/library" className="text-accent-soft">← В библиотеку</Link></div>;

  return (
    <article className="space-y-6">
      <Link to="/library" className="text-sm text-accent-soft">← В библиотеку</Link>
      <header>
        <h1 className="text-3xl font-bold">{c.name}</h1>
        <p className="mt-1 text-slate-400">{c.tagline}</p>
        <div className="mt-3 flex gap-2">
          <Badge tone="grade">{GRADE_LABEL[c.grade]}</Badge>
          <Badge tone="category">{CATEGORY_LABEL[c.category]}</Badge>
        </div>
      </header>
      <section><h3 className="font-semibold mb-1">Определение</h3><p className="text-slate-300">{c.definition}</p></section>
      <section><h3 className="font-semibold mb-1">Проблема</h3><p className="text-slate-300">{c.problem}</p></section>
      <section><h3 className="font-semibold mb-1">Решение</h3><p className="text-slate-300">{c.solution}</p></section>
      <section><h3 className="font-semibold mb-2">Пример кода</h3><CodeBlock sample={c.codeExample} /></section>
      <div className="grid gap-6 sm:grid-cols-2">
        <List title="Плюсы" items={c.pros} />
        <List title="Минусы" items={c.cons} />
      </div>
      <List title="Trade-offs" items={c.tradeoffs} />
      <List title="Когда применять" items={c.whenToUse} />
      {c.whenNotToUse && <List title="Когда не стоит" items={c.whenNotToUse} />}
      {c.related.length > 0 && (
        <section>
          <h3 className="font-semibold mb-2">Похожие / путаемые</h3>
          <div className="flex gap-2 flex-wrap">
            {c.related.map((r) => <Link key={r} to={`/library/${r}`} className="text-accent-soft underline">{getConcept(r)?.name ?? r}</Link>)}
          </div>
        </section>
      )}
    </article>
  );
}
```

- [ ] **Step 6: Add the concept-page route in `src/app/App.tsx`**

Add import `import { ConceptPage } from '@/features/library/ConceptPage';` and add a child route after the `library` route:
```tsx
      { path: 'library/:conceptId', element: <ConceptPage /> },
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `npx vitest run src/features/library/Library.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 8: Commit**

```bash
git add src/features/library src/app/App.tsx
git commit -m "feat: library catalog with search, filters, and concept detail page"
```

---

### Task 11: Learn feature (flashcards)

**Files:**
- Modify: `src/features/learn/Learn.tsx`
- Test: `src/features/learn/Learn.test.tsx`

**Interfaces:**
- Consumes: `concepts`, `getConcept` from `@/content/index`; `FlipCard`, `PillGroup`, `Badge` from `@/components/*`; `useStore`; `todayISO`; `GRADE_ORDER`, `GRADE_LABEL`.
- Produces: `Learn`. On "next" it calls `markSeen(conceptId, todayISO())`.

- [ ] **Step 1: Write the failing test**

`src/features/learn/Learn.test.tsx`:
```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Learn } from './Learn';
import { useStore } from '@/store/useStore';

beforeEach(() => useStore.getState().resetProgress());

describe('Learn', () => {
  it('flips a card to reveal the definition', async () => {
    render(<MemoryRouter><Learn /></MemoryRouter>);
    await userEvent.click(screen.getByRole('button', { name: /перевернуть/i }));
    expect(screen.getByText('Определение')).toBeInTheDocument();
  });

  it('advancing marks the concept as seen in the store', async () => {
    render(<MemoryRouter><Learn /></MemoryRouter>);
    await userEvent.click(screen.getByRole('button', { name: /следующая/i }));
    expect(Object.keys(useStore.getState().conceptProgress).length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/learn/Learn.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Write `Learn.tsx`**

```tsx
import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { concepts, getConcept } from '@/content/index';
import { FlipCard } from '@/components/FlipCard';
import { PillGroup } from '@/components/PillGroup';
import { Badge } from '@/components/Badge';
import { useStore } from '@/store/useStore';
import { todayISO } from '@/lib/date';
import { GRADE_ORDER, GRADE_LABEL, CATEGORY_LABEL } from '@/lib/labels';
import type { Grade } from '@/content/schema';

const GRADE_OPTIONS: { value: Grade | 'all'; label: string }[] = [
  { value: 'all', label: 'Все' },
  ...GRADE_ORDER.map((g) => ({ value: g, label: GRADE_LABEL[g] })),
];

export function Learn() {
  const { conceptId } = useParams();
  const [grade, setGrade] = useState<Grade | 'all'>('all');
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const markSeen = useStore((s) => s.markSeen);

  const deck = useMemo(() => {
    if (conceptId) { const c = getConcept(conceptId); return c ? [c] : []; }
    return concepts.filter((c) => grade === 'all' || c.grade === grade);
  }, [conceptId, grade]);

  const current = deck[index];

  function next() {
    if (current) markSeen(current.id, todayISO());
    setFlipped(false);
    setIndex((i) => (i + 1) % Math.max(deck.length, 1));
  }

  if (!current) return <p className="text-slate-400">Нет карточек для выбранного фильтра.</p>;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Учить</h1>
        <span className="text-sm text-slate-400">{index + 1} / {deck.length}</span>
      </div>
      {!conceptId && <PillGroup options={GRADE_OPTIONS} value={grade} onChange={(g) => { setGrade(g); setIndex(0); setFlipped(false); }} />}
      <div className="flex gap-2">
        <Badge tone="grade">{GRADE_LABEL[current.grade]}</Badge>
        <Badge tone="category">{CATEGORY_LABEL[current.category]}</Badge>
      </div>
      <FlipCard
        front={<span className="text-xl font-semibold">{current.name}<span className="block text-sm font-normal text-slate-400 mt-2">{current.tagline}</span></span>}
        back={<span>{current.definition}<span className="block mt-3 text-sm text-slate-400">Когда: {current.whenToUse.join('; ')}</span></span>}
        flipped={flipped} onFlip={() => setFlipped((f) => !f)}
      />
      <div className="flex justify-end">
        <button onClick={next} className="rounded-lg bg-accent px-4 py-2 font-medium hover:bg-accent-soft">Следующая →</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/features/learn/Learn.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/learn
git commit -m "feat: learn flashcards with flip and grade filter"
```

---

### Task 12: Review feature (SRS)

**Files:**
- Modify: `src/features/review/Review.tsx`
- Test: `src/features/review/Review.test.tsx`

**Interfaces:**
- Consumes: `concepts`, `getConcept`; `useStore`, `selectDueConceptIds`; `QUALITY` from `@/domain/srs/sm2`; `FlipCard`; `todayISO`.
- Produces: `Review`. Grade buttons call `reviewConcept(id, QUALITY.x, todayISO())`.
- **Seeding rule:** concepts with no SRS state yet are treated as due (new cards), so the review queue is non-empty on first run. Compute the queue as: due existing SRS ids ∪ concept ids with no SRS state.

- [ ] **Step 1: Write the failing test**

`src/features/review/Review.test.tsx`:
```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Review } from './Review';
import { useStore } from '@/store/useStore';

beforeEach(() => useStore.getState().resetProgress());

describe('Review', () => {
  it('shows a due card and grading buttons', () => {
    render(<Review />);
    expect(screen.getByRole('button', { name: /перевернуть/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Good' })).toBeInTheDocument();
  });

  it('grading a card writes SRS state and advances the queue', async () => {
    render(<Review />);
    await userEvent.click(screen.getByRole('button', { name: 'Good' }));
    expect(Object.keys(useStore.getState().srs).length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/review/Review.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Write `Review.tsx`**

```tsx
import { useMemo, useState } from 'react';
import { concepts, getConcept } from '@/content/index';
import { FlipCard } from '@/components/FlipCard';
import { useStore, selectDueConceptIds } from '@/store/useStore';
import { QUALITY, type Quality } from '@/domain/srs/sm2';
import { todayISO } from '@/lib/date';

const GRADES: { label: string; quality: Quality; cls: string }[] = [
  { label: 'Again', quality: QUALITY.again, cls: 'bg-red-500/80' },
  { label: 'Hard', quality: QUALITY.hard, cls: 'bg-amber-500/80' },
  { label: 'Good', quality: QUALITY.good, cls: 'bg-emerald-500/80' },
  { label: 'Easy', quality: QUALITY.easy, cls: 'bg-sky-500/80' },
];

export function Review() {
  const today = todayISO();
  const srs = useStore((s) => s.srs);
  const reviewConcept = useStore((s) => s.reviewConcept);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(0);

  // New concepts (no SRS state) count as due, plus existing due cards.
  const queue = useMemo(() => {
    const state = useStore.getState();
    const dueExisting = new Set(selectDueConceptIds(state, today));
    const newOnes = concepts.filter((c) => !state.srs[c.id]).map((c) => c.id);
    return [...new Set([...newOnes, ...dueExisting])];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today, done]);

  const currentId = queue[0];
  const concept = currentId ? getConcept(currentId) : undefined;

  function grade(q: Quality) {
    if (!concept) return;
    reviewConcept(concept.id, q, today);
    setFlipped(false);
    setDone((d) => d + 1);
  }

  if (!concept) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-semibold">Повторение</h1>
        <p className="mt-2 text-slate-400">На сегодня всё повторено 🎉 Возвращайтесь завтра.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Повторение</h1>
        <span className="text-sm text-slate-400">осталось: {queue.length}</span>
      </div>
      <FlipCard
        front={<span className="text-xl font-semibold">{concept.name}<span className="block text-sm font-normal text-slate-400 mt-2">{concept.tagline}</span></span>}
        back={<span>{concept.definition}</span>}
        flipped={flipped} onFlip={() => setFlipped((f) => !f)}
      />
      {flipped && (
        <div className="grid grid-cols-4 gap-2">
          {GRADES.map((g) => (
            <button key={g.label} onClick={() => grade(g.quality)}
              className={`rounded-lg py-2 text-sm font-medium text-white ${g.cls} hover:opacity-90`}>{g.label}</button>
          ))}
        </div>
      )}
      {!flipped && <p className="text-center text-sm text-slate-500">Вспомните определение, затем переверните карточку и оцените себя.</p>}
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/features/review/Review.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/review
git commit -m "feat: SRS review queue with Again/Hard/Good/Easy grading"
```

---

### Task 13: Quiz feature

**Files:**
- Modify: `src/features/quiz/Quiz.tsx`
- Test: `src/features/quiz/Quiz.test.tsx`

**Interfaces:**
- Consumes: `questions` from `@/content/index`; `selectQuestions`, `isCorrect`, `scoreSession` from `@/domain/quiz/selection`; `CodeBlock`, `PillGroup`; `useStore`; `getConcept`; `todayISO`.
- Produces: `Quiz`. On each answer calls `recordQuiz(question.id, index, correct, todayISO())`. Uses an identity shuffle (deterministic) for the vertical slice.

- [ ] **Step 1: Write the failing test**

`src/features/quiz/Quiz.test.tsx`:
```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Quiz } from './Quiz';
import { useStore } from '@/store/useStore';

beforeEach(() => useStore.getState().resetProgress());

describe('Quiz', () => {
  it('shows a question with options and reveals explanation after answering', async () => {
    render(<MemoryRouter><Quiz /></MemoryRouter>);
    const firstOption = screen.getAllByRole('button').find((b) => b.getAttribute('data-option') === '0')!;
    await userEvent.click(firstOption);
    expect(screen.getByText(/Разбор/i)).toBeInTheDocument();
    expect(useStore.getState().quizResults).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/quiz/Quiz.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Write `Quiz.tsx`**

```tsx
import { useMemo, useState } from 'react';
import { questions as allQuestions } from '@/content/index';
import { selectQuestions, isCorrect, scoreSession, type QuizFilter } from '@/domain/quiz/selection';
import { CodeBlock } from '@/components/CodeBlock';
import { PillGroup } from '@/components/PillGroup';
import { useStore } from '@/store/useStore';
import { todayISO } from '@/lib/date';
import type { QuestionType } from '@/content/schema';

const identityShuffle = <T,>(a: T[]) => a;

const MODE_OPTIONS: { value: QuestionType | 'all'; label: string }[] = [
  { value: 'all', label: 'Микс' },
  { value: 'identify-pattern', label: 'Определи паттерн' },
  { value: 'concept', label: 'Теория' },
  { value: 'tradeoff', label: 'Trade-offs' },
];

export function Quiz() {
  const recordQuiz = useStore((s) => s.recordQuiz);
  const [mode, setMode] = useState<QuestionType | 'all'>('all');
  const [i, setI] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const filter: QuizFilter = mode === 'all' ? {} : { type: mode };
  const deck = useMemo(() => selectQuestions(allQuestions, filter, identityShuffle), [mode]);
  const q = deck[i];

  function answer(index: number) {
    if (selected !== null || !q) return;
    const correct = isCorrect(q, index);
    setSelected(index);
    setAnswers((a) => ({ ...a, [q.id]: index }));
    recordQuiz(q.id, index, correct, todayISO());
  }

  function nextQuestion() { setSelected(null); setI((n) => n + 1); }
  function restart() { setSelected(null); setI(0); setAnswers({}); }

  if (!q) {
    const { correct, total } = scoreSession(deck, answers);
    return (
      <div className="text-center py-12 space-y-4">
        <h1 className="text-2xl font-semibold">Готово!</h1>
        <p className="text-lg">Результат: {correct} / {total}</p>
        <button onClick={restart} className="rounded-lg bg-accent px-4 py-2 font-medium">Пройти заново</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Квиз</h1>
        <span className="text-sm text-slate-400">{i + 1} / {deck.length}</span>
      </div>
      <PillGroup options={MODE_OPTIONS} value={mode} onChange={(m) => { setMode(m); restart(); }} />
      <p className="text-lg">{q.prompt}</p>
      {q.code && <CodeBlock sample={q.code} />}
      <div className="space-y-2">
        {q.options.map((opt, idx) => {
          const isAnswer = idx === q.correctIndex;
          const chosen = selected === idx;
          const cls = selected === null ? 'border-surface-muted hover:border-accent-soft'
            : isAnswer ? 'border-emerald-500 bg-emerald-500/10'
            : chosen ? 'border-red-500 bg-red-500/10' : 'border-surface-muted opacity-60';
          return (
            <button key={idx} data-option={idx} onClick={() => answer(idx)} disabled={selected !== null}
              className={`block w-full text-left rounded-lg border px-4 py-3 transition ${cls}`}>{opt}</button>
          );
        })}
      </div>
      {selected !== null && (
        <div className="rounded-lg bg-surface-raised border border-surface-muted p-4">
          <h3 className="font-semibold mb-1">Разбор</h3>
          <p className="text-slate-300">{q.explanation}</p>
          <div className="mt-3 flex justify-end">
            <button onClick={nextQuestion} className="rounded-lg bg-accent px-4 py-2 font-medium">Дальше →</button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/quiz/Quiz.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/features/quiz
git commit -m "feat: quiz with modes, answer feedback, and explanations"
```

---

### Task 14: Dashboard

**Files:**
- Modify: `src/features/dashboard/Dashboard.tsx`
- Test: `src/features/dashboard/Dashboard.test.tsx`

**Interfaces:**
- Consumes: `concepts`; `useStore`, `selectGradeProgress`, `selectDueConceptIds`; `ProgressBar`; `GRADE_ORDER`, `GRADE_LABEL`; `todayISO`.
- Produces: `Dashboard`.

- [ ] **Step 1: Write the failing test**

`src/features/dashboard/Dashboard.test.tsx`:
```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Dashboard } from './Dashboard';
import { useStore } from '@/store/useStore';

beforeEach(() => useStore.getState().resetProgress());

describe('Dashboard', () => {
  it('renders a progress bar per grade', () => {
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    expect(screen.getByText('Junior')).toBeInTheDocument();
    expect(screen.getByText('Lead')).toBeInTheDocument();
    expect(screen.getAllByRole('progressbar').length).toBe(4);
  });

  it('shows current streak', () => {
    useStore.getState().reviewConcept('srp', 4, '2026-07-04');
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    expect(screen.getByText(/Серия/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/dashboard/Dashboard.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Write `Dashboard.tsx`**

```tsx
import { Link } from 'react-router-dom';
import { concepts } from '@/content/index';
import { ProgressBar } from '@/components/ProgressBar';
import { useStore, selectGradeProgress, selectDueConceptIds } from '@/store/useStore';
import { GRADE_ORDER, GRADE_LABEL } from '@/lib/labels';
import { todayISO } from '@/lib/date';

export function Dashboard() {
  const state = useStore();
  const today = todayISO();
  const dueCount = selectDueConceptIds(state, today).length;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Путь от Junior до Lead</h1>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-surface-raised border border-surface-muted p-4">
          <div className="text-sm text-slate-400">Серия дней</div>
          <div className="text-3xl font-bold">{state.streak.current}🔥</div>
          <div className="text-xs text-slate-500 mt-1">рекорд: {state.streak.longest}</div>
        </div>
        <Link to="/review" className="rounded-xl bg-surface-raised border border-surface-muted p-4 hover:border-accent-soft">
          <div className="text-sm text-slate-400">К повторению сегодня</div>
          <div className="text-3xl font-bold">{dueCount}</div>
          <div className="text-xs text-accent-soft mt-1">Начать повторение →</div>
        </Link>
        <Link to="/quiz" className="rounded-xl bg-surface-raised border border-surface-muted p-4 hover:border-accent-soft">
          <div className="text-sm text-slate-400">Проверить себя</div>
          <div className="text-3xl font-bold">Квиз</div>
          <div className="text-xs text-accent-soft mt-1">Определи паттерн →</div>
        </Link>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Прогресс по грейдам</h2>
        {GRADE_ORDER.map((g) => {
          const p = selectGradeProgress(state, concepts, g);
          return <ProgressBar key={g} value={p.pct} label={`${GRADE_LABEL[g]} — освоено ${p.mastered}/${p.total}`} />;
        })}
      </section>

      <Link to="/learn" className="inline-block rounded-lg bg-accent px-5 py-2.5 font-medium hover:bg-accent-soft">
        Продолжить обучение →
      </Link>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/features/dashboard/Dashboard.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/dashboard
git commit -m "feat: dashboard with grade progress, streak, and due count"
```

---

### Task 15: Progress feature + final integration

**Files:**
- Modify: `src/features/progress/Progress.tsx`
- Test: `src/features/progress/Progress.test.tsx`

**Interfaces:**
- Consumes: `concepts`; `useStore`, `selectGradeProgress`, `isMastered`; `ProgressBar`, `Badge`; `GRADE_ORDER`, `GRADE_LABEL`, `CATEGORY_LABEL`.
- Produces: `Progress`.

- [ ] **Step 1: Write the failing test**

`src/features/progress/Progress.test.tsx`:
```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Progress } from './Progress';
import { useStore } from '@/store/useStore';

beforeEach(() => useStore.getState().resetProgress());

describe('Progress', () => {
  it('shows quiz accuracy and per-grade mastery', () => {
    useStore.getState().recordQuiz('q1', 0, true, '2026-07-04');
    useStore.getState().recordQuiz('q2', 1, false, '2026-07-04');
    render(<MemoryRouter><Progress /></MemoryRouter>);
    expect(screen.getByText(/Точность квизов/)).toBeInTheDocument();
    expect(screen.getByText(/50%/)).toBeInTheDocument();
  });

  it('offers a reset that clears progress', async () => {
    useStore.getState().recordQuiz('q1', 0, true, '2026-07-04');
    render(<MemoryRouter><Progress /></MemoryRouter>);
    expect(screen.getByRole('button', { name: /сбросить/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/progress/Progress.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Write `Progress.tsx`**

```tsx
import { concepts } from '@/content/index';
import { ProgressBar } from '@/components/ProgressBar';
import { useStore, selectGradeProgress } from '@/store/useStore';
import { GRADE_ORDER, GRADE_LABEL } from '@/lib/labels';

export function Progress() {
  const state = useStore();
  const reset = useStore((s) => s.resetProgress);
  const total = state.quizResults.length;
  const correct = state.quizResults.filter((r) => r.correct).length;
  const accuracy = total === 0 ? 0 : Math.round((correct / total) * 100);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Прогресс</h1>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-surface-raised border border-surface-muted p-4">
          <div className="text-sm text-slate-400">Точность квизов</div>
          <div className="text-3xl font-bold">{accuracy}%</div>
          <div className="text-xs text-slate-500 mt-1">{correct} из {total}</div>
        </div>
        <div className="rounded-xl bg-surface-raised border border-surface-muted p-4">
          <div className="text-sm text-slate-400">Серия дней</div>
          <div className="text-3xl font-bold">{state.streak.current}🔥</div>
        </div>
        <div className="rounded-xl bg-surface-raised border border-surface-muted p-4">
          <div className="text-sm text-slate-400">Освоено концептов</div>
          <div className="text-3xl font-bold">{concepts.filter((c) => (state.srs[c.id]?.repetitions ?? 0) >= 2).length}</div>
          <div className="text-xs text-slate-500 mt-1">из {concepts.length}</div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Освоение по грейдам</h2>
        {GRADE_ORDER.map((g) => {
          const p = selectGradeProgress(state, concepts, g);
          return <ProgressBar key={g} value={p.pct} label={`${GRADE_LABEL[g]} — ${p.mastered}/${p.total}`} />;
        })}
      </section>

      <button onClick={() => { if (confirm('Сбросить весь прогресс?')) reset(); }}
        className="rounded-lg border border-red-500/50 text-red-400 px-4 py-2 text-sm hover:bg-red-500/10">
        Сбросить прогресс
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/features/progress/Progress.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Full verification**

```bash
npm test
npm run build
```
Expected: all test files pass; `tsc -b` and `vite build` succeed with no errors.

- [ ] **Step 6: Manual smoke (record result in commit body)**

```bash
npm run dev
```
Open the app and confirm the full loop: Dashboard → Учить (flip + next) → Повторение (grade a card) → Квиз (answer + explanation) → Прогресс updates → reload page and confirm progress persisted.

- [ ] **Step 7: Commit**

```bash
git add src/features/progress
git commit -m "feat: progress screen with quiz accuracy, mastery, and reset

Phase 1 vertical slice complete: full learn -> review -> quiz -> progress loop
works on seed content; schema frozen for bulk content generation."
```

---

## Self-Review

**Spec coverage:**
- Levels Junior→Lead — Task 6 (grades on concepts), Tasks 14/15 (per-grade progress). ✓
- Free browse — Task 10 (Library). ✓
- Flashcards + flip — Tasks 8, 11. ✓
- Spaced repetition (SM-2) — Tasks 4, 12. ✓
- Quiz "identify the pattern" with sibling distractors — Tasks 5, 6, 13. ✓
- RU UI + EN terms — Global Constraints + labels (Task 9) + content (Task 6). ✓
- Progress persistence (localStorage) — Task 7 (persist). ✓
- zod content validation — Tasks 2, 6. ✓
- Clean module boundaries — file structure across tasks. ✓
- Frozen schema before bulk content — this whole plan is Phase 1; freezing is its exit criterion. ✓

**Placeholder scan:** No "TBD"/"handle edge cases"/"similar to Task N". Content authoring in Task 6 gives the exact `Concept`/`Question` shape and one full example per file; the 4 remaining SOLID principles and sibling patterns follow the shown shape — this is data authoring against a shown template, not a code placeholder, and Step 7's test enforces completeness.

**Type consistency:** `Concept`/`Question`/`Grade`/`Category` from schema (Task 2) used verbatim downstream. `SrsState`/`Quality`/`QUALITY`/`initSrs`/`review` consistent between Task 4 and Tasks 7/12. Store selector names (`selectDueConceptIds`, `selectGradeProgress`, `isMastered`) and actions (`reviewConcept`, `recordQuiz`, `markSeen`, `setSettings`, `resetProgress`) match between Task 7 definitions and Tasks 11–15 usage. `CodeBlock`/`FlipCard`/`ProgressBar`/`Badge`/`PillGroup` props consistent between Task 8 and consumers.

## Follow-on phases (separate plans, out of scope here)
- **Phase 2 — bulk content:** freeze the Task-2 schema, then a Workflow fan-out (one agent per concept) with adversarial verification of definitions, code, and unambiguous quiz answers; validate the whole dataset with `validateContent`.
- **Phase 3 — polish:** theme toggle wiring, a11y pass, empty/edge states, responsive refinement.
