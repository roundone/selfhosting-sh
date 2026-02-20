## Current Phase: Launch — Day 5 Operations
## Last Updated: 2026-02-20 09:55 UTC

## Content
- **Total articles on disk: 759** (197 apps + 260 compare + 105 foundations + 110 hardware + 54 replace + 23 best + 7 troubleshooting)
- In progress: Hardware writer active (1 of 1 writer slot). Operations processing writer-complete event for container-orch + automation.
- **Coordinator v2.0 running** — concurrency limits, memory gate, git safety, stagger, config-driven
- **Writer pipeline THROTTLED** — Founder override: max 1 concurrent writer (was 4), 8h fallback (was 1h). Only 1 writer at a time.
- Velocity: +108 articles today (container-orch/automation writer produced 24, hardware writer active and producing ~19 more since last check).
- Target: 1,500+ articles by end of Month 1 (revised from 5,000 by board approval 2026-02-20; 5,000 target moves to Month 2). Need ~741 more articles by Feb 28 (~93/day for 8 days).
- Topic map: 1,224 planned across 78 categories, ~759 published = ~62% of topic map
- Categories with content: 22+ / 78 (AI/ML, Search Engines, Automation & Workflows COMPLETE; Container Orchestration 13/16)

## Category Completion Status
| Category | Done | Planned | % | Status |
|----------|------|---------|---|--------|
| Home Automation | 13 | 13 | 100% | COMPLETE |
| Foundations | 103 | 81 | 127% | COMPLETE (expanded) |
| Docker Management | 13 | 13 | 100% | COMPLETE |
| Reverse Proxy & SSL | 13 | 13 | 100% | COMPLETE |
| Password Management | 13 | 13 | 100% | COMPLETE |
| Hardware | 91+ | 25 | 364%+ | COMPLETE (expanding further) |
| Ad Blocking & DNS | 10 | 11 | 90% | Nearly complete |
| Note Taking & Knowledge | 17 | 21 | 80% | In progress |
| File Sync & Storage | 12 | 16 | 75% | In progress |
| VPN & Remote Access | 13 | 18 | 72% | In progress |
| Photo & Video Mgmt | 11 | 16 | 68% | In progress |
| Media Servers | 11 | 26 | 42% | In progress |
| **NEW: AI & Machine Learning** | 22 | 22 | 100% | **COMPLETE** |
| **NEW: Search Engines** | 18 | 18 | 100% | **COMPLETE** |
| **NEW: Social Networks** | ~3 | 24 | ~13% | Writer queued |
| **NEW: Task Management** | ~2 | 16 | ~13% | Writer queued |
| **NEW: Video Surveillance** | ~2 | 14 | ~14% | Writer queued |
| **NEW: Music & Audio** | 0 | 22 | 0% | Writer queued |
| **NEW: Container Orchestration** | 13 | 16 | 81% | Nearly complete (writer done, 3 articles remaining) |
| **NEW: Automation & Workflows** | 15 | 15 | 100% | **COMPLETE** |

## Writer Assignments (updated 2026-02-20 09:55 UTC)
| Writer | Categories | Status |
|--------|-----------|--------|
| proxy-docker-writer (→ newsletters-filesharing) | Newsletters & Mailing Lists + File Sharing & Transfer | Queued (8h writer fallback) |
| tier2-writer | Download Mgmt, CMS, Monitoring, Backup, Analytics, Email, Bookmarks | Queued (8h writer fallback) |
| vpn-filesync-writer | VPN & Remote Access + File Sync & Storage | Queued (8h writer fallback) |
| foundations-writer (→ containers-automation) | Container Orchestration + Automation & Workflows | **COMPLETE** (24 articles). Queued for reassignment. |
| hardware-writer | Hardware (expanding) | **ACTIVE** (1 of 1 writer slot, started 09:47 UTC) |
| homeauto-notes-writer (→ surveillance-music) | Video Surveillance, Music & Audio | Queued (8h writer fallback) |
| password-adblock-writer (→ social-task) | Social Networks & Forums + Task Management | Queued (8h writer fallback) |
| photo-media-writer | Photo & Video Mgmt + Media Servers | Queued (8h writer fallback) |

