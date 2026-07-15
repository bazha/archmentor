import { describe, it, expect } from 'vitest';
import { scenarios, componentNames, validateScenarios } from './diagram';
import { COMPONENT_TYPES } from '@/domain/diagram/types';
import { validate, isPassed } from '@/domain/diagram/validate';

describe('diagram content', () => {
  it('has at least 3 scenarios and passes Zod + cross-ref validation', () => {
    expect(scenarios.length).toBeGreaterThanOrEqual(3);
    expect(() => validateScenarios(scenarios)).not.toThrow();
  });

  it('every component type has a bilingual name', () => {
    for (const t of COMPONENT_TYPES) {
      expect(componentNames[t].ru.length).toBeGreaterThan(0);
      expect(componentNames[t].en.length).toBeGreaterThan(0);
    }
  });

  it('every scenario reference passes its own constraints (rules are not over-rigid)', () => {
    for (const sc of scenarios) {
      expect(isPassed(validate(sc.reference, sc.constraints))).toBe(true);
    }
  });

  it('a valid alternative (NoSQL instead of SQL) still passes url-shortener', () => {
    const sc = scenarios.find((s) => s.id === 'url-shortener')!;
    // Swap the sql-db node type to nosql-db, keep everything else.
    const alt = {
      nodes: sc.reference.nodes.map((n) => (n.type === 'sql-db' ? { ...n, type: 'nosql-db' as const } : n)),
      edges: sc.reference.edges,
    };
    expect(isPassed(validate(alt, sc.constraints))).toBe(true);
  });
});
