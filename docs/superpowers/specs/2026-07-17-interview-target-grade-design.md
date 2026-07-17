# Interview: целевой стартовый грейд (Target grade) — дизайн

**Дата:** 2026-07-17
**Статус:** дизайн утверждён, готов к плану

## Цель

Дать возможность стартовать собес не всегда с Junior, а с выбранного грейда. Лестница
дальше работает как сейчас (промоут вверх / стоп по потолку) — просто пропускается лёгкий
разогрев. Кредит за тир даётся только если кандидат реально его прошёл (промоутнулся).

## Ключевые решения

- **Старт выше + лестница** (не «фикс одного уровня»). Выбранный грейд — это точка старта;
  выше идёт обычная адаптивная лестница.
- **Честный вердикт.** Кредит за грейд — только за реально пройденный тир (набрал `PROMOTE`
  верных и поднялся). Если ни разу не поднялся выше стартового тира — ничего не подтверждено,
  вердикт `null` («не подтверждён {грейд}»). Не кредитуем непройденные нижние тиры.
- **Дефолт Junior — поведение 1-в-1 как сейчас.** `predecessorGrade(junior)` и так `null`
  → «ещё не Junior». Новая логика меняет исход только для стартов выше Junior.
- **Только валидные грейды.** На intro предлагаем лишь те грейды, у которых есть вопросы в
  текущей колоде.

## Область (scope)

- Селектор стартового грейда на intro Interview (дефолт Junior).
- Стартовый грейд передаётся в машину; лестница стартует с него.
- Честная вердикт-логика (кредит только за пройденные тиры).
- Отчёт: пометка «Стартовал с {грейд}» при старте выше Junior; при `null`-вердикте с
  высоким стартом — «Не подтверждён {грейд}» вместо «ещё не Junior».
- i18n (ru+en).

**Вне области:** фикс одного уровня без лестницы; конфигурируемые PROMOTE/STOP; изменение
`InterviewResult`/персиста/миграций; отдельная история собесов.

## Архитектура

### `src/domain/interview/machine.ts`

**Состояние.** Добавить поле:
```ts
/** Тир, с которого стартовал собес. Кредит за грейд даётся только за тиры выше него. */
startTier: Grade;
```

**`initInterview`.** Принять стартовый тир (дефолт — низший грейд):
```ts
export function initInterview(startTier: Grade = GRADE_ORDER[0]): InterviewState {
  return {
    tier: startTier,
    correctInTier: 0,
    mistakesInTier: 0,
    askedIds: [],
    missedIds: [],
    status: 'active',
    verdict: null,
    startTier,
  };
}
```

**Вердикт-хелпер.** Заменяет прямые вызовы `predecessorGrade(...)` в путях завершения:
```ts
/**
 * Высший реально пройденный грейд: тир ниже того, на котором остановились. Если так и не
 * поднялись выше стартового тира (ничего не продемонстрировано) — null.
 * Подниматься можно только через promote(), поэтому tier > startTier ⟺ startTier пройден.
 */
function demonstratedVerdict(state: InterviewState): Grade | null {
  return state.tier === state.startTier ? null : predecessorGrade(state.tier);
}
```

**Точки применения** (сейчас там `predecessorGrade`):
- Стоп по ошибкам (`next.mistakesInTier >= STOP`): `verdict: demonstratedVerdict(next)`.
- `exhausted` без активности на тире: `verdict: demonstratedVerdict(state)`.

Путь «прошёл верхний тир → `verdict: state.tier`» в `promote()` **не меняем** — это честный
пас топ-грейда.

**Инвариант честности:** подняться со стартового тира на более высокий можно только через
`promote()` (набрать `PROMOTE` верных). Значит `tier > startTier` гарантирует, что startTier
и все тиры до `tier-1` реально пройдены, и `predecessorGrade(tier)` их не завышает.

