## Current Phase: Launch — Day 5 Operations
## Last Updated: 2026-02-20 09:35 UTC

## Content
- **Total articles on disk: 720** (up from 651 — writers produced ~69 new articles since last update)
- Content types with articles: apps (187), compare (260), foundations (104), hardware (90), replace (51), best (21), troubleshooting (7) = 720 total
- In progress: Operations head + Marketing + BI + writers active
- **Coordinator v2.0 running** — concurrency limits, memory gate, git safety, stagger, config-driven
- **Writer pipeline THROTTLED** — Founder override: max 1 concurrent writer (was 4), 8h fallback (was 1h). Only 1 writer at a time.
- Velocity: **SLOWED** by founder config override. ~69 articles produced in ~3 hours (09:00-09:35 UTC).
- Target: 1,500+ articles by end of Month 1 (revised from 5,000 by board approval 2026-02-20; 5,000 target moves to Month 2). Need ~780 more articles by Feb 28 (~98/day for 8 days).
- Topic map: 1,224 planned across 78 categories, ~720 published = ~59% of topic map
- Categories with content: 19+ / 78 (AI/ML + Search Engines now COMPLETE; many categories have ZERO content)

## Category Completion Status
| Category | Done | Planned | % | Status |
|----------|------|---------|---|--------|
| Home Automation | 13 | 13 | 100% | COMPLETE |
| Foundations | 103 | 81 | 127% | COMPLETE (expanded) |
| Docker Management | 13 | 13 | 100% | COMPLETE |
| Reverse Proxy & SSL | 13 | 13 | 100% | COMPLETE |
| Password Management | 13 | 13 | 100% | COMPLETE |
| Hardware | 74 | 25 | 296% | COMPLETE (expanded) |
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
| **NEW: Container Orchestration** | ~2 | 16 | ~13% | Writer active |
| **NEW: Automation & Workflows** | 0 | 15 | 0% | Writer queued |

## Writer Assignments (updated 2026-02-20 05:55 UTC)
| Writer | Categories | Status |
|--------|-----------|--------|
| proxy-docker-writer (→ newsletters-filesharing) | Newsletters & Mailing Lists + File Sharing & Transfer | Reassigned (awaiting next trigger) |
| tier2-writer | Download Mgmt, CMS, Monitoring, Backup, Analytics, Email, Bookmarks | Running |
| vpn-filesync-writer | VPN & Remote Access + File Sync & Storage | Queued (next slot) |
| foundations-writer (→ containers-automation) | Container Orchestration + Automation & Workflows | Queued |
| hardware-writer | Hardware (expanding) | Queued |
| homeauto-notes-writer (→ surveillance-music) | Video Surveillance, Music & Audio | Queued |
| password-adblock-writer (→ social-task) | Social Networks & Forums + Task Management | Queued |
| photo-media-writer | Photo & Video Mgmt + Media Servers | Queued |

## Site
- Status: LIVE
- URL: https://selfhosting.sh (custom domain WORKING — HTTP/2 200, SSL active)
- Fallback URL: https://selfhosting-sh.pages.dev
- Framework: Astro 5.17.2
- Auto-deploy: ACTIVE
- Cloudflare Pages project: selfhosting-sh
- Custom domains: selfhosting.sh (ACTIVE), www.selfhosting.sh (ACTIVE)
- SSL: ACTIVE
- FAQPage schema: IMPLEMENTED
- OG image generation: IMPLEMENTED
- Technical SEO: 100% COMPLETE
- **Search: FIXED** (CEO fixed Feb 20 05:50 UTC — Pagefind index/ renamed to idx/ for CF Pages compatibility)
- **Dashboard: LIVE** at http://5.161.102.207:8080 (systemd service, auto-refresh 30s)
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
- GSC sitemap warnings: 3 (Technology investigating)
- Topic map: 1,224 articles across 78 categories

## Social Media
- **Queue system: LIVE** (bin/social-poster.js, 5-min timer via coordinator)
- Queue: **1,920 items** (draining slowly — 2 platforms active)
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
- **VPS: UPGRADED** — 7.7GB total RAM (was 3.8GB), ~6.4GB available
- VPS uptime: rebooted ~05:14 UTC Feb 20
- **Infrastructure: Coordinator v2.0 RUNNING** (config-driven, concurrency limits, memory gate)
  - selfhosting-coordinator.service: ACTIVE (v2.0, 13 agents discovered)
  - selfhosting-proxy.service: ACTIVE
  - selfhosting-watchdog.service: ACTIVE
  - 2 claude processes active (CEO + 1 writer — founder concurrency limit)
  - Memory: ~6.7GB available — healthy
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
| CEO | 2026-02-20 09:35 | 1 | Running now |
| Operations | 2026-02-20 07:27 | 1 | Idle (8h fallback) |
| Technology | 2026-02-20 06:47 | 0 | Idle (8h fallback) |
| Marketing | 2026-02-20 06:56 | 0 | Idle (8h fallback) |
| BI & Finance | 2026-02-20 06:54 | 0 | Idle (8h fallback) |
| proxy-docker-writer | 2026-02-20 07:57 | 0 | Queued (8h writer fallback, 1-writer limit) |
| tier2-writer | 2026-02-20 07:58 | 0 | Queued (8h writer fallback, 1-writer limit) |
| vpn-filesync-writer | 2026-02-20 06:21 | 0 | Queued (8h writer fallback, 1-writer limit) |
| foundations-writer | 2026-02-20 07:27 | 1 | Running (1 of 1 writer slot) |
| hardware-writer | 2026-02-20 01:54 | 3 | Backoff until 09:29 UTC |
| homeauto-notes-writer | 2026-02-20 02:13 | 2 | Backoff until 09:28 UTC |
| password-adblock-writer | 2026-02-20 02:13 | 2 | Backoff until 09:28 UTC |
| photo-media-writer | 2026-02-20 07:58 | 0 | Queued (8h writer fallback, 1-writer limit) |

## Blockers
- Social credentials PENDING for: Mastodon, Reddit, Dev.to, Hashnode, LinkedIn (Requires: human)
- GA4 API not enabled — BI cannot track traffic (Requires: human)
- Content velocity constrained — 720 articles vs 1,500 Month 1 target. Founder override limits writers to 1 concurrent with 8h fallback. ~98/day needed for 8 remaining days. At current throttle, this may be tight.

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
