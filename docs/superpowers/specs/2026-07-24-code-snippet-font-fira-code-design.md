# Code Snippets: Switch Font to Fira Code

**Card:** 6a63cedb3b1e2e98c1a137a7

**Goal:** A prior card (6a622a5cc743dfbcc63b5a47) already investigated code-snippet fonts and switched `CodeBlock`'s monospace font from JetBrains Mono to Source Code Pro. This card reopens that decision; per card clarification, the answer is "Use Fira Code." Cyrillic glyph coverage remains a hard requirement (the `ru` locale's code comments contain Cyrillic text) — `@fontsource/fira-code`'s per-weight CSS ships a `cyrillic` + `cyrillic-ext` subset alongside `latin`, same as the outgoing Source Code Pro package, so no fallback risk from the swap.

**Changes (one-for-one font package swap, same pattern as the prior font change):**
- `package.json`: replace `@fontsource/source-code-pro` with `@fontsource/fira-code`.
- `src/main.tsx`: import `@fontsource/fira-code/400.css` and `/700.css` instead of the Source Code Pro weights; update the comment.
- `src/components/CodeBlock.tsx`: update the `MONO` font stack constant from `'Source Code Pro', ...` to `'Fira Code', ...`.
- `tailwind.config.js`: update the `mono` font family token from `'Source Code Pro'` to `'Fira Code'`.
- `src/styles/index.css`: update the top-of-file comment referencing Source Code Pro.
- `src/components/components.test.tsx`: update the existing font-family assertion in the `CodeBlock` test from Source Code Pro to Fira Code.

**Out of scope:** no other typography changes (Onest/UI font untouched), no changes to syntax-highlight color themes or ligature rendering, no new dependencies beyond the one-for-one font package swap.
