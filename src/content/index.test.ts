import { describe, it, expect } from 'vitest';
import { concepts, questions, getConcept } from './index';
import { ConceptProseSchema, QuestionProseSchema } from './schema';
import { conceptProse as ruConcepts, questionProse as ruQuestions } from './locales/ru';
import { conceptProse as enConcepts, questionProse as enQuestions } from './locales/en';

// Note: core shape/reference validation (schema-valid, unique ids, related/conceptId
// resolve) runs at import time via `validateSplit` in ./index (DEV/test), so importing
// this module already guards it — those invariants aren't re-asserted here.
describe('content catalog', () => {
  it('is the complete catalog: 53 concepts across every category', () => {
    const byCat = (c: string) => concepts.filter((x) => x.category === c).length;
    expect(concepts).toHaveLength(53);
    expect(byCat('solid')).toBe(5);
    // 23 GoF patterns, complete: 5 creational + 7 structural + 11 behavioral.
    expect(byCat('creational')).toBe(5);
    expect(byCat('structural')).toBe(7);
    expect(byCat('behavioral')).toBe(11);
    expect(byCat('architecture')).toBe(8);
    expect(byCat('tradeoff')).toBe(6);
    expect(byCat('microservices')).toBe(11);
  });

  it('every concept meets the depth floor (>=2 tradeoffs via prose, >=2 related via core)', () => {
    // Regression floor guarding against thin concepts. Not the full authoring bar
    // (>=3/>=3) — a few concepts legitimately sit at 2 in one dimension.
    const thin = concepts.filter((c) => (enConcepts[c.id]?.tradeoffs.length ?? 0) < 2 || c.related.length < 2);
    expect(thin.map((c) => c.id)).toEqual([]);
  });

  it('every prose entry is schema-valid in both languages (non-empty fields/lists)', () => {
    // The in-app DEV guard only validates cores (to avoid eagerly importing both
    // locales); prose shape is guarded here, where both locales are loaded.
    for (const [lang, cProse, qProse] of [
      ['ru', ruConcepts, ruQuestions],
      ['en', enConcepts, enQuestions],
    ] as const) {
      for (const c of concepts) {
        expect(() => ConceptProseSchema.parse(cProse[c.id]), `${lang} concept ${c.id}`).not.toThrow();
      }
      for (const q of questions) {
        expect(() => QuestionProseSchema.parse(qProse[q.id]), `${lang} question ${q.id}`).not.toThrow();
        // codeLang (core) must be present iff the prose carries a code sample.
        expect(Boolean(q.codeLang), `${q.id} codeLang/code coupling (${lang})`).toBe(Boolean(qProse[q.id]?.code));
      }
    }
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

  it('every concept id has prose in both ru and en, with equal-length lists', () => {
    for (const c of concepts) {
      const ru = ruConcepts[c.id];
      const en = enConcepts[c.id];
      expect(ru, `${c.id} ru prose`).toBeDefined();
      expect(en, `${c.id} en prose`).toBeDefined();
      for (const f of ['pros', 'cons', 'tradeoffs', 'whenToUse'] as const) {
        expect(ru[f].length, `${c.id}.${f} ru/en length parity`).toBe(en[f].length);
      }
      expect(ru.whenNotToUse?.length ?? 0).toBe(en.whenNotToUse?.length ?? 0);
    }
  });

  it('every question id has prose in both ru and en, with equal-length option lists', () => {
    for (const q of questions) {
      const ru = ruQuestions[q.id];
      const en = enQuestions[q.id];
      expect(ru, `${q.id} ru prose`).toBeDefined();
      expect(en, `${q.id} en prose`).toBeDefined();
      expect(ru.options.length, `${q.id} options ru/en length parity`).toBe(en.options.length);
      expect(q.correctIndex).toBeLessThan(ru.options.length);
    }
  });

  it('ru and en prose cover exactly the same concept and question id sets', () => {
    const conceptIds = new Set(concepts.map((c) => c.id));
    const questionIds = new Set(questions.map((q) => q.id));
    expect(new Set(Object.keys(ruConcepts))).toEqual(conceptIds);
    expect(new Set(Object.keys(enConcepts))).toEqual(conceptIds);
    expect(new Set(Object.keys(ruQuestions))).toEqual(questionIds);
    expect(new Set(Object.keys(enQuestions))).toEqual(questionIds);
  });

  it('fill-blank prompts contain the blank marker in both languages', () => {
    for (const q of questions.filter((q) => q.type === 'fill-blank')) {
      expect(ruQuestions[q.id].prompt).toContain('___');
      expect(enQuestions[q.id].prompt).toContain('___');
    }
  });

  it('every fill-blank question maps to a real concept', () => {
    for (const q of questions.filter((q) => q.type === 'fill-blank')) {
      expect(q.conceptId, `${q.id} missing conceptId`).toBeTruthy();
      expect(getConcept(q.conceptId!), `${q.id} conceptId does not resolve`).toBeDefined();
    }
  });

  it('identify-pattern distractors are real sibling concepts by name', () => {
    const names = new Set(concepts.map((c) => c.name));
    for (const q of questions.filter((q) => q.type === 'identify-pattern')) {
      for (const opt of ruQuestions[q.id].options) expect(names.has(opt)).toBe(true);
      for (const opt of enQuestions[q.id].options) expect(names.has(opt)).toBe(true);
    }
  });

  it('every English field is fully translated (no Cyrillic left)', () => {
    const cyr = /[А-Яа-яЁё]/;
    const bad: string[] = [];
    const check = (where: string, v: string) => { if (cyr.test(v)) bad.push(where); };
    for (const c of concepts) {
      const en = enConcepts[c.id];
      check(`${c.id}.tagline`, en.tagline);
      check(`${c.id}.definition`, en.definition);
      check(`${c.id}.problem`, en.problem);
      check(`${c.id}.solution`, en.solution);
      check(`${c.id}.code`, en.code);
      if (c.diagram) check(`${c.id}.diagram`, c.diagram); // shared, non-localized — must be Latin-only
      for (const f of ['pros', 'cons', 'tradeoffs', 'whenToUse', 'whenNotToUse'] as const)
        (en[f] ?? []).forEach((x) => check(`${c.id}.${f}`, x));
    }
    for (const q of questions) {
      const en = enQuestions[q.id];
      check(`${q.id}.prompt`, en.prompt);
      check(`${q.id}.explanation`, en.explanation);
      en.options.forEach((o) => check(`${q.id}.option`, o));
      if (en.code) check(`${q.id}.code`, en.code);
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
    expect(withDiagram).toBeGreaterThanOrEqual(8);
  });
});
