# Per-language Lazy Content — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split content into a language-independent core + per-language prose packs, load only the active language at startup (idle-prefetch the other), so the initial content payload roughly halves and language switching stays instant.

**Architecture:** New `core/` (eager) + `locales/{ru,en}.ts` (dynamic-imported chunks) + a `registry` holding per-language prose keyed by lang. `localize.ts` merges core + `proseFor(lang)`. Public API (`concepts`/`questions`/`useConcepts`/…) stays stable — the domain and direct consumers use only language-independent fields.

**Tech Stack:** TypeScript, Zod, Vite/Rollup dynamic import, Vitest, React.

## Global Constraints

- **Isomorphic migration:** reconstructing the old `{ru,en}` objects from core+ru+en must equal the current content exactly (round-trip guard). Content prose is NOT edited.
- **Public API stable:** `concepts: ConceptCore[]`, `questions: QuestionCore[]`, `getConcept`, `useConcepts`/`useConcept`/`useQuestions` keep their names and view shapes (`ConceptView`/`QuestionView` unchanged).
- **Resolver reads prose by the lang passed to it** (`proseFor(lang)`), never a global "active".
- **Out of scope:** `diagram.ts` (Diagram Builder scenarios — separate schema), `messages.ts` (UI i18n). Do not touch content wording.
- No Co-Authored-By / Claude attribution. Commit after each task.

---

### Task 1: Migration — split schemas + generate core/locale files, round-trip verified

**Files:**
- Modify: `src/content/schema.ts` (add core/prose schemas + types; keep existing `ConceptSchema`/`QuestionSchema`)
- Create: `src/content/core/concepts.ts`, `src/content/core/questions.ts`, `src/content/locales/ru.ts`, `src/content/locales/en.ts` (generated)
- Create (throwaway, deleted in Task 2): a migration+round-trip test

**Interfaces (produced):** `ConceptCore`, `ConceptProse`, `QuestionCore`, `QuestionProse` types; `conceptsCore`, `questionsCore`, and per-locale `conceptProse`/`questionProse` records.

- [ ] **Step 1: Add core/prose schemas + types to `schema.ts`**

```ts
export const ConceptCoreSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  aka: z.array(z.string()).optional(),
  category: CategorySchema,
  grade: GradeSchema,
  related: z.array(z.string()),
  tags: z.array(z.string()).optional(),
  diagram: z.string().min(1).optional(),
  codeLang: z.literal('typescript'),
  highlightLines: z.array(z.number().int().nonnegative()).optional(),
});
export const ConceptProseSchema = z.object({
  tagline: z.string().min(1), definition: z.string().min(1), problem: z.string().min(1),
  solution: z.string().min(1), code: z.string().min(1),
  pros: z.array(z.string().min(1)).min(1), cons: z.array(z.string().min(1)).min(1),
  tradeoffs: z.array(z.string().min(1)).min(1), whenToUse: z.array(z.string().min(1)).min(1),
  whenNotToUse: z.array(z.string().min(1)).min(1).optional(),
});
export const QuestionCoreSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/), type: QuestionTypeSchema, category: CategorySchema,
  grade: GradeSchema, correctIndex: z.number().int().nonnegative(),
  conceptId: z.string().optional(),
  codeLang: z.literal('typescript').optional(),
  highlightLines: z.array(z.number().int().nonnegative()).optional(),
});
export const QuestionProseSchema = z.object({
  prompt: z.string().min(1), code: z.string().min(1).optional(),
  options: z.array(z.string().min(1)).min(1), explanation: z.string().min(1),
});
export type ConceptCore = z.infer<typeof ConceptCoreSchema>;
export type ConceptProse = z.infer<typeof ConceptProseSchema>;
export type QuestionCore = z.infer<typeof QuestionCoreSchema>;
export type QuestionProse = z.infer<typeof QuestionProseSchema>;
```

- [ ] **Step 2: Define the split/rebuild helpers (used by the migration + round-trip)**

