# BI & Finance Strategy

**Last updated:** 2026-02-21 ~10:00 UTC (iter 33)

## Current Priorities

1. **Track GSC Feb 19-21 data arrival** — Still not available (2-3 day lag). Feb 19 data expected Feb 22. Given the 24→494 impression trajectory on Feb 17-18, Feb 19 could show continued acceleration. Watch for FIRST CLICKS in GSC. **Also: track indexing acceleration from 4 fixes deployed today (sitemap lastmod, 9,893 trailing slash links, www→apex redirect, RSS autodiscovery).**
2. **Writer resume monitoring (Feb 26 6PM UTC)** — Writers resume Feb 26 (extended from Feb 22). Need ~70 articles in 2 days with 1 writer to hit 850. tier2-writer approved as first writer. Track first-day velocity.
3. **Track GA4 traffic acceleration** — 103 users, 131 sessions, 188 pageviews (Feb 16-21). Feb 20 confirmed best day: 52 users, 65 sessions. Traffic accelerating even without new content. 17 Google organic sessions, 2 Bing organic confirmed.
4. **Mastodon growth engine** — 123 followers from 160 posts (0.77 followers/post — best ever). 45-min interval optimal. No changes needed. At this trajectory, 200 followers realistic within 3-4 days.
5. **Competitive intelligence sweep overdue** — Last full sweep was iter 23 (~Feb 20 20:00 UTC). selfh.st Friday post check still pending. Run sweep next iteration or on next 24h fallback.
6. **Indexing acceleration tracking** — New action item from CEO: compare Feb 22-26 GSC data against Feb 16-21 baseline. Track: pages indexed, impressions/day, crawl coverage breadth, 308 redirect reduction.

## Standing Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| **Month 1 target: 850 articles** | Founder directive 2026-02-21. Reduced from 1,500. Subsequent months -20%. | Feb 21, 2026 |
| **Writers paused until Feb 26 6PM UTC** | Founder directive. Restart with 1 writer limit. | Feb 21, 2026 |
| GA4 property ID: `524871536` | Confirmed via Admin API. Use for all Data API calls. | Feb 20, 2026 |
| GA4 stats in every daily report | Founder directive + now operational | Feb 16-20, 2026 |
| GSC via service account JWT | Enables fully autonomous API access | Feb 15, 2026 |
| Mastodon = best social channel | **123 followers from 160 posts** (0.77/post) vs 14 from 234 (Bluesky) vs unknown (X) | Feb 21, 2026 |
| Mastodon: less posting → more growth | Reduced from 15→45 min interval. Efficiency improved 0.41→0.62→0.77 followers/post. Do NOT increase frequency. | Feb 21, 2026 |
| Hardware + niche comparisons = fastest indexing | 16 page-1 query+page combos, majority are comparison/niche queries | Feb 20, 2026 |
| Google organic users are repeat visitors | 17 sessions from 4 users = 4.25 sessions/user. Each ranking creates a returning reader. | Feb 21, 2026 |
| Daily competitive sweeps | Detect and respond to competitor moves within 24h | Feb 2026 |
| Hashnode uses `reactionCount` not `reactions { count }` | GraphQL schema fix discovered | Feb 21, 2026 |
| X read API: 403 with bearer token | Bearer token (app-only) unsupported for /users/me — needs user-context OAuth | Feb 21, 2026 |

## What We've Tried

| Approach | Outcome | Date |
|----------|---------|------|
| GA4 API via service account | **WORKING**. 103 users, 131 sessions, 188 pageviews (Feb 16-21). Feb 20: 52 users, 65 sessions. | Feb 21, 2026 |
| GSC API via service account | Working. 16 page-1 query+page combos, 22 pages with impressions. Feb 19+ data pending (lag). | Feb 21, 2026 |
| Bluesky public API | Working. 234 posts, 14 followers, low engagement. | Feb 21, 2026 |
| Mastodon API | Working (new app token, bot flag set). 160 posts, 123 followers — **best social platform**. | Feb 21, 2026 |
| X API (bearer token) | Read API 403 (app-only bearer unsupported for /users/me). Poster works via OAuth. | Feb 21, 2026 |
| Dev.to API | Working. 31 articles published, 36 views, 0 reactions. Auth token 401 on some endpoints. | Feb 21, 2026 |
| Hashnode API | Working. 12 articles published, 2 views, 0 reactions. 1 duplicate detected. | Feb 21, 2026 |
| Content performance audit | Complete. Hardware (3.0%) and niche comparisons (1.5%) index fastest. | Feb 20, 2026 |
| Trailing slash impact analysis | Baseline: 10 impressions split across 2 URL pairs. 9,893 links fixed + 4 indexing fixes deployed. | Feb 21, 2026 |

## Open Questions

- When will Feb 19-20 GSC data appear? (Expected: Feb 22). Will it show first clicks? GA4 already shows 17 organic sessions — clicks ARE happening.
- ~~Will Mastodon growth sustain with 45-min posting interval?~~ **ANSWERED: Yes. 0.77 followers/post — accelerating.**
- Will indexing acceleration from the 4 fixes deployed today be visible in Feb 22-26 data?
- Feb 20 GA4 bounce rate anomaly (98.5% but 174s avg session) — is this bot traffic or attribution issue?
- How will ChatGPT referral traffic trend? (1 session so far)
- Direct traffic at 103 sessions — how much is unattributed organic?
- Will trailing slash consolidation appear in Feb 22-25 GSC data?
- Social queue sustainability: 2,621 items draining ~12/hour, but writers resume Feb 26 adding more. Will queue grow unbounded?
- Bluesky growth: 14 followers from 234 posts (0.06/post). What engagement strategy would work?
- Can 1 writer produce ~70 articles in 2 days (Feb 26-28) to hit 850 target?
