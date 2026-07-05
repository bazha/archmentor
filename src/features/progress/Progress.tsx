import { concepts } from '@/content/index';
import { ProgressBar } from '@/components/ProgressBar';
import { useStore, selectGradeProgress, isMastered } from '@/store/useStore';
import { GRADE_ORDER, GRADE_LABEL } from '@/lib/labels';

export function Progress() {
  const state = useStore();
  const reset = useStore((s) => s.resetProgress);
  const total = state.quizResults.length;
  const correct = state.quizResults.filter((r) => r.correct).length;
  const accuracy = total === 0 ? 0 : Math.round((correct / total) * 100);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Прогресс</h1>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-surface-raised border border-surface-muted p-4">
          <div className="text-sm text-muted">Точность квизов</div>
          <div className="text-3xl font-bold">{accuracy}%</div>
          <div className="text-xs text-muted mt-1">{correct} из {total}</div>
        </div>
        <div className="rounded-xl bg-surface-raised border border-surface-muted p-4">
          <div className="text-sm text-muted">Серия дней</div>
          <div className="text-3xl font-bold">{state.streak.current}🔥</div>
        </div>
        <div className="rounded-xl bg-surface-raised border border-surface-muted p-4">
          <div className="text-sm text-muted">Освоено концептов</div>
          <div className="text-3xl font-bold">{concepts.filter((c) => isMastered(state, c.id)).length}</div>
          <div className="text-xs text-muted mt-1">из {concepts.length}</div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Освоение по грейдам</h2>
        {GRADE_ORDER.map((g) => {
          const p = selectGradeProgress(state, concepts, g);
          return <ProgressBar key={g} value={p.pct} label={`${GRADE_LABEL[g]} — ${p.mastered}/${p.total}`} />;
        })}
      </section>

      <button onClick={() => { if (confirm('Сбросить весь прогресс?')) reset(); }}
        className="rounded-lg border border-red-500/50 text-red-400 px-4 py-2 text-sm hover:bg-red-500/10">
        Сбросить прогресс
      </button>
    </div>
  );
}
