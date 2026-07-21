# Per-language lazy content loading — дизайн

**Дата:** 2026-07-21
**Статус:** дизайн утверждён, готов к плану

## Цель

Контент сейчас хранит оба языка (`{ru,en}`) в одном объекте и грузится целиком одним eager
content-чанком (~1 МБ raw / ~318 КБ gzip — крупнейший не-lazy чанк, тянется на старте через
`CommandPalette` в шелле и Dashboard). Разнести язык по отдельным чанкам и грузить только
активный: initial content ~318 → ~160 КБ gzip. Второй язык предгружать в idle → переключение
языка мгновенное.

## Ключевые решения

- **Активный язык — первым (блокирует старт), второй — idle-предгрузка** (свитч мгновенный;
  фолбэк — короткий спиннер, если ещё не догрузился).
- **Реструктуризация хранения (не codegen):** каждый объект разбивается на языко-независимый
  `core` + `Record<id, prose>` на язык. Стандартная locale-file структура; per-language
  чанки получаются естественно; без build-магии.
- **Публичный API стабилен:** `concepts`/`questions` становятся core-массивами; домен и
  прямые потребители (Progress/Dashboard/Review) используют только языко-независимые поля —
  без правок. Меняется в основном резолвер `localize.ts` + стартовая загрузка.
- **Миграция под round-trip гардом:** реконструкция старых `{ru,en}`-объектов из core+ru+en
  сверяется байт-в-байт со снапшотом текущего контента.

## Модель данных

**`ConceptCore`** (языко-независимое): `id, name, aka?, category, grade, related, tags?,
diagram?, codeLang: 'typescript', highlightLines?`.
**`ConceptProse`** (на язык): `tagline, definition, problem, solution, code, pros, cons,
tradeoffs, whenToUse, whenNotToUse?`.
**`QuestionCore`**: `id, type, category, grade, correctIndex, conceptId?, codeLang?,
highlightLines?`.
**`QuestionProse`**: `prompt, code?, options, explanation`.

`name`/`aka` остаются в core (не Localized и сейчас — англ. имена паттернов; `aka` показывается
как есть). `diagram` — в core (общая строка). `code` — в prose (отличается комментариями/строками
по языку); `codeLang`/`highlightLines` — в core.

## Файлы

- **`src/content/core/{solid,patterns,creational,structural,behavioral,architecture,tradeoffs,microservices}.ts`**
  — core-массивы концептов и вопросов по категориям (как сейчас поделено), eager.
- **`src/content/index.ts`** — собирает `concepts: ConceptCore[]`, `questions: QuestionCore[]`
  (как сейчас), плюс dev-валидация core.
- **`src/content/locales/ru.ts`, `src/content/locales/en.ts`** — каждый экспортит
  `conceptProse: Record<string, ConceptProse>` и `questionProse: Record<string, QuestionProse>`.
  Импортируются ТОЛЬКО динамически (`import('./locales/ru')`) → отдельный чанк на язык.
- **`src/content/registry.ts`** — in-memory реестр активной прозы + `loadLocale(lang)`.

(fillBlank остаётся источником вопросов; его вопросы тоже разбиваются core+prose и вливаются
как остальные. `diagram.ts` — сценарии Diagram Builder — вне области: у сценариев своя схема,
не Concept/Question; они уже отдельный контент и не входят в этот content-чанк по языку.
Проверить при реализации, что `diagram.ts` не тянет вес обоих языков некорректно — если тянет,
это отдельный вопрос вне данной области.)

## Реестр и загрузка (`src/content/registry.ts`)

```
type Prose = { concepts: Record<string, ConceptProse>; questions: Record<string, QuestionProse> };
const cache = new Map<Lang, Prose>();          // мемоизация по языку (per-lang)
export function proseFor(lang): Prose           // синхронно; cache.get(lang); бросает, если lang не загружен
export function isLoaded(lang): boolean         // cache.has(lang)
export async function loadLocale(lang): Promise<Prose>  // dynamic import + cache.set(lang); мемо (idempotent)
export function prefetchLocale(lang): void      // idle-загрузка без ожидания (no-op если уже загружен)
```

- `loadLocale` динамически импортит `./locales/<lang>`, собирает `Prose`, кладёт в `cache`.
  Мемоизирован: повторный вызов для загруженного языка — тот же промис/результат.
- **Ключевой момент:** реестр НЕ хранит глобальный «active» — проза резолвится **по языку,
  переданному резолверу** (`proseFor(lang)`). Так свитч языка (меняется только `settings.lang`)
  сразу читает правильную прозу, если она в cache, а тесты, загрузившие обе locale, работают
  без вызова `loadLocale` на каждый свитч.

## Резолвер (`src/content/localize.ts`)

- `localizeConcept(core, lang)` мёржит `core` + `proseFor(lang).concepts[core.id]` → `ConceptView`
  (та же форма, что сейчас). Аналогично `localizeQuestion`.
- `useConcepts/useConcept/useQuestions` — сигнатуры без изменений; читают `concepts`/`questions`
  (core) + `proseFor(lang)` синхронно; подписаны на `settings.lang` (ре-рендер при свитче).
