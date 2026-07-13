# ArchMentor — Задача дня (Daily Challenge)

**Дата:** 2026-07-13
**Статус:** утверждён дизайн, готов к плану реализации
**Контекст:** приложение feature-complete, билингв RU/EN, 9 режимов на master и в проде. Есть банк из ~119 вопросов (`useQuestions()` → `QuestionView`, локализован), UI ответа на вопрос отработан в `src/features/quiz/Quiz.tsx` (варианты + разбор). Стор Zustand+persist (ключ `archmentor`, **version: 2**) с консекутив-стрик-логикой (`bumpStreak` + `daysBetween` из `src/lib/date.ts`). Прогресс концептов — `conceptProgress` (только флаг `seen`); ответы квиза — `quizResults`. Дата дня — `todayISO()`.

## 1. Цель и рамки

Новая механика удержания — **один детерминированный по дате вопрос в день** с отдельным «дневным стриком». Карточка-статус на Dashboard ведёт на маленький экран `/daily`. Цель — дать повод заходить каждый день. Переиспользует банк вопросов и вёрстку ответа из Quiz; без изменений схемы/контента.

### Не входит (YAGNI)
- Набор из нескольких вопросов в день — только один.
- Трекинг истории использованных вопросов / защита от повторов (за год повторы редки на ~119 вопросах).
- Отдельный пункт сайдбара, иконка режима — вход только через карточку Dashboard и ⌘K.
- Запись результата задачи дня в `quizResults` (чтобы не мешать статистике точности квиза).
- Пуш-уведомления/напоминания, календарь-хитмап.

## 2. Поведение / UX

### Выбор вопроса (детерминизм)
Чистый хелпер `selectDailyQuestion(questions, dateISO)`: стабильный строковый хеш ISO-даты (`YYYY-MM-DD`) → индекс в массиве вопросов. Один и тот же вопрос весь день, меняется на следующий календарный день (локальная дата через `todayISO()`). **Без `Math.random`.** Пустой банк → возвращает `undefined` (компонент показывает пустое состояние).

### Экран `/daily`
- **Не решено сегодня** (`!isDailyDone`): показываем вопрос дня + варианты (вёрстка/токены как в Quiz — буквенные ключи A–D, `CodeBlock` при наличии `code`). По клику: мгновенный фидбек (верно/неверно + `explanation`), вызывается `completeDaily(...)`, экран переходит в состояние «решено».
- **Решено сегодня** (`isDailyDone`): показываем тот же (детерминированный) вопрос с уже раскрытым ответом — выбранный вариант (`daily.lastSelectedIndex`) и верный подсвечены, разбор виден; подпись «Возвращайтесь завтра» + текущий дневной стрик. Повторно отвечать нельзя.
- Ответ на вопрос дня — единоразовое действие в день; повторный `completeDaily` в тот же день недопустим (гейт по `isDailyDone` в обработчике).

### Dashboard-карточка «Задача дня»
- Дневной стрик 🔥 + статус: не решено → CTA «Решить задачу дня →»; решено → «Решено ✓».
- Ссылка (`<Link to="/daily">`) на экран. Встраивается в существующую секцию статов Dashboard.

## 3. Стрик и данные

**Правило стрика: за факт прохождения (любой ответ), не за правильность** — как текущий activity-стрик; ошибка не наказывается.

Новый persist-слайс:
```ts
interface DailyState {
  streak: number;
  longest: number;
  lastCompletedDate: string | null; // ISO; "решено сегодня" = === todayISO()
  lastSelectedIndex: number | null;  // выбранный вариант последнего решённого дня (для раскрытого вида)
}
```
Дефолт: `{ streak: 0, longest: 0, lastCompletedDate: null, lastSelectedIndex: null }`.

Действие `completeDaily(selectedIndex: number, today: string)`:
- no-op, если `lastCompletedDate === today` (уже решено);
- бампит **дневной** стрик консекутив-логикой (тот же паттерн, что `bumpStreak`/`daysBetween`: соседний день → +1, разрыв → 1; `longest = max`), ставит `lastCompletedDate = today`, `lastSelectedIndex = selectedIndex`;
- бампит **глобальный** activity-стрик (`streak`) — задача дня это активность (как `recordQuiz`);
- в `quizResults` НЕ пишет.

Селектор `isDailyDone(state, today): boolean` = `state.daily.lastCompletedDate === today`.

**Миграция persist v2→v3** (по образцу interview v1→v2): `version: 3`; `migrate` принимает v1/v2/v3 как есть (не сбрасывает прогресс), `merge` бэкфиллит дефолтный `daily`. Обновить `initialData`, `partialize`, `PersistedState`, `AppState`, `resetProgress` (через `initialData`).

## 4. Границы модулей / структура

