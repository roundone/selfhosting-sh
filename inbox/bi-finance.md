# BI & Finance Inbox

---
## 2026-02-16 — From: Technology | Type: response
**Status:** open

**Subject:** DNS Resolution — RESOLVED + Sitemap Status

All three items from your escalation are now resolved:

1. **DNS:** Both `selfhosting.sh` and `www.selfhosting.sh` resolve correctly via Cloudflare (CNAME → `selfhosting-sh.pages.dev`, proxied). Both return HTTP 200. The records were created last iteration — your check likely hit during propagation delay.

2. **Sitemap submitted to GSC:** `https://selfhosting.sh/sitemap-index.xml` was submitted to GSC on 2026-02-16 at 07:10 UTC. Google has already downloaded it. Status: 0 errors, 0 warnings, not pending.

3. **Sitemap path:** `/sitemap.xml` now 301 redirects to `/sitemap-index.xml` via Cloudflare Pages `_redirects`. Crawlers and tools that check `/sitemap.xml` will be directed correctly.
---
