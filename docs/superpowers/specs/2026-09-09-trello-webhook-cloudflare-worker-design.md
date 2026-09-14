# Trello webhook: self-hosted n8n on the mac → Cloudflare Worker — design

**Date:** 2026-09-09
**Status:** design approved, ready for a plan

## Goal

Remove the last dependency the board automation has on a laptop being awake.

Today the event path "card → In Progress → agent run" goes through an ngrok tunnel into an n8n
container on the mac. While the mac sleeps, Trello retries three times (30s / 60s / 120s) and then
drops the delivery — the event is lost silently, and the card only starts on the hourly cron
fallback.

Meanwhile n8n has degenerated into a single HTTP redirect with a single condition: all the logic
(card selection, `claude:wip`, `needs-info`, the comment dialogue) lives in
`.github/scripts/trello.sh` and works off board state, not off the webhook payload. So what moves to
Cloudflare is not "n8n" but ~50 lines of code: accept the webhook → filter it → fire
`workflow_dispatch`.

A secondary but important goal: move the double-fire filter out of an n8n GUI node and into code
under test. Today that expression cannot be tested or reviewed, and it disappears along with the
Docker volume.

## Verified Trello facts (not from memory)

Source: developer.atlassian.com/cloud/trello/guides/rest-api/webhooks/

- On webhook creation Trello synchronously issues an **HTTP HEAD** to the `callbackURL`; if the
  response is not `200`, the webhook **is not created**. The handler must answer HEAD.
- A broken SSL certificate on the `callbackURL` also blocks creation (no certificate at all does
  not). `*.workers.dev` serves a valid Cloudflare certificate.
- On a failed delivery: **3 retries at 30s / 60s / 120s**, then Trello drops the event.
- Automatic webhook deactivation requires 30 days of uninterrupted failures **and** 1000+ failed
  deliveries at once — so a sleeping mac does not kill the webhook. The problem is strictly the lost
  events.
- The `X-Trello-Webhook` signature is base64 of an HMAC-SHA1 over the request body concatenated with
  the `callbackURL`, keyed by the application secret. We do not use it (see decision 3).

## Key decisions

1. **A thin stateless Worker, not a port of n8n.** One `fetch` handler. No KV, Queues, Durable
   Objects or Cron Triggers. Deduplication is unnecessary: the filter guards against the paired
   `updateCard`, `concurrency: trello-agent` in the workflow guards against overlapping runs, and the
   `claude:wip` label guards against claiming a card twice.

2. **No domain needed.** `*.workers.dev` gives a free HTTPS endpoint with no DNS, zone or Route. The
   URL is composed as `https://<name from wrangler.toml>.<account subdomain>.workers.dev`. The
   subdomain is chosen once per account and is effectively permanent (changing it breaks every
   `workers.dev` address on the account), so we take a neutral one tied to the handle rather than to
   this project: **`bazhanau`**, giving `https://trello-webhook.bazhanau.workers.dev`. The Cloudflare
   account already exists (`bazhanau.arthur@gmail.com`), `wrangler login` is done, and the
   `account_id` lives in project memory. Cloudflare Tunnel (the old "option C") was rejected
   precisely because it would have required a domain.

3. **Authentication is a secret path segment**, not signature verification. `POST
   /trello/<WEBHOOK_TOKEN>`, where the token is `openssl rand -hex 32`. Rationale: HMAC verification
   needs the Trello application secret (one more secret, plus the non-obvious "body + callbackURL"
   concatenation) and buys little — a spurious dispatch is nearly harmless, because
   `select-and-claim` re-reads the board and exits with "no eligible card" when there is nothing to
   do. Path comparison is plain string equality: a timing attack against 256 bits of entropy over a
   public edge is impractical. Rotating the token means recreating the webhook with a new path.

4. **A separate narrow PAT, not a copy of `GH_PAT`.** Fine-grained, scoped to the
   `bazha/archmentor` repository only, with `Actions: write` only (plus `Metadata: read`, which
   GitHub adds itself). Blast radius if leaked: "can trigger one workflow". `GH_PAT` can push to
   master, so a copy of it inside the Worker would mean that leaking the Worker equals leaking write
   access to the repository.

5. **Sources live in this repository**, under `workers/trello-webhook/`. That is the only way to get
   the filter under `npm test` and behind the CI gate; it is the whole point of the migration.

6. **Manual deploys, no auto-deploy.** A "push → deploy" workflow would require a Cloudflare API
   token with `workers:write` in GitHub Secrets — a new leakable credential that can rewrite the code
   which triggers our own CI. The filter changes about twice a year; it is a bad trade. The deploy
   command goes into the runbook instead.

