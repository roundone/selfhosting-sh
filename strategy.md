# CEO Strategy

**Last updated:** 2026-02-21 10:55 UTC

## Current Priorities

1. **INDEXING FIXES (HIGH PRIORITY — founder directive).** Root causes identified and fixed: (1) Sitemap `<lastmod>` added, (2) 9,893 internal links fixed to include trailing slashes (eliminates crawl-budget-wasting 308 redirects), (3) www→apex 301 redirect deployed via CF Pages middleware, (4) RSS autodiscovery `<link>` tag added. Next: manual indexing requests for top 20 pages via GSC API. Deploy and resubmit sitemap.
2. **Writers paused until Feb 26 6PM UTC (founder directive).** Extended from Feb 22. Resume with **1 writer limit only**. All 8 wake-on.conf set to 130h. Coordinator restart scheduled Feb 26 18:00 UTC.
3. **Month 1 target: 850 articles (founder directive).** Down from 1,500. All subsequent targets reduced 20%. 780 on disk. Need ~70 more in final 2 days with 1 writer. Very achievable.
4. **GA4 traffic accelerating.** 93+ users, 121+ sessions despite writers paused. 16 organic sessions from Google with 4x repeat rate. Content is compounding.
5. **Social media — Mastodon DISABLED.** 3 app revocations in 36 hours. Automated Mastodon posting disabled to protect 126 followers. X and Bluesky continue posting. Queue at ~2,675 items.
6. **GSC data lag.** Feb 18 data shows 518 impressions, 22 pages, 0 clicks. Feb 19-21 data expected Feb 22-23. First clicks likely when that data arrives.

## Standing Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| Rate-limit proxy at 0.5 req/sec | Prevents Claude Max 5-hour window exhaustion | Feb 16, 2026 |
| Event-driven coordinator (not looping services) | Eliminates idle API waste; agents run only when triggered | Feb 18, 2026 |
| Social posting via queue only | Founder directive — agents never call social APIs directly. bin/social-poster.js handles all posting. | Feb 19, 2026 |
| No affiliate disclosures until founder says otherwise | Premature disclosures damage trust. We have zero affiliate relationships. | Feb 19, 2026 |
| Marketing can queue social posts freely | HOLD lifted Feb 20. Queue handles rate limiting automatically. | Feb 20, 2026 |
| **ALL WRITERS PAUSED (founder directive)** | Founder paused all writers until **Feb 26 6PM UTC**. 780 articles. Resume with **1 writer only**. | Feb 21, 2026 |
| **130h fallback (paused until Feb 26 6PM UTC)** | Founder directive. Do NOT override without board approval. | Feb 21, 2026 |
| Comparison articles first | GSC data shows comparisons rank 2-3x faster than app guides. All writer CLAUDE.md files prioritize comparisons. | Feb 20, 2026 |
| CEO directly fixes critical issues when departments stall | Technology was non-functional for 5 days. CEO fixed search directly. Escalation-only approach was too slow. | Feb 20, 2026 |
| Pagefind index/ → idx/ rename in build | Cloudflare Pages treats `index/` as directory-index reference. Post-build step renames it. | Feb 20, 2026 |
| **Month 1 target: 850 articles (revised from 1,500)** | Founder directive Feb 21. All subsequent targets reduced 20%. | Feb 21, 2026 |
| **Playwright-first policy** | All agents must attempt Playwright browser automation before escalating to human. Founder directive. | Feb 20, 2026 |
| **Social poster skips 403 duplicates** | Fixed infinite loop where X duplicate content errors blocked all X posting. Poster now removes rejected posts and tries next. | Feb 20, 2026 |
| **Social engagement > syndication** | Founder directive: max 30% article links, 70%+ engagement/original content. Active follows, replies, boosts daily. | Feb 20, 2026 |
| **Meta descriptions: 155-char minimum for new content** | Existing 612 short descriptions deferred to Month 2 batch fix. New content must hit 155+ chars. | Feb 20, 2026 |
| **Coordinator tracks lastErrorAt** | For smarter portal alert display — error age relative to agent's run interval. | Feb 20, 2026 |
| **Mastodon bot flag = true** | Account marked as bot per Mastodon convention. Reduces moderation risk for automated posting. | Feb 21, 2026 |
| **Mastodon engagement limits** | SUPERSEDED — all Mastodon activity disabled after 3 app revocations. No API calls allowed until re-evaluation Feb 28+. | Feb 21, 2026 |
| **Trailing slash: ALREADY FIXED** | Cloudflare Pages issues 308 redirects (equivalent to 301 for SEO). GSC split is historical artifact. No action needed. | Feb 21, 2026 |
| **Mastodon automated posting: DISABLED** | 3 app revocations in 36 hours. Disabled to protect 126 followers from account suspension. Re-evaluate Feb 28+. Options: self-hosted instance, bot-friendly instance, or human-only posting. | Feb 21, 2026 |
| **Sitemap lastmod added** | Astro sitemap plugin now emits `<lastmod>` dates. Helps Google prioritize crawling. | Feb 21, 2026 |
| **Internal links: trailing slashes fixed (9,893 links)** | Eliminated 308 redirect chains on internal links that were wasting crawl budget. | Feb 21, 2026 |
| **www→apex 301 redirect** | CF Pages middleware returns 301 for www.selfhosting.sh→selfhosting.sh. Prevents crawl budget waste. | Feb 21, 2026 |
| **RSS autodiscovery link tag** | Added `<link rel="alternate" type="application/rss+xml">` to Base.astro head. Helps aggregators discover content. | Feb 21, 2026 |

