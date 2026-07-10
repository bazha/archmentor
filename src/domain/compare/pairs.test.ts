import { describe, it, expect } from 'vitest';
import { selectConfusablePairs, type RelatedLike } from './pairs';

const c = (id: string, related: string[]): RelatedLike => ({ id, related });

describe('selectConfusablePairs', () => {
  it('finds mutual pairs and ignores one-directional related', () => {
    const concepts = [
      c('strategy', ['state', 'observer']), // strategy->observer is one-way
      c('state', ['strategy']),
      c('observer', []),
    ];
    expect(selectConfusablePairs(concepts)).toEqual([{ a: 'state', b: 'strategy' }]);
  });

  it('returns each unordered pair once (no {a,b}+{b,a} duplicates)', () => {
    const concepts = [c('factory-method', ['abstract-factory']), c('abstract-factory', ['factory-method'])];
    const pairs = selectConfusablePairs(concepts);
    expect(pairs).toHaveLength(1);
    expect(pairs[0]).toEqual({ a: 'abstract-factory', b: 'factory-method' });
  });

  it('is deterministic and sorted by a then b', () => {
    const concepts = [
      c('b1', ['a1']), c('a1', ['b1']),
      c('a2', ['a3']), c('a3', ['a2']),
    ];
    expect(selectConfusablePairs(concepts)).toEqual([
      { a: 'a1', b: 'b1' },
      { a: 'a2', b: 'a3' },
    ]);
  });

  it('returns empty when there are no mutual pairs', () => {
    expect(selectConfusablePairs([c('x', ['y']), c('y', [])])).toEqual([]);
  });
});
