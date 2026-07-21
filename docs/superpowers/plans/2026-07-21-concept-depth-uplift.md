# Concept Depth Uplift Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the 31 thinnest concepts (5 SOLID + 23 GoF + 3 thin architecture styles) up to the depth of the recently-added microservices patterns — richer, canon-accurate bilingual explanations. Concept fields only; schema, quiz, and code are untouched.

**Architecture:** Pure content edits across 6 `src/content/concepts/*.ts` files, deepening existing concept objects in place. Plus one regression-floor test. No schema/store/UI change.

**Tech Stack:** TypeScript content data, Zod validation, Vitest.

## Global Constraints

- **Depth bar per concept:** `definition` ≥ ~300 chars, `problem` ≥ ~350, `solution` ≥ ~450; `pros` ≥ 4, `cons` ≥ 3, `tradeoffs` ≥ 3, `whenToUse` ≥ 3, `whenNotToUse` ≥ 2; `related` ≥ 3; `diagram` present (add if missing, where it aids understanding).
- **Expand, don't rewrite.** Keep existing good phrasing/items; add depth (nuances, common pitfalls in prose, extra defensible trade-offs). Do NOT discard correct existing content.
- **Canon-accurate**, no filler-for-length: GoF (Gamma/Helm/Johnson/Vlissides) for patterns, R.C. Martin for SOLID, Fowler for architecture styles.
- **Bilingual:** ru AND en deepened equally; both non-empty; no Cyrillic in en fields.
- **Do NOT change:** `id`, `name`, `category`, `grade`, `aka`, `tags`, `codeExample`; and do NOT touch any quiz questions (`c-*`/`ip-*`/`t-*`) living in the same files — only the concept objects.
- **`related` ids must resolve** to real concepts (existing catalog). Mutual links create Compare presets — only add sensible, defensible relations.
- No new dependency. No Co-Authored-By / Claude attribution. Commit after each task.

**Per-concept generation note (all content tasks):** for each concept, feed the generator its EXISTING object + the depth bar + the canonical source + the "must cover" angles below; it returns the deepened fields (definition/problem/solution/pros/cons/tradeoffs/whenToUse/whenNotToUse/related/diagram) which are merged into the object. Verify canon accuracy in review against the cited source. Keep `codeExample` and all listed-untouched fields byte-identical.

---

### Task 1: SOLID (`src/content/concepts/solid.ts`)

