import { describe, expect, it } from 'vitest';
import sitemap from '../../public/sitemap.xml?raw';
import { conceptsCore } from './core/concepts';

describe('public/sitemap.xml', () => {
  it('lists the home page and the library index', () => {
    expect(sitemap).toContain('<loc>https://bazha.github.io/archmentor/</loc>');
    expect(sitemap).toContain('<loc>https://bazha.github.io/archmentor/library</loc>');
  });

  it('lists a canonical URL for every concept, so each library page is individually discoverable', () => {
    for (const c of conceptsCore) {
      expect(sitemap).toContain(`<loc>https://bazha.github.io/archmentor/library/${c.id}</loc>`);
    }
  });

  it('has exactly one <url> entry per location (home + library index + one per concept)', () => {
    const urlCount = (sitemap.match(/<url>/g) ?? []).length;
    expect(urlCount).toBe(2 + conceptsCore.length);
  });
});
