# DDD (2/2): six strategic design concepts — plan

Design: `docs/superpowers/specs/2026-09-28-ddd-strategic-design-design.md`
Card: 6aba2c106a97db25d84bcf87

1. Add six concept cores to `src/content/core/concepts.ts`: `ubiquitous-language`
   (middle), `bounded-context` (senior), `subdomains` (lead), `context-mapping` (lead),
   `shared-kernel` (senior), `event-storming` (senior) — category `ddd`, `related` per the
   design's cross-links. Add reciprocal `related` entries to `entity`, `aggregate`,
   `dry-vs-duplication`, `microservices`, `database-per-service`, `monolith`,
   `coupling-cohesion`, `yagni-vs-flexibility`, `hexagonal`, `anti-corruption-layer`,
   `api-gateway`, `value-object`, `domain-event`, `event-driven`, `cqrs`.
2. Add bilingual prose (tagline/definition/problem/solution/code/pros/cons/tradeoffs/
   whenToUse/whenNotToUse) for the six concepts to `src/content/locales/en.ts` and `ru.ts`.
3. Add 18 quiz questions (3 per concept) to `src/content/core/questions.ts` and their
   bilingual prose to both locale files.
4. Update `src/content/course.ts`: slot the six new ids into `middle`/`senior`/`lead`
   `COURSE` groups and fix the "71 concepts" comment → 77.
5. Update `src/content/index.test.ts` (71 → 77, `byCat('ddd')` 6 → 12) and
   `src/features/course/Course.test.tsx` (`0/71` → `0/77`).
6. `npm run generate:sitemap` to add the six new `/library/:id` URLs to
   `public/sitemap.xml` (guarded by `src/content/sitemap.test.ts`).
7. Update `README.md`: recount concepts/questions from source and rewrite the Content
   paragraph to list every category; add "domain-driven design" and "data-intensive
   systems" to the opening topic list; refresh the Status test count.
8. `npm test` and `npx tsc --noEmit` green.
