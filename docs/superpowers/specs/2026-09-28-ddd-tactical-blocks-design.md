# DDD category + six tactical building blocks — design

**Date:** 2026-09-28
**Status:** design approved, ready for plan

## Goal

Add a new content category `ddd` (Domain-Driven Design) and its first six concepts — the
tactical building blocks every DDD interview starts from: Entity, Value Object, Aggregate,
Repository, Domain Event, Domain Service. This is card 1/2; card 2/2 (strategic design:
ubiquitous language, bounded context, subdomains, context mapping, shared kernel, event
storming) reuses the category mechanics added here and is out of scope.

## Card

> DDD (1/2): new category + six tactical building blocks

## Decisions

- Category mechanics follow the exact pattern of the two prior new-category cards
  (`microservices`, `data`): `CategorySchema`, `CATEGORY_LABEL`, `CATEGORY_ORDER`, the
  `CAT_DOT` maps in `Badge.tsx`/`Map.tsx`, `--cat-ddd` CSS variables, and the Tailwind
  `cat.ddd` entry.
- Gold (`#8A6D14` light / `#E6C850` dark) is the color — the one hue not yet used by any
  existing category. It only paints the badge/map dot, never text, so the contrast test is
  unaffected.
- `name` stays in English for every concept, matching the existing catalog convention (only
  prose fields are localized).
- Every concept ships a natural TypeScript `codeExample` — these building blocks have a real
  idiomatic implementation, not a toy: `Customer` (identity, no public setters), `Money`
  (immutable value object with value equality), `Order`/`OrderLine` (aggregate boundary and
  invariant), a `Repository` interface + in-memory/SQL implementations, `OrderPlaced` (event
  recorded then published after commit), `TransferService` (domain service moving money
  between two `Account` aggregates, contrasted with an orchestration-only application
  service).
- Cross-links are mandatory and reciprocal, per the card's suggested pairs: `entity` →
  `value-object`/`aggregate`/`optimistic-locking`; `value-object` →
  `entity`/`aggregate`/`flyweight`; `aggregate` →
  `entity`/`repository`/`domain-event`/`transactional-outbox`/`saga`/`optimistic-locking`/
  `event-sourcing`; `repository` →
  `aggregate`/`hexagonal`/`clean-architecture`/`database-per-service`; `domain-event` →
  `aggregate`/`observer`/`event-driven`/`event-sourcing`/`transactional-outbox`;
  `domain-service` → `aggregate`/`srp`/`facade`/`hexagonal`. The reciprocal link is added back
  on each existing concept (`optimistic-locking`, `flyweight`, `transactional-outbox`, `saga`,
  `event-sourcing`, `hexagonal`, `clean-architecture`, `database-per-service`, `observer`,
  `event-driven`, `srp`, `facade`) so Compare offers the pair in both directions. `aggregate`
  does **not** link to the existing microservices concept `aggregator` — unrelated despite the
  name.
- 18 quiz questions (3 per concept), using the code-based types where natural: one
  `identify-pattern` (Entity vs. Value Object, the classic distinction) and six `code-smell`
  questions (anemic `Customer` with public setters, primitive obsession fixed by `Money`, a
  service reaching into another aggregate's internals, a repository leaking ORM types, an
  event published mid-transaction instead of after commit, a domain service bypassing an
  `Account`'s own methods) — `code-smell` is the thinnest question type in the catalog.
- `src/content/course.ts`: the six ids slot into `middle` (`entity`, `value-object`,
  `repository`) and `senior` (`aggregate`, `domain-event`, `domain-service`) `COURSE` groups;
  fix the concept-count comment.
- `public/sitemap.xml` regenerated via `npm run generate:sitemap` (guarded by
  `src/content/sitemap.test.ts`).

## Out of scope

Card 2/2 (strategic design). Also out: a separate "application service" concept (covered
inside `domain-service`'s prose/code contrast), the Specification pattern, DDD factories (GoF
Factory Method / Abstract Factory already cover them), Modules.
