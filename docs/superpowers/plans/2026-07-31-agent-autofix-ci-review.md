# Автофикс агентского PR (красный CI + ревью CodeRabbit) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (inline). Работа почти целиком инфраструктурная (bash + GitHub Actions YAML + `gh`); функциональная проверка — живой тестовый PR. Steps use `- [ ]` tracking.

**Goal:** Когда на PR Trello-агента падает CI или CodeRabbit оставляет actionable-замечания, отдельный воркфлоу возвращает агента на ту же ветку, чинит, коммитит и пушит — по одной автопопытке на каждую причину.

**Architecture:** Новый `.github/workflows/trello-fix.yml` с нативными триггерами `workflow_run` (CI завершился) и `pull_request_review` (ревью отправлено) плюс `workflow_dispatch` для ручного теста. Job резолвит `branch`+`reason` из payload, чекаутит ветку PR под `GH_PAT`, читает реестр попыток из комментов PR, заявляет попытку комментом, собирает фидбек в `.fix-context.json`, запускает `anthropics/claude-code-action@v1`, пушит результат PAT-ом и пишет итог в Trello-карточку через `trello.sh`. Карточка всё время остаётся в In Review.

**Tech Stack:** GitHub Actions, `gh` CLI, bash + `jq` + `curl`, `anthropics/claude-code-action@v1`, Trello REST API, Node 20.

**Spec:** `docs/superpowers/specs/2026-07-31-agent-autofix-ci-review-design.md`

## Global Constraints

- **Все `gh`-команды и push — под `GH_TOKEN: ${{ secrets.GH_PAT }}`.** Пуш из-под `GITHUB_TOKEN` не перезапускает workflow, и фикс молча остался бы непроверенным.
- **Бюджет — одна попытка на причину** (`ci` и `review` считаются раздельно, максимум два прогона на PR). Маркер-реестр в комментах PR: строка начинается с `🤖 автофикс (<reason>)`.
- **Попытка заявляется комментом ДО работы**, а не после — иначе упавший ран не тратит попытку и инфраструктурный сбой зациклится.
- **Карточка не переносится** между списками ни при каком исходе; допустимые мутации Trello — только коммент и метка `needs-human`.
- **Все мутации Trello — только через `.github/scripts/trello.sh`**, никогда из промпта LLM. Все агентские тексты в Trello начинаются с маркера `🤖` (иначе `select-and-claim` примет их за ответ пользователя).
- **Не трогаем** `.github/workflows/trello-agent.yml`, `ci.yml`, `deploy.yml`, `.coderabbit.yaml`.
- **YAML-гейт** перед каждым коммитом воркфлоу: `ruby -ryaml -e "YAML.load_file('.github/workflows/trello-fix.yml'); puts 'yaml OK'"`.
- **Bash-гейт** перед каждым коммитом скрипта: `bash -n .github/scripts/trello.sh`.
- **Инфраструктура должна оказаться в `master`**: `workflow_run` и `pull_request_review` читают файл воркфлоу только из ветки по умолчанию. **Но прямой push в `master` невозможен** — вопреки первоначальному допущению этого плана. Проверено 2026-08-02: на `~DEFAULT_BRANCH` активен ruleset `master` с правилом `required_status_checks: [{context: "ci"}]`, `strict_required_status_checks_policy: true` и **пустым `bypass_actors`**, поэтому `git push origin master` отклоняется с `GH013` у любого пользователя, включая админа. Поэтому каждая задача едет **через PR**: ветка → PR → `ci` зеленеет → `gh pr merge --rebase`. Rebase, а не squash: коммиты спеки/плана осмысленны по отдельности и на них ссылаются по пути. Все шаги «Commit + push» ниже читать как «commit → push ветки → PR → merge».
- **Никакой Claude/Co-Authored-By/"Generated with" атрибуции** в сообщениях коммитов.
- **Окно опасности на время Tasks 3–6.** После Task 3 на `master` уже лежит шаг заявки попытки, а шага Claude (Task 5) ещё нет: реальный агентский PR, покрасневший в этом окне, потратит свою единственную `ci`-попытку впустую и на настоящем падении получит «сдался». Поэтому на время выполнения Tasks 3–6 **держим список In Progress пустым и не мержим агентские PR**. Альтернатива, если очередь остановить нельзя: слить Tasks 3, 4 и 5 в **один PR**, чтобы заявка попытки никогда не существовала на `master` без Claude за ней. Цена этой альтернативы при PR-маршруте: проверки Task 3 Step 6 и Task 4 Steps 5–6 — это `gh workflow run trello-fix.yml --ref master`, то есть они требуют, чтобы код уже был в `master`. В объединённом PR их нельзя выполнить в порядке следования задач; они переносятся на после мержа и прогоняются одной пачкой вместе с Task 5 Step 5. Ни одна проверка при этом не выпадает — они только батчатся.
- **Пробник для проверок** — пара «неверный исходник + верный тест» (`src/lib/autofix-probe.ts` + `src/lib/autofix-probe.test.ts`, код в Task 2 Step 4). Так честный фикс и жульничество дают **разный** диф: правка исходника — успех, любая правка теста или `.skip` — провал правила «чинить причину, а не тест». Пробник вида `expect(1 + 1).toBe(3)` для этого не годится: там честный фикс и есть правка теста.
- Данные о форме события CodeRabbit проверены на PR #6: строка `**Actionable comments posted: 1**` лежит в теле **review** (`user.login: coderabbitai[bot]`, `state: COMMENTED`), inline-замечания привязаны к id этого ревью, у многострочных `line == null`.

---

### Task 1: `trello.sh` — сабкоманды `comment` и `add-label`, плюс `.gitignore` для scratch-файлов агента

**Files:**
- Modify: `.github/scripts/trello.sh` (шапка-комментарий, две новые функции, `case`-диспетчер, usage)
- Modify: `.gitignore`

**Interfaces:**
- Consumes: существующие хелперы `comment()`, `ensure_label()`, `add_label()`, `log()` из того же файла.
- Produces: `trello.sh comment <cardId> <text>` и `trello.sh add-label <cardId> <name> [color]` — их вызывает `trello-fix.yml` (Task 3, Task 6).

- [ ] **Step 1: Добавить две функции**

В `.github/scripts/trello.sh` **после** `cmd_finalize()` (перед финальным `case "${1:-}"`) вставить:

