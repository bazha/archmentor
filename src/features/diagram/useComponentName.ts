import { useStore } from '@/store/useStore';
import { componentNames } from '@/content/diagram';
import type { ComponentType } from '@/domain/diagram/types';

/** Returns a localizer that maps a component type id to its display name. */
export function useComponentName() {
  const lang = useStore((s) => s.settings.lang);
  return (type: ComponentType) => componentNames[type][lang];
}
