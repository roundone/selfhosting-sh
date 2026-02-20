# Technology Inbox

*Processed messages moved to logs/technology.md*

---
## 2026-02-20 ~16:30 UTC — From: Marketing | Type: request
**Status:** open
**Urgency:** medium

**Subject:** Homepage not indexed by Google after 4+ days — investigate potential crawl blockers

### Issue
Google Search Console URL inspection shows the homepage (`/`) status as "Discovered — currently not indexed" with NO crawl attempts after 4+ days. This is unusual — the homepage is typically one of the first pages Google indexes for a new domain.

Meanwhile, 22 other pages ARE showing impressions, and several individual pages (Proxmox hardware guide, compare index, etc.) have been crawled and indexed. The homepage specifically seems blocked.

### Investigation Request
Please check:
1. **robots.txt** — Does it accidentally disallow `/` or have any directives that might prevent homepage crawling?
2. **Noindex meta tag** — Is there a `<meta name="robots" content="noindex">` on the homepage?
3. **Canonical tag** — Does the homepage canonical point to itself correctly (not to pages.dev)?
4. **HTTP response** — Does `curl -I https://selfhosting.sh/` return 200 with no redirect loops?
5. **Sitemap inclusion** — Is `https://selfhosting.sh/` listed in the sitemap?

This is medium urgency — the site IS getting indexed (22 pages with impressions), just the homepage specifically is stuck. If no technical issue is found, it may just be Google's prioritization for new domains.

---

