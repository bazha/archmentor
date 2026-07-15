import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useStore, selectDueConceptIds, selectGradeProgress, selectReviewQueue, isMastered, selectBestInterviewGrade, isDailyDone, isScenarioDone, selectDiagramProgress } from './useStore';
import type { Concept } from '@/content/schema';
import { detectLang } from '@/i18n/lang';

const loc = (s: string) => ({ ru: s, en: s });
const locList = (a: string[]) => ({ ru: a, en: a });

const c = (id: string, grade: Concept['grade']): Concept => ({
  id, name: id, category: 'solid', grade, tagline: loc('t'), definition: loc('d'), problem: loc('p'), solution: loc('s'),
  codeExample: { lang: 'typescript', code: loc('x') },
  pros: locList(['a']), cons: locList(['a']), tradeoffs: locList(['a']), whenToUse: locList(['a']), related: [],
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

  it('recordInterview stores a session and advances the streak', () => {
    useStore.getState().recordInterview(
      { at: '2026-07-04', grade: 'middle', asked: 6, correct: 4, missedQuestionIds: ['m1', 'm2'] },
      '2026-07-04',
    );
    const s = useStore.getState();
    expect(s.interviews).toHaveLength(1);
    expect(s.interviews[0].grade).toBe('middle');
    expect(s.streak.current).toBe(1);
  });

  it('selectBestInterviewGrade returns the highest verdict, ignoring null verdicts', () => {
    const g = useStore.getState;
    expect(selectBestInterviewGrade(g())).toBeNull();
    g().recordInterview({ at: '2026-07-04', grade: 'junior', asked: 4, correct: 2, missedQuestionIds: [] }, '2026-07-04');
    g().recordInterview({ at: '2026-07-05', grade: null, asked: 2, correct: 0, missedQuestionIds: ['j1', 'j2'] }, '2026-07-05');
    g().recordInterview({ at: '2026-07-06', grade: 'senior', asked: 6, correct: 5, missedQuestionIds: ['s1'] }, '2026-07-06');
    expect(selectBestInterviewGrade(g())).toBe('senior');
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

  it('completeDaily records the day, sets streak to 1, stores the pick, and advances the global streak', () => {
    useStore.getState().completeDaily(2, '2026-07-13');
    const s = useStore.getState();
    expect(s.daily.streak).toBe(1);
    expect(s.daily.longest).toBe(1);
    expect(s.daily.lastCompletedDate).toBe('2026-07-13');
    expect(s.daily.lastSelectedIndex).toBe(2);
    expect(s.streak.current).toBe(1); // daily counts as activity
    expect(isDailyDone(s, '2026-07-13')).toBe(true);
    expect(isDailyDone(s, '2026-07-14')).toBe(false);
  });

  it('completeDaily is a no-op when already completed today', () => {
    const g = useStore.getState;
    g().completeDaily(1, '2026-07-13');
    g().completeDaily(3, '2026-07-13'); // same day again
    expect(g().daily.streak).toBe(1);
    expect(g().daily.lastSelectedIndex).toBe(1); // unchanged
  });

  it('daily streak grows on consecutive days and resets after a gap', () => {
    const g = useStore.getState;
    g().completeDaily(0, '2026-07-13');
    g().completeDaily(0, '2026-07-14');
    expect(g().daily.streak).toBe(2);
    g().completeDaily(0, '2026-07-17'); // gap
    expect(g().daily.streak).toBe(1);
    expect(g().daily.longest).toBe(2);
  });
});

describe('diagram slice', () => {
  it('completeScenario records result and advances the streak', () => {
    useStore.getState().completeScenario('url-shortener', true, '2026-07-15');
    const s = useStore.getState();
    expect(s.diagram.completed['url-shortener']).toEqual({ at: '2026-07-15', passed: true });
    expect(isScenarioDone(s, 'url-shortener')).toBe(true);
    expect(isScenarioDone(s, 'news-feed')).toBe(false);
    expect(s.streak.current).toBe(1);
  });

  it('a later attempt overwrites the stored result', () => {
    const g = useStore.getState;
    g().completeScenario('news-feed', false, '2026-07-15');
    g().completeScenario('news-feed', true, '2026-07-15');
    expect(g().diagram.completed['news-feed'].passed).toBe(true);
  });

  it('selectDiagramProgress counts completed of total', () => {
    const g = useStore.getState;
    g().completeScenario('url-shortener', true, '2026-07-15');
    g().completeScenario('news-feed', false, '2026-07-15');
    const p = selectDiagramProgress(g(), ['url-shortener', 'news-feed', 'rate-limiter']);
    expect(p).toEqual({ done: 2, total: 3, pct: 67 });
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

  it('migrates a v1 payload (no interviews slice) without wiping existing progress', async () => {
    localStorage.setItem('archmentor', JSON.stringify({
      state: {
        srs: { srp: { conceptId: 'srp', ease: 2.5, interval: 1, repetitions: 3, due: '2026-07-05', lastReviewed: '2026-07-04' } },
        quizResults: [{ questionId: 'q1', selectedIndex: 0, correct: true, at: '2026-07-04' }],
        conceptProgress: { srp: { seen: true } },
        streak: { current: 5, longest: 9, lastActiveDate: '2026-07-04' },
        settings: { theme: 'dark', lang: 'en', gradeFilter: 'all', categoryFilter: 'all' },
      },
      version: 1,
    }));
    await useStore.persist.rehydrate();
    const s = useStore.getState();
    expect(s.srs['srp'].repetitions).toBe(3); // pre-existing progress preserved
    expect(s.streak.current).toBe(5);
    expect(s.quizResults).toHaveLength(1);
    expect(s.interviews).toEqual([]); // new slice backfilled, not undefined
  });

  it('migrates a v2 payload (no daily slice) without wiping progress and backfills daily', async () => {
    localStorage.setItem('archmentor', JSON.stringify({
      state: {
        srs: { srp: { conceptId: 'srp', ease: 2.5, interval: 1, repetitions: 3, due: '2026-07-14', lastReviewed: '2026-07-13' } },
        quizResults: [{ questionId: 'q1', selectedIndex: 0, correct: true, at: '2026-07-13' }],
        interviews: [{ at: '2026-07-13', grade: 'middle', asked: 6, correct: 4, missedQuestionIds: [] }],
        conceptProgress: { srp: { seen: true } },
        streak: { current: 5, longest: 9, lastActiveDate: '2026-07-13' },
        settings: { theme: 'dark', lang: 'en', gradeFilter: 'all', categoryFilter: 'all' },
      },
      version: 2,
    }));
    await useStore.persist.rehydrate();
    const s = useStore.getState();
    expect(s.srs['srp'].repetitions).toBe(3);       // preserved
    expect(s.interviews).toHaveLength(1);            // preserved
    expect(s.streak.current).toBe(5);                // preserved
    expect(s.daily).toEqual({ streak: 0, longest: 0, lastCompletedDate: null, lastSelectedIndex: null }); // backfilled
  });
});
