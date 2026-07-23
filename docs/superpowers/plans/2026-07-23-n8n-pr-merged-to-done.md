# n8n: PR merged → Trello Done — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (inline). This plan is an **n8n UI + Trello runbook** — there is NO repository code change. The user builds the workflow in n8n Cloud; the assistant helps verify by merging a test PR and watching `gh`. Steps use `- [ ]` tracking.

**Goal:** When an agent PR (`trello/<card-id>-*`) is merged, an n8n workflow moves the matching Trello card to **Done** and posts a comment with the PR + site link.

**Architecture:** A separate n8n workflow: GitHub Trigger (`pull_request`) → Filter (merged + `trello/` branch) → Trello node (move card to Done) → Trello node (comment). Card id is extracted from the PR head branch name. No repo changes.

**Tech Stack:** n8n Cloud (`bazhanau.app.n8n.cloud`), GitHub webhook, Trello API.

## Global Constraints

- **No repository changes.** Everything lives in n8n + one Trello list (Done).
- **Card id source:** the agent names branches `trello/<card-id>-<slug>`; extract with `trello/([0-9a-f]+)-` from `pull_request.head.ref`.
- **Only act on merged agent PRs:** `action == "closed"` AND `pull_request.merged == true` AND `head.ref` starts with `trello/`.
- **Comment marker:** the comment starts with `🤖` (consistency with the pipeline).
- **Site URL:** `https://bazha.github.io/archmentor/`.
- **JSON path caveat:** the exact path of the GitHub payload in n8n (`$json.…` vs `$json.body.…`) is confirmed from a real event in Task 3 before finalizing the Filter/expressions — same approach used for the Trello Trigger.

---

### Task 1: Prerequisites — Done list + GitHub credential (USER)

- [ ] **Step 1: Ensure a Done list exists and get its id**

On the Trello board, create a **Done** list if there isn't one. Get its id (your terminal):
```
curl -s "https://api.trello.com/1/boards/{BOARD_ID}/lists?fields=name&key={KEY}&token={TOKEN}" | jq '.[] | {id, name}'
```
Note the `id` of the **Done** list → this is `DONE_LIST_ID`.

- [ ] **Step 2: GitHub credential in n8n**

