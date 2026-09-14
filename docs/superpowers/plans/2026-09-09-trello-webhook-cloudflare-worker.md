# Trello-вебхук на Cloudflare Worker — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Перенести событийный путь «карточка → In Progress → запуск агента» с self-hosted n8n на маке в stateless Cloudflare Worker, чтобы события перестали теряться при спящем ноутбуке, а фильтр двойного срабатывания оказался в гите под тестами.

**Architecture:** Один `fetch`-хендлер на `*.workers.dev` принимает вебхук Trello по секретному пути, прогоняет `action` через чистую функцию `shouldDispatch`, и при `true` дёргает `workflow_dispatch` для `trello-agent.yml`. Никакого состояния: от парного `updateCard` защищает фильтр, от одновременных запусков — `concurrency: trello-agent`, от повторного взятия карточки — лейбл `claude:wip`. Логика Trello (выбор карточки, лейблы, комментарии) остаётся в `.github/scripts/trello.sh` и не меняется ни строкой.

**Tech Stack:** TypeScript, Cloudflare Workers, wrangler 4, Vitest 2 (уже в проекте), Node 22, GitHub Actions REST API.

**Spec:** `docs/superpowers/specs/2026-09-09-trello-webhook-cloudflare-worker-design.md`

## Global Constraints

- Node 22, npm. Пакетный менеджер — npm (`package-lock.json` в репозитории).
- Новых **runtime**-зависимостей нет. Добавляются ровно два devDependency: `wrangler`, `@cloudflare/workers-types`.
- TypeScript strict, включая `noUnusedLocals` и `noUnusedParameters` (наследуется из корневого `tsconfig.json`).
- В коммитах **не упоминать** Claude / Co-Authored-By / «Generated with» — правило проекта.
- Репозиторий публичный: в коммитируемые файлы **не попадают** `account_id` Cloudflare, id доски и списков Trello, `WEBHOOK_TOKEN`, PAT. Тесты используют фиктивные id-строки.
- Только `action.data.listAfter?.id`. Фолбэк `|| action.data.list?.id` запрещён — он даёт ложные срабатывания на любой правке карточки, уже лежащей в In Progress. Учти: в `docs/superpowers/plans/2026-07-23-trello-agent-comment-dialogue.md:175` закоммичена **старая ошибочная** форма этого выражения; копировать оттуда нельзя.
- Маркер агента — `🤖` (совпадает с `AGENT_MARKER` в `.github/scripts/trello.sh`).
- Деплой только вручную; автодеплой-воркфлоу не создаём.
- Шаги, помеченные **(USER)**, выполняет человек: они интерактивные (браузер, ввод секрета в stdin) или требуют прав, которых у ассистента нет. Ассистент останавливается и просит запустить их через `! <команда>`.

---

### Task 1: Чистый фильтр `shouldDispatch` + тесты

**Files:**
- Create: `workers/trello-webhook/filter.ts`
- Test: `workers/trello-webhook/filter.test.ts`

**Interfaces:**
- Consumes: ничего (первая задача).
- Produces: `export const AGENT_MARKER = '🤖'` и
  `export function shouldDispatch(action: unknown, inProgressListId: string): { dispatch: boolean; reason: string }`.
  Хендлер из Task 3 импортирует именно это.

Первые три шага заодно проверяют предположение спеки «править `vite.config.ts` не нужно»: корневой Vitest задаёт `environment: 'jsdom'` и глобальный `setupFiles: ['./src/test-setup.ts']`, и они применятся и к файлам под `workers/`.

- [ ] **Step 1: Написать падающий тест**

Создать `workers/trello-webhook/filter.test.ts`. Фикстуры — реальная форма payload'ов Trello, урезанная до используемых полей; id списков фиктивные, чтобы настоящие не попали в репозиторий.

