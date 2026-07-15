# SEO / Discoverability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make ArchMentor discoverable in search and give it a good snippet/preview — rich English metadata, a static crawlable landing hero, structured data, a sitemap, and an OG image.

**Architecture:** All static — edits to `index.html` (head metadata + JSON-LD + a static hero inside `#root` that React replaces on mount) plus `public/sitemap.xml` and `public/og-image.png`. No SSR, no build-architecture change. A file-reading test guards the metadata.

**Tech Stack:** Vite/React (static `index.html`), Vitest.

## Global Constraints

- **SEO text is English.** `<html lang="en">`.
- **Absolute URLs** for canonical/OG/Twitter/sitemap: base is `https://bazha.github.io/archmentor/`.
- **Static hero lives inside `#root`** with **inline styles** (no dependency on the CSS bundle); `createRoot(#root).render(...)` replaces it on mount (no SSR/hydration).
- **No `robots.txt`** (not honored at the GitHub Pages project subpath).
- No new npm dependency. Commit after each task. NO Co-Authored-By / Claude attribution in commit messages.

---

### Task 1: index.html — metadata, JSON-LD, static hero + SEO test

**Files:**
- Modify: `index.html`
- Create: `src/seo.test.ts`

**Interfaces:**
- Produces: enriched `index.html` head + a static hero in `#root`.

- [ ] **Step 1: Rewrite index.html**

Replace the entire contents of `index.html` with:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/svg+xml" href="favicon.svg" />

    <title>ArchMentor — Learn Software Architecture: SOLID, Design Patterns &amp; System Design</title>
    <meta name="description" content="Free, bilingual (English/Russian) app to learn software architecture from Junior to Lead: SOLID, all 23 GoF design patterns, architectural styles, and trade-offs — with flashcards, spaced repetition, quizzes, a mock interview, and a system-design diagram builder." />
    <link rel="canonical" href="https://bazha.github.io/archmentor/" />
    <meta name="theme-color" media="(prefers-color-scheme: light)" content="#FCFCFD" />
    <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0D0F21" />

    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="ArchMentor" />
    <meta property="og:title" content="ArchMentor — Learn Software Architecture" />
    <meta property="og:description" content="Learn SOLID, the 23 GoF design patterns, architectural styles, and trade-offs — from Junior to Lead. Flashcards, spaced repetition, quizzes, a mock interview, and a system-design diagram builder. Free and bilingual." />
    <meta property="og:url" content="https://bazha.github.io/archmentor/" />
    <meta property="og:image" content="https://bazha.github.io/archmentor/og-image.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:locale" content="en_US" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="ArchMentor — Learn Software Architecture" />
    <meta name="twitter:description" content="Learn SOLID, GoF design patterns, architectural styles, and trade-offs — from Junior to Lead. Free and bilingual." />
    <meta name="twitter:image" content="https://bazha.github.io/archmentor/og-image.png" />

    <script type="application/ld+json">
      [
        {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "ArchMentor",
          "url": "https://bazha.github.io/archmentor/",
          "applicationCategory": "EducationalApplication",
          "operatingSystem": "Web",
          "description": "Learn software architecture from Junior to Lead: SOLID, the 23 GoF design patterns, architectural styles, and cross-cutting trade-offs, with flashcards, spaced repetition, quizzes, a mock interview, and a system-design diagram builder.",
          "inLanguage": ["en", "ru"],
          "isAccessibleForFree": true,
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
        },
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "ArchMentor",
          "url": "https://bazha.github.io/archmentor/",
          "description": "Learn software architecture: SOLID, design patterns, architectural styles, and trade-offs.",
          "inLanguage": ["en", "ru"]
        }
      ]
    </script>

    <script>
      try {
        var s = JSON.parse(localStorage.getItem('archmentor') || '{}');
        if (s && s.state && s.state.settings && s.state.settings.theme === 'light') {
          document.documentElement.classList.remove('dark');
        } else {
          document.documentElement.classList.add('dark');
        }
      } catch (e) { document.documentElement.classList.add('dark'); }
    </script>
  </head>
  <body>
    <div id="root">
      <main style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1rem;padding:2rem;background:#0D0F21;color:#E9EAF0;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;text-align:center;">
        <h1 style="font-size:2rem;font-weight:800;color:#F5F6FC;margin:0;">ArchMentor</h1>
        <p style="max-width:42rem;font-size:1.15rem;line-height:1.5;color:#C9CCDA;margin:0;">Learn software architecture from Junior to Lead — SOLID, all 23 GoF design patterns, architectural styles, and cross-cutting trade-offs.</p>
        <p style="max-width:42rem;line-height:1.6;color:#989DB8;margin:0;">Flashcards, SM-2 spaced repetition, quizzes, an adaptive mock interview, side-by-side pattern comparison, an interactive concept map, and a system-design diagram builder. 42 concepts · ~119 questions · bilingual (English / Russian) · free.</p>
        <p style="color:#8C91AC;font-size:.9rem;margin:0;">Loading the app…</p>
      </main>
    </div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Write the SEO test**

Create `src/seo.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const html = readFileSync('index.html', 'utf8');

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
```

- [ ] **Step 3: Run the SEO test**

Run: `npm run test -- src/seo.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 4: Typecheck, full suite, build**

Run: `npx tsc --noEmit && npm run test && npm run build`
Expected: all PASS. Confirm `dist/index.html` contains the meta description, OG tags, JSON-LD, and the hero text (the static `#root` content is preserved by Vite's HTML processing):

Run: `grep -c 'og:title\|application/ld+json\|Learn software architecture' dist/index.html`
Expected: ≥ 3.

