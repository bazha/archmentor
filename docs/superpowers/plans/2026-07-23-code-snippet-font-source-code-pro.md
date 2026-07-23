# Code Snippets: Switch Font to Source Code Pro — Plan

**Spec:** [2026-07-23-code-snippet-font-source-code-pro-design.md](../specs/2026-07-23-code-snippet-font-source-code-pro-design.md)

Single-task change: swap the code-snippet monospace font from JetBrains Mono to Source Code Pro.

- [x] Add regression test in `components.test.tsx` asserting `CodeBlock` renders with Source Code Pro in its font stack.
- [x] Install `@fontsource/source-code-pro`, remove `@fontsource/jetbrains-mono` from `package.json`.
- [x] Update `src/main.tsx` font imports + comment.
- [x] Update `MONO` constant in `src/components/CodeBlock.tsx`.
- [x] Update `mono` token in `tailwind.config.js`.
- [x] Update comment in `src/styles/index.css`.
- [x] `npm test` and `npx tsc --noEmit` green.

## Self-Review

- Single shared `CodeBlock` component renders all code-snippet usages (concepts, interview, quiz, daily, compare), so the one-file font-stack change covers "all code snippets" per the card's clarification.
- No other component applies the tailwind `font-mono` utility directly; updated the token anyway to keep it from silently drifting from the real code font.
- One-for-one dependency swap (no net-new dependency category), matching the existing self-hosted `@fontsource/*` pattern already used for Onest.
