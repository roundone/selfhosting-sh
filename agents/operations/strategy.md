# Operations Strategy

**Last updated:** 2026-02-20 ~12:00 UTC

## Current Priorities

1. **WRITERS PAUSED until Feb 22** — Founder directive. No content production via writers. Focus: quality review, planning, coordination.
2. **Quality audit — in progress.** Found and fixed 17 articles with `:latest` Docker tags. Found 612/767 articles with short meta descriptions (<140 chars, target 150-160). Zero filler language issues. Voice guidelines are well-followed.
3. **Comparison articles — CRITICAL priority from Marketing.** GSC data shows comparisons rank 2-3x faster than app guides. AI/ML + Search Engines + Automation & Workflows + Wiki & Documentation categories COMPLETE. Container Orchestration nearly complete.
4. **Next-wave categories from Marketing (Feb 20 06:50 UTC brief):** *arr stack (20 articles), DNS & Networking (29 articles). These are the next highest-value targets.
5. **Content freshness — ALL stale alerts FULLY resolved.** Jackett, Elasticsearch, Strapi all verified current. 17 `:latest` tags fixed.
6. **/best/ pillar pages — continuing.** Wiki and Ebooks roundups DONE. More pillar pages needed as categories complete.
7. **Execute content queue from topic-map** — 1,224 articles planned, ~759 on disk (~62%). Need ~741 more by ~Feb 28.
8. **Accuracy over speed** — Every config verified against official docs before publishing.

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

## Writer Reassignment Plan (Feb 22 Resume)

**Goal:** ~741 articles needed in ~6 days = ~124 articles/day. With 8 writers doing ~15-25 articles each per iteration, we need aggressive assignment.

**Strategy:** Assign writers to maximize category completions. Partially-done categories first (quick wins), then high-value Marketing priorities, then breadth across Tier 2.

| Writer | New Assignment | Articles | Priority |
|--------|---------------|----------|----------|
| foundations-writer | *arr stack (Media Organization) | 20 | CRITICAL (Marketing brief) |
| proxy-docker-writer | DNS & Networking + Newsletters & Mailing Lists | 29+14=43 | CRITICAL (Marketing brief) + HIGH |
| homeauto-notes-writer | Music & Audio + Video Surveillance | 22+14=36 | HIGH (Marketing brief) |
| password-adblock-writer | Social Networks & Forums + Task Management | 24+16=40 | HIGH (Marketing brief) |
| vpn-filesync-writer | VPN & Remote Access + File Sync & Storage (finish) | 5+4=9, then Ebooks finish (3) | HIGH (complete partial categories) |
| photo-media-writer | Photo & Video Mgmt + Media Servers (finish) | 5+15=20, then Note Taking (4) | HIGH (complete partial categories) |
| tier2-writer | Download Mgmt + CMS + Monitoring + Backup | 34+31+28+29=122 | MEDIUM (large Tier 2 backlog) |
| hardware-writer | Hardware (continue expanding) | Open-ended | MEDIUM (ongoing) |

**After first wave completes:**
- Reassign completed-category writers to: Email (32), Communication (25), Analytics (28), Personal Finance (22), Git & Code Hosting (14)
- Then: Project Management, Authentication & SSO, E-Commerce, Ticketing, Booking, etc.

## Quality Audit Findings (Feb 20)

| Issue | Count | Severity | Action |
|-------|-------|----------|--------|
| `:latest` Docker tags (real apps) | 17 → 0 | HIGH | **FIXED** — all pinned to specific versions |
| Short meta descriptions (<140 chars) | 612 / 767 (80%) | MEDIUM | Defer to batch fix after content velocity resumes. Descriptions average 120-139 chars (close but short of 150-160 target) |
| Missing frontmatter fields | 0 | None | Clean |
| Draft articles stuck | 0 | None | Clean |
| Filler language | 0 | None | Voice guidelines well-followed |

## Writer Assignments (Current — ALL PAUSED)

| Writer | Categories | Status |
|--------|-----------|--------|
| proxy-docker-writer | Newsletters & Mailing Lists + File Sharing & Transfer | **PAUSED** (until Feb 22) |
| tier2-writer | Download Mgmt, CMS, Monitoring, Backup, Analytics, Email, Bookmarks | **PAUSED** (until Feb 22) |
| password-adblock-writer | Social Networks & Forums + Task Management | **PAUSED** (until Feb 22) |
| homeauto-notes-writer | Video Surveillance + Music & Audio | **PAUSED** (until Feb 22) |
| foundations-writer | COMPLETED Container Orchestration + Automation. Reassigning to *arr stack. | **PAUSED** (until Feb 22) |
| vpn-filesync-writer | VPN & Remote Access + File Sync & Storage | **PAUSED** (until Feb 22) |
| photo-media-writer | Photo & Video Mgmt + Media Servers | **PAUSED** (until Feb 22) |
| hardware-writer | Hardware (expanding) | **PAUSED** (until Feb 22) |

## What We've Tried

| Approach | Outcome | Date |
|----------|---------|------|
| 8 category writers running in parallel | Working. 700+ articles produced. Writers cycling with fallback. | Feb 16-20, 2026 |
| Version verification via sub-agents | Working well. Used parallel haiku agents for fast version checks. | Feb 19-20, 2026 |
| Parallel research agents for comparisons | Working. Used parallel general-purpose agents to research app details. | Feb 20, 2026 |
| Operations head writing directly (wiki + ebooks) | 9 articles in one iteration. Effective complement to writer pipeline. | Feb 20, 2026 |
| AI/ML + Search Engines writer (40 articles) | Complete success. Both categories 100%. | Feb 20, 2026 |
| Container Orch + Automation writer (24 articles) | Complete success. Automation 100%, Container Orch 81%. | Feb 20, 2026 |
| Quality audit during writer pause | Found and fixed 17 `:latest` tags. Identified 612 short descriptions. | Feb 20, 2026 |

## Open Questions

- 279 missing cross-links flagged by Marketing — batch fix needed (deferred — new content production higher priority)
- 612 short meta descriptions — systemic issue. Need to decide: batch fix during pause or defer until after content velocity catches up. Leaning defer — descriptions work fine, just not SEO-optimal length.
- foundations-writer needs CLAUDE.md update for *arr stack assignment before Feb 22
- proxy-docker-writer needs CLAUDE.md update to add DNS & Networking
