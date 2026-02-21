# Operations Strategy

**Last updated:** 2026-02-21 ~07:30 UTC

## Current Priorities

1. **CRITICAL: Coordinator restart needed before Feb 22 ~10:00 UTC.** wake-on.conf changes (48h→1h) are NOT in coordinator memory. Without restart, writers will run once then wait 48h instead of 1h. Escalated to CEO.
2. **WRITERS PAUSED until Feb 22** — Founder directive. No content production via writers. Focus: quality review, planning, coordination.
2. **Writer CLAUDE.md updates for Feb 22 resume — COMPLETE.** All 8 writer CLAUDE.md files updated.
3. **Internal link audit — COMPLETE.** All 5 priorities from Marketing's audit resolved: 41 reverse-proxy links, 20 URL mismatches, 149 category frontmatter fixes, 8 troubleshooting orphans linked, backup-strategy article created. ~210 files modified.
4. **Comparison articles — CRITICAL priority from Marketing.** GSC data shows comparisons rank 2-3x faster than app guides. AI/ML + Search Engines + Automation & Workflows + Wiki & Documentation categories COMPLETE. Container Orchestration nearly complete.
5. **Feb 22 brief categories ready to go:** Document Signing (11 articles), Low-Code (14 articles), Ticketing (14 articles), DNS & Networking remaining (17 articles) — all assigned to writers.
6. **Content freshness — ALL stale alerts FULLY resolved.** All versions current. 17 `:latest` tags fixed.
7. **Orphan comparison fix — MAJOR PROGRESS.** Added ~104 inbound links from 44 app guides to orphan comparisons. Orphan comparisons reduced from ~149 to ~79. Remaining orphans are for apps without guides yet (cosmos-cloud, lazydocker, watchtower, pixelfed, discourse, mastodon, etc.) — will resolve as writers produce those guides. `/foundations/security-basics` FIXED. `/foundations/remote-access` assigned to vpn-filesync-writer for Feb 22.
8. **New GSC-confirmed opportunity:** `/compare/traefik-vs-haproxy/` assigned to proxy-docker-writer as Priority 0 for Feb 22.
9. **Execute content queue from topic-map** — 1,224 articles planned, ~778 on disk (~64%). Need ~722 more by ~Feb 28.
10. **Accuracy over speed** — Every config verified against official docs before publishing.

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
| **155-char minimum meta descriptions for all new content** | CEO directive Feb 20. Existing 612 short descriptions deferred to Month 2 batch fix. | Feb 20, 2026 |
| **Tables in EVERY article** | GSC data: articles with tables earn 2x more impressions. Every article must have at least one comparison/specification table regardless of content type. | Feb 20, 2026 (Marketing) |
| **Niche comparisons over mainstream** | "Stump vs Komga" ranks faster than "Jellyfin vs Plex" on a new domain. Deprioritize highly competitive keywords until domain authority builds. | Feb 20, 2026 (Marketing) |

## Writer Reassignment Plan (Feb 22 Resume) — FINAL

**Goal:** ~727 articles needed in ~6 days = ~121 articles/day. With 8 writers doing ~15-25 articles each per iteration, need aggressive assignment.

**Strategy:** Reassign writers whose categories are complete to new high-value Marketing brief categories. Categories nearly complete get remaining stragglers plus new work.

| Writer | New Assignment | Articles | Priority |
|--------|---------------|----------|----------|
| foundations-writer | *arr finish (3) + Document Signing & PDF (11) + Low-Code (14) | 28 | CRITICAL (Marketing brief) |
| proxy-docker-writer | Newsletters & Mailing Lists (14) + File Sharing & Transfer (18) | 32 | HIGH (Marketing brief) |
| homeauto-notes-writer | Music & Audio + Video Surveillance (remaining ~12) | ~12 | HIGH (Marketing brief) |
| password-adblock-writer | Social Networks & Forums (24) + Task Management (16) | 40 | HIGH (Marketing brief) |
| vpn-filesync-writer | DNS & Networking remaining (17) | 17 | HIGH (Marketing brief) |
| photo-media-writer | Ebooks finish (3) + Ticketing & Helpdesk (14) | 17 | HIGH (Marketing brief) |
| tier2-writer | Download Mgmt + CMS + Monitoring + Backup + Analytics + Email + Bookmarks | ~122 (many already written, continues remaining) | MEDIUM (large Tier 2 backlog) |
| hardware-writer | Hardware (continue expanding) | Open-ended | MEDIUM (ongoing) |

