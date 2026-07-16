import type { Concept, Question, Localized, LocalizedList } from './schema';
import type { Lang } from '@/i18n/lang';
import { useStore } from '@/store/useStore';
import { concepts, questions, getConcept } from './index';

const s = (l: Localized, lang: Lang) => l[lang];
const a = (l: LocalizedList, lang: Lang) => l[lang];

export interface ConceptView {
  id: string; name: string; aka?: string[]; category: Concept['category']; grade: Concept['grade'];
  tagline: string; definition: string; problem: string; solution: string;
  codeExample: { lang: 'typescript'; code: string; highlightLines?: number[] };
  pros: string[]; cons: string[]; tradeoffs: string[]; whenToUse: string[]; whenNotToUse?: string[];
  related: string[]; tags?: string[]; diagram?: string;
}

export interface QuestionView {
  id: string; type: Question['type']; category: Question['category']; grade: Question['grade'];
  prompt: string; code?: { lang: 'typescript'; code: string; highlightLines?: number[] };
  options: string[]; correctIndex: number; explanation: string; conceptId?: string;
}

export function localizeConcept(c: Concept, lang: Lang): ConceptView {
  return {
    id: c.id, name: c.name, aka: c.aka, category: c.category, grade: c.grade,
    tagline: s(c.tagline, lang), definition: s(c.definition, lang),
    problem: s(c.problem, lang), solution: s(c.solution, lang),
    codeExample: { lang: c.codeExample.lang, code: s(c.codeExample.code, lang), highlightLines: c.codeExample.highlightLines },
    pros: a(c.pros, lang), cons: a(c.cons, lang), tradeoffs: a(c.tradeoffs, lang),
    whenToUse: a(c.whenToUse, lang), whenNotToUse: c.whenNotToUse ? a(c.whenNotToUse, lang) : undefined,
    related: c.related, tags: c.tags, diagram: c.diagram,
  };
}

export function localizeQuestion(q: Question, lang: Lang): QuestionView {
  return {
    id: q.id, type: q.type, category: q.category, grade: q.grade,
    prompt: s(q.prompt, lang),
    code: q.code ? { lang: q.code.lang, code: s(q.code.code, lang), highlightLines: q.code.highlightLines } : undefined,
    options: a(q.options, lang), correctIndex: q.correctIndex, explanation: s(q.explanation, lang), conceptId: q.conceptId,
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
