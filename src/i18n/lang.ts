export type Lang = 'ru' | 'en';

/** Pick the initial language from the browser; defaults to English. */
export function detectLang(): Lang {
  const nav = typeof navigator !== 'undefined' ? navigator.language : undefined;
  return nav && nav.toLowerCase().startsWith('ru') ? 'ru' : 'en';
}
