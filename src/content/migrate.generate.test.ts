// @ts-nocheck
// THROWAWAY migration test — generates src/content/core/* and src/content/locales/*
// from the current bilingual content, then round-trips them back to verify no data
// was lost. Delete this file in Task 2 once the app is wired to the split content.
// (@ts-nocheck: this repo has no @types/node, so `node:fs`/`node:path`/`process` have
// no ambient types here; this file is a build-time script disguised as a test, never
// shipped, and is deleted in Task 2 — not worth an @types/node devDependency for it.)
import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { concepts, questions } from './index';
import type {
  Concept,
  Question,
  ConceptCore,
  ConceptProse,
  QuestionCore,
  QuestionProse,
} from './schema';

type Lang = 'ru' | 'en';

const splitConceptCore = (c: Concept): ConceptCore => ({
  id: c.id,
  name: c.name,
  aka: c.aka,
  category: c.category,
  grade: c.grade,
  related: c.related,
  tags: c.tags,
  diagram: c.diagram,
  codeLang: c.codeExample.lang,
  highlightLines: c.codeExample.highlightLines,
});

const splitConceptProse = (c: Concept, l: Lang): ConceptProse => ({
  tagline: c.tagline[l],
  definition: c.definition[l],
  problem: c.problem[l],
  solution: c.solution[l],
  code: c.codeExample.code[l],
  pros: c.pros[l],
  cons: c.cons[l],
  tradeoffs: c.tradeoffs[l],
  whenToUse: c.whenToUse[l],
  whenNotToUse: c.whenNotToUse ? c.whenNotToUse[l] : undefined,
});

const splitQuestionCore = (q: Question): QuestionCore => ({
  id: q.id,
  type: q.type,
  category: q.category,
  grade: q.grade,
  correctIndex: q.correctIndex,
  conceptId: q.conceptId,
  codeLang: q.code?.lang,
  highlightLines: q.code?.highlightLines,
});

const splitQuestionProse = (q: Question, l: Lang): QuestionProse => ({
  prompt: q.prompt[l],
  code: q.code ? q.code.code[l] : undefined,
  options: q.options[l],
  explanation: q.explanation[l],
});

function rebuildConcept(core: ConceptCore, ruP: ConceptProse, enP: ConceptProse): Concept {
  return {
    id: core.id,
    name: core.name,
    aka: core.aka,
    category: core.category,
    grade: core.grade,
    tagline: { ru: ruP.tagline, en: enP.tagline },
    definition: { ru: ruP.definition, en: enP.definition },
    problem: { ru: ruP.problem, en: enP.problem },
    solution: { ru: ruP.solution, en: enP.solution },
    codeExample: {
      lang: core.codeLang,
      code: { ru: ruP.code, en: enP.code },
      highlightLines: core.highlightLines,
    },
    pros: { ru: ruP.pros, en: enP.pros },
    cons: { ru: ruP.cons, en: enP.cons },
    tradeoffs: { ru: ruP.tradeoffs, en: enP.tradeoffs },
    whenToUse: { ru: ruP.whenToUse, en: enP.whenToUse },
    whenNotToUse:
      ruP.whenNotToUse !== undefined && enP.whenNotToUse !== undefined
        ? { ru: ruP.whenNotToUse, en: enP.whenNotToUse }
        : undefined,
    related: core.related,
    tags: core.tags,
    diagram: core.diagram,
  };
}

function rebuildQuestion(core: QuestionCore, ruP: QuestionProse, enP: QuestionProse): Question {
  return {
    id: core.id,
    type: core.type,
    category: core.category,
    grade: core.grade,
    prompt: { ru: ruP.prompt, en: enP.prompt },
    code:
      core.codeLang !== undefined
        ? {
            lang: core.codeLang,
            code: { ru: ruP.code as string, en: enP.code as string },
            highlightLines: core.highlightLines,
          }
        : undefined,
    options: { ru: ruP.options, en: enP.options },
    correctIndex: core.correctIndex,
    explanation: { ru: ruP.explanation, en: enP.explanation },
    conceptId: core.conceptId,
  };
}

/** Recursively sorts object keys so key-order differences never cause a false mismatch. */
function sortKeysDeep(x: unknown): unknown {
  if (Array.isArray(x)) return x.map(sortKeysDeep);
  if (x !== null && typeof x === 'object') {
    return Object.keys(x as Record<string, unknown>)
      .sort()
      .reduce((acc, k) => {
        acc[k] = sortKeysDeep((x as Record<string, unknown>)[k]);
        return acc;
      }, {} as Record<string, unknown>);
  }
  return x;
}

// JSON.parse(JSON.stringify(x)) first drops any `key: undefined` entries so that
// "key absent" and "key explicitly undefined" compare as equal (matches JSON.stringify
// semantics used when the generated files were written).
const stable = (x: unknown): string => JSON.stringify(sortKeysDeep(JSON.parse(JSON.stringify(x))));

const root = path.resolve(process.cwd(), 'src/content');

