import { describe, it, expect } from 'vitest';
import html from '../index.html?raw';
import sitemap from '../public/sitemap.xml?raw';

describe('SEO metadata (index.html)', () => {
  it('declares English as the document language', () => {
    expect(html).toMatch(/<html lang="en">/);
  });

  it('has a substantial meta description', () => {
    const m = html.match(/<meta name="description" content="([^"]+)"/);
    expect((m?.[1] ?? '').length).toBeGreaterThan(50);
  });

  it('has canonical, Open Graph, and Twitter card tags', () => {
    expect(html).toContain('rel="canonical"');
    expect(html).toContain('property="og:title"');
    expect(html).toContain('property="og:image"');
    expect(html).toContain('property="og:url"');
    expect(html).toContain('name="twitter:card"');
  });

  it('has valid JSON-LD structured data', () => {
    const m = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    expect(m).toBeTruthy();
    expect(() => JSON.parse(m![1])).not.toThrow();
  });

  it('has crawlable descriptive hero text inside #root', () => {
    expect(html).toContain('Learn software architecture');
    expect(html).toContain('GoF design patterns');
  });
});

describe('sitemap', () => {
  it('is XML declaring the homepage URL', () => {
    expect(sitemap).toContain('<?xml');
    expect(sitemap).toContain('<urlset');
    expect(sitemap).toContain('https://bazha.github.io/archmentor/');
  });
});
