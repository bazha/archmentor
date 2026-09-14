#!/usr/bin/env node
// A stand-in for `curl`, used only by trello.test.ts.
//
// The test puts a `curl` shim pointing here on PATH, so .github/scripts/trello.sh
// runs completely unmodified while every request is answered from a fixture and
// recorded for assertions.
//
// Env:
//   FAKE_CURL_SCENARIO — path to the JSON fixture describing the board
//   FAKE_CURL_LOG      — path to the JSONL file every request is appended to
//
// Scenario shape:
//   { labels: [{id,name,color}],
//     cards:  [{id,name,desc,idLabels,pos}],
//     comments: { "<cardId>": [{date, data:{text}}] },   // newest first, like Trello
//     fail: ["PUT /cards/c-1"] }                          // requests that exit non-zero
import { appendFileSync, readFileSync } from 'node:fs';

const args = process.argv.slice(2);

let method = 'GET';
let url = null;
const data = {};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '-X') {
    method = args[++i];
  } else if (arg === '--data-urlencode') {
    const pair = args[++i] ?? '';
    const eq = pair.indexOf('=');
    data[pair.slice(0, eq)] = pair.slice(eq + 1);
  } else if (arg === '--connect-timeout' || arg === '--max-time') {
    i++; // skip the value; trello.sh always passes these
  } else if (arg.startsWith('-')) {
    // -fsS and friends: nothing to emulate
  } else if (url === null) {
    url = arg;
  }
}

if (url === null) {
  process.stderr.write('fake-curl: no URL in arguments\n');
  process.exit(2);
}

const parsed = new URL(url);
const path = parsed.pathname.replace(/^\/1/, '');
const query = Object.fromEntries(
  [...parsed.searchParams.entries()].filter(([k]) => k !== 'key' && k !== 'token'),
);

const scenario = JSON.parse(readFileSync(process.env.FAKE_CURL_SCENARIO, 'utf8'));

if (process.env.FAKE_CURL_LOG) {
  appendFileSync(
    process.env.FAKE_CURL_LOG,
    `${JSON.stringify({ method, path, query, data })}\n`,
  );
}

// Requests the scenario wants to fail: curl -f exits 22 on an HTTP error.
for (const pattern of scenario.fail ?? []) {
  if (`${method} ${path}`.startsWith(pattern)) {
    process.stderr.write(`fake-curl: simulated failure for ${method} ${path}\n`);
    process.exit(22);
  }
}

const send = (value) => {
  process.stdout.write(typeof value === 'string' ? value : JSON.stringify(value));
  process.exit(0);
};

let match;

if (method === 'GET' && /^\/boards\/[^/]+\/labels$/.test(path)) {
  send(scenario.labels ?? []);
}

if (method === 'GET' && /^\/lists\/[^/]+\/cards$/.test(path)) {
  send(scenario.cards ?? []);
}

if (method === 'GET' && (match = path.match(/^\/cards\/([^/]+)\/actions$/))) {
  const all = (scenario.comments ?? {})[match[1]] ?? [];
  const limit = Number(query.limit ?? all.length);
  send(all.slice(0, limit));
}

if (method === 'POST' && path === '/labels') {
  send({ id: `lbl-created-${data.name}`, name: data.name, color: data.color });
}

// Everything else trello.sh calls is fire-and-forget: idLabels, comments, card moves.
if (
  (method === 'POST' && /^\/cards\/[^/]+\/idLabels$/.test(path)) ||
  (method === 'DELETE' && /^\/cards\/[^/]+\/idLabels\/[^/]+$/.test(path)) ||
  (method === 'POST' && /^\/cards\/[^/]+\/actions\/comments$/.test(path)) ||
  (method === 'PUT' && /^\/cards\/[^/]+$/.test(path))
) {
  send('');
}

process.stderr.write(`fake-curl: unhandled request ${method} ${path}\n`);
process.exit(2);
