import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { useConcepts } from '@/content/localize';
import { useT } from '@/i18n/useT';
import { useLangSwitch } from '@/i18n/useLangSwitch';
import type { MessageKey } from '@/i18n/messages';
import { Icon, type IconName } from './Icon';

type Cmd = { id: string; label: string; meta: string; icon: IconName; run: () => void };

const SCREENS: { key: MessageKey; to: string; icon: IconName }[] = [
  { key: 'nav.dashboard', to: '/', icon: 'dashboard' },
  { key: 'nav.course', to: '/course', icon: 'course' },
  { key: 'nav.learn', to: '/learn', icon: 'learn' },
  { key: 'nav.review', to: '/review', icon: 'review' },
  { key: 'nav.quiz', to: '/quiz', icon: 'quiz' },
  { key: 'nav.interview', to: '/interview', icon: 'interview' },
  { key: 'daily.title', to: '/daily', icon: 'bolt' },
  { key: 'nav.compare', to: '/compare', icon: 'compare' },
  { key: 'nav.map', to: '/map', icon: 'map' },
  { key: 'nav.diagram', to: '/diagram', icon: 'diagram' },
  { key: 'nav.library', to: '/library', icon: 'library' },
  { key: 'nav.progress', to: '/progress', icon: 'progress' },
];

export function CommandPalette() {
  const t = useT();
  const navigate = useNavigate();
  const concepts = useConcepts();
  const setSettings = useStore((s) => s.setSettings);
  const { switchLang } = useLangSwitch();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const commands = useMemo<Cmd[]>(() => {
    const screens: Cmd[] = SCREENS.map((s) => ({
      id: `screen:${s.to}`, label: t(s.key), meta: t('cmdk.screen'), icon: s.icon,
      run: () => navigate(s.to),
    }));
    const conceptCmds: Cmd[] = concepts.map((c) => ({
      id: `concept:${c.id}`, label: c.name, meta: t('cmdk.concept'), icon: 'hash',
      run: () => navigate(`/library/${c.id}`),
    }));
    const actions: Cmd[] = [
      { id: 'act:theme', label: t('theme.toggle'), meta: t('cmdk.action'), icon: 'sun',
        run: () => setSettings({ theme: useStore.getState().settings.theme === 'dark' ? 'light' : 'dark' }) },
      { id: 'act:lang', label: t('lang.toggle'), meta: t('cmdk.action'), icon: 'command',
        run: () => void switchLang(useStore.getState().settings.lang === 'ru' ? 'en' : 'ru') },
    ];
    return [...screens, ...conceptCmds, ...actions];
  }, [t, navigate, concepts, setSettings, switchLang]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? commands.filter((c) => c.label.toLowerCase().includes(q)) : commands;
  }, [commands, query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    const restore = document.activeElement as HTMLElement | null;
    setQuery('');
    setActive(0);
    requestAnimationFrame(() => inputRef.current?.focus());
    return () => restore?.focus?.(); // return focus to the trigger on close
  }, [open]);

  useEffect(() => { if (active >= filtered.length) setActive(0); }, [filtered.length, active]);

  const run = (cmd?: Cmd) => { if (!cmd) return; setOpen(false); cmd.run(); };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setOpen(false); }
    else if (e.key === 'Tab') { e.preventDefault(); } // trap focus in the dialog (list is navigated with arrows)
    else if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(i + 1, filtered.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); run(filtered[active]); }
  };

  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('cmdk.trigger')}
        className="flex h-9 items-center gap-2 rounded-full border border-line bg-surface-raised px-2.5 text-sm text-muted transition-colors hover:border-line-strong hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:min-w-[13rem] sm:pl-3"
      >
        <Icon name="search" className="h-4 w-4" />
        <span className="hidden flex-1 text-left sm:inline">{t('cmdk.placeholder')}</span>
        <span className="hidden rounded-md border border-line-strong px-1.5 py-0.5 text-[0.7rem] text-faint sm:inline">⌘K</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 px-4 pt-[13vh] backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t('cmdk.trigger')}
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-line-strong bg-surface-raised shadow-card-lg"
            onKeyDown={onKeyDown}
          >
            <div className="flex items-center gap-2.5 border-b border-line px-4 py-3.5">
              <Icon name="search" className="h-[1.1rem] w-[1.1rem] text-faint" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('cmdk.placeholder')}
                aria-label={t('cmdk.trigger')}
                role="combobox"
                aria-expanded={true}
                aria-controls="cmdk-list"
                aria-activedescendant={filtered[active] ? `cmdk-opt-${active}` : undefined}
                autoComplete="off"
                spellCheck={false}
                className="flex-1 bg-transparent text-base text-bright outline-none placeholder:text-faint"
              />
            </div>
            <ul ref={listRef} id="cmdk-list" role="listbox" aria-label={t('cmdk.trigger')} className="max-h-[21rem] overflow-y-auto p-1.5">
              {filtered.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-faint">{t('cmdk.empty')}</li>
              )}
              {filtered.map((cmd, i) => (
                <li key={cmd.id}>
                  <button
                    type="button"
                    id={`cmdk-opt-${i}`}
                    role="option"
                    aria-selected={i === active}
                    data-active={i === active}
                    onMouseMove={() => setActive(i)}
                    onClick={() => run(cmd)}
                    className={`flex w-full items-center gap-3.5 rounded-xl px-3 py-2.5 text-left text-[0.92rem] transition-colors ${
                      i === active ? 'bg-accent/10 text-bright' : 'text-content'
                    }`}
                  >
                    <span className={i === active ? 'text-accent' : 'text-faint'}>
                      <Icon name={cmd.icon} className="h-[1.05rem] w-[1.05rem]" />
                    </span>
                    <span className="flex-1">{cmd.label}</span>
                    <span className="text-[0.72rem] text-faint">{cmd.meta}</span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex gap-5 border-t border-line px-4 py-2.5 text-[0.7rem] text-faint">
              <span><b className="font-semibold text-muted">↑↓</b> {t('cmdk.hintNav')}</span>
              <span><b className="font-semibold text-muted">↵</b> {t('cmdk.hintOpen')}</span>
              <span><b className="font-semibold text-muted">esc</b> {t('cmdk.hintClose')}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