```bash
cmd_comment() { # $1 = card id, $2 = text
  comment "$1" "$2"
  log "commented on $1"
}

cmd_add_label() { # $1 = card id, $2 = label name, $3 = color
  local lid
  lid="$(ensure_label "$2" "$3")"
  add_label "$1" "$lid"
  log "label '$2' added to $1"
}
```

- [ ] **Step 2: Расширить диспетчер и usage**

Заменить финальный блок:

```bash
case "${1:-}" in
  select-and-claim) cmd_select_and_claim ;;
  finalize) cmd_finalize "${2:?card id required}" ;;
  *) echo "usage: $0 {select-and-claim|finalize <cardId>}" >&2; exit 2 ;;
esac
```

на:

```bash
case "${1:-}" in
  select-and-claim) cmd_select_and_claim ;;
  finalize)  cmd_finalize  "${2:?card id required}" ;;
  comment)   cmd_comment   "${2:?card id required}" "${3:?text required}" ;;
  add-label) cmd_add_label "${2:?card id required}" "${3:?label name required}" "${4:-red}" ;;
  *) echo "usage: $0 {select-and-claim|finalize <cardId>|comment <cardId> <text>|add-label <cardId> <name> [color]}" >&2; exit 2 ;;
esac
```

- [ ] **Step 3: Обновить шапку-комментарий файла**

Строку `# Trello helper for the CI task-runner. Subcommands: select-and-claim, finalize.` заменить на:

```bash
# Trello helper for the CI task-runner.
# Subcommands: select-and-claim, finalize, comment, add-label.
```

- [ ] **Step 4: Игнорировать scratch-файлы агента**

Дописать в конец `.gitignore`:

```
.trello-card.json
.trello-result.json
.fix-context.json
.fix-result.json
```

Причина: файлы создаются в рабочем дереве прямо перед тем, как Claude коммитит; без игнора агент может утащить их в PR (`.fix-context.json` содержит хвост CI-лога).

- [ ] **Step 5: Гейты**

Run: `bash -n .github/scripts/trello.sh && echo "bash OK"`
Expected: `bash OK`

Run: `.github/scripts/trello.sh` (без аргументов)
Expected: exit code 2 и строка usage с четырьмя сабкомандами.

Run: `.github/scripts/trello.sh comment` (без id)
Expected: exit ≠ 0, сообщение `card id required`.

- [ ] **Step 6: Commit + push**

```bash
git add .github/scripts/trello.sh .gitignore
git commit -m "ci(trello): add comment/add-label subcommands; ignore agent scratch files"
git push origin master
```

---

### Task 2: Скелет `trello-fix.yml` — триггеры, гейт, резолв контекста, поиск PR

**Files:**
- Create: `.github/workflows/trello-fix.yml`

**Interfaces:**
- Produces: step-выходы `steps.ctx.outputs.{branch,reason,run_id,review_id,card_id}` и `steps.pr.outputs.number` — на них опираются Tasks 3–6.

- [ ] **Step 1: Написать скелет воркфлоу**

```yaml
name: Trello agent autofix

# Autofix an agent PR when CI goes red or CodeRabbit leaves actionable comments.
# One attempt per reason (ci / review); the ledger lives in the PR comments.
on:
  workflow_run:
    workflows: ["CI"]
    types: [completed]
  pull_request_review:
    types: [submitted]
  workflow_dispatch:
    inputs:
      branch:
        description: "Agent branch (trello/<cardId>-<slug>)"
        required: true
      reason:
        description: "ci | review"
        required: true
        default: ci

# Serialize per branch: a CI failure and a CodeRabbit review can arrive at the
# same moment, and their fixes must not race on the same working tree.
concurrency:
  group: trello-fix-${{ github.event.workflow_run.head_branch || github.event.pull_request.head.ref || github.event.inputs.branch }}
  cancel-in-progress: false

permissions:
  contents: read        # push and every gh call go through GH_PAT, not GITHUB_TOKEN
  pull-requests: read
  id-token: write       # required by anthropics/claude-code-action (OIDC)

jobs:
  fix:
    runs-on: ubuntu-latest
    if: >-
      github.event_name == 'workflow_dispatch' ||
      (github.event_name == 'workflow_run' &&
       github.event.workflow_run.conclusion == 'failure' &&
       github.event.workflow_run.event == 'pull_request' &&
       startsWith(github.event.workflow_run.head_branch, 'trello/')) ||
      (github.event_name == 'pull_request_review' &&
       github.event.review.user.login == 'coderabbitai[bot]' &&
       startsWith(github.event.pull_request.head.ref, 'trello/') &&
       contains(github.event.review.body, 'Actionable comments posted:') &&
       !contains(github.event.review.body, 'Actionable comments posted: 0'))
    steps:
      - name: Resolve context
        id: ctx
        env:
          EV: ${{ github.event_name }}
          WR_BRANCH: ${{ github.event.workflow_run.head_branch }}
          WR_ID: ${{ github.event.workflow_run.id }}
          PR_BRANCH: ${{ github.event.pull_request.head.ref }}
          REVIEW_ID: ${{ github.event.review.id }}
          IN_BRANCH: ${{ github.event.inputs.branch }}
          IN_REASON: ${{ github.event.inputs.reason }}
        run: |
          set -euo pipefail
          run_id=""; review_id=""
          case "$EV" in
            workflow_run)        branch="$WR_BRANCH"; reason="ci";        run_id="$WR_ID" ;;
            pull_request_review) branch="$PR_BRANCH"; reason="review";    review_id="$REVIEW_ID" ;;
            workflow_dispatch)   branch="$IN_BRANCH"; reason="$IN_REASON" ;;
            *) echo "unsupported event: $EV" >&2; exit 1 ;;
          esac
          case "$reason" in ci|review) ;; *) echo "bad reason: $reason" >&2; exit 1 ;; esac
          case "$branch" in trello/*) ;; *) echo "not an agent branch: $branch" >&2; exit 1 ;; esac
          card_id="$(printf '%s' "$branch" | sed -n 's|^trello/\([0-9a-f]\{1,\}\)-.*|\1|p')"
          {
            echo "branch=$branch"
            echo "reason=$reason"
            echo "run_id=$run_id"
            echo "review_id=$review_id"
            echo "card_id=$card_id"
          } >> "$GITHUB_OUTPUT"
          echo "branch=$branch reason=$reason card=$card_id run=$run_id review=$review_id"

      - uses: actions/checkout@v4
        with:
          ref: ${{ steps.ctx.outputs.branch }}
          token: ${{ secrets.GH_PAT }}
          fetch-depth: 0

      - name: Find the open PR for this branch
        id: pr
        env:
          GH_TOKEN: ${{ secrets.GH_PAT }}
          BRANCH: ${{ steps.ctx.outputs.branch }}
        run: |
          set -euo pipefail
          num="$(gh pr list --head "$BRANCH" --state open --json number --jq '.[0].number // ""')"
          echo "number=$num" >> "$GITHUB_OUTPUT"
          if [ -z "$num" ]; then echo "no open PR for $BRANCH — nothing to fix"; else echo "PR #$num"; fi
```

