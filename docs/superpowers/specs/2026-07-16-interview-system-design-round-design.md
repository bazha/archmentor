# Interview: раунд System Design — дизайн

**Дата:** 2026-07-16
**Статус:** дизайн утверждён, готов к плану

## Цель

Добавить в режим Interview опциональный **раунд system design**: после MC-лесенки кандидат
собирает архитектурную схему (переиспользуя Diagram Builder) и получает оценку. Делает собес
ближе к реальному (system-design секция) и связывает два режима.

## Ключевые решения

- **Отдельная секция, не влияет на грейд.** MC-лесенка даёт грейд как сейчас; SD-раунд —
  отдельный блок в финальном отчёте. Автомат `machine.ts` и персист-слайс `interviews` **не
  меняются**.
- **Опционально через тумблер** на intro-экране («Включить system-design раунд»).
- **Сценарий подбирается по достигнутому грейду** (`verdict ?? 'junior'`).
- **Переиспользование, не дублирование:** извлечь `ScenarioWorkbench` из существующего
  `ScenarioBuilder` (Diagram Builder), параметризовать `header` и `onSubmit`; `/diagram`
  ведёт себя без изменений.
- **SD-результат — только в рамках сессии** (в финальном отчёте), в `interviews[]` не
  пишется → **миграции стора нет**.

## Область (scope)

- Тумблер SD-раунда на intro Interview.
- Фаза `system-design` после MC-лесенки (если тумблер вкл): сценарий по грейду →
  `ScenarioWorkbench` → сабмит (✓/⚠/✗ + diff как в /diagram) → «Завершить».
- Секция «System design» в финальном отчёте Interview (сводка: сценарий + passed).
- Чистый хелпер `selectSdScenario`.
- Рефактор: извлечь `ScenarioWorkbench` (без изменения поведения /diagram).
- i18n (ru+en).

Вне области: влияние SD на грейд/вердикт; персист SD в истории собесов (миграция); изменения
адаптивного автомата; несколько SD-раундов за собес.

## Архитектура по единицам

### 1. Домен — `src/domain/interview/`

- Автомат `machine.ts` — **без изменений** (SD-раунд вне автомата, отдельная фаза экрана).
- Новый чистый `src/domain/interview/sdScenario.ts`:

  ```ts
  import type { Grade } from '@/content/schema';
  export interface GradedScenarioLike { id: string; grade: Grade }
  /** Выбирает сценарий достигнутого грейда (детерминированно через переданный shuffle);
   *  фолбэк: если сценариев грейда нет — любой (первый после shuffle). */
  export function selectSdScenario<T extends GradedScenarioLike>(
    scenarios: T[], grade: Grade, shuffle: <U>(a: U[]) => U[],
  ): T | undefined;
  ```

  Реализация: `const g = shuffle(scenarios.filter(s => s.grade === grade)); return g[0] ?? shuffle(scenarios)[0];`. Пустой вход → `undefined`.

### 2. Рефактор — извлечь `ScenarioWorkbench` из `src/features/diagram/Diagram.tsx`

Сейчас `ScenarioBuilder` совмещает: заголовок + ссылку «← назад в /diagram», переключатель
список/канва, палитру, `ListBuilder`/`CanvasBuilder`, стикеры/позиции, кнопки «Проверить»/
«Сброс», отчёт `Report` (✓/⚠/✗) и diff-канвы.

- Создать `src/features/diagram/ScenarioWorkbench.tsx` — вся сборочная часть + отчёт + diff,
  **владеет** состоянием diagram/positions/notes/counter/results/view. Props:
  - `scenario: Scenario`
  - `header?: ReactNode` (рендерится сверху; в /diagram — back-link+title+brief; в собесе —
    свой)
  - `onSubmit?: (results: CheckResult[], passed: boolean) => void` (вызывается при «Проверить»
    в дополнение к показу отчёта).
