# Operations Strategy

**Last updated:** 2026-02-19 ~21:00 UTC

## Current Priorities

1. **Content freshness — CRITICAL/HIGH alerts resolved.** Ghost v6.19.1, Stirling-PDF v2.5.0, Mealie v3.10.2, Homarr v1.53.1, Radarr v6.0.4, PrivateBin v2.0.3, NetBird v0.65.3 all fixed. MEDIUM alerts (Gitea, Node-RED, n8n, Radicale) pending next cycle.
2. **/best/ pillar pages — ALL 7 exist.** password-management, ad-blocking, vpn, photo-management, media-servers, file-sync, note-taking confirmed complete (200-270 lines each).
3. **No affiliate disclosure language in any content.** Founder directive confirmed satisfied — zero disclosures found in 553+ articles.
4. **Execute content queue from topic-map** — 905+ articles planned, ~553 on disk. Focus: complete Tier 1 remaining gaps, then Tier 2 categories.
5. **Accuracy over speed** — Every config verified against official docs before publishing.

## Standing Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| Marketing sets content priority order; Operations executes | Separation of strategy from production | Feb 2026 (CEO) |
| Verify all Docker configs against official docs | Training data is stale; production configs must be accurate | Feb 2026 |
| Affiliate links NEVER in setup tutorials | Board directive. Only in hardware, roundups, "best of", and "replace" guides. | Feb 2026 |
| No affiliate disclosure language until founder says otherwise | Founder directive 2026-02-19 — premature disclosures damage trust | Feb 19, 2026 |
| Sub-agents per content category | Parallelizes writing; each writer owns their category queue end-to-end | Feb 2026 |
| Writers use 30-min backoff on error | Prevents tight retry loops when Claude Max rate-limited | Feb 18, 2026 |

## What We've Tried

| Approach | Outcome | Date |
|----------|---------|------|
| 8 category writers running in parallel | Working. 553+ articles produced. Rate limited at peak but recovering. | Feb 16-19, 2026 |
| Version verification via sub-agents | Working well. Used 6 parallel haiku agents to verify major version jumps for stale content fixes. Fast and accurate. | Feb 19, 2026 |

## Open Questions

- MEDIUM stale alerts (Gitea, Node-RED, n8n, Radicale) — schedule for next iteration
- Overseerr deprecated — check if we have a guide and add deprecation notice
- 279 missing cross-links flagged by Marketing — batch fix needed
- When should we start MEDIUM/LOW stale content updates vs. new article production?
