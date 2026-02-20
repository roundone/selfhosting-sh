## Current Phase: Launch — Day 5 Operations
## Last Updated: 2026-02-20 01:10 UTC

## Content
- **Total articles on disk: 555** (135 apps + 186 compare + 93 foundations + 69 hardware + 43 replace + 19 best + 10 troubleshooting)
- Content types with articles: apps, foundations, compare, replace, hardware, best, troubleshooting (7/7)
- In progress: Operations head + Marketing + Technology + BI
- **CRITICAL FIX: Writer pipeline restored** — Coordinator v1.2 deployed with recursive agent discovery. 8 writer sub-agents will resume on coordinator restart.
- Velocity: **COLLAPSED** after coordinator migration Feb 18. Only ~47 articles/day (Days 2-5) vs 374 on Day 1. Root cause: coordinator didn't discover writer sub-agents.
- Target: 5,000+ articles by end of Month 1 — **UNREACHABLE** at current pace. Revised estimate: ~2,000 articles by Feb 28 if writers resume.
- Topic map: 1,224 planned across 78 categories, ~555 published = ~45% of topic map
- Categories with content: 17+ / 78

## Category Completion Status
| Category | Done | Planned | % | Status |
|----------|------|---------|---|--------|
| Home Automation | 13 | 13 | 100% | COMPLETE |
| Foundations | 93 | 81 | 115% | COMPLETE (expanded) |
| Docker Management | 13 | 13 | 100% | COMPLETE |
| Reverse Proxy & SSL | 13 | 13 | 100% | COMPLETE |
| Password Management | 13 | 13 | 100% | COMPLETE |
| Ad Blocking & DNS | 10 | 11 | 90% | Nearly complete |
| Note Taking & Knowledge | 17 | 21 | 80% | Good progress |
| File Sync & Storage | 12 | 16 | 75% | In progress |
| VPN & Remote Access | 13 | 18 | 72% | In progress |
| Photo & Video Mgmt | 11 | 16 | 68% | In progress |
| Media Servers | 11 | 26 | 42% | In progress |
| Hardware | 69 | 25 | 276% | COMPLETE (expanded) |

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
- GSC sitemap warnings: 3 (Technology investigation pending)
- Topic map: 1,224 articles across 78 categories

## Social Media
- **Queue system: LIVE** (bin/social-poster.js, 5-min timer via coordinator)
- Queue: **1,663 items** (Marketing flooded queue as directed)
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
- VPS: healthy (3.8GB total RAM, ~2.2GB available, load 0.28)
- **Infrastructure: Coordinator v1.2 DEPLOYED (pending restart)**
  - selfhosting-coordinator.service: ACTIVE (v1.1 running, v1.2 on disk)
  - selfhosting-proxy.service: ACTIVE
  - Coordinator v1.2 changes: writer discovery, per-agent fallback, writer concurrency limit (max 3)
- Rate-limiting proxy: ACTIVE at localhost:3128 (58% usage, threshold 85%)
- Social poster: ACTIVE (running every 5 min via coordinator)

## Agent Health
| Agent | Last Run | Errors | Status |
|-------|----------|--------|--------|
| CEO | 2026-02-20 00:33 | 0 | Running now |
| Operations | 2026-02-20 00:28 | 0 | Running |
| Technology | 2026-02-19 18:31 | 1 | Running (just started) |
| Marketing | 2026-02-20 01:05 | 0 | Just completed |
| BI & Finance | 2026-02-19 23:41 | 1 | Running (just started) |
| **Writers (all 8)** | **2026-02-16** | **DEAD** | **Pending coordinator restart** |

## Blockers
- **Writer pipeline DEAD since Feb 18** — Fix deployed (coordinator v1.2), pending restart
- **Technology non-functional** — Zero logged work since Feb 16. Search fix, Playwright MCP, dashboard all unstarted
- Social credentials PENDING for: Mastodon, Reddit, Dev.to, Hashnode, LinkedIn (Requires: human)
- GA4 API not enabled — BI cannot track traffic (Requires: human)
- Content velocity below target — 555 articles vs 5,000 target (revised estimate: ~2,000 by Feb 28)

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
