import { describe, it, expect } from 'vitest';
import { scenarios, componentNames, validateScenarios } from './diagram';
import { COMPONENT_TYPES } from '@/domain/diagram/types';
import { validate, isPassed } from '@/domain/diagram/validate';
import { GRADE_ORDER } from '@/lib/labels';

describe('diagram content', () => {
  it('has at least 8 scenarios and passes Zod + cross-ref validation', () => {
    expect(scenarios.length).toBeGreaterThanOrEqual(8);
    expect(() => validateScenarios(scenarios)).not.toThrow();
  });

  it('every component type has a bilingual name', () => {
    for (const t of COMPONENT_TYPES) {
      expect(componentNames[t].ru.length).toBeGreaterThan(0);
      expect(componentNames[t].en.length).toBeGreaterThan(0);
    }
  });

  it('every scenario has a valid grade and all four grades are covered', () => {
    for (const sc of scenarios) expect(GRADE_ORDER).toContain(sc.grade);
    for (const g of GRADE_ORDER) {
      expect(scenarios.filter((s) => s.grade === g).length).toBeGreaterThanOrEqual(1);
    }
  });

  it('every scenario reference passes its own constraints (rules are not over-rigid)', () => {
    for (const sc of scenarios) {
      expect(isPassed(validate(sc.reference, sc.constraints))).toBe(true);
    }
  });

  it('a valid alternative (NoSQL instead of SQL) still passes url-shortener', () => {
    const sc = scenarios.find((s) => s.id === 'url-shortener')!;
    const alt = {
      nodes: sc.reference.nodes.map((n) => (n.type === 'sql-db' ? { ...n, type: 'nosql-db' as const } : n)),
      edges: sc.reference.edges,
    };
    expect(isPassed(validate(alt, sc.constraints))).toBe(true);
  });

  it('news-feed passes without a CDN (CDN is warn-only, not hard-required)', () => {
    const sc = scenarios.find((s) => s.id === 'news-feed')!;
    const noCdn = {
      nodes: sc.reference.nodes.filter((n) => n.type !== 'cdn' && n.type !== 'object-store'),
      edges: sc.reference.edges.filter((e) => e.from !== 'cdn' && e.to !== 'cdn' && e.from !== 'object-store' && e.to !== 'object-store'),
    };
    expect(isPassed(validate(noCdn, sc.constraints))).toBe(true);
  });

  it('scenarios pass without a cache (cache is warn-only, not hard-required)', () => {
    for (const id of ['url-shortener', 'rate-limiter', 'news-feed', 'chat']) {
      const sc = scenarios.find((s) => s.id === id)!;
      const noCache = {
        nodes: sc.reference.nodes.filter((nd) => nd.type !== 'cache'),
        edges: sc.reference.edges.filter((e) => e.from !== 'cache' && e.to !== 'cache'),
      };
      expect(isPassed(validate(noCache, sc.constraints))).toBe(true);
    }
  });

  it('constraint explanations, where present, are valid bilingual', () => {
    let withExplain = 0;
    for (const sc of scenarios) {
      for (const c of sc.constraints) {
        if ('explain' in c && c.explain) {
          expect(c.explain.ru.length).toBeGreaterThan(0);
          expect(c.explain.en.length).toBeGreaterThan(0);
          withExplain++;
        }
      }
    }
    expect(withExplain).toBeGreaterThanOrEqual(12); // key constraints across all 8 scenarios

    const scenariosWithExplain = scenarios.filter((sc) => sc.constraints.some((c) => 'explain' in c && c.explain));
    expect(scenariosWithExplain.length).toBeGreaterThanOrEqual(7);
  });
});
