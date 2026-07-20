# Microservices Patterns Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new `microservices` content category with 11 interview-grade patterns (full concept pages + quiz questions + Mermaid diagrams + Compare presets), wired into every catalog-driven screen.

**Architecture:** Content lives in a new `src/content/concepts/microservices.ts`, surfaced through the existing content pipeline. A new category requires small plumbing in the type/enum, colour tokens, label/badge maps, and the graph cluster order. No store/persist change.

**Tech Stack:** React + TS + Vite, Zod (content validation), Vitest, Tailwind, Mermaid.

## Global Constraints

- **New category id:** `microservices`. Concept ids are kebab-case (`^[a-z0-9-]+$`).
- **`Category` is derived from `CategorySchema`** — adding the enum value makes `tsc` require the key in EVERY `Record<Category, …>` map (CATEGORY_LABEL, two CAT_DOT maps) and a colour token for the `bg-cat-microservices` class to exist. All must land together or the build breaks.
- **Content quality:** every concept fills all `ConceptSchema` fields, bilingual (ru+en, non-empty), canon-accurate (Richardson/microservices.io, Fowler, DDD, Nygard "Release It!"), with a self-contained TS example. Each quiz question has exactly one defensible answer with a discriminating `explanation`.
- **Compare presets = mutual `related`.** A preset exists only when both concepts list each other in `related`.
- No new runtime dependency. No store/persist/migration change. No Co-Authored-By / Claude attribution. Commit after each task.

---

### Task 1: Category plumbing + empty content scaffold

**Files:**
- Modify: `src/content/schema.ts`
- Modify: `src/styles/index.css`
- Modify: `tailwind.config.js`
- Modify: `src/lib/labels.ts`
- Modify: `src/features/map/Map.tsx`
- Modify: `src/components/Badge.tsx`
- Modify: `src/domain/graph/layout.ts`
- Modify: `src/domain/graph/layout.test.ts`
- Create: `src/content/concepts/microservices.ts`
- Modify: `src/content/index.ts`

**Interfaces:**
- Produces: category `'microservices'`; `export const microservices: Concept[]` and `export const microservicesQuestions: Question[]` (empty in this task, filled in Task 2).

- [ ] **Step 1: Add the enum value**

In `src/content/schema.ts`, replace:
```ts
export const CategorySchema = z.enum(['solid', 'creational', 'structural', 'behavioral', 'architecture', 'tradeoff']);
```
with:
```ts
export const CategorySchema = z.enum(['solid', 'creational', 'structural', 'behavioral', 'architecture', 'tradeoff', 'microservices']);
```

- [ ] **Step 2: Add the colour token (light + dark)**

In `src/styles/index.css`, in the **light** block add after `--cat-tradeoff: 46 90 140;`:
```css
  --cat-microservices: 176 84 20;
```
and in the **dark** block add after `--cat-tradeoff: 127 180 232;`:
```css
  --cat-microservices: 240 165 80;
```

- [ ] **Step 3: Register the Tailwind colour**

In `tailwind.config.js`, inside the `cat: { … }` block, add after `tradeoff: c('cat-tradeoff'),`:
```js
          microservices: c('cat-microservices'),
```

- [ ] **Step 4: Add the category label (ru + en)**

In `src/lib/labels.ts`, add `microservices` to both maps:
```ts
  ru: {
    solid: 'SOLID', creational: 'Порождающие', structural: 'Структурные',
    behavioral: 'Поведенческие', architecture: 'Архитектурные стили', tradeoff: 'Trade-offs',
    microservices: 'Микросервисы',
  },
  en: {
    solid: 'SOLID', creational: 'Creational', structural: 'Structural',
    behavioral: 'Behavioral', architecture: 'Architecture styles', tradeoff: 'Trade-offs',
    microservices: 'Microservices',
  },
```

- [ ] **Step 5: Add the dot colour to both CAT_DOT maps**

In `src/features/map/Map.tsx`, in `CAT_DOT` add:
```ts
  behavioral: 'bg-cat-behavioral', architecture: 'bg-cat-architecture', tradeoff: 'bg-cat-tradeoff',
  microservices: 'bg-cat-microservices',
```
In `src/components/Badge.tsx`, in `CAT_DOT` add after `tradeoff: 'bg-cat-tradeoff',`:
```ts
  microservices: 'bg-cat-microservices',
```

- [ ] **Step 6: Add the graph cluster order + update its test**

In `src/domain/graph/layout.ts`, replace the `CATEGORY_ORDER` array with:
```ts
export const CATEGORY_ORDER: Category[] = [
  'solid', 'creational', 'structural', 'behavioral', 'architecture', 'tradeoff', 'microservices',
];
```
In `src/domain/graph/layout.test.ts`, update the assertion to:
```ts
    expect(CATEGORY_ORDER).toEqual(['solid', 'creational', 'structural', 'behavioral', 'architecture', 'tradeoff', 'microservices']);
```

- [ ] **Step 7: Create the (empty) content module**

