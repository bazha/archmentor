# CI-гейт на PR + branch protection — дизайн

**Дата:** 2026-07-24
**Статус:** дизайн утверждён, готов к плану

## Цель

Добавить независимую проверку **до мержа**: на каждый PR (в т.ч. агентский) гонять
`npm test` + `npm run build` (build = `tsc --noEmit && vite build`), и через branch protection
**не давать смержить красный PR**. Сейчас те же команды есть только в `deploy.yml` на **push в
master** — то есть проверка срабатывает уже после мержа, во время деплоя.

## Ключевые решения

- **Триггер `pull_request`** (base `master`) — гейт срабатывает до мержа; сработает и на PR
  агента (они authored `bazha` через PAT, а PR от `GITHUB_TOKEN` `pull_request`-воркфлоу не
  запускают — у нас этот кейс уже обойдён).
- **Команды те же, что в deploy.yml:** `npm ci` → `npm test` → `npm run build`. `build`
  включает `tsc --noEmit`, поэтому «test + tsc + build» покрыты одним джобом (консистентно, без
  дублирования логики сборки).
- **Branch protection: только CI-чек**, без required reviews. Причина: агентские PR открыты
  `bazha` и им же мержатся, а GitHub не даёт апрувить свой PR → required review = тупик
  self-merge. Гейт = зелёный CI.
- **Отдельный воркфлоу `ci.yml`** — не трогаем `deploy.yml` (он остаётся пост-мерж деплоем).
- **`concurrency` cancel-in-progress: true** — новый пуш в PR отменяет предыдущий прогон
  (экономия минут). `permissions: contents: read` (CI ничего не пишет).

## Архитектура

### `.github/workflows/ci.yml`
```yaml
on:
  pull_request:            # base master
  workflow_dispatch: {}
concurrency:               # супер-сиженный прогон отменяется
  group: ci-${{ github.ref }}
  cancel-in-progress: true
permissions:
  contents: read
jobs:
  ci:                      # имя job = имя required-чека в branch protection
    - checkout
    - setup-node (node 22, cache npm)
    - npm ci
    - npm test
    - npm run build        # tsc --noEmit && vite build
```
Имя job **`ci`** — на него ссылается branch protection как на required status check.

### Branch protection на `master` (GitHub UI, шаг пользователя)
- Require status checks to pass before merging → выбрать **`ci`**.
- (опц.) Require branches to be up to date before merging.
- Required approvals: **0** (сохранить self-merge).
- Прямой push в master оставляем разрешённым (variant «только CI-чек»); запрет прямого push —
  вне области.

## Поток
PR открыт/обновлён → `ci.yml` гонит ci/test/build → GitHub показывает статус-чек `ci` →
branch protection пускает мерж только если `ci` зелёный. Мержишь ты (self-merge не заблокирован).

## Edge-cases
- **Агентский PR:** authored `bazha` → `pull_request` срабатывает → гейт работает.
- **Форк-PR (сторонние):** `pull_request` от форка не имеет доступа к секретам; наш CI секреты
  не использует (`contents: read`, публичный npm) → отработает штатно.
- **Двойной прогон build (PR + push после мержа):** осознанная небольшая избыточность; секунды.
- **Флейки/долгие тесты:** текущая сюита быстрая (~6с); при росте — вынести в отдельные истории.

## Тестирование
1. Открыть тестовый PR с заведомо **падающим** тестом → `ci` красный → (после включения
   protection) мерж заблокирован.
2. Открыть PR с зелёной веткой → `ci` зелёный → мерж доступен.
3. Проверить, что чек `ci` появляется на агентском PR.
Автоматических гейтов на сам воркфлоу нет (YAML) — валидация `ruby -ryaml`; функционально
проверяется живым PR.

## Границы (v1)
Только базовый CI-гейт (`test`+`tsc`+`build` на PR) + branch protection «require ci». Вне
области: bundle-size budget, Lighthouse CI, ESLint/jsx-a11y, Playwright E2E, запрет прямого push,
required reviews, CodeRabbit как required-чек — отдельные истории.

## Критерии готовности
- `.github/workflows/ci.yml` гоняет `npm ci && npm test && npm run build` на каждый
  `pull_request` (base master) + ручной dispatch.
- Красный CI (упавший тест/tsc/сборка) блокирует мерж; зелёный — пускает; self-merge сохранён.
- Чек `ci` виден и на агентских PR.
- `deploy.yml` не тронут; `ruby -ryaml` по новому воркфлоу зелёный.
- Branch protection на master настроен на required-чек `ci`, required approvals = 0.
