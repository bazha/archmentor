# Trello Task-Queue Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. NOTE: this plan is credential- and machine-interactive (real Trello token, cron on the user's machine, a real headless `claude` run) — inline execution with the user is expected for Tasks 1, 3-verify, and 4.

**Goal:** A local polling agent that picks the top card from a Trello "In Progress" list, implements it on a branch, opens a PR, and moves the card to "In Review" — with clarify-and-skip for vague cards.

**Architecture:** All under `~/.claude-work/trello-agent/`. `trello-lib.sh` wraps the Trello REST API. `poll.sh` (run by cron every 10 min) owns ALL Trello mutations: lock → select top unclaimed In-Progress card → claim (label+comment) → run headless `claude` on it → finalize (move/comment/label) from the model's `result.json`. `orchestrator.md` is the prompt the model runs; the model touches only code + PR, never Trello.

**Tech Stack:** bash, `curl`, `jq` (all present), `gh` (authed as `bazha`), headless `claude`, macOS `cron` (no `flock` → `mkdir` lock).

## Global Constraints

- **Location:** `~/.claude-work/trello-agent/` (NOT the repo). Nothing here is committed to the archmentor repo. `REPO_DIR` (the archmentor checkout) is where code work happens: `/Users/arthur/Documents/work/learna`.
- **Headless claude invocation (cron-safe, exact):** `CLAUDE_CONFIG_DIR="$HOME/.claude-work" /Users/arthur/.local/bin/claude -p "<prompt>" --dangerously-skip-permissions`. The interactive `claude` shell alias is a stub and must NOT be used; cron has no aliases. `--dangerously-skip-permissions` is required for unattended runs — the safety net is the branch+PR review gate (no auto-merge/deploy).
- **Trello REST base:** `https://api.trello.com/1`. Auth on every call via `key=$TRELLO_KEY&token=$TRELLO_TOKEN`. Comments posted with `curl --data-urlencode`.
- **Boundary:** branch + PR only. The agent NEVER merges or deploys. Card success → moved to In Review; vague → `needs-info` label + questions comment, left in In Progress; error → `claude:wip`+`needs-info` (no re-pickup) + note.
- **Claiming / no double-pickup:** `mkdir` lock (macOS has no `flock`) + label lock `claude:wip` applied BEFORE launching claude. Candidate = In-Progress card with neither `claude:wip` nor `needs-info` label; pick lowest `.pos`. One card per run.
- **Secrets:** `.env` chmod 600, never printed to logs/PR/card/commits; Trello creds are NOT passed into the claude run's environment (only `poll.sh` needs them).
- **Commit messages** (in the repo, made by the headless run) contain no Claude/Co-Authored-By/"Generated with" attribution.
- **Automated gates for script tasks:** `bash -n <script>` (syntax) and, if installed, `shellcheck <script>`. Functional gates use the user's real `.env` (dry-run; single `--card` run).

---

### Task 1: `trello-lib.sh` + `.env` scaffold + connectivity check

Thin, sourceable wrappers over the Trello API, plus the secrets file. Deliverable: `./poll.sh` isn't built yet, but sourcing the lib and running a connectivity check lists real In-Progress cards.

**Files:**
- Create: `~/.claude-work/trello-agent/.env` (user fills; chmod 600)
- Create: `~/.claude-work/trello-agent/.env.example`
- Create: `~/.claude-work/trello-agent/trello-lib.sh`
- Create: `~/.claude-work/trello-agent/check.sh` (connectivity smoke test)

**Interfaces:**
- Produces (sourceable functions, all echo raw API JSON to stdout):
  - `trello_get "<path-with-query>"` — GET helper, injects key/token
  - `trello_list_cards "<listId>"` — cards of a list (`fields=name,desc,idLabels,pos`)
  - `trello_board_labels` — board labels
  - `trello_create_label "<name>" "<color>"` — returns created label JSON
  - `trello_add_label "<cardId>" "<labelId>"`, `trello_remove_label "<cardId>" "<labelId>"`
  - `trello_comment "<cardId>" "<text>"` (uses `--data-urlencode`)
  - `trello_move_card "<cardId>" "<listId>"`

