# n8n Cloud → self-hosted Docker + PR→Done via Actions — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (inline). This plan is a **hybrid runbook + repo change**: Tasks 1–4 and 7–8 are infrastructure/UI steps (some are USER-only — the assistant prepares files and verifies via API), Tasks 5–6 are normal repo code changes. Steps use `- [ ]` tracking. The cutover order in Tasks 4 and 6 is the safety mechanism against double-firing — do NOT reorder those steps.

**Goal:** Move the Trello-board automation off n8n Cloud: Trello→dispatch and comment→dispatch run in self-hosted n8n (Docker on the mac, reachable via a permanent ngrok dev domain), and PR-merged→Done runs natively in GitHub Actions (24/7, no n8n involved).

**Architecture:** `~/docker/n8n/` compose stack (n8n 2.36.0 + ngrok agent side-car; SQLite in a named volume; UI on `127.0.0.1:5678` only; only webhooks go through the tunnel). A new `.github/workflows/trello-done.yml` fires on `pull_request: closed`, extracts the card id from the `trello/<card-id>-<slug>` branch name, and calls a new `trello.sh done` subcommand (move to Done + `🤖 ✅` comment). Cloud workflows are deactivated *before* their replacements are activated, verified via Trello/GitHub webhook APIs after every switch.

**Tech Stack:** Docker Compose, `docker.n8n.io/n8nio/n8n:2.36.0`, `ngrok/ngrok` (pinned at implementation time), bash + curl + jq, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-08-18-n8n-self-hosted-migration-design.md`

## Global Constraints

- **Image pins, never `latest`:** n8n `2.36.0`; ngrok pinned to the current tag when Task 2 runs (n8n runs SQLite migrations on start and does not support downgrade).
- **UI is localhost-only:** port binding `127.0.0.1:5678:5678`; the tunnel carries webhooks only. `N8N_SECURE_COOKIE` is NOT set. `N8N_HOST` is NOT set (`WEBHOOK_URL` is the documented knob for a public base behind a tunnel/proxy).
- **`N8N_ENCRYPTION_KEY` goes into `.env` BEFORE the first `up`** (`openssl rand -hex 32`). Changing it after credentials exist silently makes them undecryptable.
- **Timezone:** `GENERIC_TIMEZONE=Europe/Sofia` + `TZ=Europe/Sofia`.
- **Telemetry off:** `N8N_DIAGNOSTICS_ENABLED=false`.
- **Cutover order:** deactivate the Cloud copy → verify webhooks gone via API → only then activate the replacement → verify exactly one webhook. Never both copies active.
- **Card id from branch:** regex `^trello/([0-9a-f]+)-` on `pull_request.head.ref`.
- **No `${{ }}` interpolation of branch names into `run:`** — pass via `env:` (command-injection guard).
- **Comment marker/format:** `🤖 ✅ Смержено и задеплоено: <PR url> • https://bazha.github.io/archmentor/` (identical to the Cloud workflow it replaces).
- **Commits:** no Claude/Co-Authored-By attribution (repo convention).
- **Repo changes land via PR** (master is PR-gated): branch → PR → CI green → merge.

---

### Task 1: ngrok account, authtoken, permanent dev domain (USER)

**Files:** none.

**Interfaces:**
- Produces: `NGROK_AUTHTOKEN` (secret string) and `NGROK_DOMAIN` (permanent hostname like `xxx.ngrok-free.dev`) — consumed by Task 2's `.env`.

- [ ] **Step 1: Sign up / log in at https://dashboard.ngrok.com** (free plan).

- [ ] **Step 2: Copy the authtoken**

Dashboard → **Your Authtoken** → copy the value. This is `NGROK_AUTHTOKEN`.

- [ ] **Step 3: Get the assigned dev domain**

Dashboard → **Domains**. The free plan auto-assigns one permanent dev domain (`*.ngrok-free.dev`), tied to the account forever. Copy the full hostname **without scheme** — this is `NGROK_DOMAIN` (e.g. `abc123.ngrok-free.dev`).

- [ ] **Step 4: Hand both values to the assistant session** (they go only into `~/docker/n8n/.env`, never into the repo).

---

### Task 2: Local n8n + ngrok stack in `~/docker/n8n/`

**Files:**
- Create: `~/docker/n8n/.env` (never committed anywhere)
- Create: `~/docker/n8n/compose.yaml`
- Create: `~/docker/n8n/.gitignore`