Пояснения к решениям, которые легко сломать при правке:
- `ref:` в checkout обязателен — при `workflow_run` дефолтный чекаут взял бы `master`, а не ветку PR.
- `fetch-depth: 0` нужен, чтобы позже сравнить `origin/$BRANCH..HEAD` и понять, появились ли коммиты.
- Значения из payload прокинуты через `env:`, а не подставлены в тело `run:` — имя ветки приходит извне, прямая интерполяция была бы shell-инъекцией.
- `github.event.inputs.branch` (а не `inputs.branch`) — форма, гарантированно доступная в выражении `concurrency` на уровне воркфлоу.

- [ ] **Step 2: YAML-гейт**

Run: `ruby -ryaml -e "YAML.load_file('.github/workflows/trello-fix.yml'); puts 'yaml OK'"`
Expected: `yaml OK`

- [ ] **Step 3: Commit + push**

```bash
git add .github/workflows/trello-fix.yml
git commit -m "ci(autofix): workflow skeleton — triggers, gate, context resolve, PR lookup"
git push origin master
```

- [ ] **Step 4: Завести тестовую карточку и тестовый PR**

Нужны один раз на все проверки плана.

1. В Trello создать карточку `autofix test` (любой список; переносить её воркфлоу не будет). Взять её короткий id из URL и получить полный: `curl -s "https://api.trello.com/1/cards/<shortLink>?key=…&token=…" | jq -r .id`. Обозначим его `<CARD>`.
2. Локально:
```bash
git checkout -b "trello/<CARD>-autofix-test" master
cat > src/lib/autofix-probe.ts <<'EOF'
/** Probe for the autofix workflow. The implementation is deliberately wrong. */
export function sumProbe(a: number, b: number): number {
  return a - b;
}
EOF
cat > src/lib/autofix-probe.test.ts <<'EOF'
import { describe, it, expect } from 'vitest';
import { sumProbe } from './autofix-probe';

describe('sumProbe', () => {
  it('adds its two arguments', () => {
    expect(sumProbe(2, 3)).toBe(5);
  });
});
EOF
git add src/lib/autofix-probe.ts src/lib/autofix-probe.test.ts
git commit -m "test: deliberately failing probe for the autofix workflow"
git push -u origin "trello/<CARD>-autofix-test"
gh pr create --base master --head "trello/<CARD>-autofix-test" \
  --title "autofix test" --body "Throwaway PR for verifying trello-fix.yml. Do not merge."
```

- [ ] **Step 5: Проверить скелет ручным запуском**

Run:
```bash
gh workflow run trello-fix.yml --ref master -f branch="trello/<CARD>-autofix-test" -f reason=ci
sleep 20 && gh run list --workflow=trello-fix.yml --limit 1
gh run view --log | grep -E "branch=|PR #"
```
Expected: прогон зелёный; в логе строка `branch=trello/<CARD>-autofix-test reason=ci card=<CARD> …` и `PR #<n>`.

- [ ] **Step 6: Проверить, что мусорные входы отсекаются**

Run: `gh workflow run trello-fix.yml --ref master -f branch="feature/not-an-agent-branch" -f reason=ci`
Expected: прогон красный на шаге `Resolve context`, в логе `not an agent branch: feature/not-an-agent-branch`.

---

### Task 3: Реестр попыток, «сдался» и заявка попытки

**Files:**
- Modify: `.github/workflows/trello-fix.yml` (три шага после `Find the open PR`)

**Interfaces:**
- Consumes: `steps.ctx.outputs.{branch,reason,card_id}`, `steps.pr.outputs.number`.
- Produces: `steps.ledger.outputs.proceed` (`'true'` — работаем) и `steps.ledger.outputs.exhausted` (`'true'` — попытка по этой причине уже была). Все рабочие шаги Tasks 4–6 гейтятся по `proceed == 'true'`.

- [ ] **Step 1: Добавить шаг реестра**

Дописать после шага `Find the open PR for this branch`:

```yaml
      - name: Read the attempt ledger
        id: ledger
        if: steps.pr.outputs.number != ''
        env:
          GH_TOKEN: ${{ secrets.GH_PAT }}
          PR: ${{ steps.pr.outputs.number }}
          REASON: ${{ steps.ctx.outputs.reason }}
        run: |
          set -euo pipefail
          marker="🤖 автофикс ($REASON)"
          used="$(gh pr view "$PR" --json comments \
                  | jq --arg m "$marker" '[.comments[] | select(.body | startswith($m))] | length')"
          echo "attempts for reason=$REASON: $used"
          if [ "$used" -ge 1 ]; then
            echo "exhausted=true"  >> "$GITHUB_OUTPUT"
            echo "proceed=false"   >> "$GITHUB_OUTPUT"
          else
            echo "exhausted=false" >> "$GITHUB_OUTPUT"
            echo "proceed=true"    >> "$GITHUB_OUTPUT"
          fi
```

Реестр считается **по причине**: коммент `🤖 автофикс (review)` не расходует попытку `ci` и наоборот.

- [ ] **Step 2: Добавить ветку «сдался»**

