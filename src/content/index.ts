import { conceptsCore } from './core/concepts';
import { questionsCore } from './core/questions';
import { ConceptCoreSchema, QuestionCoreSchema, type ConceptCore, type QuestionCore } from './schema';
import { scenarios, validateScenarios } from './diagram';
import { isLoaded, proseFor } from './registry';

export const concepts: ConceptCore[] = conceptsCore;
export const questions: QuestionCore[] = questionsCore;

/**
 * Validates the language-independent cores (shape + cross-references) plus, opportunistically,
 * whatever prose is already loaded in the registry (both locales in tests via test-setup.ts;
 * the active locale only, once Task 3 wires `loadLocale` before render). Deliberately does NOT
 * statically import the locale modules — doing so would pull both `ru`/`en` prose packs into the
 * eager app bundle and defeat the whole point of the per-language split. The full cross-locale
 * checks (parity, no-Cyrillic, identify-pattern option names, depth floor) live in
 * `index.test.ts`, which loads both locales explicitly since it's test-only.
 */
function validateSplit(cs: ConceptCore[], qs: QuestionCore[]): void {
  cs.forEach((c) => ConceptCoreSchema.parse(c));
  qs.forEach((q) => QuestionCoreSchema.parse(q));

  const ids = new Set<string>();
  for (const c of cs) {
    if (ids.has(c.id)) throw new Error(`duplicate concept id: ${c.id}`);
    ids.add(c.id);
  }

  const qIds = new Set<string>();
  for (const q of qs) {
    if (qIds.has(q.id)) throw new Error(`duplicate question id: ${q.id}`);
    qIds.add(q.id);
  }

  for (const c of cs) {
    for (const r of c.related) {
      if (!ids.has(r)) throw new Error(`concept "${c.id}" has related "${r}" that is not a known concept`);
    }
  }
  for (const q of qs) {
    if (q.conceptId && !ids.has(q.conceptId)) {
      throw new Error(`question "${q.id}" conceptId "${q.conceptId}" is not a known concept`);
    }
  }

  for (const lang of ['ru', 'en'] as const) {
    if (!isLoaded(lang)) continue; // only validate prose that's actually in the registry right now
    const prose = proseFor(lang);
    for (const c of cs) {
      if (!prose.concepts[c.id]) throw new Error(`concept "${c.id}" is missing ${lang} prose`);
    }
    for (const q of qs) {
      const qp = prose.questions[q.id];
      if (!qp) throw new Error(`question "${q.id}" is missing ${lang} prose`);
      if (q.correctIndex >= qp.options.length) {
        throw new Error(`question "${q.id}" correctIndex ${q.correctIndex} out of range (${qp.options.length} ${lang} options)`);
      }
    }
  }
}

// Fail fast in dev (and in tests) if content is inconsistent.
if (import.meta.env?.DEV) {
  validateSplit(concepts, questions);
  validateScenarios(scenarios);
}

export const conceptById = new Map(concepts.map((c) => [c.id, c]));

export function getConcept(id: string): ConceptCore | undefined {
  return conceptById.get(id);
}
