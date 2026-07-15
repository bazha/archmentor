import { useMemo } from 'react';
import { ReactFlow, Background, Controls, type Node, type Edge, type Connection } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { Diagram } from '@/domain/diagram/types';
import { useStore } from '@/store/useStore';
import { useComponentName } from './useComponentName';

interface Props {
  diagram: Diagram;
  onConnect: (from: string, to: string) => void;
}

/** Read-mostly canvas: shows current nodes/edges (auto-gridded) and lets the user draw edges. */
export function CanvasBuilder({ diagram, onConnect }: Props) {
  const name = useComponentName();
  const theme = useStore((s) => s.settings.theme);

  const nodes: Node[] = useMemo(
    () => diagram.nodes.map((nd, i) => ({
      id: nd.id,
      data: { label: name(nd.type) },
      position: { x: (i % 3) * 200, y: Math.floor(i / 3) * 120 },
    })),
    [diagram.nodes, name],
  );

  const edges: Edge[] = useMemo(
    () => diagram.edges.map((e, i) => ({ id: `e-${i}`, source: e.from, target: e.to })),
    [diagram.edges],
  );

  const handleConnect = (c: Connection) => { if (c.source && c.target) onConnect(c.source, c.target); };

  return (
    <div style={{ height: 420 }} className="overflow-hidden rounded-xl border border-line">
      <ReactFlow nodes={nodes} edges={edges} onConnect={handleConnect} fitView colorMode={theme} proOptions={{ hideAttribution: true }}>
        <Background />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
