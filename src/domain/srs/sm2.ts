import { addDays } from '@/lib/date';

export type Quality = 0 | 1 | 2 | 3 | 4 | 5;
export const QUALITY = { again: 2, hard: 3, good: 4, easy: 5 } as const;

export interface SrsState {
  conceptId: string;
  ease: number;
  interval: number;
  repetitions: number;
  due: string;
  lastReviewed?: string;
}

const MIN_EASE = 1.3;
const START_EASE = 2.5;

export function initSrs(conceptId: string, today: string): SrsState {
  return { conceptId, ease: START_EASE, interval: 0, repetitions: 0, due: today };
}

/** Faithful SM-2 update. `today` is the review date (ISO YYYY-MM-DD). */
export function review(state: SrsState, quality: Quality, today: string): SrsState {
  // Ease update (applied every review), clamped to MIN_EASE.
  const ease = Math.max(MIN_EASE, state.ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

  let repetitions: number;
  let interval: number;

  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    repetitions = state.repetitions + 1;
    if (repetitions === 1) interval = 1;
    else if (repetitions === 2) interval = 6;
    // Canonical SM-2 multiplies by the ease as it stood BEFORE this review's
    // update (state.ease); the updated `ease` is still written to the returned
    // state, just not used in this multiply.
    else interval = Math.round(state.interval * state.ease);
  }

  return {
    conceptId: state.conceptId,
    ease,
    interval,
    repetitions,
    due: addDays(today, interval),
    lastReviewed: today,
  };
}
