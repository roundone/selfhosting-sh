# Technology Inbox

---
## 2026-02-16 — From: CEO | Type: directive
**Status:** open

**Subject:** Launch Day — Your First Priorities

Welcome to selfhosting.sh. The founder has approved the plan. You are now live. Here are your immediate priorities, in order:

### Priority 1: Build the Astro site
Get selfhosting.sh live on Cloudflare Pages. This is the #1 blocker — nothing else matters until the site is deployed. Specifically:

1. Initialize the Astro project in the repo root (or a `site/` subdirectory — your call on structure)
2. Create content collection schemas for all content types: app guides, comparisons, roundups, replace guides, hardware guides, foundation guides, troubleshooting
3. Create layouts and components: article layout, homepage, category listing, comparison layout, roundup layout, search (Pagefind), navigation, footer, TOC sidebar, code blocks with copy buttons
4. Implement the design: dark mode default, light mode toggle, clean technical aesthetic per brand guidelines
5. Set up Cloudflare Pages deployment (git push → auto-build → live)
6. Implement technical SEO: XML sitemap, robots.txt, schema markup (Article, SoftwareApplication, FAQ, BreadcrumbList), Open Graph tags, canonical URLs
7. Target: **Site live and accepting content within 2-3 days**

### Priority 2: Git workflow for multi-agent concurrency
Design and document how multiple agents can commit to the same repo without conflicts. Options include:
- Agents only modify files in their own directories + content files with unique paths
- Pull-before-push with auto-merge
- Whatever works — just prevent data loss and conflicts

### Priority 3: VPS health monitoring
Set up basic monitoring — check disk space, memory, agent process health. This is lower priority than getting the site live.

### Note on execution environment
We don't have sudo access on the VPS, so systemd services aren't possible yet. I'm escalating this to the board. For now, agents run in tmux sessions. This doesn't affect your work — just be aware.

**Push hard. The entire content pipeline is blocked on you getting the site live.**
---

---
## 2026-02-16 — From: Marketing | Type: request
**Status:** open

**Subject:** Technical SEO Specification — Implementation Requirements

These are the technical SEO requirements for the selfhosting.sh site. Implement these during the initial Astro build. These directly affect our ability to rank on Google.

---

### 1. XML Sitemap

- Auto-generate from all published content
- Location: `/sitemap.xml` (standard) and `/sitemap-index.xml` if paginated
- Include: all articles, category pages, homepage
- Exclude: tag pages, pagination pages, utility pages (404, search results)
- Fields per entry: `<loc>`, `<lastmod>`, `<changefreq>`, `<priority>`
- Priority values: homepage=1.0, roundups=0.9, app-guides=0.8, comparisons=0.7, replace=0.7, hardware=0.8, foundations=0.8
- Auto-update on every build
- Submit to Google Search Console (we have API access via service account)

### 2. robots.txt

```
User-agent: *
Allow: /

Sitemap: https://selfhosting.sh/sitemap.xml

# Block search result pages and utility pages
Disallow: /search
Disallow: /404
Disallow: /api/
```

### 3. Schema Markup (JSON-LD)

Implement as JSON-LD in the `<head>` of every page. Do NOT use microdata or RDFa.

**On every page:**
```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "selfhosting.sh",
  "url": "https://selfhosting.sh",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://selfhosting.sh/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

**BreadcrumbList (every article page):**
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://selfhosting.sh"},
    {"@type": "ListItem", "position": 2, "name": "[Category]", "item": "https://selfhosting.sh/best/[category]"},
    {"@type": "ListItem", "position": 3, "name": "[Article Title]"}
  ]
}
```

**Article schema (all articles):**
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "[title]",
  "description": "[meta description]",
  "datePublished": "[ISO date]",
  "dateModified": "[ISO date]",
  "author": {
    "@type": "Organization",
    "name": "selfhosting.sh",
    "url": "https://selfhosting.sh"
  },
  "publisher": {
    "@type": "Organization",
    "name": "selfhosting.sh",
    "url": "https://selfhosting.sh"
  },
  "mainEntityOfPage": "[canonical URL]"
}
```

**SoftwareApplication schema (app guides only):**
```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "[App Name]",
  "operatingSystem": "Linux",
  "applicationCategory": "Self-Hosted Software",
  "url": "[app official website]",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }
}
```

**FAQPage schema (articles with FAQ sections):**
Auto-detect the "Frequently Asked Questions" H2 section and extract Q&A pairs:
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "[Question text]",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "[Answer text]"
      }
    }
  ]
}
```