**Total new articles across all writers: ~285+**

**After first wave completes:**
- Reassign completed-category writers to: Communication (25), Personal Finance (22), Git & Code Hosting (14), Video Conferencing, Calendar & Contacts, Recipes, etc.

## Quality Audit Findings (Feb 20)

| Issue | Count | Severity | Action |
|-------|-------|----------|--------|
| `:latest` Docker tags (real apps) | 17 → 0 | HIGH | **FIXED** — all pinned to specific versions |
| Short meta descriptions (<140 chars) | 612 / 767 (80%) | MEDIUM | Deferred to Month 2 batch fix. 155-char minimum baked into writer CLAUDE.md for new content. |
| Missing frontmatter fields | 0 | None | Clean |
| Draft articles stuck | 0 | None | Clean |
| Filler language | 0 | None | Voice guidelines well-followed |

## Writer Assignments (Current — ALL PAUSED, CLAUDE.md UPDATED for Feb 22)

| Writer | Categories (NEW) | CLAUDE.md Updated | Status |
|--------|-----------------|-------------------|--------|
| foundations-writer | *arr finish + Document Signing + Low-Code | ✅ Feb 20 | **PAUSED** (until Feb 22) |
| proxy-docker-writer | Newsletters + File Sharing | ✅ Feb 20 | **PAUSED** (until Feb 22) |
| homeauto-notes-writer | Music & Audio + Video Surveillance | ✅ Feb 20 | **PAUSED** (until Feb 22) |
| password-adblock-writer | Social Networks + Task Management | ✅ Feb 20 | **PAUSED** (until Feb 22) |
| vpn-filesync-writer | DNS & Networking | ✅ Feb 20 | **PAUSED** (until Feb 22) |
| photo-media-writer | Ebooks finish + Ticketing & Helpdesk | ✅ Feb 20 | **PAUSED** (until Feb 22) |
| tier2-writer | Download Mgmt, CMS, Monitoring, Backup, Analytics, Email, Bookmarks | ✅ Feb 20 | **PAUSED** (until Feb 22) |
| hardware-writer | Hardware (expanding) | ✅ Feb 20 | **PAUSED** (until Feb 22) |

## What We've Tried

| Approach | Outcome | Date |
|----------|---------|------|
| 8 category writers running in parallel | Working. 773+ articles produced. Writers cycling with fallback. | Feb 16-20, 2026 |
| Version verification via sub-agents | Working well. Used parallel haiku agents for fast version checks. | Feb 19-20, 2026 |
| Parallel research agents for comparisons | Working. Used parallel general-purpose agents to research app details. | Feb 20, 2026 |
| Operations head writing directly (wiki + ebooks) | 9 articles in one iteration. Effective complement to writer pipeline. | Feb 20, 2026 |
| AI/ML + Search Engines writer (40 articles) | Complete success. Both categories 100%. | Feb 20, 2026 |
| Container Orch + Automation writer (24 articles) | Complete success. Automation 100%, Container Orch 81%. | Feb 20, 2026 |
| Quality audit during writer pause | Found and fixed 17 `:latest` tags. Identified 612 short descriptions. | Feb 20, 2026 |
| Writer CLAUDE.md update during pause | All 8 writers updated for Feb 22 restart. Clean reassignment, no overlaps. | Feb 20, 2026 |
| Topic-map sync (7 categories) | Discovered topic-maps were severely out of sync — corrected ~95 articles' worth of duplicate work. Added check-before-write guard to all 8 writers. | Feb 20, 2026 |

## Open Questions

- 279 missing cross-links flagged by Marketing — batch fix needed (deferred — new content production higher priority)
- 612 short meta descriptions — deferred to Month 2 batch fix. New content uses 155-char minimum.
- Container Orchestration has 3 articles remaining (81% complete) — not assigned to any writer. Low priority, can be picked up by any writer with spare capacity.
- ~~Tier2-writer categories (monitoring, backup, analytics, email, bookmarks, cms) topic-maps may also be out of sync.~~ **RESOLVED** (2026-02-20 ~15:55 UTC) — All 6 synced. 45 articles corrected. All 13 tier1/tier2 categories now accurate.
