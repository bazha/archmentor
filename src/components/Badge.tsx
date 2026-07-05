import type { ReactNode } from 'react';

const TONES: Record<string, string> = {
  grade: 'bg-accent/20 text-accent-soft',
  category: 'bg-surface-muted text-muted',
  neutral: 'bg-surface-muted text-muted',
};

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'grade' | 'category' | 'neutral' }) {
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${TONES[tone]}`}>{children}</span>;
}
