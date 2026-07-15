export interface XY { x: number; y: number }

const COLS = 4;
const DX = 200;
const DY = 120;

/** Deterministic grid position for the index-th node (used for non-drop adds). */
export function gridSlot(index: number): XY {
  return { x: (index % COLS) * DX, y: Math.floor(index / COLS) * DY };
}
