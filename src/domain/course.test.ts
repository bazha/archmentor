import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '@/store/useStore';
import { selectCourseSteps, selectNextStep, selectCourseProgress } from './course';
import { COURSE_ORDER } from '@/content/course';

const master = (id: string) =>
  useStore.setState((s) => ({ srs: { ...s.srs, [id]: { conceptId: id, ease: 2.5, interval: 6, repetitions: 2, due: '2099-01-01' } } }));
const see = (id: string) =>
  useStore.setState((s) => ({ conceptProgress: { ...s.conceptProgress, [id]: { seen: true } } }));

describe('course selectors', () => {
  beforeEach(() => useStore.getState().resetProgress());

  it('fresh state: all notStarted, next = first course step, 0% progress', () => {
    const state = useStore.getState();
    const first = COURSE_ORDER[0];
    expect(selectNextStep(state)).toBe(first);
    const steps = selectCourseSteps(state);
    expect(steps.length).toBe(COURSE_ORDER.length);
    expect(steps.every((s) => s.status === 'notStarted')).toBe(true);
    expect(steps.find((s) => s.isNext)!.conceptId).toBe(first);
    expect(selectCourseProgress(state)).toEqual({ mastered: 0, total: COURSE_ORDER.length, pct: 0 });
  });

  it('seen -> inProgress; mastering the first advances next to the second', () => {
    const [first, second] = COURSE_ORDER;
    see(first);
    expect(selectCourseSteps(useStore.getState()).find((s) => s.conceptId === first)!.status).toBe('inProgress');
    master(first);
    const state = useStore.getState();
    expect(selectCourseSteps(state).find((s) => s.conceptId === first)!.status).toBe('mastered');
    expect(selectNextStep(state)).toBe(second);
    expect(selectCourseProgress(state).mastered).toBe(1);
  });

  it('all mastered -> next is undefined', () => {
    COURSE_ORDER.forEach(master);
    const state = useStore.getState();
    expect(selectNextStep(state)).toBeUndefined();
    expect(selectCourseProgress(state).pct).toBe(100);
    expect(selectCourseSteps(state).some((s) => s.isNext)).toBe(false);
  });
});
