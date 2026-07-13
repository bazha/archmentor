import { useMemo, useState } from 'react';
import { useQuestions } from '@/content/localize';
import { selectDailyQuestion } from '@/domain/daily/selection';
import { isCorrect } from '@/domain/quiz/selection';
import { useStore, isDailyDone } from '@/store/useStore';
import { todayISO } from '@/lib/date';
import { CodeBlock } from '@/components/CodeBlock';
import { EmptyState } from '@/components/EmptyState';
import { Icon } from '@/components/Icon';
import { useT } from '@/i18n/useT';

export function Daily() {
  const t = useT();
  const questions = useQuestions();
  const daily = useStore((s) => s.daily);
  const completeDaily = useStore((s) => s.completeDaily);

  const today = todayISO();
  const q = useMemo(() => selectDailyQuestion(questions, today), [questions, today]);
  const done = useStore((s) => isDailyDone(s, today));

  const [justPicked, setJustPicked] = useState<number | null>(null);
  const selected = justPicked ?? (done ? daily.lastSelectedIndex : null);
  const answered = selected !== null;

  function answer(index: number) {
    if (answered || !q) return;
    setJustPicked(index);
    completeDaily(index, today);
  }

  if (!q) {
    return <EmptyState icon="📅" title={t('daily.emptyTitle')} hint={t('daily.emptyHint')} />;
  }

  const answeredCorrectly = selected !== null && isCorrect(q, selected);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-bright">{t('daily.title')}</h1>
        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-raised px-3.5 py-1 text-sm font-bold text-bright shadow-card">
          {daily.streak}🔥 <span className="font-medium text-muted">{t('daily.streak')}</span>
        </span>
      </div>

      <div className="space-y-6 rounded-2xl border border-line bg-surface-raised p-6 shadow-card sm:p-7">
        <p className="text-xl font-semibold leading-snug tracking-tight text-bright [text-wrap:pretty]">{q.prompt}</p>
        {q.code && <CodeBlock sample={q.code} />}

        <div className="space-y-2.5">
          {q.options.map((opt, idx) => {
            const isAnswer = idx === q.correctIndex;
            const chosen = selected === idx;
            const rowCls = !answered
              ? 'border-line bg-surface hover:translate-x-0.5 hover:border-line-strong hover:bg-surface-muted'
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
                <span aria-hidden="true" className={`grid h-8 w-8 flex-none place-items-center rounded-lg border text-sm font-bold transition ${keyCls}`}>
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

        {answered && (
          <div className="space-y-4 border-t border-line pt-5">
            <div className={`rounded-xl border p-4 ${answeredCorrectly ? 'border-good/30 bg-good/10' : 'border-bad/30 bg-bad/10'}`}>
              <h3 className={`mb-1.5 flex items-center gap-2 text-sm font-bold uppercase tracking-wide ${answeredCorrectly ? 'text-good' : 'text-bad'}`}>
                <Icon name={answeredCorrectly ? 'check' : 'close'} className="h-4 w-4" />
                {t('quiz.explanation')}
              </h3>
              <p className="leading-relaxed text-content">{q.explanation}</p>
            </div>
            <p className="text-sm font-medium text-muted">
              <span>{t('daily.doneToday')}</span> — <span>{t('daily.comeBackTomorrow')}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
