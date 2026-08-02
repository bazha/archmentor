# Sitemap missing library content pages — design

**Date:** 2026-08-02
**Status:** design approved, ready for plan

## Goal

`public/sitemap.xml` currently lists a single URL — the SPA root. The app is a client-routed
SPA whose actual indexable content lives one level down, at `/library` (a browsable concept
index) and `/library/:conceptId` (one page per architecture concept — 53 of them). None of
those pages are discoverable from the sitemap, which is the kind of gap Search Console flags
as a coverage/indexing problem for a site that otherwise looks like it has one page.

## Card

> Fix search console in google
> (desc is a Search Console screenshot attachment; not retrievable by this automation — no
> Trello auth). Clarifying answer received: `https://bazha.github.io/archmentor/sitemap.xml`,
> pointing at the sitemap as the thing to fix.

## Decisions

- Keep the sitemap in sync with content mechanically, not by hand: `scripts/generate-sitemap.mjs`
  reads concept ids straight out of `src/content/core/concepts.ts` (via regex over the raw
  source, no TS execution needed) and (re)writes `public/sitemap.xml` with one `<url>` per
  concept, plus the home page and the `/library` index.
- `npm run generate:sitemap` runs it; the generated file is committed like the existing
  `sitemap.xml` (not built on every `vite build`, since content changes are infrequent and
  reviewable diffs are preferable to build-time nondeterminism).
- Priorities: home `1.0`, `/library` `0.9`, each concept page `0.7`. `changefreq: monthly`
  throughout — the content (architecture concepts) is stable reference material.
- `src/content/sitemap.test.ts` guards against drift: it reads the committed
  `public/sitemap.xml` and asserts every id in `conceptsCore` has a matching `<loc>`, so a
  concept added without regenerating the sitemap fails the test suite instead of silently
  falling out of Search Console's index.
- Scope stays to the sitemap: the interactive/personalized routes (`learn`, `quiz`, `review`,
  `interview`, `daily`, `progress`) are app tools, not standalone indexable content, so they're
  left out.
