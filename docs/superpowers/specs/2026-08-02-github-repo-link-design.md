# GitHub repo link in header — design

**Date:** 2026-08-02
**Status:** design approved, ready for plan

## Goal

Add a link to the project's GitHub repository, shown in the top-right corner of the app
header (next to the language/theme toggles), with the GitHub logo and the repo name.

## Card

> Add label for link to repo in github
> This link should be in the top right corner in the site with github logo and repos name

## Decisions

- Placement: inside the existing `header` top-right cluster in `src/app/Layout.tsx`
  (`ml-auto flex items-center gap-2`), as the first item before the command palette /
  language / theme toggles — same row, same corner the card asks for.
- Content: GitHub mark (new `github` `IconName` in `src/components/Icon.tsx`) + the repo
  name `archmentor` as visible text, matching the pill style already used by
  `LanguageToggle`.
- Target: `https://github.com/bazha/archmentor` (from git remote / README's Pages URL),
  opened in a new tab (`target="_blank" rel="noreferrer"`) since it navigates away from the SPA.
- New component `src/components/GithubLink.tsx`, tested like `ThemeToggle`/`LanguageToggle`.
- No new dependencies; no i18n string needed since "archmentor" and "GitHub" are proper
  nouns — only the accessible label goes through `useT`.
