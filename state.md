## Current Phase: Launch — Day 6 Operations
## Last Updated: 2026-02-21 09:45 UTC (CEO iter 09:45)

## Content
- **Total articles on disk: 780** (208 apps + 273 compare + 106 foundations + 100 hardware + 58 replace + 25 best + 10 troubleshooting)
- In progress: **ALL WRITERS PAUSED** (Founder directive 2026-02-21). No writers running. Resume **Feb 26 6PM UTC** with **1 writer limit**.
- **Coordinator v2.0 running** — concurrency limits, memory gate, git safety, stagger, config-driven
- **Writer pause EXTENDED** — All 8 wake-on.conf updated to 130h fallback. Coordinator restart scheduled **Feb 26 18:00 UTC** (via `at` job). maxWriterConcurrent: 1.
- Velocity: 0 (writers PAUSED — no further production until Feb 26 6PM UTC).
- Target: **850+ articles by end of Month 1** (revised from 1,500 by founder directive 2026-02-21). All subsequent month targets reduced 20%. 780 published. Need ~70 more articles in final 2 days (Feb 26-28) with 1 writer.
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

## Writer Assignments (updated 2026-02-21 ~09:45 UTC — ALL PAUSED until Feb 26 6PM UTC, 1 writer limit on restart)
| Writer | Categories (Assignment) | Status |
|--------|-------------------------------|--------|
| foundations-writer | *arr finish (3) + Document Signing (11) + Low-Code (14) | **PAUSED** (until Feb 26 6PM UTC) |
| proxy-docker-writer | Newsletters & Mailing Lists + File Sharing & Transfer | **PAUSED** (until Feb 26 6PM UTC) |
| homeauto-notes-writer | Video Surveillance + Music & Audio (remaining ~12) | **PAUSED** (until Feb 26 6PM UTC) |
| password-adblock-writer | Social Networks & Forums + Task Management | **PAUSED** (until Feb 26 6PM UTC) |
| vpn-filesync-writer | DNS & Networking remaining (17) | **PAUSED** (until Feb 26 6PM UTC) |
| photo-media-writer | Ebooks finish (3) + Ticketing & Helpdesk (14) | **PAUSED** (until Feb 26 6PM UTC) |
| tier2-writer | Download Mgmt, CMS, Monitoring, Backup, Analytics, Email, Bookmarks | **PAUSED** (until Feb 26 6PM UTC) |
| hardware-writer | Hardware (expanding) | **PAUSED** (until Feb 26 6PM UTC) |

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
- **Board Portal v4: LIVE** at https://portal.selfhosting.sh (login auth, 12 pages incl. Growth metrics + Agent Instructions + Social Activity Feed, systemd `selfhosting-portal`). Dashboard restructured: 5 collapsible sections, 6 exec summary cards, PIDs removed.
- **Post-deploy QA: INTEGRATED** (21 checks, all passing)
- **Share buttons: LIVE** (ShareButtons.astro — X, Reddit, HN, LinkedIn, Bluesky, Copy Link)
- **Page speed: OPTIMIZED** (prefetch, preconnect GTM, conditional Pagefind — articles skip ~50KB)
- **Newsletter pipeline: LIVE** (subscribe/unsubscribe endpoints at /api/subscribe, /api/unsubscribe. VPS-backed storage. Sending via bin/send-newsletter.sh. Content strategy pending Marketing.)
- **Brand assets: LIVE** — Logo (SVG, 400px, 800px PNG), header (1500x500 PNG/SVG), favicons all deployed to `site/public/branding/` and CDN. Terminal-inspired design. Marketing uploading to social profiles.
- **Homepage newsletter mention: LIVE** — Hero section link + bottom EmailSignup component.

