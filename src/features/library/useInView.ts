import { useEffect, useRef, useState, type RefObject } from 'react';

/**
 * Reports whether the referenced element is currently in the viewport.
 * Safe default `inView: true` (dock stays hidden) before the observer fires
 * or when IntersectionObserver is unavailable.
 */
export function useInView<T extends Element>(): { ref: RefObject<T>; inView: boolean } {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, inView };
}
