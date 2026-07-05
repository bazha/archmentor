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

const lin = (c: number) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
const L = ([r, g, b]: RGB) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a: RGB, b: RGB) => { const x = L(a), y = L(b); const hi = Math.max(x, y), lo = Math.min(x, y); return (hi + 0.05) / (lo + 0.05); };

const WHITE: RGB = [255, 255, 255];
const themes = { light: tokens(':root'), dark: tokens('.dark') };

// [fg token, bg token, min ratio, label]
const PAIRS: [string, string, number, string][] = [
  ['content', 'surface', 4.5, 'content / surface'],
  ['content', 'surface-raised', 4.5, 'content / raised'],
  ['content', 'surface-muted', 4.5, 'content / surface-muted (badge)'],
  ['muted', 'surface', 4.5, 'muted / surface'],
  ['muted', 'surface-raised', 4.5, 'muted / raised'],
  ['accent-soft', 'surface', 4.5, 'accent-soft text / surface'],
  ['accent-soft', 'surface-raised', 4.5, 'accent-soft text / raised'],
];

describe('theme token contrast (WCAG AA)', () => {
  for (const [name, t] of Object.entries(themes)) {
    for (const [fg, bg, min, label] of PAIRS) {
      it(`${name}: ${label} >= ${min}:1`, () => {
        expect(t[fg], `--${fg} defined`).toBeDefined();
        expect(t[bg], `--${bg} defined`).toBeDefined();
        expect(ratio(t[fg], t[bg])).toBeGreaterThanOrEqual(min);
      });
    }
    it(`${name}: white on accent fill >= 4.5:1`, () => {
      expect(ratio(WHITE, t['accent'])).toBeGreaterThanOrEqual(4.5);
    });
  }
});