```yaml
      - name: Give up — this reason already had its attempt
        if: steps.ledger.outputs.exhausted == 'true'
        continue-on-error: true
        env:
          GH_TOKEN: ${{ secrets.GH_PAT }}
          TRELLO_KEY: ${{ secrets.TRELLO_KEY }}
          TRELLO_TOKEN: ${{ secrets.TRELLO_TOKEN }}
          TRELLO_BOARD_ID: ${{ secrets.TRELLO_BOARD_ID }}
          PR: ${{ steps.pr.outputs.number }}
          REASON: ${{ steps.ctx.outputs.reason }}
          CARD: ${{ steps.ctx.outputs.card_id }}
          PR_URL: ${{ github.server_url }}/${{ github.repository }}/pull/${{ steps.pr.outputs.number }}
        run: |
          set -euo pipefail
          gh pr comment "$PR" --body "🤖 ⚠️ Автофикс по причине \`$REASON\` уже применялся и не помог — нужен человек."
          chmod +x .github/scripts/trello.sh
          .github/scripts/trello.sh comment "$CARD" "🤖 ⚠️ Автофикс ($REASON) не помог со второго события — нужен человек: $PR_URL"
          .github/scripts/trello.sh add-label "$CARD" "needs-human" "red"
```

`continue-on-error: true` — карточки может не существовать (тестовые ветки), и это не повод красить прогон: полезное сообщение в PR уже опубликовано.

- [ ] **Step 3: Добавить заявку попытки**

```yaml
      - name: Claim the attempt (before doing any work)
        if: steps.ledger.outputs.proceed == 'true'
        env:
          GH_TOKEN: ${{ secrets.GH_PAT }}
          PR: ${{ steps.pr.outputs.number }}
          REASON: ${{ steps.ctx.outputs.reason }}
          RUN_URL: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
        run: |
          set -euo pipefail
          gh pr comment "$PR" --body "🤖 автофикс ($REASON) — $RUN_URL"
```

Коммент постится **до** любой работы: если ран упадёт по таймауту или лимиту, попытка всё равно потрачена и цикла не будет. Тот же приём уже используется в `trello.sh` (claim до запуска Claude).

- [ ] **Step 4: YAML-гейт**

Run: `ruby -ryaml -e "YAML.load_file('.github/workflows/trello-fix.yml'); puts 'yaml OK'"`
Expected: `yaml OK`

- [ ] **Step 5: Commit + push**

```bash
git add .github/workflows/trello-fix.yml
git commit -m "ci(autofix): per-reason attempt ledger, claim-before-work, give-up path"
git push origin master
```

- [ ] **Step 6: Проверить заявку и «сдался» на тестовом PR**

Run:
```bash
gh workflow run trello-fix.yml --ref master -f branch="trello/<CARD>-autofix-test" -f reason=ci
sleep 30 && gh pr view <n> --json comments --jq '.comments[].body'
```
Expected: появился коммент `🤖 автофикс (ci) — https://github.com/…/actions/runs/…`.

Run (тот же запуск повторно):
```bash
gh workflow run trello-fix.yml --ref master -f branch="trello/<CARD>-autofix-test" -f reason=ci
sleep 30 && gh pr view <n> --json comments --jq '.comments[].body'
```
Expected: новый коммент `🤖 ⚠️ Автофикс по причине \`ci\` уже применялся и не помог — нужен человек.`; второго `🤖 автофикс (ci)` не появилось.

Run (другая причина — попытки считаются раздельно):
```bash
gh workflow run trello-fix.yml --ref master -f branch="trello/<CARD>-autofix-test" -f reason=review
sleep 30 && gh pr view <n> --json comments --jq '.comments[].body'
```
Expected: появился `🤖 автофикс (review) — …`, то есть исчерпанная `ci` не заблокировала `review`.

- [ ] **Step 7: Очистить реестр перед следующими задачами**

Комменты-маркеры теперь мешают дальнейшим проверкам. Удалить оба `🤖 автофикс (...)`-коммента:
```bash
gh api repos/{owner}/{repo}/issues/<n>/comments --jq '.[] | select(.body | startswith("🤖 автофикс")) | .id' \
  | xargs -I{} gh api -X DELETE repos/{owner}/{repo}/issues/comments/{}
```

---

### Task 4: Сбор фидбека в `.fix-context.json`

**Files:**
- Modify: `.github/workflows/trello-fix.yml` (шаги окружения + шаг сбора контекста)

**Interfaces:**
- Consumes: `steps.ctx.outputs.{reason,run_id,review_id,branch}`, `steps.pr.outputs.number`, `steps.ledger.outputs.proceed`.
- Produces: файл `./.fix-context.json` в корне рабочего дерева со схемой:
  `{ reason: "ci"|"review", branch: string, pr: number, ciLog: string, review: { body: string, comments: [{path: string, line: number|null, body: string}] } }` — его читает промпт в Task 5.

- [ ] **Step 1: Добавить окружение сборки (после шага заявки попытки)**

Claude должен уметь гонять `npm test` и `npx tsc --noEmit`, а затем коммитить.

```yaml
      - uses: actions/setup-node@v4
        if: steps.ledger.outputs.proceed == 'true'
        with:
          node-version: 20
          cache: npm

      - name: Install deps
        if: steps.ledger.outputs.proceed == 'true'
        run: npm ci

      - name: Configure git identity
        if: steps.ledger.outputs.proceed == 'true'
        run: |
          git config user.name "trello-agent"
          git config user.email "trello-agent@users.noreply.github.com"
```

- [ ] **Step 2: Добавить шаг сбора контекста**

