import { describe, it, expect } from 'vitest';
import { selectConceptEdges, type RelatedLike } from './edges';

const c = (id: string, related: string[]): RelatedLike => ({ id, related });

describe('selectConceptEdges', () => {
  it('creates an undirected edge from a one-directional related link', () => {
    const edges = selectConceptEdges([c('strategy', ['state']), c('state', [])]);
    expect(edges).toEqual([{ a: 'state', b: 'strategy' }]);
  });

  it('dedupes a mutual pair into a single unordered edge', () => {
    const edges = selectConceptEdges([c('a', ['b']), c('b', ['a'])]);
    expect(edges).toEqual([{ a: 'a', b: 'b' }]);
  });

  it('ignores links to unknown ids and self-links', () => {
    const edges = selectConceptEdges([c('a', ['ghost', 'a', 'b']), c('b', [])]);
    expect(edges).toEqual([{ a: 'a', b: 'b' }]);
  });

  it('is deterministic and sorted by a then b', () => {
    const edges = selectConceptEdges([
      c('b1', ['a1']), c('a1', []),
      c('a2', ['a3']), c('a3', []),
    ]);
    expect(edges).toEqual([{ a: 'a1', b: 'b1' }, { a: 'a2', b: 'a3' }]);
  });
});
