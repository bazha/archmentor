import { Link } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { Badge } from '@/components/Badge';
import { GRADE_LABEL, CATEGORY_LABEL } from '@/lib/labels';
import { useT } from '@/i18n/useT';
import type { ConceptView } from '@/content/localize';

interface Props {
  concept: ConceptView | null;
  related: { id: string; name: string }[];
  onSelect: (id: string) => void;
}

export function ConceptPanel({ concept, related, onSelect }: Props) {
  const t = useT();
  const lang = useStore((s) => s.settings.lang);

  if (!concept) {
    return (
      <div className="rounded-2xl border border-line bg-surface-raised p-6 text-sm text-muted shadow-card">
        {t('map.pickHint')}
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-line bg-surface-raised p-6 shadow-card">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight text-bright">{concept.name}</h2>
        <div className="flex flex-wrap gap-2">
          <Badge tone="category" category={concept.category}>{CATEGORY_LABEL[lang][concept.category]}</Badge>
          <Badge tone="grade">{GRADE_LABEL[concept.grade]}</Badge>
        </div>
        <p className="text-sm text-content">{concept.tagline}</p>
      </div>

      {related.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wide text-muted">{t('map.related')}</h3>
          <div className="flex flex-wrap gap-2">
            {related.map((r) => (
              <button key={r.id} type="button" onClick={() => onSelect(r.id)}
                className="rounded-lg border border-line px-2.5 py-1 text-sm text-content transition hover:border-line-strong hover:text-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                {r.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-t border-line pt-4">
        <Link to={`/learn/${concept.id}`}
          className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-on-accent shadow-card transition hover:-translate-y-0.5 hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
          {t('nav.learn')}
        </Link>
        <Link to={`/library/${concept.id}`}
          className="rounded-xl border border-line px-4 py-2 text-sm font-semibold text-content transition hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
          {t('map.openLibrary')}
        </Link>
      </div>
    </div>
  );
}