```yaml
      - name: Gather feedback into .fix-context.json
        if: steps.ledger.outputs.proceed == 'true'
        env:
          GH_TOKEN: ${{ secrets.GH_PAT }}
          REPO: ${{ github.repository }}
          PR: ${{ steps.pr.outputs.number }}
          BRANCH: ${{ steps.ctx.outputs.branch }}
          REASON: ${{ steps.ctx.outputs.reason }}
          RUN_ID: ${{ steps.ctx.outputs.run_id }}
          REVIEW_ID: ${{ steps.ctx.outputs.review_id }}
        run: |
          set -euo pipefail
          ci_log=""; review_body=""; review_comments="[]"

          if [ "$REASON" = "ci" ]; then
            run_id="$RUN_ID"
            if [ -z "$run_id" ]; then
              # manual dispatch: take the latest failed CI run on this branch
              run_id="$(gh run list --workflow=ci.yml --branch "$BRANCH" --status failure \
                        --limit 1 --json databaseId --jq '.[0].databaseId // ""')"
            fi
            if [ -n "$run_id" ]; then
              # last ~300 lines, hard-capped at 20 KB so the prompt stays sane
              ci_log="$(gh run view "$run_id" --log-failed 2>/dev/null | tail -n 300 | tail -c 20000 || true)"
            fi
            [ -n "$ci_log" ] || ci_log="(no CI log available; reproduce locally with npm test and npx tsc --noEmit)"
          else
            review_id="$REVIEW_ID"
            if [ -z "$review_id" ]; then
              review_id="$(gh api "repos/$REPO/pulls/$PR/reviews" \
                           --jq '[.[] | select(.user.login=="coderabbitai[bot]")] | last | .id // ""')"
            fi
            if [ -n "$review_id" ]; then
              review_body="$(gh api "repos/$REPO/pulls/$PR/reviews/$review_id" --jq '.body // ""')"
              # line is null on multi-line comments — fall back to start_line/original_line
              review_comments="$(gh api "repos/$REPO/pulls/$PR/reviews/$review_id/comments" \
                --jq '[.[] | {path: .path, line: (.line // .start_line // .original_line), body: .body}]')"
            fi
          fi

          jq -n \
            --arg reason "$REASON" --arg branch "$BRANCH" --argjson pr "$PR" \
            --arg ciLog "$ci_log" --arg reviewBody "$review_body" \
            --argjson reviewComments "$review_comments" \
            '{reason: $reason, branch: $branch, pr: $pr, ciLog: $ciLog,
              review: {body: $reviewBody, comments: $reviewComments}}' > .fix-context.json

          echo "context: reason=$REASON ciLog=$(printf '%s' "$ci_log" | wc -c) bytes, review comments=$(jq '.review.comments | length' .fix-context.json)"
```

`jq -n --arg` вместо ручной сборки JSON — лог CI содержит кавычки, ANSI-коды и переводы строк, любая склейка строками сломала бы файл.

- [ ] **Step 3: YAML-гейт**

Run: `ruby -ryaml -e "YAML.load_file('.github/workflows/trello-fix.yml'); puts 'yaml OK'"`
Expected: `yaml OK`

- [ ] **Step 4: Commit + push**

```bash
git add .github/workflows/trello-fix.yml
git commit -m "ci(autofix): gather CI log / CodeRabbit review into .fix-context.json"
git push origin master
```

- [ ] **Step 5: Проверить сбор для причины `ci`**

Тестовый PR уже красный (падающий пробник из Task 2).

Run:
```bash
gh workflow run trello-fix.yml --ref master -f branch="trello/<CARD>-autofix-test" -f reason=ci
sleep 60 && gh run view --log | grep "context: reason=ci"
```
Expected: строка вида `context: reason=ci ciLog=<несколько тысяч> bytes, review comments=0` — то есть лог упавшего CI действительно подтянулся.

- [ ] **Step 6: Проверить сбор для причины `review`**

Run:
```bash
gh workflow run trello-fix.yml --ref master -f branch="trello/<CARD>-autofix-test" -f reason=review
sleep 60 && gh run view --log | grep "context: reason=review"
```
Expected: `review comments=` с числом ≥ 0 и без ошибок `gh api`. Если CodeRabbit ещё не ревьюил этот PR — число 0 и пустой `body`; это валидный результат шага.

- [ ] **Step 7: Очистить реестр**

```bash
gh api repos/{owner}/{repo}/issues/<n>/comments --jq '.[] | select(.body | startswith("🤖 автофикс")) | .id' \
  | xargs -I{} gh api -X DELETE repos/{owner}/{repo}/issues/comments/{}
```

---

### Task 5: Шаг Claude и push результата

**Files:**
- Modify: `.github/workflows/trello-fix.yml` (шаг `anthropics/claude-code-action@v1` + шаг пуша)

**Interfaces:**
- Consumes: `./.fix-context.json` (Task 4), `steps.ctx.outputs.branch`, `steps.pr.outputs.number`.
- Produces: файл `./.fix-result.json` со схемой
  `{"status": "fixed"|"no-change"|"error", "note": string, "rebuttals": [{"item": string, "why": string}]}` — его читают шаги пуша (здесь) и финализации (Task 6).

- [ ] **Step 1: Добавить шаг Claude**

```yaml
      - name: Run Claude on the feedback
        if: steps.ledger.outputs.proceed == 'true'
        uses: anthropics/claude-code-action@v1
        with:
          claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          claude_args: "--dangerously-skip-permissions"
          prompt: |
            You are running UNATTENDED in CI (no human to answer questions live).
            You are ALREADY checked out on branch ${{ steps.ctx.outputs.branch }}, which has an
            open pull request #${{ steps.pr.outputs.number }} in this repository. Your job is to
            address the feedback on that PR, in place.

            HARD RULES
            - Do NOT create a branch. Do NOT open a PR. Do NOT merge. Do NOT deploy.
            - Do NOT touch Trello (the workflow does that).
            - Do NOT push (a later workflow step pushes with the right credentials).
            - Commit on top of the current branch, with NO Claude/Co-Authored-By/"Generated with"
              attribution.
            - Stay inside the scope of this PR. Add no new dependencies. Follow CLAUDE.md and the
              existing patterns.

            Read the feedback from ./.fix-context.json:
              { reason, branch, pr, ciLog, review: { body, comments: [{path, line, body}] } }

            IF reason == "ci":
              CI failed on this branch. `ciLog` is the tail of the failing job's log.
              1. Reproduce locally: `npm test` and `npx tsc --noEmit`.
              2. Fix the ROOT CAUSE. It is FORBIDDEN to reach green by weakening the check:
                 no `.skip`/`.only`, no deleting or loosening assertions, no rewriting a test to
                 match wrong behaviour, no disabling type checks or lint rules. If the honest fix
                 is out of this PR's scope, do not fake it — write status "error" and explain.
              3. If the failure does NOT reproduce locally, that is a result too: write status
                 "error" with what you observed.

            IF reason == "review":
              CodeRabbit left actionable comments. For EVERY item in `review.comments` (and any
              actionable point in `review.body`) do exactly one of:
                a) fix it in the code, or
                b) reject it with a reason — add {item, why} to `rebuttals` and change nothing
                   for that item.
              Silently ignoring an item is not allowed. Reject when the comment is wrong,
              inapplicable to this codebase, or out of the PR's scope — do not perform changes
              you believe are harmful just because a bot asked.

            BEFORE COMMITTING: `npm test` and `npx tsc --noEmit` MUST both be green.
            If you cannot get them green, do not commit — write status "error" instead.

            ALWAYS write ./.fix-result.json before exiting, with this schema:
              {"status":"fixed"|"no-change"|"error","note":"","rebuttals":[{"item":"","why":""}]}
            - "fixed"     — you committed at least one commit.
            - "no-change" — nothing needed changing (e.g. every review item was rejected).
            - "error"     — you could not honestly fix it; `note` explains why.

            Never print secrets.
```

