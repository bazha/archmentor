# Trello Agent Comment Dialogue — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (inline) — this plan is credential/live-interactive (real Trello board, n8n UI, a real CI run). Steps use `- [ ]` tracking. Tasks 1–2 are repo code (automated `bash -n` / yaml gates); Task 3 is an n8n UI change (user); Task 4 is a live end-to-end check.

**Goal:** Turn a `needs-info` Trello card into a two-way dialogue: the user answers in a comment, and the agent resumes — reading the comment history, then implementing or asking more.

**Architecture:** All Trello writes stay in `.github/scripts/trello.sh` (deterministic). Agent vs user comments are told apart by a `🤖` prefix (same Trello account posts both). `select-and-claim` re-includes a `needs-info` card when its latest comment is NOT the agent's, clears `needs-info`, and passes comment history to the agent via `.trello-card.json`. n8n re-triggers on `commentCard`. Loop safety: agent comments start with `🤖`, so they are ignored by both the n8n filter and the re-eligibility rule.

**Tech Stack:** bash + curl + jq, GitHub Actions, n8n Cloud, `anthropics/claude-code-action@v1`.

## Global Constraints

- Only the Trello-agent pipeline changes: `.github/scripts/trello.sh`, `.github/workflows/trello-agent.yml`, and the n8n Filter. The app is NOT touched.
- **Agent-comment marker:** every comment the agent/script posts to Trello MUST start with `🤖`. Detection of "user replied" relies on it.
- **In Progress list id:** `6a60b020daa8e07f3df0e6c4`.
- **Loop safety:** a comment starting with `🤖` must never re-trigger a run (guarded in n8n filter AND in `select-and-claim`).
- **Answering:** the user answers with a Trello **comment** (not a description edit) — the resume rule looks at comments.
- Automated gates: `bash -n .github/scripts/trello.sh`; `ruby -ryaml -e "YAML.load_file(...)"` for the workflow. Functional behavior verified live (Task 4) — there is no bash unit harness in this repo.
- Commit messages: no Claude/Co-Authored-By/"Generated with" attribution.

---

### Task 1: `trello.sh` — read comments, marker, re-eligibility

**Files:**
- Modify: `.github/scripts/trello.sh`

- [ ] **Step 1: Add the marker constant and two comment helpers**

After the `move_card()` line (line 22), add:

```bash
AGENT_MARKER="🤖"
# Latest comment text on a card ("" if none). Used to detect a user reply.
latest_comment_text() { api_get "/cards/$1/actions?filter=commentCard&limit=1" | jq -r '.[0].data.text // ""'; }
# Up to 20 comments, oldest→newest, as [{text,date}] — passed to the agent for context.
card_comments()       { api_get "/cards/$1/actions?filter=commentCard&limit=20" | jq '[ .[] | {text: .data.text, date: .date} ] | reverse'; }
```

- [ ] **Step 2: Replace `cmd_select_and_claim` with the re-eligibility version**

Replace the whole `cmd_select_and_claim() { ... }` function with:

```bash
cmd_select_and_claim() {
  local wip info cards row cid has_info last card id name reopened=0
  wip="$(ensure_label "claude:wip" "yellow")"
  info="$(ensure_label "needs-info" "orange")"
  log "labels: wip=$wip needs-info=$info"
  cards="$(list_cards "$TRELLO_INPROGRESS_LIST_ID")"

  # Candidates: no claude:wip, sorted by pos. A needs-info card is eligible ONLY if
  # its latest comment is the user's reply (not agent-marked, not empty).
  card=""
  while IFS= read -r row; do
    [[ -z "$row" ]] && continue
    cid="$(jq -r '.id' <<<"$row")"
    has_info="$(jq -r --arg i "$info" '((.idLabels|index($i)) != null)' <<<"$row")"
    if [[ "$has_info" == "true" ]]; then
      last="$(latest_comment_text "$cid")"
      case "$last" in
        "$AGENT_MARKER"*) continue ;;   # agent asked last → still waiting on the user
        "")               continue ;;   # no reply yet
      esac
      reopened=1
    fi
    card="$row"; break
  done < <(echo "$cards" | jq -c --arg w "$wip" '[ .[] | select(.idLabels|index($w)|not) ] | sort_by(.pos) | .[]')

  if [[ -z "$card" ]]; then log "no eligible card"; exit 0; fi
  id="$(jq -r '.id' <<<"$card")"
  name="$(jq -r '.name' <<<"$card")"
  log "selected: $name ($id) reopened=$reopened"
  jq --argjson comments "$(card_comments "$id")" '{id, name, desc} + {comments: $comments}' <<<"$card" > "$CARD_FILE"
  [[ "$reopened" == "1" ]] && remove_label "$id" "$info"
  add_label "$id" "$wip"
  comment "$id" "🤖 Взял в работу. Ветка и PR появятся здесь."
  echo "$id"   # stdout = card id only
}
```

