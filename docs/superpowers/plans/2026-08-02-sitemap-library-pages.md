# Sitemap missing library content pages — plan

Design: `docs/superpowers/specs/2026-08-02-sitemap-library-pages-design.md`

1. Write `src/content/sitemap.test.ts` (fails first, since `public/sitemap.xml` only has one
   URL today): asserts the sitemap contains the home URL, the `/library` URL, and a `<loc>`
   for every id in `conceptsCore`, plus an exact `<url>` count.
2. Write `scripts/generate-sitemap.mjs`: extracts concept ids from
   `src/content/core/concepts.ts` via regex, builds the sitemap XML (home + `/library` + one
   entry per concept), writes it to `public/sitemap.xml`.
3. Add `"generate:sitemap": "node scripts/generate-sitemap.mjs"` to `package.json` scripts.
4. Run `npm run generate:sitemap` to regenerate `public/sitemap.xml`; confirm the test from
   step 1 now passes.
5. `npm test` and `npx tsc --noEmit` green.
