import { describe, it, expect } from 'vitest';
import {
  initInterview,
  interviewReducer,
  predecessorGrade,
  pickNextQuestion,
  drawNext,
  type InterviewState,
} from './machine';
import type { QuizQuestionLike } from '@/domain/quiz/selection';
import type { Grade } from '@/content/schema';

const identity = <T,>(a: T[]) => a;

const q = (id: string, grade: Grade): QuizQuestionLike => ({
  id, grade, type: 'concept', category: 'solid', options: ['a', 'b'], correctIndex: 0,
});

/** Feed a sequence of correct/incorrect answers, drawing a real question each step. */
function play(pool: QuizQuestionLike[], answers: boolean[]): InterviewState {
  let { state, question } = drawNext(initInterview(), pool, identity);
  for (const correct of answers) {
    if (!question) break;
    state = interviewReducer(state, { type: 'answer', correct, questionId: question.id });
    ({ state, question } = drawNext(state, pool, identity));
  }
  return state;
}

describe('interview machine', () => {
  it('starts active at the lowest tier with empty tallies', () => {
    const s = initInterview();
    expect(s.tier).toBe('junior');
    expect(s.status).toBe('active');
    expect(s.verdict).toBeNull();
    expect(s.askedIds).toEqual([]);
  });

  it('predecessorGrade walks down the ladder and returns null below junior', () => {
    expect(predecessorGrade('junior')).toBeNull();
    expect(predecessorGrade('middle')).toBe('junior');
    expect(predecessorGrade('lead')).toBe('senior');
  });

  it('promotes after PROMOTE correct answers and resets tier tallies', () => {
    const s0 = initInterview();
    const s1 = interviewReducer(s0, { type: 'answer', correct: true, questionId: 'j1' });
    expect(s1.tier).toBe('junior');
    expect(s1.correctInTier).toBe(1);
    const s2 = interviewReducer(s1, { type: 'answer', correct: true, questionId: 'j2' });
    expect(s2.tier).toBe('middle');
    expect(s2.correctInTier).toBe(0);
    expect(s2.mistakesInTier).toBe(0);
    expect(s2.status).toBe('active');
  });

  it('stops after STOP mistakes with verdict = grade below the current tier', () => {
    // climb to middle, then bomb it
    let s = initInterview();
    s = interviewReducer(s, { type: 'answer', correct: true, questionId: 'j1' });
    s = interviewReducer(s, { type: 'answer', correct: true, questionId: 'j2' }); // → middle
    s = interviewReducer(s, { type: 'answer', correct: false, questionId: 'm1' });
    s = interviewReducer(s, { type: 'answer', correct: false, questionId: 'm2' });
    expect(s.status).toBe('done');
    expect(s.verdict).toBe('junior');
    expect(s.missedIds).toEqual(['m1', 'm2']);
  });

  it('floor: two mistakes on junior yields a null verdict', () => {
    let s = initInterview();
    s = interviewReducer(s, { type: 'answer', correct: false, questionId: 'j1' });
    s = interviewReducer(s, { type: 'answer', correct: false, questionId: 'j2' });
    expect(s.status).toBe('done');
    expect(s.verdict).toBeNull();
  });

  it('ceiling: promoting off the top tier finishes with the top verdict', () => {
    const s0: InterviewState = { ...initInterview(), tier: 'lead' };
    const s1 = interviewReducer(s0, { type: 'answer', correct: true, questionId: 'l1' });
    const s2 = interviewReducer(s1, { type: 'answer', correct: true, questionId: 'l2' });
    expect(s2.status).toBe('done');
    expect(s2.verdict).toBe('lead');
  });

  it('exhausting a tier AFTER answering it counts as passing it (promote)', () => {
    let s = interviewReducer(initInterview(), { type: 'answer', correct: true, questionId: 'j1' });
    s = interviewReducer(s, { type: 'exhausted' }); // pool ran dry after 1 correct, no STOP
    expect(s.tier).toBe('middle');
    expect(s.status).toBe('active');
  });

  it('exhausting a tier with NO activity does not credit it (guards phantom promotion)', () => {
    // Empty pool at the starting tier, nothing answered → end at the highest demonstrated
    // grade (none → null), never silently promote through an unanswered tier.
    const s = interviewReducer(initInterview(), { type: 'exhausted' });
    expect(s.status).toBe('done');
    expect(s.verdict).toBeNull();
  });

  it('a done state is immutable to further events', () => {
    let s = initInterview();
    s = interviewReducer(s, { type: 'answer', correct: false, questionId: 'j1' });
    s = interviewReducer(s, { type: 'answer', correct: false, questionId: 'j2' }); // done
    const after = interviewReducer(s, { type: 'answer', correct: true, questionId: 'x' });
    expect(after).toBe(s);
  });

  it('pickNextQuestion returns an unasked question at the current tier only', () => {
    const pool = [q('j1', 'junior'), q('j2', 'junior'), q('m1', 'middle')];
    const s = { ...initInterview(), askedIds: ['j1'] };
    const picked = pickNextQuestion(s, pool, identity);
    expect(picked?.id).toBe('j2'); // j1 excluded, m1 wrong tier
  });

  it('pickNextQuestion returns null when the tier pool is exhausted', () => {
    const pool = [q('j1', 'junior'), q('m1', 'middle')];
    const s = { ...initInterview(), askedIds: ['j1'] };
    expect(pickNextQuestion(s, pool, identity)).toBeNull();
  });

  it('drawNext stops (does not phantom-skip) when the starting tier is empty', () => {
    // No junior questions and nothing answered → cannot assess; ends below junior rather
    // than silently skipping forward into a tier the candidate never earned.
    const pool = [q('m1', 'middle'), q('s1', 'senior')];
    const { state, question } = drawNext(initInterview(), pool, identity);
    expect(state.status).toBe('done');
    expect(state.verdict).toBeNull();
    expect(question).toBeNull();
  });

  it('drawNext caps the verdict at the highest demonstrated tier (no phantom lead)', () => {
    // Only junior has questions; the candidate answers one correctly, then every higher
    // tier is empty. Must NOT cascade to a 'lead' verdict — caps at the demonstrated grade.
    const pool = [q('j1', 'junior')];
    let res = drawNext(initInterview(), pool, identity);
    expect(res.question?.id).toBe('j1');
    const answered = interviewReducer(res.state, { type: 'answer', correct: true, questionId: 'j1' });
    res = drawNext(answered, pool, identity);
    expect(res.state.status).toBe('done');
    expect(res.state.verdict).toBe('junior'); // middle+ empty → not credited
    expect(res.question).toBeNull();
  });

  it('end-to-end: all-correct run through a full ladder verdicts at lead', () => {
    const pool = [
      q('j1', 'junior'), q('j2', 'junior'),
      q('m1', 'middle'), q('m2', 'middle'),
      q('s1', 'senior'), q('s2', 'senior'),
      q('l1', 'lead'), q('l2', 'lead'),
    ];
    const s = play(pool, [true, true, true, true, true, true, true, true]);
    expect(s.status).toBe('done');
    expect(s.verdict).toBe('lead');
    expect(s.missedIds).toEqual([]);
  });

  it('exhaustion AFTER answering the top tier still verdicts at lead', () => {
    // Synthetic (real lead pool is >=6, so this exhaustion path never fires in production):
    // one lead question answered correctly, then the pool is dry → activity-based pass → lead.
    const pool = [
      q('j1', 'junior'), q('j2', 'junior'),
      q('m1', 'middle'), q('m2', 'middle'),
      q('s1', 'senior'), q('s2', 'senior'),
      q('l1', 'lead'),
    ];
    const s = play(pool, [true, true, true, true, true, true, true]);
    expect(s.status).toBe('done');
    expect(s.verdict).toBe('lead');
  });

  it('initInterview accepts a starting tier; default is the lowest grade', () => {
    expect(initInterview().startTier).toBe('junior');
    expect(initInterview().tier).toBe('junior');
    const s = initInterview('senior');
    expect(s.startTier).toBe('senior');
    expect(s.tier).toBe('senior');
  });

  it('honest verdict: stopping at the starting tier (never promoted) yields null', () => {
    let s = initInterview('senior');
    s = interviewReducer(s, { type: 'answer', correct: false, questionId: 's1' });
    s = interviewReducer(s, { type: 'answer', correct: false, questionId: 's2' });
    expect(s.status).toBe('done');
    expect(s.verdict).toBeNull(); // Middle NOT credited — never demonstrated
  });

  it('honest verdict: passing the start tier then failing higher credits the passed tier', () => {
    let s = initInterview('senior');
    s = interviewReducer(s, { type: 'answer', correct: true, questionId: 's1' });
    s = interviewReducer(s, { type: 'answer', correct: true, questionId: 's2' }); // → lead
    expect(s.tier).toBe('lead');
    s = interviewReducer(s, { type: 'answer', correct: false, questionId: 'l1' });
    s = interviewReducer(s, { type: 'answer', correct: false, questionId: 'l2' });
    expect(s.status).toBe('done');
    expect(s.verdict).toBe('senior'); // predecessor(lead), genuinely demonstrated
  });

  it('exhausting the starting tier with no activity yields null (no phantom credit)', () => {
    const s = interviewReducer(initInterview('senior'), { type: 'exhausted' });
    expect(s.status).toBe('done');
    expect(s.verdict).toBeNull();
  });
});
