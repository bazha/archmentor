#!/usr/bin/env node
// Regenerates public/sitemap.xml from the concept ids in src/content/core/concepts.ts.
// Reads the source as text (not imported) so this plain Node script needs no TS execution.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const conceptsSource = readFileSync(`${root}src/content/core/concepts.ts`, 'utf-8');
const conceptIds = [...conceptsSource.matchAll(/"id":\s*"([a-z0-9-]+)"/g)].map((m) => m[1]);

const BASE_URL = 'https://bazha.github.io/archmentor';
const LASTMOD = '2026-08-02';

function urlEntry(loc, priority) {
  return [
    '  <url>',
    `    <loc>${BASE_URL}${loc}</loc>`,
    `    <lastmod>${LASTMOD}</lastmod>`,
    '    <changefreq>monthly</changefreq>',
    `    <priority>${priority}</priority>`,
    '  </url>',
  ].join('\n');
}

const urls = [
  urlEntry('/', '1.0'),
  urlEntry('/library', '0.9'),
  ...conceptIds.map((id) => urlEntry(`/library/${id}`, '0.7')),
];

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...urls,
  '</urlset>',
  '',
].join('\n');

writeFileSync(`${root}public/sitemap.xml`, xml);
console.log(`Wrote public/sitemap.xml with ${urls.length} URLs (${conceptIds.length} concepts).`);
