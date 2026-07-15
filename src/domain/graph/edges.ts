export interface RelatedLike { id: string; related: string[] }
export interface ConceptEdge { a: string; b: string }

/**
 * Union of all `related` links as undirected edges: an edge exists when a
 * concept lists the other (either direction). Each unordered pair appears once
 * (ids sorted so a < b), links to unknown ids and self-links are dropped, and
 * output is sorted (deterministic).
 */
export function selectConceptEdges(concepts: RelatedLike[]): ConceptEdge[] {
  const ids = new Set(concepts.map((c) => c.id));
  const seen = new Set<string>();
  const edges: ConceptEdge[] = [];
  for (const c of concepts) {
    for (const other of c.related) {
      if (other === c.id || !ids.has(other)) continue;
      const [a, b] = c.id < other ? [c.id, other] : [other, c.id];
      const key = `${a}|${b}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({ a, b });
    }
  }
  return edges.sort((p, q) => (p.a === q.a ? p.b.localeCompare(q.b) : p.a.localeCompare(q.a)));
}
