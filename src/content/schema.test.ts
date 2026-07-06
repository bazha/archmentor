import { describe, it, expect } from 'vitest';
import { ConceptSchema, QuestionSchema, validateContent } from './schema';
import type { Concept, Question } from './schema';

const loc = (s: string) => ({ ru: s, en: s });
const locList = (a: string[]) => ({ ru: a, en: a });

const concept: Concept = {
  id: 'strategy', name: 'Strategy', category: 'behavioral', grade: 'middle',
  tagline: loc('Меняем алгоритм на лету'),
  definition: loc('Определяет семейство алгоритмов и делает их взаимозаменяемыми.'),
  problem: loc('Жёстко зашитый алгоритм трудно менять.'),
  solution: loc('Выносим алгоритм за интерфейс и внедряем его.'),
  codeExample: { lang: 'typescript', code: loc('interface S { run(): void }') },
  pros: locList(['Гибкость']), cons: locList(['Больше классов']), tradeoffs: locList(['Гибкость против простоты']),
  whenToUse: locList(['Много вариантов поведения']), related: ['state'],
};

const question: Question = {
  id: 'q-strategy-1', type: 'identify-pattern', category: 'behavioral', grade: 'middle',
  prompt: loc('Какой паттерн?'), code: { lang: 'typescript', code: loc('class C {}') },
  options: locList(['Strategy', 'State']), correctIndex: 0,
  explanation: loc('Алгоритм внедряется извне — это Strategy, а не State.'),
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
