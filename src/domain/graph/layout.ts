import type { Category } from '@/content/schema';

export interface CategoryLike { id: string; category: Category }
export interface NodePos { x: number; y: number }

/** Fixed cluster order (mirrors CategorySchema enum order). */
export const CATEGORY_ORDER: Category[] = [
  'solid', 'creational', 'structural', 'behavioral', 'architecture', 'tradeoff',
];

const CLUSTER_RADIUS = 560; // distance of each category cluster centre from origin
const NODE_RADIUS = 160;    // base radius of concepts around their cluster centre

/**
 * Deterministic layout: each category is a cluster on a ring around the origin;
 * concepts sit on a sub-ring around their cluster centre, ordered by id. Pure —
 * no randomness, same input always yields the same positions.
 */
export function layoutConcepts(concepts: CategoryLike[]): Record<string, NodePos> {
  const centre = new Map<Category, NodePos>();
  CATEGORY_ORDER.forEach((cat, i) => {
    const ang = (2 * Math.PI * i) / CATEGORY_ORDER.length - Math.PI / 2;
    centre.set(cat, { x: Math.cos(ang) * CLUSTER_RADIUS, y: Math.sin(ang) * CLUSTER_RADIUS });
  });

  const pos: Record<string, NodePos> = {};
  for (const cat of CATEGORY_ORDER) {
    const items = concepts.filter((c) => c.category === cat).slice().sort((a, b) => a.id.localeCompare(b.id));
    const c0 = centre.get(cat)!;
    const n = items.length;
    const rr = NODE_RADIUS + Math.max(0, n - 6) * 12; // grow slightly to avoid overlap
    items.forEach((c, j) => {
      if (n === 1) { pos[c.id] = { x: c0.x, y: c0.y }; return; }
      const ang = (2 * Math.PI * j) / n - Math.PI / 2;
      pos[c.id] = { x: c0.x + Math.cos(ang) * rr, y: c0.y + Math.sin(ang) * rr };
    });
  }
  // Safety net: any concept whose category isn't in CATEGORY_ORDER lands at origin.
  for (const c of concepts) if (!(c.id in pos)) pos[c.id] = { x: 0, y: 0 };
  return pos;
}
