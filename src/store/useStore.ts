import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { initSrs, review, type SrsState, type Quality } from '@/domain/srs/sm2';
import { daysBetween, isDue } from '@/lib/date';
import type { Concept, Grade, Category } from '@/content/schema';
import { GRADE_ORDER } from '@/lib/labels';
import { detectLang, type Lang } from '@/i18n/lang';

export interface QuizResult { questionId: string; selectedIndex: number; correct: boolean; at: string; }
/** One completed interview session. `grade` is the verdict (null = "not yet junior"). */
export interface InterviewResult { at: string; grade: Grade | null; asked: number; correct: number; missedQuestionIds: string[]; }
export interface Streak { current: number; longest: number; lastActiveDate: string | null; }
export interface Settings { theme: 'dark' | 'light'; lang: Lang; gradeFilter: Grade | 'all'; categoryFilter: Category | 'all'; }

const MASTERY_REPETITIONS = 2;

export interface AppState {
  srs: Record<string, SrsState>;
  quizResults: QuizResult[];
  interviews: InterviewResult[];
  conceptProgress: Record<string, { seen: boolean }>;
  streak: Streak;
  settings: Settings;
  reviewConcept: (conceptId: string, quality: Quality, today: string) => void;
  recordQuiz: (questionId: string, selectedIndex: number, correct: boolean, today: string) => void;
  recordInterview: (result: InterviewResult, today: string) => void;
  markSeen: (conceptId: string, today: string) => void;
  setSettings: (partial: Partial<Settings>) => void;
  resetProgress: () => void;
}

type PersistedState = Pick<AppState, 'srs' | 'quizResults' | 'interviews' | 'conceptProgress' | 'streak' | 'settings'>;

const initialData = (): PersistedState => ({
  srs: {},
  quizResults: [],
  interviews: [],
  conceptProgress: {},
  streak: { current: 0, longest: 0, lastActiveDate: null },
  settings: { theme: 'dark', lang: detectLang(), gradeFilter: 'all', categoryFilter: 'all' },
});

function bumpStreak(streak: Streak, today: string): Streak {
  if (streak.lastActiveDate === today) return streak;
  const current = streak.lastActiveDate && daysBetween(streak.lastActiveDate, today) === 1 ? streak.current + 1 : 1;
  return { current, longest: Math.max(streak.longest, current), lastActiveDate: today };
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      ...initialData(),

      reviewConcept: (conceptId, quality, today) =>
        set((s) => {
          const prev = s.srs[conceptId] ?? initSrs(conceptId, today);
          return {
            srs: { ...s.srs, [conceptId]: review(prev, quality, today) },
            conceptProgress: { ...s.conceptProgress, [conceptId]: { seen: true } },
            streak: bumpStreak(s.streak, today),
          };
        }),

      recordQuiz: (questionId, selectedIndex, correct, today) =>
        set((s) => ({
          quizResults: [...s.quizResults, { questionId, selectedIndex, correct, at: today }],
          streak: bumpStreak(s.streak, today),
        })),

      recordInterview: (result, today) =>
        set((s) => ({
          interviews: [...s.interviews, result],
          streak: bumpStreak(s.streak, today),
        })),

      markSeen: (conceptId, today) =>
        set((s) => ({
          conceptProgress: { ...s.conceptProgress, [conceptId]: { seen: true } },
          streak: bumpStreak(s.streak, today),
        })),

      setSettings: (partial) => set((s) => ({ settings: { ...s.settings, ...partial } })),

      resetProgress: () => set(() => ({ ...initialData() })),
    }),
    {
      name: 'archmentor',
      version: 2,
      migrate: (persisted: unknown, version: number) => migrate(persisted, version),
      merge: (persisted: unknown, current: AppState): AppState => {
        const p = (persisted ?? {}) as Partial<PersistedState>;
        return { ...current, ...p, settings: { ...current.settings, ...(p.settings ?? {}) } };
      },
      partialize: (s): PersistedState => ({
        srs: s.srs, quizResults: s.quizResults, interviews: s.interviews, conceptProgress: s.conceptProgress,
        streak: s.streak, settings: s.settings,
      }),
    },
  ),
);

/**
 * Version migration hook. v1→v2 added the `interviews` slice; both shapes are accepted
 * as-is (the missing `interviews` key is backfilled to `[]` by `merge` against defaults),
 * so existing srs/streak/quiz progress is preserved. Unknown shapes reset safely.
 */
export function migrate(persisted: unknown, version: number): PersistedState {
  if ((version === 1 || version === 2) && persisted && typeof persisted === 'object') return persisted as PersistedState;
  return initialData();
}

// ---- Pure selectors (framework-agnostic, unit-tested) ----
export function selectDueConceptIds(state: AppState, today: string): string[] {
  return Object.values(state.srs).filter((s) => isDue(s.due, today)).map((s) => s.conceptId);
}

/** The review queue: concepts with no SRS state yet (new cards) plus existing due cards. */
export function selectReviewQueue(state: AppState, concepts: Concept[], today: string): string[] {
  const due = new Set(selectDueConceptIds(state, today));
  const newOnes = concepts.filter((c) => !state.srs[c.id]).map((c) => c.id);
  return [...new Set([...newOnes, ...due])];
}

export function isMastered(state: AppState, conceptId: string): boolean {
  return (state.srs[conceptId]?.repetitions ?? 0) >= MASTERY_REPETITIONS;
}

/** The highest interview verdict ever achieved, or null if none / all below junior. */
export function selectBestInterviewGrade(state: AppState): Grade | null {
  let best = -1;
  for (const iv of state.interviews) {
    if (iv.grade == null) continue;
    best = Math.max(best, GRADE_ORDER.indexOf(iv.grade));
  }
  return best < 0 ? null : GRADE_ORDER[best];
}

export function selectGradeProgress(
  state: AppState, concepts: Concept[], grade: Grade,
): { total: number; seen: number; mastered: number; pct: number } {
  const inGrade = concepts.filter((c) => c.grade === grade);
  const seen = inGrade.filter((c) => state.conceptProgress[c.id]?.seen).length;
  const mastered = inGrade.filter((c) => isMastered(state, c.id)).length;
  const pct = inGrade.length === 0 ? 0 : Math.round((mastered / inGrade.length) * 100);
  return { total: inGrade.length, seen, mastered, pct };
}
