import type { Lang } from '@/i18n/lang';
import type { ConceptProse, QuestionProse } from './schema';

export interface Prose { concepts: Record<string, ConceptProse>; questions: Record<string, QuestionProse>; }

const cache = new Map<Lang, Prose>();
const inflight = new Map<Lang, Promise<Prose>>();

export function isLoaded(lang: Lang): boolean {
  return cache.has(lang);
}

export function proseFor(lang: Lang): Prose {
  const p = cache.get(lang);
  if (!p) throw new Error(`content prose for "${lang}" not loaded`);
  return p;
}

/** For tests: seed prose synchronously instead of going through the dynamic import. */
export function setProse(lang: Lang, p: Prose): void {
  cache.set(lang, p);
}

/** Memoized dynamic load of a locale's prose. Static literal specifiers so Rollup can split each locale into its own chunk. */
export function loadLocale(lang: Lang): Promise<Prose> {
  const hit = cache.get(lang);
  if (hit) return Promise.resolve(hit);
  let f = inflight.get(lang);
  if (!f) {
    f = (lang === 'ru' ? import('./locales/ru') : import('./locales/en')).then((m) => {
      const p = { concepts: m.conceptProse, questions: m.questionProse };
      cache.set(lang, p);
      return p;
    });
    // Drop a rejected load from `inflight` so a later retry re-attempts instead of
    // replaying the cached failure (a transient prefetch blip would otherwise
    // permanently break language switching). Success is covered by the cache hit above.
    f.catch(() => inflight.delete(lang));
    inflight.set(lang, f);
  }
  return f;
}

/** Fire-and-forget prefetch, e.g. on language-switch hover, to warm the cache ahead of need. */
export function prefetchLocale(lang: Lang): void {
  if (!cache.has(lang)) void loadLocale(lang);
}