| Единица | Ответственность |
|---|---|
| `src/domain/daily/selection.ts` | чистый `selectDailyQuestion<T>(questions: T[], dateISO: string): T \| undefined` (стабильный хеш даты → индекс). Без React/стора. |
| `src/domain/daily/selection.test.ts` | стабильность в течение дня, смена на следующий день, детерминизм, пустой банк → undefined. |
| `src/store/useStore.ts` | слайс `daily` + `completeDaily` + `isDailyDone`; version 2→3 + migrate/merge/partialize/initialData. |
| `src/store/useStore.test.ts` | `completeDaily` бампит оба стрика + пишет `lastSelectedIndex`; no-op при повторе в тот же день; консекутив/разрыв; `isDailyDone`; миграция v2→v3 сохраняет прогресс и бэкфиллит `daily`. |
| `src/features/daily/Daily.tsx` | экран: `useQuestions()` + `selectDailyQuestion(todayISO())`; состояния «не решено/решено»; ответ → фидбек → `completeDaily`. |
| `src/features/daily/Daily.test.tsx` | smoke: ответ → разбор → «решено» + `completeDaily` вызван; повторный рендер (решено) показывает раскрытый ответ, без возможности ответить; пустой банк → пустое состояние. |
| `src/app/App.tsx` | lazy-маршрут `daily`. |
| `src/components/CommandPalette.tsx` | запись экрана в `SCREENS` (иконка — переиспользуем существующую, напр. `bolt`/`quiz`). |
| `src/features/dashboard/Dashboard.tsx` | карточка «Задача дня» (стрик + статус + ссылка на `/daily`). |
| `src/i18n/messages.ts` | ключи `daily.*` + `dashboard.daily*` (ru+en). |

Переиспользуются: `CodeBlock`, `Icon`, `ProgressBar`/`EmptyState` по необходимости, `PRIMARY_BTN`-стиль и разметка вариантов из Quiz, `todayISO`/`daysBetween`, `isCorrect` из `src/domain/quiz/selection.ts`. Новых зависимостей и пункта сайдбара/иконки режима нет.

## 5. i18n

- `daily.title` «Задача дня» / «Daily challenge»
- `daily.eyebrow` (надпись-эйброу) / `daily.streak` «Дней подряд» / «Day streak»
- `daily.doneToday` «Задача дня решена» / «Today's challenge solved»
- `daily.comeBackTomorrow` «Возвращайтесь завтра за новой» / «Come back tomorrow for a new one»
- `daily.emptyTitle`/`daily.emptyHint` — пустой банк
- `dashboard.dailyTitle` «Задача дня» / «Daily challenge», `dashboard.dailyCta` «Решить задачу дня →» / «Solve today's challenge →», `dashboard.dailyDone` «Решено ✓» / «Solved ✓»
- Разбор — существующий `quiz.explanation`. Обе локали, паритет под i18n-тестом.

## 6. Доступность

- Варианты — настоящие `<button>` с буквенными ключами (как Quiz); после ответа `disabled`, состояние верно/неверно передаётся не только цветом (иконка check/close, как в Quiz).
- Ссылка-карточка и ссылки — видимый `focus-visible:ring-accent`.
- Только существующие токены (под `contrast.test.ts`); новых цветов-для-текста нет.

## 7. Тестирование

- **`selectDailyQuestion`**: для фиксированной даты индекс стабилен; разные даты дают (как правило) разные индексы; смена дня меняет выбор; пустой массив → `undefined`.
- **Стор**: `completeDaily` — дневной стрик 0→1, глобальный стрик бампится, `lastSelectedIndex` записан; повтор в тот же день — no-op (стрик не растёт); соседний день → +1, разрыв → сброс к 1; `isDailyDone` до/после; миграция v2→v3 (payload без `daily`) сохраняет srs/streak/interviews и бэкфиллит `daily: {…}`.
- **Компонент (smoke)**: `/daily` (через `MemoryRouter`) — есть вопрос, клик по варианту → виден разбор и состояние «решено», `completeDaily` вызван один раз; при уже решённом (сид стора `lastCompletedDate=today`) рендерится раскрытый ответ без активных кнопок ответа.
- **Регрессия**: весь набор зелёный; `tsc --noEmit` чист; сборка без предупреждений; билингв RU/EN; обе темы.

## 8. Критерии готовности

- Карточка «Задача дня» на Dashboard (стрик + статус) ведёт на `/daily`; экран доступен из ⌘K.
- Один детерминированный вопрос в день; ответ даёт мгновенный разбор и переводит в «решено»; повторно в тот же день ответить нельзя; на след. день — новый вопрос.
- Дневной стрик растёт за факт прохождения; глобальный activity-стрик тоже бампится; `quizResults` не затрагивается.
- Миграция v2→v3 не сбрасывает существующий прогресс; схема/контент/сайдбар не изменены; новых зависимостей нет.
- `tsc` чист, все тесты зелёные (новый доменный + стор + smoke), билингв, обе темы.
