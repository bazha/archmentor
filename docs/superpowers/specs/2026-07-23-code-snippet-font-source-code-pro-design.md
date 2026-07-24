# Code Snippets: Switch Font to Source Code Pro

**Card:** 6a622a5cc743dfbcc63b5a47

**Goal:** Code snippets (the shared `CodeBlock` component, used for concept code examples, interview/quiz/daily/compare snippets) currently render in JetBrains Mono. Switch the monospace font used for code to Source Code Pro, per card clarification: "Use the Source Code Pro for all code snippets, where code as an example in concepts."

**Changes:**
- `package.json`: replace `@fontsource/jetbrains-mono` with `@fontsource/source-code-pro` (self-hosted, same pattern as the existing Onest/JetBrains Mono imports).
- `src/main.tsx`: import `@fontsource/source-code-pro/400.css` and `/700.css` instead of the JetBrains Mono weights; update the comment.
- `src/components/CodeBlock.tsx`: update the `MONO` font stack constant from `'JetBrains Mono', ...` to `'Source Code Pro', ...`.
- `tailwind.config.js`: update the `mono` font family token from `'JetBrains Mono'` to `'Source Code Pro'` for consistency (same code-font concept, kept in sync even though no component currently applies the `font-mono` utility class directly).
- `src/styles/index.css`: update the top-of-file comment referencing JetBrains Mono.
- `src/components/components.test.tsx`: extend the existing `CodeBlock renders the code text` test to also assert the rendered code font-family is Source Code Pro (regression coverage for the swap).

**Out of scope:** no other typography changes (Onest/UI font untouched), no changes to syntax-highlight color themes, no new dependencies beyond the one-for-one font package swap.
