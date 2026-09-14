# Trello webhook on a Cloudflare Worker — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status:** executed inline on 2026-09-14; the resulting change is PR #16.

**Goal:** Move the event path "card → In Progress → agent run" off self-hosted n8n on the mac and into a stateless Cloudflare Worker, so events stop being lost while the laptop sleeps and the double-fire filter ends up in git under test.

**Architecture:** One `fetch` handler on `*.workers.dev` accepts the Trello webhook on a secret path, runs the `action` through the pure `shouldDispatch` function, and on `true` fires `workflow_dispatch` for `trello-agent.yml`. No state: the filter guards against the paired `updateCard`, `concurrency: trello-agent` guards against overlapping runs, and the `claude:wip` label guards against claiming a card twice. The Trello logic (card selection, labels, comments) stays in `.github/scripts/trello.sh` and does not change by a single line.

**Tech Stack:** TypeScript, Cloudflare Workers, wrangler 4, Vitest 2 (already in the project), Node 22, GitHub Actions REST API.

**Spec:** `docs/superpowers/specs/2026-09-09-trello-webhook-cloudflare-worker-design.md`

## Global Constraints

- Node 22, npm. The package manager is npm (`package-lock.json` is in the repository).
- No new **runtime** dependencies. Exactly two devDependencies are added: `wrangler` and `@cloudflare/workers-types`.
- TypeScript strict, including `noUnusedLocals` and `noUnusedParameters` (inherited from the root `tsconfig.json`).
- Commits must **not** mention Claude / Co-Authored-By / "Generated with" — a project rule.
- The repository is public: committed files must **never** contain the Cloudflare `account_id`, Trello board or list ids, `WEBHOOK_TOKEN`, or the PAT. Tests use fake id strings.
- Only `action.data.listAfter?.id`. The `|| action.data.list?.id` fallback is forbidden — it fires on any edit of a card already sitting in In Progress. Note: `docs/superpowers/plans/2026-07-23-trello-agent-comment-dialogue.md:175` has the **old, incorrect** form of this expression committed; do not copy it from there.
- The agent marker is `🤖` (matching `AGENT_MARKER` in `.github/scripts/trello.sh`).
- Manual deploys only; no auto-deploy workflow is created.
- Steps marked **(USER)** are performed by a human: they are interactive (a browser, a secret typed into stdin) or need permissions the assistant lacks. The assistant stops and asks for them to be run as `! <command>`.

---

### Task 1: The pure `shouldDispatch` filter + tests

**Files:**
- Create: `workers/trello-webhook/filter.ts`
- Test: `workers/trello-webhook/filter.test.ts`

**Interfaces:**
- Consumes: nothing (first task).
- Produces: `export const AGENT_MARKER = '🤖'` and
  `export function shouldDispatch(action: unknown, inProgressListId: string): { dispatch: boolean; reason: string }`.
  The handler in Task 3 imports exactly this.

The first three steps double as a check of the spec's assumption that "`vite.config.ts` needs no change": the root Vitest sets `environment: 'jsdom'` and a global `setupFiles: ['./src/test-setup.ts']`, and both will apply to files under `workers/` as well.

- [ ] **Step 1: Write the failing test**

Create `workers/trello-webhook/filter.test.ts`. The fixtures mirror the real shape of Trello payloads, trimmed to the fields in use; list ids are fake so the real ones never enter the repository. Comment text is left in Russian on purpose — it mirrors what the board actually carries, including the agent's own comment in `trello.sh`.

