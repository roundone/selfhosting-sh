## Current Phase: Launch — Day 5 Operations
## Last Updated: 2026-02-20 05:55 UTC

## Content
- **Total articles on disk: 604** (up from 559 at last BI report)
- Content types with articles: apps, foundations, compare, replace, hardware, best, troubleshooting (7/7)
- In progress: Operations head + Marketing + BI + writers active
- **Coordinator v2.0 running** — concurrency limits, memory gate, git safety, stagger, config-driven
- **Writer pipeline ACTIVE** — 2 writers running (proxy-docker, tier2), more queued. Max 4 concurrent (was 2).
- **Writer fallback reduced to 1h** (was 8h) — writers cycle faster for velocity
- Velocity: **RECOVERING** — 5 new comparison articles produced in last 30 min since VPS reboot
- Target: 5,000+ articles by end of Month 1 — **UNREACHABLE** at current pace. Revised estimate: ~2,000 articles by Feb 28 if writers produce at 100-200/day.
- Topic map: 1,224 planned across 78 categories, ~604 published = ~49% of topic map
- Categories with content: 17+ / 78 (59 categories have ZERO content, but writers now reassigned to cover 8 new categories)

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
| **NEW: AI & Machine Learning** | ~5 | 22 | ~23% | Writer active (comparison articles first) |
| **NEW: Search Engines** | ~5 | 18 | ~28% | Writer active (comparison articles first) |
| **NEW: Social Networks** | ~3 | 24 | ~13% | Writer queued |
| **NEW: Task Management** | ~2 | 16 | ~13% | Writer queued |
| **NEW: Video Surveillance** | ~2 | 14 | ~14% | Writer queued |
| **NEW: Music & Audio** | 0 | 22 | 0% | Writer queued |
| **NEW: Container Orchestration** | ~2 | 16 | ~13% | Writer active |
| **NEW: Automation & Workflows** | 0 | 15 | 0% | Writer queued |

## Writer Assignments (updated 2026-02-20 05:55 UTC)
| Writer | Categories | Status |
|--------|-----------|--------|
| proxy-docker-writer (→ aiml-search) | AI & Machine Learning + Search Engines | Running |
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
- Queue: **1,816 items**
- Platform status:
  - **X (Twitter): LIVE** — posting every 60 min
  - **Bluesky: LIVE** — posting every 30 min
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
  - 3 claude processes active (CEO + 2 writers)
  - Memory: ~6.4GB available — VERY healthy after VPS upgrade
- Rate-limiting proxy: ACTIVE at localhost:3128 (16% usage)
- Social poster: ACTIVE (running every 5 min via coordinator)

## Coordinator Config (updated by CEO 2026-02-20 05:45 UTC)
- maxTotalConcurrent: 6 (was 4)
- maxWriterConcurrent: 4 (was 2)
- writerFallbackHours: 1 (was 8)
- deptFallbackHours: 8
- memoryMinFreeMb: 1200
- minIterationGapMinutes: 5

## Agent Health
| Agent | Last Run | Errors | Status |
|-------|----------|--------|--------|
| CEO | 2026-02-20 05:27 | 0 | Running now |
| Operations | 2026-02-20 02:15 | 0 | Idle (waiting for trigger) |
| Technology | 2026-02-20 02:14 | 1 | Backoff cleared, awaiting trigger |
| Marketing | 2026-02-20 02:14 | 0 | Idle |
| BI & Finance | 2026-02-20 02:15 | 0 | Idle |
| proxy-docker-writer | 2026-02-20 05:14 | 1 | Running |
| tier2-writer | 2026-02-20 05:19 | 0 | Running |
| vpn-filesync-writer | — | 0 | Queued (writer limit) |
| foundations-writer | 2026-02-20 02:07 | 0 | Queued |
| hardware-writer | 2026-02-20 01:54 | 0 | Queued |
| homeauto-notes-writer | 2026-02-20 02:13 | 0 | Queued |
| password-adblock-writer | 2026-02-20 02:13 | 0 | Queued |
| photo-media-writer | 2026-02-20 02:15 | 0 | Queued |

## Blockers
- Social credentials PENDING for: Mastodon, Reddit, Dev.to, Hashnode, LinkedIn (Requires: human)
- GA4 API not enabled — BI cannot track traffic (Requires: human)
- Content velocity recovering — 604 articles vs 5,000 target. Writers active with improved concurrency.

## Founder Directives Status
1. Fix broken search → **FIXED by CEO** (Feb 20 05:50 UTC)
2. GA4 visitor stats → BI (blocked by API access)
3. Rate-limiting proxy awareness → Integrated ✓
4. systemd migration → COMPLETE ✓
5. Install Playwright MCP → Technology (HIGH) — NOT STARTED (re-prioritized in Technology inbox)
6. Build status dashboard → Technology (MEDIUM-HIGH) — NOT STARTED
7. Monitor API usage at 85% → Integrated ✓
8. Remove affiliate disclosures → COMPLETE ✓
9. Social posting architecture → COMPLETE ✓
10. Remove Marketing HOLD → COMPLETE ✓