7. **`account_id` is not committed.** The repository is public. It is passed via
   `CLOUDFLARE_ACCOUNT_ID` (the value lives in the runbook / project memory). It is not a secret, but
   there is no reason to publish it either.

8. **The hourly cron in `trello-agent.yml` stays.** It costs nothing and now covers a Worker or
   GitHub API outage instead of "the mac fell asleep".

## Architecture

### 1. Layout

```
workers/trello-webhook/
  index.ts        — fetch handler: routing, HEAD, path check, dispatch
  filter.ts       — shouldDispatch(action, inProgressListId) — pure function, no Worker globals
  filter.test.ts  — Vitest
  wrangler.toml   — deploy config (no account_id, no secrets)
  tsconfig.json   — its own, with Workers types
```

Inside the existing npm project, with no second `package.json`: `wrangler` and the Workers types go
into the root `devDependencies`. The root Vitest picks up `filter.test.ts` through its default
`include` (`**/*.test.ts` outside `node_modules`), so `vite.config.ts` needs no change; `filter.ts`
is plain TS, so the jsdom environment is irrelevant to it.

The root `tsc --noEmit` does not see the Worker: `tsconfig.json` sets `include: ["src"]`. Hence the
Worker gets its own `tsconfig.json` and a
`"typecheck:worker": "tsc --noEmit -p workers/trello-webhook/tsconfig.json"` script, wired as a step
in `ci.yml`. Without it the Worker would be nominally in git but outside the gate — the same
unverifiability we are leaving the GUI node to escape.

### 2. Handler contract

```
HEAD  any path                → 200            (Trello's requirement at webhook creation)
POST  /trello/<WEBHOOK_TOKEN> → parse + filter
everything else               → 404
```

Outcomes for a `POST` on the correct path:

| situation | response | why |
|---|---|---|
| filter said no | `200` | Trello is satisfied, no retries |
| dispatch succeeded (GitHub → `204`) | `200` | |
| dispatch failed (5xx, network) | `500` | Trello will run its 3 retries — a short GitHub API outage is absorbed for free, with no queue of our own |
| dispatch returned `401`/`403` | `500` + an explicit "PAT expired or lost its permissions" log | the most likely silent failure, see "Operations" |
| body does not parse / no `action` | `200` + log | nothing to retry |

Dispatch: `POST https://api.github.com/repos/{GITHUB_REPO}/actions/workflows/{WORKFLOW_FILE}/dispatches`
with body `{"ref": GIT_REF}` and headers `Authorization: Bearer <GH_DISPATCH_TOKEN>`,
`Accept: application/vnd.github+json`, `User-Agent: trello-webhook-worker`. Success is `204`.

### 3. The filter

```ts
export function shouldDispatch(
  action: unknown,
  inProgressListId: string,
): { dispatch: boolean; reason: string }
```

Two rules, exactly as in n8n today:

1. `action.type === 'updateCard'` **and** `action.data.listAfter?.id === inProgressListId`.
2. `action.type === 'commentCard'` **and** the text does not start with `🤖` (the agent marker).

Everything else is `false`. The reason comes back as a string: it feeds both the log and the test
messages.

**Only `listAfter`, never `data.list.id`.** A single card drag produces two `updateCard` actions (the
list change and the `pos` adjustment), and only the first carries `listAfter`; `data.list.id` is
present on any edit of a card already sitting in In Progress and causes false triggers. This is the
most expensively earned fact in the system — it was found and fixed on 2026-08-25. Note:
`docs/superpowers/plans/2026-07-23-trello-agent-comment-dialogue.md:175` has the **old, incorrect**
form of the expression committed, with the `|| $json.action.data.list?.id` fallback. That is a
historical artifact; `filter.ts` becomes the source of truth. Do not copy the expression from that
plan.

We deliberately do not check "is the card in In Progress" for comments: `select-and-claim` re-reads
the board anyway and decides for itself which card qualifies. A spurious dispatch costs ~20 seconds
of runner time.

### 4. Config and secrets

`wrangler.toml` (committed and public — public values only):

```toml
name = "trello-webhook"
main = "index.ts"
compatibility_date = "2026-09-09"
workers_dev = true

[vars]
GITHUB_REPO   = "bazha/archmentor"
WORKFLOW_FILE = "trello-agent.yml"
GIT_REF       = "master"
```

Secrets go in through `npx wrangler secret put <NAME>` (encrypted on Cloudflare's side, never read
back, only overwritten):

| secret | value | purpose |
|---|---|---|
| `GH_DISPATCH_TOKEN` | a new fine-grained PAT, 1 year expiry | triggering `trello-agent.yml` |
| `TRELLO_INPROGRESS_LIST_ID` | the In Progress list id | filter input |
| `WEBHOOK_TOKEN` | `openssl rand -hex 32` | the secret path segment |

