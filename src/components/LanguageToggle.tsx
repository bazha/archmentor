import { useStore } from '@/store/useStore';
import { useT } from '@/i18n/useT';

export function LanguageToggle() {
  const lang = useStore((s) => s.settings.lang);
  const setSettings = useStore((s) => s.setSettings);
  const t = useT();
  const next = lang === 'ru' ? 'en' : 'ru';
  return (
    <button
      type="button"
      onClick={() => setSettings({ lang: next })}
      aria-label={t('lang.toggle')}
      className="rounded-lg px-2 py-1.5 text-sm font-medium text-muted hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft"
    >
      {next.toUpperCase()}
    </button>
  );
}
