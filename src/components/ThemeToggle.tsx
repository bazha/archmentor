import { useStore } from '@/store/useStore';
import { useT } from '@/i18n/useT';

export function ThemeToggle() {
  const theme = useStore((s) => s.settings.theme);
  const setSettings = useStore((s) => s.setSettings);
  const t = useT();
  const next = theme === 'dark' ? 'light' : 'dark';
  return (
    <button
      type="button"
      onClick={() => setSettings({ theme: next })}
      aria-label={t('theme.toggle')}
      aria-pressed={theme === 'dark'}
      className="rounded-lg px-2 py-1.5 text-muted hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