- [ ] **Step 1: Create the directory and secrets files**

USER STEP (interactive — real credentials). Run:

```bash
mkdir -p ~/.claude-work/trello-agent/runs
cd ~/.claude-work/trello-agent
```

Get a Trello API key + token: open `https://trello.com/power-ups/admin`, create a Power-Up (any name), copy its **API key**; on the same page use the **Token** link to generate a token (grant read/write). Then find the board id and the two list ids:
- Board id: open the board in a browser, append `.json` to the URL, search for `"id"` near the top — or `curl "https://api.trello.com/1/members/me/boards?fields=name&key=KEY&token=TOKEN"`.
- List ids: `curl "https://api.trello.com/1/boards/BOARD_ID/lists?fields=name&key=KEY&token=TOKEN"` → note the ids of **In Progress** and **In Review**.

Write `.env.example` (committed-style reference, no secrets):

```bash
cat > .env.example <<'EOF'
TRELLO_KEY=your_api_key
TRELLO_TOKEN=your_token
TRELLO_BOARD_ID=your_board_id
TRELLO_INPROGRESS_LIST_ID=list_id_in_progress
TRELLO_INREVIEW_LIST_ID=list_id_in_review
REPO_DIR=/Users/arthur/Documents/work/learna
CLAUDE_BIN=/Users/arthur/.local/bin/claude
CLAUDE_CONFIG_DIR=/Users/arthur/.claude-work
EOF
```

Create the real `.env` from it and fill values, then lock permissions:

```bash
cp .env.example .env
# edit .env with real values (use: ! nano .env  or your editor)
chmod 600 .env
```

- [ ] **Step 2: Write `trello-lib.sh`**

```bash
# ~/.claude-work/trello-agent/trello-lib.sh
# Sourceable Trello REST helpers. Requires: TRELLO_KEY, TRELLO_TOKEN in env.
set -euo pipefail
API="https://api.trello.com/1"

_auth() { echo "key=${TRELLO_KEY}&token=${TRELLO_TOKEN}"; }

trello_get() { # $1 = path (may contain ?query)
  local sep="?"; [[ "$1" == *\?* ]] && sep="&"
  curl -fsS "${API}$1${sep}$(_auth)"
}
trello_list_cards() { # $1 = listId
  trello_get "/lists/$1/cards?fields=name,desc,idLabels,pos"
}
trello_board_labels() { trello_get "/boards/${TRELLO_BOARD_ID}/labels?fields=name,color"; }
trello_create_label() { # $1=name $2=color
  curl -fsS -X POST "${API}/labels?$(_auth)" \
    --data-urlencode "name=$1" --data-urlencode "color=$2" \
    --data-urlencode "idBoard=${TRELLO_BOARD_ID}"
}
trello_add_label()    { curl -fsS -X POST   "${API}/cards/$1/idLabels?value=$2&$(_auth)"; }
trello_remove_label() { curl -fsS -X DELETE "${API}/cards/$1/idLabels/$2?$(_auth)"; }
trello_comment()      { curl -fsS -X POST "${API}/cards/$1/actions/comments?$(_auth)" --data-urlencode "text=$2"; }
trello_move_card()    { curl -fsS -X PUT  "${API}/cards/$1?idList=$2&$(_auth)"; }
```

- [ ] **Step 3: Write `check.sh` (connectivity smoke test)**

```bash
# ~/.claude-work/trello-agent/check.sh
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
set -a; source ./.env; set +a
source ./trello-lib.sh
echo "Board labels:"; trello_board_labels | jq -r '.[] | "  \(.name // "(none)") [\(.color)] \(.id)"'
echo "In Progress cards:"; trello_list_cards "$TRELLO_INPROGRESS_LIST_ID" | jq -r '.[] | "  \(.name)  (pos \(.pos), labels \(.idLabels|length))"'
```

- [ ] **Step 4: Syntax-check the scripts**