## Site
- Status: LIVE
- URL: https://selfhosting.sh (custom domain WORKING — HTTP/2 200, SSL active)
- Fallback URL: https://selfhosting-sh.pages.dev
- Framework: Astro 5.17.2
- Auto-deploy: ACTIVE (systemd timer, every 30 min — replaced OOM-crashed loop process Feb 20)
- Cloudflare Pages project: selfhosting-sh
- Custom domains: selfhosting.sh (ACTIVE), www.selfhosting.sh (ACTIVE)
- SSL: ACTIVE
- FAQPage schema: IMPLEMENTED
- OG image generation: IMPLEMENTED
- Technical SEO: 100% COMPLETE
- **Search: FIXED** (CEO fixed Feb 20 05:50 UTC — Pagefind index/ renamed to idx/ for CF Pages compatibility)
- **Board Portal: LIVE** at http://5.161.102.207:8080 (token auth, 8 pages, systemd `selfhosting-portal`; replaced old dashboard)
- **Post-deploy QA: INTEGRATED** (21 checks, all passing)

## SEO & Marketing
- GSC property: sc-domain:selfhosting.sh (domain-level, siteFullUser permission)
- **GSC: sitemap resubmitted Feb 20 05:50 UTC** (should pick up 604 articles on next Google crawl)
- **9 pages showing search impressions** (as of Feb 19):
  - `/hardware/proxmox-hardware-guide/` — 8 impressions, position 6.9
  - `/compare/freshrss-vs-miniflux/` — 4 impressions, position 4.5
  - `/foundations/reverse-proxy-explained/` — 4 impressions, position 7.2
  - 6 more pages with 1-2 impressions each
- **2 page-1 keywords confirmed:** "freshrss vs miniflux" (pos 3.0), "miniflux vs freshrss" (pos 5.0)
- GSC sitemap warnings: 0 (resolved)
- Topic map: 1,224 articles across 78 categories

## Social Media
- **Queue system: LIVE** (bin/social-poster.js, 5-min timer via coordinator)
- Queue: **1,918 items** (draining slowly — 2 platforms active)
- **First follower on Bluesky!** (1 follower as of 06:18 UTC)
- **X duplicate content fix WORKING** — social-poster.js now skips 403 duplicates and posts next item (fixed 09:10 UTC)
- Platform status:
  - **X (Twitter): LIVE** — posting every 15 min. Duplicate skip fix confirmed working at 09:18 UTC.
  - **Bluesky: LIVE** — posting every 10 min
  - Mastodon: BLOCKED (credentials PENDING)
  - Reddit: BLOCKED (credentials PENDING)
  - Dev.to: BLOCKED (credentials PENDING)
  - Hashnode: BLOCKED (credentials PENDING)
  - LinkedIn: BLOCKED (API approval PENDING)

## Revenue & Finance
- Monthly revenue: $0
- Active revenue sources: none (affiliate signups pending — Requires: human)
- Monthly expenses: ~$15.83
- P&L (February 2026): -$15.83

## Budget — February 2026
- API spend: covered by DV allocation
- Tools/services: $0 / $200 (0% utilized)

## Execution Environment
- **VPS: UPGRADED** — 7.7GB total RAM (was 3.8GB), ~6.3GB available
- VPS uptime: rebooted ~05:14 UTC Feb 20 (4h40m uptime)
- **Infrastructure: Coordinator v2.0 RUNNING** (config-driven, concurrency limits, memory gate)
  - selfhosting-coordinator.service: ACTIVE (v2.0, 13 agents discovered + IR pending next restart)
  - selfhosting-proxy.service: ACTIVE
  - selfhosting-watchdog.service: ACTIVE
  - 4 agents active (CEO, operations, hardware-writer, technology)
  - Memory: ~6.4GB available / 7.7GB total — healthy
  - Load: 0.02 — minimal
- Rate-limiting proxy: ACTIVE at localhost:3128
- Social poster: ACTIVE (running every 5 min via coordinator)

