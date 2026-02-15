# Founding Board Report — selfhosting.sh

**Date:** 2026-02-15
**From:** CEO Agent
**To:** Nishant (Founder, Daemon Ventures)

---

## Executive Summary

selfhosting.sh will become the internet's most comprehensive resource for self-hosting — covering every app, every comparison, and every "how do I replace [cloud service]?" question in the space. We've mapped 497 articles across 34 categories in our initial content plan, scaling to 5,000+ in month 1 through parallel AI agent production. The site is a static Astro build on Cloudflare Pages for sub-second load times. Revenue comes from hardware affiliate links (Amazon Associates, Synology, etc.) and eventually display ads. Target: $5,000/month by October 1, 2026, with zero human assistance beyond strategic oversight and account setup.

The competitive landscape is fragmented — no single site comprehensively covers self-hosting. Awesome-Selfhosted is a link list, not a content site. Individual blogs cover 10-20 apps. We will cover hundreds with structured, interlinked, SEO-optimized content. First-mover advantage in comprehensive coverage = topical authority = Google rankings.

All infrastructure, credentials, and social accounts are in place. We are ready to launch.

---

## Content Plan

- **Total articles planned (initial map):** 497
- **Categories:** 34 (12 Tier 1 high-priority, 15 Tier 2 medium, 7 Tier 3 lower)
- **Content types:** App guides, pairwise comparisons, roundups ("Best Self-Hosted X"), "Replace [Service]" guides, hardware guides, foundations/tutorials

### Category Breakdown

| Tier | Category | Articles |
|------|----------|----------|
| 1 | Hardware | 25 |
| 1 | Foundations | 22 |
| 1 | Note Taking & Knowledge | 21 |
| 1 | Media Servers | 18 |
| 1 | VPN & Remote Access | 18 |
| 1 | Photo & Video Management | 16 |
| 1 | File Sync & Storage | 16 |
| 1 | Reverse Proxy & SSL | 13 |
| 1 | Password Management | 13 |
| 1 | Home Automation | 13 |
| 1 | Docker Management | 13 |
| 1 | Ad Blocking & DNS | 11 |
| 2 | Download Management | 20 |
| 2 | CMS & Websites | 19 |
| 2 | Monitoring & Uptime | 17 |
| 2 | Backup | 17 |
| 2 | Analytics | 16 |
| 2 | Email | 15 |
| 2 | Bookmarks & Read Later | 15 |
| 2 | Automation & Workflows | 15 |
| 2 | Git & Code Hosting | 14 |
| 2 | Dashboards | 14 |
| 2 | Communication & Chat | 14 |
| 2 | Calendar & Contacts | 12 |
| 2 | Personal Finance | 12 |
| 2 | RSS Readers | 12 |
| 2 | Document Management | 10 |
| 3 | Status Pages | 13 |
| 3 | URL Shorteners | 12 |
| 3 | Pastebin & Snippets | 12 |
| 3 | Recipes | 11 |
| 3 | Link Pages | 10 |
| 3 | Speed Test | 9 |
| 3 | Video Conferencing | 9 |

### Priority Order

1. **Foundations first** — Docker basics, networking, DNS, SSL, Linux fundamentals. These are prerequisites that every other article links to.
2. **Hardware next** — NAS recommendations, mini PC guides, drive guides. High affiliate revenue potential and gateway content for beginners.
3. **Tier 1 app categories** — Photo management, media servers, ad blocking, password managers. Highest search volume, broadest audience appeal.
4. **Tier 2** follows once Tier 1 is substantially complete.
5. **Tier 3** fills out topical authority.

### Publishing Velocity

- **Target:** 150+ articles/day via parallel AI agent production (10+ category writers running 24/7)
- **Initial 497 articles:** ~3-4 days at full velocity
- **1,000 articles:** ~1 week
- **5,000 articles:** ~1 month (accounting for quality iteration, ramp-up, and expanding the topic map)

The 497-article initial map is a floor, not a ceiling. As agents work, they'll discover additional apps, comparisons, troubleshooting guides, and topics to add. The topic map will grow continuously.

---

## Technology Plan

- **Framework:** Astro (static site generator) — fast builds, Markdown-native, excellent SEO defaults
- **Content format:** Markdown with YAML frontmatter, organized as Astro content collections
- **Hosting:** Cloudflare Pages — global CDN, free tier, automatic HTTPS, git-based deploys
- **Search:** Pagefind — client-side search, zero server cost, indexes at build time
- **Domain:** selfhosting.sh on Cloudflare (registered, DNS configured)
- **Design:** Dark mode default, clean technical aesthetic, content-first layout. Inspired by DigitalOcean tutorials and Tailwind docs. Target <1s LCP, Lighthouse 95+.
- **VPS:** Hetzner CPX21 (3 vCPU, 4GB RAM, 80GB SSD) — Ashburn, VA. Runs all agents.
- **Deployment pipeline:** git push → Cloudflare Pages auto-builds → live in ~60 seconds
- **Estimated time to site live (designed, empty):** 2-3 days after launch approval

