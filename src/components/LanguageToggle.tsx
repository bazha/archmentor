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
      className="grid h-9 min-w-9 place-items-center rounded-full border border-line px-2 text-sm font-semibold text-muted transition-colors hover:border-line-strong hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      {next.toUpperCase()}
    </button>
  );
}
