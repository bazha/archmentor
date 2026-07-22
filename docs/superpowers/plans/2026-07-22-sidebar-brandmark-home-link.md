# Sidebar brandmark: localized home link — план

Спека: `../specs/2026-07-22-sidebar-brandmark-home-link-design.md`

## Шаги (TDD)

1. Добавить ключ `common.home` в `ru` и `en` в `src/i18n/messages.ts`.
2. В `src/app/Layout.tsx` заменить `<div>` брендмарка на `<Link to="/" title={t('common.home')}>`.
3. Добавить регрессионный тест в `src/app/App.test.tsx`: href="/" и локализованный title
   для активной локали (RU/EN через существующий `describe.each(CASES)`).
4. `npm test` и `npx tsc --noEmit` — зелёные.
