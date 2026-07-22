# Sidebar Brandmark: Localized Home Link

**Card:** 6a60bb219f00d5d8953a3c77

**Goal:** The sidebar brandmark (logo + "ArchMentor" wordmark) in `src/app/Layout.tsx` is currently static markup. Make it a `react-router-dom` `<Link to="/">` with a localized `title` tooltip, so it acts as a home-navigation affordance.

**Changes:**
- `src/i18n/messages.ts`: add `common.home` to both the `ru` (`"ArchMentor — на главную"`) and `en` (`"ArchMentor — home"`) blocks. `MessageKey = keyof typeof ru` and `en` is typed `Record<MessageKey, string>`, so a missing key in either block is a `tsc` error — this enforces parity at compile time.
- `src/app/Layout.tsx`: wrap the logo `<svg>` + wordmark `<span>` in a `<Link to="/" title={t('common.home')}>` (replacing the plain `<div>` wrapper), preserving existing layout classes and adding focus-visible styling consistent with the nav links below it.
- `src/app/App.test.tsx`: add a regression test asserting the brandmark link has `href="/"` and the localized title, for both locales (the suite already parametrizes RU/EN via `describe.each`).

**Out of scope:** no visual redesign of the logo, no changes to other nav items, no new dependencies.
