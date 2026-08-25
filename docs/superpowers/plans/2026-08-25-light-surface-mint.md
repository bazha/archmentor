# Light theme canvas colour → #F0F9F7 — plan

Design: `docs/superpowers/specs/2026-08-25-light-surface-mint-design.md`

1. Update `src/styles/background.test.ts`: replace the "channels stay close together"
   (grey, untinted) assertion with an assertion matching the new intentional mint tint
   (green/blue channels above red, still not pure white, still distinguishable from
   the raised card surface). Run it first to confirm it fails against the current
   `--surface` value.
2. In `src/styles/index.css`, change `:root { --surface: ... }` from `246 247 250` to
   `240 249 247` (#F0F9F7). Leave `.dark` untouched.
3. `npm test` and `npx tsc --noEmit` green.
