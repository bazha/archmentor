import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { isLoaded, loadLocale } from '@/content/registry';
import type { Lang } from './lang';

/**
 * Async-safe language switch: if the target locale's prose isn't cached yet,
 * awaits `loadLocale` before flipping `settings.lang` so `proseFor` never
 * throws. Normally instant, since the non-active locale is idle-prefetched
 * at startup (see `main.tsx`).
 */
export function useLangSwitch() {
  const setSettings = useStore((s) => s.setSettings);
  const [switching, setSwitching] = useState(false);

  async function switchLang(target: Lang): Promise<void> {
    if (!isLoaded(target)) {
      setSwitching(true);
      try {
        await loadLocale(target);
      } catch {
        // Chunk load failed (e.g. stale hash after redeploy, offline) — abort the
        // switch, stay on the current language, and re-enable the control.
        setSwitching(false);
        return;
      }
      setSwitching(false);
    }
    setSettings({ lang: target });
  }

  return { switching, switchLang };
}
