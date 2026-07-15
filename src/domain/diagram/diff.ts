import type { Diagram, ComponentType } from './types';

export type NodeDiffStatus = 'match' | 'extra' | 'missing';
export type EdgeDiffStatus = 'match' | 'extra' | 'missing';

export interface DiagramDiff {
  /** User nodes keyed by id: match if the type exists in the reference, else extra. */
  userNodes: Record<string, 'match' | 'extra'>;
  /** User edges (parallel to user.edges): match if the type-pair exists in the reference, else extra. */
  userEdges: ('match' | 'extra')[];
  /** Reference nodes keyed by id: match if the type exists in the user diagram, else missing. */
  refNodes: Record<string, 'match' | 'missing'>;
  /** Reference edges (parallel to reference.edges): match if the type-pair exists in the user diagram, else missing. */
  refEdges: ('match' | 'missing')[];
}

function typeOf(d: Diagram, id: string): ComponentType | undefined {
  return d.nodes.find((n) => n.id === id)?.type;
}
function hasType(d: Diagram, t: ComponentType): boolean {
  return d.nodes.some((n) => n.type === t);
}
function hasEdgeType(d: Diagram, from: ComponentType, to: ComponentType): boolean {
  return d.edges.some((e) => typeOf(d, e.from) === from && typeOf(d, e.to) === to);
}

/** Illustrative comparison of a user diagram against a reference, by component type. */
export function diffDiagrams(user: Diagram, reference: Diagram): DiagramDiff {
  const userNodes: Record<string, 'match' | 'extra'> = {};
  for (const n of user.nodes) userNodes[n.id] = hasType(reference, n.type) ? 'match' : 'extra';

  const refNodes: Record<string, 'match' | 'missing'> = {};
  for (const n of reference.nodes) refNodes[n.id] = hasType(user, n.type) ? 'match' : 'missing';

  const userEdges = user.edges.map((e): 'match' | 'extra' => {
    const ft = typeOf(user, e.from);
    const tt = typeOf(user, e.to);
    return ft && tt && hasEdgeType(reference, ft, tt) ? 'match' : 'extra';
  });

  const refEdges = reference.edges.map((e): 'match' | 'missing' => {
    const ft = typeOf(reference, e.from);
    const tt = typeOf(reference, e.to);
    return ft && tt && hasEdgeType(user, ft, tt) ? 'match' : 'missing';
  });

  return { userNodes, userEdges, refNodes, refEdges };
}