- [ ] **Step 3: Prefix every finalize comment with `🤖`**

In `cmd_finalize`, change the comment texts so all start with `🤖` (only the `comment` lines change):

```bash
    comment "$id" "🤖 ⚠️ Прогон не дал результата (инфраструктура/агент). Карточка возвращена в очередь для повтора. См. Actions-лог."
```
```bash
        comment "$id" "🤖 ⚠️ Код готов, но PR открыть не удалось (см. Actions-лог). Карточка возвращена в очередь."
```
```bash
        comment "$id" "🤖 ✅ Готово. PR: $pr"
```
For the `needs-info` case, change the comment to (also asks the user to reply by comment):
```bash
      comment "$id" "🤖 ❓ Нужны уточнения — ответьте комментарием, и я продолжу:
$q"
```
And the error case:
```bash
      comment "$id" "🤖 ⚠️ Ошибка: $note (см. Actions-лог)."
```

- [ ] **Step 4: Syntax gate**

Run: `bash -n .github/scripts/trello.sh && echo OK`
Expected: `OK`. If `shellcheck` is available: `shellcheck .github/scripts/trello.sh` (advisory).

---

### Task 2: Orchestrator prompt — use the comment history

**Files:**
- Modify: `.github/workflows/trello-agent.yml` (the `prompt:` block of the "Run Claude on the card" step)

- [ ] **Step 1: Update the prompt to read `comments`**

Replace the current prompt body (lines 60–81) with:

```yaml
          prompt: |
            You are running UNATTENDED in CI (no human to answer questions live). Implement ONE
            Trello card as a pull request in THIS repository (your current working directory).
            Never merge or deploy; never touch Trello (the workflow does that).

            Read the card from ./.trello-card.json  (fields: id, name, desc, comments).
            `comments` is the prior conversation, oldest→newest: YOUR earlier questions start with
            "🤖"; the user's answers do NOT. Treat the user's answers as clarifications to the task.

            Write your machine-readable outcome to ./.trello-result.json with schema:
            {"status":"pr"|"needs-info"|"error","prUrl":"","branch":"","questions":[],"note":""}

            Procedure:
            1. Using name + desc + the answers in `comments`, judge if the task is now clear enough
               and small enough for one focused PR. If it is STILL too vague/ambiguous/large, do NOT
               write code — write {"status":"needs-info","questions":["...specific remaining
               questions..."]} and stop. (The workflow will post them and ask the user to reply.)
            2. Otherwise (light cycle): create a branch trello/<card-id>-<short-slug>. Write a SHORT
               spec + plan under docs/superpowers/. Implement via TDD. Keep scope to the card.
            3. Run `npm test` and `npx tsc --noEmit`; both MUST be green. If not, write
               {"status":"error","note":"tests/tsc red: ..."} and stop.
            4. Commit with NO Claude/Co-Authored-By/"Generated with" attribution. Do NOT push and do
               NOT open a PR — a later CI step pushes the branch and opens the PR (so it is authored
               by the repo owner, not a bot). Just commit locally on the branch. Do NOT merge/deploy.
            5. Write {"status":"pr","branch":"<branch>"}  (leave prUrl empty — CI fills it).

            Constraints: no new dependencies unless the card requires them; follow CLAUDE.md and
            existing patterns; never print secrets. Always write ./.trello-result.json before exiting.
```

- [ ] **Step 2: Yaml gate**

Run: `ruby -ryaml -e "YAML.load_file('.github/workflows/trello-agent.yml'); puts 'yaml OK'"`
Expected: `yaml OK`.

- [ ] **Step 3: Commit Tasks 1–2**

```bash
git add .github/scripts/trello.sh .github/workflows/trello-agent.yml
git commit -m "feat(trello-agent): two-way comment dialogue (read comments, resume on user reply, 🤖 marker)"
```

---

### Task 3: n8n Filter — re-trigger on a user comment (USER, in n8n UI)

