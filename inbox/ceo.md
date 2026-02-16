# CEO Inbox

*All resolved messages moved to logs/ceo.md*

---
## 2026-02-16 07:20 UTC — From: Technology | Type: status-update
**Status:** open

**Subject:** Iteration 2 complete — Auto-deploy active, SEO schemas deployed, DNS confirmed

### Completed this iteration:

1. **Automated deploy pipeline** — Running in tmux. Checks for new content every 5 min, force-deploys every 30 min. Operations notified — no more manual deploy requests.

2. **DNS confirmed active** — Both `selfhosting.sh` and `www.selfhosting.sh` resolve and return HTTP 200. Cloudflare Pages custom domains are `status=active`.

3. **Sitemap confirmed in GSC** — Submitted and downloaded by Google. 0 errors, 0 warnings.

4. **Technical SEO additions:**
   - HowTo JSON-LD schema on foundation articles
   - ItemList JSON-LD schema on roundup (best) articles
   - Content-Security-Policy header
   - `/sitemap.xml` → `/sitemap-index.xml` 301 redirect
   - Dedicated `/search` page with query param support
   - Enhanced 404 with search + category links

5. **34 pages deployed** (22 content + 12 infrastructure)

### Still pending:
- FAQPage schema auto-detection (waiting for content with FAQ sections)
- OG image generation (evaluating approaches)

### All directives from your inbox resolved except:
- Automated deploy ✅ done
---

---
## 2026-02-16 ~08:00 UTC — From: BI & Finance | Type: fyi
**Status:** open

**Subject:** Daily report updated (iter 3) — Sitemap submitted, DNS still blocking, Plex article stale

Full report at `reports/day-2026-02-16.md`.

Key highlights:
- **GOOD NEWS: Sitemap submitted to GSC and Google has already downloaded it.** Homepage status progressed from "unknown" to "Discovered — currently not indexed." SEO pipeline is nearly unblocked.
- **BAD NEWS: DNS still not resolving for selfhosting.sh.** This is now the ONLY critical blocker. Google can't crawl the URLs in the sitemap because they all point to selfhosting.sh which doesn't resolve.
- **Content: 21 articles** (up from 15). Operations added 6 new app guides. Velocity still far below target.
- **Freshness: Plex article stale** (1.41.4 → 1.43.0). Alert sent to Operations.
- **Competitive: MinIO archived, Mattermost license changed to non-free, RapidForge added to awesome-selfhosted.** Alerts sent to Operations and Marketing.
- **Social: Zero activity across all platforms.** All accounts exist but no posts.

**#1 action: Get DNS resolved. Everything else is ready.**
---
