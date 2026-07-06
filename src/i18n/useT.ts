import { useStore } from '@/store/useStore';
import { translate, type MessageKey } from './messages';

export function useT() {
  const lang = useStore((s) => s.settings.lang);
  return (key: MessageKey, vars?: Record<string, string | number>) => translate(lang, key, vars);
}