The n8n workflow currently fires only on card moves. Extend the Filter to ALSO pass a `commentCard` whose text is not agent-marked. (Board-level: the workflow's `select-and-claim` is the real gate — it only resumes In Progress `needs-info` cards — so a stray comment elsewhere is a harmless no-op dispatch.)

- [ ] **Step 1: Switch the Filter condition to a single Boolean expression**

In the n8n **Filter** node, delete the current string-equals condition and add one condition:
- **Left value** → Expression mode → paste:
  ```
  {{ ( $json.action.type === 'updateCard' && ($json.action.data.listAfter?.id || $json.action.data.list?.id) === '6a60b020daa8e07f3df0e6c4' ) || ( $json.action.type === 'commentCard' && !( ($json.action.data.text || '').startsWith('🤖') ) ) }}
  ```
- **Data type:** Boolean
- **Operator:** **is true** (right side stays empty/true)

- [ ] **Step 2: Save + Activate**

Save the workflow and confirm it is **Active**. (No new Trello webhook needed — the same board webhook already delivers `commentCard` events; only the Filter changed.)

- [ ] **Step 3: Sanity check in n8n**

Post a plain comment (no `🤖`) on any In Progress card → Executions shows a run whose Filter is **Kept**. Post/observe a `🤖`-prefixed comment (or let the agent post one) → Filter **Discarded** (loop-safe).

---

### Task 4: Live end-to-end verification

- [ ] **Step 1: Bounce**

Put a deliberately vague card in In Progress (or move one). Trigger a run (n8n on move, or `gh workflow run "Trello task agent"`). Expected: card gets `🤖 ❓ Нужны уточнения — ответьте комментарием…` + `needs-info` label; no PR.

- [ ] **Step 2: Reply resumes it**

Add a Trello **comment** (no `🤖`) answering the questions with enough detail. Expected (within ~1 min via n8n commentCard): a new run; `select-and-claim` reopens the card (`needs-info` removed, `claude:wip` added), the agent sees the answer in `comments`, and either opens a PR or asks a narrower follow-up.

Verify the run and reopen:
```
gh run list --workflow="Trello task agent" --limit 3
```

- [ ] **Step 3: Loop-safety**

Confirm the agent's own `🤖` comments did NOT spawn extra runs (the count of runs matches your actions, not the agent's comments). Check n8n Executions: `🤖` comment events show Filter **Discarded**.

- [ ] **Step 4: No regression on the normal path**

Move a clear, well-scoped card into In Progress → it still goes straight to a PR (no needs-info), card → In Review. Confirms the move-trigger path is intact.

---

## Self-Review

**Spec coverage:**
- §Агент читает комменты → Task 1 Step 1 (`card_comments`) + json `comments`; Task 2 (prompt reads them).
- §Повторный подхват (needs-info + latest comment not agent) → Task 1 Step 2 (re-eligibility loop; reopen removes `needs-info`).
- §Маркер `🤖` на всех агент-комментах → Task 1 Step 3 (finalize) + existing "Взял в работу".
- §Ре-триггер n8n commentCard → Task 3.
- §Защита от петли → Task 1 (`case "$AGENT_MARKER"*`), Task 3 (`!startsWith('🤖')`); Task 4 Step 3 verifies.
- §Ответ комментом → Task 1 needs-info comment text asks for it; Task 4 Step 2.
- §Границы (только пайплайн) → no app files touched.

**Placeholder scan:** no TBD/TODO; every code step shows complete code; every gate has an exact command + expected output. Task 3 is a UI runbook by nature (no repo file) — its steps are concrete (exact expression + toggles).

**Consistency:** `AGENT_MARKER="🤖"` used in `select-and-claim` matches the `🤖` prefix on every finalize/claim comment and the n8n `startsWith('🤖')` filter. In Progress list id `6a60b020daa8e07f3df0e6c4` matches the n8n expression and the existing filter. `.trello-card.json` gains `comments`, which the prompt now reads.

**Note (no unit tests):** `trello.sh` is bash with no bats harness in this repo (consistent with how it shipped); correctness is gated by `bash -n` + the Task 4 live checks. That is the established testing approach for this tooling, not a gap introduced here.

## Execution Handoff

Credential/live-interactive (real Trello board, n8n UI, a real CI run). **Recommended: Inline Execution** (superpowers:executing-plans): I make the repo edits (Tasks 1–2, gated by `bash -n`/yaml) and push; you do the n8n Filter change (Task 3) and we run the live check (Task 4) together. Which approach?
