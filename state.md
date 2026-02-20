## Current Phase: Launch — Day 5 Operations
## Last Updated: 2026-02-20 12:45 UTC

## Content
- **Total articles on disk: 778** (207 apps + 273 compare + 105 foundations + 100 hardware + 58 replace + 25 best + 10 troubleshooting)
- In progress: **ALL WRITERS PAUSED** (Founder directive 2026-02-20). No writers running. Resume Feb 22.
- **Coordinator v2.0 running** — concurrency limits, memory gate, git safety, stagger, config-driven
- **Writer pipeline PAUSED** — Founder directive 2026-02-20: ALL writers paused until Feb 22. Focus: Technology, Marketing, BI, IR, Operations coordination. All wake-on.conf set to 48h. Note: homeauto-notes-writer started via timing race at 10:18 (before coordinator detected 48h conf change at 10:23) — will finish this iteration then pause.
- Velocity: +225 articles today (writers now PAUSED — no further production until Feb 22).
- Target: 1,500+ articles by end of Month 1 (revised from 5,000 by board approval 2026-02-20; 5,000 target moves to Month 2). 778 published. Writers paused until Feb 22 per founder directive. Need ~90/day for 8 remaining days.
- Topic map: 1,224 planned across 78 categories, ~778 published = ~64% of topic map
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
| **NEW: Video Surveillance** | ~5 | 14 | ~36% | In progress (3 app guides added) |
| **NEW: Music & Audio** | ~2 | 22 | ~9% | In progress (2 app guides added) |
| **NEW: Container Orchestration** | 13 | 16 | 81% | Nearly complete (writer done, 3 articles remaining) |
| **NEW: Automation & Workflows** | 15 | 15 | 100% | **COMPLETE** |

## Writer Assignments (updated 2026-02-20 ~13:00 UTC — ALL PAUSED, CLAUDE.md UPDATED for Feb 22 resume)
| Writer | Categories (Feb 22 Assignment) | Status |
|--------|-------------------------------|--------|
| foundations-writer | *arr finish (3) + Document Signing (11) + Low-Code (14) | **PAUSED** (CLAUDE.md updated) |
| proxy-docker-writer | Newsletters & Mailing Lists + File Sharing & Transfer | **PAUSED** (CLAUDE.md updated) |
| homeauto-notes-writer | Video Surveillance + Music & Audio (remaining ~12) | **PAUSED** (CLAUDE.md updated) |
| password-adblock-writer | Social Networks & Forums + Task Management | **PAUSED** (CLAUDE.md updated) |
| vpn-filesync-writer | DNS & Networking remaining (17) | **PAUSED** (CLAUDE.md updated) |
| photo-media-writer | Ebooks finish (3) + Ticketing & Helpdesk (14) | **PAUSED** (CLAUDE.md updated) |
| tier2-writer | Download Mgmt, CMS, Monitoring, Backup, Analytics, Email, Bookmarks | **PAUSED** (CLAUDE.md updated) |
| hardware-writer | Hardware (expanding) | **PAUSED** (CLAUDE.md updated) |

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
- Queue: **~1,921 items** (draining — 3 platforms active now; Marketing adding new posts)
- **1 follower on Bluesky** (as of 12:45 UTC)
- **Mastodon: 3.4 engagements/post** — dramatically outperforming X (0/post). Self-hosting community active on fediverse.
- **X duplicate content fix WORKING** — social-poster.js now skips 403 duplicates and posts next item
- **FOUNDER DIRECTIVE (Feb 20):** Social strategy overhaul — Marketing must do active engagement (follows, replies, boosts), not just queue syndication. Max 30% article links, 70% other content. Daily targets: 10+ follows, 5+ replies, 3+ original posts.
- Platform status:
  - **X (Twitter): LIVE** — posting every 15 min
  - **Bluesky: LIVE** — posting every 10 min
  - **Mastodon: LIVE** — posting every 15 min (credentials confirmed working 10:53 UTC Feb 20)
  - **Dev.to: LIVE** — API key provided. Full article cross-posting only (not status updates)
  - Reddit: BLOCKED (Reddit app creation page shows policy wall — not a credentials issue)
  - Hashnode: BLOCKED (credentials PENDING)
  - LinkedIn: DEPRIORITIZED (API approval PENDING)

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
  - selfhosting-coordinator.service: ACTIVE (v2.0, 14 agents discovered including IR)
  - selfhosting-proxy.service: ACTIVE
  - selfhosting-watchdog.service: ACTIVE
  - 4 agents active (CEO, BI, marketing, technology). IR completed. Writers PAUSED until Feb 22.
  - Memory: ~6.5GB available / 7.7GB total — healthy
  - Load: minimal
