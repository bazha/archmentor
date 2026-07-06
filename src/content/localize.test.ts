import { describe, it, expect } from 'vitest';
import { concepts, questions } from './index';
import { localizeConcept, localizeQuestion } from './localize';

describe('resolver', () => {
  it('localizeConcept returns plain strings for the language', () => {
    const c = concepts[0];
    const v = localizeConcept(c, 'ru');
    expect(v.definition).toBe(c.definition.ru);
    expect(typeof v.definition).toBe('string');
    expect(v.pros).toEqual(c.pros.ru);
    expect(v.codeExample.code).toBe(c.codeExample.code.ru);
    expect(v.name).toBe(c.name); // shared field passes through
  });
  it('localizeQuestion keeps options length and correctIndex valid', () => {
    const q = questions[0];
    const v = localizeQuestion(q, 'en');
    expect(v.options).toEqual(q.options.en);
    expect(v.correctIndex).toBeLessThan(v.options.length);
  });
});
