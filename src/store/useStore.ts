import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { initSrs, review, type SrsState, type Quality } from '@/domain/srs/sm2';
import { daysBetween, isDue } from '@/lib/date';
import type { Concept, Grade, Category } from '@/content/schema';

export interface QuizResult { questionId: string; selectedIndex: number; correct: boolean; at: string; }
export interface Streak { current: number; longest: number; lastActiveDate: string | null; }
export interface Settings { theme: 'dark' | 'light'; gradeFilter: Grade | 'all'; categoryFilter: Category | 'all'; }

const MASTERY_REPETITIONS = 2;

export interface AppState {
  srs: Record<string, SrsState>;
  quizResults: QuizResult[];
  conceptProgress: Record<string, { seen: boolean }>;
  streak: Streak;
  settings: Settings;
  reviewConcept: (conceptId: string, quality: Quality, today: string) => void;
  recordQuiz: (questionId: string, selectedIndex: number, correct: boolean, today: string) => void;
  markSeen: (conceptId: string, today: string) => void;
  setSettings: (partial: Partial<Settings>) => void;
  resetProgress: () => void;
}

type PersistedState = Pick<AppState, 'srs' | 'quizResults' | 'conceptProgress' | 'streak' | 'settings'>;

const initialData = (): PersistedState => ({
  srs: {},
  quizResults: [],
  conceptProgress: {},
  streak: { current: 0, longest: 0, lastActiveDate: null },
  settings: { theme: 'dark', gradeFilter: 'all', categoryFilter: 'all' },
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
      version: 1,
      migrate: (persisted: unknown, version: number) => migrate(persisted, version),
      partialize: (s): PersistedState => ({
        srs: s.srs, quizResults: s.quizResults, conceptProgress: s.conceptProgress,
        streak: s.streak, settings: s.settings,
      }),
    },
  ),
);

/** Version migration hook. v1 is the baseline; unknown/older shapes reset progress safely. */
export function migrate(persisted: unknown, version: number): PersistedState {
  if (version === 1 && persisted && typeof persisted === 'object') return persisted as PersistedState;
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

export function selectGradeProgress(
  state: AppState, concepts: Concept[], grade: Grade,
): { total: number; seen: number; mastered: number; pct: number } {
  const inGrade = concepts.filter((c) => c.grade === grade);
  const seen = inGrade.filter((c) => state.conceptProgress[c.id]?.seen).length;
  const mastered = inGrade.filter((c) => isMastered(state, c.id)).length;
  const pct = inGrade.length === 0 ? 0 : Math.round((mastered / inGrade.length) * 100);
  return { total: inGrade.length, seen, mastered, pct };
}
