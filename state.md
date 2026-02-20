## Current Phase: Launch — Day 5 Operations
## Last Updated: 2026-02-20 01:30 UTC

## Content
- **Total articles on disk: 587** (577 + 10 new foundations Wave 6 articles from foundations-writer 01:53 UTC)
- Content types with articles: apps, foundations, compare, replace, hardware, best, troubleshooting (7/7)
- In progress: Operations head + Marketing + Technology + BI + 3 writers active
- **Writer pipeline RESTORED** — Coordinator v1.2 running since 01:20 UTC. 3 writers active (foundations, hardware, homeauto-notes). Max 3 concurrent, 5 more queued.
- **Writer CLAUDE.md files reassigned** — 4 idle writers (proxy-docker, password-adblock, homeauto-notes, foundations) reassigned to high-priority uncovered categories: AI/ML, Search Engines, Social Networks, Task Management, Video Surveillance, Music & Audio, Container Orchestration, Automation & Workflows
- Velocity: **RECOVERING** — writers just restarted at 01:20 UTC after 4-day outage. Expected: 100-200 articles/day once writers are producing.
- Target: 5,000+ articles by end of Month 1 — **UNREACHABLE** at current pace. Revised estimate: ~2,000 articles by Feb 28 if writers produce at 100-200/day.
- Topic map: 1,224 planned across 78 categories, ~569 published = ~46% of topic map
- Categories with content: 17+ / 78 (59 categories have ZERO content)

## Category Completion Status
| Category | Done | Planned | % | Status |
|----------|------|---------|---|--------|
| Home Automation | 13 | 13 | 100% | COMPLETE |
| Foundations | 103 | 81 | 127% | COMPLETE (expanded, Wave 6 +10) |
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
| **NEW: AI & Machine Learning** | 0 | 22 | 0% | Writer reassigned — starting now |
| **NEW: Search Engines** | 0 | 18 | 0% | Writer reassigned — starting now |
| **NEW: Social Networks** | 0 | 24 | 0% | Writer reassigned — starting now |
| **NEW: Task Management** | 0 | 16 | 0% | Writer reassigned — starting now |
| **NEW: Video Surveillance** | 0 | 14 | 0% | Writer reassigned — starting now |
| **NEW: Music & Audio** | 0 | 22 | 0% | Writer reassigned — starting now |
| **NEW: Container Orchestration** | 0 | 16 | 0% | Writer reassigned — starting now |
| **NEW: Automation & Workflows** | 0 | 15 | 0% | Writer reassigned — starting now |

## Writer Assignments (updated 2026-02-20 01:30 UTC)
| Writer | Categories | Status |
|--------|-----------|--------|
| foundations-writer → **containers-automation** | Container Orchestration + Automation & Workflows | Active (reassigned) |
| hardware-writer | Hardware (expanding) | Active |
| homeauto-notes-writer → **surveillance-music** | Note Taking (finish), Video Surveillance, Music & Audio | Active (reassigned) |
| password-adblock-writer → **social-task** | Social Networks & Forums + Task Management | Queued (reassigned) |
| photo-media-writer | Photo & Video Mgmt + Media Servers | Queued |
| proxy-docker-writer → **aiml-search** | AI & Machine Learning + Search Engines | Queued (reassigned) |
| tier2-writer | Download Mgmt, CMS, Monitoring, Backup, Analytics, Email, Bookmarks | Queued |
| vpn-filesync-writer | VPN & Remote Access + File Sync & Storage | Queued |

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
- **Search: BROKEN** (founder-flagged, Technology directive pending)

## SEO & Marketing
- GSC property: sc-domain:selfhosting.sh (domain-level, siteFullUser permission)
- **GSC: 516 URLs submitted** (up from 34 on Feb 17)
- **9 pages showing search impressions** (as of Feb 19):
  - `/hardware/proxmox-hardware-guide/` — 8 impressions, position 6.9
  - `/compare/freshrss-vs-miniflux/` — 4 impressions, position 4.5
  - `/foundations/reverse-proxy-explained/` — 4 impressions, position 7.2
  - 6 more pages with 1-2 impressions each
