import { Icon } from '@/components/Icon';
import { useT } from '@/i18n/useT';
import type { MessageKey } from '@/i18n/messages';
import type { CheckResult, ComponentType } from '@/domain/diagram/types';
import { useComponentName } from './useComponentName';

const STATUS_ICON = { ok: 'check', warn: 'bolt', fail: 'close' } as const;
const STATUS_CLS = { ok: 'text-good', warn: 'text-accent', fail: 'text-bad' } as const;

export function Report({ results, explanations }: { results: CheckResult[]; explanations?: (string | undefined)[] }) {
  const t = useT();
  const name = useComponentName();

  const line = (r: CheckResult): string => {
    const p = r.params ?? {};
    const vars: Record<string, string> = {};
    if (p.node) vars.node = name(p.node as ComponentType);
    if (p.from) vars.from = name(p.from as ComponentType);
    if (p.to) vars.to = name(p.to as ComponentType);
    if (p.middle) vars.middle = name(p.middle as ComponentType);
    if (p.nodes) vars.nodes = p.nodes.split(',').map((x) => name(x as ComponentType)).join(', ');
    return t(r.messageKey as MessageKey, vars);
  };

  return (
    <ul className="space-y-2" aria-label={t('diagram.report')}>
      {results.map((r, i) => (
        <li key={i} className="rounded-xl border border-line bg-surface p-3">
          <div className="flex items-start gap-3">
            <Icon name={STATUS_ICON[r.status]} className={`mt-0.5 h-4 w-4 flex-none ${STATUS_CLS[r.status]}`} />
            <span className="text-sm text-content">{line(r)}</span>
          </div>
          {explanations?.[i] && <p className="mt-1.5 pl-7 text-xs text-muted">{explanations[i]}</p>}
        </li>
      ))}
    </ul>
  );
}
