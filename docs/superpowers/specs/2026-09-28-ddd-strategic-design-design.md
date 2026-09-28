# DDD strategic design (2/2) — six concepts — design

**Date:** 2026-09-28
**Status:** design approved, ready for plan

## Goal

Add the second half of the `ddd` category: strategic design — Ubiquitous Language,
Bounded Context, Subdomains, Context Mapping, Shared Kernel, Event Storming. Card 1/2
(category mechanics + the six tactical concepts: entity, value-object, aggregate,
repository, domain-event, domain-service) has already landed, so no category plumbing is
needed here — only new concepts, questions, and the usual bookkeeping (course, sitemap,
README, test counts).

## Card

> DDD (2/2): six strategic design concepts

## Decisions

- `name` stays in English; only prose is localized, matching the existing convention.
- Strategic topics have no single reference implementation, so each `codeExample` shows
  the code written *after* the design decision is made — a refactor, a boundary made
  concrete as a module/type split, a small shared package — not a fake implementation of
  the idea itself. Grade: `ubiquitous-language` middle, `shared-kernel` / `event-storming`
  senior, `bounded-context` senior, `subdomains` / `context-mapping` lead.
- Cross-links, made mutual on both sides (required for `selectConfusablePairs` in
  `src/domain/compare/pairs.ts`, which only pairs concepts that reference each other):
  - `ubiquitous-language` ↔ `bounded-context`, `entity`, `aggregate`, `dry-vs-duplication`
  - `bounded-context` ↔ `ubiquitous-language`, `context-mapping`, `subdomains`,
    `event-storming`, `microservices`, `database-per-service`, `monolith`,
    `coupling-cohesion`
  - `subdomains` ↔ `bounded-context`, `context-mapping`, `yagni-vs-flexibility`, `hexagonal`
  - `context-mapping` ↔ `bounded-context`, `subdomains`, `shared-kernel`,
    `anti-corruption-layer`, `api-gateway`, `microservices`
  - `shared-kernel` ↔ `context-mapping`, `anti-corruption-layer`, `value-object`,
    `dry-vs-duplication`, `coupling-cohesion`
  - `event-storming` ↔ `domain-event`, `aggregate`, `bounded-context`, `event-driven`,
    `cqrs`
  - Reciprocal entries added to the existing concepts listed above. `anti-corruption-layer`
    is reused as-is (already in `microservices`), not duplicated.
- 18 quiz questions (3 per concept): a `tradeoff` mix fits this topic best (shared kernel
  vs. ACL, conformist vs. translator, build vs. buy for generic subdomains), plus `concept`
  and `code-smell` questions (a bloated all-purpose `Customer` class as the anemic
  "one true model" anti-pattern, a conformist client hard-coding the upstream's DTO shape).
- `src/content/course.ts`: `ubiquitous-language` → middle group; `bounded-context`,
  `shared-kernel`, `event-storming` → senior group; `subdomains`, `context-mapping` → lead
  group. Fix the "77 concepts" comment (71 → 77).
- README: recount from source (`concepts.length`, `questionsCore.length` by type) rather
  than incrementing the stale "53 concepts" paragraph by hand, since it was already stale
  before this card; add "domain-driven design" and "data-intensive systems" to the opening
  topic list; refresh the Status test count from the actual `npm test` output.

## Out of scope

Card 1/2 (already landed). Also out: a separate "modular monolith" concept (folded into
`bounded-context`'s prose), the Specification pattern, team-topology / Conway's-law
material, a diagram-builder scenario for DDD.