**Interfaces:**
- Consumes: `NGROK_AUTHTOKEN`, `NGROK_DOMAIN` from Task 1.
- Produces: running n8n editor at `http://localhost:5678`; public webhook base `https://<NGROK_DOMAIN>/` — consumed by Tasks 3–4.

- [ ] **Step 1: Resolve the ngrok image pin**

```bash
curl -s "https://hub.docker.com/v2/repositories/ngrok/ngrok/tags?page_size=25&ordering=last_updated" \
  | jq -r '.results[].name' | grep -E '^3\.[0-9]+\.[0-9]+$' | head -3
```
Pick the newest `3.x.y` → use it as `<NGROK_TAG>` in compose.yaml below.

- [ ] **Step 2: Create the directory and `.env`**

```bash
mkdir -p ~/docker/n8n && cd ~/docker/n8n
key="$(openssl rand -hex 32)"
cat > .env <<EOF
N8N_ENCRYPTION_KEY=${key}
NGROK_DOMAIN=<from Task 1>
NGROK_AUTHTOKEN=<from Task 1>
EOF
chmod 600 .env
printf '.env\n' > .gitignore
```

- [ ] **Step 3: Write `compose.yaml`**

```yaml
services:
  n8n:
    image: docker.n8n.io/n8nio/n8n:2.36.0
    restart: unless-stopped
    ports:
      - "127.0.0.1:5678:5678"
    environment:
      - N8N_ENCRYPTION_KEY=${N8N_ENCRYPTION_KEY}
      - WEBHOOK_URL=https://${NGROK_DOMAIN}/
      - GENERIC_TIMEZONE=Europe/Sofia
      - TZ=Europe/Sofia
      - N8N_DIAGNOSTICS_ENABLED=false
    volumes:
      - n8n_data:/home/node/.n8n
  ngrok:
    image: ngrok/ngrok:<NGROK_TAG>
    restart: unless-stopped
    command: http n8n:5678 --url=${NGROK_DOMAIN}
    environment:
      - NGROK_AUTHTOKEN=${NGROK_AUTHTOKEN}
    depends_on:
      - n8n
volumes:
  n8n_data:
```

- [ ] **Step 4: Start and read the logs**

```bash
docker compose up -d && sleep 15 && docker compose logs n8n | tail -30
```
Expected: `Editor is now accessible via: http://localhost:5678`. If the 2.36 image logs deprecation/required-env warnings (e.g. around `N8N_RUNNERS_ENABLED`), add exactly the env vars it asks for to compose.yaml, `docker compose up -d` again, and re-check — add nothing it doesn't ask for.

- [ ] **Step 5: Verify the tunnel reaches n8n (programmatic path, not the browser)**

```bash
docker compose logs ngrok | grep -i "started tunnel\|url=" | tail -3
curl -s -H "ngrok-skip-browser-warning: 1" "https://${NGROK_DOMAIN}/webhook/definitely-missing" | head -c 200
```
Expected: an **n8n JSON 404** (`"The requested webhook ... is not registered"`) — proves ngrok→n8n wiring end-to-end. An ngrok HTML error page instead means the tunnel is up but pointed wrong.

- [ ] **Step 6 (USER): Create the owner account**

Open `http://localhost:5678` → first-run owner setup (email + password; community edition requires it).

- [ ] **Step 7: Prove persistence**

```bash
docker compose restart && sleep 15
```
Re-open `http://localhost:5678` → it must ask you to **log in** (not to create an owner again). That proves the named volume is wired correctly.

---

### Task 3: Export from Cloud, import locally, re-enter credentials (USER, assistant guides)

**Files:** none (n8n UI only).

**Interfaces:**
- Consumes: running local n8n from Task 2; the Trello token the user has on hand.
- Produces: both Trello workflows imported locally, credentials working, **workflows still INACTIVE** — consumed by Task 4.

- [ ] **Step 1 (USER): Export both workflows from Cloud**

At `https://bazhanau.app.n8n.cloud`: open each of the two Trello workflows (the In-Progress/commentCard→dispatch one, and the PR-merged→Done one) → menu (⋯) → **Download** → save both JSON files. The PR→Done JSON is exported only as a rollback artifact — it will NOT be imported (Task 6 replaces it natively).

- [ ] **Step 2 (USER): Import the Trello→dispatch workflow locally**

Local n8n (`http://localhost:5678`) → **Workflows → ⋯ → Import from File** → the Trello→dispatch JSON. Exported JSON carries only credential *references* (id + name), not secrets — nodes will show missing-credential warnings; that's expected.

- [ ] **Step 3 (USER): Create the Trello credential locally**

