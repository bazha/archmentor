# Light theme: bring panels into the canvas hue family — design

## Problem

The light theme's canvas (`--surface`) is pale mint `#F0F9F7` (hue ~167°), but the
inset surfaces and borders that sit on it are blue-grey (`--surface-muted`
`#F4F5F9`, `--surface-code` `#F6F7FA`, `--line` `#E9EAF0`, `--line-strong`
`#DBDDE6`, hue ~228°). Simultaneous contrast makes the blue-grey insets read as a
dirty pink against the mint canvas.

Second defect: `--surface-muted` (96.7% lightness) is lighter than `--surface`
(95.9% lightness), so an "inset" surface reads lighter than the background it is
supposed to recess into — the depth order is inverted.

## Fix

Re-tint `--surface-muted`, `--surface-code`, `--line`, `--line-strong` in `:root`
into the same mint hue family as `--surface`, and make `--surface-muted` darker
than `--surface` so the inset order reads correctly:

```
--surface-muted   230 240 237  /* #E6F0ED */
--surface-code    235 243 240  /* #EBF3F0 */
--line            220 231 228  /* #DCE7E4 */
--line-strong     200 216 211  /* #C8D8D3 */
```

`--surface`, `--surface-raised`, `--dot`, `--accent*` and the `--cat-*` tokens are
untouched. `.dark` is untouched.

## Verification

- `content` on the new `--surface-muted` (#E6F0ED) is ~11.2:1 — comfortably AA,
  so the existing `contrast.test.ts` guard keeps passing without touching text
  tokens.
- avg(`--surface-muted`) drops from 245.3 to 235.7, below avg(`--surface`)
  245.3 → the inset is now darker than the canvas it sits in.
- `background.test.ts` gains an assertion that `--surface-muted`, `--surface-code`
  and `--line` share the canvas's green/blue-above-red hue family, and that
  `--surface-muted` is darker (lower average channel value) than `--surface`.
