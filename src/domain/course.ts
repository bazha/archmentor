import type { AppState } from '@/store/useStore';
import { isMastered } from '@/store/useStore';
import { COURSE } from '@/content/course';
import type { Grade } from '@/content/schema';

export type StepStatus = 'mastered' | 'inProgress' | 'notStarted';
export interface CourseStep { conceptId: string; grade: Grade; status: StepStatus; isNext: boolean; }

function stepStatus(state: AppState, id: string): StepStatus {
  if (isMastered(state, id)) return 'mastered';
  if (state.conceptProgress[id]?.seen) return 'inProgress';
  return 'notStarted';
}

/** First concept in course order that is not yet mastered; undefined when all are mastered. */
export function selectNextStep(state: AppState): string | undefined {
  for (const group of COURSE)
    for (const id of group.conceptIds)
      if (!isMastered(state, id)) return id;
  return undefined;
}

export function selectCourseSteps(state: AppState): CourseStep[] {
  const nextId = selectNextStep(state);
  return COURSE.flatMap((group) =>
    group.conceptIds.map((conceptId) => ({
      conceptId,
      grade: group.grade,
      status: stepStatus(state, conceptId),
      isNext: conceptId === nextId,
    })),
  );
}

export function selectCourseProgress(state: AppState): { mastered: number; total: number; pct: number } {
  const ids = COURSE.flatMap((g) => g.conceptIds);
  const mastered = ids.filter((id) => isMastered(state, id)).length;
  const total = ids.length;
  return { mastered, total, pct: total === 0 ? 0 : Math.round((mastered / total) * 100) };
}