- [ ] **Step 2: Добавить шаг пуша**

```yaml
      - name: Push the fix
        id: push
        if: steps.ledger.outputs.proceed == 'true'
        env:
          GH_TOKEN: ${{ secrets.GH_PAT }}
          BRANCH: ${{ steps.ctx.outputs.branch }}
        run: |
          set -euo pipefail
          if [ ! -f .fix-result.json ]; then
            echo "pushed=false" >> "$GITHUB_OUTPUT"
            echo "status=missing" >> "$GITHUB_OUTPUT"
            echo "no .fix-result.json — the agent step produced nothing"
            exit 0
          fi
          status="$(jq -r '.status // "error"' .fix-result.json)"
          ahead="$(git rev-list --count "origin/$BRANCH..HEAD")"
          echo "status=$status ahead=$ahead"
          if [ "$status" = "fixed" ] && [ "$ahead" -gt 0 ]; then
            git remote set-url origin "https://x-access-token:${GH_TOKEN}@github.com/${GITHUB_REPOSITORY}.git"
            git push origin "HEAD:$BRANCH"
            echo "pushed=true" >> "$GITHUB_OUTPUT"
          else
            echo "pushed=false" >> "$GITHUB_OUTPUT"
            [ "$ahead" -eq 0 ] && status="no-change"
          fi
          echo "status=$status" >> "$GITHUB_OUTPUT"
```

Пуш идёт через remote с `GH_PAT`: `git push` не читает `GH_TOKEN`, а пуш из-под `GITHUB_TOKEN` не перезапустил бы CI — фикс остался бы непроверенным. `status=fixed`, но `ahead == 0` трактуем как `no-change`: агент заявил правку, а коммита нет.

- [ ] **Step 3: YAML-гейт**

Run: `ruby -ryaml -e "YAML.load_file('.github/workflows/trello-fix.yml'); puts 'yaml OK'"`
Expected: `yaml OK`

- [ ] **Step 4: Commit + push**

```bash
git add .github/workflows/trello-fix.yml
git commit -m "ci(autofix): run Claude on the feedback and push the fix with the PAT"
git push origin master
```

- [ ] **Step 5: Живая проверка на красном CI**

Run:
```bash
gh workflow run trello-fix.yml --ref master -f branch="trello/<CARD>-autofix-test" -f reason=ci
```
Дождаться конца прогона (несколько минут), затем:
```bash
gh run view --log | grep -E "status=|ahead="
git fetch origin "trello/<CARD>-autofix-test"
git log --oneline -3 "origin/trello/<CARD>-autofix-test"
git show --stat "origin/trello/<CARD>-autofix-test"
```
Expected: `status=fixed ahead=1`; CI на PR перезапустился и зеленеет.

**Критерий «чинил причину, а не тест» — однозначный, потому что пробник это разводит:**
- в дифе изменён **`src/lib/autofix-probe.ts`** (`a - b` → `a + b`) — успех;
- файл **`src/lib/autofix-probe.test.ts` не тронут вовсе**.

Любая правка тестового файла, `.skip`, `.only` или удаление теста — **провал** правила промпта, а не мелочь: именно это поведение самое опасное у агента без присмотра. В этом случае усилить формулировку в промпте (Step 1), откатить ветку и повторить проверку — не переходить к Task 6.

- [ ] **Step 6: Очистить реестр и вернуть пробник в красное состояние**

```bash
git fetch origin && git checkout "trello/<CARD>-autofix-test" && git reset --hard origin/master
# заново создать падающий пробник (см. Task 2 Step 4) и запушить force
gh api repos/{owner}/{repo}/issues/<n>/comments --jq '.[] | select(.body | startswith("🤖 автофикс")) | .id' \
  | xargs -I{} gh api -X DELETE repos/{owner}/{repo}/issues/comments/{}
```

---

### Task 6: Возражения в PR и финализация карточки

**Files:**
- Modify: `.github/workflows/trello-fix.yml` (два финальных шага)

**Interfaces:**
- Consumes: `./.fix-result.json`, `steps.push.outputs.{status,pushed}`, `steps.ctx.outputs.{card_id,reason}`, `steps.pr.outputs.number`, `steps.ledger.outputs.proceed`.
- Produces: конечное состояние — комменты в PR и в Trello-карточке. Дальше по цепочке ничего нет.

- [ ] **Step 1: Добавить публикацию возражений**

```yaml
      - name: Post rebuttals to the PR
        if: steps.ledger.outputs.proceed == 'true'
        continue-on-error: true
        env:
          GH_TOKEN: ${{ secrets.GH_PAT }}
          PR: ${{ steps.pr.outputs.number }}
        run: |
          set -euo pipefail
          [ -f .fix-result.json ] || exit 0
          body="$(jq -r '.rebuttals[]? | "- **" + .item + "** — " + .why' .fix-result.json)"
          [ -n "$body" ] || { echo "no rebuttals"; exit 0; }
          printf '%s\n\n%s\n' "🤖 Не принято, с обоснованием:" "$body" > /tmp/rebuttals.md
          gh pr comment "$PR" --body-file /tmp/rebuttals.md
```

Текст собирается через файл, а не инлайновой многострочной строкой: в YAML-блоке `run:` любая многострочная подстановка утащила бы в тело коммента отступ шага, и GitHub отрендерил бы список как блок кода.

- [ ] **Step 2: Добавить финализацию карточки**