`TRELLO_INPROGRESS_LIST_ID` is kept as a secret for consistency with GitHub Secrets, even though it
is no longer truly secret: the id leaked into `docs/superpowers/plans/2026-07-23-…md` back in July.
We will not ratify that leak by moving the id into a public `wrangler.toml`.

The Worker needs no Trello key or token at all — it never calls the Trello API. That alone shrinks
the attack surface compared to n8n, where the Trello credential sat in a SQLite volume on the mac.

## Data flow

```
Trello (board webhook)
  → POST https://trello-webhook.<subdomain>.workers.dev/trello/<WEBHOOK_TOKEN>
  → Worker: path check → shouldDispatch(action, INPROGRESS_LIST_ID)
  → POST .../actions/workflows/trello-agent.yml/dispatches  {"ref":"master"}
  → GitHub Actions: trello-agent.yml  (unchanged)
      → .github/scripts/trello.sh select-and-claim  (unchanged)
      → claude-code-action → branch + commit → CI opens the PR under GH_PAT
      → trello.sh finalize
  → [PR merged] → trello-done.yml → card to Done  (outside this migration, already native)
```

## Migration order (all the risk lives here)

1. First deploy: `npx wrangler deploy` — Cloudflare asks for the workers.dev subdomain, creates the
   Worker and prints the URL. Between the deploy and step 2 the endpoint is safe: `WEBHOOK_TOKEN` is
   unset, the path comparison matches nothing, and everything but HEAD gets a `404`.
2. `wrangler secret put` × 3.
3. `curl -sI <URL with the secret path>` → `200`. **Before** deleting the old webhook: if the Worker
   does not answer 200, Trello will refuse to create the new one and we would be left with no event
   path at all.
4. Inventory the webhooks (never count by eye):
   `curl -s "https://api.trello.com/1/tokens/$TRELLO_TOKEN/webhooks?key=$TRELLO_KEY" | jq -r '.[] | "\(.id)  \(.callbackURL)  active=\(.active)"'`
   Expect a single entry pointing at the ngrok domain.
5. `cd ~/docker/n8n && docker compose stop` — no `down`, no `-v`.
6. `DELETE /1/webhooks/<id>` — the old webhook.
7. `POST /1/webhooks` — the new one: `callbackURL=<Worker URL with the secret path>`,
   `idModel=<board id — taken from project memory, never written into the repository>`,
   `description=trello-agent via cloudflare worker`.
8. Verify `jq 'length'` → `1`.

The "delete first, then create" order is mandatory: two live webhooks on one board produce two
dispatches per drag. The coverage gap between steps 6 and 7 is seconds long and is covered by the
hourly cron.

## Testing

**Unit (Vitest; fixtures are real Trello payloads trimmed to the fields in use):**

- drag into In Progress → `dispatch: true`
- the paired pos-only `updateCard` from the same drag → `false`
- an edit of a card already sitting in In Progress → `false` ← the `data.list.id` regression
- a move into any other list → `false`
- `commentCard` from the user → `true`
- `commentCard` starting with `🤖` → `false`
- garbage payload with no `data` / no `type` → `false`, without throwing

**Locally, without starting the agent:** `npx wrangler dev` + `curl` with a fixture. In the local
environment we leave `GH_DISPATCH_TOKEN` unset — the filter runs for real, the dispatch gets a `401`,
and the logs show "route and filter are correct" while no actual agent run happens.

**Acceptance on the live board (all three are mandatory):**

- *Positive:* card → In Progress; within seconds `gh run list --workflow=trello-agent.yml` shows
  **exactly one** run. Two runs mean the `listAfter` filter is not working. Then the usual cycle
  through to Done with a single `🤖 ✅` comment.
- *Negative (the important one):* rename a card already sitting in In Progress → no new runs. This
  checks a real Trello payload rather than our fixture.
- *Dialogue:* reply with a comment on a `needs-info` card → a run appears; the agent's own `🤖`
  comment → no run.

## Teardown (only after acceptance, in two steps)

Step 1, immediately: `docker compose down` — **without `-v`**, so the `n8n_data` volume survives.

And **before** deleting the directory, extract the Trello credentials:
`mkdir -p ~/.config/trello && cp ~/docker/n8n/trello.env ~/.config/trello/env && chmod 600 ~/.config/trello/env`.
The token is write-only in GitHub Secrets, and `~/docker/n8n/trello.env` is the only copy at hand.
Losing it means reissuing the token, and reissuing kills every webhook of the old token — that is,
the automation itself.

