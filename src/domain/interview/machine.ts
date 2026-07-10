import type { Grade } from '@/content/schema';
import { GRADE_ORDER } from '@/lib/labels';
import { selectQuestions, type QuizQuestionLike, type Shuffle } from '@/domain/quiz/selection';

/** Correct answers on a tier needed to move up (≥2 so a lucky guess never promotes). */
export const PROMOTE = 2;
/** Cumulative mistakes on a tier that stop the session (the "ceiling"). */
export const STOP = 2;

export interface InterviewState {
  /** Grade of questions currently being asked; starts at the lowest grade. */
  tier: Grade;
  correctInTier: number;
  mistakesInTier: number;
  /** Every question id asked this session — used to avoid within-session repeats. */
  askedIds: string[];
  /** Ids of questions answered incorrectly — feeds the "weak topics" report. */
  missedIds: string[];
  status: 'active' | 'done';
  /** Highest grade demonstrated; null means "not yet junior". Set when status is 'done'. */
  verdict: Grade | null;
}

export type InterviewEvent =
  | { type: 'answer'; correct: boolean; questionId: string }
  | { type: 'exhausted' };

export function initInterview(): InterviewState {
  return {
    tier: GRADE_ORDER[0],
    correctInTier: 0,
    mistakesInTier: 0,
    askedIds: [],
    missedIds: [],
    status: 'active',
    verdict: null,
  };
}

/** The grade below `g`, or null if `g` is the lowest. */
export function predecessorGrade(g: Grade): Grade | null {
  const i = GRADE_ORDER.indexOf(g);
  return i <= 0 ? null : GRADE_ORDER[i - 1];
}

function nextGrade(g: Grade): Grade | null {
  const i = GRADE_ORDER.indexOf(g);
  return i < 0 || i >= GRADE_ORDER.length - 1 ? null : GRADE_ORDER[i + 1];
}

/** Current tier passed: climb to the next grade, or finish with the top-grade verdict. */
function promote(state: InterviewState): InterviewState {
  const next = nextGrade(state.tier);
  if (next === null) return { ...state, status: 'done', verdict: state.tier };
  return { ...state, tier: next, correctInTier: 0, mistakesInTier: 0 };
}

/**
 * The adaptive state machine. An `answer` updates the tier tallies then resolves:
 * STOP mistakes → stop (verdict = grade below), PROMOTE correct → climb.
 * `exhausted` (tier pool ran dry without stopping) counts as passing the tier.
 */
export function interviewReducer(state: InterviewState, event: InterviewEvent): InterviewState {
  if (state.status === 'done') return state;

  if (event.type === 'exhausted') {
    // Ran out of questions in this tier. If the candidate answered here, they cleared it
    // without hitting STOP → pass (promote). If the tier had zero activity (empty pool),
    // there's no basis to credit it — finish with the highest grade actually demonstrated,
    // so an empty or filtered content set can never mint a phantom top-grade verdict.
    const answeredThisTier = state.correctInTier > 0 || state.mistakesInTier > 0;
    if (answeredThisTier) return promote(state);
    return { ...state, status: 'done', verdict: predecessorGrade(state.tier) };
  }

  const next: InterviewState = {
    ...state,
    askedIds: [...state.askedIds, event.questionId],
    missedIds: event.correct ? state.missedIds : [...state.missedIds, event.questionId],
    correctInTier: state.correctInTier + (event.correct ? 1 : 0),
    mistakesInTier: state.mistakesInTier + (event.correct ? 0 : 1),
  };

  if (next.mistakesInTier >= STOP) return { ...next, status: 'done', verdict: predecessorGrade(next.tier) };
  if (next.correctInTier >= PROMOTE) return promote(next);
  return next;
}

/** First unasked question at the current tier, or null if that tier's pool is exhausted. */
export function pickNextQuestion<T extends QuizQuestionLike>(
  state: InterviewState,
  pool: T[],
  shuffle: Shuffle,
): T | null {
  const tierPool = selectQuestions(pool, { grade: state.tier }, shuffle).filter(
    (q) => !state.askedIds.includes(q.id),
  );
  return tierPool[0] ?? null;
}

/**
 * Draw the next question, advancing past any exhausted tiers. Returns the (possibly
 * advanced) state and the question to ask, or `question: null` when the session is done.
 */
export function drawNext<T extends QuizQuestionLike>(
  state: InterviewState,
  pool: T[],
  shuffle: Shuffle,
): { state: InterviewState; question: T | null } {
  let s = state;
  while (s.status === 'active') {
    const q = pickNextQuestion(s, pool, shuffle);
    if (q) return { state: s, question: q };
    s = interviewReducer(s, { type: 'exhausted' });
  }
  return { state: s, question: null };
}