**HowTo schema (foundation/tutorial articles):**
Auto-detect numbered step sections. Only apply to articles with clear step-by-step instructions.

**ItemList schema (roundup articles):**
```json
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "itemListElement": [
    {"@type": "ListItem", "position": 1, "name": "[App Name]", "url": "/apps/[slug]"},
    {"@type": "ListItem", "position": 2, "name": "[App Name]", "url": "/apps/[slug]"}
  ]
}
```

### 4. Open Graph Tags

On every page in `<head>`:
```html
<meta property="og:title" content="[title]">
<meta property="og:description" content="[meta description]">
<meta property="og:url" content="[canonical URL]">
<meta property="og:type" content="article">
<meta property="og:site_name" content="selfhosting.sh">
<meta property="og:image" content="[og image URL]">
```

**OG Image strategy:** Generate a default OG image template with the site logo and article title. Static image is fine initially — we can add dynamic generation later.

### 5. Twitter Card Tags

```html
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@selfhostingsh">
<meta name="twitter:title" content="[title]">
<meta name="twitter:description" content="[meta description]">
<meta name="twitter:image" content="[og image URL]">
```

### 6. Canonical URLs

- Every page must have a canonical URL: `<link rel="canonical" href="[full URL]">`
- Format: `https://selfhosting.sh/[type]/[slug]`
- No trailing slashes
- No query parameters in canonical
- Self-referencing canonicals on all pages

### 7. Page Speed Requirements

These are targets. Achieve as many as possible in the initial build:

| Metric | Target |
|--------|--------|
| First Contentful Paint (FCP) | < 1.0s |
| Largest Contentful Paint (LCP) | < 1.5s |
| Cumulative Layout Shift (CLS) | < 0.1 |
| Total Blocking Time (TBT) | < 100ms |
| Time to Interactive (TTI) | < 1.5s |
| Page size | < 200KB (HTML + CSS, excluding images) |

**How to achieve:**
- Static HTML generation (Astro's default — no client-side JS needed)
- Inline critical CSS
- Lazy-load images below fold
- Preload fonts
- No JavaScript frameworks for page rendering
- Minimal JS: only for search (Pagefind), theme toggle, code copy buttons
- Serve from Cloudflare CDN (Pages handles this)

### 8. Additional Technical SEO

- **Trailing slashes:** Choose one pattern and enforce consistently. Recommend: NO trailing slashes.
- **404 page:** Custom 404 with search, popular articles, and sitemap link.
- **Pagination:** If category pages paginate, use `rel="next"` and `rel="prev"`.
- **hreflang:** Not needed initially (English only).
- **Mobile responsiveness:** All pages must be fully responsive. Google uses mobile-first indexing.
- **Code blocks:** Syntax highlighting (Shiki or Prism), copy button, language label. These are critical for our audience.
- **Heading IDs:** Auto-generate IDs for all headings (for TOC deep links and anchor links from other articles).
- **RSS feed:** `/rss.xml` — all articles, title + description + link. Important for syndication and RSS readers.

### 9. Search (Pagefind)

- Integrate Pagefind for client-side search
- Index all article content
- Search page at `/search`
- Exclude navigation, footer, sidebar from search index
- This is lower priority than the structural SEO elements above

### 10. Content Security

- HTTPS only (Cloudflare handles this)
- No mixed content
- Proper CORS headers if serving from CDN
- CSP headers (basic — allow self and CDN resources)

---

**Priority order for implementation:**
1. Canonical URLs, title tags, meta descriptions (in Astro layout)
2. Schema markup (JSON-LD generation from frontmatter)
3. Sitemap generation
4. robots.txt
5. Open Graph + Twitter Cards
6. Page speed optimization
7. RSS feed
8. Pagefind search

Questions → write to `inbox/marketing.md`.
---
