# ArchMentor — Фаза 3: полировка (тема, a11y, edge-состояния, бандл)

**Дата:** 2026-07-05
**Статус:** утверждён дизайн, готов к плану реализации
**Предшествующие фазы:** Фаза 1 (вертикальный срез) и Фаза 2 (контент: 42 концепта, 77 вопросов) завершены на `master`.

## 1. Цель и рамки

Довести приложение до продакшн-качества по четырём независимым слайсам:

1. **Светлая тема + переключатель** (dark/light, сохранение через существующий `settings.theme`).
2. **Доступность** (skip-link, видимый фокус, ARIA, контраст WCAG AA, `prefers-reduced-motion`).
3. **Пустые / edge-состояния** (единый компонент, аудит и добивка по экранам).
4. **Контент-чанк + адаптив** (вынос данных в отдельный бандл, проверка мобильной вёрстки).

Порядок реализации: **1 → 2 → 3 → 4**, каждый слайс с тестами.

### Не входит (YAGNI)
- Третий режим темы «system/auto» (только явные dark/light).
- Отложенная (lazy) загрузка контента — дашборд читает его на старте, поэтому контент остаётся в критическом пути; выносим лишь в отдельный чанк.
- Новая зависимость для a11y-тестов (`jest-axe` и т.п.) — обходимся точечными проверками через Testing Library.
- Дополнительные тиры вторичного текста — единый токен `muted`.

## 2. Исходное состояние (факты из кода)

- Приложение **только тёмное**: палитра `surface`/`accent` захардкожена в `tailwind.config.js`, `body` в `src/styles/index.css` форсит `color-scheme: dark`, `index.html` содержит `<html lang="ru" class="dark">`.
- В сторе уже есть **неиспользуемое** поле `settings.theme: 'dark' | 'light'` (`src/store/useStore.ts`) и включён `darkMode: 'class'` в Tailwind — каркас под переключатель заложен.
- Захардкоженные под тёмную тему классы: `text-slate-400` (23), `text-slate-300` (7), `text-slate-500` (5), `text-white` (4) — ~39 вхождений в 15 файлах. Семантические `surface`/`accent` уже используются корректно.
- Пустые состояния **уже есть**: Learn (пустой фильтр), Review (нечего повторять), Library (ничего не найдено), Quiz (экран «Готово»). Слайс 3 — аудит + добивка, не с нуля.
- Главный бандл после Фазы 2 — 513 kB / 173 kB gzip (контент грузится eager), предупреждение Vite `>500 kB`.

## 3. Слайс 1 — Цветовые токены и светлая тема

**Подход A (утверждён): семантические токены на CSS-переменных.** Единый источник правды, без дублирования `dark:`-вариантов.

### Токены в `src/styles/index.css`
RGB-триплеты (для поддержки `<alpha-value>` в Tailwind), светлая — по умолчанию, тёмная — под `.dark`:

```css
:root {
  --surface: 248 250 252;        /* slate-50  */
  --surface-raised: 255 255 255; /* white     */
  --surface-muted: 226 232 240;  /* slate-200 — границы/разделители */
  --content: 15 23 42;           /* slate-900 — основной текст */
  --muted: 71 85 105;            /* slate-600 — вторичный текст (AA на белом) */
  --accent: 79 70 229;           /* indigo-600 — AA на светлом фоне */
  --accent-soft: 99 102 241;     /* indigo-500 */
  color-scheme: light;
}
.dark {
  --surface: 15 23 42;
  --surface-raised: 30 41 59;
  --surface-muted: 51 65 85;
  --content: 241 245 249;
  --muted: 148 163 184;
  --accent: 99 102 241;
  --accent-soft: 129 140 248;
  color-scheme: dark;
}
body { @apply bg-surface text-content antialiased; }
```

### `tailwind.config.js`
```js
colors: {
  surface: {
    DEFAULT: 'rgb(var(--surface) / <alpha-value>)',
    raised:  'rgb(var(--surface-raised) / <alpha-value>)',
    muted:   'rgb(var(--surface-muted) / <alpha-value>)',
  },
  content: 'rgb(var(--content) / <alpha-value>)',
  muted:   'rgb(var(--muted) / <alpha-value>)',
  accent: {
    DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
    soft:    'rgb(var(--accent-soft) / <alpha-value>)',
  },
},
```

### Миграция классов
- `text-slate-100` → `text-content`
- `text-slate-300 / -400 / -500` → `text-muted`
- `text-white` → `text-content`
- `body` (`text-slate-100`) → `text-content`
- Существующие `bg-surface*`, `border-surface-muted`, `bg-accent*`, `text-accent-soft` остаются — они уже семантические и автоматически «переключаются».

## 4. Слайс 1 (продолжение) — Переключатель и защита от вспышки

