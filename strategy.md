# CEO Strategy

**Last updated:** 2026-02-20 01:30 UTC

## Current Priorities

1. **Writer category reassignment** — 4 writers reassigned from completed categories to 8 high-priority uncovered categories (AI/ML, Search Engines, Social Networks, Task Management, Video Surveillance, Music & Audio, Container Orchestration, Automation & Workflows). Comparison articles prioritized per GSC data.
2. **Technology accountability** — Zero logged work since Feb 16. Three founder directives unstarted. CRITICAL escalation sent. Currently running with inbox-missed trigger. If this iteration produces nothing, will intervene directly.
3. **Content velocity recovery** — Coordinator v1.2 running with 3 concurrent writers. First post-restart articles expected within this hour. Target: 100-200 articles/day sustained.
4. **Month 1 target revision** — 5,000 articles is mathematically unreachable. Proposing 2,000 to the board. Infrastructure now supports it.
5. **Social posting momentum** — Queue system healthy (1,715 posts). X + Bluesky posting at rate limits. Need remaining 5 platform credentials.
6. **Google indexing momentum** — 9 pages with impressions on day 4. 2 page-1 keywords. Comparison articles rank fastest — all writer reassignments lead with comparisons.

## Standing Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| Rate-limit proxy at 0.5 req/sec | Prevents Claude Max 5-hour window exhaustion | Feb 16, 2026 |
| Event-driven coordinator (not looping services) | Eliminates idle API waste; agents run only when triggered | Feb 18, 2026 |
| Social posting via queue only | Founder directive — agents never call social APIs directly. bin/social-poster.js handles all posting. | Feb 19, 2026 |
| No affiliate disclosures until founder says otherwise | Premature disclosures damage trust. We have zero affiliate relationships. | Feb 19, 2026 |
| Marketing can queue social posts freely | HOLD lifted Feb 20. Queue handles rate limiting automatically. | Feb 20, 2026 |
| Max 3 concurrent writers | Memory safety on 4GB VPS. 3 writers × ~300MB + core agents fits. | Feb 20, 2026 |
| Writers on 30-minute fallback | Content velocity requires frequent writer iterations, not 8h default. | Feb 20, 2026 |
| Comparison articles first | GSC data shows comparisons rank 2-3x faster than app guides. All writer CLAUDE.md files prioritize comparisons. | Feb 20, 2026 |
| Reassign idle writers to uncovered categories | 4 writers on completed categories = wasted capacity. 59 of 78 categories have zero content. | Feb 20, 2026 |

## What We've Tried

| Approach | Outcome | Date |
|----------|---------|------|
| 11 looping tmux agents | 6,041 wasted error iterations when rate-limited → Haiku fallback crashes | Feb 16, 2026 |
| systemd persistent services per agent | Better than tmux but wasteful on idle agents | Feb 16-18, 2026 |
| Event-driven coordinator v1.1 | Fixed core agent management but BROKE writer pipeline (didn't discover sub-agents) | Feb 18, 2026 |
| Marketing direct API posting | Replaced with queue system per founder directive. Prevents spam detection. | Feb 19, 2026 |
| Coordinator v1.2 with writer discovery | **RUNNING.** Recursive agent discovery + per-agent fallback + concurrency limit. Writers active. | Feb 20, 2026 |
| Static writer category assignments | Writers on completed categories sat idle for days. Now reassigned dynamically. | Feb 16-20, 2026 |

## Open Questions

- **Technology viability** — If Technology doesn't produce work in its current iteration, need direct intervention (update CLAUDE.md, spawn specialist, or fix search directly).
- **Month 1 target** — Proposing 2,000 articles (achievable) instead of 5,000 (not achievable). Included in Feb 20 board report.
- **When to request remaining social credentials again** — In every board report until resolved.
- **Operations crash rate** — 19/20 iterations failing with code=1. Need to investigate if this is a CLAUDE.md issue, rate limiting, or something else. Lower priority since writers are the main production engine.
- **Topic map expansion** — Current map has 1,224 articles. With 59 uncovered categories, Marketing needs to continue expanding. Writers will exhaust their assigned articles in ~5-7 days at target velocity.
