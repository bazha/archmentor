/** Structural subset needed to detect confusable pairs — satisfied by both `Concept` and `ConceptView`. */
export interface RelatedLike {
  id: string;
  related: string[];
}

export interface ConceptPair {
  a: string;
  b: string;
}

/**
 * Pairs of concepts that reference each other in `related` (mutual = "commonly confused").
 * Each unordered pair appears once, with ids sorted so `{a,b}` and `{b,a}` never both appear.
 * One-directional `related` links are ignored. Output is sorted by `a` then `b` (deterministic).
 */
export function selectConfusablePairs(concepts: RelatedLike[]): ConceptPair[] {
  const relatedOf = new Map(concepts.map((c) => [c.id, new Set(c.related)]));
  const seen = new Set<string>();
  const pairs: ConceptPair[] = [];
  for (const c of concepts) {
    for (const other of c.related) {
      if (!relatedOf.get(other)?.has(c.id)) continue; // must be mutual
      const [a, b] = c.id < other ? [c.id, other] : [other, c.id];
      const key = `${a}|${b}`;
      if (seen.has(key)) continue;
      seen.add(key);
      pairs.push({ a, b });
    }
  }
  return pairs.sort((p, q) => (p.a === q.a ? p.b.localeCompare(q.b) : p.a.localeCompare(q.a)));
}
