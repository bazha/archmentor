import type { Diagram, ComponentType } from './types';

export const emptyDiagram: Diagram = { nodes: [], edges: [] };

export function addNode(d: Diagram, type: ComponentType, id: string): Diagram {
  if (d.nodes.some((n) => n.id === id)) return d;
  return { ...d, nodes: [...d.nodes, { id, type }] };
}

export function removeNode(d: Diagram, id: string): Diagram {
  return {
    nodes: d.nodes.filter((n) => n.id !== id),
    edges: d.edges.filter((e) => e.from !== id && e.to !== id),
  };
}

export function addEdge(d: Diagram, from: string, to: string): Diagram {
  if (from === to) return d;
  if (d.edges.some((e) => e.from === from && e.to === to)) return d;
  return { ...d, edges: [...d.edges, { from, to }] };
}

export function removeEdge(d: Diagram, from: string, to: string): Diagram {
  return { ...d, edges: d.edges.filter((e) => !(e.from === from && e.to === to)) };
}
