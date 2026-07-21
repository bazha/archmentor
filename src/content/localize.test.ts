import { describe, it, expect } from 'vitest';
import { concepts, questions } from './index';
import { localizeConcept, localizeQuestion } from './localize';
import { proseFor } from './registry';

describe('resolver', () => {
  it('localizeConcept merges core + prose into plain strings for the language', () => {
    const c = concepts[0];
    const p = proseFor('ru').concepts[c.id];
    const v = localizeConcept(c, 'ru');
    expect(v.definition).toBe(p.definition);
    expect(typeof v.definition).toBe('string');
    expect(v.pros).toEqual(p.pros);
    expect(v.codeExample.code).toBe(p.code);
    expect(v.name).toBe(c.name); // core field passes through unchanged
    expect(v.related).toEqual(c.related); // core field passes through unchanged
  });
  it('localizeQuestion keeps options length and correctIndex valid', () => {
    const q = questions[0];
    const p = proseFor('en').questions[q.id];
    const v = localizeQuestion(q, 'en');
    expect(v.options).toEqual(p.options);
    expect(v.correctIndex).toBeLessThan(v.options.length);
  });
  it('resolves independently per lang argument, not a global active language', () => {
    const c = concepts.find((c) => c.id === 'srp')!;
    const ru = localizeConcept(c, 'ru');
    const en = localizeConcept(c, 'en');
    expect(ru.definition).not.toBe(en.definition);
    expect(ru.name).toBe(en.name); // shared core field
  });
});
