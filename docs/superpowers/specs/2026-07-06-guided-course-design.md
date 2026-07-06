# ArchMentor — Guided Course (Junior→Lead path)

**Дата:** 2026-07-06
**Статус:** утверждён дизайн, готов к плану реализации
**Контекст:** приложение feature-complete и двуязычно (Фазы 1–3 + i18n A/B на master, задеплоено). Есть грейды `junior→middle→senior→lead` на каждом концепте, SRS (SM-2), `isMastered` (reps ≥ 2), `conceptProgress.seen`, статистика. Дашборд брендирован как «Путь от Junior до Lead» и показывает прогресс по грейдам, но **нет упорядоченного пути** — «Продолжить обучение» ведёт на общий `/learn`.

## 1. Цель и рамки

Дать пользователю **единый линейный гайдед-курс** Junior→Lead поверх существующего каталога: упорядоченная последовательность всех 42 концептов, наглядный «вы здесь → следующий шаг», отметки прогресса и экран курса. Гейтинг **мягкий** — путь ведёт и подсвечивает следующий шаг, но ничего не блокирует (весь контент остаётся свободно доступен, как сейчас).

### Не входит (YAGNI)
- Жёсткая блокировка/анлок шагов и гейтинг перехода между грейдами по порогам.
- Несколько курсов/тематических треков — только один сквозной путь.
- Новые типы упражнений — отдельная будущая спека.
- Модель «урок» (концепт+квиз как единица с завершением по сданному квизу) — путь оперирует концептами, завершение шага = mastery концепта.
- Новый персист-слайс: прогресс по пути **выводится** из уже сохраняемых `srs`/`conceptProgress`; бэкенд/аккаунты по-прежнему вне рамок.

## 2. Модель курса (данные)

`src/content/course.ts` — единственная новая «данность»: упорядоченный список всех 42 id концептов, сгруппированный по грейдам.

```ts
import type { Grade } from './schema';
export const COURSE: { grade: Grade; conceptIds: string[] }[] = [
  { grade: 'junior', conceptIds: [/* … */] },
  { grade: 'middle', conceptIds: [/* … */] },
  { grade: 'senior', conceptIds: [/* … */] },
  { grade: 'lead',   conceptIds: [/* … */] },
];
```

- Группы идут в порядке `GRADE_ORDER` (junior→middle→senior→lead).
- Внутри грейда порядок авторский, по осмысленной прогрессии: SOLID → порождающие → структурные → поведенческие → архитектура → trade-offs, далее в порядке каталога. Материализуется явным списком id.
- Курс — **точная перестановка** существующего каталога; никакого нового по-концептного контента.

**Валидация (`content/course.test.ts`)**: каждый id из COURSE существует в `concepts`; все 42 концепта присутствуют **ровно один раз** (нет пропусков и дублей); `grade` каждого концепта совпадает с группой, в которой он лежит.

## 3. Селекторы прогресса (домен, чистые, без нового состояния)

`src/domain/course.ts` — чистые функции над `AppState` + `COURSE`, в стиле существующих селекторов (`isMastered`, `selectGradeProgress` из `store/useStore.ts`):

```ts
export type StepStatus = 'mastered' | 'inProgress' | 'notStarted';
export interface CourseStep { conceptId: string; grade: Grade; status: StepStatus; isNext: boolean; }

export function selectCourseSteps(state: AppState): CourseStep[];
export function selectNextStep(state: AppState): string | undefined;
export function selectCourseProgress(state: AppState): { mastered: number; total: number; pct: number };
```

- `status`: `mastered` если `isMastered(state, id)`; иначе `inProgress` если `state.conceptProgress[id]?.seen`; иначе `notStarted`.
- `selectCourseSteps`: разворачивает `COURSE` в плоский список шагов в порядке курса; проставляет `status` и флаг `isNext` на первом шаге со статусом ≠ `mastered`.
- `selectNextStep`: id первого не-mastered шага в порядке курса; `undefined`, когда все освоены.
- `selectCourseProgress`: `mastered` = число mastered-шагов, `total` = 42, `pct = round(mastered/total*100)`.

Прогресс полностью **производный** — новый персист-слайс и миграции не нужны; освоение по-прежнему растёт через SM-2 в Review.

## 4. Экран курса и разводка (UI)

