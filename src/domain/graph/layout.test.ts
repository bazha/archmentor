import { describe, it, expect } from 'vitest';
import { layoutConcepts, CATEGORY_ORDER, type CategoryLike } from './layout';
import type { Category } from '@/content/schema';

const c = (id: string, category: Category): CategoryLike => ({ id, category });

describe('layoutConcepts', () => {
  it('gives every concept a position', () => {
    const items = [c('srp', 'solid'), c('factory', 'creational'), c('layers', 'architecture')];
    const pos = layoutConcepts(items);
    for (const it of items) {
      expect(pos[it.id]).toBeDefined();
      expect(typeof pos[it.id].x).toBe('number');
      expect(typeof pos[it.id].y).toBe('number');
    }
  });

  it('is deterministic (same input -> same output)', () => {
    const items = [c('a', 'solid'), c('b', 'solid'), c('z', 'behavioral')];
    expect(layoutConcepts(items)).toEqual(layoutConcepts(items));
  });

  it('separates categories into distinct clusters', () => {
    const solid = layoutConcepts([c('a', 'solid')])['a'];
    const beh = layoutConcepts([c('a', 'behavioral')])['a'];
    // same id, different category -> different cluster centre
    expect(solid).not.toEqual(beh);
  });

  it('exposes all six categories in a fixed order', () => {
    expect(CATEGORY_ORDER).toEqual(['solid', 'creational', 'structural', 'behavioral', 'architecture', 'tradeoff', 'microservices']);
  });
});