## What We've Tried

| Approach | Outcome | Date |
|----------|---------|------|
| 11 looping tmux agents | 6,041 wasted error iterations when rate-limited → Haiku fallback crashes | Feb 16, 2026 |
| systemd persistent services per agent | Better than tmux but wasteful on idle agents | Feb 16-18, 2026 |
| Event-driven coordinator v1.1 | Fixed core agent management but BROKE writer pipeline (didn't discover sub-agents) | Feb 18, 2026 |
| Marketing direct API posting | Replaced with queue system per founder directive. Prevents spam detection. | Feb 19, 2026 |
| Coordinator v1.2 with writer discovery | Worked. But maxWriters=3 and fallback=8h were too conservative. | Feb 20, 2026 |
| Coordinator v2.0 with config-driven limits | **RUNNING.** Memory gate, concurrency limits, git safety. Config at config/coordinator-config.json. | Feb 20, 2026 |
| CEO aggressive config (maxWriters=4, 1h fallback) | **OVERRIDDEN by founder.** Restored to maxWriters=1, 8h fallback → then ALL PAUSED. | Feb 20, 2026 |
| Escalating to Technology via inbox (5 days) | **FAILED.** Technology produced zero work despite 12+ inbox messages. CEO now takes direct action on critical items. | Feb 16-20, 2026 |
| CEO directly fixing search | **SUCCEEDED.** Diagnosed CF Pages index/ conflict, patched build script, deployed, verified. Done in one iteration. | Feb 20, 2026 |

## Open Questions

- **Writer pause impact on Month 1 target** — 780 articles published vs 850 target. Writers paused until Feb 26 6PM UTC. With ~2 days remaining (Feb 26 6PM - Feb 28), need ~70 articles with 1 writer. Very achievable (~35/day).
- **Social engagement execution** — Marketing showed strong first results (41 follows, 8 replies). Can they sustain and grow? Mastodon is the clear winner. → PARTIALLY ANSWERED: Yes, first iteration exceeded all targets.
- **Portal security + v3** — ✅ RESOLVED. Portal v3 live with login auth, 11 pages including Growth metrics and Agent Instructions. HTTPS at portal.selfhosting.sh.
- **GA4 data availability** — ✅ RESOLVED. BI successfully querying GA4 API. Property ID 524871536 confirmed working.
- **Reddit app creation blocked** — Policy wall on Reddit's end. Monitor and retry.
- **Dev.to cross-posting volume** — Marketing cross-posted 21 articles. Prioritizing niche comparisons per GSC data. Ongoing.
- **When will first clicks arrive?** — 15 keywords at positions 3-10 with 518 impressions. Feb 19-20 GSC data (available Feb 21-22) should confirm first click-throughs.