- [ ] **Step 5: Commit**

```bash
git add index.html src/seo.test.ts
git commit -m "feat(seo): rich English metadata, JSON-LD, and a crawlable landing hero"
```

---

### Task 2: sitemap, OG image, README note + test

**Files:**
- Create: `public/sitemap.xml`
- Create: `public/og-image.png` (generated)
- Modify: `src/seo.test.ts` (add sitemap assertions)
- Modify: `README.md` (Search Console note)

**Interfaces:**
- Consumes: the metadata from Task 1 (og:image points at `og-image.png`).

- [ ] **Step 1: Create the sitemap**

Create `public/sitemap.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://bazha.github.io/archmentor/</loc>
    <lastmod>2026-07-15</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
```

- [ ] **Step 2: Generate the OG image (1200×630)**

Create a temporary template file `og-template.html` in the repo root (NOT committed):

```html
<!doctype html>
<html>
  <head><meta charset="utf-8" />
  <style>
    html,body{margin:0}
    .card{width:1200px;height:630px;box-sizing:border-box;display:flex;flex-direction:column;justify-content:center;gap:28px;padding:80px;
      background:radial-gradient(120% 80% at 50% -10%, rgba(234,75,113,.16), transparent 60%), #0D0F21;
      color:#F5F6FC;font-family:'Segoe UI',system-ui,-apple-system,Roboto,sans-serif;}
    .name{font-size:80px;font-weight:800;letter-spacing:-.02em}
    .accent{color:#EA4B71}
    .tag{font-size:40px;line-height:1.25;color:#C9CCDA;max-width:1000px}
    .meta{font-size:26px;color:#989DB8}
  </style></head>
  <body>
    <div class="card">
      <div class="name">Arch<span class="accent">Mentor</span></div>
      <div class="tag">Learn software architecture — SOLID, the 23 GoF design patterns, architectural styles &amp; trade-offs.</div>
      <div class="meta">Flashcards · spaced repetition · quizzes · mock interview · system-design diagram builder</div>
    </div>
  </body>
</html>
```

Render it to `public/og-image.png` with headless Chrome (installed at the path below; the app was built with it earlier this session):

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
  --window-size=1200,630 --screenshot="$(pwd)/public/og-image.png" \
  "file://$(pwd)/og-template.html"
rm og-template.html
```

Verify the file is 1200×630:

```bash
node -e "const b=require('fs').readFileSync('public/og-image.png');console.log('w',b.readUInt32BE(16),'h',b.readUInt32BE(20))"
```
Expected: `w 1200 h 630`.

If Chrome is unavailable or the dimensions are wrong, STOP and report BLOCKED (do not commit a wrong-sized or missing image) — the controller will generate it.

- [ ] **Step 3: Extend the SEO test for the sitemap**

In `src/seo.test.ts`, add:

```ts
describe('sitemap', () => {
  const sitemap = readFileSync('public/sitemap.xml', 'utf8');
  it('is XML declaring the homepage URL', () => {
    expect(sitemap).toContain('<?xml');
    expect(sitemap).toContain('<urlset');
    expect(sitemap).toContain('https://bazha.github.io/archmentor/');
  });
});
```

- [ ] **Step 4: Add a README Search Console note**

In `README.md`, after the "Development" or "Status" section, add:

```markdown
## Search / SEO

The app ships English metadata, Open Graph/Twitter tags, JSON-LD, a crawlable landing hero,
and a sitemap at `/archmentor/sitemap.xml`. To get it indexed by Google, submit the site to
[Google Search Console](https://search.google.com/search-console) and add the sitemap URL
`https://bazha.github.io/archmentor/sitemap.xml` there (a `robots.txt` can't be used because
GitHub Pages only honors one at the host root, which this project subpath doesn't control).
```

- [ ] **Step 5: Typecheck, full suite, build**

Run: `npx tsc --noEmit && npm run test && npm run build`
Expected: all PASS (sitemap test green). Confirm `public/og-image.png` and `public/sitemap.xml` are copied into `dist/`:

Run: `ls dist/og-image.png dist/sitemap.xml`
Expected: both exist.

- [ ] **Step 6: Commit**

```bash
git add public/sitemap.xml public/og-image.png src/seo.test.ts README.md
git commit -m "feat(seo): sitemap, OG image, and Search Console note"
```

---

## Self-Review

**Spec coverage:**
- English head metadata (title, description, canonical, theme-color, OG, Twitter) → Task 1. ✓
- JSON-LD (SoftwareApplication + WebSite, valid) → Task 1. ✓
- Static crawlable hero in `#root`, inline-styled, React replaces on mount → Task 1. ✓
- `lang="en"` → Task 1. ✓
- `public/sitemap.xml` (homepage) → Task 2. ✓
- `public/og-image.png` 1200×630 generated → Task 2. ✓
- No robots.txt (documented why) → README note, Task 2. ✓
- Search Console = user action → README note. ✓
- Tests (index.html meta + sitemap) → Tasks 1–2. ✓
- Build-output check (dist has meta + image + sitemap) → Task 1 Step 4, Task 2 Step 5. ✓

**Placeholder scan:** none — full index.html, sitemap, OG template, and README text are given verbatim.

**Type consistency:** No TS interfaces cross tasks (static assets + a file-reading test). `og:image` URL in Task 1 (`…/og-image.png`) matches the file produced in Task 2 (`public/og-image.png`, served at `/archmentor/og-image.png`). The SEO test file is created in Task 1 and extended in Task 2 (sitemap block appended). The hero strings asserted by the test ("Learn software architecture", "GoF design patterns") are present verbatim in the Task 1 index.html.
