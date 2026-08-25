import { describe, it, expect } from 'vitest';
import css from './index.css?raw';

type RGB = [number, number, number];
function tokens(selector: string): Record<string, RGB> {
  const re = new RegExp(selector.replace('.', '\\.') + '\\s*\\{([^}]*)\\}');
  const body = css.match(re)?.[1] ?? '';
  const out: Record<string, RGB> = {};
  for (const m of body.matchAll(/--([\w-]+):\s*(\d+)\s+(\d+)\s+(\d+)\s*;/g)) {
    out[m[1]] = [Number(m[2]), Number(m[3]), Number(m[4])];
  }
  return out;
}

describe('n8n-style grey canvas with dot grid', () => {
  it('light-mode surface (page canvas) is a distinguishable pale mint, not pure white', () => {
    const { surface } = tokens(':root');
    const [r, g, b] = surface;
    expect(surface).not.toEqual([255, 255, 255]);
    // Pale mint tint: green and blue channels sit clearly above red (not a near-neutral grey).
    expect(g - r).toBeGreaterThan(8);
    expect(b - r).toBeGreaterThan(6);
    // Visibly darker than the white "raised" card surface it sits behind.
    const { 'surface-raised': raised } = tokens(':root');
    const avg = (c: RGB) => (c[0] + c[1] + c[2]) / 3;
    expect(avg(raised) - avg(surface)).toBeGreaterThanOrEqual(5);
  });

  it('body paints a dot grid over the canvas in both themes', () => {
    const bodyRule = css.match(/body\s*\{([^}]*)\}/)?.[1] ?? '';
    expect(bodyRule).toMatch(/background-image:/);
    expect(bodyRule).toMatch(/radial-gradient\(rgb\(var\(--dot\)[^)]*\)\s*[\d.]+px,\s*transparent\s*[\d.]+px\)/);
  });
});