In n8n → **Credentials → New → GitHub API** (or the credential the GitHub Trigger asks for). Use a GitHub token that can manage repo webhooks:
- Fine-grained PAT on `bazha/archmentor`: **Webhooks: Read and write** + **Metadata: Read** (+ Pull requests: Read to read payloads).
- Or classic PAT: `repo` + `admin:repo_hook`.
Save; "Connection tested successfully" confirms auth (not the webhook yet — that's created on Activate).

---

### Task 2: Build the n8n workflow (USER, in n8n UI)

- [ ] **Step 1: GitHub Trigger node**

New workflow → add **GitHub Trigger**:
- Credential: the GitHub credential from Task 1.
- Repository Owner: `bazha`, Repository Name: `archmentor`.
- Events: **Pull Request** (`pull_request`).

- [ ] **Step 2: Filter node** (only merged agent PRs)

Add **Filter** after the trigger. One condition, **Boolean → is true**, left = Expression:
```
{{ $json.action === 'closed' && $json.pull_request.merged === true && ($json.pull_request.head.ref || '').startsWith('trello/') }}
```
(If Task 3's test shows the payload is nested under `body`, prefix paths with `body.` — e.g. `$json.body.action`.)

- [ ] **Step 3: Trello node — move card to Done**

Add **Trello** node after Filter:
- Resource: **Card**, Operation: **Update**.
- Card ID (Expression): `{{ $json.pull_request.head.ref.match(/trello\/([0-9a-f]+)-/)[1] }}`
- Update field: **List ID** = `DONE_LIST_ID` (from Task 1).
- Node **Settings → Continue On Fail: ON** (a missing/renamed card must not break the run).

- [ ] **Step 4: Trello node — comment**

Add another **Trello** node:
- Resource: **Card Comment** (a.k.a. Comment), Operation: **Create**.
- Card ID (Expression): `{{ $('GitHub Trigger').item.json.pull_request.head.ref.match(/trello\/([0-9a-f]+)-/)[1] }}`
- Text (Expression):
  ```
  🤖 ✅ Смержено и задеплоено: {{ $('GitHub Trigger').item.json.pull_request.html_url }} • https://bazha.github.io/archmentor/
  ```

- [ ] **Step 5: Save**

Save the workflow. Wire: GitHub Trigger → Filter → Trello(move) → Trello(comment).

---

### Task 3: Activate + confirm the webhook and payload shape

- [ ] **Step 1: Activate**

Toggle the workflow **Active** → n8n registers a `pull_request` webhook on `bazha/archmentor`.

- [ ] **Step 2: Confirm the webhook exists**

GitHub → repo **Settings → Webhooks** should list an n8n webhook (`…app.n8n.cloud/webhook/…`) for pull_request events. (Or `gh api repos/bazha/archmentor/hooks -q '.[].config.url'`.)

- [ ] **Step 3: Confirm payload path**

Trigger any PR event (e.g., open a throwaway PR, or use an existing one) → open the n8n Execution → **GitHub Trigger** OUTPUT. Verify the payload path: is it `$json.action` / `$json.pull_request…` (top-level) or under `$json.body…`? If nested, update the Filter and both Card-ID expressions in Task 2 accordingly. (Paste the OUTPUT here if unsure — I'll give exact expressions.)

---

### Task 4: Live end-to-end test

- [ ] **Step 1: Merge an agent PR**

Merge one of the open `trello/<id>-*` PRs (e.g. via GitHub UI or `gh pr merge <n> --squash`). The assistant can do this and record the card id from the branch name.

- [ ] **Step 2: Verify**

- n8n **Executions**: a run fired, Filter **Kept**, both Trello nodes green.
- Trello board: the card `<id>` moved from **In Review** to **Done**, with a comment `🤖 ✅ Смержено и задеплоено: <pr-url> • <site>`.
- Assistant confirms the merge + deploy via `gh run list --workflow="Deploy to GitHub Pages"`.

- [ ] **Step 3: Negative checks**

- Close a throwaway PR **without** merging → workflow does NOT move any card (Filter discards).
- (Optional) A non-`trello/` PR merge → ignored.

---

## Self-Review

**Spec coverage:**
- §GitHub Trigger on pull_request → Task 2 Step 1.
- §Filter (merged + trello/ branch) → Task 2 Step 2.
- §Card id from branch → Task 2 Steps 3–4 (regex `trello/([0-9a-f]+)-`).
- §Move to Done + comment (🤖, PR + site) → Task 2 Steps 3–4.
- §Prereqs (Done list, GitHub credential) → Task 1.
- §Edge cases (continue-on-fail; no-merge/non-trello ignored) → Task 2 Step 3 (continue on fail), Task 4 Step 3.
- §No repo change → confirmed (plan touches only n8n + Trello).

**Placeholder scan:** no TBD; every node has concrete config + expressions. `DONE_LIST_ID`, `{BOARD_ID}`, `{KEY}`, `{TOKEN}` are user-supplied values (not placeholders in deliverable code) — this is a runbook.

**Consistency:** card-id regex identical in the move and comment nodes; comment marker `🤖` and site URL match the spec; branch pattern `trello/<card-id>-` matches how the agent names branches (verified against merged PRs `trello/6a60bb21…-sidebar-home-link`, `trello/6a622a5c…-source-code-pro-font`).

**Payload-path risk:** flagged (Task 3 Step 3) — the GitHub-Trigger JSON path is confirmed from a real event before relying on it, mirroring how the Trello Trigger path was verified.

## Execution Handoff

n8n-UI + Trello runbook (no repo code). **Inline Execution** (superpowers:executing-plans): you build the workflow in n8n and create the Done list (Tasks 1–3); I merge a `trello/*` PR and watch `gh` for the live test (Task 4), you confirm the Trello move. Which approach?