```ts
import { describe, expect, it } from 'vitest';
import { shouldDispatch } from './filter';

const IN_PROGRESS = 'list-in-progress';
const TODO = 'list-todo';

// Перетаскивание карточки в In Progress: у ЭТОГО экшена есть listAfter.
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

// Второй экшен ТОГО ЖЕ перетаскивания — только позиция. listAfter нет, зато есть list.
const posOnlyInInProgress = {
  type: 'updateCard',
  data: {
    card: { id: 'card-1', pos: 65535 },
    old: { pos: 131071 },
    board: { id: 'board-1', name: 'ArchMentor' },
    list: { id: IN_PROGRESS, name: 'In Progress' },
  },
};

// Переименование карточки, которая уже лежит в In Progress.
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

  // Регресс: наивный фильтр по data.list.id срабатывал на любой правке карточки в In Progress.
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

- [ ] **Step 2: Прогнать и убедиться, что падает**

Run: `npm test -- workers/trello-webhook/filter.test.ts`
Expected: FAIL с `Failed to resolve import "./filter"` (файла ещё нет).

Это же и есть проверка окружения: если вместо ошибки импорта Vitest напишет «No test files found», значит дефолтный `include` не резолвится от корня — тогда в `vite.config.ts` в блок `test` добавляется
`include: ['src/**/*.test.{ts,tsx}', 'workers/**/*.test.ts']`, и шаг повторяется. Если падает `src/test-setup.ts`, в начало файла теста добавляется докблок:

```ts
// @vitest-environment node
```

Зафиксируй в сообщении коммита, какой из трёх вариантов оказался фактом.

- [ ] **Step 3: Минимальная реализация**

Создать `workers/trello-webhook/filter.ts`:

```ts
export type FilterVerdict = { dispatch: boolean; reason: string };

/** Префикс, которым помечены все комментарии агента (см. AGENT_MARKER в .github/scripts/trello.sh). */
export const AGENT_MARKER = '🤖';

type TrelloAction = {
  type?: unknown;
  data?: {
    listAfter?: { id?: unknown } | null;
    text?: unknown;
  } | null;
};

