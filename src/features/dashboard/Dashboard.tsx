import { Link } from 'react-router-dom';
import { concepts } from '@/content/index';
import { ProgressBar } from '@/components/ProgressBar';
import { useStore, selectGradeProgress, selectReviewQueue } from '@/store/useStore';
import { GRADE_ORDER, GRADE_LABEL } from '@/lib/labels';
import { todayISO } from '@/lib/date';

export function Dashboard() {
  const state = useStore();
  const today = todayISO();
  const dueCount = selectReviewQueue(state, concepts, today).length;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Путь от Junior до Lead</h1>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-surface-raised border border-surface-muted p-4">
          <div className="text-sm text-muted">Серия дней</div>
          <div className="text-3xl font-bold">{state.streak.current}🔥</div>
          <div className="text-xs text-muted mt-1">рекорд: {state.streak.longest}</div>
        </div>
        <Link to="/review" className="rounded-xl bg-surface-raised border border-surface-muted p-4 hover:border-accent-soft">
          <div className="text-sm text-muted">К повторению сегодня</div>
          <div className="text-3xl font-bold">{dueCount}</div>
          <div className="text-xs text-accent-soft mt-1">Начать повторение →</div>
        </Link>
        <Link to="/quiz" className="rounded-xl bg-surface-raised border border-surface-muted p-4 hover:border-accent-soft">
          <div className="text-sm text-muted">Проверить себя</div>
          <div className="text-3xl font-bold">Квиз</div>
          <div className="text-xs text-accent-soft mt-1">Определи паттерн →</div>
        </Link>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Прогресс по грейдам</h2>
        {GRADE_ORDER.map((g) => {
          const p = selectGradeProgress(state, concepts, g);
          return <ProgressBar key={g} value={p.pct} label={`${GRADE_LABEL[g]} — освоено ${p.mastered}/${p.total}`} />;
        })}
      </section>

      <Link to="/learn" className="inline-block rounded-lg bg-accent px-5 py-2.5 font-medium text-white hover:bg-accent-strong">
        Продолжить обучение →
      </Link>
    </div>
  );
}
