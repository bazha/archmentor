import type { ConceptCore, QuestionCore, Category, Grade, QuestionType } from './schema';
import type { Lang } from '@/i18n/lang';
import { useStore } from '@/store/useStore';
import { concepts, questions, getConcept } from './index';
import { proseFor } from './registry';

export interface ConceptView {
  id: string; name: string; aka?: string[]; category: Category; grade: Grade;
  tagline: string; definition: string; problem: string; solution: string;
  codeExample: { lang: 'typescript'; code: string; highlightLines?: number[] };
  pros: string[]; cons: string[]; tradeoffs: string[]; whenToUse: string[]; whenNotToUse?: string[];
  related: string[]; tags?: string[]; diagram?: string;
}

export interface QuestionView {
  id: string; type: QuestionType; category: Category; grade: Grade;
  prompt: string; code?: { lang: 'typescript'; code: string; highlightLines?: number[] };
  options: string[]; correctIndex: number; explanation: string; conceptId?: string;
}

export function localizeConcept(core: ConceptCore, lang: Lang): ConceptView {
  const p = proseFor(lang).concepts[core.id];
  return {
    id: core.id, name: core.name, aka: core.aka, category: core.category, grade: core.grade,
    tagline: p.tagline, definition: p.definition, problem: p.problem, solution: p.solution,
    codeExample: { lang: core.codeLang, code: p.code, highlightLines: core.highlightLines },
    pros: p.pros, cons: p.cons, tradeoffs: p.tradeoffs, whenToUse: p.whenToUse, whenNotToUse: p.whenNotToUse,
    related: core.related, tags: core.tags, diagram: core.diagram,
  };
}

export function localizeQuestion(core: QuestionCore, lang: Lang): QuestionView {
  const p = proseFor(lang).questions[core.id];
  return {
    id: core.id, type: core.type, category: core.category, grade: core.grade,
    prompt: p.prompt,
    code: p.code ? { lang: core.codeLang!, code: p.code, highlightLines: core.highlightLines } : undefined,
    options: p.options, correctIndex: core.correctIndex, explanation: p.explanation, conceptId: core.conceptId,
  };
}

export function useConcepts(): ConceptView[] {
  const lang = useStore((st) => st.settings.lang);
  return concepts.map((c) => localizeConcept(c, lang));
}
export function useConcept(id: string): ConceptView | undefined {
  const lang = useStore((st) => st.settings.lang);
  const c = getConcept(id);
  return c ? localizeConcept(c, lang) : undefined;
}
export function useQuestions(): QuestionView[] {
  const lang = useStore((st) => st.settings.lang);
  return questions.map((q) => localizeQuestion(q, lang));
}