Pure functions (put in the throwaway migration test, or a temp module):
```ts
const splitConceptCore = (c: Concept): ConceptCore => ({
  id: c.id, name: c.name, aka: c.aka, category: c.category, grade: c.grade,
  related: c.related, tags: c.tags, diagram: c.diagram,
  codeLang: c.codeExample.lang, highlightLines: c.codeExample.highlightLines,
});
const splitConceptProse = (c: Concept, l: 'ru'|'en'): ConceptProse => ({
  tagline: c.tagline[l], definition: c.definition[l], problem: c.problem[l], solution: c.solution[l],
  code: c.codeExample.code[l], pros: c.pros[l], cons: c.cons[l], tradeoffs: c.tradeoffs[l],
  whenToUse: c.whenToUse[l], whenNotToUse: c.whenNotToUse ? c.whenNotToUse[l] : undefined,
});
const splitQuestionCore = (q: Question): QuestionCore => ({
  id: q.id, type: q.type, category: q.category, grade: q.grade, correctIndex: q.correctIndex,
  conceptId: q.conceptId, codeLang: q.code?.lang, highlightLines: q.code?.highlightLines,
});
const splitQuestionProse = (q: Question, l: 'ru'|'en'): QuestionProse => ({
  prompt: q.prompt[l], code: q.code ? q.code.code[l] : undefined,
  options: q.options[l], explanation: q.explanation[l],
});
// rebuild inverts these into the original {ru,en} object shape.
```
Rebuild reconstructs `codeExample: { lang: core.codeLang, code: {ru,en}, highlightLines: core.highlightLines }` and each Localized/LocalizedList field as `{ru: ruProse.x, en: enProse.x}`; questions' `code` as `{ lang: core.codeLang!, code: {ru,en}, highlightLines }` when present.

- [ ] **Step 3: Generate the 4 files**

A throwaway vitest test imports `concepts`, `questions` from the current `./index`, and writes:
- `src/content/core/concepts.ts` — `import type { ConceptCore } from '../schema';\nexport const conceptsCore: ConceptCore[] = <JSON of concepts.map(splitConceptCore)>;`
- `src/content/core/questions.ts` — `questionsCore: QuestionCore[]` similarly.
- `src/content/locales/ru.ts` — `import type { ConceptProse, QuestionProse } from '../schema';\nexport const conceptProse: Record<string, ConceptProse> = <{[id]: splitConceptProse(c,'ru')}>;\nexport const questionProse: Record<string, QuestionProse> = <{[id]: splitQuestionProse(q,'ru')}>;`
- `src/content/locales/en.ts` — same for 'en'.
Serialize with `JSON.stringify(x, null, 2)` (valid TS object literals; code strings keep `\n`). Preserve insertion order (concepts/questions array order).

- [ ] **Step 4: Round-trip verification (the gate)**

In the same throwaway test, rebuild `{ru,en}` objects from generated core+ru+en and assert deep-equality with the originals using order-independent stable stringify:
```ts
const stable = (o: unknown): string => JSON.stringify(o, Object.keys(flatten(o)).sort()); // or a recursive key-sorting stringify
for each concept: expect(stableSort(rebuiltConcept)).toBe(stableSort(originalConcept));
for each question: expect(stableSort(rebuiltQuestion)).toBe(stableSort(originalQuestion));
```
Use a proper recursive key-sorting serializer so key-order differences don't cause false mismatch, but VALUE differences do. Any mismatch → STOP (migration logic bug).

- [ ] **Step 5: Verify + commit**

Run: `npx tsc --noEmit && npm run test` — PASS (old app still wired to old files; new files typecheck; round-trip green). Do NOT delete old files yet.
Commit: `feat(content): generate core + per-language prose files (round-trip verified)`
(The generated files are unused by the app in this task — cutover is Task 2.)

---

### Task 2: Cutover — registry, resolver, index; delete old files

**Files:**
- Create: `src/content/registry.ts`
- Modify: `src/content/localize.ts`, `src/content/index.ts`, `src/test-setup.ts`
- Delete: `src/content/concepts/{solid,patterns,creational,structural,behavioral,architecture,tradeoffs,microservices}.ts`, `src/content/questions.ts`, `src/content/fillBlank.ts`, and the Task-1 throwaway test
- Modify: `src/content/index.test.ts` and any content test referencing old shapes

**Interfaces (consumed):** `conceptsCore`/`questionsCore` (Task 1), locale prose modules.

- [ ] **Step 1: `registry.ts`**

