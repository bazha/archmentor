import { useT } from '@/i18n/useT';
import type { ConceptSpeech } from './useConceptSpeech';

const RATES = [0.75, 1, 1.25, 1.5] as const;
const btn =
  'inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-raised px-3 py-1.5 text-sm font-medium text-content transition hover:border-line-strong hover:text-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

export function AudioPlayer({ speech }: { speech: ConceptSpeech }): JSX.Element | null {
  const t = useT();
  if (speech.status === 'unsupported') return null;

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t('concept.audio.listen')}>
      {speech.status === 'idle' && (
        <button type="button" className={btn} onClick={speech.play}>
          <span aria-hidden="true">▶</span> {t('concept.audio.listen')}
        </button>
      )}
      {speech.status === 'playing' && (
        <button type="button" className={btn} onClick={speech.pause} aria-pressed="true">
          <span aria-hidden="true">⏸</span> {t('concept.audio.pause')}
        </button>
      )}
      {speech.status === 'paused' && (
        <button type="button" className={btn} onClick={speech.resume}>
          <span aria-hidden="true">▶</span> {t('concept.audio.resume')}
        </button>
      )}
      {speech.status !== 'idle' && (
        <button type="button" className={btn} onClick={speech.stop}>
          <span aria-hidden="true">⏹</span> {t('concept.audio.stop')}
        </button>
      )}

      <label className="ml-1 inline-flex items-center gap-1.5 text-sm text-muted">
        {t('concept.audio.speed')}
        <select
          aria-label={t('concept.audio.speed')}
          value={speech.rate}
          onChange={(e) => speech.setRate(Number(e.target.value))}
          className="rounded-md border border-line bg-surface-raised px-2 py-1 text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {RATES.map((r) => (
            <option key={r} value={r}>{r}×</option>
          ))}
        </select>
      </label>

      <span className="text-sm text-muted" aria-live="polite">
        {speech.ordinal > 0 ? t('concept.audio.progress', { n: speech.ordinal, m: speech.total }) : ''}
      </span>
    </div>
  );
}
