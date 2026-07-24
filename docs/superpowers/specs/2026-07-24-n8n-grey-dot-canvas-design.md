# Grey Background with Dots (n8n-style Canvas)

**Card:** 6a634a2e8e71925229e6e040

**Goal:** Card asks for "a gray background with dots such as n8n.io." `src/styles/index.css` already has an n8n-inspired dot-grid background (comment: "faint node-editor dot grid as signature"), but in light mode the page canvas (`--surface`, #FCFCFD) is only 3 RGB units off pure white — visually indistinguishable from the white "raised" card surface (`--surface-raised`, #FFFFFF) it sits behind, and the dots (0.05 alpha) are barely visible. The result reads as "white with a hint of texture," not "grey canvas with dots" like n8n's editor.

**Changes:**
- `src/styles/index.css` (`:root`): change `--surface` from `252 252 253` to `246 247 250` — a distinguishable light grey canvas, clearly darker than the white `--surface-raised` cards floating on it, matching n8n's editor-canvas look. `--surface-raised`, `--surface-muted`, and all other tokens are unchanged.
- `src/styles/index.css` (`body`): bump the dot-grid alpha in the `radial-gradient` from `0.05` to `0.07` so the dots stay visible against the now-slightly-darker canvas (both themes share this rule; dark mode's navy canvas/dot colors are untouched).
- Update the top-of-file theme comment (`:root = light (near-white)` → `:root = light (grey canvas)`).
- `src/styles/background.test.ts` (new): regression test asserting light-mode `--surface` is a true grey (not equal to `255 255 255`, channels within 8 of each other) and visibly darker than `--surface-raised`, plus asserting the `body` rule still paints a dot-grid `radial-gradient` referencing `--dot`.

**Verified:**
- `src/styles/contrast.test.ts`'s existing WCAG AA pairs (`content`/`muted`/`faint`/`accent-soft`/`good`/`bad`/`info` against `surface`) all still clear 4.5:1 with the new `--surface` value (lowest margin: `faint` at 4.85:1, was 5.06:1) — pre-checked with a standalone contrast-ratio script before editing.
- Visual check via a headless Chromium screenshot of the running dev server (light + dark) confirms a clearly visible grey dot-grid canvas behind white cards in light mode, and an unchanged navy dot-grid canvas in dark mode.

**Out of scope:** no changes to dark-mode tokens, no changes to dot spacing/size (24px grid, 1.1px dot), no changes to any component beyond the shared theme tokens/body rule.
