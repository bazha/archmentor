# DDD (1/2): category + six tactical building blocks — plan

Design: `docs/superpowers/specs/2026-09-28-ddd-tactical-blocks-design.md`
Card: 6aba2c0f14f1389a8458aa7e

1. Category mechanics: add `'ddd'` to `CategorySchema` (`src/content/schema.ts`),
   `CATEGORY_LABEL` (`src/lib/labels.ts`, ru/en both "DDD"), `CATEGORY_ORDER`
   (`src/domain/graph/layout.ts`, update `layout.test.ts`'s exact-array assertion), the
   `CAT_DOT` maps in `Badge.tsx` and `Map.tsx`, `--cat-ddd` in both `:root`/`.dark` in
   `src/styles/index.css`, and the `cat.ddd` entry in `tailwind.config.js`.
2. Add six concept cores to `src/content/core/concepts.ts`: `entity` (middle), `value-object`
   (middle), `aggregate` (senior), `repository` (middle), `domain-event` (senior),
   `domain-service` (senior) — category `ddd`, `related` per the card's cross-links. Add
   reciprocal `related` entries to `optimistic-locking`, `flyweight`, `transactional-outbox`,
   `saga`, `event-sourcing`, `hexagonal`, `clean-architecture`, `database-per-service`,
   `observer`, `event-driven`, `srp`, `facade`.
3. Add bilingual prose (tagline/definition/problem/solution/code/pros/cons/tradeoffs/
   whenToUse/whenNotToUse) for the six concepts to `src/content/locales/en.ts` and `ru.ts`.
4. Add 18 quiz questions (3 per concept) to `src/content/core/questions.ts` and their
   bilingual prose to both locale files: one `identify-pattern` (Entity vs Value Object) plus
   a `concept`, `tradeoff`, and `code-smell` mix covering anemic domain model, primitive
   obsession, aggregate-boundary violation, repository ORM leakage, mid-transaction event
   publish, and a domain service bypassing entity methods.
5. Update `src/content/course.ts`: slot the six new ids into the `middle`/`senior` `COURSE`
   groups (every concept must appear in `COURSE_ORDER` exactly once, grade must match) and
   fix the "65 concepts" comment.
6. Update `src/content/index.test.ts` (65 → 71, add `byCat('ddd')).toBe(6)`),
   `src/domain/graph/layout.test.ts` (exact `CATEGORY_ORDER` array), and
   `src/features/course/Course.test.tsx` (hardcoded `0/65` → `0/71`).
7. `npm run generate:sitemap` to add the six new `/library/:id` URLs to
   `public/sitemap.xml` (guarded by `src/content/sitemap.test.ts`).
8. `npm test` and `npx tsc --noEmit` green.
