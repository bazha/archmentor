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
export interface DailyState { streak: number; longest: number; lastCompletedDate: string | null; lastSelectedIndex: number | null; }
export interface DiagramState { completed: Record<string, { at: string; passed: boolean }> }
export interface Settings { theme: 'dark' | 'light'; lang: Lang; gradeFilter: Grade | 'all'; categoryFilter: Category | 'all'; }

const MASTERY_REPETITIONS = 2;

export interface AppState {
  srs: Record<string, SrsState>;
  quizResults: QuizResult[];
  interviews: InterviewResult[];
  daily: DailyState;
  diagram: DiagramState;
  conceptProgress: Record<string, { seen: boolean }>;
  streak: Streak;
  settings: Settings;
  reviewConcept: (conceptId: string, quality: Quality, today: string) => void;
  recordQuiz: (questionId: string, selectedIndex: number, correct: boolean, today: string) => void;
  recordInterview: (result: InterviewResult, today: string) => void;
  completeDaily: (selectedIndex: number, today: string) => void;
  completeScenario: (id: string, passed: boolean, today: string) => void;
  markSeen: (conceptId: string, today: string) => void;
  setSettings: (partial: Partial<Settings>) => void;
  resetProgress: () => void;
}

type PersistedState = Pick<AppState, 'srs' | 'quizResults' | 'interviews' | 'daily' | 'diagram' | 'conceptProgress' | 'streak' | 'settings'>;

const initialData = (): PersistedState => ({
  srs: {},
  quizResults: [],
  interviews: [],
  daily: { streak: 0, longest: 0, lastCompletedDate: null, lastSelectedIndex: null },
  diagram: { completed: {} },
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

      completeDaily: (selectedIndex, today) =>
        set((s) => {
          if (s.daily.lastCompletedDate === today) return {}; // already solved today — no-op
          const consecutive = s.daily.lastCompletedDate != null && daysBetween(s.daily.lastCompletedDate, today) === 1;
          const streak = consecutive ? s.daily.streak + 1 : 1;
          return {
            daily: {
              streak,
              longest: Math.max(s.daily.longest, streak),
              lastCompletedDate: today,
              lastSelectedIndex: selectedIndex,
            },
            streak: bumpStreak(s.streak, today), // a solved daily counts as activity
          };
        }),

      completeScenario: (id, passed, today) =>
        set((s) => ({
          diagram: { completed: { ...s.diagram.completed, [id]: { at: today, passed } } },
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
      version: 4,
      migrate: (persisted: unknown, version: number) => migrate(persisted, version),
      merge: (persisted: unknown, current: AppState): AppState => {
        const p = (persisted ?? {}) as Partial<PersistedState>;
        return { ...current, ...p, settings: { ...current.settings, ...(p.settings ?? {}) } };
      },
      partialize: (s): PersistedState => ({
        srs: s.srs, quizResults: s.quizResults, interviews: s.interviews, daily: s.daily, diagram: s.diagram,
        conceptProgress: s.conceptProgress, streak: s.streak, settings: s.settings,
      }),
    },
  ),
);

/**
 * Version migration hook. v1→v2 added `interviews`; v2→v3 added `daily`; v3→v4 added `diagram`.
 * All known shapes are accepted as-is — missing slices are backfilled from defaults by `merge`,
 * so existing progress is preserved. Unknown shapes reset safely.
 */
export function migrate(persisted: unknown, version: number): PersistedState {
  if (version >= 1 && version <= 4 && persisted && typeof persisted === 'object') return persisted as PersistedState;
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

/** True when today's daily challenge has already been completed. */
export function isDailyDone(state: AppState, today: string): boolean {
  return state.daily.lastCompletedDate === today;
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

export function isScenarioDone(state: AppState, id: string): boolean {
  return state.diagram.completed[id] != null;
}

export function selectDiagramProgress(
  state: AppState, scenarioIds: string[],
): { done: number; total: number; pct: number } {
  const total = scenarioIds.length;
  const done = scenarioIds.filter((id) => state.diagram.completed[id] != null).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return { done, total, pct };
}