```yaml
      - name: Report the outcome to the Trello card
        if: always() && steps.ledger.outputs.proceed == 'true'
        continue-on-error: true
        env:
          TRELLO_KEY: ${{ secrets.TRELLO_KEY }}
          TRELLO_TOKEN: ${{ secrets.TRELLO_TOKEN }}
          TRELLO_BOARD_ID: ${{ secrets.TRELLO_BOARD_ID }}
          CARD: ${{ steps.ctx.outputs.card_id }}
          REASON: ${{ steps.ctx.outputs.reason }}
          STATUS: ${{ steps.push.outputs.status }}
          PUSHED: ${{ steps.push.outputs.pushed }}
          PR_URL: ${{ github.server_url }}/${{ github.repository }}/pull/${{ steps.pr.outputs.number }}
          RUN_URL: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
        run: |
          set -euo pipefail
          chmod +x .github/scripts/trello.sh
          case "${STATUS:-}" in
            fixed)
              [ "$PUSHED" = "true" ] \
                && msg="🤖 🔧 Автофикс ($REASON): починил, PR обновлён — $PR_URL" \
                || msg="🤖 ⚠️ Автофикс ($REASON): правки заявлены, но пуш не прошёл — $RUN_URL"
              ;;
            no-change)
              msg="🤖 🔧 Автофикс ($REASON): код не менял (замечания отклонены с обоснованием) — $PR_URL" ;;
            error)
              note="$(jq -r '.note // "без пояснения"' .fix-result.json 2>/dev/null || echo "без пояснения")"
              msg="🤖 ⚠️ Автофикс ($REASON) не справился: $note — нужен человек: $PR_URL"
              .github/scripts/trello.sh add-label "$CARD" "needs-human" "red" ;;
            *)
              msg="🤖 ⚠️ Автофикс ($REASON) упал, результата нет — см. Actions: $RUN_URL"
              .github/scripts/trello.sh add-label "$CARD" "needs-human" "red" ;;
          esac
          .github/scripts/trello.sh comment "$CARD" "$msg"
```

`if: always()` покрывает жёсткое падение прогона (таймаут, лимит): попытка уже заявлена комментом, а карточка получает честное «упал, см. Actions». `continue-on-error: true` — сбой Trello не красит прогон: код уже запушен.

- [ ] **Step 3: YAML-гейт**

Run: `ruby -ryaml -e "YAML.load_file('.github/workflows/trello-fix.yml'); puts 'yaml OK'"`
Expected: `yaml OK`

- [ ] **Step 4: Commit + push**

```bash
git add .github/workflows/trello-fix.yml
git commit -m "ci(autofix): post rebuttals to the PR and report the outcome to the card"
git push origin master
```

- [ ] **Step 5: Живая проверка полного пути**

Run:
```bash
gh workflow run trello-fix.yml --ref master -f branch="trello/<CARD>-autofix-test" -f reason=ci
```
Дождаться конца, затем открыть карточку `<CARD>` в Trello.
Expected: на карточке коммент `🤖 🔧 Автофикс (ci): починил, PR обновлён — https://github.com/…/pull/<n>`; карточка **не переехала** в другой список; метки `needs-human` нет.

- [ ] **Step 6: Проверить путь ошибки**

Временно сломать так, чтобы честный фикс был невозможен: тест требует экспорта из несуществующего модуля.
```bash
git checkout "trello/<CARD>-autofix-test" && git pull
cat > src/lib/autofix-probe.test.ts <<'EOF'
import { describe, it, expect } from 'vitest';
// @ts-expect-error deliberately unresolvable for the error-path test
import { nothing } from '@/does-not-exist';

describe('autofix probe', () => {
  it('cannot be honestly fixed inside this PR', () => {
    expect(nothing).toBe(true);
  });
});
EOF
git commit -am "test: unfixable probe for the autofix error path" && git push
gh api repos/{owner}/{repo}/issues/<n>/comments --jq '.[] | select(.body | startswith("🤖 автофикс")) | .id' \
  | xargs -I{} gh api -X DELETE repos/{owner}/{repo}/issues/comments/{}
gh workflow run trello-fix.yml --ref master -f branch="trello/<CARD>-autofix-test" -f reason=ci
```
Expected: прогон зелёный (это не сбой воркфлоу), пуша нет, на карточке `🤖 ⚠️ Автофикс (ci) не справился: …` и метка `needs-human`.

Приемлемая альтернатива: агент удаляет заведомо мусорный тест и объясняет это в `note`. Тогда проверить, что он **не** делал этого в Task 5 Step 5, где тест был осмысленным и чинибельным.

---

### Task 7: Событийная проверка (`workflow_run`) и негативные сценарии

**Files:**
- Изменений в репозитории нет. Задача — подтвердить, что автоматические триггеры срабатывают ровно там, где должны.

- [ ] **Step 1: Подготовить чистый тестовый PR**

```bash
git checkout "trello/<CARD>-autofix-test"
git reset --hard origin/master
cat > src/lib/autofix-probe.ts <<'EOF'
/** Probe for the autofix workflow. The implementation is deliberately wrong. */
export function sumProbe(a: number, b: number): number {
  return a - b;
}
EOF
cat > src/lib/autofix-probe.test.ts <<'EOF'
import { describe, it, expect } from 'vitest';
import { sumProbe } from './autofix-probe';

describe('sumProbe', () => {
  it('adds its two arguments', () => {
    expect(sumProbe(2, 3)).toBe(5);
  });
});
EOF
git add src/lib/autofix-probe.ts src/lib/autofix-probe.test.ts
git commit -m "test: deliberately failing probe for the autofix workflow"
git push --force-with-lease
gh api repos/{owner}/{repo}/issues/<n>/comments --jq '.[] | select(.body | startswith("🤖 автофикс")) | .id' \
  | xargs -I{} gh api -X DELETE repos/{owner}/{repo}/issues/comments/{}
```

- [ ] **Step 2: Проверить автозапуск по красному CI**

Пуш из шага 1 сам запустил `ci.yml`. Ничего не запускать руками.

Run (через ~2 минуты после того, как CI покраснел):
```bash
gh run list --workflow=trello-fix.yml --limit 3
```
Expected: появился прогон с событием `workflow_run`, стартовавший сам. Дождаться конца: в PR коммент `🤖 автофикс (ci)`, новый коммит в ветке, CI перезапустился и зелёный, в карточке `🤖 🔧 Автофикс (ci): починил…`. Тот же критерий, что в Task 5 Step 5: изменён исходник, тестовый файл не тронут.

- [ ] **Step 3: Проверить «сдался» на втором падении**

Снова сломать **исходник** и запушить (файл переписываем целиком — агент мог его переформатировать):
```bash
git checkout "trello/<CARD>-autofix-test" && git pull
cat > src/lib/autofix-probe.ts <<'EOF'
/** Probe for the autofix workflow. Broken a second time on purpose. */
export function sumProbe(a: number, b: number): number {
  return a * b;
}
EOF
git commit -am "test: break the probe again" && git push
```
Expected: CI краснеет → `trello-fix.yml` стартует сам → видит существующий `🤖 автофикс (ci)` → новых коммитов нет, в PR `🤖 ⚠️ Автофикс по причине \`ci\` уже применялся…`, в карточке то же + метка `needs-human`.

