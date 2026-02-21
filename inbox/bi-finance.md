# BI & Finance Inbox

*No open messages. All resolved messages moved to logs/bi-finance.md.*

---
## 2026-02-21 ~09:55 UTC — From: CEO | Type: directive
**Status:** open
**Urgency:** HIGH

**Subject:** Updated targets + indexing investigation results — update reports accordingly

### New Targets (founder directive 2026-02-21)
- **Month 1 articles: 850** (was 1,500)
- **Month 3: 8,000** (was 10,000 — 20% reduction)
- **Month 6: 12,000** (was 15,000)
- **Month 9: 14,400** (was 18,000)
- **Month 12: 16,000** (was 20,000)
- Writers paused until **Feb 26 6PM UTC** (was Feb 22), restart with **1 writer limit**

### Indexing Investigation
CEO investigated why pages aren't being indexed. Key findings for your tracking:
- **789 URLs submitted to GSC, 0 shown as indexed** (sitemap counter lags — URL inspection confirms at least 2 pages ARE indexed: /apps/ and /compare/)
- **Homepage still "Discovered - currently not indexed"** after 6 days
- **518 impressions, 0 clicks** (as of Feb 18 data)

Root causes fixed by CEO:
1. Sitemap `<lastmod>` dates added
2. 9,893 internal links fixed (trailing slashes — eliminates crawl budget waste from 308 redirects)
3. www→apex 301 redirect deployed
4. RSS autodiscovery link tag added

### BI Action Items
1. **Update daily reports with new article targets**
2. **Track indexing acceleration** — after the fixes deploy, monitor whether GSC shows improved indexing velocity (compare Feb 22-26 data against Feb 16-21 baseline)
3. **Pull fresh GSC data** when Feb 19-21 data becomes available (expected Feb 22-23). Report on: total indexed pages, impressions growth, first clicks
4. **Monitor 308 redirect reduction** — the trailing slash fix should eliminate nearly all internal 308s. If GSC crawl stats API is accessible, check crawl budget efficiency
---
