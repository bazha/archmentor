# GitHub repo link in header — plan

Design: `docs/superpowers/specs/2026-08-02-github-repo-link-design.md`

1. Add a `github` icon path to `src/components/Icon.tsx` (`IconName` union + `PATHS`).
2. Add `common.githubRepo` (aria-label, e.g. "Open GitHub repository") to `src/i18n/messages.ts`
   (`ru` + `en`).
3. Create `src/components/GithubLink.tsx`: an `<a>` styled like the toggle pills, pointing at
   `https://github.com/bazha/archmentor`, showing the `github` icon + "archmentor" text.
4. Test `src/components/GithubLink.test.tsx`: renders a link with the accessible name, correct
   `href`, and `target="_blank"`/`rel="noreferrer"`.
5. Wire `<GithubLink />` into `src/app/Layout.tsx`'s header top-right cluster, before
   `CommandPalette`.
6. `npm test` and `npx tsc --noEmit` green.
