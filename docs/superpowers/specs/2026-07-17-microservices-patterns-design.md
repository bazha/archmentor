# Паттерны микросервисов (Microservices patterns) — дизайн

**Дата:** 2026-07-17
**Статус:** дизайн утверждён, готов к плану

## Цель

Закрыть пробел в контенте: на портале нет тактических паттернов микросервисов, которые
регулярно спрашивают на middle/senior/lead собесах. Добавляем новую категорию `microservices`
с 11 паттернами полного качества (страницы концептов + quiz + Mermaid-диаграммы +
Compare-пресеты). Всё подхватывается существующими экранами (Learn / Library / Quiz /
Interview / Review / Daily / Map / Compare / Course), потому что они работают от общего
каталога концептов и вопросов.

## Паттерны (11)

Database per Service, API Gateway, Backend for Frontend (BFF), CQRS, Event Sourcing, Saga,
Sidecar, Circuit Breaker, Anti-Corruption Layer, Aggregator, Bulkhead.

### Грейды (для лестницы собеса и порядка курса)

- **middle:** `api-gateway`, `circuit-breaker`, `database-per-service`
- **senior:** `bff`, `saga`, `cqrs`, `anti-corruption-layer`, `aggregator`, `bulkhead`, `sidecar`
- **lead:** `event-sourcing`

Id — kebab-case, соответствуют `^[a-z0-9-]+$` (требование `ConceptSchema`).

## Область (scope)

- Новая категория `microservices` во всей цепочке (схема → лейблы → кластер Map → курс).
- 11 концептов полного качества + их quiz-вопросы (2-3 на паттерн).
- Mermaid-диаграмма (`diagram`) у каждого концепта.
- Compare-пресеты через взаимные `related` (без изменения кода Compare).
- README и память проекта.

**Вне области:** fill-blank по паттернам; сценарии Diagram Builder; любые изменения
store/персиста/миграций (добавляется только контент). Изменение существующего концепта
`microservices` (стиль) — не требуется, только перекрёстные ссылки на новые паттерны.

## Архитектура

Слои не меняются: `content` (zod-типизированные данные) → `domain` → `store` → `features`.
Новый контент — это данные в `content`, плюс минимальный плюмбинг для новой категории в
`schema`/`labels`/`graph`.

### Стандарт контента (как у существующих 42 концептов)

Каждый концепт (`ConceptSchema`) заполняет ВСЕ поля:
`id, name, aka?, category:'microservices', grade, tagline, definition, problem, solution,
codeExample (lang:'typescript', code ru+en), pros, cons, tradeoffs, whenToUse, whenNotToUse?,
related, tags?, diagram`.

Требования к качеству:
- **Канон.** Формулировки выверены по признанным источникам: Chris Richardson
  (microservices.io), Martin Fowler, DDD (Evans/Vernon для ACL), Netflix/Hystrix для
  Circuit Breaker/Bulkhead. Определение — суть паттерна, а не пересказ статьи-источника.
- **Код.** Небольшой самодостаточный TS-пример, иллюстрирующий суть паттерна; ru/en версии
  идентичны по коду, различаются только комментариями/строками. Тот же стиль, что у
  концепта `microservices` (интерфейсы-контракты, без внешних зависимостей).
- **Двуязычность.** Все `Localized`/`LocalizedList` поля — непустые ru и en (zod min(1)).
- **Diagram.** Валидная строка Mermaid (`flowchart`/`sequenceDiagram`), рендерится
  существующим ленивым `ConceptDiagram`. Подписи — нейтральные/англоязычные термины
  (как у существующих диаграмм), диаграмма общая для обоих языков.

### Quiz-вопросы (`QuestionSchema`)

- 2-3 вопроса на паттерн, `category:'microservices'`, `conceptId` указывает на концепт.
- Типы: `concept` и `tradeoff` (по необходимости `identify-pattern` с кодом). Grade вопроса
  = grade концепта.
- **Однозначность.** Ровно один защитимый правильный ответ; дистракторы — правдоподобные,
  но неверные (частые заблуждения / соседние паттерны). `explanation` объясняет, почему
  верный вариант верен и почему остальные — нет (стиль существующих объяснений).
- Экспорт: `microservicesQuestions: Question[]`.

### Compare-пресеты (без кода)

