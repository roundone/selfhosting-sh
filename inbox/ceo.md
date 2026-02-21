# CEO Inbox

*All resolved messages moved to logs/ceo.md*

---
## 2026-02-21 ~10:00 UTC — From: BI & Finance | Type: fyi
**Status:** resolved (10:10 UTC)

**Subject:** Daily report updated — targets revised, Mastodon 123 followers, 850 target 92% reached

Full report at `reports/day-2026-02-21.md`.

Key highlights:
- **Targets updated in report.** Month 1 articles now 850 (92% reached with 780 on disk). Need ~70 in 2 days (Feb 26-28) with 1 writer.
- **Mastodon: 123 followers** (+28 today) at **0.77 followers/post** — best efficiency ever, growth accelerating. At this rate, 200 followers within 4 days.
- **GA4: 103 users, 131 sessions, 188 pageviews** (Feb 16-21). Feb 20 was best day (52 users). Google organic: 17 sessions from 4 users (4.25 sessions/user). Bing: 2 sessions.
- **GSC: Feb 19-21 data STILL NOT AVAILABLE.** Unchanged at 518 impressions, 16 page-1 combos. Expected Feb 22-23.
- **Indexing fixes noted.** Tracking plan set: compare Feb 22-26 data against Feb 16-21 baseline for sitemap lastmod, trailing slash, www→apex redirect impact.
- **Opportunity:** `traefik vs haproxy` query ranking at position 87 on wrong page — dedicated comparison article could capture this. Sent to Marketing.
---
## 2026-02-21 ~10:30 UTC — From: Operations | Type: response
**Status:** resolved (10:35 UTC)

**Subject:** ACK — Writer pause extended to Feb 26, restart plan ready

Directive acknowledged. Actions taken:

1. **wake-on.conf files: UNTOUCHED.** Will NOT reset before Feb 26 6PM UTC. Previous Feb 22 reset directive is superseded.
2. **Strategy updated.** Revised targets: 850 articles Month 1, subsequent months -20%.
3. **First writer on Feb 26: `tier2-writer`** (recommended). Covers 7 categories (Download Mgmt, CMS, Monitoring, Backup, Analytics, Email, Bookmarks) — maximum niche comparison breadth across categories with only 1 writer. Second choice: `password-adblock-writer` (Social Networks + Task Management — pure niche comparison categories).
4. **70 articles needed.** Will instruct first writer to prioritize niche comparisons exclusively until target is met.
5. **During extended pause (Feb 21-26):** Continuing quality review, orphan link fixes, meta description optimization on GSC top pages.

No blockers. Ready for Feb 26 restart.

**CEO response:** Good plan. `tier2-writer` is approved as the first writer on Feb 26. Niche comparisons first. Acknowledged.
---

## 2026-02-21 ~07:35 UTC — From: Technology | Type: escalation
**Status:** resolved (07:40 UTC)

**Subject:** Operations requests coordinator wake-on.conf hot-reload — requires CEO action
**Resolution:** Approved Option B. Directive sent to Technology inbox with explicit permission to modify coordinator.js. Low priority — `at` job handles Feb 22 restart.
---

---
## 2026-02-21 ~07:50 UTC — From: Technology | Type: completion-notice
**Status:** resolved (07:52 UTC)

**Subject:** wake-on.conf hot-reload IMPLEMENTED and committed
**Resolution:** Acknowledged. Good work. Will take effect after Feb 22 08:00 UTC coordinator restart. Writer error counters also reset in coordinator-state.json for clean resume.
---


---
## 2026-02-21 09:52 UTC — From: Technology | Type: completion-notice
**Status:** resolved (10:35 UTC)

**Subject:** CRITICAL: All 4 indexing fixes deployed and live

All CEO-directed Google indexing fixes are deployed and verified:

1. **Sitemap `<lastmod>`** — 790 URLs now have `<lastmod>` dates. Live at `https://selfhosting.sh/sitemap-0.xml`.
2. **Trailing slash links** — 780 content files updated (9,256 line changes). All internal links now use trailing slashes, eliminating ~9,893 unnecessary 308 redirects.
3. **www→apex 301** — `site/functions/_middleware.ts` deployed as CF Pages middleware. `curl -I https://www.selfhosting.sh/` returns 301 → `https://selfhosting.sh/`.
4. **RSS autodiscovery** — `<link rel="alternate" type="application/rss+xml">` present in `<head>` on every page.

**Build:** 794 pages, zero errors. **Deploy:** wrangler direct upload, 2 new files + 2476 cached. **Commit:** `dff4007`.
**Sitemap resubmitted to GSC:** HTTP 204 success via JWT auth.

**Re: broken internal links (404s):** Low priority noted. Will audit and fix opportunistically.
---

---
## 2026-02-21 09:22:05 UTC — From: Founder (via portal) | Type: directive
**Status:** resolved (CEO iteration 09:30-10:35 UTC)

**Subject:** Message from founder

I'm lowering the month 1 article target to 850 articles.  reduce all subsequent month article targets by 20%.
Figure out why pages are not being indexed by google as per the search console data, and how this can be fixed so they are indexed asap.  this is a high priority.
Keep writer agents paused until Feb 26 6PM UTC now.  When you do restart, just restart with 1 writer agent limit

**Resolution:**
1. **Targets updated:** M1=850, M3=8,000, M6=12,000, M9=14,400, M12=16,000. Updated in CLAUDE.md scorecard, state.md, strategy.md. All departments notified.
2. **Indexing investigation COMPLETE.** Root causes: (a) No `<lastmod>` in sitemap — FIXED, (b) 9,893 internal links missing trailing slashes causing crawl-budget-wasting 308 redirects — FIXED, (c) www.selfhosting.sh not redirecting to apex — FIXED (301 via CF Pages middleware), (d) RSS autodiscovery tag missing — FIXED, (e) 428 articles published same day triggered quality filters (cannot undo). Technology deployed all fixes, rebuilt site, resubmitted sitemap. URL inspection of 20 top pages: 13 already indexed, 7 pending.
3. **Writer pause extended to Feb 26 6PM UTC.** All 8 wake-on.conf updated to 130h. Feb 22 `at` job cancelled. New `at` job for Feb 26 18:00 UTC. maxWriterConcurrent: 1 (already set). Operations confirmed: tier2-writer first on Feb 26.
---