Step 2, after a week of normal operation: `docker compose down -v`, delete `~/docker/n8n`, remove the
images, release the reserved ngrok domain, delete the ngrok account. Delete the n8n Cloud account
too (kept as a rollback until 2026-09-01) — after this migration no form of n8n remains.

**Rollback** before step 2 costs two commands: `docker compose up -d` plus re-registering the webhook
against the ngrok domain. After `down -v` rollback is impossible: the volume takes the credentials
and the n8n workflow itself with it.

## Operations and observability

There will be no Executions tab with run history and input payloads any more — an honest
degradation. What remains is `npx wrangler tail` (a live stream, only while you watch) and dashboard
metrics; we will enable Workers Logs and check what the free tier provides. So the Worker logs
deliberately: `action.type`, the card id, the filter verdict with its reason, and the GitHub response
code.

**The landmine: the PAT expires in a year.** After that the Worker starts silently receiving `401`
while the hourly cron keeps picking cards up — the breakage will not look like breakage, it will look
like "things got slower". Hence: the expiry date is recorded in project memory, and the Worker writes
an explicit message to the log on `401`/`403`. A GitHub App with a non-expiring installation token
would be more correct, but that is a separate entity with a private key and a JWT exchange for the
sake of one POST — disproportionate.

Deploy: `CLOUDFLARE_ACCOUNT_ID=<account_id from project memory> npx wrangler deploy --config workers/trello-webhook/wrangler.toml`.

## Repository changes

The migration does not touch application code.

- `.github/workflows/trello-agent.yml` — two comment lines in the header (`n8n triggers this` →
  Worker) and a reworded description of the cron's role: it covers a Worker or GitHub API outage, not
  a sleeping mac.
- `.github/workflows/ci.yml` — a `typecheck:worker` step.
- `package.json` — two devDependencies (`wrangler`, the Workers types) and the `typecheck:worker`
  script.
- Project memory (the n8n file) — rewritten wholesale: stack, webhook URL, where the secrets live,
  the PAT expiry date, the deploy command.

## Edge cases

**A duplicate dispatch caused by a lost response.** Trello's retries resend the same payload. If
GitHub returned 5xx and answered `204` on the retry, there is exactly one dispatch and all is well.
But if the dispatch actually succeeded and only the response was lost (a timeout, an edge hiccup),
the retry will start the workflow a second time. `concurrency: trello-agent` with
`cancel-in-progress: false` will not drop that second run but queue it — and it will find the card
already carrying the `claude:wip` label, so it exits with "no eligible card". The cost is ~20 seconds
of runner time; the card is never claimed twice. That is why "return 500 to get free retries" is
safe, even though it looks otherwise at first glance.

**The Vitest environment for the filter test — verify it, do not assume it.** The root config sets
`environment: 'jsdom'` and a global `setupFiles: ['./src/test-setup.ts']`, and both will apply to
`workers/trello-webhook/filter.test.ts` too. The plan's first step is to drop in a stub test and run
`npm test`: confirm that the default `include` really does resolve from the project root and that
`src/test-setup.ts` does not blow up outside the application context. If either turns out otherwise,
the fix is either a `@vitest-environment node` docblock in the test file or a narrow override in
`vite.config.ts` — decided on the evidence. Until that check, the claim "`vite.config.ts` needs no
change" remains an assumption.

**A card is moved to In Progress while the Worker is deploying.** The event is lost (Trello retries
and gives up) and the hourly cron picks the card up. Deploys take seconds, so the window is
negligible.

**Several cards moved at once.** Each produces its own dispatch, `concurrency` queues them, and
`select-and-claim` takes them one at a time in `pos` order. Same behaviour as with n8n today.

## Boundaries (v1)

Deliberately **not** doing:

- No Trello logic inside the Worker: card selection, labels and comments stay in `trello.sh`.
- No auto-deploy (decision 6).
- No `X-Trello-Webhook` signature verification (decision 3).
- No KV/Queues/Durable Objects and no retry queue of our own — Trello's retries plus the hourly cron.
- No Cloudflare Cron Triggers: the fallback stays in GitHub Actions, where it already works.
- No custom domain and no Custom Domain binding.

## Definition of done

1. `npm test` green, including all seven filter cases; `npm run typecheck:worker` green; both behind
   the CI gate on pull_request.
2. The Worker is deployed, answers `200` to HEAD and `404` on a wrong path.
3. Exactly one Trello webhook on the board, pointing at the Worker, `active=true`.
4. All three acceptance scenarios pass, the negative one included.
5. Containers stopped, `trello.env` copied to `~/.config/trello/env`.
6. The mac can be switched off — a card moved to In Progress from a phone starts the agent.
