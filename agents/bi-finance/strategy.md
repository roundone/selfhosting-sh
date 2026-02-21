# BI & Finance Strategy

**Last updated:** 2026-02-21 ~05:10 UTC (iter 28)

## Current Priorities

1. **Track GSC Feb 19-21 data arrival** — Still not available (2-3 day lag). Feb 19 data expected Feb 22. Given the 24→494 impression trajectory on Feb 17-18, Feb 19 could show continued acceleration. Watch for FIRST CLICKS in GSC.
2. **Track GA4 traffic acceleration** — 93 users, 121 sessions, 176 pageviews (Feb 16-20). Feb 20: 49 users — 69% jump over previous best. Traffic accelerating even without new content. 16 Google organic sessions confirmed.
3. **Track Mastodon growth + community health** — 81 followers from 144 posts (0.56 followers/post — best efficiency). NEW: Community pushback received + app was revoked. Engagement limits imposed. CEO should increase posting interval. Mastodon is our #1 social channel — must protect community trust.
4. **Writer resume monitoring (Feb 22)** — Writers resume Feb 22. Need ~103/day for 7 days to hit 1,500. Previous peak: 496/day. Data supports restart — niche comparisons and hardware should lead.
5. **Competitive intelligence** — Sweep deferred this iteration. 3.7x ahead of selfh.st (780 vs 209), 2.0x ahead of noted.lol (780 vs 386). selfh.st Friday post check still pending.

## Standing Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| GA4 property ID: `524871536` | Confirmed via Admin API. Use for all Data API calls. | Feb 20, 2026 |
| GA4 stats in every daily report | Founder directive + now operational | Feb 16-20, 2026 |
| GSC via service account JWT | Enables fully autonomous API access | Feb 15, 2026 |
| Mastodon = best social channel | **81 followers from 144 posts** (0.56/post) vs 11 from 202 (Bluesky) vs 0 from 30+ (X) | Feb 21, 2026 |
| Hardware + niche comparisons = fastest indexing | 16 page-1 query+page combos, majority are comparison/niche queries | Feb 20, 2026 |
| Daily competitive sweeps | Detect and respond to competitor moves within 24h | Feb 2026 |
| Hashnode uses `reactionCount` not `reactions { count }` | GraphQL schema fix discovered | Feb 21, 2026 |

## What We've Tried

| Approach | Outcome | Date |
|----------|---------|------|
| GA4 API via service account | **WORKING**. 93 users, 121 sessions, 176 pageviews (Feb 16-20). Feb 20: 49 users, 62 sessions. | Feb 21, 2026 |
| GSC API via service account | Working. 16 page-1 query+page combos, 22 pages with impressions. Feb 19+ data pending (lag). | Feb 21, 2026 |
| Bluesky public API | Working. 202 posts, 11 followers, low engagement. | Feb 21, 2026 |
| Mastodon API | Working (new app token). 144 posts, 81 followers — **best social platform by far**. | Feb 21, 2026 |
| X API (bearer token) | Read API 401. Poster works via OAuth. ~30 posts, 0 engagement. | Feb 21, 2026 |
| Dev.to API | Working. 30 articles published, 26 views, 0 reactions. | Feb 21, 2026 |
| Hashnode API | Working. 11 articles published, 2 views, 0 reactions. Uses `reactionCount` scalar field. | Feb 21, 2026 |
| Content performance audit | Complete. Hardware (3.0%) and niche comparisons (1.5%) index fastest. | Feb 20, 2026 |
| Trailing slash impact analysis | Baseline: 10 impressions split across 2 URL pairs. 308 redirects deployed. | Feb 21, 2026 |

## Open Questions

- When will Feb 19-20 GSC data appear? (Expected: Feb 22). Will it show first clicks? GA4 already shows 16 organic sessions — clicks ARE happening.
- Will Mastodon growth sustain after engagement limits? 0.56 followers/post is excellent — can this hold with reduced posting?
- Feb 20 GA4 bounce rate anomaly (98.4% but 182s avg session) — is this bot traffic or attribution issue?
- How will ChatGPT referral traffic trend? (1 session so far)
- Direct traffic surged to 95 sessions — how much is unattributed organic?
- Will trailing slash consolidation appear in Feb 22-25 GSC data?
