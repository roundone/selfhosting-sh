# Operations Strategy

**Last updated:** 2026-02-21 ~10:30 UTC

## Current Priorities

1. **WRITERS PAUSED until Feb 26 6PM UTC** — Founder directive (extended from Feb 22). 1 writer limit on restart. wake-on.conf already set to 130h fallback. Coordinator restart scheduled Feb 26 18:00 UTC via `at` job. Do NOT reset wake-on.conf before Feb 26.
2. **Only ~70 articles needed** — 780 on disk, 850 target (revised from 1,500). Focus on highest-value content: niche comparisons, hardware guides, replace articles.
3. **First writer on Feb 26: `tier2-writer`** — Covers most categories (Download Mgmt, CMS, Monitoring, Backup, Analytics, Email, Bookmarks). Produces niche comparisons across many categories for maximum SEO breadth. Alternative: `password-adblock-writer` (Social Networks + Task Management niche comparisons).
4. **Writer CLAUDE.md updates — COMPLETE.** All 8 writer CLAUDE.md files updated for reassignment.
5. **Internal link audit — COMPLETE.** All 5 priorities resolved. ~210 files modified.
6. **Comparison articles — CRITICAL priority from Marketing.** GSC data shows comparisons rank 2-3x faster. AI/ML + Search Engines + Automation & Workflows + Wiki & Documentation COMPLETE.
7. **Content freshness — ALL stale alerts FULLY resolved.** All versions current.
8. **Orphan comparison fix — NEARLY COMPLETE.** Reduced from ~149 to ~49 (est). Added ~55 new inbound links across ~30 app guides this iteration. Remaining orphans are for apps without published guides (discourse, mastodon, pixelfed, etc.).
9. **During extended pause (Feb 21-26):** Continue quality review, meta description optimization, orphan link fixes. Do NOT produce content via writers.
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

## Writer Restart Plan (Feb 26 6PM UTC Resume) — REVISED

**Goal:** ~70 articles needed (780 on disk, 850 target). Only 1 writer runs at a time (maxWriterConcurrent: 1). Focus on highest SEO-value content per article.

**Strategy:** Start with the writer that maximizes niche comparison output. Only 1 writer at a time means we must sequence carefully. Priority: niche comparisons > hardware > replace articles > app guides.

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

## Writer Assignments (Current — ALL PAUSED until Feb 26 6PM UTC, 1 writer limit on restart)

| Writer | Categories (NEW) | CLAUDE.md Updated | Restart Order |
|--------|-----------------|-------------------|---------------|
| tier2-writer | Download Mgmt, CMS, Monitoring, Backup, Analytics, Email, Bookmarks | ✅ Feb 20 | **1st** — most categories, niche comparison breadth |
| password-adblock-writer | Social Networks + Task Management | ✅ Feb 20 | 2nd — niche comparisons (discourse-vs-flarum, etc.) |
| proxy-docker-writer | Newsletters + File Sharing + traefik-vs-haproxy | ✅ Feb 20 | 3rd — GSC-confirmed opportunity |
| foundations-writer | *arr finish + Document Signing + Low-Code | ✅ Feb 20 | 4th |
| homeauto-notes-writer | Music & Audio + Video Surveillance | ✅ Feb 20 | 5th |
| vpn-filesync-writer | DNS & Networking | ✅ Feb 20 | 6th |
| photo-media-writer | Ebooks finish + Ticketing & Helpdesk | ✅ Feb 20 | 7th |
| hardware-writer | Hardware (expanding) | ✅ Feb 20 | 8th |

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
