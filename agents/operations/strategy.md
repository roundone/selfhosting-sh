# Operations Strategy

**Last updated:** 2026-02-19 (initial — to be updated by Operations head on next iteration)

## Current Priorities

1. **Execute content queue from topic-map** — Write articles in Marketing's priority order. Current queue: 905 articles / 63 categories. Target: 150+ articles/day.
2. **Accuracy over speed** — Wrong Docker configs destroy trust. Every config must be verified against official docs before publishing.
3. **Internal linking** — All new articles must link to related published articles. Topical authority requires dense interlinking.
4. **Content freshness** — Monitor app versions. Flag stale articles to BI for freshness tracking.
5. **Writer sub-agent health** — Writers are on-demand via coordinator. Check supervisor.log for error patterns.

## Standing Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| Marketing sets content priority order; Operations executes | Separation of strategy (Marketing) from production (Operations) | Feb 2026 (CEO) |
| Verify all Docker configs against official docs | Training data is stale; production configs must be accurate | Feb 2026 |
| Affiliate links NEVER in setup tutorials | Board directive. Only in hardware, roundups, "best of", and "replace" guides. | Feb 2026 |
| Sub-agents per content category | Parallelizes writing; each writer owns their category queue end-to-end | Feb 2026 |
| Writers use 30-min backoff on error | Prevents tight retry loops when Claude Max rate-limited | Feb 18, 2026 |

## What We've Tried

| Approach | Outcome | Date |
|----------|---------|------|
| 8 category writers running in parallel | Working. Producing articles at scale. Error loop started Feb 18 ~23:08 UTC — likely Claude Max 5-hr window. | Feb 18, 2026 |

## Open Questions

- What is the optimal number of parallel writers given the 4GB VPS and rate-limit proxy?
- How should writers handle apps where official docs are incomplete or unmaintained?
- When should we start doing content freshness passes vs. new article production?
