import { Link } from 'react-router-dom';
import { concepts } from '@/content/index';
import { ProgressBar } from '@/components/ProgressBar';
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
      <h1 className="text-3xl font-bold">{t('dashboard.title')}</h1>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-surface-raised border border-surface-muted p-4">
          <div className="text-sm text-muted">{t('dashboard.streak')}</div>
          <div className="text-3xl font-bold">{state.streak.current}🔥</div>
          <div className="text-xs text-muted mt-1">{t('dashboard.record', { n: state.streak.longest })}</div>
        </div>
        <Link to="/review" className="rounded-xl bg-surface-raised border border-surface-muted p-4 hover:border-accent-soft">
          <div className="text-sm text-muted">{t('dashboard.dueToday')}</div>
          <div className="text-3xl font-bold">{dueCount}</div>
          <div className="text-xs text-accent-soft mt-1">{t('dashboard.startReview')}</div>
        </Link>
        <Link to="/quiz" className="rounded-xl bg-surface-raised border border-surface-muted p-4 hover:border-accent-soft">
          <div className="text-sm text-muted">{t('dashboard.testYourself')}</div>
          <div className="text-3xl font-bold">{t('dashboard.quiz')}</div>
          <div className="text-xs text-accent-soft mt-1">{t('dashboard.identifyPattern')}</div>
        </Link>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t('dashboard.progressByGrade')}</h2>
        {GRADE_ORDER.map((g) => {
          const p = selectGradeProgress(state, concepts, g);
          return <ProgressBar key={g} value={p.pct} label={t('dashboard.progressLabel', { grade: GRADE_LABEL[g], mastered: p.mastered, total: p.total })} />;
        })}
      </section>

      <Link to={next ? `/learn/${next}` : '/course'} className="inline-block rounded-lg bg-accent px-5 py-2.5 font-medium text-white hover:bg-accent-strong">
        {t('dashboard.continueLearning')}
      </Link>
      <Link to="/course" className="block mt-3 text-sm text-accent-soft hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft rounded">
        {t('course.progress', { mastered: courseProgress.mastered, total: courseProgress.total })}
      </Link>
    </div>
  );
}
