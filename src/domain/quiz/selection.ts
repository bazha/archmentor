import type { Question, Category, Grade, QuestionType } from '@/content/schema';

export interface QuizFilter {
  category?: Category;
  grade?: Grade;
  type?: QuestionType;
  limit?: number;
}

export type Shuffle = <T>(arr: T[]) => T[];

export function selectQuestions(all: Question[], filter: QuizFilter, shuffle: Shuffle): Question[] {
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

export function isCorrect(q: Question, selectedIndex: number): boolean {
  return q.correctIndex === selectedIndex;
}

export function scoreSession(questions: Question[], answers: Record<string, number>): { correct: number; total: number } {
  let correct = 0;
  for (const q of questions) {
    if (q.id in answers && isCorrect(q, answers[q.id])) correct++;
  }
  return { correct, total: questions.length };
}
