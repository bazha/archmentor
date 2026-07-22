# Sidebar brandmark → локализованная ссылка на главную — план

См. дизайн: `../specs/2026-07-22-sidebar-home-link-design.md`

## Шаги (TDD)

1. Добавить регрессионный тест в `src/app/App.test.tsx`: рендерим `Layout` не на `/`
   (например `/library`), находим ссылку с `href="/"` и именем `ArchMentor`, проверяем
   её `title` равен `t('common.home')` для активной локали (ru/en, через `CASES`).
2. Убедиться, что тест падает (нет такой ссылки / нет `common.home`).
3. Добавить ключ `common.home` в `ru` и `en` блоки `src/i18n/messages.ts`.
4. В `Layout.tsx` обернуть блок лого+«ArchMentor» в `<Link to="/" title={t('common.home')}>`.
5. `npm test` и `npx tsc --noEmit` — оба зелёные.
