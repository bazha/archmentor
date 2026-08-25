# Light theme canvas colour → #F0F9F7 — design

**Date:** 2026-08-25
**Status:** design approved, ready for plan

## Card

> change background to F0F9F7 when light theme is [selected]
> (desc empty, no clarifying comments — the request is a single, unambiguous colour swap.)

## Decisions

- `--surface` (the page canvas token, `:root` / light theme only) changes from
  `246 247 250` (#F6F7FA, grey) to `240 249 247` (#F0F9F7, pale mint). Dark theme
  (`.dark`) is untouched.
- `src/styles/background.test.ts` previously asserted the light surface is a *neutral
  grey* (channel spread ≤ 8). That assertion encoded the old grey-canvas design and is
  no longer true by intent — #F0F9F7 has a channel spread of 9. Update the test to
  assert the new intentional constraint instead: the surface is not pure white, and it
  keeps a mint tint (green/blue channels above red) rather than re-asserting greyness.
  The "distinguishable from the raised white card surface" check stays as-is (still
  satisfied: avg(surface) ≈ 245.3 vs avg(raised) = 255).
- `src/styles/contrast.test.ts` WCAG pairs are not touched by name, but must still pass
  since they read `--surface` live from `index.css`. #F0F9F7 is even lighter than
  #F6F7FA, so text-on-surface contrast ratios only improve.
