import { concepts } from '@/content/index';
import { ProgressBar } from '@/components/ProgressBar';
import { Icon } from '@/components/Icon';
import { useStore, selectGradeProgress, isMastered, selectBestInterviewGrade, selectDiagramProgress } from '@/store/useStore';
import { scenarios } from '@/content/diagram';
import { GRADE_ORDER, GRADE_LABEL } from '@/lib/labels';
import { useT } from '@/i18n/useT';

export function Progress() {
  const state = useStore();
  const t = useT();
  const reset = useStore((s) => s.resetProgress);
  const total = state.quizResults.length;
  const correct = state.quizResults.filter((r) => r.correct).length;
  const accuracy = total === 0 ? 0 : Math.round((correct / total) * 100);
  const mastered = concepts.filter((c) => isMastered(state, c.id)).length;
  const masteredPct = concepts.length === 0 ? 0 : Math.round((mastered / concepts.length) * 100);
  const bestInterview = selectBestInterviewGrade(state);
  const diagramProgress = selectDiagramProgress(state, scenarios.map((s) => s.id));

  return (
    <div className="space-y-8">
      {/* Hero */}
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-faint">{t('nav.progress')}</p>
        <h1 className="text-3xl font-semibold tracking-tight text-bright">{t('progress.title')}</h1>
      </header>

      {/* Stats */}
      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-line bg-surface-raised p-6 shadow-card">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-good/10 text-good">
            <Icon name="check" className="h-5 w-5" />
          </span>
          <div className="mt-4 text-3xl font-semibold tracking-tight text-bright tabular-nums">{accuracy}%</div>
          <div className="mt-2 text-sm text-muted">{t('progress.quizAccuracy')}</div>
          <div className="mt-1 text-xs text-faint">{t('progress.ofTotal', { correct, total })}</div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-muted" aria-hidden="true">
            <div className="h-full rounded-full bg-good transition-all" style={{ width: `${accuracy}%` }} />
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-surface-raised p-6 shadow-card">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/10 text-accent">
            <Icon name="bolt" className="h-5 w-5" />
          </span>
          <div className="mt-4 text-3xl font-semibold tracking-tight text-bright">{state.streak.current}🔥</div>
          <div className="mt-2 text-sm text-muted">{t('progress.streak')}</div>
        </div>

        <div className="rounded-2xl border border-line bg-surface-raised p-6 shadow-card">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/10 text-accent">
            <Icon name="layers" className="h-5 w-5" />
          </span>
          <div className="mt-4 text-3xl font-semibold tracking-tight text-bright tabular-nums">{mastered}</div>
          <div className="mt-2 text-sm text-muted">{t('progress.conceptsMastered')}</div>
          <div className="mt-1 text-xs text-faint">{t('progress.outOf', { total: concepts.length })}</div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-muted" aria-hidden="true">
            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${masteredPct}%` }} />
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-surface-raised p-6 shadow-card">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/10 text-accent">
            <Icon name="interview" className="h-5 w-5" />
          </span>
          <div className="mt-4 text-3xl font-semibold tracking-tight text-bright">{bestInterview ? GRADE_LABEL[bestInterview] : '—'}</div>
          <div className="mt-2 text-sm text-muted">{t('interview.bestLevel')}</div>
          <div className="mt-1 text-xs text-faint">{bestInterview ? '' : t('interview.notTaken')}</div>
        </div>

        <div className="rounded-2xl border border-line bg-surface-raised p-6 shadow-card">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/10 text-accent">
            <Icon name="diagram" className="h-5 w-5" />
          </span>
          <div className="mt-4 text-3xl font-semibold tracking-tight text-bright tabular-nums">
            {diagramProgress.done}<span className="text-base font-medium text-muted">/{diagramProgress.total}</span>
          </div>
          <div className="mt-2 text-sm text-muted">{t('progress.diagram')}</div>
        </div>
      </section>

      {total === 0 && (
        <p className="text-sm text-muted">{t('progress.noAttempts')}</p>
      )}

      {/* Mastery by grade */}
      <section className="space-y-5">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold tracking-tight text-bright">{t('progress.masteryByGrade')}</h2>
          <div className="h-px flex-1 bg-line" />
        </div>
        <div className="space-y-5 rounded-2xl border border-line bg-surface-raised p-6 shadow-card">
          {GRADE_ORDER.map((g) => {
            const p = selectGradeProgress(state, concepts, g);
            return <ProgressBar key={g} value={p.pct} label={t('progress.masteryLabel', { grade: GRADE_LABEL[g], mastered: p.mastered, total: p.total })} />;
          })}
        </div>
      </section>

      <button onClick={() => { if (confirm(t('progress.resetConfirm'))) reset(); }}
        className="inline-flex items-center gap-2 rounded-xl border border-bad/50 bg-surface-raised px-5 py-2.5 text-sm font-semibold text-bad shadow-card transition hover:-translate-y-0.5 hover:bg-bad/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bad">
        {t('progress.reset')}
      </button>
    </div>
  );
}
