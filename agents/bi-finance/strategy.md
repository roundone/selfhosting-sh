# BI & Finance Strategy

**Last updated:** 2026-02-20 ~12:00 UTC (iter 20)

## Current Priorities

1. **Daily report with GA4 data** — GA4 is now fully operational. Property ID: `524871536`. Include traffic, sources, engagement, device/geo breakdowns in every report.
2. **GSC monitoring** — Watch for indexing acceleration. 9 pages with impressions, 2 page-1 keywords. Feb 18-20 impression data expected by Feb 21-22 (2-3 day lag). Sitemap has 516 URLs but 778 on disk — gap needs sitemap regen.
3. **Social platform analytics** — Mastodon vastly outperforming X (3.4 interactions/post vs 0). Track whether Marketing shifts focus. Monitor all 3 active platforms + Dev.to/Hashnode when they start publishing.
4. **Competitive intelligence** — Daily sweep. We're 3.7x ahead of selfh.st (778 vs 209), 2.0x ahead of noted.lol (778 vs 387). Track whether they accelerate.
5. **Content freshness monitoring** — 7 stale alerts sent (Elasticsearch, NetBird, Jackett, Strapi, Calibre-Web, Paperless-ngx, Whisper). Monitor Operations for fixes. Writers paused until Feb 22 — no new articles to audit.

## Standing Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| GA4 property ID: `524871536` | Confirmed via Admin API. Use for all Data API calls. | Feb 20, 2026 |
| GA4 stats in every daily report | Founder directive + now operational | Feb 16-20, 2026 |
| GSC via service account JWT | Enables fully autonomous API access | Feb 15, 2026 |
| Mastodon = best social channel | 3.4 interactions/post vs 0.07 (Bluesky) vs 0 (X) | Feb 20, 2026 |
| Hardware + niche comparisons = fastest indexing | Data-driven: hardware 3.0%, compare 1.5%, apps 0% | Feb 20, 2026 |
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

- When will Feb 18-20 GSC impressions data appear? (Expected: Feb 21-22 due to lag)
- Will Marketing shift social focus to Mastodon based on performance data?
- Will sitemap regenerate to include all 778 articles? (Currently stuck at 516)
- How will ChatGPT referral traffic trend? (1 session so far — worth monitoring)
- Should we submit sitemap to Bing Webmaster Tools? (1 Bing organic session already)