/**
 * Решает, надо ли запускать trello-agent.yml по этому экшену Trello.
 *
 * Два правила:
 *   1. updateCard, у которого data.listAfter.id === список In Progress;
 *   2. commentCard с непустым текстом, не начинающимся с AGENT_MARKER.
 *
 * ВАЖНО: только listAfter. Одно перетаскивание карточки порождает ДВА updateCard-экшена
 * (смена списка и подгонка pos), и listAfter есть только у первого. Поле data.list.id
 * присутствует при любой правке карточки, уже лежащей в списке, поэтому фолбэк на него
 * даёт ложные срабатывания — этот баг уже был выловлен 2026-08-25.
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

- [ ] **Step 4: Прогнать и убедиться, что зелено**

Run: `npm test -- workers/trello-webhook/filter.test.ts`
Expected: PASS, 13 тестов (6 именованных + 6 из `it.each` + «explains its verdict»).

- [ ] **Step 5: Прогнать весь набор**

Run: `npm test`
Expected: PASS. Существующие 266 тестов приложения не должны затронуться; общее число вырастает ровно на число новых.

- [ ] **Step 6: Коммит**

```bash
git add workers/trello-webhook/filter.ts workers/trello-webhook/filter.test.ts
git commit -m "feat(worker): pure Trello action filter with the listAfter regression covered"
```

---

### Task 2: Типизация Worker'а под CI-гейтом

**Files:**
- Create: `workers/trello-webhook/tsconfig.json`
- Modify: `package.json` (блок `devDependencies`, блок `scripts`)
- Modify: `.github/workflows/ci.yml:20-22` (после шага `npm test`)

**Interfaces:**
- Consumes: `workers/trello-webhook/filter.ts` из Task 1.
- Produces: скрипт `npm run typecheck:worker`; глобальные типы Workers (`Request`, `Response`, `ExportedHandler`) доступны файлам под `workers/trello-webhook/`. Task 3 на них опирается.

Корневой `tsc --noEmit` Worker не видит: в `tsconfig.json` стоит `include: ["src"]`. Без отдельного гейта Worker формально в гите, но вне проверки — то есть ровно та непроверяемость, из-за которой мы уходим от GUI-ноды n8n.

- [ ] **Step 1: Поставить devDependencies**

Версию `@cloudflare/workers-types` не угадываем (у пакета календарная схема вида `4.2026xxxx.0`) — сначала спрашиваем:

```bash
npm view @cloudflare/workers-types version
```

Затем ставим то, что вернулось, и уже проверенный `wrangler` 4.130.0:

```bash
npm install --save-dev wrangler@^4.130.0 "@cloudflare/workers-types@^<версия из предыдущей команды>"
```

Проверить, что в `dependencies` (не dev) ничего не добавилось: `git diff package.json`.

- [ ] **Step 2: Создать tsconfig Worker'а**

`workers/trello-webhook/tsconfig.json` — не наследует корневой, потому что там `lib: DOM` и `jsx`, которые Worker'у противопоказаны (DOM-типы конфликтуют с типами Workers):

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

`*.test.ts` исключён: тесты гоняет Vitest со своими глобалами (`describe`/`it`/`expect`/`vi`), которых в типах Workers нет.

- [ ] **Step 3: Добавить скрипт**

В `package.json`, в `scripts`, после `"typecheck"`:

```json
"typecheck:worker": "tsc --noEmit -p workers/trello-webhook/tsconfig.json"
```

- [ ] **Step 4: Прогнать — должно быть зелено уже сейчас**

Run: `npm run typecheck:worker`
Expected: без вывода, код возврата 0 (в `workers/` пока только `filter.ts`, который чистый TS).

- [ ] **Step 5: Добавить шаг в CI**

В `.github/workflows/ci.yml` после `- run: npm test` вставить:

```yaml
      - run: npm run typecheck:worker
```

- [ ] **Step 6: Проверить, что корневые гейты не сломались**

Run: `npm test && npm run build`
Expected: PASS. `npm run build` — это `tsc --noEmit && vite build`; он по-прежнему смотрит только в `src`, и `workers/` в бандл приложения не попадает.

- [ ] **Step 7: Коммит**

```bash
git add package.json package-lock.json workers/trello-webhook/tsconfig.json .github/workflows/ci.yml
git commit -m "build(worker): typecheck the worker in CI"
```

---

### Task 3: Хендлер Worker'а

**Files:**
- Create: `workers/trello-webhook/index.ts`
- Test: `workers/trello-webhook/index.test.ts`

**Interfaces:**
- Consumes: `shouldDispatch` из Task 1; типы Workers из Task 2.
- Produces: `export interface Env { GITHUB_REPO: string; WORKFLOW_FILE: string; GIT_REF: string; GH_DISPATCH_TOKEN?: string; TRELLO_INPROGRESS_LIST_ID?: string; WEBHOOK_TOKEN?: string }` и `export default { fetch }`. Имена полей `Env` должны совпадать с `[vars]` и именами секретов в Task 4 — иначе Worker получит `undefined` в рантайме и молча отдаст 404 на всё.

- [ ] **Step 1: Написать падающие тесты**

Создать `workers/trello-webhook/index.test.ts`. Докблок обязателен: под jsdom нет `Request`/`Response`, а под `node` их даёт Node 22.

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

- [ ] **Step 2: Прогнать и убедиться, что падает**

Run: `npm test -- workers/trello-webhook/index.test.ts`
Expected: FAIL с `Failed to resolve import "./index"`.

- [ ] **Step 3: Реализация**

Создать `workers/trello-webhook/index.ts`:

```ts
import { shouldDispatch } from './filter';

export interface Env {
  /** Публичные значения из [vars] в wrangler.toml. */
  GITHUB_REPO: string;
  WORKFLOW_FILE: string;
  GIT_REF: string;
  /** Секреты (wrangler secret put). Необязательные: без них Worker безопасно отдаёт 404. */
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
    // Trello делает HEAD на callbackURL при создании вебхука и без 200 вебхук не создаётся.
    if (request.method === 'HEAD') return new Response(null, { status: 200 });

    const { pathname } = new URL(request.url);
    const expected = env.WEBHOOK_TOKEN ? `/trello/${env.WEBHOOK_TOKEN}` : '';
    if (request.method !== 'POST' || expected === '' || pathname !== expected) {
      // Ни путь, ни его часть в лог не попадают — только факт отказа.
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
    // 500 осознанно: Trello отретраит через 30с / 60с / 120с и переживёт короткий сбой GitHub.
    return new Response('dispatch failed', { status: 500 });
  },
} satisfies ExportedHandler<Env>;
```

- [ ] **Step 4: Прогнать тесты хендлера**

Run: `npm test -- workers/trello-webhook/index.test.ts`
Expected: PASS, 10 тестов.

- [ ] **Step 5: Прогнать оба гейта**

Run: `npm test && npm run typecheck:worker`
Expected: PASS оба.

- [ ] **Step 6: Коммит**

```bash
git add workers/trello-webhook/index.ts workers/trello-webhook/index.test.ts
git commit -m "feat(worker): Trello webhook handler dispatching trello-agent.yml"
```

---

### Task 4: Деплой и секреты

**Files:**
- Create: `workers/trello-webhook/wrangler.toml`
- Modify: `.gitignore` (добавить `.dev.vars` и `.wrangler/`)

**Interfaces:**
- Consumes: `index.ts` и `Env` из Task 3 — имена в `[vars]` и имена секретов обязаны совпадать с полями `Env` буква в букву.
- Produces: живой URL `https://trello-webhook.bazhanau.workers.dev` и значение `WEBHOOK_TOKEN`, которое понадобится в Task 5 для `callbackURL`.