Open the imported workflow → click a Trello node → Credential dropdown → **Create new** → paste the Trello API key + token (the ones on hand; same values as the repo secrets `TRELLO_KEY`/`TRELLO_TOKEN`). Re-select this credential on every Trello node and on the Trello Trigger.

- [ ] **Step 4 (USER): Re-enter the GitHub credential for the dispatch node**

The workflow's GitHub/HTTP node that calls `workflow_dispatch` also lost its secret. Re-create its credential with a GitHub PAT that can dispatch workflows (classic `repo` scope, or fine-grained with **Actions: Read and write** on `bazha/archmentor`).

- [ ] **Step 5: Confirm both stay INACTIVE**

The Active toggle on the imported workflow must remain **off**. Activation happens only in Task 4 after the Cloud side is down.

---

### Task 4: Trello webhook cutover (the double-fire-critical part)

**Files:** none (n8n UIs + Trello API).

**Interfaces:**
- Consumes: imported inactive workflow (Task 3); Trello key/token for API checks.
- Produces: exactly one Trello webhook, pointing at `https://<NGROK_DOMAIN>/…`; event-driven dispatch working — consumed by Task 8.

- [ ] **Step 1 (USER): Deactivate both Trello workflows in Cloud**

At `bazhanau.app.n8n.cloud`, toggle **Active → off** on the Trello→dispatch workflow (and its commentCard twin if it is a separate workflow). Do not delete anything yet.

- [ ] **Step 2: Verify Cloud webhooks are gone (API, not eyeballs)**

```bash
curl -s "https://api.trello.com/1/tokens/${TRELLO_TOKEN}/webhooks?key=${TRELLO_KEY}" \
  | jq -r '.[] | "\(.callbackURL)  active=\(.active)"'
```
Expected: no `*.app.n8n.cloud` entries (list may be empty). If any linger, delete them:
```bash
curl -s -X DELETE "https://api.trello.com/1/webhooks/<WEBHOOK_ID>?key=${TRELLO_KEY}&token=${TRELLO_TOKEN}"
```

- [ ] **Step 3 (USER): Activate the local workflow**

Local n8n → the imported workflow → toggle **Active → on**. The Trello Trigger registers its webhook against `WEBHOOK_URL` (the ngrok domain) on activation.

- [ ] **Step 4: Verify exactly one webhook, pointing at ngrok**

Re-run the Step 2 curl. Expected: exactly the local n8n webhook(s), `callbackURL` starting `https://<NGROK_DOMAIN>/`, `active=true`, and zero `*.app.n8n.cloud` entries.

- [ ] **Step 5: Live dispatch test**

USER: move a scratch Trello card to **In Progress**. Then:
```bash
gh run list --workflow=trello-agent.yml --limit 3
```
Expected: a fresh `workflow_dispatch` run (within ~a minute). Also check the run appears in local n8n **Executions**. Move the scratch card back afterwards.

---

### Task 5: `trello.sh done` subcommand (repo change, on a branch)

**Files:**
- Modify: `.github/scripts/trello.sh` (header comment lines 2–6, new `cmd_done` after `cmd_add_label` ~line 122, dispatch `case` lines 124–130)

**Interfaces:**
- Consumes: existing helpers `move_card(cardId, listId)`, `comment(cardId, text)`, `log(msg)`; env `TRELLO_KEY`, `TRELLO_TOKEN`, `TRELLO_DONE_LIST_ID`.
- Produces: CLI `trello.sh done <cardId> <prUrl>` — consumed by Task 6's workflow. Non-fatal on move/comment failure (idempotent-by-intent).

- [ ] **Step 1: Create the branch**

```bash
git checkout master && git pull && git checkout -b ci/trello-done-workflow
```

- [ ] **Step 2: Add `cmd_done`**

After `cmd_add_label` (before the `case`), add:

```bash
cmd_done() { # $1 = card id, $2 = PR url — PR merged: card → Done + link comment.
  # Both calls are non-fatal: a card already in Done / deleted must not fail the run.
  if ! move_card "$1" "${TRELLO_DONE_LIST_ID:?TRELLO_DONE_LIST_ID required}"; then
    log "move to Done failed (already Done / deleted?) — continuing"
  fi
  comment "$1" "🤖 ✅ Смержено и задеплоено: $2 • https://bazha.github.io/archmentor/" \
    || log "comment failed (card deleted?)"
  log "done: $1"
}
```

