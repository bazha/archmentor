# Data-intensive category + six systems properties — design

**Date:** 2026-09-14
**Status:** design approved, ready for plan

## Goal

Add a new content category `data` (Data-intensive) and its first six concepts — the systems
properties interviews actually probe: CAP theorem, consistency models, quorum (R+W>N),
partitioning, replication, and consensus. This is card 1/2; card 2/2 (idempotency, outbox,
delivery semantics, optimistic locking, backpressure, CDC) reuses the category mechanics
added here and is out of scope.

## Card

> Data-intensive (1/2): new category + six systems properties
>
> Add category mechanics (schema, labels, layout order, badge/map dot colours, CSS variables,
> Tailwind) plus six bilingual concepts with TypeScript code examples, mermaid diagrams, and
> ~18 quiz questions. Colour is the one neutral hue (`#4A5568` / `#9FB0CC`) since the other
> seven categories already cover the hue wheel.

## Decisions

- Every new concept's `codeExample` shows the code an engineer writes when they hit the
  property (a client that degrades to a stale read, a session-token read-your-writes guard,
  an R+W>N check with read repair, consistent hashing vs. `id % N`, a lag-aware read router,
  a fencing token from a lock service) rather than a fake implementation of the property
  itself — these topics have no natural "reference implementation".
- Cross-links are mandatory and reciprocal: each new concept links to at least one concept
  outside `data` (not just to its five siblings), and the existing concept's `related` gets
  the link added back (`database-per-service` gains `cap-theorem`/`partitioning`/`quorum`,
  `cqrs` gains `consistency-models`/`replication`, `saga` gains `consensus`) so Compare offers
  the pair in both directions.
- `name` fields stay in English/Latin technical terms (`CAP Theorem`, `Quorum`, `Consensus`),
  matching every existing concept — only `tagline`/`definition`/etc. are localized, per
  `src/content/schema.ts` and the existing catalog (no concept has ever used a Cyrillic
  `name`).
- Beyond the six files the card names, two more needed updates to stay consistent with the
  existing invariants: `src/content/course.ts` (the `COURSE` grade groups must cover every
  concept exactly once — new concepts slot into `senior`/`lead`) and
  `public/sitemap.xml` (regenerated via `npm run generate:sitemap`, since
  `src/content/sitemap.test.ts` asserts one `<loc>` per concept id).
