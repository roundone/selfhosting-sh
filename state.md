## Current Phase: Launch — Day 5 Operations
## Last Updated: 2026-02-20 00:20 UTC

## Content
- **Total articles on disk: 563** (~133 apps + ~170 compare + ~80 foundations + ~60 hardware + ~50 replace + ~20 best + ~50 troubleshooting/other)
- Content types with articles: apps, foundations, compare, replace, hardware, best, troubleshooting (7/7)
- In progress: Operations head + writers + Marketing + Technology + BI
- Velocity: Slowed from Day 1 peak (~46/hr). Currently producing freshness updates + pillar pages.
- Target: 5,000+ articles by end of Month 1 (8 days remaining → need ~554/day)
- Topic map: 1,224 planned across 78 categories, ~563 published = ~46% of topic map, 11.3% of month-1 target
- Categories with content: 17+ / 78
- **Content velocity is CRITICAL concern** — need massive acceleration to hit month-1 target

## Category Completion Status
| Category | Done | Planned | % | Status |
|----------|------|---------|---|--------|
| Home Automation | 13 | 13 | 100% | COMPLETE |
| Foundations | 66+ | 81 | 81%+ | Nearly complete |
| Docker Management | 13 | 13 | 100% | COMPLETE |
| Reverse Proxy & SSL | 13 | 13 | 100% | COMPLETE |
| Password Management | 13 | 13 | 100% | COMPLETE |
| Ad Blocking & DNS | 10 | 11 | 90% | Nearly complete |
| Note Taking & Knowledge | 17 | 21 | 80% | Good progress |
| File Sync & Storage | 12 | 16 | 75% | In progress |
| VPN & Remote Access | 13 | 18 | 72% | In progress |
| Photo & Video Mgmt | 11 | 16 | 68% | In progress |
| Media Servers | 11 | 26 | 42% | In progress |
| Hardware | 49+ | 25 | 196% | COMPLETE (expanded) |

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

## SEO & Marketing
- GSC property: sc-domain:selfhosting.sh (domain-level, siteFullUser permission)
- **GSC: 516 URLs submitted** (up from 34 on Feb 17)
- **9 pages showing search impressions** (as of Feb 19):
  - `/hardware/proxmox-hardware-guide/` — 8 impressions, position 6.9
  - `/compare/freshrss-vs-miniflux/` — 4 impressions, position 4.5
  - `/foundations/reverse-proxy-explained/` — 4 impressions, position 7.2
  - 6 more pages with 1-2 impressions each
- GSC sitemap warnings: 3 (under investigation by Technology)
- Page 1 keywords: TBD (need GSC data pull)
- Topic map: 1,224 articles across 78 categories
- Technical SEO: ALL items complete

## Social Media
- **Queue system: LIVE** (bin/social-poster.js, 5-min timer via coordinator)
- Queue: 56 items pending
- Platform status:
  - **X (Twitter): LIVE** — first post 2026-02-19 23:55 UTC, posting every 60 min
  - **Bluesky: LIVE** — first post 2026-02-19 23:55 UTC, posting every 30 min
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
- VPS: healthy (3.8GB total RAM, ~2.6GB available, load 0.02)
- **Infrastructure: systemd + coordinator (v1.1)**
  - selfhosting-proxy.service: ACTIVE (running 1d 12h)
  - Coordinator manages agent lifecycle via events, inbox watches, 8h-fallback
- Rate-limiting proxy: ACTIVE at localhost:3128 (HTTPS_PROXY)
- Social poster: ACTIVE (running every 5 min via coordinator)

## Blockers
- Social credentials PENDING for: Mastodon, Reddit, Dev.to, Hashnode, LinkedIn (Requires: human)
- GA4 API not enabled — BI cannot track traffic (Requires: human)
- Content velocity below target — 563 articles vs 5,000 target
- Topic map at 1,224 / 2,000+ target — needs continued expansion

## Founder Directives Status
1. Fix broken search → Technology (CRITICAL) — status TBD
2. GA4 visitor stats → BI (blocked by API access)
3. Rate-limiting proxy awareness → Integrated ✓
4. systemd migration → COMPLETE ✓
5. Install Playwright MCP → Technology (HIGH) — status TBD
6. Build status dashboard → Technology (MEDIUM-HIGH) — status TBD
7. Monitor API usage at 85% → Integrated ✓
8. Remove affiliate disclosures → COMPLETE ✓
9. Social posting architecture → COMPLETE ✓
10. Remove Marketing HOLD → COMPLETE ✓
