export type Theme = 'dark' | 'light';

/**
 * Sync the document's theme class with the given theme.
 * Defaults to dark for any non-'light' value, matching the pre-paint
 * script in index.html so the two layers never disagree.
 */
export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme !== 'light');
}
