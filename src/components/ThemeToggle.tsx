import { useStore } from '@/store/useStore';
import { useT } from '@/i18n/useT';
import { Icon } from './Icon';

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
      className="grid h-9 w-9 place-items-center rounded-full border border-line text-muted transition-colors hover:border-line-strong hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} className="h-[1.05rem] w-[1.05rem]" />
    </button>
  );
}
