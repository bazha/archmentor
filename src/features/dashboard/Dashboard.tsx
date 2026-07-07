import { Link } from 'react-router-dom';
import { concepts } from '@/content/index';
import { ProgressBar } from '@/components/ProgressBar';
import { Icon } from '@/components/Icon';
import { useStore, selectGradeProgress, selectReviewQueue } from '@/store/useStore';
import { selectNextStep, selectCourseProgress } from '@/domain/course';
import { GRADE_ORDER, GRADE_LABEL } from '@/lib/labels';
import { todayISO } from '@/lib/date';
import { useT } from '@/i18n/useT';

export function Dashboard() {
  const state = useStore();
  const next = selectNextStep(state);
  const courseProgress = selectCourseProgress(state);
  const t = useT();
  const today = todayISO();
  const dueCount = selectReviewQueue(state, concepts, today).length;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-faint">{t('nav.dashboard')}</p>
        <h1 className="text-3xl font-bold tracking-tight text-bright">{t('dashboard.title')}</h1>
      </header>

      {/* Continue learning */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <Link
          to={next ? `/learn/${next}` : '/course'}
          className="flex flex-1 items-center gap-4 rounded-2xl border border-line bg-surface-raised p-5 shadow-card transition hover:-translate-y-0.5 hover:border-line-strong hover:shadow-card-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span className="grid h-12 w-12 flex-none place-items-center rounded-xl bg-accent/10 text-accent">
            <Icon name="learn" className="h-6 w-6" />
          </span>
          <span className="text-base font-semibold text-bright">{t('dashboard.continueLearning')}</span>
        </Link>
        <Link
          to="/course"
          className="inline-flex items-center gap-3 rounded-2xl border border-line bg-surface-raised px-5 py-4 text-sm font-semibold text-content shadow-card transition hover:-translate-y-0.5 hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-accent/10 text-accent">
            <Icon name="course" className="h-5 w-5" />
          </span>
          {t('course.progress', { mastered: courseProgress.mastered, total: courseProgress.total })}
        </Link>
      </div>

      {/* Stats */}
      <section className="grid gap-5 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-surface-raised p-6 shadow-card">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/10 text-accent">
            <Icon name="bolt" className="h-5 w-5" />
          </span>
          <div className="mt-4 text-3xl font-bold tracking-tight text-bright">{state.streak.current}🔥</div>
          <div className="mt-2 text-sm text-muted">{t('dashboard.streak')}</div>
          <div className="mt-1 text-xs text-faint">{t('dashboard.record', { n: state.streak.longest })}</div>
        </div>

        <Link
          to="/review"
          className="rounded-2xl border border-line bg-surface-raised p-6 shadow-card transition hover:-translate-y-0.5 hover:border-line-strong hover:shadow-card-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-info/10 text-info">
            <Icon name="review" className="h-5 w-5" />
          </span>
          <div className="mt-4 text-3xl font-bold tracking-tight text-bright">{dueCount}</div>
          <div className="mt-2 text-sm text-muted">{t('dashboard.dueToday')}</div>
          <div className="mt-1 text-xs font-medium text-accent">{t('dashboard.startReview')}</div>
        </Link>

        <Link
          to="/quiz"
          className="rounded-2xl border border-line bg-surface-raised p-6 shadow-card transition hover:-translate-y-0.5 hover:border-line-strong hover:shadow-card-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/10 text-accent">
            <Icon name="quiz" className="h-5 w-5" />
          </span>
          <div className="mt-4 text-2xl font-bold tracking-tight text-bright">{t('dashboard.quiz')}</div>
          <div className="mt-2 text-sm text-muted">{t('dashboard.testYourself')}</div>
          <div className="mt-1 text-xs font-medium text-accent">{t('dashboard.identifyPattern')}</div>
        </Link>
      </section>

      {/* Progress by grade */}
      <section className="space-y-5">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold tracking-tight text-bright">{t('dashboard.progressByGrade')}</h2>
          <div className="h-px flex-1 bg-line" />
        </div>
        <div className="space-y-5 rounded-2xl border border-line bg-surface-raised p-6 shadow-card">
          {GRADE_ORDER.map((g) => {
            const p = selectGradeProgress(state, concepts, g);
            return <ProgressBar key={g} value={p.pct} label={t('dashboard.progressLabel', { grade: GRADE_LABEL[g], mastered: p.mastered, total: p.total })} />;
          })}
        </div>
      </section>
    </div>
  );
}