```ts
import { describe, expect, it } from 'vitest';
import { shouldDispatch } from './filter';

const IN_PROGRESS = 'list-in-progress';
const TODO = 'list-todo';

// Dragging a card into In Progress: THIS action is the one that carries listAfter.
const movedIntoInProgress = {
  type: 'updateCard',
  data: {
    card: { id: 'card-1', name: 'Some card', idShort: 42 },
    old: { idList: TODO },
    board: { id: 'board-1', name: 'ArchMentor' },
    listBefore: { id: TODO, name: 'To Do' },
    listAfter: { id: IN_PROGRESS, name: 'In Progress' },
  },
};

// The second action of the SAME drag — position only. No listAfter, but there is a list.
const posOnlyInInProgress = {
  type: 'updateCard',
  data: {
    card: { id: 'card-1', pos: 65535 },
    old: { pos: 131071 },
    board: { id: 'board-1', name: 'ArchMentor' },
    list: { id: IN_PROGRESS, name: 'In Progress' },
  },
};

// Renaming a card that is already sitting in In Progress.
const renamedInInProgress = {
  type: 'updateCard',
  data: {
    card: { id: 'card-1', name: 'Some card (renamed)' },
    old: { name: 'Some card' },
    board: { id: 'board-1', name: 'ArchMentor' },
    list: { id: IN_PROGRESS, name: 'In Progress' },
  },
};

const movedToDone = {
  type: 'updateCard',
  data: {
    card: { id: 'card-1' },
    old: { idList: IN_PROGRESS },
    listBefore: { id: IN_PROGRESS, name: 'In Progress' },
    listAfter: { id: 'list-done', name: 'Done' },
  },
};

const userComment = {
  type: 'commentCard',
  data: {
    card: { id: 'card-1', name: 'Some card' },
    board: { id: 'board-1' },
    text: 'да, делай через zustand',
  },
};

const agentComment = {
  type: 'commentCard',
  data: {
    card: { id: 'card-1', name: 'Some card' },
    board: { id: 'board-1' },
    text: '🤖 Взял в работу. Ветка и PR появятся здесь.',
  },
};

describe('shouldDispatch', () => {
  it('dispatches when a card is dragged into In Progress', () => {
    expect(shouldDispatch(movedIntoInProgress, IN_PROGRESS).dispatch).toBe(true);
  });

  it('ignores the pos-only twin of the same drag', () => {
    expect(shouldDispatch(posOnlyInInProgress, IN_PROGRESS).dispatch).toBe(false);
  });

  // Regression: a naive data.list.id filter fired on any edit of a card in In Progress.
  it('ignores an edit of a card already sitting in In Progress', () => {
    expect(shouldDispatch(renamedInInProgress, IN_PROGRESS).dispatch).toBe(false);
  });

  it('ignores a move into any other list', () => {
    expect(shouldDispatch(movedToDone, IN_PROGRESS).dispatch).toBe(false);
  });

  it('dispatches on a comment from the user', () => {
    expect(shouldDispatch(userComment, IN_PROGRESS).dispatch).toBe(true);
  });

  it('ignores a comment written by the agent', () => {
    expect(shouldDispatch(agentComment, IN_PROGRESS).dispatch).toBe(false);
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['empty object', {}],
    ['updateCard without data', { type: 'updateCard' }],
    ['commentCard without data', { type: 'commentCard' }],
    ['unknown type', { type: 'createCard', data: { card: { id: 'card-1' } } }],
  ])('ignores garbage payload: %s', (_label, payload) => {
    expect(shouldDispatch(payload, IN_PROGRESS).dispatch).toBe(false);
  });

  it('explains its verdict', () => {
    expect(shouldDispatch(movedIntoInProgress, IN_PROGRESS).reason).toMatch(/In Progress/);
    expect(shouldDispatch(agentComment, IN_PROGRESS).reason).toMatch(/agent/);
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test -- workers/trello-webhook/filter.test.ts`
Expected: FAIL with `Failed to resolve import "./filter"` (the file does not exist yet).

This doubles as the environment check: if Vitest says "No test files found" instead of an import error, the default `include` does not resolve from the root — then add to the `test` block in `vite.config.ts`:
`include: ['src/**/*.test.{ts,tsx}', 'workers/**/*.test.ts']` and repeat the step. If `src/test-setup.ts` blows up, add a docblock at the top of the test file:

```ts
// @vitest-environment node
```

Record in the commit message which of the three turned out to be the fact.

- [ ] **Step 3: Minimal implementation**

Create `workers/trello-webhook/filter.ts`:

```ts
export type FilterVerdict = { dispatch: boolean; reason: string };

/** The prefix marking every agent comment (see AGENT_MARKER in .github/scripts/trello.sh). */
export const AGENT_MARKER = '🤖';

type TrelloAction = {
  type?: unknown;
  data?: {
    listAfter?: { id?: unknown } | null;
    text?: unknown;
  } | null;
};

/**
 * Decides whether this Trello action should start trello-agent.yml.
 *
 * Two rules:
 *   1. updateCard whose data.listAfter.id is the In Progress list;
 *   2. commentCard with non-empty text that does not start with AGENT_MARKER.
 *
 * IMPORTANT: listAfter only. A single card drag produces TWO updateCard actions
 * (the list change and the pos adjustment), and only the first carries listAfter.
 * The data.list.id field is present on any edit of a card already in the list, so
 * falling back to it causes false triggers — that bug was already caught on 2026-08-25.
 */
export function shouldDispatch(action: unknown, inProgressListId: string): FilterVerdict {
  const candidate = (action ?? {}) as TrelloAction;
  const type = typeof candidate.type === 'string' ? candidate.type : '';
  const data = candidate.data ?? {};

  if (type === 'updateCard') {
    const listAfter = data.listAfter?.id;
    if (typeof listAfter === 'string' && listAfter !== '' && listAfter === inProgressListId) {
      return { dispatch: true, reason: 'card moved into In Progress' };
    }
    return { dispatch: false, reason: 'updateCard without listAfter = In Progress' };
  }

  if (type === 'commentCard') {
    const text = typeof data.text === 'string' ? data.text : '';
    if (text === '') return { dispatch: false, reason: 'commentCard without text' };
    if (text.startsWith(AGENT_MARKER)) return { dispatch: false, reason: 'agent comment' };
    return { dispatch: true, reason: 'user comment' };
  }

  return { dispatch: false, reason: `ignored action type: ${type || '(none)'}` };
}
```