**Примеры:**
- Старт Senior, сразу 2 ошибки → `tier === startTier` → `null` = «не подтверждён Senior».
- Старт Senior, прошёл Senior (promote → Lead), фейл Lead → `tier(Lead) ≠ startTier(Senior)`
  → `predecessor(Lead)` = **Senior** (реально показан).
- Старт Junior (дефолт), стоп на Middle → `predecessor(Middle)` = Junior (как сейчас).
- Старт Junior, стоп на Junior → `null` → «ещё не Junior» (как сейчас).

### `src/features/interview/Interview.tsx`

**Состояние.** Новый `const [startTier, setStartTier] = useState<Grade>(GRADE_ORDER[0])`.

**Доступные грейды** (мемо от `deck`): грейды из `GRADE_ORDER`, для которых в колоде есть
хотя бы один вопрос:
```ts
const startableGrades = useMemo(
  () => GRADE_ORDER.filter((g) => deck.some((q) => q.grade === g)),
  [deck],
);
```

**intro.** Селектор-пилюли (Junior/Middle/Senior/Lead), рендерим только `startableGrades`,
выбранная подсвечена акцентом. Подпись — `interview.startGrade`. Дефолт — `GRADE_ORDER[0]`.
Размещается на intro рядом с существующими тумблерами (SD-раунд, Timed mode).

**`start()`.** `drawNext(initInterview(startTier), deck, shuffle)` вместо `initInterview()`.

**Отчёт (`Report`).** Получает `session.startTier`:
- Если `session.startTier !== GRADE_ORDER[0]` — строка «Стартовал с {грейд}»
  (`interview.startedAt`) под заголовком вердикта.
- Вердикт `null`:
  - `startTier === GRADE_ORDER[0]` → `interview.verdictNone` («ещё не Junior», как сейчас).
  - иначе → `interview.notConfirmed` c `{grade: GRADE_LABEL[startTier]}`.

### a11y

Селектор — группа кнопок (radiogroup-подобно) c видимым фокус-рингом (как существующие
интерактивные элементы). Выбранное состояние передаётся не только цветом (`aria-pressed`
или `aria-checked`). Дефолтный поток без взаимодействия — прежний и доступный.

## i18n — `src/i18n/messages.ts` (ru+en, паритет)

- `interview.startGrade` — «Стартовый уровень» / «Starting level».
- `interview.startedAt` — «Стартовал с {grade}» / «Started at {grade}».
- `interview.notConfirmed` — «Не подтверждён {grade} — не хватило до потолка.» /
  «{grade} not confirmed — didn't clear the bar.»

## Тесты

**machine.test.ts:**
- Старт выше Junior, сразу STOP на стартовом тире → `verdict === null`.
- Старт выше Junior, набрал PROMOTE (поднялся), затем STOP → `verdict === predecessor(верхний тир)`.
- Дефолтный `initInterview()` (без аргумента) — `startTier === GRADE_ORDER[0]`, вердикты
  как раньше (стоп на junior → null; стоп на middle → junior).

**Interview.test.tsx:**
- На intro есть селектор стартового грейда; по умолчанию выбран Junior (дефолт).

Все существующие тесты зелёные; tsc/build чистые.

## Рассмотрено и отклонено

- **Фикс одного уровня без лестницы** — выбран «старт выше + лестница».
- **Кредит непройденных нижних тиров** (fail на Senior → Middle) — отклонён в пользу
  честного `null`.
- **Изменение `InterviewResult`/персиста** — не нужно: активная сессия живёт в useState,
  `null`-вердикт пишется как null-грейд, «лучший грейд» на Dashboard не ломается.

## Критерии готовности

- На intro есть селектор стартового грейда (только валидные грейды), дефолт Junior.
- Старт с выбранного грейда: лестница стартует оттуда; фейл на старте → «не подтверждён
  {грейд}», честный пас даёт корректный вердикт.
- Дефолт Junior — поведение собеса не изменилось.
- `InterviewResult`/персист не тронуты; тесты машины и компонента зелёные; tsc/build чистые.
