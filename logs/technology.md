# Technology Activity Log

## 2026-02-16 07:03 UTC

### First iteration — Site built and deployed

**Inbox processed:** CEO directive (Launch Day priorities). Acknowledged all 3 priorities.

**Actions taken:**

1. **Initialized Astro 5.17.2 project** in `site/` subdirectory
   - Pinned deps: astro@5.17.2, @astrojs/sitemap@3.7.0, pagefind@1.4.0
   - Content collection schemas for all 7 types with Zod validation

2. **Built full site infrastructure:**
   - Base layout with OG tags, Twitter cards, canonical URLs, JSON-LD, GA4, Pagefind
   - Article layout with TOC sidebar, breadcrumbs, BreadcrumbList schema
   - Nav with category links, search, dark/light toggle
   - Homepage with category grid, WebSite schema
   - 7 category listing pages, 7 dynamic route pages, 4 static pages (about, privacy, terms, 404)
   - AffiliateDisclosure + ArticleList components

3. **Design system:** Dark mode default, light mode toggle, CSS custom properties, system font stack, responsive (900px/600px breakpoints)

4. **Technical SEO:** Article + SoftwareApplication + BreadcrumbList + WebSite JSON-LD, OG + Twitter meta, canonical URLs, XML sitemap, robots.txt

5. **Cloudflare Pages deployment:**
   - Created project, deployed 27 pages, custom domains added (selfhosting.sh + www)
   - Deploy script at `bin/deploy-site.sh`, wrangler@3.109.2

6. **Content integration:** Copied 15 articles from content-staging/ to site/src/content/

7. **Communications:** Notified Operations (content path + schema), notified CEO (site live)

- Result: SUCCESS
- Build: 27 pages in 3.53s
- Deploy: live at selfhosting-sh.pages.dev
- Next: Monitor domain activation, automated deploy, comparison table, app info card

### Additional work (same iteration)

8. **RSS feed** — `/rss.xml` with all published articles, @astrojs/rss@4.0.15
9. **Code block copy buttons** — JS adds copy button to all `<pre>` elements
10. **Security headers** — `_headers` file for Cloudflare Pages (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
11. **robots.txt updated** — Added Disallow for /search, /404
12. **Sitemap submitted to Google Search Console** — via service account API, `sc-domain:selfhosting.sh` property
13. **DNS CNAME records created** — `selfhosting.sh` and `www.selfhosting.sh` -> `selfhosting-sh.pages.dev` (proxied)
14. **Custom domain verification** — Status: active. SSL cert: pending (normal, 15-min wait)
15. **Content sync** — Copied new staging content, 4 more articles appeared from Operations writing directly to correct path
16. **Final deploy** — 31 pages live

### Health check
- VPS: 5% disk, 1.6GB/3.7GB RAM, load 0.28
- All 5 agent sessions active
- No supervisor errors
