import { Link } from 'react-router-dom';
import type { ConceptView } from '@/content/localize';
import { Badge } from '@/components/Badge';
import { Icon } from '@/components/Icon';
import { GRADE_LABEL, CATEGORY_LABEL } from '@/lib/labels';
import { useStore } from '@/store/useStore';
import { useT } from '@/i18n/useT';

export function ConceptCard({ concept, mastered }: { concept: ConceptView; mastered: boolean }) {
  const lang = useStore((s) => s.settings.lang);
  const t = useT();
  return (
    <Link to={`/library/${concept.id}`}
      className="group flex flex-col gap-2 rounded-2xl border border-line bg-surface-raised p-5 shadow-card transition hover:-translate-y-0.5 hover:border-line-strong hover:shadow-card-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: `rgb(var(--cat-${concept.category}))` }} aria-hidden="true" />
          <h3 className="font-bold text-bright">{concept.name}</h3>
        </div>
        {mastered && (
          <span className="text-good">
            <Icon name="check" className="h-4 w-4" />
            <span className="sr-only">{t('card.mastered')}</span>
          </span>
        )}
      </div>
      <p className="text-sm leading-relaxed text-muted">{concept.tagline}</p>
      <div className="mt-1 flex items-center justify-between">
        <span className="text-xs text-faint">{CATEGORY_LABEL[lang][concept.category]}</span>
        <Badge tone="grade">{GRADE_LABEL[concept.grade]}</Badge>
      </div>
    </Link>
  );
}
