# CEO Strategy

**Last updated:** 2026-02-21 05:15 UTC

## Current Priorities

1. **Writers resume Feb 22.** All 8 CLAUDE.md files updated with new category assignments, 155-char meta description requirement, comparison-first priority. Operations directed to reset wake-on.conf from 48h→1h on Feb 22. Target: ~103 articles/day for 7 remaining days to hit 1,500.
2. **GA4 Feb 20 breakout.** 49 users, 62 sessions, 83 pageviews — 69% jump over previous best. Total: 93 users, 121 sessions. Traffic accelerating even with writers paused. Proves content is compounding.
3. **Mastodon stabilized + frequency reduced.** App revocation resolved, posting interval increased 15→45 min after community pushback. 81 followers (0.56/post). Must protect this community relationship.
4. **Trailing slash — ALREADY FIXED (Technology confirmed).** 308 redirects in place since Feb 20. GSC split is historical artifact. CEO's initial diagnosis was wrong — no further action needed. Monitor for consolidation in Feb 22-25 GSC data.
5. **GSC data lag.** Feb 18 data (latest) shows 518 impressions, 22 pages, 0 clicks. Feb 19-20 data not yet available (2-3 day lag). First clicks expected when that data arrives. BI tasked with fresh pull.
6. **Social media — posting healthy.** Queue at ~2,557 items. Mastodon at 45-min interval, X at 15-min, Bluesky at 10-min. Mastodon engagement limits in effect.

## Standing Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| Rate-limit proxy at 0.5 req/sec | Prevents Claude Max 5-hour window exhaustion | Feb 16, 2026 |
| Event-driven coordinator (not looping services) | Eliminates idle API waste; agents run only when triggered | Feb 18, 2026 |
| Social posting via queue only | Founder directive — agents never call social APIs directly. bin/social-poster.js handles all posting. | Feb 19, 2026 |
| No affiliate disclosures until founder says otherwise | Premature disclosures damage trust. We have zero affiliate relationships. | Feb 19, 2026 |
| Marketing can queue social posts freely | HOLD lifted Feb 20. Queue handles rate limiting automatically. | Feb 20, 2026 |
| **ALL WRITERS PAUSED (founder directive)** | Founder paused all writers until Feb 22. 773 articles sufficient. Focus: Technology, Marketing, BI, IR. | Feb 20, 2026 |
| **48h fallback (paused until Feb 22)** | Founder directive. Do NOT override without board approval. | Feb 20, 2026 |
| Comparison articles first | GSC data shows comparisons rank 2-3x faster than app guides. All writer CLAUDE.md files prioritize comparisons. | Feb 20, 2026 |
| CEO directly fixes critical issues when departments stall | Technology was non-functional for 5 days. CEO fixed search directly. Escalation-only approach was too slow. | Feb 20, 2026 |
| Pagefind index/ → idx/ rename in build | Cloudflare Pages treats `index/` as directory-index reference. Post-build step renames it. | Feb 20, 2026 |
| **Month 1 target: 1,500 articles (revised from 5,000)** | Board approved. 5,000 moves to Month 2. Realistic given infrastructure constraints and ramp-up time. | Feb 20, 2026 |
| **Playwright-first policy** | All agents must attempt Playwright browser automation before escalating to human. Founder directive. | Feb 20, 2026 |
| **Social poster skips 403 duplicates** | Fixed infinite loop where X duplicate content errors blocked all X posting. Poster now removes rejected posts and tries next. | Feb 20, 2026 |
| **Social engagement > syndication** | Founder directive: max 30% article links, 70%+ engagement/original content. Active follows, replies, boosts daily. | Feb 20, 2026 |
| **Meta descriptions: 155-char minimum for new content** | Existing 612 short descriptions deferred to Month 2 batch fix. New content must hit 155+ chars. | Feb 20, 2026 |
| **Coordinator tracks lastErrorAt** | For smarter portal alert display — error age relative to agent's run interval. | Feb 20, 2026 |
| **Mastodon bot flag = true** | Account marked as bot per Mastodon convention. Reduces moderation risk for automated posting. | Feb 21, 2026 |
| **Mastodon engagement limits** | Max 3 follows/iteration, 15/day. Max 3 replies/iteration. Max 15 API calls/iteration. Prevents app revocation. | Feb 21, 2026 |
| **Trailing slash: ALREADY FIXED** | Cloudflare Pages issues 308 redirects (equivalent to 301 for SEO). GSC split is historical artifact. No action needed. | Feb 21, 2026 |
| **Mastodon posting interval: 45 min** | Increased from 15 min after community pushback on posting frequency. ~32 posts/day still substantial. Community trust > volume. | Feb 21, 2026 |

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

- **Writer pause impact on Month 1 target** — 779 articles published vs 1,500 target. Writers paused until Feb 22. With 6 days remaining (Feb 22-28), need ~721 articles in 6 days (~120/day). Achievable with 8 concurrent writers but tight.
- **Social engagement execution** — Marketing showed strong first results (41 follows, 8 replies). Can they sustain and grow? Mastodon is the clear winner. → PARTIALLY ANSWERED: Yes, first iteration exceeded all targets.
- **Portal security + v3** — ✅ RESOLVED. Portal v3 live with login auth, 11 pages including Growth metrics and Agent Instructions. HTTPS at portal.selfhosting.sh.
- **GA4 data availability** — ✅ RESOLVED. BI successfully querying GA4 API. Property ID 524871536 confirmed working.
- **Reddit app creation blocked** — Policy wall on Reddit's end. Monitor and retry.
- **Dev.to cross-posting volume** — Marketing cross-posted 21 articles. Prioritizing niche comparisons per GSC data. Ongoing.
- **When will first clicks arrive?** — 15 keywords at positions 3-10 with 518 impressions. Feb 19-20 GSC data (available Feb 21-22) should confirm first click-throughs.
