# BI & Finance Strategy

**Last updated:** 2026-02-21 ~07:00 UTC (iter 31)

## Current Priorities

1. **Track GSC Feb 19-21 data arrival** — Still not available (2-3 day lag). Feb 19 data expected Feb 22. Given the 24→494 impression trajectory on Feb 17-18, Feb 19 could show continued acceleration. Watch for FIRST CLICKS in GSC.
2. **Writer resume monitoring (Feb 22 = TOMORROW)** — Writers resume Feb 22. Need ~103/day for 7 days to hit 1,500. Previous peak: 496/day. Data supports restart — niche comparisons and hardware should lead. Track first-day velocity.
3. **Track GA4 traffic acceleration** — 96 users, 124 sessions, 180 pageviews (Feb 15-21). Feb 20 confirmed best day: 51 users, 64 sessions. Traffic accelerating even without new content. 16 Google organic sessions confirmed.
4. **Mastodon reduced-pace strategy VALIDATED** — 93 followers from 150 posts (0.62 followers/post — best efficiency). 45-min interval is optimal. No changes needed. Monitor if efficiency sustains as total followers grow.
5. **Competitive intelligence sweep overdue** — Last full sweep was iter 23 (~Feb 20 20:00 UTC). selfh.st Friday post check still pending. Run sweep next iteration or on next 24h fallback.

## Standing Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| GA4 property ID: `524871536` | Confirmed via Admin API. Use for all Data API calls. | Feb 20, 2026 |
| GA4 stats in every daily report | Founder directive + now operational | Feb 16-20, 2026 |
| GSC via service account JWT | Enables fully autonomous API access | Feb 15, 2026 |
| Mastodon = best social channel | **93 followers from 150 posts** (0.62/post) vs 13 from 215 (Bluesky) vs unknown (X) | Feb 21, 2026 |
| Mastodon: less posting → more growth | Reduced from 15→45 min interval. Efficiency improved 0.41→0.62 followers/post. Do NOT increase frequency. | Feb 21, 2026 |
| Hardware + niche comparisons = fastest indexing | 16 page-1 query+page combos, majority are comparison/niche queries | Feb 20, 2026 |
| Google organic users are repeat visitors | 16 sessions from 4 users = 4 sessions/user. Each ranking creates a returning reader. | Feb 21, 2026 |
| Daily competitive sweeps | Detect and respond to competitor moves within 24h | Feb 2026 |
| Hashnode uses `reactionCount` not `reactions { count }` | GraphQL schema fix discovered | Feb 21, 2026 |
| X read API: 403 with bearer token | Bearer token (app-only) unsupported for /users/me — needs user-context OAuth | Feb 21, 2026 |

## What We've Tried

| Approach | Outcome | Date |
|----------|---------|------|
| GA4 API via service account | **WORKING**. 96 users, 124 sessions, 180 pageviews (Feb 15-21). Feb 20: 51 users, 64 sessions. | Feb 21, 2026 |
| GSC API via service account | Working. 16 page-1 query+page combos, 22 pages with impressions. Feb 19+ data pending (lag). | Feb 21, 2026 |
| Bluesky public API | Working. 215 posts, 13 followers, low engagement. | Feb 21, 2026 |
| Mastodon API | Working (new app token, bot flag set). 150 posts, 93 followers — **best social platform**. | Feb 21, 2026 |
| X API (bearer token) | Read API 403 (app-only bearer unsupported for /users/me). Poster works via OAuth. | Feb 21, 2026 |
| Dev.to API | Working. 30 articles published, 36 views, 0 reactions. | Feb 21, 2026 |
| Hashnode API | Working. 11 articles published, 2 views, 0 reactions. Uses `reactionCount` scalar field. | Feb 21, 2026 |
| Content performance audit | Complete. Hardware (3.0%) and niche comparisons (1.5%) index fastest. | Feb 20, 2026 |
| Trailing slash impact analysis | Baseline: 10 impressions split across 2 URL pairs. 308 redirects deployed. | Feb 21, 2026 |

## Open Questions

- When will Feb 19-20 GSC data appear? (Expected: Feb 22). Will it show first clicks? GA4 already shows 16 organic sessions — clicks ARE happening.
- ~~Will Mastodon growth sustain with 45-min posting interval?~~ **ANSWERED: Yes. 0.62 followers/post at reduced pace — best efficiency yet.**
- Feb 20 GA4 bounce rate anomaly (98.4% but 176.9s avg session) — is this bot traffic or attribution issue?
- How will ChatGPT referral traffic trend? (1 session so far)
- Direct traffic at 98 sessions — how much is unattributed organic?
- Will trailing slash consolidation appear in Feb 22-25 GSC data?
- Social queue sustainability: 2,576 items draining ~18/day, but writers resume tomorrow adding more. Will queue grow unbounded?
- Bluesky growth: 13 followers from 215 posts (0.06/post). What engagement strategy would work? Different from Mastodon norms.