- **Инвариант:** резолвер вызывается только когда `isLoaded(lang)` (гарантируется стартовым
  await для начального языка и await-перед-свитчем для нового). Если проза языка не загружена —
  это баг оркестрации, `proseFor` бросает явно (а не тихо рендерит пусто).

## Старт и переключение

**Старт (`src/main.tsx`):**
1. Прочитать персист-язык синхронно из стора (`useStore.getState().settings.lang`; zustand
   persist гидрируется синхронно).
2. `await loadLocale(lang)` — показать лёгкий splash до резолва (минимальный, тема-нейтральный).
3. `createRoot(...).render(<App/>)`.
4. `prefetchLocale(other)` в `requestIdleCallback` (fallback `setTimeout`).

**Свитч языка:** обёртка над `setSettings({lang})` (в `LanguageToggle`): если `isLoaded(new)` —
переключить сразу; иначе выставить транзитный флаг «loading», `await loadLocale(new)`, затем
переключить. Т.к. второй язык предгружен в idle, обычно мгновенно.

## Валидация и паритет

Валидатор (`validateContent` переработан или новый `validateSplit`), запускается в dev на
импорте + в тестах:
- Cores проходят `ConceptCoreSchema`/`QuestionCoreSchema` (zod); уникальные id; `related`
  и `conceptId` резолвятся; `correctIndex` в диапазоне длины options соответствующей прозы.
- Для КАЖДОГО locale: набор id прозы == набор core-id (нет лишних/недостающих); длины списков
  (`options` вопроса) совпадают с core-инвариантами и между языками (ru/en одинаковой длины
  на вопрос).
- **no-Cyrillic-in-en** (в en-прозе + `diagram` в core).
- **identify-pattern**: `options` (в обеих locale) == имена концептов (core `name`).
- **depth-floor** (перенос из текущего): `tradeoffs`/`related` ≥ 2 (related в core, tradeoffs
  в prose — проверять по любой locale, длины равны).

## Тесты

- `src/test-setup.ts` синхронно кладёт обе locale в cache реестра перед тестами (статический
  импорт `locales/ru`+`locales/en` → `cache.set('ru',…)`/`cache.set('en',…)`). Резолвер читает
  по текущему `settings.lang` (`proseFor(lang)`), поэтому свитч языка в тестах работает без
  вызова `loadLocale`. Тесты читают прозу как раньше.
- Существующие контент-тесты адаптируются к core+prose (валидатор, no-Cyrillic, counts).
- Новый тест реестра: `loadLocale` мемоизирует; `activeProse` бросает до загрузки; свитч
  меняет активную прозу.
- Round-trip миграционный тест (разовый, может остаться как гард): reconstruct `{ru,en}` из
  core+ru+en == снапшот.

## Миграция (одноразовая, механическая)

1. Снять снапшот текущего контента (pre-image): для каждого concept/question — полный объект
   `{ru,en}`, в JSON, на диск (не в git).
2. Скриптом/субагентами разложить каждый объект в core + ru-prose + en-prose, записать в новые
   файлы.
3. Round-trip: собрать `{ru,en}` обратно и сверить с pre-image побайтно (по нормализованному
   JSON). Любое расхождение — стоп.
4. Удалить старые совмещённые файлы после переключения `index.ts` на core.

## Build

- Locale-модули только динамические → Rollup авто-режет `locales-ru-*` / `locales-en-*`.
- `manualChunks`: core можно оставить в чанке `content` (или влить в main — он маленький);
  locale-чанки формируются автоматически. Убрать/подстроить текущее правило `content`.
- Критерий: в initial-загрузке есть core + ровно один язык; второй язык — отдельный чанк,
  подтягивается idle-предгрузкой.

## Область / вне области

**В области:** split концептов и вопросов (вкл. fillBlank-вопросы) на core+locale, реестр,
резолвер, старт/свитч, валидатор/тесты, миграция, build-проверка.
**Вне области:** сценарии Diagram Builder (`diagram.ts`) — своя схема, отдельный контент;
i18n UI-сообщения (`messages.ts`) — уже маленькие, не входят; изменение самого контента
(глубина/формулировки) — не трогаем, миграция строго изоморфна (round-trip).

## Рассмотрено и отклонено

- **Codegen из инлайн `{ru,en}`** — сохраняет 1-файловый авторинг, но добавляет хрупкую
  build-машинерию и риск рассинхрона generated; выбрана явная реструктуризация.
- **Разбить content-чанк по категориям** — не уменьшает initial load (всё eager); отклонено.
- **Fetch JSON-ассетов** — вносит base-path/fetch-сложности на GitHub Pages subpath; остаёмся
  в модульной системе (dynamic import).

## Критерии готовности

- Initial-загрузка тянет core + только активный язык (проверено по чанкам билда/сети);
  второй язык — отдельный чанк, предгружается в idle; свитч языка мгновенный (фолбэк-спиннер).
- Публичный API (`concepts`/`questions`/`useConcepts`/`useConcept`/`useQuestions`/`getConcept`)
  и весь домен/прямые потребители работают без изменения поведения; UI обоих языков идентичен
  прежнему.
- Round-trip: реконструкция из core+ru+en == прежний контент (ничего не потеряно/переставлено).
- Валидатор/паритет/no-Cyrillic/identify-pattern/depth-floor зелёные в новой форме; все тесты
  зелёные; tsc/build чистые.
