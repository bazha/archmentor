# Sidebar brandmark: localized home link — spec

**Дата:** 2026-07-22
**Карточка:** 6a60bb219f00d5d8953a3c77

## Цель

Sidebar-брендмарк (логотип + надпись "ArchMentor") в `src/app/Layout.tsx` сейчас — просто
`<div>`, без навигации. Сделать его ссылкой на главную (`/`) с локализованным `title`-тултипом.

## Изменения

- `src/i18n/messages.ts`: новый ключ `common.home` в блоках `ru` и `en`
  (`ru`: "ArchMentor — на главную", `en`: "ArchMentor — home"). Паритет ключей проверяется
  типами (`en` типизирован как `Record<MessageKey, string>`), отдельный тест не нужен.
- `src/app/Layout.tsx`: обернуть блок брендмарка (`<svg>` + `<span>ArchMentor</span>`) в
  `<Link to="/" title={t('common.home')}>` из `react-router-dom`, сохранив текущие классы
  на самом `Link`.
- `src/app/App.test.tsx`: новый тест в существующем `describe.each(CASES)`, проверяющий, что
  ссылка брендмарка имеет `href="/"` и `title === translate(lang, 'common.home')`.

## Вне рамок

Визуальный дизайн, hover-состояния, аналитика кликов — не трогаем.
