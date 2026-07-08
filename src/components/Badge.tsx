import type { ReactNode } from 'react';
import type { Category } from '@/content/schema';

const TONES: Record<string, string> = {
  grade: 'border-line text-muted',
  category: 'border-line text-content',
  neutral: 'border-line text-content',
  done: 'border-good/40 text-good',
};

const CAT_DOT: Record<Category, string> = {
  solid: 'bg-cat-solid',
  creational: 'bg-cat-creational',
  structural: 'bg-cat-structural',
  behavioral: 'bg-cat-behavioral',
  architecture: 'bg-cat-architecture',
  tradeoff: 'bg-cat-tradeoff',
};

export function Badge({
  children, tone = 'neutral', category,
}: { children: ReactNode; tone?: 'grade' | 'category' | 'neutral' | 'done'; category?: Category }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border bg-surface-raised px-2.5 py-0.5 text-xs font-semibold ${TONES[tone]}`}>
      {category && <span className={`h-1.5 w-1.5 rounded-full ${CAT_DOT[category]}`} aria-hidden="true" />}
      {children}
    </span>
  );
}
