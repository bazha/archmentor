export type Theme = 'dark' | 'light';

/** Sync the document's theme class with the given theme. */
export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}
