import { useCallback, useMemo, useState } from 'react';
import {
  ReactFlow, Background, Controls, Handle, Position,
  type Node, type Edge, type Connection, type NodeChange, type EdgeChange, type NodeProps, type ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { COMPONENT_TYPES, type ComponentType, type Diagram } from '@/domain/diagram/types';
import type { XY } from '@/domain/diagram/positions';
import { useStore } from '@/store/useStore';
import { useT } from '@/i18n/useT';
import { useComponentName } from './useComponentName';
import { DND_MIME } from './dnd';

function ComponentNode({ data }: NodeProps) {
  const d = data as { label: string; removeLabel: string; onDelete: () => void };
  return (
    <div className="relative rounded-lg border border-line bg-surface-raised px-3 py-1.5 text-xs font-medium text-content shadow-card">
      <Handle type="target" position={Position.Top} className="!h-1.5 !w-1.5 !border-0 !bg-line-strong" />
      <span className="pr-3">{d.label}</span>
      <button
        type="button"
        onClick={d.onDelete}
        aria-label={d.removeLabel}
        className="absolute -right-2 -top-2 grid h-4 w-4 place-items-center rounded-full border border-line bg-surface-raised text-[0.7rem] leading-none text-faint transition hover:border-bad hover:text-bad focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        ×
      </button>
      <Handle type="source" position={Position.Bottom} className="!h-1.5 !w-1.5 !border-0 !bg-line-strong" />
    </div>
  );
}

const nodeTypes = { component: ComponentNode };

interface Props {
  diagram: Diagram;
  positions: Record<string, XY>;
  onAdd: (type: ComponentType, at: XY) => void;
  onConnect: (from: string, to: string) => void;
  onRemoveNode: (id: string) => void;
  onDisconnect: (from: string, to: string) => void;
  onMove: (id: string, at: XY) => void;
}

export function CanvasBuilder({ diagram, positions, onAdd, onConnect, onRemoveNode, onDisconnect, onMove }: Props) {
  const name = useComponentName();
  const t = useT();
  const theme = useStore((s) => s.settings.theme);
  const [rf, setRf] = useState<ReactFlowInstance | null>(null);
  // React Flow's Delete/Backspace handling only removes nodes/edges it considers
  // `selected` on the *controlled* arrays we pass in — it does not infer selection
  // from its own internal click-tracking. So selection has to be round-tripped
  // through onNodesChange/onEdgesChange and reflected back into these arrays.
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());
  const [selectedEdgeIds, setSelectedEdgeIds] = useState<Set<string>>(new Set());

  const nodes: Node[] = useMemo(
    () => diagram.nodes.map((nd) => ({
      id: nd.id,
      type: 'component',
      position: positions[nd.id] ?? { x: 0, y: 0 },
      selected: selectedNodeIds.has(nd.id),
      data: {
        label: name(nd.type),
        removeLabel: `${t('diagram.remove')}: ${name(nd.type)}`,
        onDelete: () => onRemoveNode(nd.id),
      },
    })),
    [diagram.nodes, positions, name, t, onRemoveNode, selectedNodeIds],
  );

  const edges: Edge[] = useMemo(
    () => diagram.edges.map((e) => {
      const id = `${e.from}->${e.to}`;
      return { id, source: e.from, target: e.to, selected: selectedEdgeIds.has(id) };
    }),
    [diagram.edges, selectedEdgeIds],
  );

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    for (const c of changes) {
      if (c.type === 'position' && c.position) onMove(c.id, c.position);
      if (c.type === 'select') {
        setSelectedNodeIds((prev) => {
          const next = new Set(prev);
          if (c.selected) next.add(c.id); else next.delete(c.id);
          return next;
        });
      }
      if (c.type === 'remove') {
        setSelectedNodeIds((prev) => {
          if (!prev.has(c.id)) return prev;
          const next = new Set(prev);
          next.delete(c.id);
          return next;
        });
      }
    }
  }, [onMove]);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    for (const c of changes) {
      if (c.type === 'select') {
        setSelectedEdgeIds((prev) => {
          const next = new Set(prev);
          if (c.selected) next.add(c.id); else next.delete(c.id);
          return next;
        });
      }
      if (c.type === 'remove') {
        setSelectedEdgeIds((prev) => {
          if (!prev.has(c.id)) return prev;
          const next = new Set(prev);
          next.delete(c.id);
          return next;
        });
      }
    }
  }, []);

  const handleConnect = (c: Connection) => { if (c.source && c.target) onConnect(c.source, c.target); };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData(DND_MIME);
    if (!rf || !(COMPONENT_TYPES as readonly string[]).includes(type)) return;
    onAdd(type as ComponentType, rf.screenToFlowPosition({ x: e.clientX, y: e.clientY }));
  };

  return (
    <div>
      <div
        style={{ height: 420 }}
        className="overflow-hidden rounded-xl border border-line"
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
        onDrop={onDrop}
      >
        <ReactFlow
          nodes={nodes} edges={edges} nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={handleConnect}
          onNodesDelete={(ns) => ns.forEach((n) => onRemoveNode(n.id))}
          onEdgesDelete={(es) => es.forEach((e) => onDisconnect(e.source, e.target))}
          onInit={setRf}
          deleteKeyCode={['Delete', 'Backspace']}
          fitView colorMode={theme} proOptions={{ hideAttribution: true }}
        >
          <Background />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
      <p className="mt-2 text-xs text-faint">{t('diagram.canvasHint')}</p>
    </div>
  );
}
