# Grey Background with Dots (n8n-style Canvas) — Plan

**Spec:** [2026-07-24-n8n-grey-dot-canvas-design.md](../specs/2026-07-24-n8n-grey-dot-canvas-design.md)

Single-task change: make the existing n8n-style dot-grid canvas actually read as grey (light mode) instead of near-white.

- [x] Add `src/styles/background.test.ts` asserting light `--surface` is a true grey, darker than `--surface-raised`, and the `body` rule still paints a `--dot` radial-gradient.
- [x] Update `--surface` (light theme) in `src/styles/index.css` from `252 252 253` to `246 247 250`.
- [x] Bump dot-grid alpha in the shared `body` rule from `0.05` to `0.07`.
- [x] Update the top-of-file theme comment.
- [x] Re-check `src/styles/contrast.test.ts` WCAG AA pairs against the new `--surface` value.
- [x] `npm test` and `npx tsc --noEmit` green.
- [x] Visual check: headless-Chromium screenshot of the dev server in light and dark mode.

## Self-Review

- Only `--surface` (the page canvas) moved; `--surface-raised` (white floating cards) is untouched, so the "grey canvas, white cards" contrast n8n uses is now visible instead of both being near-identical whites.
- Dark mode is already a distinct navy-black canvas with its own dot grid — card doesn't ask for dark-mode changes, left as-is.
- Contrast ratios were computed with a standalone script before editing (worst case `faint`/`surface` at 4.85:1) and re-verified green via the existing `contrast.test.ts` suite after the change — no accessibility regression.
- Screenshot confirms the visual intent: light mode now shows a clearly visible grey dot-grid canvas behind white cards, matching n8n's editor-canvas look; dark mode is visually unchanged.
