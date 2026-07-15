# ArchMentor

A client-side SPA for learning software architecture — from Junior to Lead: **SOLID**, the **23 GoF design patterns**, **architectural styles**, and cross-cutting **trade-offs**. Flashcards, spaced repetition (SM-2), quizzes, an adaptive mock interview, side-by-side pattern comparison, a daily challenge, a hands-on system-design diagram builder, and an interactive concept map.

**Live:** https://bazha.github.io/archmentor/

> Fully bilingual — the UI and explanations switch between **Russian and English**; pattern names and core terms stay in English (industry standard). Light/dark themes and a `⌘K` command palette throughout.

## Features

- **Dashboard** — the Junior → Middle → Senior → Lead trajectory: per-grade progress, day streak, due-for-review count, and best interview grade.
- **Course** — a single linear guided path through the catalog, grouped by grade, with per-step status (mastered / in-progress / not-started).
- **Learn** — flashcards (term ↔ definition + "when to use") with a grade filter and a "show code" toggle that reveals the concept's code example on the answer side.
- **Review** — a spaced-repetition queue powered by the **SM-2** algorithm (Again / Hard / Good / Easy).
- **Quiz** — modes: Mix / Identify-the-pattern / Theory / Trade-offs / Fill-the-blank. The identify mode shows idiomatic code and asks you to pick the pattern; distractors are commonly-confused neighbours (Strategy↔State, Factory Method↔Abstract Factory, …), with an explanation after each answer.
- **Interview** — an adaptive mock technical interview: difficulty climbs from junior as you answer correctly and stops once it finds your ceiling. Feedback is held until the end, which delivers a grade verdict, a per-level breakdown, and weak topics linking back into Learn.
- **Daily** — one deterministic question per day (date-seeded) with its own day-streak.
- **Diagram Builder** — assemble a system-design diagram for a scenario (add components from a palette, connect them), submit, and get a per-constraint ✓ / ⚠ / ✗ report plus a reference solution. Grading is constraint-based, not exact-match, so any correct architecture passes. 8 scenarios span four difficulty grades; a fully keyboard-accessible list builder is the core, with an optional React Flow canvas where you drag components from the palette, move and connect nodes, delete them (× button or Delete key), and annotate with sticky notes. After submitting, each report line carries a short "why it matters" explanation for the key decisions, and a visual diff shows your diagram beside the sample solution with matches / extra / missing highlighted.
- **Map** — an interactive graph of all concepts wired by their `related` links, laid out in category clusters (React Flow). Click a concept to highlight its neighbours and open a panel linking into Learn and Library.
- **Compare** — two concepts side by side, field by field (definition, problem, solution, pros/cons, trade-offs, when to use, code). Pick any pair or start from a "commonly confused" preset; shareable via `/compare/:a/:b`.
- **Library** — a searchable, filterable catalog; each concept page shows definition, problem, solution, code, pros/cons, trade-offs, when (not) to use, and related concepts.
- **Progress** — quiz accuracy, mastered concepts, streak, best interview grade, and per-grade mastery. All progress persists in `localStorage`.

## Content

**42 concepts** (5 SOLID + all 23 GoF patterns + 8 architectural styles + 6 cross-cutting trade-offs) and **~119 questions** (77 multiple-choice + 42 fill-in-the-blank), plus **8 system-design scenarios** for the Diagram Builder across four difficulty grades. Content is generated via a multi-agent workflow with adversarial verification (checked against the GoF / Fowler / Martin canon, single defensible answer per quiz question) and validated with zod at import time; each diagram scenario's reference solution is tested to pass its own constraints.

## Stack

Vite · React 18 · TypeScript (strict) · React Router · Zustand (+persist) · Tailwind CSS · Vitest + Testing Library · zod · React Flow (`@xyflow/react`, lazy-loaded for the diagram canvas).

Layered architecture: `content` (typed, localized data + zod validation) → `domain` (pure logic: SM-2, quiz selection, guided course, interview state machine, compare pairs, diagram constraint validation, concept-graph edges + layout) → `store` (Zustand + persist, versioned migrations) → `features` / `components` (React UI). In-house i18n (`src/i18n`) with type-enforced RU/EN key parity.

## Development

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit and component tests (Vitest)
npm run typecheck  # tsc --noEmit
npm run build      # production build (tsc --noEmit + vite build)
```

Pushing to `master` deploys to GitHub Pages via GitHub Actions (`.github/workflows/deploy.yml`).

## Status

Feature-complete and deployed. Eleven sidebar modes plus a daily challenge, fully bilingual (RU/EN) with light/dark themes, WCAG AA-guarded accessibility (skip link, visible focus rings, ARIA, `prefers-reduced-motion`, a contrast test), and 198 passing tests.

Design and implementation docs live in `docs/superpowers/specs/` and `docs/superpowers/plans/`.
