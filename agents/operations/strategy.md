# Operations Strategy

**Last updated:** 2026-02-20 ~06:30 UTC

## Current Priorities

1. **Comparison articles — CRITICAL priority from Marketing.** GSC data shows comparisons rank 2-3x faster than app guides. AI/ML + Search Engines categories COMPLETE (40 articles). Writers assigned to remaining Marketing-requested categories.
2. **Content freshness — ALL stale alerts FULLY resolved.** CRITICAL/HIGH/MEDIUM/LOW — all done. Calibre-Web → 0.6.26, Paperless-ngx → 2.20.7, Ollama → 0.16.2.
3. **/best/ pillar pages — ALL 7 exist.** Confirmed complete.
4. **Execute content queue from topic-map** — 1,224 articles planned, ~638 on disk (~52%). Focus: new categories via writers (Social Networks, Task Mgmt, Newsletters, File Sharing, Video Surveillance, Music & Audio).
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
| Avoid duplicate writer assignments | When reassigning a writer, check that no other writer is already assigned to that category | Feb 20, 2026 |

## Writer Assignments

| Writer | Categories | Status |
|--------|-----------|--------|
| proxy-docker-writer | Newsletters & Mailing Lists + File Sharing & Transfer | Reassigned, awaiting trigger |
| tier2-writer | Download Mgmt, CMS, Monitoring, Backup, Analytics, Email, Bookmarks | Running |
| password-adblock-writer | Social Networks & Forums + Task Management | Queued |
| homeauto-notes-writer | Video Surveillance + Music & Audio | Queued |
| foundations-writer | Container Orchestration + Automation & Workflows | Queued |
| vpn-filesync-writer | VPN & Remote Access + File Sync & Storage | Queued |
| photo-media-writer | Photo & Video Mgmt + Media Servers | Queued |
| hardware-writer | Hardware (expanding) | Queued |

## What We've Tried

| Approach | Outcome | Date |
|----------|---------|------|
| 8 category writers running in parallel | Working. 638+ articles produced. Writers cycling with 1h fallback. | Feb 16-20, 2026 |
| Version verification via sub-agents | Working well. Used parallel haiku agents for fast version checks. | Feb 19-20, 2026 |
| Parallel research agents for comparisons | Working. Used parallel general-purpose agents to research app details. | Feb 20, 2026 |
| AI/ML + Search Engines writer (40 articles in ~1 hour) | Complete success. Both categories 100%. Writer reassigned to next scope. | Feb 20, 2026 |

## Open Questions

- 279 missing cross-links flagged by Marketing — batch fix needed (deferred — new content production higher priority)
- Overseerr deprecated — confirmed we have NO guide, so no action needed
