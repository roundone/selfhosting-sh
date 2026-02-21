# BI & Finance Strategy

**Last updated:** 2026-02-21 ~09:00 UTC (iter 29)

## Current Priorities

1. **Track GSC Feb 19-21 data arrival** — Still not available (2-3 day lag). Feb 19 data expected Feb 22. Given the 24→494 impression trajectory on Feb 17-18, Feb 19 could show continued acceleration. Watch for FIRST CLICKS in GSC.
2. **Writer resume monitoring (Feb 22 = TOMORROW)** — Writers resume Feb 22. Need ~103/day for 7 days to hit 1,500. Previous peak: 496/day. Data supports restart — niche comparisons and hardware should lead. Track first-day velocity.
3. **Track GA4 traffic acceleration** — 94 users, 122 sessions, 176 pageviews (Feb 16-20). Feb 20 confirmed best day: 50 users, 63 sessions. Traffic accelerating even without new content. 16 Google organic sessions confirmed.
4. **Track Mastodon growth at reduced posting pace** — 85 followers from 147 posts (0.58 followers/post — best efficiency). 45-min posting interval, bot flag set. Community health is critical. Monitor if follower growth sustains at reduced pace.
5. **Competitive intelligence sweep overdue** — Last full sweep was iter 23 (~Feb 20 20:00 UTC). selfh.st Friday post check still pending. Run sweep next iteration or on next 24h fallback.

## Standing Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| GA4 property ID: `524871536` | Confirmed via Admin API. Use for all Data API calls. | Feb 20, 2026 |
| GA4 stats in every daily report | Founder directive + now operational | Feb 16-20, 2026 |
| GSC via service account JWT | Enables fully autonomous API access | Feb 15, 2026 |
| Mastodon = best social channel | **85 followers from 147 posts** (0.58/post) vs 11 from 205 (Bluesky) vs unknown (X) | Feb 21, 2026 |
| Hardware + niche comparisons = fastest indexing | 16 page-1 query+page combos, majority are comparison/niche queries | Feb 20, 2026 |
| Daily competitive sweeps | Detect and respond to competitor moves within 24h | Feb 2026 |
| Hashnode uses `reactionCount` not `reactions { count }` | GraphQL schema fix discovered | Feb 21, 2026 |
| X read API: 403 with bearer token | Bearer token (app-only) unsupported for /users/me — needs user-context OAuth | Feb 21, 2026 |

## What We've Tried

| Approach | Outcome | Date |
|----------|---------|------|
| GA4 API via service account | **WORKING**. 94 users, 122 sessions, 176 pageviews (Feb 16-20). Feb 20: 50 users, 63 sessions. | Feb 21, 2026 |
| GSC API via service account | Working. 16 page-1 query+page combos, 22 pages with impressions. Feb 19+ data pending (lag). | Feb 21, 2026 |
| Bluesky public API | Working. 205 posts, 11 followers, low engagement. | Feb 21, 2026 |
| Mastodon API | Working (new app token, bot flag set). 147 posts, 85 followers — **best social platform**. | Feb 21, 2026 |
| X API (bearer token) | Read API 403 (app-only bearer unsupported for /users/me). Poster works via OAuth. | Feb 21, 2026 |
| Dev.to API | Working. 30 articles published, 26 views, 0 reactions. | Feb 21, 2026 |
| Hashnode API | Working. 11 articles published, 2 views, 0 reactions. Uses `reactionCount` scalar field. | Feb 21, 2026 |
| Content performance audit | Complete. Hardware (3.0%) and niche comparisons (1.5%) index fastest. | Feb 20, 2026 |
| Trailing slash impact analysis | Baseline: 10 impressions split across 2 URL pairs. 308 redirects deployed. | Feb 21, 2026 |

## Open Questions

- When will Feb 19-20 GSC data appear? (Expected: Feb 22). Will it show first clicks? GA4 already shows 16 organic sessions — clicks ARE happening.
- Will Mastodon growth sustain with 45-min posting interval? 0.58 followers/post is excellent — can it hold?
- Feb 20 GA4 bounce rate anomaly (98.4% but 179.6s avg session) — is this bot traffic or attribution issue?
- How will ChatGPT referral traffic trend? (1 session so far)
- Direct traffic at 95 sessions — how much is unattributed organic?
- Will trailing slash consolidation appear in Feb 22-25 GSC data?
- Social queue sustainability: 2,566 items draining ~18/day, but writers resume tomorrow adding more. Will queue grow unbounded?
