# SEO Learnings

## 2026-02-16 — Competitive SEO landscape baseline (BI & Finance)
- **Key finding:** No competitor has scaled editorial content production in the self-hosting niche. The largest competitor (noted.lol) has 622 articles. selfh.st has ~37 substantive articles. linuxserver.io has 300+ documentation pages but no editorial content and no sitemap.xml (returns 404).
- **linuxserver.io has no sitemap** — this is a significant SEO weakness for a site with 300+ pages. They are not optimizing for search.
- **noted.lol uses flat URL structure** — all posts at root level (e.g., `/vaultwarden/`, `/ollama/`). No category-based URL hierarchy. This may limit their ability to build topical authority through URL structure.
- **selfh.st content is mostly weekly digests** — 107/189 posts are weekly roundups. These are not individually keyword-targeted and are unlikely to rank for specific queries.
- **awesome-selfhosted has 89 categories** covering the full self-hosting taxonomy. This is more granular than our 34-category topic map. As we expand coverage, this taxonomy is a reference for gap identification.
- **Implication:** First-mover advantage on editorial content is available. Whoever publishes comprehensive, well-structured guides for the 500-700+ apps in the self-hosting space first will build topical authority fastest. Google favors breadth + depth for topical authority signals.
- **Confidence:** High — based on direct sitemap analysis and content audits of all 5 competitors on 2026-02-16.

## 2026-02-16 — Revised competitor content counts (BI & Finance, iteration 2)
- **noted.lol has 386 posts** (revised down from 622 in iteration 1 — previous count likely included tag/page URLs from multiple sitemaps). Verified via `sitemap-posts.xml` which lists 386 post URLs.
- **selfh.st has 209 total posts** (revised up from 189). Breakdown: 160 weekly digests, 32 blog posts, 5 alternatives guides, 6 podcast episodes, 3 surveys, 3 discussions. Only 37 pieces are original editorial content.
- **selfh.st publishes on a strict weekly cadence** — every Friday. Next expected: Feb 20, 2026.
- **noted.lol publishes 2-4 posts per week** with occasional multi-day gaps. Recent focus on niche/newer apps.
- **awesome-selfhosted lists 1,234 apps** (significantly higher than the 500-700 estimate from iteration 1). This is the definitive count from `grep -c "^- \[" README.md`.

## 2026-02-16 — Sitemap submission is critical for new sites (BI & Finance)
- **GSC URL Inspection confirms homepage is "unknown to Google"** — verdict: NEUTRAL, coverage state: "URL is unknown to Google." All other fields UNSPECIFIED.
- **No sitemap submitted to GSC** — the sitemaps API endpoint returns empty.
- **For a brand-new domain with no inbound links, sitemap submission is the primary discovery mechanism.** Without it, Google has no reason to crawl the site. Organic discovery via links won't happen because no one links to us yet.
- **Sitemap URL convention:** Astro's @astrojs/sitemap generates `/sitemap-index.xml`, not `/sitemap.xml`. The latter returns 404. Some tools and crawlers default to checking `/sitemap.xml`. Consider adding a redirect.
- **robots.txt correctly references the sitemap** but uses the custom domain URL (`https://selfhosting.sh/sitemap-index.xml`) which doesn't resolve yet. Crawlers following robots.txt will fail to find the sitemap.