```ts
import type { Lang } from '@/i18n/lang';
import type { ConceptProse, QuestionProse } from './schema';
export interface Prose { concepts: Record<string, ConceptProse>; questions: Record<string, QuestionProse>; }
const cache = new Map<Lang, Prose>();
const inflight = new Map<Lang, Promise<Prose>>();
export function isLoaded(lang: Lang): boolean { return cache.has(lang); }
export function proseFor(lang: Lang): Prose {
  const p = cache.get(lang);
  if (!p) throw new Error(`content prose for "${lang}" not loaded`);
  return p;
}
export function setProse(lang: Lang, p: Prose): void { cache.set(lang, p); } // for tests
export function loadLocale(lang: Lang): Promise<Prose> {
  const hit = cache.get(lang); if (hit) return Promise.resolve(hit);
  let f = inflight.get(lang);
  if (!f) {
    f = (lang === 'ru' ? import('./locales/ru') : import('./locales/en'))
      .then((m) => { const p = { concepts: m.conceptProse, questions: m.questionProse }; cache.set(lang, p); return p; });
    inflight.set(lang, f);
  }
  return f;
}
export function prefetchLocale(lang: Lang): void { if (!cache.has(lang)) void loadLocale(lang); }
```
(Static `import('./locales/ru')` / `import('./locales/en')` literals so Rollup can split them into named chunks.)

- [ ] **Step 2: Rewrite `localize.ts` to merge core + prose**

`localizeConcept(core: ConceptCore, lang)`:
```ts
const p = proseFor(lang).concepts[core.id];
return { id: core.id, name: core.name, aka: core.aka, category: core.category, grade: core.grade,
  tagline: p.tagline, definition: p.definition, problem: p.problem, solution: p.solution,
  codeExample: { lang: core.codeLang, code: p.code, highlightLines: core.highlightLines },
  pros: p.pros, cons: p.cons, tradeoffs: p.tradeoffs, whenToUse: p.whenToUse, whenNotToUse: p.whenNotToUse,
  related: core.related, tags: core.tags, diagram: core.diagram };
```
`localizeQuestion(core: QuestionCore, lang)`:
```ts
const p = proseFor(lang).questions[core.id];
return { id: core.id, type: core.type, category: core.category, grade: core.grade,
  prompt: p.prompt,
  code: p.code ? { lang: core.codeLang!, code: p.code, highlightLines: core.highlightLines } : undefined,
  options: p.options, correctIndex: core.correctIndex, explanation: p.explanation, conceptId: core.conceptId };
```
`useConcepts`/`useConcept`/`useQuestions` unchanged except they read `concepts`/`questions` (core) + pass `lang` to the localizers (which now hit `proseFor`). `ConceptView`/`QuestionView` shapes unchanged.

- [ ] **Step 3: Rewrite `index.ts`**

Assemble `concepts`/`questions` from `core/concepts.ts` + `core/questions.ts`. Keep `conceptById`/`getConcept`. Replace `validateContent` with a core+prose validator (`validateSplit`) run in DEV that: parses cores with the core schemas; checks unique ids; `related`/`conceptId` resolve; and — importing both locale modules in DEV (static import acceptable in dev-only guard OR run only in tests) — checks every core id has prose in both, list-length parity, `correctIndex` in options range, identify-pattern options == concept names, no-Cyrillic-in-en, depth-floor. (Heavy cross-locale checks may live in `index.test.ts` instead of the DEV import to avoid pulling both locales into the eager bundle — prefer tests.)

**Important:** the DEV validator must NOT statically import both locales into the app bundle (that would defeat the split). Put cross-locale/parity/no-Cyrillic/identify-pattern/depth-floor assertions in `index.test.ts` (test-only, both locales loaded there). The DEV in-app guard validates only cores + that active prose resolves.

- [ ] **Step 4: `test-setup.ts` loads both locales into the registry**

```ts
import '@testing-library/jest-dom/vitest';
import { conceptProse as ruC, questionProse as ruQ } from '@/content/locales/ru';
import { conceptProse as enC, questionProse as enQ } from '@/content/locales/en';
import { setProse } from '@/content/registry';
setProse('ru', { concepts: ruC, questions: ruQ });
setProse('en', { concepts: enC, questions: enQ });
```

- [ ] **Step 5: Update content tests + delete old files**

Rewrite `index.test.ts` assertions to the split model (counts over `concepts` core; parity/no-Cyrillic/identify-pattern/depth-floor over the two locale records). Delete the 8 combined concept files + `questions.ts` + `fillBlank.ts` + the Task-1 throwaway test. Ensure nothing imports deleted files (grep).

- [ ] **Step 6: Verify + commit**

Run: `npx tsc --noEmit && npm run test` — PASS. Commit: `feat(content): cut over to core+registry resolver, drop combined files`

---

