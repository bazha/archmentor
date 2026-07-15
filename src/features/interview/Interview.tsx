import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useConcepts, useQuestions } from '@/content/localize';
import type { QuestionView } from '@/content/localize';
import { isCorrect } from '@/domain/quiz/selection';
import {
  initInterview, interviewReducer, drawNext, type InterviewState,
} from '@/domain/interview/machine';
import { useStore } from '@/store/useStore';
import { todayISO } from '@/lib/date';
import { GRADE_ORDER, GRADE_LABEL } from '@/lib/labels';
import type { Grade } from '@/content/schema';
import { CodeBlock } from '@/components/CodeBlock';
import { ProgressBar } from '@/components/ProgressBar';
import { EmptyState } from '@/components/EmptyState';
import { Icon } from '@/components/Icon';
import { useT } from '@/i18n/useT';

const PRIMARY_BTN =
  'inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent shadow-card transition hover:-translate-y-0.5 hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

/** Fisher–Yates shuffle — real randomness in the app (tests inject a deterministic order). */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function Interview() {
  const t = useT();
  const deck = useQuestions();
  const concepts = useConcepts();
  const recordInterview = useStore((s) => s.recordInterview);

  const [session, setSession] = useState<InterviewState | null>(null);
  // Store the id, not the localized view — the view is derived from the reactive
  // `deck` below so the displayed question re-localizes when the language changes.
  const [currentId, setCurrentId] = useState<string | null>(null);
  const recorded = useRef(false);

  const byId = useMemo(() => new Map(deck.map((q) => [q.id, q])), [deck]);
  const conceptName = useMemo(() => new Map(concepts.map((c) => [c.id, c.name])), [concepts]);
  const current = currentId ? byId.get(currentId) ?? null : null;

  function start() {
    recorded.current = false;
    const { state, question } = drawNext(initInterview(), deck, shuffle);
    setSession(state);
    setCurrentId(question?.id ?? null);
  }

  function answer(index: number) {
    if (!session || session.status !== 'active' || !current) return;
    const correct = isCorrect(current, index);
    const advanced = interviewReducer(session, { type: 'answer', correct, questionId: current.id });
    const { state, question } = drawNext(advanced, deck, shuffle);
    setSession(state);
    setCurrentId(question?.id ?? null);
  }

  // Persist the completed session exactly once.
  useEffect(() => {
    if (session?.status === 'done' && !recorded.current) {
      recorded.current = true;
      const asked = session.askedIds.length;
      recordInterview(
        {
          at: todayISO(),
          grade: session.verdict,
          asked,
          correct: asked - session.missedIds.length,
          missedQuestionIds: session.missedIds,
        },
        todayISO(),
      );
    }
  }, [session, recordInterview]);

  if (deck.length === 0) {
    return <EmptyState icon="🎤" title={t('quiz.emptyTitle')} hint={t('quiz.emptyHint')} />;
  }

  // ---- Intro ----
  if (!session) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="space-y-5 rounded-2xl border border-line bg-surface-raised p-8 text-center shadow-card">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent/10 text-accent">
            <Icon name="interview" className="h-7 w-7" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-bright">{t('interview.introTitle')}</h1>
          <p className="leading-relaxed text-content [text-wrap:pretty]">{t('interview.introBody')}</p>
          <div className="flex justify-center">
            <button onClick={start} className={PRIMARY_BTN}>{t('interview.start')}</button>
          </div>
        </div>
      </div>
    );
  }

  // ---- Report ----
  if (session.status === 'done') return <Report session={session} byId={byId} conceptName={conceptName} onRestart={start} />;

  // ---- Active question ----
  const q = current!;
  const climb = ((GRADE_ORDER.indexOf(session.tier) + 1) / GRADE_ORDER.length) * 100;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="space-y-5">
        <h1 className="text-2xl font-semibold tracking-tight text-bright">{t('interview.title')}</h1>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center rounded-full border border-line bg-surface-raised px-3.5 py-1 text-sm font-semibold text-accent shadow-card">
            {t('interview.tier', { grade: GRADE_LABEL[session.tier] })}
          </span>
          <span className="inline-flex items-center rounded-full border border-line bg-surface-raised px-3.5 py-1 text-sm font-bold tabular-nums text-muted shadow-card">
            {t('interview.asked', { n: session.askedIds.length + 1 })}
          </span>
        </div>
        <ProgressBar value={climb} />
      </div>

      <div className="space-y-6 rounded-2xl border border-line bg-surface-raised p-6 shadow-card sm:p-7">
        <p className="text-xl font-semibold leading-snug tracking-tight text-bright [text-wrap:pretty]">{q.prompt}</p>
        {q.code && <CodeBlock sample={q.code} />}

        <div className="space-y-2.5">
          {q.options.map((opt, idx) => (
            <button
              key={idx}
              data-option={idx}
              onClick={() => answer(idx)}
              className="group flex w-full items-center gap-4 rounded-xl border border-line bg-surface px-4 py-3.5 text-left transition hover:translate-x-0.5 hover:border-line-strong hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span
                aria-hidden="true"
                className="grid h-8 w-8 flex-none place-items-center rounded-lg border border-line-strong text-sm font-bold text-muted transition group-hover:border-accent group-hover:text-accent"
              >
                {String.fromCharCode(65 + idx)}
              </span>
              <span className="flex-1">{opt}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Report({
  session, byId, conceptName, onRestart,
}: {
  session: InterviewState;
  byId: Map<string, QuestionView>;
  conceptName: Map<string, string>;
  onRestart: () => void;
}) {
  const t = useT();
  const asked = session.askedIds.length;
  const correct = asked - session.missedIds.length;

  // Per-grade breakdown reconstructed from the asked/missed ids.
  const perGrade = GRADE_ORDER.map((g) => {
    const ids = session.askedIds.filter((id) => byId.get(id)?.grade === g);
    const missed = ids.filter((id) => session.missedIds.includes(id)).length;
    return { grade: g, total: ids.length, correct: ids.length - missed };
  }).filter((row) => row.total > 0);

  // Weak topics: distinct concepts behind missed questions (that map to a concept).
  const weakConceptIds = [...new Set(
    session.missedIds.map((id) => byId.get(id)?.conceptId).filter((c): c is string => Boolean(c && conceptName.has(c))),
  )];

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="space-y-5 rounded-2xl border border-line bg-surface-raised p-8 text-center shadow-card">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent/10 text-accent">
          <Icon name="interview" className="h-7 w-7" />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight text-bright">{t('interview.reportTitle')}</h1>
        {session.verdict ? (
          <p className="text-2xl font-semibold tracking-tight text-accent">
            {t('interview.verdict', { grade: GRADE_LABEL[session.verdict as Grade] })}
          </p>
        ) : (
          <p className="text-lg font-semibold text-content">{t('interview.verdictNone')}</p>
        )}
        <p className="text-content">{t('interview.summary', { correct, asked })}</p>
      </div>

      {perGrade.length > 0 && (
        <section className="space-y-3 rounded-2xl border border-line bg-surface-raised p-6 shadow-card">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">{t('interview.byGrade')}</h2>
          <ul className="space-y-1.5">
            {perGrade.map((row) => (
              <li key={row.grade} className="flex items-center justify-between text-content">
                <span>{GRADE_LABEL[row.grade]}</span>
                <span className="tabular-nums text-muted">{row.correct}/{row.total}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3 rounded-2xl border border-line bg-surface-raised p-6 shadow-card">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted">{t('interview.weakTopics')}</h2>
        {session.missedIds.length === 0 ? (
          <p className="text-content">{t('interview.weakEmpty')}</p>
        ) : weakConceptIds.length === 0 ? (
          <p className="text-content">{t('interview.weakGeneric')}</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {weakConceptIds.map((id) => (
              <li key={id}>
                <Link
                  to={`/learn/${id}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm font-medium text-content transition hover:border-line-strong hover:text-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <Icon name="learn" className="h-4 w-4 text-accent" />
                  {conceptName.get(id)}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex flex-wrap justify-center gap-3">
        <button onClick={onRestart} className={PRIMARY_BTN}>{t('interview.restart')}</button>
        <Link
          to="/review"
          className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface-raised px-5 py-2.5 text-sm font-semibold text-content shadow-card transition hover:-translate-y-0.5 hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {t('interview.reviewCta')}
        </Link>
      </div>
    </div>
  );
}
