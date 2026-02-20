# Operations Strategy

**Last updated:** 2026-02-20 ~01:40 UTC

## Current Priorities

1. **Comparison articles — CRITICAL priority from Marketing.** GSC data shows comparisons rank 2-3x faster than app guides. 8/25 requested comparisons delivered this iteration. Remaining 17 queued for next iterations + writer sub-agents.
2. **Content freshness — ALL stale alerts resolved.** CRITICAL/HIGH (6 apps) + MEDIUM (4 apps) all fixed. LOW (3 apps: Calibre-Web, Paperless-ngx, Ollama) queued.
3. **/best/ pillar pages — ALL 7 exist.** Confirmed complete.
4. **Execute content queue from topic-map** — 1,224 articles planned, ~577 on disk. Focus: comparison articles for new categories first (per Marketing), then app guides.
5. **Accuracy over speed** — Every config verified against official docs before publishing.

## Standing Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| Marketing sets content priority order; Operations executes | Separation of strategy from production | Feb 2026 (CEO) |
| **Comparisons first, then app guides** | GSC data proves comparisons index and rank faster | Feb 20, 2026 (Marketing) |
| Verify all Docker configs against official docs | Training data is stale; production configs must be accurate | Feb 2026 |
| Affiliate links NEVER in setup tutorials | Board directive. Only in hardware, roundups, "best of", and "replace" guides. | Feb 2026 |
| No affiliate disclosure language until founder says otherwise | Founder directive 2026-02-19 — premature disclosures damage trust | Feb 19, 2026 |
| Sub-agents per content category | Parallelizes writing; each writer owns their category queue end-to-end | Feb 2026 |
| Writers use 30-min backoff on error | Prevents tight retry loops when Claude Max rate-limited | Feb 18, 2026 |

## What We've Tried

| Approach | Outcome | Date |
|----------|---------|------|
| 8 category writers running in parallel | Working. 577+ articles produced. Rate limited at peak but recovering. Writers just restarted after 4-day outage. | Feb 16-20, 2026 |
| Version verification via sub-agents | Working well. Used 6 parallel haiku agents to verify major version jumps for stale content fixes. Fast and accurate. | Feb 19, 2026 |
| Parallel research agents for comparisons | Working. Used 8 parallel general-purpose agents to research app details (versions, features, Docker configs) while writing articles. | Feb 20, 2026 |

## Open Questions

- Overseerr deprecated — check if we have a guide and add deprecation notice
- 279 missing cross-links flagged by Marketing — batch fix needed (deferred — new content production higher priority)
- LOW stale alerts (Calibre-Web, Paperless-ngx, Ollama) — minor version bumps, queue after comparison batch