- `ScenarioBuilder` (в `Diagram.tsx`, роут `/diagram`) становится тонкой обёрткой:
  `<ScenarioWorkbench scenario={scenario} header={<…back+title+brief…>} onSubmit={(_, passed) => completeScenario(scenario.id, passed, todayISO())} />`.
  Поведение `/diagram` **идентично прежнему** (существующий `Diagram.test.tsx` — гард
  регрессии).
- Никаких изменений домена/валидации/канвы.

### 3. Interview — `src/features/interview/Interview.tsx`

- **Состояние:** добавить `includeSd: boolean` (из тумблера intro) и `sdResult: { scenarioId:
  string; passed: boolean } | null` (сессионное).
- **Intro:** чекбокс «Включить system-design раунд» (`interview.includeSdRound`), управляет
  `includeSd`.
- **Переход:** когда автомат MC переходит в `done`: если `includeSd` и есть
  `selectSdScenario(scenarios, session.verdict ?? 'junior', shuffle)` → фаза `'system-design'`;
  иначе сразу отчёт.
- **Фаза `system-design`:** рендер `<ScenarioWorkbench scenario={sdScenario} header={<заголовок
  раунда + бриф>} onSubmit={(_, passed) => setSdResult({ scenarioId, passed })} />`. После
  сабмита (виден ✓/⚠/✗ + diff) — кнопка «Завершить» → фаза `report`.
- **Финальный отчёт (`Report`):** как сейчас (вердикт + разбивка по грейдам + слабые темы +
  CTA) **плюс** секция «System design» (`interview.systemDesign`): название сценария +
  passed/issues (`interview.sdPassed`/`interview.sdIssues`). Показывается только если SD-раунд
  проходили.
- MC `recordInterview`/`InterviewResult` **без изменений** (SD не пишется).

### 4. i18n — `src/i18n/messages.ts` (ru+en, паритет)

`interview.includeSdRound`, `interview.systemDesignRound` (заголовок фазы), `interview.finish`
(кнопка «Завершить»), `interview.systemDesign` (заголовок секции отчёта), `interview.sdPassed`,
`interview.sdIssues`.

### a11y

Списочный конструктор Diagram Builder (AA-ядро, клавиатура) работает и в SD-раунде; канва —
визуальный слой как везде. Тумблер — нативный `<input type="checkbox">`/кнопка с меткой и
focus-ring.

## Тесты

- `src/domain/interview/sdScenario.test.ts` — `selectSdScenario`: выбирает грейд-матч; фолбэк
  на любой при отсутствии грейда; детерминизм при заданном shuffle; пустой вход → undefined.
- Рефактор workbench: существующий `src/features/diagram/Diagram.test.tsx` (списочный смоук
  /diagram) остаётся зелёным — гард, что поведение /diagram не изменилось.
- SD-фаза Interview (React Flow-канва + прогон MC-лесенки) в jsdom не тестируется — как канва;
  browser-verify (тумблер on → MC → SD-сценарий по грейду → сабмит → секция «System design» в
  отчёте; тумблер off → SD-раунд не появляется).
- Все существующие тесты зелёные; tsc и build чистые.

## Рассмотрено и отклонено

- **Влияние SD на грейд** — перетряхивание автомата/персист; выбрана отдельная секция.
- **Всегда-в-конце / только senior+** — выбран тумблер.
- **Персист SD в истории собесов** — требует миграции; вне области (сессионный результат).
- **Отдельный embedded-билдер для собеса** — дублирование UI; выбран извлечённый
  `ScenarioWorkbench`.

## Критерии готовности

- На intro Interview есть тумблер SD-раунда; при включённом — после MC-лесенки идёт SD-раунд
  со сценарием по достигнутому грейду, сборка/сабмит работают (✓/⚠/✗ + diff), затем финальный
  отчёт с секцией «System design» (passed/issues).
- При выключенном тумблере поведение собеса не меняется.
- `/diagram` работает идентично прежнему (workbench-рефактор без регрессии).
- Автомат/персист/`InterviewResult` не изменены; `selectSdScenario` покрыт тестом; все
  существующие тесты зелёные; tsc/build чистые; SD-раунд проверен в браузере.