Аккаунт Cloudflare уже создан (`bazhanau.arthur@gmail.com`), `wrangler login` пройден.

- [ ] **Step 1: Создать wrangler.toml**

```toml
name = "trello-webhook"
main = "index.ts"
compatibility_date = "2026-09-09"
workers_dev = true

# Публичные значения. account_id здесь НЕ указываем: репозиторий публичный,
# он передаётся через переменную окружения CLOUDFLARE_ACCOUNT_ID.
[vars]
GITHUB_REPO   = "bazha/archmentor"
WORKFLOW_FILE = "trello-agent.yml"
GIT_REF       = "master"
```

- [ ] **Step 2: Закрыть локальные артефакты wrangler от гита**

В `.gitignore` добавить в конец:

```
# wrangler: локальные переменные разработки и его кэш сборки
.dev.vars
.wrangler/
```

`.dev.vars` содержит секреты и не должен попасть в публичный репозиторий; существующий `*.local` его не ловит.

- [ ] **Step 3: Прогнать хендлер локально, не запуская агента**

Создать `workers/trello-webhook/.dev.vars` — **без** `GH_DISPATCH_TOKEN`:

```
WEBHOOK_TOKEN=local-dev-token
TRELLO_INPROGRESS_LIST_ID=list-in-progress
```

В одном терминале:

```bash
npx wrangler dev --config workers/trello-webhook/wrangler.toml --port 8787
```

В другом:

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

Expected: `moved: 500` (фильтр сказал «да», dispatch ушёл в GitHub и получил `401`/`403`, потому что токена нет — в логе `wrangler dev` видна строка про отказ, для 401/403 это `PAT expired or lost Actions:write`) и `renamed: 200` (фильтр сказал «нет», dispatch не уходил). То есть маршрут и фильтр проверены на живом рантайме Workers, а агент не запускался. Убедиться, что `gh run list --workflow=trello-agent.yml --limit 3` не показывает новых запусков.

Погасить `wrangler dev` (Ctrl-C).

- [ ] **Step 4 (USER): Первый деплой**

```
! CLOUDFLARE_ACCOUNT_ID=86e23b29daf9f14757296b5485cdfd59 npx wrangler deploy --config workers/trello-webhook/wrangler.toml
```

Субдомен регистрируется в дашборде (`…/workers/subdomain`) — зарегистрирован **`bazhanau`**; после регистрации деплой надо повторить, иначе маршрут не привязывается. Выбор фактически необратим: смена ломает все `workers.dev`-адреса аккаунта. В конце вывода будет URL — ожидаем `https://trello-webhook.bazhanau.workers.dev`.

Между этим шагом и Step 6 эндпоинт живёт, но безопасен: `WEBHOOK_TOKEN` не задан, `expected === ''`, всё кроме HEAD получает 404.

- [ ] **Step 5 (USER): Создать fine-grained PAT**

