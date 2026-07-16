import { useEffect, useId, useState } from 'react';
import { useStore } from '@/store/useStore';

/** Lazily renders a Mermaid diagram (source is trusted app content), theme-aware. */
export function ConceptDiagram({ source, label }: { source: string; label: string }) {
  const theme = useStore((s) => s.settings.theme);
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [svg, setSvg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setSvg(null);
    setFailed(false);
    (async () => {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: theme === 'dark' ? 'dark' : 'neutral',
        });
        const out = await mermaid.render(`cd-${rawId}`, source);
        if (!cancelled) setSvg(out.svg);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => { cancelled = true; };
  }, [source, theme, rawId]);

  if (failed) return null;
  if (!svg) return <div className="h-40 animate-pulse rounded-xl bg-surface-muted" aria-hidden="true" />;
  return (
    <div
      role="img"
      aria-label={label}
      className="overflow-x-auto rounded-xl border border-line bg-surface-raised p-4 [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