- Rate-limiting proxy: ACTIVE at localhost:3128
- Social poster: ACTIVE (running every 5 min via coordinator)

## Coordinator Config (FOUNDER OVERRIDE 2026-02-20)
- maxTotalConcurrent: 4
- maxWriterConcurrent: 0 (config file immutable; writers paused via 48h wake-on.conf)
- writerFallbackHours: 48 (all writers paused until Feb 22 per founder directive)
- deptFallbackHours: 8
- memoryMinFreeMb: 1200
- minIterationGapMinutes: 5
- **Note:** Founder directive 2026-02-20: ALL writers paused until Feb 22. Config file locked (immutable attr). Focus: Technology, Marketing, BI, IR.

## Agent Health
| Agent | Last Run | Errors | Status |
|-------|----------|--------|--------|
| CEO | 2026-02-20 14:27 | 0 | Running now |
| Operations | 2026-02-20 14:20 | 0 | Running |
| Technology | 2026-02-20 14:21 | 0 | Completed (portal improvements; MINGAP deferral) |
| Marketing | 2026-02-20 13:05 | 0 | Idle (next: inbox/fallback trigger) |
| BI & Finance | 2026-02-20 13:03 | 0 | Idle (next: inbox/fallback trigger) |
| Investor Relations | 2026-02-20 14:26 | 0 | Completed — Phase 1 DONE, weekly cadence (168h fallback) |
| proxy-docker-writer | 2026-02-20 07:57 | 1 | **PAUSED** (until Feb 22) |
| tier2-writer | 2026-02-20 10:48 | 0 | **PAUSED** (until Feb 22) |
| vpn-filesync-writer | 2026-02-20 06:21 | 0 | **PAUSED** (until Feb 22) |
| foundations-writer | 2026-02-20 10:56 | 2 | **PAUSED** (until Feb 22 — started via writer-slot-available before maxWriters=0 took effect) |
| hardware-writer | 2026-02-20 10:13 | 0 | **PAUSED** (until Feb 22) |
| homeauto-notes-writer | 2026-02-20 10:45 | 0 | **PAUSED** (completed iteration, now paused) |
| password-adblock-writer | 2026-02-20 10:55 | 3 | **PAUSED** (until Feb 22 — SIGTERM, backoff) |
| photo-media-writer | 2026-02-20 10:56 | 1 | **PAUSED** (until Feb 22 — SIGTERM, backoff) |

## Blockers
- Social credentials PENDING for: Reddit (app creation blocked by policy wall), Hashnode (Requires: human)
- LinkedIn API approval PENDING (deprioritized per founder)
- GA4 API: **WORKING** (Feb 20). Property ID `524871536`. 51 users, 69 sessions, 11 organic sessions confirmed.
- **Content production PAUSED** — Founder directive: all writers paused until Feb 22. 778 articles on disk. All 8 writer CLAUDE.md files updated for Feb 22 resume. Focus: Technology, Marketing, BI, IR until resume date.
- Coordinator v2.0 now discovers IR agent (restarted at 12:35 UTC — 14 agents discovered)

## Founder Directives Status
1. Fix broken search → **FIXED by CEO** (Feb 20 05:50 UTC)
2. GA4 visitor stats → **DONE** (GA4 API working — 51 users, 69 sessions, 11 organic confirmed)
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
16. **Pause ALL writers until Feb 22** → **DONE** (Feb 20 10:25 UTC) — All 8 writer wake-on.conf set to 48h. No writers running. Focus: Technology, Marketing, BI, IR.
17. **Social media strategy overhaul** → **DONE** (Feb 20 ~11:00 UTC) — Marketing CLAUDE.md updated with full engagement strategy. Inbox directive sent. Daily targets: 10+ follows, 5+ replies, 3+ posts (70%+ non-link).
18. **Portal improvements (security, UI, alerts)** → **COMPLETE** (Feb 20 ~14:25 UTC) — Portal Phase 1 done: login security (sessions, brute-force), HTTPS at portal.selfhosting.sh, polished UI, per-agent alert intervals, credential redaction verified. IR transitioning to Phase 2 (weekly cadence).
19. **New credentials (Mastodon, Dev.to)** → **DONE** (Feb 20) — Mastodon posting confirmed working at 10:53 UTC. Dev.to API key provided. Social poster config already enabled. Marketing notified.
20. **GA4 API enabled** → **DONE** by founder. BI notified to retry API queries.
