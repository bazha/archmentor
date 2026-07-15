import { describe, it, expect } from 'vitest';
import { diffDiagrams } from './diff';
import { addNode, addEdge, emptyDiagram } from './edit';
import type { Diagram } from './types';

function build(types: string[], edges: [number, number][] = []): Diagram {
  let d = emptyDiagram;
  types.forEach((t, i) => { d = addNode(d, t as never, `${t}-${i}`); });
  edges.forEach(([a, b]) => { d = addEdge(d, d.nodes[a].id, d.nodes[b].id); });
  return d;
}

describe('diffDiagrams', () => {
  it('marks user nodes match (type in reference) or extra (type not in reference)', () => {
    const user = build(['api-server', 'message-queue']);
    const ref = build(['api-server']);
    const diff = diffDiagrams(user, ref);
    expect(diff.userNodes['api-server-0']).toBe('match');
    expect(diff.userNodes['message-queue-1']).toBe('extra');
  });

  it('marks reference nodes match or missing (type absent from user)', () => {
    const user = build(['api-server']);
    const ref = build(['api-server', 'cache']);
    const diff = diffDiagrams(user, ref);
    expect(diff.refNodes['api-server-0']).toBe('match');
    expect(diff.refNodes['cache-1']).toBe('missing');
  });

  it('diffs edges by component type pair (match / extra / missing)', () => {
    const user = build(['api-server', 'cache'], [[0, 1]]);       // api-server -> cache
    const ref = build(['api-server', 'sql-db'], [[0, 1]]);       // api-server -> sql-db
    const diff = diffDiagrams(user, ref);
    expect(diff.userEdges[0]).toBe('extra');   // api->cache not in ref
    expect(diff.refEdges[0]).toBe('missing');  // api->sql not in user
  });

  it('matches by TYPE, not node id (different ids, same types → match)', () => {
    const user = build(['api-server', 'cache'], [[0, 1]]);
    const ref = build(['api-server', 'cache'], [[0, 1]]);
    const diff = diffDiagrams(user, ref);
    expect(Object.values(diff.userNodes)).toEqual(['match', 'match']);
    expect(diff.userEdges).toEqual(['match']);
    expect(diff.refEdges).toEqual(['match']);
  });
});