- [ ] **Step 4: Run it and confirm it is green**

Run: `npm test -- workers/trello-webhook/filter.test.ts`
Expected: PASS, 13 tests (6 named + 6 from `it.each` + "explains its verdict").

- [ ] **Step 5: Run the whole suite**

Run: `npm test`
Expected: PASS. The existing application tests must be untouched; the total grows by exactly the number of new ones.

- [ ] **Step 6: Commit**

```bash
git add workers/trello-webhook/filter.ts workers/trello-webhook/filter.test.ts
git commit -m "feat(worker): pure Trello action filter with the listAfter regression covered"
```

---

### Task 2: The Worker's types behind the CI gate

**Files:**
- Create: `workers/trello-webhook/tsconfig.json`
- Modify: `package.json` (the `devDependencies` and `scripts` blocks)
- Modify: `.github/workflows/ci.yml:20-22` (after the `npm test` step)

**Interfaces:**
- Consumes: `workers/trello-webhook/filter.ts` from Task 1.
- Produces: the `npm run typecheck:worker` script; the Workers globals (`Request`, `Response`, `ExportedHandler`) available to files under `workers/trello-webhook/`. Task 3 relies on them.

The root `tsc --noEmit` does not see the Worker: `tsconfig.json` sets `include: ["src"]`. Without a separate gate the Worker would be nominally in git but outside verification — exactly the unverifiability we are leaving the n8n GUI node to escape.

- [ ] **Step 1: Install the devDependencies**

Do not guess the `@cloudflare/workers-types` version (the package uses a calendar scheme) — ask first:

```bash
npm view @cloudflare/workers-types version
```

Then install what it returned, alongside the already-verified `wrangler` 4.130.0:

```bash
npm install --save-dev wrangler@^4.130.0 "@cloudflare/workers-types@^<version from the previous command>"
```

Confirm nothing landed in `dependencies` (not dev): `git diff package.json`.

- [ ] **Step 2: Create the Worker's tsconfig**

`workers/trello-webhook/tsconfig.json` — it does not extend the root one, because that sets `lib: DOM` and `jsx`, both wrong for a Worker (the DOM types conflict with the Workers types):

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "types": ["@cloudflare/workers-types"],
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["."],
  "exclude": ["*.test.ts"]
}
```

`*.test.ts` is excluded: tests run under Vitest with its own globals (`describe`/`it`/`expect`/`vi`), which the Workers types do not know about.

- [ ] **Step 3: Add the script**

In `package.json`, in `scripts`, after `"typecheck"`:

```json
"typecheck:worker": "tsc --noEmit -p workers/trello-webhook/tsconfig.json"
```

- [ ] **Step 4: Run it — it should already be green**

Run: `npm run typecheck:worker`
Expected: no output, exit code 0 (so far `workers/` holds only `filter.ts`, which is plain TS).

- [ ] **Step 5: Add the CI step**

In `.github/workflows/ci.yml`, after `- run: npm test`, insert:

```yaml
      - run: npm run typecheck:worker
```

- [ ] **Step 6: Confirm the root gates still hold**

Run: `npm test && npm run build`
Expected: PASS. `npm run build` is `tsc --noEmit && vite build`; it still looks only at `src`, and `workers/` never enters the application bundle.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json workers/trello-webhook/tsconfig.json .github/workflows/ci.yml
git commit -m "build(worker): typecheck the worker in CI"
```

---

### Task 3: The Worker handler

**Files:**
- Create: `workers/trello-webhook/index.ts`
- Test: `workers/trello-webhook/index.test.ts`

**Interfaces:**
- Consumes: `shouldDispatch` from Task 1; the Workers types from Task 2.
- Produces: `export interface Env { GITHUB_REPO: string; WORKFLOW_FILE: string; GIT_REF: string; GH_DISPATCH_TOKEN?: string; TRELLO_INPROGRESS_LIST_ID?: string; WEBHOOK_TOKEN?: string }` and `export default { fetch }`. The `Env` field names must match the `[vars]` and secret names in Task 4 letter for letter — otherwise the Worker receives `undefined` at runtime and silently 404s everything.

- [ ] **Step 1: Write the failing tests**

