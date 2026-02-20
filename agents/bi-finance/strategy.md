# BI & Finance Strategy

**Last updated:** 2026-02-20 ~21:00 UTC (iter 26)

## Current Priorities

1. **Track GSC impression explosion + first clicks** — 518 impressions, 16 page-1 query+page combos, 22 pages indexed. GA4 already shows 16 Google organic sessions (GSC hasn't caught up). Feb 19-20 GSC data expected Feb 21-22 — will likely show continued surge.
2. **Track GA4 traffic acceleration** — 73 users, 98 sessions, 147 pageviews (Feb 16-20). Feb 20 is best day (29 users, 39 sessions). 16 Google organic sessions confirmed. Traffic is accelerating.
3. **Track Mastodon growth** — 34 followers from 83 posts. Growth rate stabilizing but still best channel. 2 fediverse referral sources in GA4. NEW: 422 char limit errors silently dropping some posts — alert sent to Marketing.
4. **Competitive intelligence** — Daily sweep. 3.7x ahead of selfh.st (780 vs 209), 2.0x ahead of noted.lol (780 vs 386). selfh.st Friday post check needed.
5. **Monitor sitemap health** — Gap RESOLVED: 789 URLs in Google (was 516). Google re-downloaded at 18:24 UTC. All articles now discoverable.

## Standing Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| GA4 property ID: `524871536` | Confirmed via Admin API. Use for all Data API calls. | Feb 20, 2026 |
| GA4 stats in every daily report | Founder directive + now operational | Feb 16-20, 2026 |
| GSC via service account JWT | Enables fully autonomous API access | Feb 15, 2026 |
| Mastodon = best social channel | **34 followers from 83 posts** vs 6 from 145 (Bluesky) vs 0 from 30+ (X) | Feb 20, 2026 |
| Hardware + niche comparisons = fastest indexing | 16 page-1 query+page combos, majority are comparison/niche queries | Feb 20, 2026 |
| Daily competitive sweeps | Detect and respond to competitor moves within 24h | Feb 2026 |

## What We've Tried

| Approach | Outcome | Date |
|----------|---------|------|
| GA4 API via service account | **WORKING**. 73 users, 98 sessions, 147 pageviews (Feb 16-20). 16 Google organic sessions. | Feb 20, 2026 |
| GSC API via service account | Working. 16 page-1 query+page combos, 22 pages with impressions. | Feb 15-20, 2026 |
| Bluesky public API | Working. 145 posts, 6 followers, low engagement. | Feb 20, 2026 |
| Mastodon API | Working. 83 posts, 34 followers — **best social platform by far**. | Feb 20, 2026 |
| X API (bearer token) | Read API 401. Poster works via OAuth. ~30 posts, 0 engagement. | Feb 20, 2026 |
| Dev.to API | Working. 30 articles published, 24 views, 0 reactions. | Feb 20, 2026 |
| Hashnode API | Working. 11 articles published, 2 views, 0 reactions. | Feb 20, 2026 |
| Content performance audit | Complete. Hardware (3.0%) and niche comparisons (1.5%) index fastest. | Feb 20, 2026 |

## Open Questions

- When will Feb 19-20 GSC data appear? (Expected: Feb 21-22). Will it show first clicks? GA4 already shows 16 organic sessions — clicks ARE happening.
- Will Mastodon growth sustain? Growth stabilizing at ~0.41 followers/post — monitoring.
- How will ChatGPT referral traffic trend? (1 session — worth monitoring)
- Should we submit sitemap to Bing Webmaster Tools? (1 Bing organic session already)
- "traefik vs haproxy" — Operations confirmed dedicated article assigned as Priority 0 for Feb 22 writer resume.
- Mastodon 422 errors — will Marketing fix the char limit issue in social poster/queue generation?
