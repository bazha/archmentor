import { useMemo, useState } from 'react';
import { useQuestions } from '@/content/localize';
import { selectQuestions, isCorrect, scoreSession, type QuizFilter } from '@/domain/quiz/selection';
import { CodeBlock } from '@/components/CodeBlock';
import { PillGroup } from '@/components/PillGroup';
import { EmptyState } from '@/components/EmptyState';
import { useStore } from '@/store/useStore';
import { todayISO } from '@/lib/date';
import { useT } from '@/i18n/useT';
import type { QuestionType } from '@/content/schema';

const identityShuffle = <T,>(a: T[]) => a;

export function Quiz() {
  const recordQuiz = useStore((s) => s.recordQuiz);
  const allQuestions = useQuestions();
  const t = useT();
  const [mode, setMode] = useState<QuestionType | 'all'>('all');
  const [i, setI] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const MODE_OPTIONS: { value: QuestionType | 'all'; label: string }[] = [
    { value: 'all', label: t('quiz.modeMix') },
    { value: 'identify-pattern', label: t('quiz.modeIdentify') },
    { value: 'concept', label: t('quiz.modeConcept') },
    { value: 'tradeoff', label: t('quiz.modeTradeoff') },
  ];

  const filter: QuizFilter = mode === 'all' ? {} : { type: mode };
  const deck = useMemo(() => selectQuestions(allQuestions, filter, identityShuffle), [allQuestions, mode]);
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

  if (deck.length === 0) {
    return <EmptyState icon="🧪" title={t('quiz.emptyTitle')} hint={t('quiz.emptyHint')} />;
  }

  if (!q) {
    const { correct, total } = scoreSession(deck, answers);
    return (
      <div className="text-center py-12 space-y-4">
        <h1 className="text-2xl font-semibold">{t('quiz.doneTitle')}</h1>
        <p className="text-lg">{t('quiz.result', { correct, total })}</p>
        <button onClick={restart} className="rounded-lg bg-accent px-4 py-2 font-medium text-white hover:bg-accent-strong">{t('quiz.restart')}</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t('quiz.title')}</h1>
        <span className="text-sm text-muted">{t('common.counter', { index: i + 1, total: deck.length })}</span>
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
          <h3 className="font-semibold mb-1">{t('quiz.explanation')}</h3>
          <p className="text-content">{q.explanation}</p>
          <div className="mt-3 flex justify-end">
            <button onClick={nextQuestion} className="rounded-lg bg-accent px-4 py-2 font-medium text-white hover:bg-accent-strong">{t('quiz.next')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