Extend the dispatch `case` with:
```bash
  done)      cmd_done      "${2:?card id required}" "${3:?PR url required}" ;;
```
Update the `usage:` line to `{select-and-claim|finalize <cardId>|comment <cardId> <text>|add-label <cardId> <name> [color]|done <cardId> <prUrl>}` and the header comment (line 3) to list `done`; note in the header that `done` needs only `TRELLO_KEY TRELLO_TOKEN TRELLO_DONE_LIST_ID`.

- [ ] **Step 3: Syntax check**

```bash
bash -n .github/scripts/trello.sh && echo OK
```
Expected: `OK`.

- [ ] **Step 4: Live verification against the real board (repo has no bash test harness — real-API check is the convention)**

Note: `TRELLO_BOARD_ID`/list ids are write-only GitHub secrets — they can't be read back. Get the board id from the board URL: open the Trello board in a browser, take the short id from `https://trello.com/b/<SHORT>/…`; the lists curl below resolves it and prints every list id by name (both In Review and Done come from its output).

```bash
export TRELLO_KEY=… TRELLO_TOKEN=…   # user provides; never echo them
# All list ids by name (works with the short board id from the URL):
curl -s "https://api.trello.com/1/boards/<SHORT>/lists?fields=name&key=${TRELLO_KEY}&token=${TRELLO_TOKEN}" | jq -r '.[] | "\(.id)  \(.name)"'
export TRELLO_DONE_LIST_ID=<the Done id>       # also used as the secret value in Task 6
export TRELLO_INREVIEW_LIST_ID=<the In Review id>
# Scratch card in In Review:
cid="$(curl -s -X POST "https://api.trello.com/1/cards?idList=${TRELLO_INREVIEW_LIST_ID}&name=plan-test-done&key=${TRELLO_KEY}&token=${TRELLO_TOKEN}" | jq -r '.id')"
.github/scripts/trello.sh done "$cid" "https://github.com/bazha/archmentor/pull/0"
# Verify: card is in Done with the comment
curl -s "https://api.trello.com/1/cards/${cid}?fields=idList&key=${TRELLO_KEY}&token=${TRELLO_TOKEN}" | jq -r '.idList'   # == TRELLO_DONE_LIST_ID
curl -s "https://api.trello.com/1/cards/${cid}/actions?filter=commentCard&key=${TRELLO_KEY}&token=${TRELLO_TOKEN}" | jq -r '.[0].data.text'  # starts with "🤖 ✅"
# Idempotence: run again — must exit 0, not crash
.github/scripts/trello.sh done "$cid" "https://github.com/bazha/archmentor/pull/0" && echo "second run OK"
# Cleanup: archive the scratch card
curl -s -X PUT "https://api.trello.com/1/cards/${cid}?closed=true&key=${TRELLO_KEY}&token=${TRELLO_TOKEN}" >/dev/null
```

- [ ] **Step 5: Commit**

```bash
git add .github/scripts/trello.sh
git commit -m "ci(trello): add done subcommand (move card to Done + PR link comment)"
```

---

### Task 6: `trello-done.yml` workflow + secret + guarded merge

**Files:**
- Create: `.github/workflows/trello-done.yml`

**Interfaces:**
- Consumes: `trello.sh done <cardId> <prUrl>` from Task 5; repo secrets `TRELLO_KEY`, `TRELLO_TOKEN`, new `TRELLO_DONE_LIST_ID`.
- Produces: event-driven PR-merged→Done, independent of n8n/mac — the spec's missing-fallback fix.

- [ ] **Step 1: Set the new repo secret**

```bash
gh secret set TRELLO_DONE_LIST_ID --body "<Done list id from Task 5 Step 4>"
```

- [ ] **Step 2: Write `.github/workflows/trello-done.yml`**

```yaml
name: Trello card to Done

on:
  pull_request:
    types: [closed]

permissions:
  contents: read

jobs:
  done:
    # Only merged agent PRs (branch trello/<card-id>-<slug>); closes-without-merge and
    # non-agent branches are filtered here, so the job doesn't even start for them.
    if: github.event.pull_request.merged == true && startsWith(github.event.pull_request.head.ref, 'trello/')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Move card to Done + comment
        env:
          TRELLO_KEY: ${{ secrets.TRELLO_KEY }}
          TRELLO_TOKEN: ${{ secrets.TRELLO_TOKEN }}
          TRELLO_DONE_LIST_ID: ${{ secrets.TRELLO_DONE_LIST_ID }}
          # Branch name goes through env, NOT ${{ }} inside run: — injection guard.
          HEAD_REF: ${{ github.event.pull_request.head.ref }}
          PR_URL: ${{ github.event.pull_request.html_url }}
        run: |
          card_id="$(sed -nE 's#^trello/([0-9a-f]+)-.*#\1#p' <<<"$HEAD_REF")"
          if [ -z "$card_id" ]; then echo "no card id in '$HEAD_REF' — nothing to do"; exit 0; fi
          chmod +x .github/scripts/trello.sh
          .github/scripts/trello.sh done "$card_id" "$PR_URL"
```

