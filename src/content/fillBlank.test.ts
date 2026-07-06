import { describe, it, expect } from 'vitest';
import { QuestionSchema } from './schema';
import { fillBlankQuestions } from './fillBlank';
import { getConcept } from './index';

describe('fill-blank questions', () => {
  it('are schema-valid fill-blank questions with a blank marker', () => {
    for (const q of fillBlankQuestions) {
      expect(() => QuestionSchema.parse(q)).not.toThrow();
      expect(q.type).toBe('fill-blank');
      expect(q.prompt.ru).toContain('___');
      expect(q.prompt.en).toContain('___');
      expect(q.options.ru.length).toBe(q.options.en.length);
      expect(q.correctIndex).toBeLessThan(q.options.ru.length);
      expect(q.conceptId && getConcept(q.conceptId), `${q.id} conceptId resolves`).toBeTruthy();
    }
  });
});
