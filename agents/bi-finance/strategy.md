# BI & Finance Strategy

**Last updated:** 2026-02-20 ~11:30 UTC (iter 19)

## Current Priorities

1. **Daily report** — Produce `reports/day-YYYY-MM-DD.md` every 24h. Include GA4 stats (now enabled). Include social metrics from all active platforms.
2. **GSC monitoring** — Watch for first crawl acceleration. 9 pages with impressions, 2 page-1 keywords. Feb 18-20 impression data should appear by Feb 21-22 (2-3 day lag).
3. **Competitive intelligence** — Daily sweep of competitor sitemaps. We're 3.7x ahead of selfh.st (772 vs 209), 2.0x ahead of noted.lol (772 vs 387). Track whether they accelerate.
4. **Content freshness monitoring** — Track app version changes. 7 stale alerts sent (Elasticsearch, NetBird, Jackett, Strapi, Calibre-Web, Paperless-ngx, Whisper). Monitor Operations for fixes.
5. **Content performance tracking** — Hardware guides indexing at 3.0%, compare at 1.5%, apps at 0%. Track whether this pattern continues as more articles publish post-Feb 22.

## Standing Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| GA4 stats in every daily report | Founder directive — include even if zero sessions | Feb 16, 2026 |
| GA4 now enabled | Founder action between iters 18-19. Pull traffic data starting iter 20. | Feb 20, 2026 |
| GSC via service account JWT (not OAuth) | Enables fully autonomous operation without browser login | Feb 15, 2026 |
| Content performance audit complete | 15-page analysis of which content types index fastest. Findings sent to Marketing for writer priority adjustment. | Feb 20, 2026 |
| Daily competitive sweeps | Detect and respond to competitor moves within 24h | Feb 2026 |
| Hardware + niche comparisons = fastest indexing | Data-driven: hardware 3.0% impression rate, compare 1.5%, apps 0%. Marketing to adjust writer priorities. | Feb 20, 2026 |

## What We've Tried

| Approach | Outcome | Date |
|----------|---------|------|
| GA4 API via service account | Working. Viewer access confirmed. API now enabled (founder action). | Feb 15-20, 2026 |
| GSC API via service account | Working. Full access confirmed. | Feb 15, 2026 |
| Content performance audit (15 pages) | Complete. Identified hardware (3.0%) and niche comparisons (1.5%) as fastest-indexing content types. Table density correlates with impressions. Niche topics outperform high-competition topics 10:1 in early indexing. Sent to Marketing. | Feb 20, 2026 |
| Mastodon API public endpoint | Working. 0 posts, 0 followers (credentials available now — can post when Marketing uses them). | Feb 20, 2026 |
| Dev.to API public endpoint | Working. 0 articles (credentials available now — can post when Marketing uses them). | Feb 20, 2026 |

## Open Questions

- When will Feb 18-20 GSC impressions data appear? (Expected: Feb 21-22 due to 2-3 day lag)
- Will Marketing adjust writer priorities based on content audit findings before Feb 22 resume?
- How will GA4 traffic compare to GSC clicks? (First data pull on next iteration)
- Are social credentials for Mastodon/Dev.to/Hashnode now available? (Check api-keys.env next iteration)
- Will sitemap regenerate with 772 articles on next deploy, or is 516 the cap?
