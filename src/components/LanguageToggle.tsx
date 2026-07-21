import { useStore } from '@/store/useStore';
import { useT } from '@/i18n/useT';
import { useLangSwitch } from '@/i18n/useLangSwitch';

export function LanguageToggle() {
  const lang = useStore((s) => s.settings.lang);
  const t = useT();
  const { switching, switchLang } = useLangSwitch();
  const next = lang === 'ru' ? 'en' : 'ru';

  return (
    <button
      type="button"
      onClick={() => void switchLang(next)}
      disabled={switching}
      aria-busy={switching}
      aria-label={t('lang.toggle')}
      className="grid h-9 min-w-9 place-items-center rounded-full border border-line px-2 text-sm font-semibold text-muted transition-colors hover:border-line-strong hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-60"
    >
      {next.toUpperCase()}
    </button>
  );
}