Create `workers/trello-webhook/index.test.ts`. The docblock is mandatory: jsdom has no `Request`/`Response`, while the node environment gets them from Node 22.

```ts
// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import worker, { type Env } from './index';

const TOKEN = 'secret-path-token';
const IN_PROGRESS = 'list-in-progress';

const env: Env = {
  GITHUB_REPO: 'bazha/archmentor',
  WORKFLOW_FILE: 'trello-agent.yml',
  GIT_REF: 'master',
  GH_DISPATCH_TOKEN: 'gh-token',
  TRELLO_INPROGRESS_LIST_ID: IN_PROGRESS,
  WEBHOOK_TOKEN: TOKEN,
};

const movedIntoInProgress = {
  action: {
    type: 'updateCard',
    data: {
      card: { id: 'card-1', name: 'Some card' },
      listBefore: { id: 'list-todo', name: 'To Do' },
      listAfter: { id: IN_PROGRESS, name: 'In Progress' },
    },
  },
};

const renamedInInProgress = {
  action: {
    type: 'updateCard',
    data: {
      card: { id: 'card-1', name: 'renamed' },
      old: { name: 'Some card' },
      list: { id: IN_PROGRESS, name: 'In Progress' },
    },
  },
};

function post(path: string, body: unknown): Request {
  return new Request(`https://trello-webhook.example.workers.dev${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