### URL Structure

| Content Type | Pattern | Example |
|-------------|---------|---------|
| App guide | `/apps/{slug}` | `/apps/immich` |
| Comparison | `/compare/{app1}-vs-{app2}` | `/compare/immich-vs-photoprism` |
| Roundup | `/best/{category}` | `/best/photo-management` |
| Replace guide | `/replace/{service}` | `/replace/google-photos` |
| Hardware | `/hardware/{slug}` | `/hardware/best-nas-2026` |
| Foundations | `/foundations/{slug}` | `/foundations/docker-basics` |
| Troubleshooting | `/troubleshooting/{app}/{issue}` | `/troubleshooting/nextcloud/sync-not-working` |

### Design Direction

- Dark mode default, light mode toggle
- Content-first layout with sticky TOC sidebar
- Terminal-inspired logo/branding (leveraging the `.sh` domain)
- Syntax-highlighted code blocks with copy buttons
- Sub-1-second page loads (static HTML on CDN)
- Mobile-responsive, WCAG 2.1 AA accessible
- Zero popups, modals, or sticky bars

---

## Marketing Plan

### SEO Strategy

- **Pillar-cluster model:** Roundup pages are pillars; app guides and comparisons are clusters linking back
- **Internal linking:** Minimum 7 internal links per app guide, 10 per roundup, 5 per comparison
- **Schema markup:** Article, SoftwareApplication, FAQ, BreadcrumbList, WebSite with SearchAction
- **Technical SEO:** XML sitemap, robots.txt, canonical URLs, OG/Twitter meta tags, structured data
- **Keyword targeting:** Long-tail first ("immich docker compose", "self-host photoprism"), then category terms ("best self-hosted photo management")

### Primary Keyword Categories (by search volume)

1. Photo management (Immich, PhotoPrism, Google Photos alternatives)
2. Media servers (Plex, Jellyfin, Emby)
3. Ad blocking (Pi-hole, AdGuard Home)
4. Password managers (Vaultwarden, Bitwarden)
5. Note taking (Joplin, BookStack, self-hosted wikis)
6. VPN/remote access (WireGuard, Tailscale, Headscale)
7. File sync (Nextcloud, Syncthing)
8. Home automation (Home Assistant)

### Social Platforms

| Platform | Account | Strategy | Frequency |
|----------|---------|----------|-----------|
| X/Twitter | @selfhostingsh | Tips, article links, threads, engagement | 15-25/day |
| Mastodon | @selfhostingsh@mastodon.social | FOSS/privacy community, hashtags | 10-20/day |
| Bluesky | @selfhostingsh.bsky.social | Growing tech audience, early presence | 10-15/day |
| Reddit | u/selfhostingsh | Help first, link second. Build karma 2 weeks first. | 5-10/day |
| Dev.to | selfhostingsh | Cross-post ALL articles with canonical_url | Every article |
| Hashnode | selfhostingsh | Cross-post ALL articles with canonical_url | Every article |
| LinkedIn | Company page (111603639) | Professional audience | Pending API |

### Launch Timeline

- **Week 1:** Site live, first 100+ articles published, social accounts begin posting
- **Week 2-4:** Scale to 500+ articles, cross-posting to Dev.to/Hashnode begins
- **Week 3+:** Reddit linking begins (after 2 weeks of karma-building)
- **Month 2:** Sitemap submitted, indexing accelerated via social signals and cross-posting backlinks
- **Expected first page 1 ranking:** Month 2-3 (long-tail keywords with low competition)

---

## Organization

### Departments

| Department | Head | Outcome |
|------------|------|---------|
| **Technology** | Head of Technology | Site is fast, reliable, well-designed, and deployed. Execution environment is stable. |
| **Marketing** | Head of Marketing | Site ranks #1 for maximum self-hosting queries. Growing, engaged audience. |
| **Operations** | Head of Operations | Every self-hosting topic is comprehensively covered with accurate, interlinked content. |
| **BI & Finance** | Head of BI & Finance | CEO and department heads have data and insights to make good decisions. |

### Agent Model

- **Architecture:** Headless Claude Code iterations on VPS, supervised by systemd
- **Communication:** File-based (inbox/, logs/, learnings/, topic-map/, reports/, board/)
- **Hierarchy:** CEO → Department Head → Worker (max 3 levels)
- **Iteration loop:** Each agent reads state from files, executes one complete operating loop, exits cleanly. Wrapper script restarts after 10-second pause. Timeouts kill stuck iterations after 1 hour.

### Sub-Agent Strategy

- **Operations** spawns category leads (permanent sub-agents) — one per content category, each running its own iteration loop, writing articles within its scope
- **Marketing** spawns SEO auditors and social content creators
- **Technology** spawns component builders, performance auditors
- **BI & Finance** spawns market researchers and competitor auditors

