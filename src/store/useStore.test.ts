import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useStore, selectDueConceptIds, selectGradeProgress, selectReviewQueue, isMastered } from './useStore';
import type { Concept } from '@/content/schema';
import { detectLang } from '@/i18n/lang';

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

  it('selectReviewQueue treats new concepts as due and drops a card after review', () => {
    const list = [c('srp', 'junior'), c('ocp', 'junior'), c('strategy', 'middle')];
    expect(selectReviewQueue(useStore.getState(), list, '2026-07-04').sort()).toEqual(['ocp', 'srp', 'strategy']);
    useStore.getState().reviewConcept('srp', 4, '2026-07-04'); // now has SRS, due 2026-07-05
    const q = selectReviewQueue(useStore.getState(), list, '2026-07-04');
    expect(q).not.toContain('srp');
    expect(q.sort()).toEqual(['ocp', 'strategy']);
  });
});

describe('settings.lang', () => {
  it('defaults to the detected language and updates via setSettings', () => {
    expect(useStore.getState().settings.lang).toBe(detectLang());
    useStore.getState().setSettings({ lang: 'en' });
    expect(useStore.getState().settings.lang).toBe('en');
    useStore.getState().setSettings({ lang: 'ru' });
    expect(useStore.getState().settings.lang).toBe('ru');
  });
});

describe('persisted settings merge (rehydration)', () => {
  afterEach(() => {
    localStorage.removeItem('archmentor');
  });

  it('backfills missing settings keys (e.g. lang) from defaults on rehydrate', async () => {
    localStorage.setItem('archmentor', JSON.stringify({
      state: {
        srs: {}, quizResults: [], conceptProgress: {},
        streak: { current: 0, longest: 0, lastActiveDate: null },
        settings: { theme: 'light', gradeFilter: 'all', categoryFilter: 'all' },
      },
      version: 1,
    }));
    await useStore.persist.rehydrate();
    expect(useStore.getState().settings.theme).toBe('light'); // persisted value kept
    expect(useStore.getState().settings.lang).toBeDefined(); // missing key backfilled
    expect(useStore.getState().settings.lang).toBe(detectLang());
  });
});
