import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import { loadLocale, prefetchLocale } from './content/registry';
import { useStore } from './store/useStore';
// Onest (UI/prose) — includes latin + cyrillic subsets per weight
import '@fontsource/onest/400.css';
import '@fontsource/onest/500.css';
import '@fontsource/onest/600.css';
import '@fontsource/onest/700.css';
import '@fontsource/onest/800.css';
// JetBrains Mono — code only
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/700.css';
import './styles/index.css';

const lang = useStore.getState().settings.lang; // persist hydrates synchronously
const root = ReactDOM.createRoot(document.getElementById('root')!);
// Minimal, theme-neutral splash while the first locale loads.
root.render(<div className="min-h-screen bg-surface" aria-busy="true" />);

loadLocale(lang).then(() => {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
  const other = lang === 'ru' ? 'en' : 'ru';
  const idle =
    (window as unknown as { requestIdleCallback?: (cb: () => void) => void }).requestIdleCallback ??
    ((cb: () => void) => setTimeout(cb, 1500));
  idle(() => prefetchLocale(other));
});
