# Sidebar Brandmark Title

**Goal:** The sidebar logo/wordmark (`src/app/Layout.tsx`) is currently a static `<div>`. Make it a link to `/` (home) with `title="ArchMentor — home"`, and add a regression test asserting the title attribute is present.

**Scope:** `src/app/Layout.tsx` only. No new dependencies, no i18n changes (the title is a fixed brand string, not translated content).

## Plan

- [x] Write a failing test in `src/app/App.test.tsx` asserting an element with `title="ArchMentor — home"` is rendered by `Layout`.
- [x] Wrap the sidebar logo/wordmark block in `Layout.tsx` with a `react-router-dom` `Link` to `/`, carrying the `title` attribute.
- [x] `npm test` and `npx tsc --noEmit` green.
