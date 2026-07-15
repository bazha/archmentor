import { solid } from './concepts/solid';
import { patterns } from './concepts/patterns';
import { creational, creationalQuestions } from './concepts/creational';
import { structural, structuralQuestions } from './concepts/structural';
import { behavioral, behavioralQuestions } from './concepts/behavioral';
import { architecture, architectureQuestions } from './concepts/architecture';
import { tradeoffs, tradeoffsQuestions } from './concepts/tradeoffs';
import { questions as seedQuestions } from './questions';
import { fillBlankQuestions } from './fillBlank';
import { validateContent, type Concept, type Question } from './schema';
import { scenarios, validateScenarios } from './diagram';

export const concepts: Concept[] = [
  ...solid,
  ...patterns,
  ...creational,
  ...structural,
  ...behavioral,
  ...architecture,
  ...tradeoffs,
];

export const questions: Question[] = [
  ...seedQuestions,
  ...creationalQuestions,
  ...structuralQuestions,
  ...behavioralQuestions,
  ...architectureQuestions,
  ...tradeoffsQuestions,
  ...fillBlankQuestions,
];

// Fail fast in dev if content is inconsistent.
if (import.meta.env?.DEV) {
  validateContent(concepts, questions);
  validateScenarios(scenarios);
}

export const conceptById = new Map(concepts.map((c) => [c.id, c]));

export function getConcept(id: string): Concept | undefined {
  return conceptById.get(id);
}
