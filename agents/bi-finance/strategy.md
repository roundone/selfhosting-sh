# BI & Finance Strategy

**Last updated:** 2026-02-21 ~18:25 UTC (iter 34)

## Current Priorities

1. **Track Feb 20-21 GSC data arrival** — Feb 19 showed 5 clicks + 1,324 impressions (2.68x over Feb 18). Feb 20 data expected Feb 23. If the 2.7x daily growth holds, Feb 20 could show ~3,500 impressions. **This is the most important metric to watch.**
2. **Track indexing acceleration from 4 fixes deployed Feb 21** — Baseline established: 31 pages with impressions, 1,842 total impressions, 5 clicks (Feb 15-19). Post-fix data starts Feb 22 (available ~Feb 24-25 in GSC). Compare: pages indexed, impressions/day, crawl coverage breadth, trailing slash consolidation.
3. **Writer resume monitoring (Feb 26 6PM UTC)** — Writers resume Feb 26. Need ~70 articles in 2 days with 1 writer to hit 850. tier2-writer approved as first writer. Track first-day velocity.
4. **Mastodon organic growth during disabled period** — 134 followers despite disabled posting (+11 since 10:00 UTC). Monitor whether organic growth sustains through Feb 26-28 cooling period. If followers keep growing without posting, the brand has real pull in fediverse.
5. **Bluesky growth acceleration** — 20 followers (+6 since last update). Best single-update gain. Monitor whether session caching fix enables Marketing engagement that drives further growth.
6. **Competitive sweep: noted.lol published HarborFM** — flagged to Marketing. No threats detected from any competitor.

## Standing Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| **Month 1 target: 850 articles** | Founder directive 2026-02-21. Reduced from 1,500. Subsequent months -20%. | Feb 21, 2026 |
| **Writers paused until Feb 26 6PM UTC** | Founder directive. Restart with 1 writer limit. | Feb 21, 2026 |
| GA4 property ID: `524871536` | Confirmed via Admin API. Use for all Data API calls. | Feb 20, 2026 |
| GA4 stats in every daily report | Founder directive + now operational | Feb 16-20, 2026 |
| GSC via service account JWT | Enables fully autonomous API access | Feb 15, 2026 |
| Mastodon = best social channel | **134 followers from 167 posts** (0.80/post) — growing without posting | Feb 21, 2026 |
| Mastodon: DISABLED until Feb 28+ | 3 app revocations in 36 hours. Account preserved with 134 followers. | Feb 21, 2026 |
| Comparison articles = fastest to click | 3 of 5 first GSC clicks are comparison pages. Comparison CTR > hardware CTR at similar positions. | Feb 21, 2026 |
| Syncthing/Nextcloud and Kavita/Calibre = topical authority confirmed | 9 keywords at position 1-2 for long-tail variants. Google recognizes us as authoritative. | Feb 21, 2026 |
| Hardware = highest impression volume | proxmox-hardware-guide: 580 impressions (our highest). Hardware generates volume; comparisons convert. | Feb 21, 2026 |
| Daily competitive sweeps | Detect and respond to competitor moves within 24h | Feb 2026 |
| Hashnode uses `reactionCount` not `reactions { count }` | GraphQL schema fix discovered | Feb 21, 2026 |
| X read API: 403 with bearer token | Bearer token (app-only) unsupported for /users/me — needs user-context OAuth | Feb 21, 2026 |

## What We've Tried

| Approach | Outcome | Date |
|----------|---------|------|
| GA4 API via service account | **WORKING**. 114 users, 142 sessions, 205 pageviews (Feb 16-21). | Feb 21, 2026 |
| GSC API via service account | **WORKING**. 5 clicks, 1,842 impressions, 46 page-1 queries, 31 pages. Feb 19 data breakthrough. | Feb 21, 2026 |
| Bluesky public API | Working. 283 posts, 20 followers (+6). Growth accelerating. | Feb 21, 2026 |
| Mastodon public API | Working. 167 posts, 134 followers — **still growing despite DISABLED posting**. | Feb 21, 2026 |
| X API (bearer token) | Read API 403. Poster works via OAuth. | Feb 21, 2026 |
| Dev.to API | Working. 32 articles published, 67 views (+31), 0 reactions. | Feb 21, 2026 |
| Hashnode API | Working. 12 articles, 2 views. | Feb 21, 2026 |
| Content performance audit | Validated. Hardware = impression volume, comparisons = clicks. | Feb 21, 2026 |
| Competitive sweep | selfh.st weekly-only. noted.lol ~2/week. awesome-selfhosted quiet. No threats. | Feb 21, 2026 |

## Open Questions

- Will the 2.7x daily impression growth hold on Feb 20 data? Feb 20 was our best GA4 day (57 users, 70 sessions). GSC data for Feb 20 should show a major jump.
- Will indexing acceleration from the 4 fixes be visible in Feb 22-26 data?
- Will nextcloud-vs-syncthing (380 impressions, 0 clicks, position 5.1) start generating clicks in Feb 20 data?
- Can 1 writer produce ~70 articles in 2 days (Feb 26-28) to hit 850 target?
- How long will Mastodon organic growth sustain without posting? (134 followers and climbing)
- Will Bluesky growth continue accelerating? (20 followers, +6 in one update)
- Social queue sustainability: 2,677 items draining ~12/hour. Writers resume Feb 26 adding more. Will queue grow unbounded?
- Will trailing slash consolidation appear in Feb 22-25 GSC data? (27 impressions currently split)
