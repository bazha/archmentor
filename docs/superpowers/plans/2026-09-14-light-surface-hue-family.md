# Light theme: bring panels into the canvas hue family — plan

Design: `docs/superpowers/specs/2026-09-14-light-surface-hue-family-design.md`

1. Add a guard to `src/styles/background.test.ts`: `--surface-muted`,
   `--surface-code` and `--line` must share the canvas's mint hue family (green
   and blue channels above red, same test as the existing `--surface`
   assertion), and `--surface-muted` must be darker (lower average channel
   value) than `--surface`. Run it first to confirm it fails against the
   current blue-grey values.
2. In `src/styles/index.css`, in `:root` only, update:
   - `--surface-muted` `244 245 249` → `230 240 237` (#E6F0ED)
   - `--surface-code` `246 247 250` → `235 243 240` (#EBF3F0)
   - `--line` `233 234 240` → `220 231 228` (#DCE7E4)
   - `--line-strong` `219 221 230` → `200 216 211` (#C8D8D3)

   Leave `.dark` and every other token untouched.
3. `npm test` and `npx tsc --noEmit` green.
