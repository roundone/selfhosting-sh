# CEO Strategy

**Last updated:** 2026-02-21 18:30 UTC

## Current Priorities

1. **GSC BREAKTHROUGH — FIRST CLICKS CONFIRMED.** Feb 19 data: 5 clicks, 1,324 impressions (2.68x over Feb 18), 46 page-1 queries, 9 at position 1-2. Exponential impression curve: 0→24→494→1,324. Content-to-traffic pipeline is validated. Top performers: proxmox-hardware-guide (580 impr, 2 clicks), nextcloud-vs-syncthing (380 impr, pos 5.1 — about to generate clicks).
2. **INDEXING FIXES DEPLOYED — MONITORING POST-FIX.** All 4 fixes live since Feb 21 09:50 UTC: sitemap lastmod, 9,893 trailing slash links, www→apex 301, RSS autodiscovery. Post-fix data expected in GSC Feb 24-25. Trailing slash split on nextcloud-vs-syncthing (18 impressions on non-canonical) should consolidate.
3. **Writers paused until Feb 26 6PM UTC (founder directive).** 780 articles on disk vs 850 target. Need ~70 in final 2 days with 1 writer. Achievable (~35/day). Writer error counters reset for clean restart.
4. **Comparison articles are the growth engine.** 3 of 5 clicked pages are comparisons. Of 46 page-1 queries, majority are "X vs Y". When writer resumes Feb 26, comparison articles are top priority across all categories.
5. **Social media — Mastodon DISABLED, X+Bluesky ACTIVE.** Mastodon: 134 followers (+11 despite disabled posting — organic growth continues). Bluesky: 20 followers (+6). Queue at ~2,677 items. Reply strategy overhauled (6 mandatory rules deployed).
6. **GA4 traffic growing.** 114 users, 142 sessions, 205 pageviews (Feb 16-21). Feb 20 was best day: 57 users, 70 sessions. 18 Google organic sessions from 5 users (3.6 sessions/user — high repeat rate).

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
| **Reply strategy overhaul: APPROVED AND DEPLOYED** | Founder-approved Feb 21 17:44 UTC. All 6 rules implemented in Marketing CLAUDE.md + brand-voice.md: (1) No queued/batched replies, (2) mandatory full thread reading, (3) sarcasm/hostility auto-SKIP, (4) "would a human reply?" test, (5) never recommend off-target content, (6) max 1-2 replies/day across all platforms. Marketing inbox directive sent. | Feb 21, 2026 |
| **Vary article structure (founder-approved)** | To reduce "AI slop" perception: articles should not all follow identical template structure. Operations directive sent for Feb 26 writer restart. Low-risk, honest improvement. | Feb 21, 2026 |

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

- **Writer pause impact on Month 1 target** — 780 articles vs 850 target. Need ~70 in 2 days with 1 writer. Achievable.
- **Post-fix indexing impact** — 4 SEO fixes deployed Feb 21. Will they accelerate impression growth? Feb 22-25 GSC data will tell. Expected Feb 24-25.
- **Nextcloud-vs-syncthing breakout** — 380 impressions at position 5.1 with 0 clicks. When will CTR kick in? Typical position 5 CTR is 3-5%, suggesting 11-19 clicks/day once users start clicking.
- **Reddit app creation blocked** — Policy wall on Reddit's end. Monitor and retry.
- **Mastodon re-evaluation Feb 28+** — Options: self-hosted instance, bot-friendly Fediverse instance, human-only posting. Organic growth continues despite disabled posting (134 followers, +11 since disabled).
- ✅ **First clicks arrived** — RESOLVED. Feb 19: 5 clicks from 3 pages. Pipeline validated.
- ✅ **GA4 data availability** — RESOLVED.
- ✅ **Portal security** — RESOLVED.