## Coordinator Config (FOUNDER OVERRIDE 2026-02-20 ~09:13 UTC)
- maxTotalConcurrent: 4 (was 6, founder reduced)
- maxWriterConcurrent: 1 (was 4, founder reduced)
- writerFallbackHours: 8 (was 1, founder restored to conservative)
- deptFallbackHours: 8
- memoryMinFreeMb: 1200
- minIterationGapMinutes: 5
- **Note:** Founder explicitly overrode CEO's aggressive config. Commit: b882734 "Founder override: conservative config". CEO respects this decision.

## Agent Health
| Agent | Last Run | Errors | Status |
|-------|----------|--------|--------|
| CEO | 2026-02-20 10:10 | 0 | Running now |
| Operations | 2026-02-20 09:47 | 1 | Running (triggered by writer-complete event) |
| Technology | 2026-02-20 10:08 | 0 | Completed (deploy pipeline fix — systemd timer) |
| Marketing | 2026-02-20 06:56 | 0 | Idle (8h fallback) |
| BI & Finance | 2026-02-20 06:54 | 0 | Idle (8h fallback) |
| Investor Relations | — | — | Not yet discovered by coordinator (code fix staged) |
| proxy-docker-writer | 2026-02-20 07:57 | 0 | Queued (8h writer fallback, 1-writer limit) |
| tier2-writer | 2026-02-20 07:58 | 0 | Queued (8h writer fallback, 1-writer limit) |
| vpn-filesync-writer | 2026-02-20 06:21 | 0 | Queued (8h writer fallback, 1-writer limit) |
| foundations-writer | 2026-02-20 09:47 | 2 | **COMPLETE** (24 articles). Queued for next assignment. |
| hardware-writer | 2026-02-20 09:47 | 0 | **ACTIVE** (1 of 1 writer slot) |
| homeauto-notes-writer | 2026-02-20 02:13 | 2 | Backoff expired — waiting for 8h fallback |
| password-adblock-writer | 2026-02-20 02:13 | 2 | Backoff expired — waiting for 8h fallback |
| photo-media-writer | 2026-02-20 07:58 | 0 | Queued (8h writer fallback, 1-writer limit) |

## Blockers
- Social credentials PENDING for: Mastodon, Reddit, Dev.to, Hashnode, LinkedIn (Requires: human)
- GA4 API not enabled — BI cannot track traffic (Requires: human)
- Content velocity constrained — 740 articles vs 1,500 Month 1 target. Founder override limits writers to 1 concurrent with 8h fallback. ~95/day needed for 8 remaining days. At current throttle, this may be tight.
- Coordinator doesn't discover IR agent — code fix staged in coordinator.js, takes effect on next coordinator restart

## Founder Directives Status
1. Fix broken search → **FIXED by CEO** (Feb 20 05:50 UTC)
2. GA4 visitor stats → BI (blocked by API access)
3. Rate-limiting proxy awareness → Integrated ✓
4. systemd migration → COMPLETE ✓
5. Install Playwright MCP → **COMPLETE** (Feb 20 ~06:05 UTC — @playwright/mcp@0.0.68, Chromium installed, MCP config at ~/.claude/mcp.json)
6. Build status dashboard → **COMPLETE** (Feb 20 ~06:08 UTC — http://5.161.102.207:8080, systemd service selfhosting-dashboard)
7. Monitor API usage at 85% → Integrated ✓
8. Remove affiliate disclosures → COMPLETE ✓
9. Social posting architecture → COMPLETE ✓
10. Remove Marketing HOLD → COMPLETE ✓
11. Fix Technology discipline → **DONE by CEO** (Feb 20 06:20 UTC) — CLAUDE.md updated with mandatory discipline rules, inbox consolidated
12. Revise Month 1 target to 1,500 → **DONE** (Feb 20 09:10 UTC) — Scorecard updated in CLAUDE.md, all agent CLAUDE.md files, strategy.md, state.md
13. Human dependency audit → **DONE** (Feb 20 09:15 UTC) — `board/human-dependency-audit-2026-02-20.md` emailed to founder
14. Playwright-first policy → **DONE** (Feb 20 09:15 UTC) — Added as sacrosanct directive in all 5 department CLAUDE.md files
15. Create IR department → **DONE** (Feb 20 prior iteration) — agents/investor-relations/ created with CLAUDE.md, inbox, wake-on.conf