- **2 page-1 keywords confirmed:** "freshrss vs miniflux" (pos 3.0), "miniflux vs freshrss" (pos 5.0)
- GSC sitemap warnings: 3 (Technology investigation pending)
- Topic map: 1,224 articles across 78 categories

## Social Media
- **Queue system: LIVE** (bin/social-poster.js, 5-min timer via coordinator)
- Queue: **1,715 items** (Marketing flooded queue as directed)
- Platform status:
  - **X (Twitter): LIVE** — posting every 60 min
  - **Bluesky: LIVE** — posting every 30 min
  - Mastodon: BLOCKED (credentials PENDING)
  - Reddit: BLOCKED (credentials PENDING)
  - Dev.to: BLOCKED (credentials PENDING)
  - Hashnode: BLOCKED (credentials PENDING)
  - LinkedIn: BLOCKED (API approval PENDING)
- Marketing HOLD: **LIFTED** (2026-02-20 00:20 UTC)

## Revenue & Finance
- Monthly revenue: $0
- Active revenue sources: none (affiliate signups pending — Requires: human)
- Monthly expenses: ~$15.83
- P&L (February 2026): -$15.83

## Budget — February 2026
- API spend: covered by DV allocation
- Tools/services: $0 / $200 (0% utilized)

## Execution Environment
- VPS: healthy (3.8GB total RAM, ~1.9GB available, load 0.04)
- **Infrastructure: Coordinator v1.2 RUNNING** (restarted 01:20 UTC)
  - selfhosting-coordinator.service: ACTIVE (v1.2, 13 agents discovered)
  - selfhosting-proxy.service: ACTIVE
  - 7 claude processes active (4 core agents + 3 writers)
  - Memory: ~1.9GB available, ~1.7GB used by claude processes
- Rate-limiting proxy: ACTIVE at localhost:3128
- Social poster: ACTIVE (running every 5 min via coordinator)

## Agent Health
| Agent | Last Run | Errors | Status |
|-------|----------|--------|--------|
| CEO | 2026-02-20 01:20 | 0 | Running now |
| Operations | 2026-02-20 01:20 | 0 | Running |
| Technology | 2026-02-20 01:20 | 0 | Running |
| Marketing | 2026-02-20 01:05 | 0 | Just completed |
| BI & Finance | 2026-02-20 01:20 | 0 | Running |
| foundations-writer | 2026-02-20 01:20 | 0 | Running (1 of 3 concurrent) |
| hardware-writer | 2026-02-20 01:20 | 0 | Running (2 of 3 concurrent) |
| homeauto-notes-writer | 2026-02-20 01:20 | 0 | Running (3 of 3 concurrent) |
| password-adblock-writer | — | — | Queued (next when a writer finishes) |
| photo-media-writer | — | — | Queued |
| proxy-docker-writer | — | — | Queued |
| tier2-writer | — | — | Queued |
| vpn-filesync-writer | — | — | Queued |

## Blockers
- **Technology non-functional** — Zero logged work since Feb 16. Search fix, Playwright MCP, dashboard all unstarted. CRITICAL escalation sent.
- Social credentials PENDING for: Mastodon, Reddit, Dev.to, Hashnode, LinkedIn (Requires: human)
- GA4 API not enabled — BI cannot track traffic (Requires: human)
- Content velocity recovering — 569 articles vs 5,000 target. Writers just restarted.

## Founder Directives Status
1. Fix broken search → Technology (CRITICAL) — **NOT STARTED** (escalated again)
2. GA4 visitor stats → BI (blocked by API access)
3. Rate-limiting proxy awareness → Integrated ✓
4. systemd migration → COMPLETE ✓
5. Install Playwright MCP → Technology (HIGH) — **NOT STARTED**
6. Build status dashboard → Technology (MEDIUM-HIGH) — **NOT STARTED**
7. Monitor API usage at 85% → Integrated ✓
8. Remove affiliate disclosures → COMPLETE ✓
9. Social posting architecture → COMPLETE ✓
10. Remove Marketing HOLD → COMPLETE ✓
