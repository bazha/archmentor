import { lazy, Suspense, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { scenarios, type Scenario } from '@/content/diagram';
import { validate, isPassed } from '@/domain/diagram/validate';
import { addNode, removeNode, addEdge, removeEdge, emptyDiagram } from '@/domain/diagram/edit';
import type { Diagram as Dgm, ComponentType, CheckResult } from '@/domain/diagram/types';
import { useStore } from '@/store/useStore';
import { todayISO } from '@/lib/date';
import { EmptyState } from '@/components/EmptyState';
import { Icon } from '@/components/Icon';
import { Badge } from '@/components/Badge';
import { useT } from '@/i18n/useT';
import { GRADE_ORDER, GRADE_LABEL } from '@/lib/labels';
import { ListBuilder } from './ListBuilder';
import { Report } from './Report';
import { useComponentName } from './useComponentName';

const CanvasBuilder = lazy(() => import('./CanvasBuilder').then((m) => ({ default: m.CanvasBuilder })));

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
        <h1 className="text-2xl font-bold tracking-tight text-bright">{t('diagram.title')}</h1>
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
  const name = useComponentName();
  const [diagram, setDiagram] = useState<Dgm>(emptyDiagram);
  const [counter, setCounter] = useState(0);
  const [results, setResults] = useState<CheckResult[] | null>(null);
  const [view, setView] = useState<'list' | 'canvas'>('list');

  const add = (type: ComponentType) => {
    setDiagram((d) => addNode(d, type, `${type}-${counter}`));
    setCounter((c) => c + 1);
    setResults(null);
  };
  const rmNode = (id: string) => { setDiagram((d) => removeNode(d, id)); setResults(null); };
  const connect = (from: string, to: string) => { setDiagram((d) => addEdge(d, from, to)); setResults(null); };
  const disconnect = (from: string, to: string) => { setDiagram((d) => removeEdge(d, from, to)); setResults(null); };
  const reset = () => { setDiagram(emptyDiagram); setResults(null); };

  const submit = () => {
    const r = validate(diagram, scenario.constraints);
    setResults(r);
    completeScenario(scenario.id, isPassed(r), todayISO());
  };

  const passed = results != null && isPassed(results);

  const referenceLabel = (id: string): string => {
    const t2 = scenario.reference.nodes.find((nd) => nd.id === id)?.type;
    return t2 ? name(t2) : id;
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-2">
        <Link to="/diagram" className="text-sm font-medium text-accent hover:underline">← {t('diagram.title')}</Link>
        <h1 className="text-2xl font-bold tracking-tight text-bright">{scenario.title[lang]}</h1>
        <p className="text-content [text-wrap:pretty]">{scenario.brief[lang]}</p>
      </header>

      <div className="flex gap-2" role="group" aria-label={t('diagram.title')}>
        <button type="button" onClick={() => setView('list')} aria-pressed={view === 'list'}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${view === 'list' ? 'bg-accent/10 text-accent' : 'text-muted hover:text-content'}`}>
          {t('diagram.viewList')}
        </button>
        <button type="button" onClick={() => setView('canvas')} aria-pressed={view === 'canvas'}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${view === 'canvas' ? 'bg-accent/10 text-accent' : 'text-muted hover:text-content'}`}>
          {t('diagram.viewCanvas')}
        </button>
      </div>

      <div className="rounded-2xl border border-line bg-surface-raised p-6 shadow-card">
        {view === 'list' ? (
          <ListBuilder
            diagram={diagram} palette={scenario.palette}
            onAdd={add} onRemoveNode={rmNode} onConnect={connect} onDisconnect={disconnect}
          />
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {scenario.palette.map((type) => (
                <button key={type} type="button" onClick={() => add(type)}
                  className="rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-content transition hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                  + {name(type)}
                </button>
              ))}
            </div>
            <Suspense fallback={<div className="h-[420px] animate-pulse rounded-xl bg-surface" />}>
              <CanvasBuilder diagram={diagram} onConnect={connect} />
            </Suspense>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={submit} disabled={diagram.nodes.length === 0}
          className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent shadow-card transition hover:-translate-y-0.5 hover:bg-accent-strong disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
          {t('diagram.check')}
        </button>
        <button type="button" onClick={reset}
          className="rounded-xl border border-line px-5 py-2.5 text-sm font-semibold text-content transition hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
          {t('diagram.reset')}
        </button>
      </div>

      {results && (
        <section className="space-y-5 rounded-2xl border border-line bg-surface-raised p-6 shadow-card">
          <h2 className={`flex items-center gap-2 text-lg font-bold ${passed ? 'text-good' : 'text-accent'}`}>
            <Icon name={passed ? 'check' : 'bolt'} className="h-5 w-5" />
            {passed ? t('diagram.passed') : t('diagram.hasIssues')}
          </h2>
          <Report results={results} />
          <div className="border-t border-line pt-4">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">{t('diagram.reference')}</h3>
            <ul className="space-y-1.5 text-sm text-content">
              {scenario.reference.edges.map((e, i) => (
                <li key={i} className="text-muted">{referenceLabel(e.from)} → {referenceLabel(e.to)}</li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}