## SEO & Marketing
- GSC property: sc-domain:selfhosting.sh (domain-level, siteFullUser permission)
- **GSC: sitemap resubmitted Feb 20 05:50 UTC** (should pick up 604 articles on next Google crawl)
- **GSC BREAKTHROUGH (Feb 18 data): 518 impressions (20x increase from 24), 22 pages showing**
  - 22 pages showing impressions. Google shifted to active indexing.
  - Top: `/hardware/proxmox-hardware-guide/` — 181 impressions, pos 6.2
  - Comparison pages dominate: 8 of top 22 pages are from `/compare/`
  - Zero clicks still — Feb 19-20 data not yet available (GSC 2-3 day lag). Expected Feb 22-23.
  - **Trailing slash: ALREADY FIXED** — Technology confirmed 308 redirects in place since Feb 20. GSC split is historical artifact, will consolidate naturally.
- GSC sitemap warnings: 0 (resolved)
- Topic map: 1,224 articles across 78 categories

## Social Media
- **Queue system: LIVE** (bin/social-poster.js, 5-min timer via coordinator)
- Queue: **~2,639 items** (Marketing refilled queue — active posting every 5 min, draining ~18/day)
- **Mastodon: 105 followers, 151 following** — app revoked and RESTORED Feb 21. Bot flag set. Engagement limits imposed. **Posting interval: 45 min** (increased from 15 min — community pushback on frequency). +20 followers today.
- **Bluesky: 13 followers, 124 following** — engagement low but growing.
- **X: 31 following** — 30 new follows, bio updated. Account still too new for inbound mentions.
- **Mastodon: 0.66 followers/post** (105 followers / 158 posts) — dramatically outperforming X/Bluesky. Self-hosting community active on fediverse. Must protect this relationship.
- **X duplicate content fix WORKING** — social-poster.js now skips 403 duplicates and posts next item
- **Mastodon 500-char truncation FIXED** — social-poster.js now truncates long posts at word boundaries for Mastodon
- **FOUNDER DIRECTIVE (Feb 20):** Social engagement strategy overhaul EXECUTING — Marketing iteration totals: 89 new follows, 16 genuine replies, 22 favs/likes, 3 boosts. Dev.to: 30 articles. Hashnode: 11 articles total. Brand voice doc DONE. **Total followers: 118** (Mastodon: 105, Bluesky: 13).
- **Share buttons: LIVE** — 6 targets (X, Reddit, HN, LinkedIn, Bluesky, Copy Link) on every article page. Pure HTML/CSS.
- Platform status:
  - **X (Twitter): LIVE** — posting every 15 min
  - **Bluesky: LIVE** — posting every 10 min
  - **Mastodon: RESTORED** — posting every **45 min** (interval increased from 15 min due to community pushback. New app + token deployed 04:15 UTC Feb 21, bot flag set)
  - **Dev.to: LIVE** — Full article cross-posting via social-poster.js. Interval reduced 24h→6h (4 articles/day). 30 articles published.
  - Reddit: BLOCKED (Reddit app creation page shows policy wall — not a credentials issue)
  - **Hashnode: LIVE** — Full article cross-posting via social-poster.js. Interval reduced 24h→6h (4 articles/day). 11 articles published.
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
  - Memory: ~6.7GB available / 7.7GB total — healthy
  - Load: minimal
- Rate-limiting proxy: ACTIVE at localhost:3128
- Social poster: ACTIVE (running every 5 min via coordinator)

## Coordinator Config (FOUNDER OVERRIDE 2026-02-21)
- maxTotalConcurrent: 4
- maxWriterConcurrent: 1 (1 writer limit on restart per founder directive 2026-02-21)
- writerFallbackHours: 8
- deptFallbackHours: 8
- memoryMinFreeMb: 1200
- minIterationGapMinutes: 5
- **Note:** Founder directive 2026-02-21: ALL writers paused until Feb 26 6PM UTC (130h wake-on.conf). Restart with 1 writer limit. Coordinator restart scheduled Feb 26 18:00 UTC via `at` job.

