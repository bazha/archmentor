import { Link } from 'react-router-dom';
import type { Concept } from '@/content/schema';
import { Badge } from '@/components/Badge';
import { GRADE_LABEL, CATEGORY_LABEL } from '@/lib/labels';
import { useStore } from '@/store/useStore';

export function ConceptCard({ concept, mastered }: { concept: Concept; mastered: boolean }) {
  const lang = useStore((s) => s.settings.lang);
  return (
    <Link to={`/library/${concept.id}`}
      className="block rounded-xl border border-surface-muted bg-surface-raised p-4 hover:border-accent-soft transition">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold">{concept.name}</h3>
        {mastered && <Badge tone="grade">✓ освоено</Badge>}
      </div>
      <p className="mt-1 text-sm text-muted">{concept.tagline}</p>
      <div className="mt-3 flex gap-2">
        <Badge tone="grade">{GRADE_LABEL[concept.grade]}</Badge>
        <Badge tone="category">{CATEGORY_LABEL[lang][concept.category]}</Badge>
      </div>
    </Link>
  );
}
