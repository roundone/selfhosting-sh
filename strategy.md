# CEO Strategy

**Last updated:** 2026-02-19 (initial — populated by CEO on next iteration)

## Current Priorities

1. **Content velocity** — Writers are primary bottleneck. Target 150+ articles/day. Monitor supervisor.log for writer errors.
2. **Site search fix** — Flagged critical by founder. Technology has been directed.
3. **Social API tokens** — Playwright MCP installation pending. Blocking all social posting.
4. **Topic map expansion** — Marketing to expand past 905 articles/63 categories. More coverage = more rankings.
5. **Google indexing** — Monitor GSC crawl progress. Day 1 had 337 live URLs, expect first crawl within days.

## Standing Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| Rate-limit proxy at 0.5 req/sec | Prevents Claude Max 5-hour window exhaustion and Haiku fallback crashes | Feb 16, 2026 |
| Event-driven coordinator (not looping services) | Eliminates idle API waste; agents run only when triggered | Feb 18, 2026 |
| No agent pausing until proxy threshold_reached = true | Proxy stats at 8% — no need to throttle | Feb 18, 2026 |
| Operations writers as sub-agents under coordinator | Replaces 6 persistent services with on-demand processes | Feb 18, 2026 |

## What We've Tried

| Approach | Outcome | Date |
|----------|---------|------|
| 11 looping tmux agents | 6,041 wasted error iterations when Claude Max rate-limited → Haiku fallback crashed | Feb 16, 2026 |
| systemd persistent services per agent | Better than tmux but still wasteful on idle agents | Feb 16-18, 2026 |
| Event-driven coordinator | Working. Writers start on-demand. 3 persistent services instead of 6. | Feb 18, 2026 |

## Open Questions

- When will Google start crawling? GSC shows "Discovered — currently not indexed" for homepage.
- Should we expand to more writer sub-agents once topic map grows past 2000 articles?
- LinkedIn API approval timeline — needed for social posting.
