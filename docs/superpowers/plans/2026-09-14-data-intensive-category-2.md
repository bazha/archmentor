# Data-intensive (2/2): six applied data techniques — plan

Card: 6aa7ff58ad796465e2cfa913. Depends on card 1/2 (landed: `CategorySchema`,
`CATEGORY_LABEL`, `CATEGORY_ORDER`, `CAT_DOT`, `--cat-data` all already exist), so no
category-mechanics work here — only content.

1. Add six concept cores to `src/content/core/concepts.ts`: `idempotency` (middle),
   `transactional-outbox` (senior), `delivery-semantics` (senior), `optimistic-locking`
   (middle), `backpressure` (senior), `change-data-capture` (senior) — category `data`,
   `related` per the card's suggested cross-links. Add reciprocal `related` entries to
   `circuit-breaker`, `saga`, `bulkhead`, `event-driven`, `event-sourcing`, `cqrs`,
   `consistency-models`, `replication`.
2. Add bilingual prose (tagline/definition/problem/solution/code/pros/cons/tradeoffs/
   whenToUse/whenNotToUse) for the six concepts to `src/content/locales/en.ts` and `ru.ts`.
3. Add 18 quiz questions (3 per concept: concept, tradeoff, concept-with-code) to
   `src/content/core/questions.ts` and their bilingual prose to both locale files.
4. Update `src/content/course.ts`: slot the six new ids into the `middle`/`senior` `COURSE`
   groups (every concept must appear in `COURSE_ORDER` exactly once, grade must match) and
   fix the "59 concepts" comment.
5. Update `src/content/index.test.ts` (59 → 65, `byCat('data')` 6 → 12) and
   `src/features/course/Course.test.tsx` (hardcoded `0/59` → `0/65`).
6. `npm run generate:sitemap` to add the six new `/library/:id` URLs to
   `public/sitemap.xml` (guarded by `src/content/sitemap.test.ts`).
7. `npm test` and `npx tsc --noEmit` green.
