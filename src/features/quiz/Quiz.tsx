import { useMemo, useState } from 'react';
import { useQuestions } from '@/content/localize';
import { selectQuestions, isCorrect, scoreSession, type QuizFilter } from '@/domain/quiz/selection';
import { CodeBlock } from '@/components/CodeBlock';
import { PillGroup } from '@/components/PillGroup';
import { EmptyState } from '@/components/EmptyState';
import { ProgressBar } from '@/components/ProgressBar';
import { Icon } from '@/components/Icon';
import { useStore } from '@/store/useStore';
import { todayISO } from '@/lib/date';
import { useT } from '@/i18n/useT';
import type { QuestionType } from '@/content/schema';

const identityShuffle = <T,>(a: T[]) => a;

const PRIMARY_BTN =
  'inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent shadow-card transition hover:-translate-y-0.5 hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

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
    { value: 'fill-blank', label: t('quiz.modeFillBlank') },
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
      <div className="mx-auto max-w-2xl">
        <div className="space-y-5 rounded-2xl border border-line bg-surface-raised p-8 text-center shadow-card">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent/10 text-accent">
            <Icon name="quiz" className="h-7 w-7" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-bright">{t('quiz.doneTitle')}</h1>
          <p className="text-lg text-content">{t('quiz.result', { correct, total })}</p>
          <div className="flex justify-center">
            <button onClick={restart} className={PRIMARY_BTN}>{t('quiz.restart')}</button>
          </div>
        </div>
      </div>
    );
  }

  const answeredCorrectly = selected === q.correctIndex;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-bright">{t('quiz.title')}</h1>
          <span className="inline-flex items-center rounded-full border border-line bg-surface-raised px-3 py-1 text-sm font-semibold tabular-nums text-muted">
            {t('common.counter', { index: i + 1, total: deck.length })}
          </span>
        </div>
        <PillGroup options={MODE_OPTIONS} value={mode} onChange={(m) => { setMode(m); restart(); }} />
        <ProgressBar value={(i / deck.length) * 100} />
      </div>

      <div className="space-y-5 rounded-2xl border border-line bg-surface-raised p-6 shadow-card">
        <p className="text-xl font-semibold leading-relaxed text-bright">{q.prompt}</p>
        {q.code && <CodeBlock sample={q.code} />}

        <div className="space-y-2.5">
          {q.options.map((opt, idx) => {
            const isAnswer = idx === q.correctIndex;
            const chosen = selected === idx;
            const answered = selected !== null;

            const rowCls = !answered
              ? 'border-line bg-surface hover:border-line-strong hover:bg-surface-muted'
              : isAnswer
                ? 'border-good bg-good/10 text-bright'
                : chosen
                  ? 'border-bad bg-bad/10'
                  : 'border-line opacity-50';

            const keyCls = !answered
              ? 'border-line-strong text-muted group-hover:border-accent group-hover:text-accent'
              : isAnswer
                ? 'border-good bg-good text-on-accent'
                : chosen
                  ? 'border-bad bg-bad text-on-accent'
                  : 'border-line text-muted';

            return (
              <button
                key={idx}
                data-option={idx}
                onClick={() => answer(idx)}
                disabled={answered}
                className={`group flex w-full items-center gap-4 rounded-xl border px-4 py-3.5 text-left transition ${rowCls}`}
              >
                <span
                  aria-hidden="true"
                  className={`grid h-8 w-8 flex-none place-items-center rounded-lg border text-sm font-bold transition ${keyCls}`}
                >
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="flex-1">{opt}</span>
                <span className="flex-none">
                  {answered && isAnswer && <Icon name="check" className="h-5 w-5 text-good" />}
                  {answered && chosen && !isAnswer && <Icon name="close" className="h-5 w-5 text-bad" />}
                </span>
              </button>
            );
          })}
        </div>

        {selected !== null && (
          <div className="space-y-4">
            <div className={`rounded-xl border p-4 ${answeredCorrectly ? 'border-good/30 bg-good/10' : 'border-bad/30 bg-bad/10'}`}>
              <h3 className={`mb-1.5 flex items-center gap-2 text-sm font-bold uppercase tracking-wide ${answeredCorrectly ? 'text-good' : 'text-bad'}`}>
                <Icon name={answeredCorrectly ? 'check' : 'close'} className="h-4 w-4" />
                {t('quiz.explanation')}
              </h3>
              <p className="leading-relaxed text-content">{q.explanation}</p>
            </div>
            <div className="flex justify-end">
              <button onClick={nextQuestion} className={PRIMARY_BTN}>{t('quiz.next')}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
