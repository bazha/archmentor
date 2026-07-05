import { describe, it, expect } from 'vitest';
import { selectQuestions, isCorrect, scoreSession, type QuizQuestionLike } from './selection';

const identity = <T,>(a: T[]) => a; // deterministic shuffle for tests

const q = (over: Partial<QuizQuestionLike>): QuizQuestionLike => ({
  id: 'q1', type: 'concept', category: 'solid', grade: 'junior',
  options: ['a', 'b'], correctIndex: 0, ...over,
});

const pool: QuizQuestionLike[] = [
  q({ id: 'q1', category: 'solid', grade: 'junior', type: 'concept' }),
  q({ id: 'q2', category: 'behavioral', grade: 'middle', type: 'identify-pattern' }),
  q({ id: 'q3', category: 'behavioral', grade: 'middle', type: 'concept' }),
  q({ id: 'q4', category: 'structural', grade: 'senior', type: 'identify-pattern' }),
];

describe('quiz selection', () => {
  it('filters by category', () => {
    const r = selectQuestions(pool, { category: 'behavioral' }, identity);
    expect(r.map((x) => x.id)).toEqual(['q2', 'q3']);
  });

  it('filters by grade and type together', () => {
    const r = selectQuestions(pool, { grade: 'middle', type: 'identify-pattern' }, identity);
    expect(r.map((x) => x.id)).toEqual(['q2']);
  });

  it('applies limit after filtering', () => {
    const r = selectQuestions(pool, { limit: 2 }, identity);
    expect(r).toHaveLength(2);
  });

  it('empty filter returns all', () => {
    expect(selectQuestions(pool, {}, identity)).toHaveLength(4);
  });

  it('isCorrect compares selected index to correctIndex', () => {
    expect(isCorrect(q({ correctIndex: 1 }), 1)).toBe(true);
    expect(isCorrect(q({ correctIndex: 1 }), 0)).toBe(false);
  });

  it('scoreSession counts correct answers', () => {
    const questions = [q({ id: 'a', correctIndex: 0 }), q({ id: 'b', correctIndex: 1 })];
    const result = scoreSession(questions, { a: 0, b: 0 });
    expect(result).toEqual({ correct: 1, total: 2 });
  });
});
