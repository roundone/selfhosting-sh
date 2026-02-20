# CEO Strategy

**Last updated:** 2026-02-20 00:30 UTC

## Current Priorities

1. **Content velocity** — 563 articles in 5 days. Target 5,000 by Feb 28 requires ~554/day. Current pace is ~50/day after Day 1 burst. This is the #1 strategic risk. Need to either dramatically increase writer throughput or accept a revised month-1 target.
2. **Social posting ramp-up** — Queue system live, X + Bluesky posting. Marketing directed to flood the queue. Need Mastodon/Dev.to/Reddit credentials for broader reach.
3. **Google indexing momentum** — 9 pages with impressions on day 4. Best position 4.5. This validates the content + SEO approach. Keep feeding Google more content.
4. **Technology task backlog** — Search fix, Playwright MCP, status dashboard all outstanding from founder directives. Need status updates.
5. **Topic map expansion** — 1,224 planned, need 2,000+. Marketing continuing to expand.

## Standing Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| Rate-limit proxy at 0.5 req/sec | Prevents Claude Max 5-hour window exhaustion | Feb 16, 2026 |
| Event-driven coordinator (not looping services) | Eliminates idle API waste; agents run only when triggered | Feb 18, 2026 |
| Social posting via queue only | Founder directive — agents never call social APIs directly. bin/social-poster.js handles all posting. | Feb 19, 2026 |
| No affiliate disclosures until founder says otherwise | Premature disclosures damage trust. We have zero affiliate relationships. | Feb 19, 2026 |
| Marketing can queue social posts freely | HOLD lifted Feb 20. Queue handles rate limiting automatically. | Feb 20, 2026 |

## What We've Tried

| Approach | Outcome | Date |
|----------|---------|------|
| 11 looping tmux agents | 6,041 wasted error iterations when rate-limited → Haiku fallback crashes | Feb 16, 2026 |
| systemd persistent services per agent | Better than tmux but wasteful on idle agents | Feb 16-18, 2026 |
| Event-driven coordinator | Working well. Agents start on-demand. Social poster on 5-min timer. | Feb 18, 2026 |
| Marketing direct API posting | Replaced with queue system per founder directive. Prevents spam detection. | Feb 19, 2026 |

## Open Questions

- **5,000 article target feasibility** — Day 1 showed 374 articles in 12h at peak velocity. Days 2-5 dropped to ~50/day as focus shifted to quality (freshness, pillar pages). Is 5,000 achievable, or should we propose a revised target to the board?
- **Writer parallelism** — Currently relying on coordinator-managed writer agents. Could we increase throughput by spawning more writers during off-peak proxy hours?
- **Technology task completion** — Search fix, Playwright MCP, dashboard are open. Need status check next iteration.
- **When to request remaining social credentials again** — Already escalated Feb 16 and re-escalated. In board report Feb 20.
