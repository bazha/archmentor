import { Link } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { selectCourseSteps, selectCourseProgress, selectNextStep, type CourseStep } from '@/domain/course';
import { useConcept } from '@/content/localize';
import { ProgressBar } from '@/components/ProgressBar';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { useT } from '@/i18n/useT';
import { GRADE_ORDER, GRADE_LABEL } from '@/lib/labels';

function StepRow({ step }: { step: CourseStep }) {
  const c = useConcept(step.conceptId);
  const t = useT();
  if (!c) return null;
  const statusKey =
    step.status === 'mastered' ? 'course.mastered' : step.status === 'inProgress' ? 'course.inProgress' : 'course.notStarted';
  return (
    <Link to={`/learn/${step.conceptId}`}
      className={`block rounded-xl border p-4 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft ${step.isNext ? 'border-accent-soft bg-surface-raised' : 'border-surface-muted hover:border-accent-soft'}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold">{step.status === 'mastered' ? '✓ ' : ''}{c.name}</span>
        <Badge tone={step.status === 'mastered' ? 'grade' : 'neutral'}>{t(statusKey)}</Badge>
      </div>
      <p className="mt-1 text-sm text-muted">{c.tagline}</p>
      {step.isNext && <div className="mt-2 text-xs text-accent-soft">{t('course.continue')}</div>}
    </Link>
  );
}

export function Course() {
  const state = useStore();
  const t = useT();
  const steps = selectCourseSteps(state);
  const progress = selectCourseProgress(state);
  const done = selectNextStep(state) === undefined;

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold">{t('course.title')}</h1>
        <ProgressBar value={progress.pct} label={t('course.progress', { mastered: progress.mastered, total: progress.total })} />
      </header>
      {done && <EmptyState icon="🎓" title={t('course.done')} />}
      {GRADE_ORDER.map((g) => (
        <section key={g} className="space-y-3">
          <h2 className="text-xl font-semibold">{GRADE_LABEL[g]}</h2>
          <div className="space-y-2">
            {steps.filter((s) => s.grade === g).map((s) => <StepRow key={s.conceptId} step={s} />)}
          </div>
        </section>
      ))}
    </div>
  );
}
