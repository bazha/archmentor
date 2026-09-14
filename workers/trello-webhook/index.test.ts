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
