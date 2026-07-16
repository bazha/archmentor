# Concept Explanatory Diagrams (Mermaid) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show an explanatory Mermaid diagram on Library concept pages — lazy-rendered, theme-aware, for a key subset of concepts.

**Architecture:** An optional `diagram` string (Mermaid source) on the concept schema, passed through to `ConceptView`. A `ConceptDiagram` component dynamically imports `mermaid` (its own lazy chunk) and renders theme-aware SVG. `ConceptPage` shows a "Diagram" section after "Solution" when a diagram exists.

**Tech Stack:** React + TS + Vite, Zod, Vitest, `mermaid` (new dep, dynamically imported).

## Global Constraints

- **`diagram` is a plain string (Mermaid source), NOT `Localized`** — labels are English (consistent with the project's "pattern names/terms stay English" convention).
- **Optional field** — no `diagram` → no section (graceful). Coverage is a curated subset, not all 42.
- **Mermaid is dynamically imported** inside `ConceptDiagram` so it lands in its own lazy chunk (not the main bundle or the Library page chunk).
- **Theme-aware:** mermaid built-in `dark` (dark mode) / `neutral` (light mode); re-render on theme change; `securityLevel: 'strict'`.
- Bilingual UI key (`concept.diagram`) in both `ru` and `en`. No Co-Authored-By / Claude attribution in commits. Commit after each task.

---

### Task 1: Mechanism — schema field, ConceptDiagram, page integration, i18n + Strategy example

**Files:**
- Modify: `src/content/schema.ts` (`diagram` on `ConceptSchema`)
- Modify: `src/content/localize.ts` (`diagram` on `ConceptView` + passthrough)
- Create: `src/features/library/ConceptDiagram.tsx`
- Modify: `src/features/library/ConceptPage.tsx` (Diagram section)
- Modify: `src/i18n/messages.ts` (`concept.diagram` ru+en)
- Modify: `src/content/concepts/patterns.ts` (add `diagram` to the `strategy` concept)
- Modify: `src/content/index.test.ts` (assert diagram validity)
- Add dep: `mermaid`

**Interfaces:**
- Produces: `ConceptDiagram` component `{ source: string }`; `Concept.diagram?: string`; `ConceptView.diagram?: string`.

- [ ] **Step 1: Install mermaid**

Run: `npm install mermaid`
Expected: `mermaid` added to `dependencies`.

- [ ] **Step 2: Add `diagram` to the schema**

In `src/content/schema.ts`, add to `ConceptSchema` (after `related` or `tags`):

```ts
  diagram: z.string().min(1).optional(),
```

- [ ] **Step 3: Pass `diagram` through ConceptView**

In `src/content/localize.ts`:
- Add `diagram?: string;` to the `ConceptView` interface (next to `tags?`).
- In `localizeConcept`'s returned object, add `diagram: c.diagram,` (passthrough — not localized).

- [ ] **Step 4: Create ConceptDiagram**

Create `src/features/library/ConceptDiagram.tsx`:

```tsx
import { useEffect, useId, useState } from 'react';
import { useStore } from '@/store/useStore';

/** Lazily renders a Mermaid diagram (source is trusted app content), theme-aware. */
export function ConceptDiagram({ source }: { source: string }) {
  const theme = useStore((s) => s.settings.theme);
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [svg, setSvg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setSvg(null);
    setFailed(false);
    (async () => {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: theme === 'dark' ? 'dark' : 'neutral',
        });
        const out = await mermaid.render(`cd-${rawId}`, source);
        if (!cancelled) setSvg(out.svg);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => { cancelled = true; };
  }, [source, theme, rawId]);

  if (failed) return null;
  if (!svg) return <div className="h-40 animate-pulse rounded-xl bg-surface-muted" aria-hidden="true" />;
  return (
    <div
      role="img"
      aria-label="diagram"
      className="overflow-x-auto rounded-xl border border-line bg-surface-raised p-4 [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
```

- [ ] **Step 5: Add the Diagram section to ConceptPage**

In `src/features/library/ConceptPage.tsx`:
- Add the import: `import { ConceptDiagram } from './ConceptDiagram';`
- Insert this section immediately AFTER the "Solution" `<section>` and BEFORE the "Code example" `<section>`:

```tsx
      {c.diagram && (
        <section className="space-y-4">
          <SectionHeading>{t('concept.diagram')}</SectionHeading>
          <ConceptDiagram source={c.diagram} />
        </section>
      )}
```

- [ ] **Step 6: Add the i18n key**

In `src/i18n/messages.ts`, add to the `ru` map (near the other `concept.*` keys):

```ts
  'concept.diagram': 'Схема',
```
and to the `en` map:

```ts
  'concept.diagram': 'Diagram',
```

- [ ] **Step 7: Add the Strategy diagram**

In `src/content/concepts/patterns.ts`, add a `diagram` field to the `strategy` concept object (a backtick template literal; place it after the `related` field). Match the concept's code (Checkout / PricingStrategy / Regular / Vip):

```ts
    diagram: `classDiagram
  class Checkout {
    +total(base)
  }
  class PricingStrategy {
    <<interface>>
    +price(base)
  }
  Checkout o--> PricingStrategy : delegates
  PricingStrategy <|.. Regular
  PricingStrategy <|.. Vip`,
```

- [ ] **Step 8: Extend the content test**

In `src/content/index.test.ts`, add:

```ts
  it('concept diagrams, where present, are non-empty Mermaid strings', () => {
    let withDiagram = 0;
    for (const c of concepts) {
      if (c.diagram !== undefined) {
        expect(typeof c.diagram).toBe('string');
        expect(c.diagram.trim().length).toBeGreaterThan(0);
        withDiagram++;
      }
    }
    expect(withDiagram).toBeGreaterThan(0); // strategy in Task 1
  });
```

(`concepts` is already imported in `index.test.ts`; if not, import it from `./index`.)

- [ ] **Step 9: Typecheck, full suite, build**

Run: `npx tsc --noEmit && npm run test && npm run build`
Expected: all PASS. Confirm mermaid is a SEPARATE lazy chunk (dynamically imported), not in the main/Library chunk:

Run: `ls dist/assets | grep -i mermaid | head`
Expected: at least one `mermaid`-related chunk file exists.

- [ ] **Step 10: Browser-verify**

Run `npm run preview`, open `/library/strategy`. Confirm: a "Diagram" section shows a rendered class diagram between Solution and Code; toggle theme → diagram re-renders legibly in dark and light; other concepts (no diagram) show no section.

- [ ] **Step 11: Commit**

```bash
git add package.json package-lock.json src/content/schema.ts src/content/localize.ts src/features/library/ConceptDiagram.tsx src/features/library/ConceptPage.tsx src/i18n/messages.ts src/content/concepts/patterns.ts src/content/index.test.ts
git commit -m "feat(library): lazy Mermaid concept diagrams + Strategy example"
```

---

### Task 2: Author diagrams for the subset

**Files:**
- Modify: `src/content/concepts/*.ts` (add `diagram` to the listed concepts)
- Modify: `src/content/index.test.ts` (raise coverage assertion)

**Interfaces:**
- Consumes: the `diagram` field + render mechanism from Task 1.

- [ ] **Step 1: Add these diagrams**

For each concept id below, find its object in `src/content/concepts/*.ts` (grep `id: "<id>"`) and add a `diagram` field (backtick template literal). Use exactly these Mermaid sources:

**observer**
```ts
    diagram: `classDiagram
  class Subject {
    +attach(o)
    +notify()
  }
  class Observer {
    <<interface>>
    +update()
  }
  Subject o--> "many" Observer
  Observer <|.. ConcreteObserver`,
```

**decorator**
```ts
    diagram: `classDiagram
  class Component {
    <<interface>>
    +operation()
  }
  Component <|.. ConcreteComponent
  Component <|.. Decorator
  Decorator o--> Component : wraps
  Decorator <|-- ConcreteDecorator`,
```

**adapter**
```ts
    diagram: `classDiagram
  class Target {
    <<interface>>
    +request()
  }
  class Adaptee {
    +specificRequest()
  }
  Target <|.. Adapter
  Adapter o--> Adaptee`,
```

**composite**
```ts
    diagram: `classDiagram
  class Component {
    <<interface>>
    +operation()
  }
  Component <|.. Leaf
  Component <|.. Composite
  Composite o--> "children" Component`,
```

**proxy**
```ts
    diagram: `classDiagram
  class Subject {
    <<interface>>
    +request()
  }
  Subject <|.. RealSubject
  Subject <|.. Proxy
  Proxy o--> RealSubject`,
```

**factory-method**
```ts
    diagram: `classDiagram
  class Creator {
    +factoryMethod()
    +operation()
  }
  class Product {
    <<interface>>
  }
  Creator <|-- ConcreteCreator
  Product <|.. ConcreteProduct
  ConcreteCreator ..> ConcreteProduct : creates`,
```

**abstract-factory**
```ts
    diagram: `classDiagram
  class AbstractFactory {
    <<interface>>
    +createA()
    +createB()
  }
  AbstractFactory <|.. ConcreteFactory1
  AbstractFactory <|.. ConcreteFactory2
  AbstractFactory ..> ProductA : creates
  AbstractFactory ..> ProductB : creates`,
```

**chain-of-responsibility**
```ts
    diagram: `classDiagram
  class Handler {
    <<interface>>
    +setNext(h)
    +handle(req)
  }
  Handler o--> "next" Handler
  Handler <|.. ConcreteHandlerA
  Handler <|.. ConcreteHandlerB`,
```

**layers** (architectural style — flowchart)
```ts
    diagram: `flowchart TD
  P[Presentation] --> B[Business Logic]
  B --> D[Data Access]
  D --> DB[(Database)]`,
```

**hexagonal** (architectural style — flowchart)
```ts
    diagram: `flowchart LR
  A[Adapters: UI / API] --> PIn((Ports))
  PIn --> Core[Domain Core]
  Core --> POut((Ports))
  POut --> Inf[Adapters: DB / External]`,
```

(Confirm each id exists via `grep -rn 'id: "<id>"' src/content/concepts/`. If an id differs slightly, match the actual id in the file. Together with Strategy from Task 1 this is 11 diagrams.)

- [ ] **Step 2: Raise the coverage assertion**

In `src/content/index.test.ts`, change the Task 1 line `expect(withDiagram).toBeGreaterThan(0);` to:

```ts
    expect(withDiagram).toBeGreaterThanOrEqual(8);
```

- [ ] **Step 3: Typecheck, full suite, build**

Run: `npx tsc --noEmit && npm run test && npm run build`
Expected: all PASS (Zod still validates; coverage assertion met).

- [ ] **Step 4: Browser-verify a few**

Run `npm run preview`, open `/library/observer`, `/library/decorator`, `/library/layers`, `/library/hexagonal`. Confirm each renders a legible diagram in dark and light; no console errors; no layout overflow (the container scrolls horizontally if wide).

- [ ] **Step 5: Commit**

```bash
git add src/content/concepts/ src/content/index.test.ts
git commit -m "feat(library): concept diagrams for key patterns and architectural styles"
```

---

## Self-Review

**Spec coverage:**
- Optional `diagram: string` on the concept schema; not `Localized` → Task 1 Steps 2, 7. ✓
- Passed through `ConceptView` (not localized) → Task 1 Step 3. ✓
- `ConceptDiagram`: dynamic `import('mermaid')` (own lazy chunk), theme-aware (`dark`/`neutral`), re-render on theme change, `securityLevel: 'strict'`, graceful fail (returns null), skeleton while loading → Task 1 Step 4. ✓
- "Diagram" section after Solution, only when present → Task 1 Step 5. ✓
- i18n `concept.diagram` ru+en → Task 1 Step 6. ✓
- Subset coverage ≥ 8 (11 authored) → Tasks 1–2. ✓
- Content test (validity + coverage); mermaid render browser-verified (not jsdom-tested) → Tasks 1–2. ✓
- Mermaid in a separate lazy chunk (build check) → Task 1 Step 9. ✓

**Placeholder scan:** none — all Mermaid sources and code are given verbatim. The "match the actual id" note is a concrete verification instruction (grep), not a vague placeholder.

**Type consistency:** `Concept.diagram?: string` (schema) → `ConceptView.diagram?: string` (localize passthrough) → `ConceptPage` reads `c.diagram` → `ConceptDiagram` prop `{ source: string }` (guarded by `c.diagram &&`, so always a string when rendered). `useId()` sanitized to a valid Mermaid render id. The content test iterates the raw `concepts` (from `./index`), where `diagram` is `string | undefined`.
