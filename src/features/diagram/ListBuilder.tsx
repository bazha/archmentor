import { useState } from 'react';
import { Icon } from '@/components/Icon';
import { useT } from '@/i18n/useT';
import type { Diagram, ComponentType } from '@/domain/diagram/types';
import { useComponentName } from './useComponentName';

interface Props {
  diagram: Diagram;
  palette: ComponentType[];
  onAdd: (type: ComponentType) => void;
  onRemoveNode: (id: string) => void;
  onConnect: (from: string, to: string) => void;
  onDisconnect: (from: string, to: string) => void;
}

export function ListBuilder({ diagram, palette, onAdd, onRemoveNode, onConnect, onDisconnect }: Props) {
  const t = useT();
  const name = useComponentName();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const nodeLabel = (id: string) => {
    const node = diagram.nodes.find((n) => n.id === id);
    return node ? name(node.type) : id;
  };

  return (
    <div className="space-y-6">
      {/* Palette */}
      <section aria-labelledby="dg-add" className="space-y-3">
        <h2 id="dg-add" className="text-sm font-bold uppercase tracking-wide text-muted">{t('diagram.addComponent')}</h2>
        <div className="flex flex-wrap gap-2">
          {palette.map((type) => (
            <button key={type} type="button" onClick={() => onAdd(type)}
              className="rounded-lg border border-line bg-surface-raised px-3 py-2 text-sm font-medium text-content transition hover:border-line-strong hover:text-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
              + {name(type)}
            </button>
          ))}
        </div>
      </section>

      {/* Nodes */}
      <section aria-labelledby="dg-nodes" className="space-y-3">
        <h2 id="dg-nodes" className="text-sm font-bold uppercase tracking-wide text-muted">{t('diagram.components')}</h2>
        {diagram.nodes.length === 0 ? (
          <p className="text-sm text-faint">{t('diagram.noComponents')}</p>
        ) : (
          <ul className="space-y-2">
            {diagram.nodes.map((nd) => (
              <li key={nd.id} className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3">
                <span className="flex-1 text-sm text-content">{name(nd.type)}</span>
                <button type="button" onClick={() => onRemoveNode(nd.id)} aria-label={`${t('diagram.remove')}: ${name(nd.type)}`}
                  className="text-faint transition hover:text-bad focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                  <Icon name="close" className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Connections */}
      <section aria-labelledby="dg-edges" className="space-y-3">
        <h2 id="dg-edges" className="text-sm font-bold uppercase tracking-wide text-muted">{t('diagram.connections')}</h2>
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-xs text-muted">
            {t('diagram.from')}
            <select value={from} onChange={(e) => setFrom(e.target.value)}
              className="rounded-lg border border-line bg-surface-raised px-2.5 py-2 text-sm text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
              <option value="">—</option>
              {diagram.nodes.map((nd) => <option key={nd.id} value={nd.id}>{name(nd.type)}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted">
            {t('diagram.to')}
            <select value={to} onChange={(e) => setTo(e.target.value)}
              className="rounded-lg border border-line bg-surface-raised px-2.5 py-2 text-sm text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
              <option value="">—</option>
              {diagram.nodes.map((nd) => <option key={nd.id} value={nd.id}>{name(nd.type)}</option>)}
            </select>
          </label>
          <button type="button" disabled={!from || !to || from === to}
            onClick={() => { onConnect(from, to); setFrom(''); setTo(''); }}
            className="rounded-lg bg-accent px-3.5 py-2 text-sm font-semibold text-on-accent transition hover:bg-accent-strong disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            {t('diagram.addConnection')}
          </button>
        </div>
        {diagram.edges.length === 0 ? (
          <p className="text-sm text-faint">{t('diagram.noConnections')}</p>
        ) : (
          <ul className="space-y-2">
            {diagram.edges.map((e, i) => (
              <li key={i} className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3">
                <span className="flex-1 text-sm text-content">{nodeLabel(e.from)} → {nodeLabel(e.to)}</span>
                <button type="button" onClick={() => onDisconnect(e.from, e.to)} aria-label={`${t('diagram.remove')}: ${nodeLabel(e.from)} → ${nodeLabel(e.to)}`}
                  className="text-faint transition hover:text-bad focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                  <Icon name="close" className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
