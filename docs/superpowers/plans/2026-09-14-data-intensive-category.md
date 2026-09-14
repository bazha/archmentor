# Data-intensive category + six systems properties — plan

Design: `docs/superpowers/specs/2026-09-14-data-intensive-category-design.md`

1. Category mechanics: add `'data'` to `CategorySchema` (`src/content/schema.ts`),
   `CATEGORY_LABEL` (`src/lib/labels.ts`), `CATEGORY_ORDER` (`src/domain/graph/layout.ts`,
   update `layout.test.ts`'s exact-array assertion), the `CAT_DOT` maps in `Badge.tsx` and
   `Map.tsx`, `--cat-data` in both `:root`/`.dark` in `src/styles/index.css`, and the
   `cat.data` entry in `tailwind.config.js`.
2. Add six concept cores to `src/content/core/concepts.ts`: `cap-theorem`,
   `consistency-models`, `quorum`, `partitioning`, `replication`, `consensus` — category
   `data`, grades per the card, `related` per the suggested cross-links (with `quorum` also
   pointing at `database-per-service` so every new concept has an outside-category link).
   Add reciprocal `related` entries to `database-per-service`, `cqrs`, `saga`.
3. Add bilingual prose (tagline/definition/problem/solution/code/pros/cons/tradeoffs/
   whenToUse/whenNotToUse) for the six concepts to `src/content/locales/en.ts` and `ru.ts`.
4. Add 18 quiz questions (3 per concept: concept, tradeoff, concept-with-code) to
   `src/content/core/questions.ts` and their bilingual prose to both locale files.
5. Update `src/content/course.ts`: slot the six new ids into the `senior`/`lead` `COURSE`
   groups (every concept must appear in `COURSE_ORDER` exactly once) and fix the "53
   concepts" comment.
6. Update `src/content/index.test.ts` (53 → 59, add `byCat('data')).toBe(6)`) and
   `src/features/course/Course.test.tsx` (hardcoded `0/53` → `0/59`).
7. `npm run generate:sitemap` to add the six new `/library/:id` URLs to
   `public/sitemap.xml` (guarded by `src/content/sitemap.test.ts`).
8. `npm test` and `npx tsc --noEmit` green.
