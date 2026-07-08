import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useStore } from '@/store/useStore';

SyntaxHighlighter.registerLanguage('typescript', typescript);

const MONO = "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace";

/** A code sample already resolved to a plain string for the current language. */
export interface ResolvedCodeSample {
  lang: 'typescript';
  code: string;
  highlightLines?: number[];
}

export function CodeBlock({ sample }: { sample: ResolvedCodeSample }) {
  const dark = useStore((s) => s.settings.theme) === 'dark';
  const bg = 'rgb(var(--surface-code))';
  const highlight = `rgb(var(--accent) / ${dark ? 0.14 : 0.1})`;
  return (
    <div className="overflow-hidden rounded-xl border border-line shadow-card">
      <div className="flex items-center gap-2 border-b border-line px-3.5 py-2.5" style={{ background: bg }}>
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
        </span>
        <span className="ml-auto text-xs text-muted" style={{ fontFamily: MONO }}>TypeScript</span>
      </div>
      <div className="overflow-x-auto text-sm">
        <SyntaxHighlighter
          language="typescript"
          style={dark ? oneDark : oneLight}
          wrapLongLines={false}
          customStyle={{ margin: 0, background: bg, padding: '1rem', fontFamily: MONO, fontSize: '0.85rem' }}
          codeTagProps={{ style: { fontFamily: MONO } }}
          lineProps={(n: number) =>
            sample.highlightLines?.includes(n) ? { style: { background: highlight, display: 'block' } } : {}
          }
          showLineNumbers
        >
          {sample.code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