## Agent Health
| Agent | Last Run | Errors | Status |
|-------|----------|--------|--------|
| CEO | 2026-02-21 08:02 | 0 | Running — routine check, writer error counters reset, Dev.to/Hashnode interval 24h→6h |
| Operations | 2026-02-20 20:23 | 0 | Running — internal link audit P1-P5 COMPLETE, security-basics links fixed |
| Technology | 2026-02-20 20:38 | 0 | Running — Dev.to/Hashnode posting IMPLEMENTED and TESTED. Logo + newsletter homepage DONE. |
| Marketing | 2026-02-20 21:24 | 0 | Running — engagement active, brand voice doc DONE, 89 follows + 16 replies |
| BI & Finance | 2026-02-20 20:46 | 0 | Running — daily report delivered, trailing slash issue routed to Technology |
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
- Social credentials PENDING for: Reddit (app creation blocked by policy wall)
- LinkedIn API approval PENDING (deprioritized per founder)
- GA4 API: **WORKING** (Feb 20). Property ID `524871536`. 72 users, 97 sessions, 15 organic sessions (Feb 16-20).
- **Content production PAUSED** — Founder directive 2026-02-21: all writers paused until **Feb 26 6PM UTC**. 780 articles on disk. Restart with **1 writer limit**. Focus: Technology, Marketing, BI, indexing fixes until resume date.
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
16. **Pause ALL writers until Feb 22** → **SUPERSEDED** by directive 36 (Feb 21) — Extended to Feb 26 6PM UTC with 1 writer limit.
17. **Social media strategy overhaul** → **DONE** (Feb 20 ~11:00 UTC) — Marketing CLAUDE.md updated with full engagement strategy. Inbox directive sent. Daily targets: 10+ follows, 5+ replies, 3+ posts (70%+ non-link).
18. **Portal improvements (security, UI, alerts)** → **COMPLETE** (Feb 20 ~14:25 UTC) — Portal Phase 1 done: login security (sessions, brute-force), HTTPS at portal.selfhosting.sh, polished UI, per-agent alert intervals, credential redaction verified. IR transitioning to Phase 2 (weekly cadence).
19. **New credentials (Mastodon, Dev.to)** → **DONE** (Feb 20) — Mastodon posting confirmed working at 10:53 UTC. Dev.to API key provided. Social poster config already enabled. Marketing notified.
20. **GA4 API enabled** → **DONE** by founder. BI notified to retry API queries.
21. **Portal login broken** → **FIXED by CEO** (Feb 20 ~15:15 UTC) — Simplified to password-only (removed username field). Portal restarted. Credentials emailed to founder.
22. **Product features must maximize SEO/social** → **COMPLETE** (Feb 20 ~15:30 UTC) — All implemented: 7 existing features ✓, share buttons LIVE (6 targets, pure HTML/CSS), page speed optimized (prefetch, preconnect, conditional Pagefind), Marketing standing seat on features ✓. Comments: deferred (CEO decision — spam/moderation risk with no humans). Marketing consultation still pending.
23. **Portal CLAUDE.md access + Growth metrics dashboard** → **COMPLETE** (Feb 20 ~17:00 UTC) — CLAUDE.md viewer LIVE with extra password layer. Growth dashboard LIVE at `/growth` (GSC+GA4+Social data, 6 top-line cards, sparklines, cached APIs). Agent Instructions LIVE at `/instructions` (14 agents, CEO editable). Portal v3 with 11 pages.
24. **CLAUDE.md extra password + Running:0 fix** → **DONE** (Feb 20 ~15:42 UTC) — Separate password generated and stored. Portal CLAUDE.md section requires additional auth. Coordinator persists running state. Credentials emailed to founder.
25. **Newsletter subscribe broken — implement or remove** → **COMPLETE** (Feb 20 ~16:42 UTC) — Full pipeline LIVE: CF Pages Functions → VPS portal storage. Subscribe/unsubscribe working. Newsletter sending script ready. Marketing content strategy pending. VPS storage used (Resend API key send-only, CF token lacks KV scope — both Requires:human optional upgrades).
26. **Social queue cleanup** → **DONE** (Feb 20 ~18:20 UTC) — CEO trimmed queue from ~2,000 to 544 items (376 article links from 133 unique articles + 168 non-link). Marketing directed to add 400+ non-link posts.
27. **Comment reply system** → **ACTIVE** (Feb 20 ~19:45 UTC) — Marketing reported 16 genuine replies sent across Mastodon (5) and Bluesky (11). Reply rate tracking ongoing.
28. **Follow accounts on X/Bluesky/Mastodon** → **ACTIVE** (Feb 20 ~19:45 UTC) — Marketing reported 89 new follows: Mastodon +39 (81 total), Bluesky +20 (63 total), X +30 (31 total). Exceeds 10/day target.
29. **Profile branding audit** → **IN PROGRESS** — Logo + header DONE by Technology. Marketing uploading to all social profiles via API/Playwright.
30. **IR portal redesign** → **COMPLETE** (Feb 20 ~18:30 UTC) — Portal v4 shipped: social activity feed (`/social`), 5 collapsible sections, 6 executive summary cards, PIDs removed, relative timestamps. Logo/brand assets in progress.
31. **Department role clarity** → **DONE** (Feb 20 ~18:30 UTC) — Marketing CLAUDE.md expanded (engagement, community mgmt, follower growth, distribution). BI-Finance CLAUDE.md expanded (monetization readiness, proactive insights). CEO CLAUDE.md updated (product ownership).
32. **Playwright engagement for Marketing** → **DONE** (Feb 21 ~00:05 UTC) — Marketing CLAUDE.md updated with detailed Playwright MCP usage instructions. CRITICAL inbox directive sent. Mandatory per-iteration engagement checklist added.
33. **Brand voice + smart reply strategy** → **COMPLETE** (Feb 20 ~19:45 UTC) — Marketing created `agents/marketing/brand-voice.md` with all 7 required sections. All future engagement follows this document.
34. **Dev.to/Hashnode cross-post queue** → **COMPLETE** (Feb 20 ~19:30 UTC) — Technology implemented `postDevto`/`postHashnode` in social-poster.js. Both tested end-to-end (Dev.to 201, Hashnode 200). 49 entries per platform in queue. Marketing to upload brand assets to social profiles.
35. **Mastodon 401 investigation** → **RESOLVED** (Feb 21 ~04:15 UTC) — Root cause: mastodon.social revoked app registration due to aggressive automated activity (108+ follows, high-volume API usage). Account NOT suspended. Fix: new app registered (`selfhosting-sh-posting`), new token via Playwright OAuth, bot flag set to true, mandatory engagement limits sent to Marketing. See `learnings/failed.md` for details.
36. **Lower Month 1 target to 850, reduce subsequent by 20%** → **DONE** (Feb 21 ~09:45 UTC) — Scorecard updated in CLAUDE.md: M1=850, M3=8,000, M6=12,000, M9=14,400, M12=16,000. state.md and strategy.md updated.
37. **Investigate Google indexing issues (HIGH PRIORITY)** → **IN PROGRESS** (Feb 21 ~09:45 UTC) — Investigation complete. Root causes: (1) No `<lastmod>` in sitemap, (2) 428 articles published same day = quality filter trigger, (3) ~9,893 internal links missing trailing slashes wasting crawl budget, (4) www.selfhosting.sh not redirecting to apex. Fixes applied: sitemap lastmod added, 9,893 links fixed, www→apex 301 redirect via CF Pages middleware, RSS autodiscovery tag added. Manual indexing requests pending. Technology notified to deploy.
38. **Extend writer pause to Feb 26 6PM UTC, 1 writer limit** → **DONE** (Feb 21 ~09:45 UTC) — All 8 wake-on.conf updated to 130h fallback. Feb 22 `at` job cancelled, new `at` job for Feb 26 18:00 UTC. maxWriterConcurrent: 1.
