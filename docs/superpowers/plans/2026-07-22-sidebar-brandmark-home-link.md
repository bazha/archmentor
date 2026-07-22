# Sidebar Brandmark: Localized Home Link — Plan

**Spec:** [2026-07-22-sidebar-brandmark-home-link-design.md](../specs/2026-07-22-sidebar-brandmark-home-link-design.md)

Single-task change: turn the sidebar brandmark into a localized home link.

- [x] Add `common.home` key to both `ru` and `en` blocks in `src/i18n/messages.ts`.
- [x] Wrap the brandmark block in `Layout.tsx` in `<Link to="/" title={t('common.home')}>`.
- [x] Add a regression test in `App.test.tsx` asserting `href="/"` and the localized title, per locale.
- [x] `npm test` and `npx tsc --noEmit` green.

## Self-Review

- Key parity: `common.home` added to both `ru` and `en` blocks — `tsc` enforces this via `Record<MessageKey, string>`.
- Test reuses the existing `describe.each(CASES)` RU/EN parametrization, so it runs for both locales without duplicating setup.
- No new dependencies; `Link` is already imported from `react-router-dom` elsewhere in the app.