Run: `bash -n ~/.claude-work/trello-agent/trello-lib.sh && bash -n ~/.claude-work/trello-agent/check.sh && echo OK`
Expected: `OK`. If `shellcheck` is installed: `shellcheck ~/.claude-work/trello-agent/*.sh` (advisory).

- [ ] **Step 5: Run the connectivity check (needs real `.env`)**

Run: `chmod +x ~/.claude-work/trello-agent/check.sh && ~/.claude-work/trello-agent/check.sh`
Expected: prints the board's labels and the current In-Progress cards. This confirms key/token/board/list ids are correct. (No commit — these files live outside git.)

---

### Task 2: `poll.sh` — lock, select, ensure labels, claim, dry-run

The core selector. Builds on Task 1's lib. Deliverable: `poll.sh --dry-run` selects the top eligible card and prints the plan with zero mutations; label ids are resolved (creating `claude:wip`/`needs-info` if missing).

**Files:**
- Create: `~/.claude-work/trello-agent/poll.sh`

**Interfaces:**
- Consumes: `trello-lib.sh` functions; `.env`.
- Produces: `poll.sh [--dry-run] [--card <id>]`. Selection rule: lowest-`.pos` In-Progress card whose `idLabels` contains neither the `claude:wip` nor `needs-info` label id.

- [ ] **Step 1: Write `poll.sh` (selection + claim + dry-run; run/finalize stubbed)**

```bash
# ~/.claude-work/trello-agent/poll.sh
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
set -a; source ./.env; set +a
source ./trello-lib.sh

DRY=0; FORCE_CARD=""
while [[ $# -gt 0 ]]; do case "$1" in
  --dry-run) DRY=1;;
  --card) FORCE_CARD="$2"; shift;;
  *) echo "unknown arg: $1" >&2; exit 2;;
esac; shift; done

TS="$(date +%Y%m%d-%H%M%S)"
RUNDIR="./runs/$TS"; mkdir -p "$RUNDIR"
LOG="$RUNDIR/run.log"
log() { echo "[$(date +%H:%M:%S)] $*" | tee -a "$LOG"; }

# --- lock (macOS has no flock): atomic mkdir ---
LOCK="./.lock"
if ! mkdir "$LOCK" 2>/dev/null; then log "another run holds the lock; exiting"; exit 0; fi
trap 'rmdir "$LOCK" 2>/dev/null || true' EXIT

# --- ensure the two control labels exist; resolve their ids ---
ensure_label() { # $1=name $2=color -> echoes id
  local id
  id="$(trello_board_labels | jq -r --arg n "$1" '.[] | select(.name==$n) | .id' | head -1)"
  if [[ -z "$id" ]]; then id="$(trello_create_label "$1" "$2" | jq -r '.id')"; fi
  echo "$id"
}
WIP_LABEL="$(ensure_label "claude:wip" "yellow")"
INFO_LABEL="$(ensure_label "needs-info" "orange")"
log "labels: wip=$WIP_LABEL needs-info=$INFO_LABEL"

# --- select candidate ---
CARDS_JSON="$(trello_list_cards "$TRELLO_INPROGRESS_LIST_ID")"
if [[ -n "$FORCE_CARD" ]]; then
  CARD="$(echo "$CARDS_JSON" | jq -c --arg id "$FORCE_CARD" '.[] | select(.id==$id)')"
else
  CARD="$(echo "$CARDS_JSON" | jq -c --arg w "$WIP_LABEL" --arg i "$INFO_LABEL" \
    '[ .[] | select((.idLabels | index($w) | not) and (.idLabels | index($i) | not)) ] | sort_by(.pos) | .[0] // empty')"
fi
if [[ -z "$CARD" || "$CARD" == "null" ]]; then log "no eligible card; exiting"; exit 0; fi

CARD_ID="$(echo "$CARD" | jq -r '.id')"
CARD_NAME="$(echo "$CARD" | jq -r '.name')"
CARD_DESC="$(echo "$CARD" | jq -r '.desc')"
log "selected: $CARD_NAME ($CARD_ID)"

if [[ "$DRY" == "1" ]]; then
  log "DRY-RUN: would claim (label claude:wip + comment), run claude, then finalize. No changes made."
  exit 0
fi

# --- claim ---
trello_add_label "$CARD_ID" "$WIP_LABEL" >/dev/null
trello_comment "$CARD_ID" "🤖 Взял в работу. Ветка и PR появятся здесь." >/dev/null
log "claimed"

# --- run + finalize are added in Task 3 ---
log "TODO(Task 3): run headless claude and finalize"
```

