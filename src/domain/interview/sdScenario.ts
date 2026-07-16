import type { Grade } from '@/content/schema';

export interface GradedScenarioLike { id: string; grade: Grade }

/**
 * Picks a scenario of the reached grade (deterministic via the passed shuffle).
 * Falls back to any scenario if none match; undefined only for an empty list.
 */
export function selectSdScenario<T extends GradedScenarioLike>(
  scenarios: T[],
  grade: Grade,
  shuffle: <U>(a: U[]) => U[],
): T | undefined {
  const atGrade = shuffle(scenarios.filter((sc) => sc.grade === grade));
  if (atGrade.length > 0) return atGrade[0];
  return shuffle(scenarios)[0];
}
