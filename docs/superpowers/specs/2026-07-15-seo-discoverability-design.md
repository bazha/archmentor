# SEO / discoverability — дизайн

**Дата:** 2026-07-15
**Статус:** дизайн утверждён, готов к плану

## Цель

Сделать ArchMentor находимым в поиске и дающим нормальный сниппет/превью: богатые
метаданные, статичный (пре-рендернутый) описательный лендинг для краулеров, структурированные
данные, sitemap, OG-картинка. SEO-текст — **английский**. Приложение — client-rendered SPA на
GitHub Pages project-site `https://bazha.github.io/archmentor/`.

## Реальные ограничения (GitHub Pages project-site)

- **`robots.txt` учитывается только в корне хоста** (`bazha.github.io/robots.txt`), который этот
  репозиторий не контролирует. `robots.txt` под `/archmentor/` игнорируется → **не делаем его**
  (краулеры по умолчанию считают всё разрешённым).
- **`sitemap.xml`** может лежать под `/archmentor/` и работать, но не автообнаруживается (нет
  robots) — **подаётся вручную в Google Search Console**.
- **Глубокие SPA-роуты 404 при прямом заходе** на GitHub Pages (нет history-fallback) →
  пре-рендер и мета — **только для главной**; per-route пре-рендер вне области.
- **Фактическое появление в выдаче требует Search Console** (заявка сайта + sitemap) — это
  ручной шаг пользователя; код лишь делает сайт готовым и привлекательным для индексации.

## Область (scope)

- Метаданные в `index.html` (English): title, description, canonical, theme-color, Open
  Graph, Twitter card, JSON-LD.
- Статичный английский лендинг-хиро внутри `#root` (виден краулерам без JS; React заменяет
  при монтировании).
- `public/og-image.png` (1200×630) — брендированная карточка.
- `public/sitemap.xml` (только главная).
- Тест-гард `src/seo.test.ts`.

Вне области: `robots.txt` (не работает на subpath); полноценный SSR (`react-dom/server`) —
риск с `window`/`localStorage` и Dashboard не является описательным контентом; per-route
пре-рендер; hreflang (нет отдельных URL на язык); Search Console verification-мета (добавим,
только если пользователь даст токен — иначе его шаг).

## Архитектура по единицам

### 1. `index.html` — голова (английский, абсолютные URL)

- `<html lang="en">` (было `ru`). Рантайм-i18n отдельный (пользователь переключает язык;
  атрибут `lang` приложение и так не обновляет — это pre-existing).
- `<title>`: `ArchMentor — Learn Software Architecture: SOLID, Design Patterns & System Design`.
- `<meta name="description" content="…">` — ~150 символов, английский: чему учит, для кого,
  что бесплатно/двуязычно.
- `<link rel="canonical" href="https://bazha.github.io/archmentor/">`.
- `<meta name="theme-color">` × 2 через `media` (light `#FCFCFD` / dark `#0D0F21`).
- **Open Graph:** `og:type=website`, `og:site_name=ArchMentor`, `og:title`, `og:description`,
  `og:url=https://bazha.github.io/archmentor/`, `og:image=https://bazha.github.io/archmentor/og-image.png`,
  `og:image:width=1200`, `og:image:height=630`, `og:locale=en_US`.
- **Twitter:** `twitter:card=summary_large_image`, `twitter:title`, `twitter:description`,
  `twitter:image` (тот же абсолютный URL).
- **JSON-LD** `<script type="application/ld+json">`: массив из двух объектов —
  `SoftwareApplication` (`applicationCategory: "EducationalApplication"`, `operatingSystem:
  "Web"`, `offers` price 0 / USD, `inLanguage: ["en","ru"]`, name/url/description) и `WebSite`
  (name/url/description/inLanguage). Валидный по schema.org.
- Сохранить существующий favicon и анти-FOUC theme-скрипт.

### 2. Статичный лендинг-хиро в `#root`

- Прямо в `index.html` внутри `<div id="root">…</div>` — статичный английский блок с
  **инлайновыми стилями** (не зависят от загрузки CSS-бандла): лого/название, тэглайн, абзац
  «что это», список того что учит (SOLID · 23 GoF patterns · architectural styles ·
  cross-cutting trade-offs), перечисление режимов (Course, Learn, spaced repetition, Quiz,
  Interview, Compare, Map, Diagram Builder…), факты «42 concepts, ~119 questions, bilingual,
  free». Стилизован как чистый сплэш на тёмном фоне (совпадает с theme-скриптом).
- `createRoot(#root).render(...)` заменяет дочерние узлы при монтировании → пользователи видят
  максимум короткий сплэш, краулеры (без JS) видят полный описательный HTML. Никакого SSR/
  гидратации (используется `createRoot`, не `hydrateRoot`).
- Tailwind не требуется (инлайн-стили); блок самодостаточен до загрузки бандла.

### 3. `public/og-image.png` (1200×630)

- Брендированная карточка (название + тэглайн + акцент n8n-coral на тёмном фоне). Генерируется
  один раз при реализации: HTML-шаблон → скриншот headless Chrome в 1200×630 → `public/og-image.png`,
  коммитится. Отдаётся по `/archmentor/og-image.png`; в мете указывается абсолютный URL.

### 4. `public/sitemap.xml`

- Один `<url>`: `https://bazha.github.io/archmentor/` с `<lastmod>` (дата сборки/релиза как
  статичная строка) и `<changefreq>monthly</changefreq>`. Отдаётся по `/archmentor/sitemap.xml`.
- Подать вручную в Search Console (в комментарии/README отметить URL сайтмапа).

### 5. Search Console (шаг пользователя)

- Если пользователь даёт `google-site-verification` токен — добавить `<meta name="google-site-verification">`.
  Иначе не добавляем; пользователь верифицирует владение (DNS/HTML-файл/Analytics) и подаёт
  сайт + `/archmentor/sitemap.xml` в Search Console. Зафиксировать это как обязательный ручной
  шаг в README/спеке.

### 6. Тесты — `src/seo.test.ts`

- Читает `index.html` (`?raw` или fs) и проверяет наличие: `lang="en"`, `<meta name="description">`
  (непустой), `rel="canonical"`, `og:title`, `og:image`, `twitter:card`, `application/ld+json` с
  валидным JSON, статичного хиро-текста (напр. подстрока «Learn Software Architecture» или
  ключевое слово из лендинга).
- Читает `public/sitemap.xml`: валидный XML, содержит `https://bazha.github.io/archmentor/`.
- Гард от регрессий (как `contrast.test.ts`).

## Рассмотрено и отклонено

- **`robots.txt`** — не учитывается на project-subpath; вводит в заблуждение. Отклонено.
- **Полноценный SSR (`react-dom/server`)** — риск с `window`/`localStorage`/theme при рендере,
  и Dashboard (главная приложения) — не описательный SEO-контент; статичный хиро лучше.
- **Per-route пре-рендер / hreflang** — GH Pages 404 на глубоких роутах, нет отдельных URL на
  язык; низкая отдача.

## Критерии готовности

- В `index.html`: English title/description, canonical, theme-color, OG + Twitter, JSON-LD
  (валидный), `lang="en"`; статичный английский хиро в `#root`, который React заменяет при
  монтировании.
- `public/og-image.png` (1200×630) и `public/sitemap.xml` (главная) существуют и отдаются.
- `seo.test.ts` зелёный; все существующие тесты зелёные; tsc и build чистые; в собранном
  `dist/index.html` метаданные и хиро присутствуют (проверить сборкой).
- README: заметка про ручную подачу в Google Search Console + URL сайтмапа.
