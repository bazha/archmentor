import { describe, it, expect } from 'vitest';
import { concepts, questions, getConcept } from './index';

// Note: full structural validation (incl. duplicate ids) runs at import time via
// `validateContent` in ./index (DEV/test), so importing this module already guards
// it — those invariants aren't re-asserted here. `validateContent`'s own logic is
// unit-tested against invalid fixtures in ./schema.test.ts.
describe('content catalog', () => {
  it('is the complete catalog: 42 concepts across every category', () => {
    const byCat = (c: string) => concepts.filter((x) => x.category === c).length;
    expect(concepts).toHaveLength(42);
    expect(byCat('solid')).toBe(5);
    // 23 GoF patterns, complete: 5 creational + 7 structural + 11 behavioral.
    expect(byCat('creational')).toBe(5);
    expect(byCat('structural')).toBe(7);
    expect(byCat('behavioral')).toBe(11);
    expect(byCat('architecture')).toBe(8);
    expect(byCat('tradeoff')).toBe(6);
  });

  it('includes canonical concepts', () => {
    for (const id of ['srp', 'strategy', 'singleton', 'visitor', 'hexagonal', 'coupling-cohesion']) {
      expect(getConcept(id)).toBeDefined();
    }
  });

  it('has a rich quiz set with >= 4 identify-pattern', () => {
    expect(questions.length).toBeGreaterThanOrEqual(70);
    expect(questions.filter((q) => q.type === 'identify-pattern').length).toBeGreaterThanOrEqual(4);
  });

  it('identify-pattern distractors are real sibling concepts by name', () => {
    const names = new Set(concepts.map((c) => c.name));
    for (const q of questions.filter((q) => q.type === 'identify-pattern')) {
      for (const opt of q.options.ru) expect(names.has(opt)).toBe(true);
      for (const opt of q.options.en) expect(names.has(opt)).toBe(true);
    }
  });

  it('every English field is fully translated (no Cyrillic left)', () => {
    const cyr = /[А-Яа-яЁё]/;
    const bad: string[] = [];
    const check = (where: string, v: string) => { if (cyr.test(v)) bad.push(where); };
    for (const c of concepts) {
      check(`${c.id}.tagline`, c.tagline.en);
      check(`${c.id}.definition`, c.definition.en);
      check(`${c.id}.problem`, c.problem.en);
      check(`${c.id}.solution`, c.solution.en);
      check(`${c.id}.code`, c.codeExample.code.en);
      for (const f of ['pros', 'cons', 'tradeoffs', 'whenToUse', 'whenNotToUse'] as const)
        (c[f]?.en ?? []).forEach((x) => check(`${c.id}.${f}`, x));
    }
    for (const q of questions) {
      check(`${q.id}.prompt`, q.prompt.en);
      check(`${q.id}.explanation`, q.explanation.en);
      q.options.en.forEach((o) => check(`${q.id}.option`, o));
      if (q.code) check(`${q.id}.code`, q.code.code.en);
    }
    expect(bad, `Cyrillic left in en fields: ${bad.join(', ')}`).toEqual([]);
  });

  it('concept diagrams, where present, are non-empty Mermaid strings', () => {
    let withDiagram = 0;
    for (const c of concepts) {
      if (c.diagram !== undefined) {
        expect(typeof c.diagram).toBe('string');
        expect(c.diagram.trim().length).toBeGreaterThan(0);
        withDiagram++;
      }
    }
    expect(withDiagram).toBeGreaterThan(0); // strategy in Task 1
  });
});
