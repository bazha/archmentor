# Interview: таймер на вопрос (Timed mode) — дизайн

**Дата:** 2026-07-17
**Статус:** дизайн утверждён, готов к плану

## Цель

Добавить в Interview опциональный **Timed mode**: обратный отсчёт на каждый вопрос с
авто-пропуском по истечении. Даёт реализм «не успел — не ответил». Чисто экранная фича —
автомат и персист не меняются.

## Ключевые решения

- **Таймаут = неверный ответ.** Истечение времени идёт тем же путём, что неправильный ответ
  (учитывается в `missedIds`, влияет на STOP/вердикт/слабые темы). Автомат `machine.ts`,
  `recordInterview`, `InterviewResult` **не трогаем**.
- **Опционально через тумблер** «Timed mode» на intro (рядом с SD-раундом), по умолчанию выкл.
- **Per-question отсчёт, 30с** (константа), авто-переход по нулю.

## Область (scope)

- Тумблер «Timed mode» на intro Interview.
- Пер-вопросный отсчёт (30с) с пилюлей в шапке активного вопроса + акцент при ≤5с.
- Авто-переход по истечении, засчитывается как неверный ответ.
- Рефактор: извлечь `resolve(correct)` из `answer(index)` (переиспользуется таймаутом).
- i18n (ru+en).

Вне области: общий таймер на сессию; таймер без штрафа; всегда-включённый таймер; изменения
автомата/персиста; конфигурируемая длительность/длительность по грейду (фикс 30с).

## Архитектура — `src/features/interview/Interview.tsx` (экран-only)

### Состояние
- `timed: boolean` — из intro-тумблера (как `includeSd`); сбрасывать не нужно (пользователь
  задаёт на старте, сохраняется между рестартами как и `includeSd`).
- `remaining: number` — секунды до авто-пропуска текущего вопроса.

### Рефактор `resolve`
Извлечь из текущего `answer(index)` общий хелпер:
```ts
function resolve(correct: boolean) {
  if (!session || session.status !== 'active' || !current) return;
  const advanced = interviewReducer(session, { type: 'answer', correct, questionId: current.id });
  const { state, question } = drawNext(advanced, deck, shuffle);
  setSession(state);
  setCurrentId(question?.id ?? null);
  if (state.status === 'done' && includeSd) {
    setSdScenario(selectSdScenario(scenarios, state.verdict ?? 'junior', shuffle) ?? null);
  }
}
```
`answer(index)` → `resolve(isCorrect(current, index))`. Таймаут → `resolve(false)`. (Логика
SD-pick и всё прочее уже жили в `answer`; переносятся в `resolve` без изменений.)

### Таймер
- Константа `QUESTION_SECONDS = 30` (модульного уровня).
- `onTimeoutRef = useRef<() => void>()`; после определения `resolve`:
  `onTimeoutRef.current = () => resolve(false);` (обновляется каждый рендер — актуальное
  замыкание, без stale).
- `useEffect` c зависимостями `[timed, currentId, session?.status]`: если `!timed` или сессия
  не `active` или нет `current` — выйти; иначе `setRemaining(QUESTION_SECONDS)` и `setInterval`
  на 1000мс, колбэк:
  ```ts
  setRemaining((r) => {
    if (r <= 1) { clearInterval(iv); onTimeoutRef.current?.(); return 0; }
    return r - 1;
  });
  ```
  cleanup — `clearInterval(iv)`. Это гарантирует ровно один `onTimeout` на вопрос (при 0
  интервал остановлен; авто-переход меняет `currentId` → эффект перезапускается, отсчёт
  сбрасывается на 30).

### UI
- В шапке активного вопроса (где грейд-бейдж + счётчик «asked») — **пилюля отсчёта** только
  при `timed`: «{remaining}s», класс акцента при `remaining <= 5` (напр. `text-bad`/`text-accent`).
- **Intro:** второй чекбокс «Timed mode» (`interview.timedMode`), рядом с SD-тумблером, той же
  вёрсткой.

### a11y
Тикающее число — `aria-hidden` (чтобы скринридер не озвучивал каждую секунду). Пилюле —
статичный `aria-label` (`interview.timeLeft` без числа, напр. «оставшееся время»). Авто-переход
СР ловит по смене DOM активного вопроса. Timed — опция; без неё поведение прежнее и доступное.

### Домен/персист
Без изменений. Таймаут учитывается через существующий `missedIds` (incorrect-путь).

## i18n — `src/i18n/messages.ts` (ru+en, паритет)
- `interview.timedMode` — «Таймер на вопрос» / «Timed mode».
- `interview.timeLeft` — «оставшееся время» / «time remaining» (aria-label пилюли).

## Тесты
- Intro: тумблер «Timed mode» присутствует и по умолчанию не отмечен (как тест SD-тумблера).
- Fake-timers: `timed` on → Start → `vi.advanceTimersByTime(QUESTION_SECONDS*1000)` → активный
  вопрос авто-сменился (счётчик «asked» вырос) без клика. Если тест окажется флаки с
  userEvent+fake-timers — оставить только тумблер-тест, а отсчёт/авто-пропуск проверить в
  браузере (задокументировать).
- Все существующие тесты зелёные; tsc/build чистые.

## Рассмотрено и отклонено
- Общий таймер на сессию / визуальный-без-штрафа — выбран per-question с авто-пропуском.
- Всегда-включённый таймер — выбран тумблер.
- Отдельное «timeout»-событие в автомате — не нужно (reuse incorrect-пути через `resolve(false)`).
- Конфигурируемая/по-грейдовая длительность — YAGNI (фикс 30с).

## Критерии готовности
- На intro есть тумблер «Timed mode»; при включённом — каждый вопрос идёт с 30с отсчётом,
  пилюля видна и акцентируется при ≤5с, истечение авто-переходит и засчитывается как неверный
  ответ (виден в итоговом «слабые темы»/счёте).
- При выключенном тумблере поведение собеса не меняется.
- Автомат/персист/`InterviewResult` не изменены; таймер не двоит срабатывания; тумблер-тест
  зелёный; все существующие тесты зелёные; tsc/build чистые; отсчёт проверён в браузере.
