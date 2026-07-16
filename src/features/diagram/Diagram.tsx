import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { scenarios, type Scenario } from '@/content/diagram';
import { useStore } from '@/store/useStore';
import { todayISO } from '@/lib/date';
import { EmptyState } from '@/components/EmptyState';
import { Icon } from '@/components/Icon';
import { Badge } from '@/components/Badge';
import { useT } from '@/i18n/useT';
import { GRADE_ORDER, GRADE_LABEL } from '@/lib/labels';
import { ScenarioWorkbench } from './ScenarioWorkbench';

export function Diagram() {
  const { scenarioId } = useParams();
  const scenario = useMemo(() => scenarios.find((s) => s.id === scenarioId), [scenarioId]);
  if (scenarios.length === 0) return <DiagramEmpty />;
  if (!scenarioId || !scenario) return <ScenarioPicker />;
  return <ScenarioBuilder key={scenario.id} scenario={scenario} />;
}

function DiagramEmpty() {
  const t = useT();
  return <EmptyState icon="🧩" title={t('diagram.emptyTitle')} hint={t('diagram.emptyHint')} />;
}

function ScenarioPicker() {
  const t = useT();
  const lang = useStore((s) => s.settings.lang);
  const completed = useStore((s) => s.diagram.completed);
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-bright">{t('diagram.title')}</h1>
        <p className="text-sm text-muted">{t('diagram.pickScenario')}</p>
      </header>
      {GRADE_ORDER.map((grade) => {
        const inGrade = scenarios.filter((s) => s.grade === grade);
        if (inGrade.length === 0) return null;
        return (
          <section key={grade} className="space-y-3" aria-labelledby={`dg-grade-${grade}`}>
            <h2 id={`dg-grade-${grade}`} className="text-sm font-bold uppercase tracking-wide text-muted">
              {GRADE_LABEL[grade]}
            </h2>
            <ul className="space-y-3">
              {inGrade.map((sc) => (
                <li key={sc.id}>
                  <Link to={`/diagram/${sc.id}`}
                    className="flex items-center gap-4 rounded-2xl border border-line bg-surface-raised p-5 shadow-card transition hover:-translate-y-0.5 hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                    <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-accent/10 text-accent">
                      <Icon name="diagram" className="h-6 w-6" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="mb-1 flex items-center gap-2">
                        <span className="font-semibold text-bright">{sc.title[lang]}</span>
                        <Badge tone="grade">{GRADE_LABEL[sc.grade]}</Badge>
                      </span>
                      <span className="block truncate text-sm text-muted">{sc.brief[lang]}</span>
                    </span>
                    {completed[sc.id]?.passed && (
                      <span className="flex-none text-good">
                        <Icon name="check" className="h-5 w-5" />
                        <span className="sr-only">{t('diagram.done')}</span>
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function ScenarioBuilder({ scenario }: { scenario: Scenario }) {
  const t = useT();
  const lang = useStore((s) => s.settings.lang);
  const completeScenario = useStore((s) => s.completeScenario);
  return (
    <ScenarioWorkbench
      scenario={scenario}
      header={
        <header className="space-y-2">
          <Link to="/diagram" className="text-sm font-medium text-accent hover:underline">← {t('diagram.title')}</Link>
          <h1 className="text-2xl font-semibold tracking-tight text-bright">{scenario.title[lang]}</h1>
          <p className="text-content [text-wrap:pretty]">{scenario.brief[lang]}</p>
        </header>
      }
      onSubmit={(_, passed) => completeScenario(scenario.id, passed, todayISO())}
    />
  );
}