Вкладка Compare выводит «часто путают» из **взаимных** `related`-ссылок
(`selectConfusablePairs`). Поэтому пресеты создаются авторски — взаимными `related` между:
- `cqrs` ↔ `event-sourcing`
- `api-gateway` ↔ `bff`
- `api-gateway` ↔ `aggregator`
- `circuit-breaker` ↔ `bulkhead`
- `anti-corruption-layer` ↔ `adapter` (кросс-категория; ACL — «распределённый» родич Adapter)

«Взаимный» = обе стороны перечисляют друг друга в `related`. Все `related`-id обязаны
существовать (проверяется `validateContent`), поэтому ссылки только на реальные концепты
(новые + существующие: `microservices`, `event-driven`, `adapter`, `facade`, `dip` и т.п.).

## Точки изменений

**Код (плюмбинг категории):**
1. `src/content/schema.ts` — добавить `'microservices'` в `CategorySchema` (в конец enum).
2. `src/lib/labels.ts` — `CATEGORY_LABEL`: `ru: 'Микросервисы'`, `en: 'Microservices'`.
3. `src/domain/graph/layout.ts` — добавить `'microservices'` в конец `CATEGORY_ORDER`;
   обновить точное сравнение в `src/domain/graph/layout.test.ts`.
   **Важно:** `CategorySchema` — источник типа `Category`, поэтому добавление ключа
   заставит `tsc` требовать ключ `microservices` во ВСЕХ `Record<Category, …>`. Их три:
   `CATEGORY_LABEL` (п.2), `CAT_DOT` в `src/features/map/Map.tsx` и `CAT_DOT` в
   `src/components/Badge.tsx` — в оба добавить цвет-точку категории (Tailwind-класс в
   стиле соседних значений). Без этого сборка не пройдёт.
4. `src/content/concepts/microservices.ts` — **новый файл**: `export const microservices:
   Concept[]` (11) и `export const microservicesQuestions: Question[]`.
5. `src/content/index.ts` — импорт и вливание в массивы `concepts` и `questions`.
6. `src/content/course.ts` — добавить 11 id в `COURSE` по грейдам (middle/senior/lead),
   в порядке категорий после существующих; обновить счётчик в комментарии (42→53).

**Контент:** поля концептов + `diagram` + взаимные `related` (в файле из п.4).

**Мета:**
7. `README.md` — счётчики (концептов 42→53; ~119 → ~119+N вопросов; категории; список
   режимов/каталога), пункт про Microservices patterns.
8. Память проекта `archmentor-project.md` (+ индекс) — обновить состав.

## Тестирование

- **zod-валидация на импорте** (`src/content/index.test.ts` уже гоняет `validateContent`) —
  ловит невалидные поля, дубли id, битые `related`/`conceptId`, рассинхрон опций.
- **Course completeness** (`course.test.ts`) — требует, чтобы каждый концепт попал в `COURSE`
  ровно один раз с корректным грейдом. Гарантирует, что 11 новых добавлены.
- **Graph layout** (`layout.test.ts`) — точное сравнение `CATEGORY_ORDER`; обновляется.
- **Compare pairs** (`pairs.test.ts`) — детерминизм авто-детекта; новые взаимные пары
  появляются без правки теста.
- **Contrast/a11y и прочие существующие тесты** — не затрагиваются.
- Итог: `npx tsc --noEmit && npm run test && npm run build` — всё зелёное; текущие 226
  тестов остаются зелёными, плюс контент проходит валидацию.

## Рассмотрено и отклонено

- **Влить в категорию `architecture`** — отклонено: раздувает категорию и смешивает
  архитектурные стили с тактическими паттернами. Выбрана отдельная категория.
- **Только reference (без quiz)** — отклонено: паттерны важны для собеса, нужны в
  Quiz/Interview/Review/Daily.
- **fill-blank / Diagram Builder сценарии** — вне области (YAGNI на этот заход; можно позже).

## Критерии готовности

- Новая категория `microservices` присутствует в схеме, лейблах (ru+en) и кластере Map.
- 11 паттернов доступны в Library/Learn с полными полями и Mermaid-диаграммой; видны
  фильтром категории.
- Quiz-вопросы по паттернам участвуют в Quiz/Interview/Review/Daily; у каждого один
  защитимый ответ.
- Compare показывает пресеты «часто путают» для заданных пар.
- Курс включает все 11 (completeness-тест зелёный).
- README и память обновлены; `tsc`/тесты/`build` чистые; store/персист не тронуты.