В браузере: **github.com/settings/personal-access-tokens/new** →
- Token name: `trello-webhook-worker-dispatch`
- Resource owner: `bazha`
- Expiration: **1 year** (запиши получившуюся дату — 2027-09-09 при выпуске сегодня; она пойдёт в память проекта в Task 6 Step 5)
- Repository access: **Only select repositories** → `archmentor`
- Repository permissions: **Actions → Read and write** (`Metadata → Read-only` добавится само)

Ничего больше не включать. Это НЕ `GH_PAT`: у того есть право пуша в master, и его копия в Worker'е означала бы, что утечка Worker'а = утечка записи в репозиторий.

- [ ] **Step 6 (USER): Сгенерировать токен пути и положить три секрета**

```
! openssl rand -hex 32
```

Сохранить вывод (он понадобится в Task 5 Step 4) и положить секреты — каждая команда спросит значение в stdin:

```
! npx wrangler secret put GH_DISPATCH_TOKEN --config workers/trello-webhook/wrangler.toml
! npx wrangler secret put TRELLO_INPROGRESS_LIST_ID --config workers/trello-webhook/wrangler.toml
! npx wrangler secret put WEBHOOK_TOKEN --config workers/trello-webhook/wrangler.toml
```

Значения: PAT из Step 5; id списка In Progress (`6a60b020daa8e07f3df0e6c4`, он же в GitHub Secrets); hex-строка из `openssl`.

- [ ] **Step 7: Проверить список секретов**

```bash
npx wrangler secret list --config workers/trello-webhook/wrangler.toml
```
Expected: три имени — `GH_DISPATCH_TOKEN`, `TRELLO_INPROGRESS_LIST_ID`, `WEBHOOK_TOKEN`. Значения не отдаются, и это правильно.

- [ ] **Step 8: Проверить живой эндпоинт**

```bash
curl -sI  "https://trello-webhook.bazhanau.workers.dev/trello/<WEBHOOK_TOKEN>" | head -1
curl -s -o /dev/null -w '%{http_code}\n' -X POST \
  -H 'content-type: application/json' -d '{"action":{"type":"updateCard","data":{}}}' \
  "https://trello-webhook.bazhanau.workers.dev/trello/definitely-wrong"
```
Expected: `HTTP/2 200` на HEAD; `404` на POST по неверному пути.

Оба ответа не запускают воркфлоу. Проверить, что не запустили: `gh run list --workflow=trello-agent.yml --limit 3` — новых запусков быть не должно.

- [ ] **Step 9: Коммит**

```bash
git add workers/trello-webhook/wrangler.toml .gitignore
git commit -m "chore(worker): wrangler config for the trello-webhook worker"
```

---

### Task 5: Переключение вебхука Trello

**Files:**
- Modify: `.github/workflows/trello-agent.yml:4-5` (комментарий в шапке)

**Interfaces:**
- Consumes: URL Worker'а и `WEBHOOK_TOKEN` из Task 4.
- Produces: ровно один активный вебхук Trello, смотрящий на Worker.

Весь риск миграции здесь. Два живых вебхука на одну доску = два dispatch'а на одно перетаскивание.

- [ ] **Step 1: Загрузить креды Trello и посмотреть, что есть**

```bash
set -a; source ~/docker/n8n/trello.env; set +a
curl -s "https://api.trello.com/1/tokens/$TRELLO_TOKEN/webhooks?key=$TRELLO_KEY" \
  | jq -r '.[] | "\(.id)  \(.callbackURL)  active=\(.active)"'
```
Expected: одна запись на `https://myth-thievish-backlash.ngrok-free.dev/...`. Если записей больше одной — остановиться и разобраться, прежде чем что-либо удалять.

- [ ] **Step 2: Остановить контейнеры**

```bash
cd ~/docker/n8n && docker compose stop
```
**Без `down`, без `-v`.** Волюм `n8n_data` — единственный путь откатa.

- [ ] **Step 3: Удалить старый вебхук**

```bash
curl -s -X DELETE "https://api.trello.com/1/webhooks/<OLD_ID>?key=$TRELLO_KEY&token=$TRELLO_TOKEN" -o /dev/null -w '%{http_code}\n'
```
Expected: `200`.

- [ ] **Step 4: Создать новый**

