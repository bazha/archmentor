import { ReactFlow, Background, Handle, Position, type Node, type Edge, type NodeProps } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { Diagram } from '@/domain/diagram/types';
import type { XY } from '@/domain/diagram/positions';
import type { NodeDiffStatus, EdgeDiffStatus } from '@/domain/diagram/diff';
import { useComponentName } from './useComponentName';

const NODE_CLS: Record<NodeDiffStatus, string> = {
  match: 'border-good text-content',
  extra: 'border-info text-content',
  missing: 'border-dashed border-line text-muted opacity-70',
};

function DiffNode({ data }: NodeProps) {
  const d = data as { label: string; status: NodeDiffStatus };
  return (
    <div className={`rounded-lg border-2 bg-surface-raised px-3 py-1.5 text-xs font-medium ${NODE_CLS[d.status]}`}>
      <Handle type="target" position={Position.Top} className="!opacity-0" isConnectable={false} />
      {d.label}
      <Handle type="source" position={Position.Bottom} className="!opacity-0" isConnectable={false} />
    </div>
  );
}

const nodeTypes = { diff: DiffNode };

interface Props {
  diagram: Diagram;
  positions: Record<string, XY>;
  nodeStatus: Record<string, NodeDiffStatus>;
  edgeStatus: EdgeDiffStatus[];
  colorMode: 'light' | 'dark';
}

export function DiffCanvas({ diagram, positions, nodeStatus, edgeStatus, colorMode }: Props) {
  const name = useComponentName();

  const nodes: Node[] = diagram.nodes.map((nd) => ({
    id: nd.id, type: 'diff',
    position: positions[nd.id] ?? { x: 0, y: 0 },
    data: { label: name(nd.type), status: nodeStatus[nd.id] ?? 'match' },
    draggable: false, connectable: false, selectable: false,
  }));

  const edges: Edge[] = diagram.edges.map((e, i) => {
    const st = edgeStatus[i] ?? 'match';
    const style =
      st === 'missing' ? { strokeDasharray: '4 4', opacity: 0.5 }
      : st === 'extra' ? { stroke: 'rgb(var(--info))' }
      : {};
    return { id: `${e.from}->${e.to}`, source: e.from, target: e.to, style };
  });

  return (
    <div style={{ height: 300 }} className="overflow-hidden rounded-xl border border-line">
      <ReactFlow
        nodes={nodes} edges={edges} nodeTypes={nodeTypes}
        fitView colorMode={colorMode}
        nodesDraggable={false} nodesConnectable={false} elementsSelectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background />
      </ReactFlow>
    </div>
  );
}
