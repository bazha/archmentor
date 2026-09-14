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
