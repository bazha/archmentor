import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

SyntaxHighlighter.registerLanguage('typescript', typescript);

/** A code sample already resolved to a plain string for the current language. */
export interface ResolvedCodeSample {
  lang: 'typescript';
  code: string;
  highlightLines?: number[];
}

export function CodeBlock({ sample }: { sample: ResolvedCodeSample }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-surface-muted text-sm">
      <SyntaxHighlighter
        language="typescript"
        style={oneDark}
        wrapLongLines={false}
        customStyle={{ margin: 0, background: '#1e293b', padding: '1rem' }}
        lineProps={(n: number) =>
          sample.highlightLines?.includes(n) ? { style: { background: 'rgba(99,102,241,0.15)', display: 'block' } } : {}
        }
        showLineNumbers
      >
        {sample.code}
      </SyntaxHighlighter>
    </div>
  );
}
