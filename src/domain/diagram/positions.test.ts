import { describe, it, expect } from 'vitest';
import { gridSlot } from './positions';

describe('gridSlot', () => {
  it('is deterministic (same index -> same point)', () => {
    expect(gridSlot(3)).toEqual(gridSlot(3));
  });

  it('gives distinct points to distinct indices', () => {
    expect(gridSlot(0)).not.toEqual(gridSlot(1));
  });

  it('wraps to a new row after the column count (same x, greater y)', () => {
    expect(gridSlot(4).x).toBe(gridSlot(0).x);
    expect(gridSlot(4).y).toBeGreaterThan(gridSlot(0).y);
  });
});
