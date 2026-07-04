import { describe, it, expect, beforeEach } from 'vitest';
import { useStore, selectDueConceptIds, selectGradeProgress, isMastered } from './useStore';
import type { Concept } from '@/content/schema';

const c = (id: string, grade: Concept['grade']): Concept => ({
  id, name: id, category: 'solid', grade, tagline: 't', definition: 'd', problem: 'p', solution: 's',
  codeExample: { lang: 'typescript', code: 'x' }, pros: ['a'], cons: ['a'], tradeoffs: ['a'], whenToUse: ['a'], related: [],
});

beforeEach(() => {
  useStore.getState().resetProgress();
});

describe('store', () => {
  it('reviewConcept creates SRS state, marks seen, and advances streak', () => {
    useStore.getState().reviewConcept('srp', 4, '2026-07-04');
    const s = useStore.getState();
    expect(s.srs['srp'].repetitions).toBe(1);
    expect(s.conceptProgress['srp'].seen).toBe(true);
    expect(s.streak.current).toBe(1);
    expect(s.streak.lastActiveDate).toBe('2026-07-04');
  });

  it('activity on consecutive days increments streak; gap resets it', () => {
    const g = useStore.getState;
    g().reviewConcept('srp', 4, '2026-07-04');
    g().reviewConcept('srp', 4, '2026-07-05');
    expect(g().streak.current).toBe(2);
    g().reviewConcept('srp', 4, '2026-07-08'); // gap
    expect(g().streak.current).toBe(1);
    expect(g().streak.longest).toBe(2);
  });

  it('recordQuiz stores a result', () => {
    useStore.getState().recordQuiz('q1', 0, true, '2026-07-04');
    expect(useStore.getState().quizResults).toHaveLength(1);
    expect(useStore.getState().quizResults[0].correct).toBe(true);
  });

  it('selectDueConceptIds returns concepts whose due date has arrived', () => {
    useStore.getState().reviewConcept('srp', 4, '2026-07-04'); // due 2026-07-05
    expect(selectDueConceptIds(useStore.getState(), '2026-07-04')).not.toContain('srp');
    expect(selectDueConceptIds(useStore.getState(), '2026-07-05')).toContain('srp');
  });

  it('isMastered is true after 2 successful repetitions', () => {
    useStore.getState().reviewConcept('srp', 4, '2026-07-04');
    expect(isMastered(useStore.getState(), 'srp')).toBe(false);
    useStore.getState().reviewConcept('srp', 4, '2026-07-05');
    expect(isMastered(useStore.getState(), 'srp')).toBe(true);
  });

  it('selectGradeProgress reports totals, seen, mastered', () => {
    const concepts = [c('srp', 'junior'), c('ocp', 'junior'), c('strategy', 'middle')];
    useStore.getState().reviewConcept('srp', 4, '2026-07-04');
    const p = selectGradeProgress(useStore.getState(), concepts, 'junior');
    expect(p.total).toBe(2);
    expect(p.seen).toBe(1);
    expect(p.mastered).toBe(0);
  });
});