describe('worker fetch', () => {
  it('answers HEAD with 200 so Trello can create the webhook', async () => {
    const res = await worker.fetch(
      new Request('https://trello-webhook.example.workers.dev/trello/whatever', { method: 'HEAD' }),
      env,
    );
    expect(res.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('404s a POST to the wrong path without dispatching', async () => {
    const res = await worker.fetch(post('/trello/wrong-token', movedIntoInProgress), env);
    expect(res.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('404s a GET to the right path', async () => {
    const res = await worker.fetch(
      new Request(`https://trello-webhook.example.workers.dev/trello/${TOKEN}`),
      env,
    );
    expect(res.status).toBe(404);
  });

  it('404s everything when WEBHOOK_TOKEN is not configured', async () => {
    const res = await worker.fetch(post('/trello/', movedIntoInProgress), {
      ...env,
      WEBHOOK_TOKEN: undefined,
    });
    expect(res.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('dispatches the workflow with the right URL, headers and body', async () => {
    const res = await worker.fetch(post(`/trello/${TOKEN}`, movedIntoInProgress), env);
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      'https://api.github.com/repos/bazha/archmentor/actions/workflows/trello-agent.yml/dispatches',
    );
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('Bearer gh-token');
    expect(init.headers.Accept).toBe('application/vnd.github+json');
    expect(init.headers['User-Agent']).toBe('trello-webhook-worker');
    expect(JSON.parse(init.body)).toEqual({ ref: 'master' });
  });

  it('returns 200 without dispatching when the filter says no', async () => {
    const res = await worker.fetch(post(`/trello/${TOKEN}`, renamedInInProgress), env);
    expect(res.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns 200 on an unparsable body so Trello does not retry', async () => {
    const req = new Request(`https://trello-webhook.example.workers.dev/trello/${TOKEN}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'not json',
    });
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns 500 when the dispatch fails, so Trello retries', async () => {
    fetchMock.mockResolvedValue(new Response('boom', { status: 502 }));
    const res = await worker.fetch(post(`/trello/${TOKEN}`, movedIntoInProgress), env);
    expect(res.status).toBe(500);
  });

  it('logs an explicit hint when the PAT is rejected', async () => {
    fetchMock.mockResolvedValue(new Response('bad credentials', { status: 401 }));
    const res = await worker.fetch(post(`/trello/${TOKEN}`, movedIntoInProgress), env);
    expect(res.status).toBe(500);
    const logged = (console.log as unknown as ReturnType<typeof vi.fn>).mock.calls
      .flat()
      .join(' ');
    expect(logged).toMatch(/PAT/);
  });

  it('never logs the webhook token', async () => {
    await worker.fetch(post('/trello/wrong-token', movedIntoInProgress), env);
    const logged = (console.log as unknown as ReturnType<typeof vi.fn>).mock.calls
      .flat()
      .join(' ');
    expect(logged).not.toContain(TOKEN);
  });
});
```

- [ ] **Step 2: Run them and confirm they fail**

Run: `npm test -- workers/trello-webhook/index.test.ts`
Expected: FAIL with `Failed to resolve import "./index"`.

- [ ] **Step 3: Implementation**

Create `workers/trello-webhook/index.ts`:

```ts
import { shouldDispatch } from './filter';

export interface Env {
  /** Public values from [vars] in wrangler.toml. */
  GITHUB_REPO: string;
  WORKFLOW_FILE: string;
  GIT_REF: string;
  /** Secrets (wrangler secret put). Optional: without them the Worker safely 404s. */
  GH_DISPATCH_TOKEN?: string;
  TRELLO_INPROGRESS_LIST_ID?: string;
  WEBHOOK_TOKEN?: string;
}

const log = (message: string) => console.log(`[trello-webhook] ${message}`);

async function dispatchWorkflow(env: Env): Promise<number> {
  const url = `https://api.github.com/repos/${env.GITHUB_REPO}/actions/workflows/${env.WORKFLOW_FILE}/dispatches`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.GH_DISPATCH_TOKEN ?? ''}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'trello-webhook-worker',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ref: env.GIT_REF }),
  });
  return res.status;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Trello issues a HEAD to the callbackURL at webhook creation and refuses to create it without a 200.
    if (request.method === 'HEAD') return new Response(null, { status: 200 });

    const { pathname } = new URL(request.url);
    const expected = env.WEBHOOK_TOKEN ? `/trello/${env.WEBHOOK_TOKEN}` : '';
    if (request.method !== 'POST' || expected === '' || pathname !== expected) {
      // Neither the path nor any part of it reaches the log — only the fact of the rejection.
      log(`rejected ${request.method}: path mismatch`);
      return new Response('not found', { status: 404 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      log('unparsable body — ignored');
      return new Response('ignored', { status: 200 });
    }

    const action = (body as { action?: unknown } | null)?.action;
    const actionType =
      typeof (action as { type?: unknown } | null)?.type === 'string'
        ? (action as { type: string }).type
        : '(none)';
    const cardId =
      typeof (action as { data?: { card?: { id?: unknown } } } | null)?.data?.card?.id === 'string'
        ? (action as { data: { card: { id: string } } }).data.card.id
        : '(none)';

    const verdict = shouldDispatch(action, env.TRELLO_INPROGRESS_LIST_ID ?? '');
    log(`${actionType} card=${cardId} dispatch=${verdict.dispatch} (${verdict.reason})`);
    if (!verdict.dispatch) return new Response('ignored', { status: 200 });

    const status = await dispatchWorkflow(env);
    if (status === 204) {
      log(`dispatched trello-agent.yml (GitHub ${status})`);
      return new Response('dispatched', { status: 200 });
    }
    if (status === 401 || status === 403) {
      log(`dispatch rejected with ${status} — PAT expired or lost Actions:write`);
    } else {
      log(`dispatch failed with ${status} — returning 500 so Trello retries`);
    }
    // The 500 is deliberate: Trello retries at 30s / 60s / 120s and absorbs a short GitHub outage.
    return new Response('dispatch failed', { status: 500 });
  },
} satisfies ExportedHandler<Env>;
```

- [ ] **Step 4: Run the handler tests**

Run: `npm test -- workers/trello-webhook/index.test.ts`
Expected: PASS, 10 tests.

- [ ] **Step 5: Run both gates**

Run: `npm test && npm run typecheck:worker`
Expected: PASS on both.

- [ ] **Step 6: Commit**

```bash
git add workers/trello-webhook/index.ts workers/trello-webhook/index.test.ts
git commit -m "feat(worker): Trello webhook handler dispatching trello-agent.yml"
```

---

### Task 4: Deploy and secrets

**Files:**
- Create: `workers/trello-webhook/wrangler.toml`
- Modify: `.gitignore` (add `.dev.vars` and `.wrangler/`)

**Interfaces:**
- Consumes: `index.ts` and `Env` from Task 3 — the names in `[vars]` and the secret names must match the `Env` fields letter for letter.
- Produces: the live URL `https://trello-webhook.bazhanau.workers.dev` and the `WEBHOOK_TOKEN` value, needed in Task 5 for the `callbackURL`.

The Cloudflare account already exists (`bazhanau.arthur@gmail.com`) and `wrangler login` is done.

- [ ] **Step 1: Create wrangler.toml**

```toml
name = "trello-webhook"
main = "index.ts"
compatibility_date = "2026-09-09"
workers_dev = true

# Public values. account_id is deliberately NOT listed here: the repository is public,
# so it is passed through the CLOUDFLARE_ACCOUNT_ID environment variable.
[vars]
GITHUB_REPO   = "bazha/archmentor"
WORKFLOW_FILE = "trello-agent.yml"
GIT_REF       = "master"
```

- [ ] **Step 2: Keep wrangler's local artifacts out of git**

Append to `.gitignore`:

```
# wrangler: local development variables and its build cache
.dev.vars
.wrangler/
```

`.dev.vars` holds secrets and must never reach a public repository; the existing `*.local` pattern does not catch it.

- [ ] **Step 3: Exercise the handler locally without starting the agent**

Create `workers/trello-webhook/.dev.vars` — **without** `GH_DISPATCH_TOKEN`:

```
WEBHOOK_TOKEN=local-dev-token
TRELLO_INPROGRESS_LIST_ID=list-in-progress
```

In one terminal:

```bash
npx wrangler dev --config workers/trello-webhook/wrangler.toml --port 8787
```

In another:

```bash
curl -s -o /dev/null -w 'moved: %{http_code}\n' -X POST \
  -H 'content-type: application/json' \
  -d '{"action":{"type":"updateCard","data":{"card":{"id":"card-1"},"listAfter":{"id":"list-in-progress"}}}}' \
  http://127.0.0.1:8787/trello/local-dev-token

curl -s -o /dev/null -w 'renamed: %{http_code}\n' -X POST \
  -H 'content-type: application/json' \
  -d '{"action":{"type":"updateCard","data":{"card":{"id":"card-1"},"list":{"id":"list-in-progress"},"old":{"name":"x"}}}}' \
  http://127.0.0.1:8787/trello/local-dev-token
```

Expected: `moved: 500` (the filter said yes, the dispatch went to GitHub and got `401`/`403` because there is no token — the `wrangler dev` log shows the rejection line, which for 401/403 is `PAT expired or lost Actions:write`) and `renamed: 200` (the filter said no, no dispatch went out). So the route and the filter are verified on a live Workers runtime while the agent never ran. Confirm `gh run list --workflow=trello-agent.yml --limit 3` shows no new runs.

Stop `wrangler dev` (Ctrl-C).

- [ ] **Step 4 (USER): First deploy**

```
! CLOUDFLARE_ACCOUNT_ID=86e23b29daf9f14757296b5485cdfd59 npx wrangler deploy --config workers/trello-webhook/wrangler.toml
```

The subdomain is registered in the dashboard (`…/workers/subdomain`) — **`bazhanau`** was registered; after registering, the deploy must be repeated or the route does not attach. The choice is effectively irreversible: changing it breaks every `workers.dev` address on the account. The URL is printed at the end of the output — expect `https://trello-webhook.bazhanau.workers.dev`.

Between this step and Step 6 the endpoint is live but safe: `WEBHOOK_TOKEN` is unset, `expected === ''`, and everything but HEAD gets a 404.

- [ ] **Step 5 (USER): Create the fine-grained PAT**

In the browser: **github.com/settings/personal-access-tokens/new** →
- Token name: `trello-webhook-worker-dispatch`
- Resource owner: `bazha`
- Expiration: **1 year** (write down the resulting date — 2027-09-09 if issued on the plan's date; it goes into project memory in Task 6 Step 5)
- Repository access: **Only select repositories** → `archmentor`
- Repository permissions: **Actions → Read and write** (`Metadata → Read-only` is added automatically)

Enable nothing else. This is NOT `GH_PAT`: that one can push to master, and a copy of it inside the Worker would mean that leaking the Worker equals leaking write access to the repository.

- [ ] **Step 6 (USER): Generate the path token and store all three secrets**

```
! openssl rand -hex 32
```

Keep the output (Task 5 Step 4 needs it) and store the secrets — each command prompts for the value on stdin:

```
! npx wrangler secret put GH_DISPATCH_TOKEN --config workers/trello-webhook/wrangler.toml
! npx wrangler secret put TRELLO_INPROGRESS_LIST_ID --config workers/trello-webhook/wrangler.toml
! npx wrangler secret put WEBHOOK_TOKEN --config workers/trello-webhook/wrangler.toml
```

Values: the PAT from Step 5; the In Progress list id (`6a60b020daa8e07f3df0e6c4`, the same one that is in GitHub Secrets); the hex string from `openssl`.

- [ ] **Step 7: Check the secret list**

```bash
npx wrangler secret list --config workers/trello-webhook/wrangler.toml
```
Expected: three names — `GH_DISPATCH_TOKEN`, `TRELLO_INPROGRESS_LIST_ID`, `WEBHOOK_TOKEN`. The values are not returned, and that is correct.

- [ ] **Step 8: Check the live endpoint**

```bash
curl -sI  "https://trello-webhook.bazhanau.workers.dev/trello/<WEBHOOK_TOKEN>" | head -1
curl -s -o /dev/null -w '%{http_code}\n' -X POST \
  -H 'content-type: application/json' -d '{"action":{"type":"updateCard","data":{}}}' \
  "https://trello-webhook.bazhanau.workers.dev/trello/definitely-wrong"
```
Expected: `HTTP/2 200` on HEAD; `404` on the POST to the wrong path.

Neither response starts a workflow. Confirm that: `gh run list --workflow=trello-agent.yml --limit 3` should show no new runs.

- [ ] **Step 9: Commit**

```bash
git add workers/trello-webhook/wrangler.toml .gitignore
git commit -m "chore(worker): wrangler config for the trello-webhook worker"
```

---

### Task 5: Cutting the Trello webhook over

**Files:**
- Modify: `.github/workflows/trello-agent.yml:4-5` (the header comment)

**Interfaces:**
- Consumes: the Worker URL and `WEBHOOK_TOKEN` from Task 4.
- Produces: exactly one active Trello webhook pointing at the Worker.

All the migration risk lives here. Two live webhooks on one board mean two dispatches per drag.

- [ ] **Step 1: Load the Trello credentials and see what exists**

```bash
set -a; source ~/docker/n8n/trello.env; set +a
curl -s "https://api.trello.com/1/tokens/$TRELLO_TOKEN/webhooks?key=$TRELLO_KEY" \
  | jq -r '.[] | "\(.id)  \(.callbackURL)  active=\(.active)"'
```
Expected: a single entry pointing at `https://myth-thievish-backlash.ngrok-free.dev/...`. If there is more than one, stop and investigate before deleting anything.

- [ ] **Step 2: Stop the containers**

```bash
cd ~/docker/n8n && docker compose stop
```
**No `down`, no `-v`.** The `n8n_data` volume is the only rollback path.

- [ ] **Step 3: Delete the old webhook**

```bash
curl -s -X DELETE "https://api.trello.com/1/webhooks/<OLD_ID>?key=$TRELLO_KEY&token=$TRELLO_TOKEN" -o /dev/null -w '%{http_code}\n'
```
Expected: `200`.

- [ ] **Step 4: Create the new one**

```bash
curl -s -X POST "https://api.trello.com/1/webhooks?key=$TRELLO_KEY&token=$TRELLO_TOKEN" \
  --data-urlencode "callbackURL=https://trello-webhook.bazhanau.workers.dev/trello/<WEBHOOK_TOKEN>" \
  --data-urlencode "idModel=6a60afe8fa78c7079643cd70" \
  --data-urlencode "description=trello-agent via cloudflare worker" | jq '{id, active, callbackURL}'
```
Expected: JSON with `active: true`. Trello synchronously issues a HEAD and only creates the webhook on a `200` — on an error, go back to Task 4 Step 8: the webhook was not created and the Worker needs fixing (no rollback required).

- [ ] **Step 5: Verify there is exactly one**

```bash
curl -s "https://api.trello.com/1/tokens/$TRELLO_TOKEN/webhooks?key=$TRELLO_KEY" | jq 'length'
```
Expected: `1`.

- [ ] **Step 6: Update the workflow comment**

In `.github/workflows/trello-agent.yml`, replace lines 4-5:

```yaml
  # A Cloudflare Worker (workers/trello-webhook) triggers this event-driven via
  # workflow_dispatch on card → In Progress and on a user comment.
  # The schedule is only a rare safety-net fallback in case the Worker or the GitHub API is down.
```

- [ ] **Step 7: Commit**

```bash
git add .github/workflows/trello-agent.yml
git commit -m "docs(trello-agent): the event-driven trigger is now a Cloudflare Worker"
```

---

### Task 6: Acceptance on the live board

**Files:**
- Modify: `/Users/arthur/.claude-work/projects/-Users-arthur-Documents-work-learna/memory/n8n-selfhosted-trello-automation.md` (rewritten wholesale)
- Modify: `/Users/arthur/.claude-work/projects/-Users-arthur-Documents-work-learna/memory/MEMORY.md` (the index line)

**Interfaces:**
- Consumes: the working webhook from Task 5.
- Produces: confirmation that all three scenarios pass. Nothing is torn down before that.

All three are mandatory. Until they pass, the `docker compose down` from Task 7 must not happen.

- [ ] **Step 1 (USER): Positive scenario**

Create a small test card and drag it into **In Progress**. Then:

```bash
gh run list --workflow=trello-agent.yml --limit 5
```
Expected: a new run appears within seconds, and there is **exactly one**. Two runs per drag means the `listAfter` filter is not working; stop, move the card back and investigate (the `posOnlyInInProgress` unit test should have caught it — so the fixture must have diverged from the real payload, and the real one has to be captured via `npx wrangler tail`).

Let the cycle finish: the agent opens a PR → merge it → `gh run list --workflow=trello-done.yml` shows a run → the card lands in **Done** with a single `🤖 ✅` comment.

- [ ] **Step 2 (USER): Negative scenario — the important one**

Rename a card that is **already sitting** in In Progress (the same one if it is still there, or any other).

```bash
gh run list --workflow=trello-agent.yml --limit 5
```
Expected: no new runs. This checks a real Trello payload against the same rule the `renamedInInProgress` unit test covers.

- [ ] **Step 3 (USER): Dialogue scenario**

On a card carrying the `needs-info` label, reply with an ordinary comment (no `🤖`). Expected: a new `trello-agent.yml` run within seconds. The agent's own comment (which starts with `🤖`) must not produce a run — visible from the absence of extra runs after `finalize`.

- [ ] **Step 4: Look at the Worker logs**

```bash
npx wrangler tail --config workers/trello-webhook/wrangler.toml
```
With the stream open, move a card around. Expected: lines like `[trello-webhook] updateCard card=… dispatch=true (card moved into In Progress)` and `dispatch=false` for the paired pos action. Confirm `WEBHOOK_TOKEN` does not appear in **our** `[trello-webhook] …` lines. Note: wrangler's own access line (`[wrangler:info] POST /trello/<token> 200 OK`) prints the URL in full — that is a platform property, not our log, and only the account owner sees it. Verified locally in Task 4 Step 3.

- [ ] **Step 5: Rewrite project memory**

Replace the contents of `memory/n8n-selfhosted-trello-automation.md` (keep the `name`/`description`/`metadata` frontmatter, update `description`) so it records: the stack — Cloudflare Worker `workers/trello-webhook`, the URL `https://trello-webhook.bazhanau.workers.dev` (without the path token), the three secrets and their purpose, the **PAT expiry date** from Task 4 Step 5, the deploy command with `CLOUDFLARE_ACCOUNT_ID`, the `account_id` `86e23b29daf9f14757296b5485cdfd59`, the fact that the Trello credentials now live in `~/.config/trello/env`, the `listAfter` gotcha, and that no form of n8n remains. Update the `MEMORY.md` line to match the new description.

- [ ] **Step 6: Commit**

Memory files live outside the repository and are not committed. There is nothing to commit in this task — if the working tree is clean, the task is done.

```bash
git status --short
```
Expected: empty.

---

### Task 7: Tearing down local n8n

**Files:** none (operations in `~/docker/n8n` and in external services).

**Interfaces:**
- Consumes: the passing acceptance from Task 6.
- Produces: a mac that can be switched off without breaking the automation.

Runs **only** after Task 6. Step 4 is deferred — no earlier than a week after the cutover.

- [ ] **Step 1: Extract the Trello credentials before deleting anything**

```bash
mkdir -p ~/.config/trello
cp ~/docker/n8n/trello.env ~/.config/trello/env
chmod 600 ~/.config/trello/env
grep -c TRELLO ~/.config/trello/env
```
Expected: `2` (key and token both present).

The token is write-only in GitHub Secrets, and `~/docker/n8n/trello.env` is the only copy at hand. Losing it means reissuing the token, and reissuing kills every webhook of the old token — that is, the automation itself.

- [ ] **Step 2: Bring the containers down, keeping the volume**

```bash
cd ~/docker/n8n && docker compose down
docker volume ls | grep n8n_data
```
Expected: the `n8n_data` volume is still there. **Do not add `-v`.** Rollback before step 4 costs two commands: `docker compose up -d` plus re-registering the webhook against the ngrok domain.

- [ ] **Step 3: Confirm the mac is no longer needed**

Move a card into In Progress from a phone, with Docker down. Then:

```bash
gh run list --workflow=trello-agent.yml --limit 3
```
Expected: a run is there. That is the goal of the whole migration.

- [ ] **Step 4 (USER, no earlier than a week after the cutover): Final cleanup**

After a week of normal operation:

```
! cd ~/docker/n8n && docker compose down -v
! rm -rf ~/docker/n8n
! docker image rm docker.n8n.io/n8nio/n8n:2.36.0 ngrok/ngrok:3.39.11
```

And in the external services: release the reserved domain `myth-thievish-backlash.ngrok-free.dev` and delete the ngrok account; delete the n8n Cloud account `bazhanau.app.n8n.cloud` (kept as a rollback until 2026-09-01, now expired).

After `down -v` rollback is impossible: the volume takes the credentials and the n8n workflow itself with it. By then `~/.config/trello/env` from Step 1 must exist — re-check before running this.

---

## Final check (definition of done, from the spec)

- [ ] `npm test` green, including every filter case; `npm run typecheck:worker` green; both behind the CI gate on pull_request.
- [ ] The Worker is deployed, answers `200` to HEAD and `404` on a wrong path.
- [ ] Exactly one Trello webhook on the board, pointing at the Worker, `active=true`.
- [ ] All three acceptance scenarios pass, the negative one included.
- [ ] Containers stopped, `trello.env` copied to `~/.config/trello/env`.
- [ ] A card moved to In Progress from a phone, with Docker down, starts the agent.