```bash
curl -s -X POST "https://api.trello.com/1/webhooks?key=$TRELLO_KEY&token=$TRELLO_TOKEN" \
  --data-urlencode "callbackURL=https://trello-webhook.bazhanau.workers.dev/trello/<WEBHOOK_TOKEN>" \
  --data-urlencode "idModel=6a60afe8fa78c7079643cd70" \
  --data-urlencode "description=trello-agent via cloudflare worker" | jq '{id, active, callbackURL}'
```
Expected: JSON с `active: true`. Trello синхронно дёрнет HEAD и создаст вебхук только при `200` — если получишь ошибку, вернись к Task 4 Step 8, вебхук не создан, и надо чинить Worker (откат не требуется).

- [ ] **Step 5: Проверить, что он один**

```bash
curl -s "https://api.trello.com/1/tokens/$TRELLO_TOKEN/webhooks?key=$TRELLO_KEY" | jq 'length'
```
Expected: `1`.

- [ ] **Step 6: Обновить комментарий в воркфлоу**

В `.github/workflows/trello-agent.yml` заменить строки 4-5:

```yaml
  # A Cloudflare Worker (workers/trello-webhook) triggers this event-driven via
  # workflow_dispatch on card → In Progress and on a user comment.
  # The schedule is only a rare safety-net fallback in case the Worker or the GitHub API is down.
```

- [ ] **Step 7: Коммит**

```bash
git add .github/workflows/trello-agent.yml
git commit -m "docs(trello-agent): the event-driven trigger is now a Cloudflare Worker"
```

---

### Task 6: Приёмка на живой доске

**Files:**
- Modify: `/Users/arthur/.claude-work/projects/-Users-arthur-Documents-work-learna/memory/n8n-selfhosted-trello-automation.md` (перезаписывается целиком)
- Modify: `/Users/arthur/.claude-work/projects/-Users-arthur-Documents-work-learna/memory/MEMORY.md` (строка-указатель)

**Interfaces:**
- Consumes: работающий вебхук из Task 5.
- Produces: подтверждение, что все три сценария проходят. До этого ничего не сносим.

Все три обязательны. Пока они не пройдены, `docker compose down` из Task 7 делать нельзя.

- [ ] **Step 1 (USER): Позитивный сценарий**

Создать небольшую тестовую карточку и перетащить её в **In Progress**. Затем:

