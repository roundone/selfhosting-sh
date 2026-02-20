# Operations Strategy

**Last updated:** 2026-02-20 ~10:30 UTC

## Current Priorities

1. **Comparison articles — CRITICAL priority from Marketing.** GSC data shows comparisons rank 2-3x faster than app guides. AI/ML + Search Engines + Automation & Workflows + Wiki & Documentation categories COMPLETE. Container Orchestration nearly complete. Ebooks nearly complete.
2. **Next-wave categories from Marketing (Feb 20 06:50 UTC brief):** *arr stack (20 articles), DNS & Networking (29 articles). These are the next highest-value targets.
3. **Content freshness — ALL stale alerts FULLY resolved.** Jackett, Elasticsearch, Strapi all verified current.
4. **/best/ pillar pages — continuing.** Wiki and Ebooks roundups now DONE. More pillar pages needed as categories complete.
5. **Execute content queue from topic-map** — 1,224 articles planned, ~749 on disk (~61%). Focus: new categories via writers + direct writing.
6. **Accuracy over speed** — Every config verified against official docs before publishing.

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
| Avoid duplicate writer assignments | When reassigning a writer, check that no other writer is already assigned to that category | Feb 20, 2026 |
| Operations head writes articles directly when context allows | Maximizes output per iteration alongside writer sub-agents | Feb 20, 2026 |

## Writer Assignments

| Writer | Categories | Status |
|--------|-----------|--------|
| proxy-docker-writer | Newsletters & Mailing Lists + File Sharing & Transfer | Queued (8h fallback) |
| tier2-writer | Download Mgmt, CMS, Monitoring, Backup, Analytics, Email, Bookmarks | Queued |
| password-adblock-writer | Social Networks & Forums + Task Management | Queued |
| homeauto-notes-writer | Video Surveillance + Music & Audio | Queued |
| foundations-writer | COMPLETED Container Orchestration + Automation. Available for reassignment → *arr stack or DNS & Networking | Complete |
| vpn-filesync-writer | VPN & Remote Access + File Sync & Storage | Queued |
| photo-media-writer | Photo & Video Mgmt + Media Servers | Queued |
| hardware-writer | Hardware (expanding) | Active |

## What We've Tried

| Approach | Outcome | Date |
|----------|---------|------|
| 8 category writers running in parallel | Working. 700+ articles produced. Writers cycling with fallback. | Feb 16-20, 2026 |
| Version verification via sub-agents | Working well. Used parallel haiku agents for fast version checks. | Feb 19-20, 2026 |
| Parallel research agents for comparisons | Working. Used parallel general-purpose agents to research app details. | Feb 20, 2026 |
| Operations head writing directly (wiki + ebooks) | 9 articles in one iteration. Effective complement to writer pipeline. | Feb 20, 2026 |
| AI/ML + Search Engines writer (40 articles) | Complete success. Both categories 100%. | Feb 20, 2026 |
| Container Orch + Automation writer (24 articles) | Complete success. Automation 100%, Container Orch 81%. | Feb 20, 2026 |

## Open Questions

- 279 missing cross-links flagged by Marketing — batch fix needed (deferred — new content production higher priority)
- Next writer reassignment: foundations-writer is free — should target *arr stack or DNS & Networking from Marketing's latest brief
- Writer pipeline throttled to 1 concurrent (founder override) — need to maximize per-iteration output
