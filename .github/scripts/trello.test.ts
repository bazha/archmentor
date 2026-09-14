// Tests for .github/scripts/trello.sh.
//
// The script is executed unmodified: a fake `curl` is placed on PATH (see fake-curl.mjs),
// so every Trello request is answered from a fixture and recorded. What is asserted is the
// script's observable behaviour — stdout, logs, the card file it writes, and the exact
// requests it makes.
import { spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const SCRIPT = resolve(__dirname, 'trello.sh');
const FAKE_CURL = resolve(__dirname, 'fake-curl.mjs');

const IN_PROGRESS = 'list-in-progress';
const IN_REVIEW = 'list-in-review';
const DONE = 'list-done';

const WIP = 'lbl-wip';
const INFO = 'lbl-info';

const DEFAULT_LABELS = [
  { id: WIP, name: 'claude:wip', color: 'yellow' },
  { id: INFO, name: 'needs-info', color: 'orange' },
];

type Card = { id: string; name?: string; desc?: string; idLabels?: string[]; pos?: number };
type Comment = { date: string; data: { text: string } };
type Scenario = {
  labels?: { id: string; name: string; color: string }[];
  cards?: Card[];
  comments?: Record<string, Comment[]>;
  fail?: string[];
};

type Call = { method: string; path: string; query: Record<string, string>; data: Record<string, string> };

type Run = {
  status: number;
  stdout: string;
  stderr: string;
  calls: Call[];
  cardFile: () => unknown;
};

function run(argv: string[], scenario: Scenario, resultFile?: unknown): Run {
  const work = mkdtempSync(join(tmpdir(), 'trello-sh-'));
  const bin = join(work, 'bin');
  mkdirSync(bin);

  // The shim has to be literally named `curl` — that is what trello.sh invokes.
  const shim = join(bin, 'curl');
  writeFileSync(shim, `#!/bin/sh\nexec node ${JSON.stringify(FAKE_CURL)} "$@"\n`);
  chmodSync(shim, 0o755);

  const scenarioPath = join(work, 'scenario.json');
  const logPath = join(work, 'calls.jsonl');
  writeFileSync(scenarioPath, JSON.stringify({ labels: DEFAULT_LABELS, ...scenario }));
  writeFileSync(logPath, '');

  if (resultFile !== undefined) {
    writeFileSync(join(work, '.trello-result.json'), JSON.stringify(resultFile));
  }

  // spawnSync, not execFileSync: the latter only hands back stderr when the command
  // fails, and most of these assertions are about logs on a successful run.
  const proc = spawnSync('bash', [SCRIPT, ...argv], {
    cwd: work,
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `${bin}:${process.env.PATH}`,
      TRELLO_KEY: 'test-key',
      TRELLO_TOKEN: 'test-token',
      TRELLO_BOARD_ID: 'board-1',
      TRELLO_INPROGRESS_LIST_ID: IN_PROGRESS,
      TRELLO_INREVIEW_LIST_ID: IN_REVIEW,
      TRELLO_DONE_LIST_ID: DONE,
      FAKE_CURL_SCENARIO: scenarioPath,
      FAKE_CURL_LOG: logPath,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const status = proc.status ?? 1;
  const stdout = proc.stdout ?? '';
  const stderr = proc.stderr ?? '';

  const calls = readFileSync(logPath, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as Call);

  return {
    status,
    stdout,
    stderr,
    calls,
    cardFile: () => {
      const file = join(work, '.trello-card.json');
      return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : undefined;
    },
  };
}

const comments = (...texts: string[]): Comment[] =>
  // Trello returns comments newest first; the fixtures must match that.
  texts.map((text, i) => ({ date: `2026-09-0${texts.length - i}T00:00:00.000Z`, data: { text } }));

const commentTexts = (calls: Call[]) =>
  calls.filter((c) => c.path.endsWith('/actions/comments')).map((c) => c.data.text);

const labelsAdded = (calls: Call[]) =>
  calls.filter((c) => c.method === 'POST' && c.path.endsWith('/idLabels')).map((c) => c.query.value);

const labelsRemoved = (calls: Call[]) =>
  calls.filter((c) => c.method === 'DELETE').map((c) => c.path.split('/').pop());

const moves = (calls: Call[]) =>
  calls.filter((c) => c.method === 'PUT' && c.query.idList).map((c) => ({ card: c.path.split('/')[2], list: c.query.idList }));

const descriptions = (calls: Call[]) =>
  calls.filter((c) => c.method === 'PUT' && c.data.desc !== undefined).map((c) => c.data.desc);

const HEALTH_CARD = '🫀 Health — board automation';

describe('trello.sh select-and-claim', () => {
  it('takes the card with the lowest pos', () => {
    const r = run(['select-and-claim'], {
      cards: [
        { id: 'card-late', name: 'Late', pos: 200, idLabels: [] },
        { id: 'card-early', name: 'Early', pos: 100, idLabels: [] },
      ],
      comments: { 'card-early': [], 'card-late': [] },
    });
    expect(r.status).toBe(0);
    expect(r.stdout.trim()).toBe('card-early');
  });

  it('skips cards already carrying claude:wip', () => {
    const r = run(['select-and-claim'], {
      cards: [
        { id: 'card-busy', name: 'Busy', pos: 100, idLabels: [WIP] },
        { id: 'card-free', name: 'Free', pos: 200, idLabels: [] },
      ],
      comments: { 'card-free': [] },
    });
    expect(r.stdout.trim()).toBe('card-free');
  });

  it('skips a needs-info card whose last comment came from the agent', () => {
    const r = run(['select-and-claim'], {
      cards: [
        { id: 'card-waiting', name: 'Waiting', pos: 100, idLabels: [INFO] },
        { id: 'card-plain', name: 'Plain', pos: 200, idLabels: [] },
      ],
      comments: {
        'card-waiting': comments('🤖 ❓ Нужны уточнения', 'вопрос пользователя'),
        'card-plain': [],
      },
    });
    expect(r.stdout.trim()).toBe('card-plain');
  });

  it('skips a needs-info card with no comments at all', () => {
    const r = run(['select-and-claim'], {
      cards: [
        { id: 'card-silent', name: 'Silent', pos: 100, idLabels: [INFO] },
        { id: 'card-plain', name: 'Plain', pos: 200, idLabels: [] },
      ],
      comments: { 'card-silent': [], 'card-plain': [] },
    });
    expect(r.stdout.trim()).toBe('card-plain');
  });

  it('reopens a needs-info card when the user replied last, and drops the label', () => {
    const r = run(['select-and-claim'], {
      cards: [{ id: 'card-answered', name: 'Answered', pos: 100, idLabels: [INFO] }],
      comments: { 'card-answered': comments('да, делай через zustand', '🤖 ❓ Нужны уточнения') },
    });
    expect(r.stdout.trim()).toBe('card-answered');
    expect(labelsRemoved(r.calls)).toContain(INFO);
    expect(r.stderr).toContain('reopened=1');
  });

  it('exits cleanly with empty stdout when nothing is eligible', () => {
    const r = run(['select-and-claim'], { cards: [] });
    expect(r.status).toBe(0);
    expect(r.stdout).toBe('');
    expect(r.stderr).toContain('no eligible card');
  });

  it('writes the card file with the conversation oldest-first', () => {
    const r = run(['select-and-claim'], {
      cards: [{ id: 'card-1', name: 'Some card', desc: 'do the thing', pos: 100, idLabels: [] }],
      comments: { 'card-1': comments('newest', 'middle', 'oldest') },
    });
    expect(r.cardFile()).toEqual({
      id: 'card-1',
      name: 'Some card',
      desc: 'do the thing',
      comments: [
        { text: 'oldest', date: expect.any(String) },
        { text: 'middle', date: expect.any(String) },
        { text: 'newest', date: expect.any(String) },
      ],
    });
  });

  it('claims the card with the wip label and an agent comment', () => {
    const r = run(['select-and-claim'], {
      cards: [{ id: 'card-1', name: 'Some card', pos: 100, idLabels: [] }],
      comments: { 'card-1': [] },
    });
    expect(labelsAdded(r.calls)).toEqual([WIP]);
    expect(commentTexts(r.calls)).toHaveLength(1);
    expect(commentTexts(r.calls)[0]).toMatch(/^🤖/);
  });

  // The workflow captures stdout as the card id; a stray log line there would break it.
  it('prints the card id on stdout and nothing else', () => {
    const r = run(['select-and-claim'], {
      cards: [{ id: 'card-1', name: 'Some card', pos: 100, idLabels: [] }],
      comments: { 'card-1': [] },
    });
    expect(r.stdout).toBe('card-1\n');
    expect(r.stderr).toContain('[trello]');
  });

  it('creates the labels when the board does not have them yet', () => {
    const r = run(['select-and-claim'], {
      labels: [],
      cards: [{ id: 'card-1', name: 'Some card', pos: 100, idLabels: [] }],
      comments: { 'card-1': [] },
    });
    const created = r.calls.filter((c) => c.path === '/labels').map((c) => c.data.name);
    expect(created).toEqual(['claude:wip', 'needs-info']);
    expect(labelsAdded(r.calls)).toEqual(['lbl-created-claude:wip']);
  });
});

describe('trello.sh finalize', () => {
  const card = { id: 'card-1', name: 'Some card', pos: 100, idLabels: [WIP] };

  it('returns the card to the queue when the result file is missing', () => {
    const r = run(['finalize', 'card-1'], { cards: [card] });
    expect(r.status).toBe(0);
    expect(commentTexts(r.calls)[0]).toContain('⚠️');
    expect(labelsRemoved(r.calls)).toEqual([WIP]);
    expect(moves(r.calls)).toEqual([]);
  });

  it('moves the card to In Review and links the PR', () => {
    const r = run(['finalize', 'card-1'], { cards: [card] }, {
      status: 'pr',
      prUrl: 'https://github.com/bazha/archmentor/pull/42',
    });
    expect(commentTexts(r.calls)[0]).toContain('https://github.com/bazha/archmentor/pull/42');
    expect(moves(r.calls)).toEqual([{ card: 'card-1', list: IN_REVIEW }]);
    expect(labelsRemoved(r.calls)).toEqual([WIP]);
  });

  it('does not move the card when status=pr but the PR url is empty', () => {
    const r = run(['finalize', 'card-1'], { cards: [card] }, { status: 'pr', prUrl: '' });
    expect(commentTexts(r.calls)[0]).toContain('PR открыть не удалось');
    expect(moves(r.calls)).toEqual([]);
    expect(labelsRemoved(r.calls)).toEqual([WIP]);
  });

  it('posts the questions and flags the card as needs-info', () => {
    const r = run(['finalize', 'card-1'], { cards: [card] }, {
      status: 'needs-info',
      questions: ['какой стор использовать?', 'нужна ли миграция?'],
    });
    expect(commentTexts(r.calls)[0]).toContain('• какой стор использовать?');
    expect(commentTexts(r.calls)[0]).toContain('• нужна ли миграция?');
    expect(labelsAdded(r.calls)).toEqual([INFO]);
    expect(labelsRemoved(r.calls)).toEqual([WIP]);
  });

  it('reports the note and flags needs-info on an unknown status', () => {
    const r = run(['finalize', 'card-1'], { cards: [card] }, { status: 'error', note: 'tests red' });
    expect(commentTexts(r.calls)[0]).toContain('tests red');
    expect(labelsAdded(r.calls)).toEqual([INFO]);
    expect(labelsRemoved(r.calls)).toEqual([WIP]);
  });
});

describe('trello.sh done', () => {
  const prUrl = 'https://github.com/bazha/archmentor/pull/42';

  it('moves the card to Done and comments with the PR link', () => {
    const r = run(['done', 'card-1', prUrl], {});
    expect(r.status).toBe(0);
    expect(moves(r.calls)).toEqual([{ card: 'card-1', list: DONE }]);
    expect(commentTexts(r.calls)[0]).toContain(prUrl);
  });

  // A card already in Done, or deleted, must not fail the merge workflow.
  it('still comments and succeeds when the move fails', () => {
    const r = run(['done', 'card-1', prUrl], { fail: ['PUT /cards/card-1'] });
    expect(r.status).toBe(0);
    expect(r.stderr).toContain('move to Done failed');
    expect(commentTexts(r.calls)[0]).toContain(prUrl);
  });

  it('succeeds even when the comment fails', () => {
    const r = run(['done', 'card-1', prUrl], { fail: ['POST /cards/card-1/actions/comments'] });
    expect(r.status).toBe(0);
    expect(r.stderr).toContain('comment failed');
  });
});

describe('trello.sh health', () => {
  const existing = { boardCards: [{ id: 'card-health', name: HEALTH_CARD }] };

  it('records a successful check in the card description and stays quiet', () => {
    const r = run(['health', 'ok', 'worker 200, webhook active, PAT 365d left'], existing);
    expect(r.status).toBe(0);
    expect(descriptions(r.calls)[0]).toContain('✅');
    expect(descriptions(r.calls)[0]).toContain('worker 200, webhook active, PAT 365d left');
    // A daily comment would bury the card in noise; success only rewrites the description.
    expect(commentTexts(r.calls)).toEqual([]);
  });

  it('comments as well as updating the description when something is wrong', () => {
    const r = run(['health', 'fail', 'Worker не отвечает на HEAD (код 000)'], existing);
    expect(r.status).toBe(0);
    expect(descriptions(r.calls)[0]).toContain('❌');
    expect(commentTexts(r.calls)).toHaveLength(1);
    expect(commentTexts(r.calls)[0]).toContain('Worker не отвечает на HEAD (код 000)');
  });

  // Without the marker this very comment would dispatch the agent through the Worker.
  it('prefixes the failure comment with the agent marker so it cannot wake the agent', () => {
    const r = run(['health', 'fail', 'что-то сломалось'], existing);
    expect(commentTexts(r.calls)[0]).toMatch(/^🤖/);
  });

  it('creates the health card in Done when the board does not have it', () => {
    const r = run(['health', 'ok', 'all good'], { boardCards: [{ id: 'card-other', name: 'Something else' }] });
    const created = r.calls.filter((c) => c.method === 'POST' && c.path === '/cards');
    expect(created).toHaveLength(1);
    expect(created[0].data.name).toBe(HEALTH_CARD);
    expect(created[0].data.idList).toBe(DONE);
    expect(r.calls.some((c) => c.method === 'PUT' && c.path === '/cards/card-created')).toBe(true);
  });

  it('reuses the existing health card instead of creating a second one', () => {
    const r = run(['health', 'ok', 'all good'], existing);
    expect(r.calls.filter((c) => c.method === 'POST' && c.path === '/cards')).toEqual([]);
    expect(r.calls.some((c) => c.method === 'PUT' && c.path === '/cards/card-health')).toBe(true);
  });
});
