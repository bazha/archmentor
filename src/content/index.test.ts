import { describe, it, expect } from 'vitest';
import { concepts, questions, getConcept } from './index';
import { validateContent } from './schema';

describe('seed content', () => {
  it('passes full content validation', () => {
    expect(() => validateContent(concepts, questions)).not.toThrow();
  });

  it('includes all 5 SOLID principles', () => {
    const solid = concepts.filter((c) => c.category === 'solid');
    expect(solid).toHaveLength(5);
  });

  it('includes the seed patterns', () => {
    for (const id of ['strategy', 'observer', 'factory-method']) {
      expect(getConcept(id)).toBeDefined();
    }
  });

  it('has at least 10 questions with >= 4 identify-pattern', () => {
    expect(questions.length).toBeGreaterThanOrEqual(10);
    expect(questions.filter((q) => q.type === 'identify-pattern').length).toBeGreaterThanOrEqual(4);
  });

  it('identify-pattern distractors are real sibling concepts by name', () => {
    const names = new Set(concepts.map((c) => c.name));
    for (const q of questions.filter((q) => q.type === 'identify-pattern')) {
      for (const opt of q.options) expect(names.has(opt)).toBe(true);
    }
  });
});
