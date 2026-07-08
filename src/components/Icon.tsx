import type { ReactNode } from 'react';

export type IconName =
  | 'dashboard' | 'course' | 'learn' | 'review' | 'quiz' | 'library' | 'progress'
  | 'search' | 'sun' | 'moon' | 'check' | 'close'
  | 'chevronRight' | 'chevronLeft' | 'arrowRight' | 'bolt' | 'layers' | 'command' | 'hash';

const PATHS: Record<IconName, ReactNode> = {
  dashboard: (<><rect x="3" y="3" width="7.5" height="7.5" rx="1.8" /><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.8" /><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.8" /><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.8" /></>),
  course: (<><circle cx="6" cy="6" r="2.6" /><circle cx="18" cy="18" r="2.6" /><path d="M6 8.6v3.4a3.4 3.4 0 0 0 3.4 3.4H15" /></>),
  learn: (<><path d="m12 3 8.5 4.5L12 12 3.5 7.5 12 3Z" /><path d="m3.5 12 8.5 4.5 8.5-4.5" /><path d="m3.5 16.5 8.5 4.5 8.5-4.5" /></>),
  review: (<><path d="M3.5 12a8.5 8.5 0 0 1 14.3-6.2L21 8.5" /><path d="M21 3.5v5h-5" /><path d="M20.5 12a8.5 8.5 0 0 1-14.3 6.2L3 15.5" /><path d="M3 20.5v-5h5" /></>),
  quiz: (<><circle cx="12" cy="12" r="9" /><path d="M9.3 9.2a3 3 0 1 1 4.2 3c-.9.6-1.5 1-1.5 2.1" /><circle cx="12" cy="17.4" r=".6" fill="currentColor" stroke="none" /></>),
  library: (<><path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19a1 1 0 0 1 1 1v14.5H6.5A1.5 1.5 0 0 0 5 20Z" /><path d="M5 18.5V4.5" /></>),
  progress: (<><path d="M5 20v-6" /><path d="M12 20V5" /><path d="M19 20v-9" /></>),
  search: (<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.4-3.4" /></>),
  sun: (<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>),
  moon: (<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />),
  check: (<path d="M20 6 9 17l-5-5" />),
  close: (<path d="M18 6 6 18M6 6l12 12" />),
  chevronRight: (<path d="m9 6 6 6-6 6" />),
  chevronLeft: (<path d="m15 6-6 6 6 6" />),
  arrowRight: (<path d="M5 12h14M13 6l6 6-6 6" />),
  bolt: (<path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5Z" />),
  layers: (<><path d="m12 3 8.5 4.5L12 12 3.5 7.5 12 3Z" /><path d="m3.5 12 8.5 4.5 8.5-4.5" /></>),
  command: (<path d="M15 6a3 3 0 1 1 3 3h-3Zm0 0v12m0 0a3 3 0 1 0 3-3h-3Zm0 0H9m0 0a3 3 0 1 1-3-3h3Zm0 0V6m0 0a3 3 0 1 0-3 3h3Z" />),
  hash: (<path d="M9 4 7 20M17 4l-2 16M5 9h15M4 15h15" />),
};

export function Icon({ name, className = 'h-5 w-5' }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor"
      strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}
