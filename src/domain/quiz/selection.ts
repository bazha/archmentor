import type { Category, Grade, QuestionType } from '@/content/schema';

export interface QuizFilter {
  category?: Category;
  grade?: Grade;
  type?: QuestionType;
  limit?: number;
}

export type Shuffle = <T>(arr: T[]) => T[];

/** Structural subset these selectors actually read — satisfied by both the raw
 * (localized) `Question` and the resolved `QuestionView`. */
export interface QuizQuestionLike {
  id: string;
  type: QuestionType;
  category: Category;
  grade: Grade;
  options: unknown[];
  correctIndex: number;
}

export function selectQuestions<T extends QuizQuestionLike>(all: T[], filter: QuizFilter, shuffle: Shuffle): T[] {
  let out = all.filter(
    (q) =>
      (!filter.category || q.category === filter.category) &&
      (!filter.grade || q.grade === filter.grade) &&
      (!filter.type || q.type === filter.type),
  );
  out = shuffle(out);
  if (filter.limit != null) out = out.slice(0, filter.limit);
  return out;
}

export function isCorrect(q: Pick<QuizQuestionLike, 'correctIndex'>, selectedIndex: number): boolean {
  return q.correctIndex === selectedIndex;
}

export function scoreSession<T extends Pick<QuizQuestionLike, 'id' | 'correctIndex'>>(
  questions: T[],
  answers: Record<string, number>,
): { correct: number; total: number } {
  let correct = 0;
  for (const q of questions) {
    if (q.id in answers && isCorrect(q, answers[q.id])) correct++;
  }
  return { correct, total: questions.length };
}
