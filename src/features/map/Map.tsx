import { useMemo, useState } from 'react';
import { ReactFlow, Background, Controls, Handle, Position, type Node, type Edge, type NodeProps } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useConcepts } from '@/content/localize';
import { selectConceptEdges } from '@/domain/graph/edges';
import { layoutConcepts } from '@/domain/graph/layout';
import { useStore } from '@/store/useStore';
import { useT } from '@/i18n/useT';
import type { Category } from '@/content/schema';
import { ConceptPanel } from './ConceptPanel';

const CAT_DOT: Record<Category, string> = {
  solid: 'bg-cat-solid', creational: 'bg-cat-creational', structural: 'bg-cat-structural',
  behavioral: 'bg-cat-behavioral', architecture: 'bg-cat-architecture', tradeoff: 'bg-cat-tradeoff',
};

function ConceptNode({ data }: NodeProps) {
  const d = data as { label: string; category: Category; selected: boolean; dim: boolean };
  return (
    <div className={`rounded-lg border bg-surface-raised px-3 py-1.5 text-xs font-medium shadow-card transition
      ${d.dim ? 'opacity-25' : ''}
      ${d.selected ? 'border-accent text-bright ring-2 ring-accent' : 'border-line text-content'}`}>
      <Handle type="target" position={Position.Top} className="!opacity-0" isConnectable={false} />
      <span className="flex items-center gap-1.5">
        <span className={`h-2 w-2 flex-none rounded-full ${CAT_DOT[d.category]}`} aria-hidden="true" />
        {d.label}
      </span>
      <Handle type="source" position={Position.Bottom} className="!opacity-0" isConnectable={false} />
    </div>
  );
}

const nodeTypes = { concept: ConceptNode };

export function Map() {
  const t = useT();
  const theme = useStore((s) => s.settings.theme);
  const concepts = useConcepts();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const pos = useMemo(() => layoutConcepts(concepts), [concepts]);
  const edgePairs = useMemo(() => selectConceptEdges(concepts), [concepts]);
  const neighbours = useMemo(() => {
    if (!selectedId) return null;
    const s = new Set<string>([selectedId]);
    for (const e of edgePairs) { if (e.a === selectedId) s.add(e.b); if (e.b === selectedId) s.add(e.a); }
    return s;
  }, [selectedId, edgePairs]);

  const nodes: Node[] = useMemo(() => concepts.map((c) => ({
    id: c.id, type: 'concept', position: pos[c.id] ?? { x: 0, y: 0 },
    data: { label: c.name, category: c.category, selected: c.id === selectedId, dim: neighbours ? !neighbours.has(c.id) : false },
  })), [concepts, pos, selectedId, neighbours]);

  const edges: Edge[] = useMemo(() => edgePairs.map((e, i) => {
    const incident = selectedId != null && (e.a === selectedId || e.b === selectedId);
    return {
      id: `e-${i}`, source: e.a, target: e.b,
      style: selectedId ? { opacity: incident ? 1 : 0.08, strokeWidth: incident ? 2 : 1 } : { opacity: 0.35 },
      className: incident ? 'stroke-accent' : '',
    };
  }), [edgePairs, selectedId]);

  const selected = selectedId ? concepts.find((c) => c.id === selectedId) ?? null : null;
  const related = selected && neighbours
    ? [...neighbours]
        .filter((id) => id !== selected.id)
        .sort()
        .map((id) => ({ id, name: concepts.find((c) => c.id === id)?.name ?? id }))
    : [];

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-bright">{t('map.title')}</h1>
      </header>
      <div className="flex flex-col gap-5 lg:flex-row">
        <div className="h-[70vh] min-w-0 flex-1 overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
          <ReactFlow
            nodes={nodes} edges={edges} nodeTypes={nodeTypes}
            colorMode={theme} fitView minZoom={0.2}
            nodesDraggable={false} nodesConnectable={false} elementsSelectable
            onNodeClick={(_, n) => setSelectedId(n.id)}
            onPaneClick={() => setSelectedId(null)}
            proOptions={{ hideAttribution: true }}
          >
            <Background />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>
        <aside className="lg:w-80 lg:flex-none">
          <ConceptPanel concept={selected} related={related} onSelect={setSelectedId} />
        </aside>
      </div>
    </div>
  );
}