describe('content migration: core + locale split (throwaway, round-trip)', () => {
  beforeAll(() => {
    const conceptsCore = concepts.map(splitConceptCore);
    const questionsCore = questions.map(splitQuestionCore);
    const conceptProseRu: Record<string, ConceptProse> = Object.fromEntries(
      concepts.map((c) => [c.id, splitConceptProse(c, 'ru')]),
    );
    const conceptProseEn: Record<string, ConceptProse> = Object.fromEntries(
      concepts.map((c) => [c.id, splitConceptProse(c, 'en')]),
    );
    const questionProseRu: Record<string, QuestionProse> = Object.fromEntries(
      questions.map((q) => [q.id, splitQuestionProse(q, 'ru')]),
    );
    const questionProseEn: Record<string, QuestionProse> = Object.fromEntries(
      questions.map((q) => [q.id, splitQuestionProse(q, 'en')]),
    );

    fs.mkdirSync(path.join(root, 'core'), { recursive: true });
    fs.mkdirSync(path.join(root, 'locales'), { recursive: true });

    fs.writeFileSync(
      path.join(root, 'core', 'concepts.ts'),
      `import type { ConceptCore } from '../schema';\n\nexport const conceptsCore: ConceptCore[] = ${JSON.stringify(conceptsCore, null, 2)};\n`,
    );
    fs.writeFileSync(
      path.join(root, 'core', 'questions.ts'),
      `import type { QuestionCore } from '../schema';\n\nexport const questionsCore: QuestionCore[] = ${JSON.stringify(questionsCore, null, 2)};\n`,
    );
    fs.writeFileSync(
      path.join(root, 'locales', 'ru.ts'),
      `import type { ConceptProse, QuestionProse } from '../schema';\n\nexport const conceptProse: Record<string, ConceptProse> = ${JSON.stringify(conceptProseRu, null, 2)};\n\nexport const questionProse: Record<string, QuestionProse> = ${JSON.stringify(questionProseRu, null, 2)};\n`,
    );
    fs.writeFileSync(
      path.join(root, 'locales', 'en.ts'),
      `import type { ConceptProse, QuestionProse } from '../schema';\n\nexport const conceptProse: Record<string, ConceptProse> = ${JSON.stringify(conceptProseEn, null, 2)};\n\nexport const questionProse: Record<string, QuestionProse> = ${JSON.stringify(questionProseEn, null, 2)};\n`,
    );
  });

  it('writes the 4 generated files', () => {
    expect(fs.existsSync(path.join(root, 'core', 'concepts.ts'))).toBe(true);
    expect(fs.existsSync(path.join(root, 'core', 'questions.ts'))).toBe(true);
    expect(fs.existsSync(path.join(root, 'locales', 'ru.ts'))).toBe(true);
    expect(fs.existsSync(path.join(root, 'locales', 'en.ts'))).toBe(true);
  });

  it('round-trips every concept and question back to the originals (value-equal, order-independent keys)', async () => {
    // Paths are built at runtime (not string literals) so Vite's import-analysis
    // plugin does not try to eagerly resolve them during transform, before the
    // files exist — they are only created moments earlier, in beforeAll().
    const importFresh = (relPath: string) => import(/* @vite-ignore */ `${relPath}?t=${Date.now()}`);
    const { conceptsCore } = await importFresh('./core/concepts.ts');
    const { questionsCore } = await importFresh('./core/questions.ts');
    const { conceptProse: conceptProseRu, questionProse: questionProseRu } = await importFresh('./locales/ru.ts');
    const { conceptProse: conceptProseEn, questionProse: questionProseEn } = await importFresh('./locales/en.ts');

    const conceptCoreById = new Map(conceptsCore.map((c: ConceptCore) => [c.id, c]));
    const questionCoreById = new Map(questionsCore.map((q: QuestionCore) => [q.id, q]));

    let conceptsMatched = 0;
    for (const original of concepts) {
      const core = conceptCoreById.get(original.id);
      expect(core, `missing core for concept "${original.id}"`).toBeDefined();
      const ruP = conceptProseRu[original.id];
      const enP = conceptProseEn[original.id];
      expect(ruP, `missing ru prose for concept "${original.id}"`).toBeDefined();
      expect(enP, `missing en prose for concept "${original.id}"`).toBeDefined();
      const rebuilt = rebuildConcept(core!, ruP, enP);
      expect(stable(rebuilt)).toBe(stable(original));
      conceptsMatched += 1;
    }
    expect(conceptsMatched).toBe(concepts.length);

    let questionsMatched = 0;
    for (const original of questions) {
      const core = questionCoreById.get(original.id);
      expect(core, `missing core for question "${original.id}"`).toBeDefined();
      const ruP = questionProseRu[original.id];
      const enP = questionProseEn[original.id];
      expect(ruP, `missing ru prose for question "${original.id}"`).toBeDefined();
      expect(enP, `missing en prose for question "${original.id}"`).toBeDefined();
      const rebuilt = rebuildQuestion(core!, ruP, enP);
      expect(stable(rebuilt)).toBe(stable(original));
      questionsMatched += 1;
    }
    expect(questionsMatched).toBe(questions.length);

    // eslint-disable-next-line no-console
    console.log(`round-trip OK: ${conceptsMatched} concepts, ${questionsMatched} questions matched`);
  });
});
