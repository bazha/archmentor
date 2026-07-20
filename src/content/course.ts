import type { Grade } from './schema';

/**
 * The single guided Junior→Lead path: all 53 concepts, grouped by grade in
 * GRADE_ORDER, ordered within each grade by category progression
 * (solid → creational → structural → behavioral → architecture → tradeoff),
 * then catalog order. A validation test guards completeness + grade-consistency.
 */
export const COURSE: { grade: Grade; conceptIds: string[] }[] = [
  { grade: 'junior', conceptIds: ['srp', 'ocp', 'lsp', 'isp', 'singleton', 'adapter', 'facade', 'iterator', 'layered', 'mvc'] },
  { grade: 'middle', conceptIds: ['dip', 'factory-method', 'builder', 'prototype', 'composite', 'decorator', 'proxy', 'strategy', 'observer', 'chain-of-responsibility', 'command', 'memento', 'template-method', 'mvvm', 'monolith', 'composition-vs-inheritance', 'coupling-cohesion', 'dry-vs-duplication', 'api-gateway', 'circuit-breaker', 'database-per-service'] },
  { grade: 'senior', conceptIds: ['abstract-factory', 'bridge', 'flyweight', 'state', 'interpreter', 'mediator', 'visitor', 'hexagonal', 'clean-architecture', 'event-driven', 'abstraction-cost', 'yagni-vs-flexibility', 'bff', 'saga', 'cqrs', 'anti-corruption-layer', 'aggregator', 'bulkhead', 'sidecar'] },
  { grade: 'lead', conceptIds: ['microservices', 'performance-vs-readability', 'event-sourcing'] },
];

/** Flat list of concept ids in course order. */
export const COURSE_ORDER: string[] = COURSE.flatMap((g) => g.conceptIds);