- **`src/app/theme.ts`** — `export type Theme = 'dark' | 'light'`; чистая `applyTheme(theme: Theme): void` (тогглит класс `dark` на `document.documentElement`); `readInitialTheme(): Theme` (парсит персист-ключ, дефолт `dark`).
- **Инлайн-скрипт в `<head>` `index.html`** до первой отрисовки: `try { const t = JSON.parse(localStorage.getItem('archmentor:v1'))?.state?.settings?.theme; if (t !== 'light') document.documentElement.classList.add('dark'); } catch {}`. Дефолт — тёмная. Захардкоженный `class="dark"` из `<html>` убирается (класс ставит скрипт).
- **`src/components/ThemeToggle.tsx`** — кнопка (☀/🌙) в шапке Layout; вызывает `setTheme` стора; `aria-label` и `aria-pressed`.
- **Стор**: добавить экшен `setTheme(theme)` в `useStore.ts` (обновляет `settings.theme`; значение уже персистится).
- **Применение в рантайме**: эффект в `Layout` (или подписка на стор) вызывает `applyTheme(settings.theme)` при изменении, синхронизируя класс с состоянием после гидратации.

## 5. Слайс 2 — Доступность

- **Skip-link**: первым элементом в `Layout` — `<a href="#main">К содержимому</a>` со стилем `sr-only focus:not-sr-only` (проявляется при фокусе). `<main id="main" tabIndex={-1}>`.
- **Видимый фокус**: `focus-visible:` ring (Tailwind) на навлинках, кнопках, `<input>` поиска, интерактивной FlipCard. Единый стиль ring цвета `accent`.
- **ARIA**:
  - Тумблер темы — `aria-label` («Переключить тему») + `aria-pressed`.
  - Поиск Library — доступное имя (`aria-label` или связанный `<label>`).
  - FlipCard — семантика кнопки (`<button>` или `role`/`aria-pressed` для перевёрнутого состояния).
  - Навигация — `<nav aria-label="Основная">`; `aria-current` от NavLink остаётся.
  - Варианты квиза — уже `<button>`; убедиться в доступных именах и состоянии выбранного/верного.
- **Контраст WCAG AA (≥4.5:1 для текста)**: палитры §3 подобраны под порог; проверить расчётом пары `content/surface`, `muted/surface`, `muted/surface-raised`, `accent/surface` в обеих темах и скорректировать при недоборе.
- **`prefers-reduced-motion`**: медиа-запрос отключает анимацию переворота FlipCard и цветовые/трансформ-переходы.

## 6. Слайс 3 — Пустые / edge-состояния

- **`src/components/EmptyState.tsx`** — переиспользуемый: эмодзи/иконка, заголовок, подсказка, опциональный CTA (`to` или `onClick`). Использует семантические токены.
- **Аудит и добивка по экранам**:
  - Dashboard — новый пользователь (нет прогресса), нечего повторять сегодня.
  - Progress — ещё нет попыток квиза.
  - Quiz — выбранный фильтр не дал вопросов (до старта сессии).
  - Learn — конец колоды / пустой фильтр.
  - Review, Library — переезд существующих заглушек на общий `EmptyState`.

## 7. Слайс 4 — Контент-чанк и адаптив

- **Чанк**: `build.rollupOptions.output.manualChunks` в `vite.config.ts` — модули с путём, содержащим `/src/content/`, в чанк `content`. Ожидаемый эффект: главный чанк < 500 kB, предупреждение исчезает, контент кэшируется отдельно. Отложенной загрузки нет — контент нужен на старте.
- **Адаптив**: ручная проверка на ширине 375px — навбар (уже `overflow-x-auto`), сетки карточек (`sm:`/`md:` колонки), читаемость ConceptPage, горизонтальный скролл кода (в `CodeBlock` уже есть `overflow-x-auto`). Правки точечные, по факту находок.

## 8. Границы модулей

| Единица | Ответственность | Зависит от |
|---|---|---|
| `src/app/theme.ts` | Тип `Theme`, `applyTheme`, `readInitialTheme` (чистая логика) | DOM (`documentElement`), localStorage |
| `src/components/ThemeToggle.tsx` | UI-кнопка переключения | стор (`setTheme`, `settings.theme`) |
| `src/components/EmptyState.tsx` | Единый вид пустого состояния | — |
| `src/styles/index.css` + `tailwind.config.js` | Определение и маппинг токенов | — |
| `index.html` (инлайн-скрипт) | Применение темы до отрисовки | localStorage |

## 9. Тестирование

- **`theme.ts`**: `applyTheme('dark')`/`('light')` ставит/снимает класс `dark` на `documentElement` (jsdom); `readInitialTheme` — дефолт и парсинг персиста.
- **ThemeToggle**: клик меняет тему в сторе и применяет класс.
- **a11y**: skip-link присутствует и фокусируется; у тумблера есть доступное имя (`aria-label`); у поиска Library есть доступное имя.
- **EmptyState**: рендер компонента; по render-тесту на каждую новую заглушку экрана.
- **Сборка (ручная проверка)**: предупреждение `>500 kB` исчезло, главный чанк < 500 kB, появился чанк `content`.
- Регрессия: весь существующий набор тестов (57) остаётся зелёным.

## 10. Критерии готовности

- Переключение dark/light работает, сохраняется между перезагрузками, без вспышки не той темы при старте.
- Контраст текста в обеих темах ≥ WCAG AA (4.5:1).
- Клавиатурная навигация: skip-link, видимый фокус на всех интерактивных элементах, тумблер и поиск с доступными именами.
- Единообразные пустые состояния на всех перечисленных экранах.
- `npm run build` без предупреждения о размере чанка; `tsc --noEmit` чист; все тесты зелёные.