- Новый ленивый маршрут `/course` в `app/App.tsx` (как остальные — `lazy: () => import(...).then(m => ({ Component: m.Course }))`) и пункт навигации «Курс»/«Course» в `app/Layout.tsx` (через `t('nav.course')`).
- **`src/features/course/Course.tsx`**:
  - Верх: заголовок `t('course.title')` + сводка `t('course.progress', { mastered, total })` и `ProgressBar` (значение `pct` из `selectCourseProgress`).
  - Тело: шаги, сгруппированные по грейдам; заголовок группы = `GRADE_LABEL[lang][grade]`. Каждый шаг — карточка с именем концепта и tagline (через `useConcept`/`ConceptView`), статус-бейдж через `Badge` (mastered ✓ / in progress / not started, тексты `t('course.mastered'|'course.inProgress'|'course.notStarted')`). Шаг с `isNext` подсвечен (`border-accent-soft`) и несёт CTA `t('course.continue')`.
  - Каждый шаг кликабелен → `/learn/:conceptId` (мягкий гейтинг — ничего не заблокировано).
  - Когда все освоены (`selectNextStep === undefined`): празднующее пустое состояние через `EmptyState` (icon 🎓, `t('course.done')`).
- **Dashboard** (`features/dashboard/Dashboard.tsx`): «Продолжить обучение» (сейчас `<Link to="/learn">`) ведёт на следующий шаг — `to={nextStep ? \`/learn/${nextStep}\` : '/course'}` (`nextStep = selectNextStep(state)`); плюс компактная строка прогресса курса, ссылающаяся на `/course`.
- `Learn`/`Review` не меняются — они и так двигают `seen`/mastery, а курс это отражает.

## 5. i18n, тема, доступность

- **i18n** (`src/i18n/messages.ts`, обе локали, паритет ключей гарантируется существующим тестом): `nav.course` (Курс/Course), `course.title` (Курс/Course), `course.continue` (Продолжить →/Continue →), `course.progress` (`Освоено {mastered}/{total}` / `{mastered}/{total} mastered`), `course.mastered` (Освоено/Mastered), `course.inProgress` (В процессе/In progress), `course.notStarted` (Не начато/Not started), `course.done` (Курс пройден! 🎓 / Course complete! 🎓).
- **Тема/a11y**: семантические токены, focus-ring на кликабельных шагах и CTA, `Badge`/`EmptyState`/`ProgressBar` переиспользуются; контраст под охраной `contrast.test.ts`.

## 6. Границы модулей

| Единица | Ответственность |
|---|---|
| `src/content/course.ts` (+`course.test.ts`) | Упорядоченный список курса (данные) + валидация полноты/грейд-консистентности |
| `src/domain/course.ts` (+тест) | Чистые селекторы: `StepStatus`, `CourseStep`, `selectCourseSteps`/`selectNextStep`/`selectCourseProgress` |
| `src/features/course/Course.tsx` (+тест) | Экран курса |
| Изменения | `app/App.tsx` (маршрут), `app/Layout.tsx` (навпункт), `features/dashboard/Dashboard.tsx` (continue→next + сводка), `i18n/messages.ts` (ключи) |

Без новых зависимостей, без бэкенда, без нового персист-состояния.

## 7. Тестирование

- **`content/course.test.ts`**: COURSE покрывает все 42 id ровно один раз; каждый id существует; `grade` концепта = группа курса.
- **`domain/course.test.ts`** (seed-стор): `selectCourseSteps` считает статусы (mastered/inProgress/notStarted) корректно и ставит `isNext` на первый не-mastered; `selectNextStep` = первый не-mastered, `undefined` когда все mastered; `selectCourseProgress` считает mastered/total/pct.
- **`features/course/Course.test.tsx`** (детерминированный язык): рендерит группы грейдов, статус-бейджи и подсветку next; по одному прогону RU и EN.
- **Dashboard**: обновить тест под новый target «Продолжить обучение» (следующий шаг / `/course`).
- Регрессия: весь текущий набор (100 тестов) зелёный; `tsc --noEmit` чист; `npm run build` без предупреждений.

## 8. Критерии готовности

- Экран `/course` показывает единый путь Junior→Lead: все 42 шага по грейдам, корректные статусы, подсвеченный следующий шаг, сводный прогресс.
- «Продолжить обучение» на дашборде возобновляет со следующего не-освоенного шага; при полном освоении — состояние «курс пройден».
- Мягкий гейтинг: любой шаг открывается, ничего не заблокировано.
- Двуязычно (RU/EN), обе темы; `tsc` чист; все тесты зелёные; сборка без предупреждений.