**Concepts (5)** — id · canonical source · must-cover angles · diagram:
- **srp** · R.C. Martin (Clean Architecture / APPP) · "single reason to change" = one actor/stakeholder, NOT "does one thing"; cohesion; god-class symptom; contrast with separation-of-concerns · add classDiagram (before: multi-actor class → after: split).
- **ocp** · Meyer / Martin · open for extension, closed for modification via abstraction/polymorphism; plugin points; DIP enables it; YAGNI tension (don't pre-abstract everything) · add classDiagram (client → abstraction ← new impls).
- **lsp** · Barbara Liskov · behavioral subtyping; preconditions not strengthened / postconditions not weakened / invariants preserved; Rectangle–Square & Circle–Ellipse classics; symptom = `instanceof`/type-checks in callers · add classDiagram (base ← subtype contract).
- **isp** · Martin · fat interfaces force needless dependencies; role/client-specific interfaces; relation to SRP; symptom = methods throwing `NotImplemented` · add classDiagram (fat interface split into roles).
- **dip** · Martin · depend on abstractions; both high- and low-level depend on the abstraction, which the high-level owns; enables OCP; distinguish the *principle* from DI/IoC *technique* · add classDiagram (high-level → interface ← low-level).

- [ ] **Step 1:** For each of the 5, deepen all fields to the bar (expand existing prose/lists, add the must-cover angles, raise `tradeoffs`/`related` to ≥3, add the diagram). Preserve `id/name/category/grade/codeExample`; do not touch the `c-*`/`ip-*` questions in the file.
- [ ] **Step 2:** `npx tsc --noEmit && npx vitest run src/content/index.test.ts` → PASS (validateContent + no-Cyrillic-in-en green; related ids resolve).
- [ ] **Step 3:** Commit: `feat(content): deepen SOLID concepts to depth bar`

---

### Task 2: Seed GoF (`src/content/concepts/patterns.ts`)

**Concepts (5)** — id · source (GoF unless noted) · must-cover · diagram (all already have one — keep/upgrade, don't remove):
- **strategy** · encapsulate interchangeable algorithms; vs State (same shape, different intent); function-strategies in modern TS; runtime selection; OCP · keep diagram.
- **observer** · one-to-many change notification; push vs pull; lapsed-listener memory leak; vs pub/sub & event bus; reentrancy/ordering pitfalls · keep.
- **factory-method** · subclass chooses the concrete product; vs simple factory; vs Abstract Factory; parallel hierarchies; ties to Template Method · keep.
- **state** · behavior changes with internal state via state objects; explicit transitions; vs Strategy; vs enum+switch · keep (add diagram if none).
- **abstract-factory** · families of compatible products; vs Factory Method; guarantees product-set compatibility; downside: adding a new product *kind* touches every factory · keep.

- [ ] **Step 1:** Deepen the 5 to the bar (expand prose, ≥4 pros/≥3 cons/≥3 tradeoffs/≥3 whenToUse/≥2 whenNotToUse, ≥3 related, keep/ensure a diagram). Don't touch questions.
- [ ] **Step 2:** `npx tsc --noEmit && npx vitest run src/content/index.test.ts` → PASS.
- [ ] **Step 3:** Commit: `feat(content): deepen seed GoF concepts (strategy/observer/state/factories)`

---

### Task 3: Creational GoF (`src/content/concepts/creational.ts`)

**Concepts (3):**
- **singleton** · GoF · single instance + global access point; downsides (global mutable state, hidden deps, hurts testability); thread-safety; often an anti-pattern vs a DI-scoped single instance · add classDiagram.
- **builder** · GoF · stepwise construction of complex objects; fluent API; solves telescoping constructors; optional Director; vs Factory; immutability angle · add classDiagram.
- **prototype** · GoF · create by cloning an existing instance; shallow vs deep copy; prototype registry; vs Factory; when construction is expensive · add classDiagram.

- [ ] **Step 1:** Deepen the 3 to the bar (+diagrams). Don't touch questions.
- [ ] **Step 2:** `npx tsc --noEmit && npx vitest run src/content/index.test.ts` → PASS.
- [ ] **Step 3:** Commit: `feat(content): deepen creational GoF concepts (singleton/builder/prototype)`

---

### Task 4: Structural GoF (`src/content/concepts/structural.ts`)

**Concepts (7):**
- **adapter** · convert one interface to another; object vs class adapter; vs Facade (adapter changes an interface, facade simplifies a subsystem); two-way adapter; ties to Anti-Corruption Layer (already related) · has diagram — keep.
- **bridge** · decouple abstraction from implementation into two independent hierarchies; designed up-front (vs Adapter retrofit); avoids class explosion · add classDiagram.
- **composite** · part-whole trees, uniform treatment of leaf & composite; transparency-vs-safety trade-off; vs Decorator · has diagram — keep.
- **decorator** · add responsibilities dynamically by wrapping; vs subclassing; vs Proxy (intent differs); stacking order; preserves the component interface · has diagram — keep.
- **facade** · one simplified entry to a subsystem; doesn't forbid direct access; vs Adapter; vs Mediator; reduces coupling · add classDiagram.
- **flyweight** · share intrinsic state across many objects; intrinsic vs extrinsic split; memory win vs complexity cost; when huge object counts · add classDiagram.
- **proxy** · surrogate controlling access; variants (virtual/remote/protection/smart-reference); vs Decorator & Adapter (intent); lazy init · has diagram — keep.

- [ ] **Step 1:** Deepen the 7 to the bar (add diagrams to bridge/facade/flyweight; keep others'). Note: adding `anti-corruption-layer` already sits in adapter.related — keep. Don't touch questions.
- [ ] **Step 2:** `npx tsc --noEmit && npx vitest run src/content/index.test.ts` → PASS.
- [ ] **Step 3:** Commit: `feat(content): deepen structural GoF concepts`

---

### Task 5: Behavioral GoF (`src/content/concepts/behavioral.ts`)

**Concepts (8):**
- **chain-of-responsibility** · decouple sender from receiver; request travels the chain until handled; middleware analogy; may go unhandled; vs Decorator · add classDiagram.
- **command** · encapsulate a request as an object; undo/redo, queueing, logging; invoker/receiver; vs Strategy · add classDiagram.
- **interpreter** · represent a grammar as a class hierarchy; expression trees; use for tiny DSLs, prefer parser generators otherwise; rare in practice · add classDiagram.
- **iterator** · sequential access without exposing representation; internal vs external; language built-ins (generators/iterables); concurrent-modification hazard · add classDiagram.
- **mediator** · centralize complex many-to-many communication into one hub; vs Observer; god-mediator risk · add classDiagram.
- **memento** · capture & restore state without breaking encapsulation; originator/caretaker; undo; vs serialization; memory cost · add classDiagram.
- **template-method** · skeleton in the base class, steps overridden by subclasses; hook methods; Hollywood principle; vs Strategy (inheritance vs composition) · add classDiagram.
- **visitor** · separate an algorithm from the object structure; double dispatch; easy to add operations, hard to add element types (expression problem) · add classDiagram.

- [ ] **Step 1:** Deepen the 8 to the bar (+diagrams). Don't touch questions.
- [ ] **Step 2:** `npx tsc --noEmit && npx vitest run src/content/index.test.ts` → PASS.
- [ ] **Step 3:** Commit: `feat(content): deepen behavioral GoF concepts`

---

### Task 6: Thin architecture styles (`src/content/concepts/architecture.ts`)

**Concepts (3)** — deepen ONLY these; leave layered/mvvm/hexagonal/clean-architecture/microservices untouched:
- **event-driven** · Fowler · produce/consume events; loose coupling; choreography; eventual consistency; vs request/response; debugging/ordering/duplicate-delivery challenges · add flowchart.
- **monolith** · single deployable unit; strengths (simplicity, in-process calls, ACID transactions) vs microservices; the modular monolith; the right default for many systems; scaling/coupling limits · add flowchart.
- **mvc** · separate model/view/controller; controller responsibilities; fat-controller anti-pattern; variants; vs MVVM (already relatable) · add flowchart.

- [ ] **Step 1:** Deepen the 3 to the bar (+diagrams). Touch ONLY these three objects; leave the other architecture concepts and all questions in the file unchanged.
- [ ] **Step 2:** `npx tsc --noEmit && npx vitest run src/content/index.test.ts` → PASS.
- [ ] **Step 3:** Commit: `feat(content): deepen thin architecture styles (event-driven/monolith/mvc)`

---

### Task 7: Depth-floor guard + docs

**Files:** `src/content/index.test.ts`, `README.md`

- [ ] **Step 1: Add the depth-floor regression guard**

In `src/content/index.test.ts`, add inside `describe('content catalog', …)`:
```ts
  it('every concept meets the depth floor (>=2 tradeoffs, >=2 related)', () => {
    const thin = concepts.filter((c) => c.tradeoffs.en.length < 2 || c.related.length < 2);
    expect(thin.map((c) => c.id)).toEqual([]);
  });
```
(A floor, not the full ≥3/≥3 authoring bar — out-of-scope concepts legitimately sit at 2 in one dimension. Turns green once Tasks 1–2 land, and guards against future thin regressions.)

- [ ] **Step 2: Run the full suite + build**

Run: `npx tsc --noEmit && npm run test && npm run build`
Expected: all PASS (226 existing + the new guard).

- [ ] **Step 3: README**

If the Content section characterises depth/consistency, update the wording to reflect the uniform depth (concept/question counts are unchanged — 53 concepts, ~152 questions). Keep English, current tone.

- [ ] **Step 4: Commit**

```bash
git add src/content/index.test.ts README.md
git commit -m "test/docs: concept depth-floor guard + README depth note"
```

---

## Self-Review

**Spec coverage:**
- 31 thin concepts across 6 files deepened to the bar → Tasks 1–6 (exact ids + sources + angles per task). ✓
- Depth bar (prose minimums, ≥4/3/3/3/2 lists, ≥3 related, diagram) → Global Constraints, enforced in each task's review. ✓
- Diagrams added where missing (SOLID + several GoF + 3 arch) → per-concept notes. ✓
- Depth-floor guard (≥2/≥2 for all 53) → Task 7. ✓
- Untouched: quiz/code/schema/store/reference concepts → Global Constraints + per-task "don't touch questions". ✓
- README → Task 7. ✓

**Placeholder scan:** content prose is the generated deliverable (bounded by per-concept source + must-cover angles + the bar); the only verbatim code is the Task 7 guard test. No vague "add content" without guidance.

**Type consistency:** all edits stay within `ConceptSchema` (no new fields); `related` ids reference existing concepts; the guard reads `c.tradeoffs.en.length`/`c.related.length` matching the schema (`tradeoffs: LocalizedList`, `related: string[]`). Untouched fields (`id/name/category/grade/aka/tags/codeExample`) named consistently as off-limits.
