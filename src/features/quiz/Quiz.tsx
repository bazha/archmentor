import { useMemo, useState } from 'react';
import { questions as allQuestions } from '@/content/index';
import { selectQuestions, isCorrect, scoreSession, type QuizFilter } from '@/domain/quiz/selection';
import { CodeBlock } from '@/components/CodeBlock';
import { PillGroup } from '@/components/PillGroup';
import { useStore } from '@/store/useStore';
import { todayISO } from '@/lib/date';
import type { QuestionType } from '@/content/schema';

const identityShuffle = <T,>(a: T[]) => a;

const MODE_OPTIONS: { value: QuestionType | 'all'; label: string }[] = [
  { value: 'all', label: 'Микс' },
  { value: 'identify-pattern', label: 'Определи паттерн' },
  { value: 'concept', label: 'Теория' },
  { value: 'tradeoff', label: 'Trade-offs' },
];

export function Quiz() {
  const recordQuiz = useStore((s) => s.recordQuiz);
  const [mode, setMode] = useState<QuestionType | 'all'>('all');
  const [i, setI] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const filter: QuizFilter = mode === 'all' ? {} : { type: mode };
  const deck = useMemo(() => selectQuestions(allQuestions, filter, identityShuffle), [mode]);
  const q = deck[i];

  function answer(index: number) {
    if (selected !== null || !q) return;
    const correct = isCorrect(q, index);
    setSelected(index);
    setAnswers((a) => ({ ...a, [q.id]: index }));
    recordQuiz(q.id, index, correct, todayISO());
  }

  function nextQuestion() { setSelected(null); setI((n) => n + 1); }
  function restart() { setSelected(null); setI(0); setAnswers({}); }

  if (!q) {
    const { correct, total } = scoreSession(deck, answers);
    return (
      <div className="text-center py-12 space-y-4">
        <h1 className="text-2xl font-semibold">Готово!</h1>
        <p className="text-lg">Результат: {correct} / {total}</p>
        <button onClick={restart} className="rounded-lg bg-accent px-4 py-2 font-medium">Пройти заново</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Квиз</h1>
        <span className="text-sm text-slate-400">{i + 1} / {deck.length}</span>
      </div>
      <PillGroup options={MODE_OPTIONS} value={mode} onChange={(m) => { setMode(m); restart(); }} />
      <p className="text-lg">{q.prompt}</p>
      {q.code && <CodeBlock sample={q.code} />}
      <div className="space-y-2">
        {q.options.map((opt, idx) => {
          const isAnswer = idx === q.correctIndex;
          const chosen = selected === idx;
          const cls = selected === null ? 'border-surface-muted hover:border-accent-soft'
            : isAnswer ? 'border-emerald-500 bg-emerald-500/10'
            : chosen ? 'border-red-500 bg-red-500/10' : 'border-surface-muted opacity-60';
          return (
            <button key={idx} data-option={idx} onClick={() => answer(idx)} disabled={selected !== null}
              className={`block w-full text-left rounded-lg border px-4 py-3 transition ${cls}`}>{opt}</button>
          );
        })}
      </div>
      {selected !== null && (
        <div className="rounded-lg bg-surface-raised border border-surface-muted p-4">
          <h3 className="font-semibold mb-1">Разбор</h3>
          <p className="text-slate-300">{q.explanation}</p>
          <div className="mt-3 flex justify-end">
            <button onClick={nextQuestion} className="rounded-lg bg-accent px-4 py-2 font-medium">Дальше →</button>
          </div>
        </div>
      )}
    </div>
  );
}