```bash
gh run list --workflow=trello-agent.yml --limit 5
```
Expected: новый запуск появляется в течение секунд, и он **ровно один**. Два запуска на одно перетаскивание = фильтр по `listAfter` не работает; тогда остановиться, вернуть карточку назад и разбираться (юнит-тест на `posOnlyInInProgress` должен был это поймать — значит фикстура не совпала с реальным payload'ом, и надо снять настоящий через `npx wrangler tail`).

Дать циклу доработать: агент открывает PR → смержить → `gh run list --workflow=trello-done.yml` показывает запуск → карточка в **Done** с одним комментарием `🤖 ✅`.

- [ ] **Step 2 (USER): Негативный сценарий — главный**

Переименовать карточку, которая **уже лежит** в In Progress (например, ту же, если она ещё там, или любую другую).

```bash
gh run list --workflow=trello-agent.yml --limit 5
```
Expected: новых запусков нет. Это проверка настоящего payload'а Trello против того же правила, что покрыто юнит-тестом `renamedInInProgress`.

- [ ] **Step 3 (USER): Диалоговый сценарий**

На карточке с лейблом `needs-info` ответить обычным комментарием (без `🤖`). Expected: новый запуск `trello-agent.yml` в течение секунд. Комментарий самого агента (начинается с `🤖`) запуска давать не должен — это видно по тому, что после `finalize` лишних запусков не появилось.

- [ ] **Step 4: Посмотреть логи Worker'а**

```bash
npx wrangler tail --config workers/trello-webhook/wrangler.toml
```
Пока стрим открыт — подвигать карточку. Expected: строки вида `[trello-webhook] updateCard card=… dispatch=true (card moved into In Progress)` и `dispatch=false` на парном pos-экшене. Убедиться, что `WEBHOOK_TOKEN` не появляется в **наших** строках `[trello-webhook] …`. Учти:
собственная строка доступа wrangler (`[wrangler:info] POST /trello/<токен> 200 OK`) URL печатает
целиком — это свойство платформы, а не наш лог, и видит её только владелец аккаунта. Проверено
локально в Task 4 Step 3.

- [ ] **Step 5: Перезаписать память проекта**

Заменить содержимое `memory/n8n-selfhosted-trello-automation.md` (frontmatter `name`/`description`/`metadata` сохранить, `description` обновить) так, чтобы там было: стек — Cloudflare Worker `workers/trello-webhook`, URL `https://trello-webhook.bazhanau.workers.dev` (без токена пути), три секрета и их назначение, **дата истечения PAT** из Task 4 Step 5, команда деплоя с `CLOUDFLARE_ACCOUNT_ID`, `account_id` `86e23b29daf9f14757296b5485cdfd59`, факт что Trello-креды теперь в `~/.config/trello/env`, готча про `listAfter`, и что n8n не осталось ни в каком виде. Строку в `MEMORY.md` обновить под новое описание.

- [ ] **Step 6: Коммит**

Файлы памяти лежат вне репозитория и не коммитятся. Коммитить в этой задаче нечего — если рабочее дерево чистое, задача закрыта.

```bash
git status --short
```
Expected: пусто.

---

### Task 7: Снос локального n8n

**Files:** нет (операции в `~/docker/n8n` и во внешних сервисах).

**Interfaces:**
- Consumes: пройденную приёмку из Task 6.
- Produces: мак, который можно выключить, не ломая автоматику.

Делается **только** после Task 6. Шаг 2 — отложенный, не раньше 2026-09-16.

- [ ] **Step 1: Вынести Trello-креды до любого удаления**

```bash
mkdir -p ~/.config/trello
cp ~/docker/n8n/trello.env ~/.config/trello/env
chmod 600 ~/.config/trello/env
grep -c TRELLO ~/.config/trello/env
```
Expected: `2` (key и token на месте).

В GitHub Secrets токен write-only, и `~/docker/n8n/trello.env` — единственная копия на руках. Потерять её = перевыпуск токена, а перевыпуск убивает все вебхуки старого токена, то есть саму автоматику.

- [ ] **Step 2: Погасить контейнеры, сохранив волюм**

```bash
cd ~/docker/n8n && docker compose down
docker volume ls | grep n8n_data
```
Expected: волюм `n8n_data` на месте. **`-v` не добавлять.** Откат до шага 3 стоит две команды: `docker compose up -d` + перерегистрировать вебхук на ngrok-домен.

- [ ] **Step 3: Проверить, что мак больше не нужен**

С телефона перевести карточку в In Progress (Docker при этом погашен). Затем:

```bash
gh run list --workflow=trello-agent.yml --limit 3
```
Expected: запуск есть. Это и есть цель всей миграции.

- [ ] **Step 4 (USER, не раньше 2026-09-16): Окончательная зачистка**

После недели нормальной работы:

```
! cd ~/docker/n8n && docker compose down -v
! rm -rf ~/docker/n8n
! docker image rm docker.n8n.io/n8nio/n8n:2.36.0 ngrok/ngrok:3.39.11
```

И во внешних сервисах: освободить закреплённый домен `myth-thievish-backlash.ngrok-free.dev` и удалить аккаунт ngrok; удалить аккаунт n8n Cloud `bazhanau.app.n8n.cloud` (держался как rollback до 2026-09-01, срок истёк).

После `down -v` откат невозможен: вместе с волюмом уходят креды и сам воркфлоу n8n. К этому моменту `~/.config/trello/env` из Step 1 должен существовать — перепроверить перед выполнением.

---

## Итоговая проверка (критерии готовности из спеки)

- [ ] `npm test` зелёный, включая все кейсы фильтра; `npm run typecheck:worker` зелёный; оба под CI-гейтом на pull_request.
- [ ] Worker задеплоен, отвечает `200` на HEAD и `404` на неверный путь.
- [ ] Trello-вебхуков на доску ровно один, смотрит на Worker, `active=true`.
- [ ] Все три сценария приёмки пройдены, включая негативный.
- [ ] Контейнеры остановлены, `trello.env` скопирован в `~/.config/trello/env`.
- [ ] Карточка, переведённая в In Progress с телефона при выключенном Docker, запускает агента.
