import { describe, it, expect } from 'vitest';
import { validate, isPassed } from './validate';
import { addNode, addEdge, emptyDiagram } from './edit';
import type { Constraint, Diagram } from './types';

// Helper: build a diagram from (type) nodes with auto ids, then wire edges by node index.
function build(types: string[], edges: [number, number][] = []): Diagram {
  let d = emptyDiagram;
  types.forEach((t, i) => { d = addNode(d, t as never, `${t}-${i}`); });
  edges.forEach(([a, b]) => { d = addEdge(d, d.nodes[a].id, d.nodes[b].id); });
  return d;
}

describe('validate', () => {
  it('required-node → ok when present, fail when missing', () => {
    const c: Constraint[] = [{ kind: 'required-node', node: 'cache' }];
    expect(validate(build(['cache']), c)[0].status).toBe('ok');
    expect(validate(build(['api-server']), c)[0].status).toBe('fail');
  });

  it('any-of → ok when at least one present, fail when none', () => {
    const c: Constraint[] = [{ kind: 'any-of', nodes: ['sql-db', 'nosql-db'] }];
    expect(validate(build(['nosql-db']), c)[0].status).toBe('ok');
    expect(validate(build(['sql-db']), c)[0].status).toBe('ok');
    expect(validate(build(['api-server']), c)[0].status).toBe('fail');
  });

  it('forbidden-node → severity when present, ok when absent', () => {
    const warn: Constraint[] = [{ kind: 'forbidden-node', node: 'message-queue', severity: 'warn' }];
    expect(validate(build(['message-queue']), warn)[0].status).toBe('warn');
    expect(validate(build(['api-server']), warn)[0].status).toBe('ok');
    const fail: Constraint[] = [{ kind: 'forbidden-node', node: 'message-queue', severity: 'fail' }];
    expect(validate(build(['message-queue']), fail)[0].status).toBe('fail');
  });

  it('required-edge → ok when a matching typed edge exists, warn otherwise', () => {
    const c: Constraint[] = [{ kind: 'required-edge', from: 'api-server', to: 'cache' }];
    expect(validate(build(['api-server', 'cache'], [[0, 1]]), c)[0].status).toBe('ok');
    expect(validate(build(['api-server', 'cache']), c)[0].status).toBe('warn'); // nodes present, no edge
    expect(validate(build(['api-server', 'cache'], [[1, 0]]), c)[0].status).toBe('warn'); // wrong direction
  });

  it('between → ok when from→middle and middle→to both exist, warn otherwise', () => {
    const c: Constraint[] = [{ kind: 'between', middle: 'rate-limiter', from: 'client', to: 'api-server' }];
    const ok = build(['client', 'rate-limiter', 'api-server'], [[0, 1], [1, 2]]);
    expect(validate(ok, c)[0].status).toBe('ok');
    const direct = build(['client', 'rate-limiter', 'api-server'], [[0, 2]]); // bypasses limiter
    expect(validate(direct, c)[0].status).toBe('warn');
  });

  it('isPassed is true when there are no fails (warns allowed)', () => {
    const results = validate(build(['api-server', 'cache']), [
      { kind: 'required-node', node: 'api-server' },
      { kind: 'required-edge', from: 'api-server', to: 'cache' }, // warn (no edge)
    ]);
    expect(results.map((r) => r.status)).toEqual(['ok', 'warn']);
    expect(isPassed(results)).toBe(true);
  });

  it('isPassed is false when a required node is missing', () => {
    const results = validate(build(['cache']), [{ kind: 'required-node', node: 'api-server' }]);
    expect(isPassed(results)).toBe(false);
  });
});
