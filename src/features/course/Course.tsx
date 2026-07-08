import { Link } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { selectCourseSteps, selectCourseProgress, selectNextStep, type CourseStep } from '@/domain/course';
import { useConcept } from '@/content/localize';
import { ProgressBar } from '@/components/ProgressBar';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { Icon } from '@/components/Icon';
import { useT } from '@/i18n/useT';
import { GRADE_ORDER, GRADE_LABEL } from '@/lib/labels';

function StepStatus({ step }: { step: CourseStep }) {
  if (step.status === 'mastered') {
    return (
      <span className="grid h-6 w-6 flex-none place-items-center rounded-full bg-good text-on-accent" aria-hidden="true">
        <Icon name="check" className="h-3.5 w-3.5" />
      </span>
    );
  }
  if (step.isNext) {
    return (
      <span className="grid h-6 w-6 flex-none place-items-center rounded-full border-2 border-accent" aria-hidden="true">
        <span className="h-2 w-2 rounded-full bg-accent" />
      </span>
    );
  }
  return <span className="h-6 w-6 flex-none rounded-full border-2 border-line-strong" aria-hidden="true" />;
}

function StepRow({ step }: { step: CourseStep }) {
  const c = useConcept(step.conceptId);
  const t = useT();
  if (!c) return null;
  const statusKey =
    step.status === 'mastered' ? 'course.mastered' : step.status === 'inProgress' ? 'course.inProgress' : 'course.notStarted';
  return (
    <Link
      to={`/learn/${step.conceptId}`}
      className={`flex items-center gap-4 rounded-xl px-3 py-3 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${step.isNext ? 'bg-accent/10' : 'hover:bg-surface-muted'}`}
    >
      <StepStatus step={step} />
      <div className="min-w-0 flex-1">
        <span className="font-semibold text-bright">{c.name}</span>
        <p className="mt-0.5 truncate text-sm text-muted">{c.tagline}</p>
        {step.isNext && <span className="mt-1 inline-block text-xs font-semibold text-accent">{t('course.continue')}</span>}
      </div>
      <Badge tone={step.status === 'mastered' ? 'done' : 'neutral'}>{t(statusKey)}</Badge>
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
      <header className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight text-bright">{t('course.title')}</h1>
        <ProgressBar value={progress.pct} label={t('course.progress', { mastered: progress.mastered, total: progress.total })} />
      </header>
      {done && <EmptyState icon="🎓" title={t('course.done')} />}
      {GRADE_ORDER.map((g) => {
        const gradeSteps = steps.filter((s) => s.grade === g);
        return (
          <section key={g} className="space-y-4">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-bold tracking-tight text-bright">{GRADE_LABEL[g]}</h2>
              <div className="h-px flex-1 bg-line" />
            </div>
            <div className="rounded-2xl border border-line bg-surface-raised p-2 shadow-card">
              <div className="divide-y divide-line">
                {gradeSteps.map((s) => (
                  <StepRow key={s.conceptId} step={s} />
                ))}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