### Task 3: Startup load + idle prefetch + async language switch

**Files:** `src/main.tsx`, the language toggle component (`src/components/LanguageToggle.tsx` or wherever `setSettings({lang})` is triggered), a small splash.

- [ ] **Step 1: Startup await + splash in `main.tsx`**

```ts
import { loadLocale, prefetchLocale } from './content/registry';
import { useStore } from './store/useStore';
const lang = useStore.getState().settings.lang;      // persist hydrates synchronously
const root = ReactDOM.createRoot(document.getElementById('root')!);
// optional minimal splash while the first locale loads:
root.render(<div className="min-h-screen bg-surface" aria-busy="true" />);
loadLocale(lang).then(() => {
  root.render(<React.StrictMode><App /></React.StrictMode>);
  const other = lang === 'ru' ? 'en' : 'ru';
  const idle = (window as any).requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 1500));
  idle(() => prefetchLocale(other));
});
```
(Keep the splash theme-neutral/minimal; the anti-FOUC theme script already sets the background.)

- [ ] **Step 2: Async-safe language switch**

Where the toggle sets language, gate on prose availability:
```ts
async function switchLang(next: Lang) {
  if (!isLoaded(next)) { setSwitching(true); await loadLocale(next); setSwitching(false); }
  setSettings({ lang: next });
}
```
Because the other language is idle-prefetched at startup, `isLoaded(next)` is normally true → instant. Show a subtle busy state only on the rare not-yet-loaded path. Keep the toggle's markup/aria otherwise unchanged.

- [ ] **Step 3: Verify + browser-check**

`npx tsc --noEmit && npm run test && npm run build` PASS. Then `npm run preview`: confirm the app renders (splash → content), language toggle flips RU↔EN correctly (prose swaps), and — via devtools Network — only one `locales-*` chunk loads on first paint, the other arriving shortly after (idle). Check both themes.
Commit: `feat(content): startup locale load + idle prefetch + async language switch`

---

### Task 4: Build chunks + docs

**Files:** `vite.config.ts`, `README.md`, project memory.

- [ ] **Step 1: manualChunks**

Update `vite.config.ts`: drop the blanket `content` rule (or scope it to `core/`); the `locales/ru`/`locales/en` dynamic imports auto-split into their own chunks. Keep `chunkSizeWarningLimit` or lower it if the big single content chunk is gone.

- [ ] **Step 2: Build + verify the split**

`npm run build`. Inspect `dist/assets`: confirm there are distinct `ru`/`en` locale chunks of comparable size (~each ≈ half the old content chunk) and the eager entry no longer bundles both languages. Note actual sizes.

- [ ] **Step 3: README + memory**

README: note content is split per language and lazily loaded (active first, other prefetched). Counts unchanged (53 concepts / 152 questions / 227 tests, adjust if the test count changed). Update project memory with the architecture + the "reconstruction under round-trip guard" migration lesson.

- [ ] **Step 4: Commit**

`git add -A && git commit -m "build/docs: per-language content chunks + README"`

---

## Self-Review

**Spec coverage:**
- core/prose split + files → Task 1. ✓
- registry (`proseFor`/`loadLocale`/`prefetch`, per-lang, no global active) → Task 2 Step 1. ✓
- resolver merges core+prose, public API stable → Task 2 Steps 2-3. ✓
- startup active-first + idle prefetch + async switch → Task 3. ✓
- validation/parity/no-Cyrillic/identify-pattern/depth-floor in new form (test-side to avoid eager double-locale) → Task 2 Steps 3, 5. ✓
- isomorphic migration + round-trip guard → Task 1 Step 4. ✓
- per-language build chunks verified → Task 4. ✓
- diagram.ts / messages.ts untouched; content wording unchanged → Global Constraints. ✓

**Placeholder scan:** mechanical code (schemas, registry, resolver, main, test-setup) given verbatim; the migration file *contents* are generated by the Task-1 script (deterministic from current content), gated by round-trip — not hand-authored prose.

**Type consistency:** `ConceptCore.codeLang`/`highlightLines` reconstruct `codeExample`; `QuestionCore.codeLang` optional (only when the question has code); `proseFor(lang)` returns `Prose`; `ConceptView`/`QuestionView` shapes identical to today so all ~15 consumers compile unchanged; `concepts: ConceptCore[]`/`questions: QuestionCore[]` retain `id/category/grade`/`related`/`correctIndex` used by the domain + Progress/Dashboard/Review.