- [ ] **Step 4: Негатив — не-агентская ветка**

```bash
git checkout -b feature/autofix-negative master
# добавить такой же падающий пробник
git push -u origin feature/autofix-negative
gh pr create --base master --head feature/autofix-negative --title "negative test" --body "Do not merge."
```
Expected: CI краснеет, но `gh run list --workflow=trello-fix.yml --limit 3` **не** показывает нового прогона — гейт отсёк ветку без префикса `trello/`.

- [ ] **Step 5: Негатив — пуш в master**

Любой из коммитов этого плана в `master` уже запускал `deploy.yml`, но не `ci.yml`. Проверить, что за всё время работы по плану ни один прогон `trello-fix.yml` не стартовал от события `push`/`workflow_dispatch` deploy-а:
```bash
gh run list --workflow=trello-fix.yml --limit 20 --json event,headBranch,conclusion
```
Expected: в списке только события `workflow_dispatch`, `workflow_run` (по ветке `trello/…`) и `pull_request_review`.

---

### Task 8: Событийная проверка ревью CodeRabbit и уборка

**Files:**
- Изменений в репозитории нет.

- [ ] **Step 1: Подготовить PR с содержательным кодом**

CodeRabbit фильтрует `docs/**`, `**/*.md`, `src/content/locales/**`, `package-lock.json` — на них ревью не будет. Нужен PR, трогающий `src/**/*.ts(x)`.

```bash
git checkout "trello/<CARD>-autofix-test"
git reset --hard origin/master
cat > src/lib/autofix-probe.ts <<'EOF'
/** Probe helper for the CodeRabbit autofix path. */
export function readProbe(raw: any): { id: string; tags: string[] } {
  const parsed = JSON.parse(raw);
  parsed.tags.push('seen');
  return parsed;
}
EOF
cat > src/lib/autofix-probe.test.ts <<'EOF'
import { describe, it, expect } from 'vitest';
import { readProbe } from './autofix-probe';

describe('readProbe', () => {
  it('appends the seen tag', () => {
    expect(readProbe('{"id":"a","tags":[]}').tags).toEqual(['seen']);
  });
});
EOF
git add src/lib/autofix-probe.ts src/lib/autofix-probe.test.ts
git commit -m "test: probe helper for the CodeRabbit autofix path"
git push --force-with-lease
```

Приманка здесь плотная и ровно того сорта, на который CodeRabbit реагирует даже в профиле `chill`: `any` в публичной сигнатуре, необработанное исключение `JSON.parse`, мутация входного объекта и обращение к `parsed.tags` без проверки. Слабый повод (вроде отсутствующей проверки `min <= max`) в этом профиле вполне может дать `Actionable comments posted: 0`.

Дождаться, пока `ci.yml` на PR **позеленеет** — иначе сработает триггер `ci`, а не `review`. Удалить старые `🤖 автофикс`-комменты:
```bash
gh api repos/{owner}/{repo}/issues/<n>/comments --jq '.[] | select(.body | startswith("🤖 автофикс")) | .id' \
  | xargs -I{} gh api -X DELETE repos/{owner}/{repo}/issues/comments/{}
```

- [ ] **Step 2: Дождаться ревью CodeRabbit**

Run: `gh api repos/{owner}/{repo}/pulls/<n>/reviews --jq '.[] | select(.user.login=="coderabbitai[bot]") | {id, body: (.body[0:60])}'`
Expected: появилось ревью со строкой `Actionable comments posted: N`.

- [ ] **Step 3: Проверить автозапуск по ревью**

Run: `gh run list --workflow=trello-fix.yml --limit 3`
Expected (если `N > 0`): стартовал прогон с событием `pull_request_review`; по завершении в PR либо новый коммит с правками, либо коммент `🤖 Не принято, с обоснованием:` — либо и то и другое; в карточке `🤖 🔧 Автофикс (review): …`.

**Если `N == 0`** — это НЕ зачёт. «Прогона нет» подтверждает только негативную половину гейта, а сам триггер `review` останется непроверенным. Действия:
1. Запросить полное ревью — в `.coderabbit.yaml` включён `chat.auto_reply`, поэтому это работает:
   `gh pr comment <n> --body "@coderabbitai full review"`
2. Дождаться нового ревью и повторить проверку.
3. Если и после этого `N == 0` — **зафиксировать в отчёте по плану, что триггер `review` остался непроверенным** и будет подтверждён на первом реальном агентском PR с actionable-замечаниями. Не засчитывать как пройденное.

`workflow_dispatch -f reason=review` заменой не является: без ревью CodeRabbit на этом PR `review.body` пуст и агенту нечего разбирать — проверится сбор контекста, но не триггер.

- [ ] **Step 4: Убрать тестовые артефакты**

```bash
gh pr close <n> --delete-branch
gh pr close <негативный n> --delete-branch
```
В Trello удалить карточку `autofix test` (вместе с меткой `needs-human` на ней). Метка остаётся на доске — это нормально, она нужна боевому потоку.

Убедиться, что тестовые пробники **не** попали в `master`:
Run: `git checkout master && git pull && ls src/lib/autofix-probe.ts src/lib/autofix-probe.test.ts`
Expected: `No such file or directory` для обоих.

- [ ] **Step 5: Финальная проверка репозитория**

Run: `npm test && npx tsc --noEmit`
Expected: тесты зелёные, ошибок типов нет (изменения плана касались только `.github/` и `.gitignore`, но гоняем как обычно).

Run: `git status --short`
Expected: пусто.

---

## Итоговое состояние

- `.github/workflows/trello-fix.yml` — новый воркфлоу: три триггера, один job `fix`, 14 шагов
  (резолв → checkout → поиск PR → реестр → сдался/заявка → окружение → сбор контекста → Claude →
  push → возражения → отчёт в карточку).
- `.github/scripts/trello.sh` — сабкоманды `comment` и `add-label`.
- `.gitignore` — scratch-файлы агента (`.trello-*.json`, `.fix-*.json`).
- На доске появилась метка `needs-human` (красная).
- `trello-agent.yml`, `ci.yml`, `deploy.yml`, `.coderabbit.yaml` не изменены.