- [ ] **Step 2: Syntax-check**

Run: `bash -n ~/.claude-work/trello-agent/poll.sh && echo OK`
Expected: `OK`.

- [ ] **Step 3: Dry-run selection (needs real `.env`, safe — no mutation)**

Run: `chmod +x ~/.claude-work/trello-agent/poll.sh && ~/.claude-work/trello-agent/poll.sh --dry-run`
Expected: log shows resolved label ids and either "selected: <card>" (top eligible In-Progress card) or "no eligible card". Verify on the board that NO label/comment was added (dry-run mutates nothing except it may CREATE the two control labels if absent — that's intended and harmless).

---

### Task 3: `orchestrator.md` + headless run + `result.json` finalize

Wire the model in. Deliverable: a real card run — clear card → branch+PR+card moved to In Review; vague card → `needs-info` + questions.

**Files:**
- Create: `~/.claude-work/trello-agent/orchestrator.md`
- Modify: `~/.claude-work/trello-agent/poll.sh` (replace the Task-2 "TODO(Task 3)" tail)

**Interfaces:**
- Consumes: `poll.sh` claim state (`CARD_ID`, `CARD_NAME`, `CARD_DESC`, `RUNDIR`, `WIP_LABEL`, `INFO_LABEL`).
- Produces: model writes `$RUNDIR/result.json` = `{ "status": "pr"|"needs-info"|"error", "prUrl": "", "branch": "", "questions": [], "note": "" }`.

- [ ] **Step 1: Write `orchestrator.md` (the prompt template; `{{...}}` filled by poll.sh)**

```markdown
You are running UNATTENDED (headless, no human to answer questions). You implement ONE Trello
card as a pull request in the local repo. You must NOT touch Trello (the wrapper script does
that) and you must NOT merge or deploy.

Repo: {{REPO_DIR}} (this is your working directory)
Card id: {{CARD_ID}}
Card title: {{CARD_NAME}}
Card description:
{{CARD_DESC}}

Write your machine-readable outcome to this exact file when done: {{RESULT_FILE}}
Schema: {"status":"pr"|"needs-info"|"error","prUrl":"","branch":"","questions":[],"note":""}

Procedure:
1. Judge whether the card is clear enough to implement CONFIDENTLY. If it is too vague,
   ambiguous, or too large for one focused PR, DO NOT write code. Write
   {"status":"needs-info","questions":["...concrete blocking questions..."]} and stop.
2. Otherwise (light cycle): create a branch `trello/{{CARD_ID}}-<short-slug>`. Write a SHORT
   spec + plan under docs/superpowers/ (a few lines each — the card is the source of truth).
   Implement via TDD (test first). Keep scope strictly to the card.
3. Run `npm test` and `npx tsc --noEmit`. Both MUST be green. If they cannot be made green,
   write {"status":"error","note":"tests/tsc red: ..."} and stop (do NOT open a PR).
4. Commit (NO Claude/Co-Authored-By/"Generated with" attribution). Push the branch.
   `gh pr create --fill` (title from the card). Do NOT merge.
5. Write {"status":"pr","prUrl":"<url>","branch":"<branch>"}.

Constraints: no new dependencies unless the card explicitly requires them; follow existing repo
patterns and CLAUDE.md; never print secrets. If anything blocks you unrecoverably, write
status:"error" with a note rather than guessing wildly.
```

- [ ] **Step 2: Replace the `poll.sh` tail with run + finalize**

Replace the final `log "TODO(Task 3): ..."` line with:

```bash
# --- build prompt from template ---
RESULT_FILE="$RUNDIR/result.json"
PROMPT="$(sed \
  -e "s|{{REPO_DIR}}|$REPO_DIR|g" \
  -e "s|{{CARD_ID}}|$CARD_ID|g" \
  -e "s|{{RESULT_FILE}}|$(pwd)/$RESULT_FILE|g" \
  ./orchestrator.md)"
# inject name/desc safely (may contain slashes/newlines) via awk-free here-substitution
PROMPT="${PROMPT//\{\{CARD_NAME\}\}/$CARD_NAME}"
PROMPT="${PROMPT//\{\{CARD_DESC\}\}/$CARD_DESC}"

# --- run headless claude in the repo ---
log "running claude…"
( cd "$REPO_DIR" && CLAUDE_CONFIG_DIR="$CLAUDE_CONFIG_DIR" "$CLAUDE_BIN" -p "$PROMPT" \
    --dangerously-skip-permissions ) >"$RUNDIR/claude.stdout" 2>&1 || true

# --- finalize from result.json ---
if [[ ! -f "$RESULT_FILE" ]]; then
  log "no result.json — treating as error"
  trello_add_label "$CARD_ID" "$INFO_LABEL" >/dev/null
  trello_comment "$CARD_ID" "⚠️ Прогон не дал результата. См. лог: $RUNDIR" >/dev/null
  trello_remove_label "$CARD_ID" "$WIP_LABEL" >/dev/null
  exit 0
fi
STATUS="$(jq -r '.status' "$RESULT_FILE")"
log "result: $STATUS"
case "$STATUS" in
  pr)
    PR="$(jq -r '.prUrl' "$RESULT_FILE")"
    trello_comment "$CARD_ID" "✅ Готово. PR: $PR" >/dev/null
    trello_move_card "$CARD_ID" "$TRELLO_INREVIEW_LIST_ID" >/dev/null
    trello_remove_label "$CARD_ID" "$WIP_LABEL" >/dev/null
    ;;
  needs-info)
    Q="$(jq -r '.questions[]? | "• " + .' "$RESULT_FILE")"
    trello_comment "$CARD_ID" "❓ Нужны уточнения:
$Q" >/dev/null
    trello_add_label "$CARD_ID" "$INFO_LABEL" >/dev/null
    trello_remove_label "$CARD_ID" "$WIP_LABEL" >/dev/null
    ;;
  *)
    NOTE="$(jq -r '.note // "unknown error"' "$RESULT_FILE")"
    trello_comment "$CARD_ID" "⚠️ Ошибка: $NOTE. Лог: $RUNDIR" >/dev/null
    trello_add_label "$CARD_ID" "$INFO_LABEL" >/dev/null
    trello_remove_label "$CARD_ID" "$WIP_LABEL" >/dev/null
    ;;
esac
log "done"
```

- [ ] **Step 3: Syntax-check**

Run: `bash -n ~/.claude-work/trello-agent/poll.sh && echo OK`
Expected: `OK`.

- [ ] **Step 4: Live test — a CLEAR small test card**

USER/CONTROLLER STEP. On the board, add a small unambiguous card to In Progress (e.g. "Add a `title` attribute to the sidebar brandmark link with text 'ArchMentor home'"). Then:

Run: `~/.claude-work/trello-agent/poll.sh --card <that-card-id>`
Expected: claims the card; a real `claude` run creates a `trello/<id>-…` branch, tests+tsc green, opens a PR; the card gets a "✅ Готово. PR: <url>" comment, moves to In Review, and loses `claude:wip`. Verify the PR exists (`gh pr list`) and is NOT merged. Review the actual diff before doing anything with it.

- [ ] **Step 5: Live test — a VAGUE card (bounce)**

Add a deliberately vague card ("make the app better"). Run `poll.sh --card <id>`.
Expected: card gets a "❓ Нужны уточнения" comment with questions + `needs-info` label, `claude:wip` removed, stays in In Progress, NO branch/PR created.

---

### Task 4: cron install + README + go-live

Schedule it and document. Deliverable: the poller runs every 10 min; a README explains operation and the manual unlock.

**Files:**
- Create: `~/.claude-work/trello-agent/README.md`

- [ ] **Step 1: Write `README.md`**

Contents: what it does; the board convention (In Progress = queue, In Review = done-by-agent, labels `claude:wip`/`needs-info`); how to run manually (`check.sh`, `poll.sh --dry-run`, `poll.sh --card <id>`); how to unlock a stuck card (remove `claude:wip` label in Trello, delete `./.lock` dir if a run crashed); where logs live (`runs/<ts>/`); the security note (`.env` 600, no secrets in PRs); the explicit boundary (branch+PR only, human merges/deploys).

- [ ] **Step 2: Provide the cron line (USER STEP — do NOT enable until Task 3 live tests pass)**

`crontab -e` and add (every 10 minutes):

```
*/10 * * * * /Users/arthur/.claude-work/trello-agent/poll.sh >> /Users/arthur/.claude-work/trello-agent/cron.log 2>&1
```

Note: cron runs with a minimal environment. `poll.sh` sources `.env` and uses absolute paths for `CLAUDE_BIN`, so it is self-contained. Verify `jq`, `curl`, `gh` are on the cron PATH (they are in `/usr/bin` / `/opt/homebrew/bin`; if not, prepend `PATH=` in the crontab). macOS may require granting `cron`/Terminal Full Disk Access to touch the repo.

- [ ] **Step 3: One supervised cron cycle, then leave enabled**

After the manual live tests pass, drop one clear card in In Progress and wait for the next 10-min tick (or run `poll.sh` once by hand). Confirm `cron.log` shows a clean cycle and the PR appears. From then on it runs unattended.

---

## Self-Review

**Spec coverage (each spec section → task):**
- §Поток happy path → Task 2 (select/claim) + Task 3 (run/finalize/move).
- §Обработка краёв (bounce, skip-by-label, one-per-run) → Task 2 selection filter + Task 3 needs-info/error branches.
- §Компоненты (.env, poll.sh, orchestrator.md, cron) → Tasks 1–4.
- §Trello-конвенция (In Progress/In Review, labels) → Task 1 (label ensure) + Task 4 README.
- §Безопасность (600, no secrets, gh existing auth) → Task 1 Step 1 (chmod) + Global Constraints.
- §Надёжность (lock, stuck-lock manual unlock, API errors) → Task 2 `mkdir` lock; Task 4 README unlock; `curl -fsS` + `|| true` around the run.
- §Тестирование (dry-run, clear card, vague card) → Task 2 Step 3, Task 3 Steps 4–5.
- §Границы v1 → respected: polling only, one repo, one card/run, branch+PR only.

**Placeholder scan:** the `{{...}}` tokens in `orchestrator.md` are intentional template variables filled by `poll.sh` Step 2 of Task 3 (documented) — not TODO placeholders. No "TBD". The Task-2 `poll.sh` intentionally stubs the run/finalize tail and Task 3 replaces that exact line — called out explicitly.

**Consistency:** `WIP_LABEL`/`INFO_LABEL`/`CARD_ID`/`CARD_NAME`/`CARD_DESC`/`RUNDIR`/`RESULT_FILE` names are consistent between Task 2 and Task 3. The headless invocation matches the resolved `claude-work` alias exactly (`CLAUDE_CONFIG_DIR=~/.claude-work /Users/arthur/.local/bin/claude`). `result.json` schema is identical in `orchestrator.md` and the finalize `case`.

**Risk note carried from spec:** `--dangerously-skip-permissions` grants the unattended run broad local access; the branch+PR gate (never merge/deploy) is the mitigation. First live runs are supervised (Task 3) before cron is enabled (Task 4).

## Execution Handoff

This plan is credential- and machine-interactive (real Trello token in Task 1; a real headless `claude` run + board cards in Task 3; `crontab` on your machine in Task 4). **Recommended: Inline Execution** (superpowers:executing-plans) so you can paste the token, confirm board/list ids, and watch the first live runs together — a fresh subagent can't supply your credentials. Subagent-driven would only fit the pure script-authoring steps (Task 1 Step 2, Task 2 Step 1, Task 3 Steps 1–2). Which approach?
