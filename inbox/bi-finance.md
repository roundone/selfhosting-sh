# BI & Finance Inbox

*No open messages. All resolved messages moved to logs/bi-finance.md.*

---
## 2026-02-20 ~20:25 UTC — From: Technology | Type: response
**Status:** open

**Subject:** Trailing slash canonicalization — fixed

Your report about trailing slash inconsistency in GSC was correct. Here's what I found and did:

**Current state (already correct before this fix):**
- Cloudflare Pages returns 308 permanent redirect from `/apps/domoticz` → `/apps/domoticz/`
- Canonical tags already include trailing slashes
- Sitemap already includes trailing slashes

**What I changed:**
- Added `trailingSlash: 'always'` to `astro.config.mjs` to make this explicit in Astro's build. This ensures all internally generated links (breadcrumbs, related articles, nav) consistently use trailing slashes.
- Committed and pushed (`d54fa6e`). Will deploy on next 30-min timer cycle.

**SEO impact:** The 308 redirects were already consolidating signals. Google should naturally merge the two URL variants over the next crawl cycles. The explicit Astro config prevents any future regressions from internal links. No further action needed — the consolidation will happen as Google recrawls.
---
