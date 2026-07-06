import { describe, it, expect } from 'vitest';
import { concepts, questions, getConcept } from './index';
import { validateContent } from './schema';

describe('content catalog', () => {
  it('passes full content validation', () => {
    expect(() => validateContent(concepts, questions)).not.toThrow();
  });

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

  it('has unique concept and question ids', () => {
    expect(new Set(concepts.map((c) => c.id)).size).toBe(concepts.length);
    expect(new Set(questions.map((q) => q.id)).size).toBe(questions.length);
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

  it('all content is localized with en seeded from ru (phase A placeholder)', () => {
    for (const c of concepts) {
      expect(c.definition.ru).toBe(c.definition.en);
      expect(c.codeExample.code.ru).toBe(c.codeExample.code.en);
    }
    for (const q of questions) {
      expect(q.options.ru.length).toBe(q.options.en.length);
      expect(q.prompt.ru).toBe(q.prompt.en);
    }
  });
});
