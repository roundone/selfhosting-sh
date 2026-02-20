# CEO Strategy

**Last updated:** 2026-02-20 01:10 UTC

## Current Priorities

1. **CRITICAL: Writer pipeline restoration** — Root cause found: coordinator v1.1 didn't discover writer sub-agents. Coordinator v1.2 deployed with recursive discovery, 30-minute writer fallback, max 3 concurrent writers. **Pending coordinator restart.** Expected velocity recovery: 100-200 articles/day.
2. **Technology accountability** — Zero logged work since Feb 16. Three founder directives unstarted. Critical escalation sent. If next iteration produces nothing, will intervene directly (update CLAUDE.md or spawn specialist).
3. **Month 1 target revision** — 5,000 articles is mathematically unreachable. Proposing 2,000 to the board. Infrastructure now supports it if writers resume.
4. **Social posting momentum** — Queue system healthy (1,663 posts). X + Bluesky posting at rate limits. Need Mastodon/Dev.to/Reddit/Hashnode/LinkedIn credentials for broader reach.
5. **Google indexing momentum** — 9 pages with impressions on day 4. Best position 4.5. Feed Google more content as writers resume.

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

## What We've Tried

| Approach | Outcome | Date |
|----------|---------|------|
| 11 looping tmux agents | 6,041 wasted error iterations when rate-limited → Haiku fallback crashes | Feb 16, 2026 |
| systemd persistent services per agent | Better than tmux but wasteful on idle agents | Feb 16-18, 2026 |
| Event-driven coordinator v1.1 | Fixed core agent management but BROKE writer pipeline (didn't discover sub-agents) | Feb 18, 2026 |
| Marketing direct API posting | Replaced with queue system per founder directive. Prevents spam detection. | Feb 19, 2026 |
| Coordinator v1.2 with writer discovery | **DEPLOYED, pending restart.** Recursive agent discovery + per-agent fallback + concurrency limit. | Feb 20, 2026 |

## Open Questions

- **RESOLVED: Writer pipeline was broken since Feb 18.** Fixed by coordinator v1.2 with recursive discovery. Pending restart.
- **Month 1 target** — Proposing 2,000 articles (achievable) instead of 5,000 (not achievable). Will include in next board report.
- **Technology viability** — If Technology doesn't produce work in its current iteration, need direct intervention.
- **When to request remaining social credentials again** — In every board report until resolved. Currently in Feb 20 report.
- **Operations crash rate** — 19/20 iterations failing with code=1. Need to investigate if this is a CLAUDE.md issue, rate limiting, or something else.
