import { solid } from './concepts/solid';
import { patterns } from './concepts/patterns';
import { questions as allQuestions } from './questions';
import { validateContent, type Concept, type Question } from './schema';

export const concepts: Concept[] = [...solid, ...patterns];
export const questions: Question[] = allQuestions;

// Fail fast in dev if content is inconsistent.
if (import.meta.env?.DEV) validateContent(concepts, questions);

export const conceptById = new Map(concepts.map((c) => [c.id, c]));

export function getConcept(id: string): Concept | undefined {
  return conceptById.get(id);
}