---

## Projected Timeline

| Milestone | Target Date |
|-----------|-------------|
| Site live (designed, empty) | Feb 18, 2026 |
| First 100 articles published | Feb 20, 2026 |
| First 500 articles published | Feb 24, 2026 |
| 1,000 articles published | Feb 28, 2026 |
| 5,000 articles published | Mar 15, 2026 |
| Sitemap submitted to Google | Feb 20, 2026 |
| First page 1 ranking | Mar-Apr 2026 |
| 100 page 1 keywords | Aug 2026 |
| 50K monthly visits | Aug 2026 |
| First revenue ($1) | Apr 2026 |
| $1K/month revenue | Jun 2026 |
| $5K/month revenue | Oct 1, 2026 |

---

## Budget & Resources

| Item | Cost | Status |
|------|------|--------|
| VPS (Hetzner CPX21) | ~$15/month | Active |
| Domain (selfhosting.sh) | ~$10/year | Active (Cloudflare) |
| Cloudflare Pages | Free tier | Active |
| Claude Code API | Covered by DV allocation | Active |
| X/Twitter API | ~$0.01/post (~$5-8/month) | Active |
| Other social APIs | Free | Active |
| Tools budget | $0 / $200 monthly | Not yet used |
| **Total monthly** | **~$23 + API costs** | |

### Accounts Needing Human Setup

| Account | When Needed | Status |
|---------|-------------|--------|
| Amazon Associates | Month 1-2 | Pending (requires tax info) |
| LinkedIn Developer App | Month 1 | Pending (company page exists) |
| Other affiliate programs | Month 2+ | Pending |
| Mediavine/AdThrive | Month 6+ (need 50K sessions) | Future |

---

## Key Risks

1. **Google indexing speed.** Risk: Google may not index 5,000+ pages quickly for a brand-new domain. Mitigation: XML sitemap via Search Console API (service account already has Full access), social signals, cross-posting to Dev.to/Hashnode creates backlinks that accelerate discovery. Start with highest-value pages.

2. **Content quality at scale.** Risk: AI-generated content at high velocity may have inaccuracies (wrong Docker configs, outdated versions). Mitigation: Strict quality rules in Operations — verify all configs against official docs, pin Docker image versions, self-check before marking complete. `learnings/failed.md` captures all failures for organizational learning. Content freshness monitoring by BI & Finance.

3. **Google AI content detection.** Risk: Google may devalue AI-generated content. Mitigation: Focus on genuine utility — working Docker configs, real comparisons, actionable guides. Google rewards helpfulness regardless of authorship. Comprehensive interlinked coverage builds genuine topical authority.

4. **VPS resource constraints.** Risk: Running 5+ concurrent Claude Code processes on 4GB RAM may cause resource contention. Mitigation: Headless iteration model means only one Claude process per agent at a time (they take turns via the iteration loop). Sub-agents staggered. Technology monitors capacity. Hetzner allows easy vertical scaling if needed.

5. **Competitive response.** Risk: Established sites (selfh.st, LinuxServer.io, noted-apps.com) could accelerate their own coverage. Mitigation: First-mover advantage in comprehensiveness. 5,000 articles is a moat that's hard to replicate quickly. BI & Finance monitors competitive landscape daily.

---

## Key Assumptions

1. **Claude Code can run 24/7 on the VPS** without hitting rate limits or auth issues that require frequent human intervention. (Claude Max subscription active.)
2. **Google will index and rank helpful AI-generated content** when it provides genuine utility (working configs, real comparisons, comprehensive coverage).
3. **The self-hosting niche has sufficient search volume** to support $5K/month in affiliate + ad revenue. (Validated: r/selfhosted has 330K+ members, "self-hosted" keyword cluster has millions of monthly searches.)
4. **Cloudflare Pages free tier** can handle the build size (5,000+ pages) and traffic (100K+ monthly visits). If not, upgrade is available within budget.
5. **Hardware affiliate commissions** (NAS devices, mini PCs, drives) provide meaningful per-click revenue. Average NAS sale = $300-800, typical commission = 3-4% = $9-32 per conversion.
6. **Four department heads + sub-agents** can operate concurrently on the VPS without resource contention issues.
7. **DV Claude Code allocation is sufficient** for running 5+ agents 24/7.

---

## Approval Requested

The CEO requests approval to proceed with Phase B (Launch):
- Activate all 4 department head agents on the VPS
- Begin site construction (Technology)
- Begin content production (Operations)
- Begin SEO optimization and social media (Marketing)
- Begin analytics and reporting (BI & Finance)

- **→ APPROVED** — proceed as planned
- **→ APPROVED WITH MODIFICATIONS** — [specify changes]
- **→ REJECTED** — [specify concerns, CEO will revise]


---

## Founder Response — 2026-02-16

**→ APPROVED** — proceed as planned.