- [ ] **Step 3: Commit and open the PR**

```bash
git add .github/workflows/trello-done.yml
git commit -m "ci(trello): move card to Done on agent PR merge (native Actions, no n8n)"
git push -u origin ci/trello-done-workflow
gh pr create --base master --title "ci(trello): PR merged -> card to Done natively in Actions" \
  --body "Replaces the n8n Cloud PR->Done workflow. Spec: docs/superpowers/specs/2026-08-18-n8n-self-hosted-migration-design.md"
```

- [ ] **Step 4 (USER, BEFORE merging): Deactivate the Cloud PR→Done workflow**

At `bazhanau.app.n8n.cloud`, toggle **Active → off** on the PR-merged→Done workflow. Doing this before the merge closes the double-fire window (both copies must never be live at once; the brief coverage gap is harmless — no agent PRs are merged during it).

- [ ] **Step 5: Merge after CI is green**

```bash
gh pr checks --watch && gh pr merge --merge
```
This merge is itself a negative test: the branch is `ci/…`, not `trello/…`, so once the workflow lands, later `pull_request: closed` events for non-agent branches must show the `done` job **skipped** (condition false), not run.

---

### Task 7: Decommission the Cloud GitHub webhook

**Files:** none (GitHub API).

**Interfaces:**
- Consumes: `gh` авторизован на `bazha/archmentor`.
- Produces: zero repo webhooks pointing at n8n Cloud.

- [ ] **Step 1: Find and delete the Cloud hook**

```bash
gh api repos/bazha/archmentor/hooks -q '.[] | "\(.id)  \(.config.url)"'
gh api -X DELETE "repos/bazha/archmentor/hooks/<HOOK_ID>"   # the …app.n8n.cloud/webhook/2c410993… one
```

- [ ] **Step 2: Verify empty**

```bash
gh api repos/bazha/archmentor/hooks -q 'length'
```
Expected: `0` (native `on: pull_request` needs no webhook).

---

### Task 8: End-to-end acceptance + rollback hold

**Files:** none.

- [ ] **Step 1: Full-loop test (USER moves the card, assistant watches)**

Create a small real card → move to **In Progress** → local n8n Executions shows a run → `gh run list --workflow=trello-agent.yml` shows the dispatch → agent opens a PR → USER merges it → `gh run list --workflow=trello-done.yml` shows a run → card lands in **Done** with exactly ONE `🤖 ✅` comment (one comment = no double-firing survived the cutover).

- [ ] **Step 1b: Close-without-merge negative test**

Open a throwaway PR from a `trello/000000000000000000000000-noop` branch (one whitespace commit) and **close it without merging**. Expected: `gh run list --workflow=trello-done.yml` shows the run with the `done` job **skipped** (`merged == false` fails the `if:`), and no Trello card is touched. Delete the branch afterwards.

- [ ] **Step 2: needs-info re-trigger test**

If Step 1's card came back `needs-info`: reply with a plain comment (no `🤖`) → local n8n fires → new `trello-agent.yml` run. An agent `🤖` comment must NOT produce a run.

- [ ] **Step 3: Final webhook audit (both sides)**

```bash
curl -s "https://api.trello.com/1/tokens/${TRELLO_TOKEN}/webhooks?key=${TRELLO_KEY}" | jq -r '.[] | "\(.callbackURL)  active=\(.active)"'
gh api repos/bazha/archmentor/hooks -q 'length'
```
Expected: only `https://<NGROK_DOMAIN>/…` entries with `active=true`; GitHub hooks `0`.

- [ ] **Step 4: Cold-restart persistence**

```bash
cd ~/docker/n8n && docker compose down && docker compose up -d && sleep 15
```
(No `-v`! `down -v` deletes the volume.) Log in at `http://localhost:5678`: workflow still there, still **Active**, credentials intact. Re-run Step 3's Trello curl — webhook still `active=true`.

- [ ] **Step 5 (USER): Rollback hold**

Do NOT delete the n8n Cloud account yet — keep it (all workflows deactivated) for one week, until ~2026-08-25. Rollback = toggle Cloud workflows back on + deactivate local + re-add the GitHub hook is NOT needed (native workflow just stays).
