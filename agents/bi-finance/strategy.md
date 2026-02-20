# BI & Finance Strategy

**Last updated:** 2026-02-20 ~16:00 UTC (iter 22)

## Current Priorities

1. **Track GSC impression explosion** — 518 impressions, 15 page-1 keywords, 22 pages indexed. Google is in active indexing mode. Feb 19-20 data should appear Feb 21-22 — watch for first clicks. This is the #1 metric to track now.
2. **Daily report with GA4 data** — GA4 operational. 59 users, 78 sessions, 12 organic. Track daily trends.
3. **Social platform analytics** — Mastodon is the winner (8 followers, 42 posts, best engagement). Dev.to now has 21 articles. Track growth across all active platforms.
4. **Competitive intelligence** — Daily sweep. We're 3.7x ahead of selfh.st (779 vs 209), 2.0x ahead of noted.lol (779 vs 386). selfh.st expected Friday post — check.
5. **Sitemap gap monitoring** — 779 on disk, 516 in Google. Verify deploy pipeline is regenerating sitemaps to capture all articles.

## Standing Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| GA4 property ID: `524871536` | Confirmed via Admin API. Use for all Data API calls. | Feb 20, 2026 |
| GA4 stats in every daily report | Founder directive + now operational | Feb 16-20, 2026 |
| GSC via service account JWT | Enables fully autonomous API access | Feb 15, 2026 |
| Mastodon = best social channel | 8 followers from 42 posts vs 3 from 103 (Bluesky) vs 0 from 30 (X) | Feb 20, 2026 |
| Hardware + niche comparisons = fastest indexing | 15 page-1 keywords, 10 are comparison/niche queries | Feb 20, 2026 |
| Daily competitive sweeps | Detect and respond to competitor moves within 24h | Feb 2026 |

## What We've Tried

| Approach | Outcome | Date |
|----------|---------|------|
| GA4 API via service account | **WORKING** (iter 20). 51 users, 69 sessions, 104 pageviews (Feb 16-20). 11 Google organic sessions. | Feb 20, 2026 |
| GSC API via service account | Working. Full access confirmed. 2 page-1 keywords, 9 pages with impressions. | Feb 15-20, 2026 |
| Bluesky public API | Working. 82 posts, 1 follower, low engagement. | Feb 20, 2026 |
| Mastodon API | Working. 5 posts, 17 interactions — best engagement. | Feb 20, 2026 |
| X API (bearer token) | Working for reads. 24 tweets, 0 engagement. | Feb 20, 2026 |
| Dev.to API | Working (key valid). 0 articles published. | Feb 20, 2026 |
| Hashnode API | Working (token valid). 0 publications. | Feb 20, 2026 |
| Content performance audit | Complete. Identified hardware (3.0%) and niche comparisons (1.5%) as fastest-indexing. | Feb 20, 2026 |

## Open Questions

- When will Feb 19-20 GSC data appear? (Expected: Feb 21-22). Will it show first clicks?
- Feb 18 data already shows 494 impressions — what will Feb 19-20 show? Possible exponential growth.
- Will sitemap regenerate to include all 779 articles? (Currently stuck at 516 in Google)
- How will ChatGPT referral traffic trend? (1 session so far — worth monitoring)
- Should we submit sitemap to Bing Webmaster Tools? (1 Bing organic session already)
- Will Mastodon growth sustain? (0→8 followers in one day is encouraging)
