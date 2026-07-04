import { describe, it, expect } from 'vitest';
import { ConceptSchema, QuestionSchema, validateContent } from './schema';
import type { Concept, Question } from './schema';

const concept: Concept = {
  id: 'strategy', name: 'Strategy', category: 'behavioral', grade: 'middle',
  tagline: 'Меняем алгоритм на лету',
  definition: 'Определяет семейство алгоритмов и делает их взаимозаменяемыми.',
  problem: 'Жёстко зашитый алгоритм трудно менять.',
  solution: 'Выносим алгоритм за интерфейс и внедряем его.',
  codeExample: { lang: 'typescript', code: 'interface S { run(): void }' },
  pros: ['Гибкость'], cons: ['Больше классов'], tradeoffs: ['Гибкость против простоты'],
  whenToUse: ['Много вариантов поведения'], related: ['state'],
};

const question: Question = {
  id: 'q-strategy-1', type: 'identify-pattern', category: 'behavioral', grade: 'middle',
  prompt: 'Какой паттерн?', code: { lang: 'typescript', code: 'class C {}' },
  options: ['Strategy', 'State'], correctIndex: 0,
  explanation: 'Алгоритм внедряется извне — это Strategy, а не State.',
  conceptId: 'strategy',
};

describe('schema', () => {
  it('accepts a valid concept and question', () => {
    expect(ConceptSchema.parse(concept)).toEqual(concept);
    expect(QuestionSchema.parse(question)).toEqual(question);
  });

  it('rejects correctIndex out of range', () => {
    expect(() => validateContent([concept], [{ ...question, correctIndex: 5 }])).toThrow(/correctIndex/);
  });

  it('rejects duplicate concept ids', () => {
    expect(() => validateContent([concept, concept], [])).toThrow(/duplicate/i);
  });

  it('rejects related pointing to unknown concept', () => {
    expect(() => validateContent([{ ...concept, related: ['ghost'] }], [])).toThrow(/related/);
  });

  it('rejects question.conceptId pointing to unknown concept', () => {
    expect(() => validateContent([concept], [{ ...question, conceptId: 'ghost' }])).toThrow(/conceptId/);
  });
});