Create `src/content/concepts/microservices.ts`:
```ts
import type { Concept, Question } from '../schema';

/** Microservices patterns — tactical distributed-systems patterns (Richardson, Fowler, DDD). */
export const microservices: Concept[] = [];

export const microservicesQuestions: Question[] = [];
```

- [ ] **Step 8: Wire it into the content index**

In `src/content/index.ts`, add the import after the tradeoffs import:
```ts
import { microservices, microservicesQuestions } from './concepts/microservices';
```
Add `...microservices,` to the end of the `concepts` array and `...microservicesQuestions,` to the end of the `questions` array (before `...fillBlankQuestions,` is fine; order only affects catalog order).

- [ ] **Step 9: Typecheck, test, build**

Run: `npx tsc --noEmit && npm run test && npm run build`
Expected: all PASS (empty category adds no concepts, so course/compare/validation are unaffected; layout test updated).

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat(content): scaffold microservices category (plumbing + empty module)"
```

---

### Task 2: Author the 11 patterns (content + quiz + diagrams + related)

**Files:**
- Modify: `src/content/concepts/microservices.ts` (fill both arrays)
- Modify: `src/content/concepts/structural.ts` (Adapter `related` += `anti-corruption-layer` for the mutual ACL↔Adapter pair)
- Modify: `src/content/course.ts` (add the 11 ids by grade)

**Interfaces:**
- Consumes: `ConceptSchema` / `QuestionSchema` shapes; existing concept ids for `related`.
- Produces: 11 concepts + their questions, all passing `validateContent`.

**Execution note:** content generation runs via the approved multi-agent workflow — fan out one generator per pattern (draft all `ConceptSchema` fields ru+en + 2-3 quiz questions + Mermaid `diagram`), then an adversarial verifier per pattern checks (a) canon accuracy against the cited source, (b) each quiz question has exactly one defensible answer with plausible distractors, (c) ru/en parity and self-contained compiling-shape TS. The controller serializes verified results into the TS module. The per-pattern briefs below are the binding spec every generator must satisfy.

**Per-pattern briefs** (id · grade · essence · canonical source · `related` · diagram kind · quiz angles):

1. **database-per-service** · middle · Each service owns its private datastore; others reach it only via its API/events, never its DB. · Richardson microservices.io. · related: `microservices`, `saga`, `cqrs`, `api-gateway`. · flowchart: 3 services each → own DB. · quiz: why not a shared DB (coupling); consequence = no cross-service ACID → Saga.
2. **api-gateway** · middle · Single entry point: routing, auth, rate-limiting, TLS, response shaping, protocol translation. · Richardson. · related: `bff` (mutual), `aggregator` (mutual), `circuit-breaker`, `microservices`. · flowchart: client → gateway → N services. · quiz: gateway responsibilities; gateway vs direct client-to-service; not business logic.
3. **bff** (Backend for Frontend) · senior · A dedicated backend per frontend (web/mobile), tailored to that UI's needs. · Sam Newman / SoundCloud. · related: `api-gateway` (mutual), `aggregator`. · flowchart: web-bff & mobile-bff → shared services. · quiz: BFF vs one general gateway; when multiple BFFs; ownership by frontend team.
4. **cqrs** · senior · Separate read and write models so each is optimised independently. · Greg Young / Fowler. · related: `event-sourcing` (mutual), `microservices`, `database-per-service`. · flowchart: command → write model; query → read model/projection. · quiz: CQRS vs CRUD; CQRS ≠ Event Sourcing; independent read/write scaling.
5. **event-sourcing** · lead · Persist state as an append-only sequence of events; current state = replay. · Fowler / Young. · related: `cqrs` (mutual), `event-driven`, `saga`. · flowchart: events → event store → projections. · quiz: vs storing current state; audit/replay/temporal queries; relation to CQRS.
6. **saga** · senior · A distributed transaction as a chain of local transactions with compensating actions; orchestration vs choreography. · Garcia-Molina / Richardson. · related: `microservices`, `event-driven`, `database-per-service`, `cqrs`. · sequenceDiagram: steps + compensation on failure. · quiz: why Saga instead of 2PC/ACID; what a compensating action is; orchestration vs choreography.
7. **sidecar** · senior · A helper process co-deployed with the service for cross-cutting concerns (proxy, TLS, telemetry); the basis of a service mesh. · Azure patterns / Istio. · related: `microservices`, `proxy`, `circuit-breaker`. · flowchart: pod = app container + sidecar container. · quiz: sidecar purpose; why a separate process, not a library; mesh relation.
8. **circuit-breaker** · middle · Stop calling a failing dependency once errors cross a threshold; closed → open → half-open. · Nygard "Release It!" / Fowler. · related: `bulkhead` (mutual), `microservices`, `api-gateway`. · stateDiagram/flowchart: the three states. · quiz: the states and transitions; fail-fast rationale; vs blind retry.
9. **anti-corruption-layer** · senior · A translation layer that keeps a legacy/external model from leaking into your domain model. · DDD (Evans). · related: `adapter` (mutual — also add `anti-corruption-layer` to Adapter's `related`), `microservices`, `hexagonal`. · flowchart: your domain ↔ ACL ↔ external system. · quiz: ACL purpose; ACL vs direct integration; how it relates to (and scales up) the Adapter pattern.
10. **aggregator** · senior · Compose responses from several services into one result for the client. · Richardson / EIP. · related: `api-gateway` (mutual), `bff`. · flowchart: aggregator → 3 services → merged response. · quiz: aggregator vs gateway; parallel vs chained composition; coupling/latency risk.
11. **bulkhead** · senior · Isolate resources (separate pools) so one overloaded/failing part can't sink the rest. · Nygard "Release It!". · related: `circuit-breaker` (mutual), `microservices`. · flowchart: separate connection/thread pools per dependency. · quiz: bulkhead purpose; vs circuit breaker; the ship-hull analogy.

- [ ] **Step 1: Generate + verify all 11 patterns**

Run the content workflow with the briefs above. Every concept must satisfy `ConceptSchema` (all fields, ru+en non-empty, valid Mermaid `diagram`, `category: 'microservices'`, correct `grade`). Every question must satisfy `QuestionSchema` (`category: 'microservices'`, `conceptId` set, one defensible `correctIndex`, ru/en option counts equal). Ensure the mutual `related` links listed above are reciprocal.

- [ ] **Step 2: Write the content module**

Populate `src/content/concepts/microservices.ts` `microservices` and `microservicesQuestions` arrays with the verified data, matching the existing files' formatting (multi-line `code` joined with `\n`, `.join('\n')`).

- [ ] **Step 3: Make the ACL↔Adapter pair mutual**

In `src/content/concepts/structural.ts`, add `"anti-corruption-layer"` to the Adapter concept's `related` array (so `selectConfusablePairs` emits the cross-category preset).

- [ ] **Step 4: Add the 11 ids to the course**

In `src/content/course.ts`, add the ids to `COURSE` by grade (append within each grade group, after existing ids):
- middle: `'api-gateway', 'circuit-breaker', 'database-per-service'`
- senior: `'bff', 'saga', 'cqrs', 'anti-corruption-layer', 'aggregator', 'bulkhead', 'sidecar'`
- lead: `'event-sourcing'`
Update the doc-comment count (`all 42 concepts` → `all 53 concepts`).

- [ ] **Step 5: Validate, typecheck, test, build**

Run: `npx tsc --noEmit && npm run test && npm run build`
Expected: PASS. `validateContent` (run in `index.test.ts`) confirms no duplicate ids, all `related`/`conceptId` resolve, ru/en option parity. `course.test.ts` confirms every new concept is placed exactly once at a consistent grade. `pairs.test.ts` stays green (mutual pairs auto-detected).

- [ ] **Step 6: Commit**

```bash
git add src/content/concepts/microservices.ts src/content/concepts/structural.ts src/content/course.ts
git commit -m "feat(content): 11 microservices patterns (concepts, quiz, diagrams, compare presets)"
```

---

### Task 3: Docs + memory

**Files:**
- Modify: `README.md`
- Modify: `/Users/arthur/.claude-work/projects/-Users-arthur-Documents-work-learna/memory/archmentor-project.md` and its index `MEMORY.md`

- [ ] **Step 1: Update the README**

- Intro/features: add **Microservices patterns** to the catalog description and Library section.
- Content section: concepts **42 → 53**; add "**11 microservices patterns** (a dedicated category)"; update the question count to the actual new total; note the new category.
- Status line: bump the passing-test count to the new total.
Keep the English, current tone.

- [ ] **Step 2: Update project memory**

In `archmentor-project.md`, add the microservices-patterns category to the concept inventory (53 concepts, new `microservices` category, Compare presets added). Update the one-line hook in `MEMORY.md` if the counts it cites changed.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: README — microservices patterns category"
```
(Memory files live outside the repo; they are saved via the Write tool, not committed.)

---

## Self-Review

**Spec coverage:**
- New `microservices` category across schema/labels/colour/CAT_DOT×2/graph order → Task 1. ✓
- 11 full concepts + quiz + Mermaid + grades → Task 2 (briefs enumerate all 11 with grade + source). ✓
- Compare presets via mutual `related` (incl. cross-category ACL↔Adapter) → Task 2 Steps 1, 3. ✓
- Course completeness (11 ids by grade) → Task 2 Step 4. ✓
- README + memory → Task 3. ✓
- No store/persist change → no such edits. ✓

**Placeholder scan:** Task 1 is fully verbatim. Task 2's concept prose is intentionally generated (it is the deliverable) but bounded by per-pattern briefs with id/grade/essence/source/related/diagram/quiz — no vague "add content" step.

**Type consistency:** `category: 'microservices'` matches the enum from Task 1; `CATEGORY_ORDER`/`CATEGORY_LABEL`/both `CAT_DOT`/tailwind `cat.microservices`/`--cat-microservices` all named consistently; concept ids in course.ts and related links match the ids in the briefs; `microservices`/`microservicesQuestions` exports match the index import.
