# Technology Activity Log

## 2026-02-20 11:02 UTC — Iteration 11

- Inbox: 3 open messages (all FYI from Operations)
- Actions:
  - **Trigger:** `content-deployed` event (count=4) at 10:56 UTC — 4 content commits deployed via systemd timer.
  - Processed 3 FYI messages from Operations:
    1. Quality fixes — 17 articles updated (Docker version pinning). Confirmed deployed and live.
    2. 10 new hardware articles (qnap-vs-synology, intel-n305, zimaboard, etc.). Confirmed deployed and live.
    3. 9 new articles (Wiki, Ebooks, Replace guides — wikijs, dokuwiki, mediawiki, xwiki, etc.). Confirmed deployed and live.
  - Spot-checked 3 URLs (wikijs, budget-home-server-under-200, best/wiki) — all returning HTTP 200.
  - QA log shows 21/21 checks passed at 10:36 UTC (last deploy cycle).
  - Content count on disk: 768 articles (208 apps, 268 compare, 105 foundations, 100 hardware, 58 replace, 25 best, 4 troubleshooting).
  - Deploy timer next trigger: 11:05 UTC (will pick up any remaining changes).
- Commits: none
- Open items: none — inbox cleared
- Health: proxy ACTIVE, coordinator ACTIVE. Memory 6.2GB free / 7.6GB. Disk 65GB free / 75GB (11%). Social poster working (1938 posts remaining). 4/4 agent slots occupied (bi-finance, ceo, foundations-writer, technology). Marketing and operations queued on concurrency.
- Note: ops-foundations-writer got a writer slot despite writers=0 config (started via writer-slot-available trigger at 10:56). Not my scope to fix (coordinator config is CEO domain).

### Resolved inbox items (moved from inbox)

**From Operations (Feb 20 ~12:00):** Docker version pinning fixes — 17 articles updated. DEPLOYED. No action needed.
**From Operations/Hardware Writer (Feb 20):** 10 new hardware articles. DEPLOYED. All live.
**From Operations (Feb 20 10:30):** 9 new articles (Wiki, Ebooks, Replace). DEPLOYED. All live.

## 2026-02-20 10:07 UTC — Iteration 10

- Inbox: empty
- Actions:
  - **CRITICAL FIX: Deploy pipeline restored.** Discovered `auto-deploy.sh` had been dead since Feb 16 (OOM at 1GB heap + content schema error). ~605 content files were not live.
  - Manual deploy: built 741 articles (759 pages), uploaded 605 new files to CF Pages. QA: 21/21 passed.
  - Rewrote `bin/deploy-site.sh`: 2GB heap, flock concurrency protection, change detection, git pull, HTTPS_PROXY bypass, post-deploy QA.
  - Created systemd timer: `selfhosting-deploy.timer` runs every 30 min. Tested via manual `systemctl start` — build + deploy + QA all passed.
  - Social poster: working correctly — alternates X/Bluesky, 1918 items remaining in queue.
- Commits: none (deploy-site.sh and systemd files are VPS-local, not repo-tracked)
- Open items: none — inbox clear, deploy pipeline restored
- Health: proxy ACTIVE, coordinator ACTIVE, watchdog ACTIVE, portal ACTIVE. Memory 6.2GB free / 7.6GB. Disk 65GB free / 75GB (11%). No errors in coordinator.log. ops-hardware-writer currently running (1/1 writer slot). ops-foundations-writer in backoff (error #2).

## 2026-02-20 09:47 UTC — Iteration 9

- Inbox: 1 open message (IR: Build Board Portal — HIGH priority)
- Actions: Built and deployed Board Portal replacing old dashboard
  - Installed `marked` npm package
  - Generated 64-char hex auth token at `credentials/portal-token`
  - Built `bin/portal-server.js` (~650 lines): 8 HTML pages + 2 API endpoints
  - Security: bearer token auth, cookie sessions (HttpOnly/SameSite=Strict), HTML stripping, XSS prevention, rate limiting (10/hr/IP), credential redaction
  - Pages: Dashboard, Board Reports, Inbox (with form), Agents, Content & SEO, System Health, Alerts & Escalations, Commits
  - Tested all pages (200 with auth, 401 without), tested message submission API
  - Stopped and disabled old `selfhosting-dashboard` service
  - Created `selfhosting-portal.service`, enabled and started on port 8080
  - Verified on both localhost and external IP (5.161.102.207:8080)
- Commits: none yet (portal files to be committed)
- Open items: none — inbox cleared, portal live
- Health: proxy ACTIVE, coordinator ACTIVE, watchdog ACTIVE, portal ACTIVE. Memory 6.7GB free / 7.7GB total. Disk 65GB free / 75GB (11%). No errors.

### Resolved inbox items (moved from inbox)

**From IR (Feb 20 ~10:00):** Board Portal build request — COMPLETED. Portal live at :8080 with full spec implementation. Response sent to IR inbox with delivery details.

## 2026-02-16 07:03 UTC

### First iteration — Site built and deployed

**Inbox processed:** CEO directive (Launch Day priorities). Acknowledged all 3 priorities.

**Actions taken:**

1. **Initialized Astro 5.17.2 project** in `site/` subdirectory
   - Pinned deps: astro@5.17.2, @astrojs/sitemap@3.7.0, pagefind@1.4.0
   - Content collection schemas for all 7 types with Zod validation

2. **Built full site infrastructure:**
   - Base layout with OG tags, Twitter cards, canonical URLs, JSON-LD, GA4, Pagefind
   - Article layout with TOC sidebar, breadcrumbs, BreadcrumbList schema
   - Nav with category links, search, dark/light toggle
   - Homepage with category grid, WebSite schema
   - 7 category listing pages, 7 dynamic route pages, 4 static pages (about, privacy, terms, 404)
   - AffiliateDisclosure + ArticleList components

3. **Design system:** Dark mode default, light mode toggle, CSS custom properties, system font stack, responsive (900px/600px breakpoints)

4. **Technical SEO:** Article + SoftwareApplication + BreadcrumbList + WebSite JSON-LD, OG + Twitter meta, canonical URLs, XML sitemap, robots.txt

5. **Cloudflare Pages deployment:**
   - Created project, deployed 27 pages, custom domains added (selfhosting.sh + www)
   - Deploy script at `bin/deploy-site.sh`, wrangler@3.109.2

6. **Content integration:** Copied 15 articles from content-staging/ to site/src/content/

7. **Communications:** Notified Operations (content path + schema), notified CEO (site live)

- Result: SUCCESS
- Build: 27 pages in 3.53s
- Deploy: live at selfhosting-sh.pages.dev
- Next: Monitor domain activation, automated deploy, comparison table, app info card

### Additional work (same iteration)

8. **RSS feed** — `/rss.xml` with all published articles, @astrojs/rss@4.0.15
9. **Code block copy buttons** — JS adds copy button to all `<pre>` elements
10. **Security headers** — `_headers` file for Cloudflare Pages (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
11. **robots.txt updated** — Added Disallow for /search, /404
12. **Sitemap submitted to Google Search Console** — via service account API, `sc-domain:selfhosting.sh` property
13. **DNS CNAME records created** — `selfhosting.sh` and `www.selfhosting.sh` -> `selfhosting-sh.pages.dev` (proxied)
14. **Custom domain verification** — Status: active. SSL cert: pending (normal, 15-min wait)
15. **Content sync** — Copied new staging content, 4 more articles appeared from Operations writing directly to correct path
16. **Final deploy** — 31 pages live

### Health check
- VPS: 5% disk, 1.6GB/3.7GB RAM, load 0.28
- All 5 agent sessions active
- No supervisor errors

## 2026-02-16 07:20 UTC

### Second iteration — SEO schemas, auto-deploy, DNS verification

**Inbox processed:**
- BI & Finance: DNS not resolving + sitemap not submitted (RESOLVED — was propagation delay)
- Marketing: Remaining technical SEO items (PARTIALLY RESOLVED — 2 items remain)
- CEO: DNS fixed, deploy frequency, sitemap, content types (MOSTLY RESOLVED)
- Operations: 7 new app guides ready for deployment (RESOLVED — auto-deploy handles this)

**Actions taken:**

1. **DNS verification** — Both `selfhosting.sh` and `www.selfhosting.sh` resolve via 1.1.1.1 and 8.8.8.8. HTTP 200 on both. Cloudflare Pages domains `status=active`.

2. **GSC sitemap verification** — API confirms: submitted 07:10 UTC, downloaded by Google, 0 errors, 0 warnings.

3. **HowTo JSON-LD schema** — Auto-generated on all `foundations` articles from H2 headings (when >= 2 steps). Verified in build output.

4. **ItemList JSON-LD schema** — Auto-generated on `best` (roundup) articles when `apps` array is populated.

5. **CSP header** — Added Content-Security-Policy to `_headers` file. Allows self, GA4, gtag, inline styles/scripts (needed for theme toggle + Pagefind).

6. **Sitemap redirect** — Created `_redirects` file: `/sitemap.xml` → `/sitemap-index.xml` 301. Verified live.

7. **Search page** — Created `/search` page with Pagefind integration and `?q=` query parameter support.

8. **Enhanced 404** — Added Pagefind search and category links to 404 page.

9. **Automated deploy pipeline** — Created `bin/auto-deploy.sh`:
   - Checks for new/modified content every 5 minutes
   - Force-deploys every 30 minutes
   - Running in tmux session `auto-deploy`
   - First deploy: 34 pages, 0 errors

10. **Communications:**
    - Responded to BI (DNS resolved)
    - Updated Marketing (SEO progress)
    - Notified Operations (auto-deploy active, no manual deploy requests needed)
    - Updated CEO (iteration 2 summary)

- Result: SUCCESS
- Build: 35 pages
- Deploy: 34 pages live via auto-deploy
- Files changed: Article.astro, search.astro, 404.astro, _redirects, _headers, auto-deploy.sh
- Next: FAQPage schema, OG image generation

### Resolved inbox items (moved from inbox)

**From BI & Finance:** DNS issue + sitemap — RESOLVED. DNS was propagation delay (records were created last iteration). Sitemap confirmed submitted and downloaded by Google.

**From CEO:** Auto-deploy set up (5-min cycle). Sitemap redirect done. All content types verified ready. Code blocks + RSS already done.

**From Operations:** 7 articles deployed via auto-deploy (34 pages live).

### Health check
- VPS: 5% disk, 1.5GB/3.7GB RAM, load 0.22
- 6 tmux sessions: ceo, technology, marketing, operations, bi-finance, auto-deploy
- Auto-deploy: running, last deploy succeeded at 07:17 UTC
- No supervisor errors

## 2026-02-16 09:15 UTC

### Third iteration — Git conflict fix, OG image caching, SEO completion

**Inbox processed:**
- Marketing: FAQPage schema + OG image generation (RESOLVED — both already implemented, verified working)
- CEO: 7 writers launched notification (ACKNOWLEDGED — auto-deploy handling volume, monitoring memory)

**Actions taken:**

1. **Fixed supervisor.log git conflict** — Removed `logs/supervisor.log` and `.last-deploy-hash` from git tracking. Added to `.gitignore`. These runtime files were causing `Cannot rebase onto multiple branches` errors when multiple agents tried to commit simultaneously.

2. **Verified FAQPage schema** — Already implemented in Article.astro (lines 141-180). Verified in build output: 10+ articles generating valid FAQPage JSON-LD. Works across compare, hardware, foundations, and apps collections. Schema auto-detects `## FAQ` / `## Frequently Asked Questions` sections with `### Question` sub-headings.

3. **Verified OG image generation** — Already implemented via satori + sharp. 119 OG images generated at build time. Dark theme (#0f1117), green accent (#22c55e), terminal branding. Meta tags verified in HTML output (`og:image`, `twitter:image`, Article JSON-LD `image`).

4. **Implemented OG image build-time caching** — Added SHA256-based content hash caching to `og-image.ts`. Images cached in `node_modules/.og-cache/`. Build time improvement: regeneration-free on unchanged articles. Critical for scaling to 5,000+ articles.

5. **Pinned sharp dependency** — Added `"sharp": "0.34.5"` to package.json (was previously a transitive dependency only).

6. **Created empty content directories** — `best/` and `troubleshooting/` directories created so writers don't get filesystem errors.

7. **Communications:**
   - Updated Marketing: All technical SEO items complete (FAQPage + OG images)
   - Cleared Technology inbox — all items resolved
   - CEO notification acknowledged — monitoring memory and git conflicts

- Result: SUCCESS
- Build: 135 pages, 119 OG images, 122 indexed by Pagefind in 7.3s (cached build)
- Deploy: auto-deploy active, last deploy at 09:01 UTC with 62 pages
- Files changed: .gitignore, site/src/lib/og-image.ts, site/package.json
- Next: Monitor writer velocity impact on build times, VPS memory (656MB available), prepare for content scaling

### Resolved inbox items (moved from inbox)

**From Marketing:** Technical SEO spec — ALL RESOLVED. FAQPage schema and OG image generation both confirmed working. Full technical SEO implementation complete.

**From CEO:** 7 writers launched — ACKNOWLEDGED. Auto-deploy running (5-min cycle). Memory monitored (656MB available with 13 sessions). Git conflict on supervisor.log fixed by removing from tracking.

### Health check
- VPS: 5% disk, 656MB/3.7GB RAM available, 13 tmux sessions, 26 claude processes
- Memory tighter than last iteration (was 1.5GB available, now 656MB) — within operating range but monitoring
- Auto-deploy: running, last deploy at 09:01 UTC, 62 pages deployed
- Content velocity: 125 articles on disk (up from ~56 last iteration)
- Git conflict on supervisor.log fixed — should not recur
- No OOM kills observed

## 2026-02-16 09:20 UTC

### Fourth iteration — Related Articles, Hardware nav, TOC active state

**Inbox processed:** No open messages. Inbox clean.

**Actions taken:**

1. **Implemented Related Articles component** — New `RelatedArticles.astro` component that scores articles by relevance: shared apps (4x), same category (3x), shared tags (2x), same collection (1x). Shows top 6 related articles at bottom of every article page. Verified: Immich page shows PhotoPrism comparison, LibrePhotos comparison, Google Photos replacement guide — highly relevant cross-links. Critical for SEO topical authority and internal linking.

2. **Added Hardware to navigation** — Hardware content type (8+ articles) now appears in main nav between "Replace" and "Foundations". Also added to homepage category grid with article count.

3. **Homepage improvements** — Added Hardware collection to homepage category grid. Added dynamic article count ("172 guides and growing") as social proof / trust signal.

4. **Fixed RelatedArticles CSS duplication** — Removed scoped `<style>` block from component (used wrong CSS variable names `var(--text)` instead of `var(--text-primary)`). Global CSS already had correct styles. Added `.related-collection` style to global CSS.

5. **Added TOC active state highlighting** — IntersectionObserver-based script that highlights the current section in the TOC sidebar as the user scrolls. Improves navigation UX and reduces bounce rate.

6. **Health check:**
   - VPS: 5% disk (3.3G/75G), 647MB RAM available, 24 claude processes, 13 tmux sessions
   - All agent sessions running
   - Build: 197 pages in 5.61s (up from 162 last iteration)
   - Content: 143+ articles on disk (fast-growing, 25+ new files appeared during iteration)
   - Live site: HTTP 200 in 0.1s
   - Auto-deploy: running, handling content flow
   - No errors in supervisor log

- Result: SUCCESS
- Build: 197 pages in 5.61s (fast, within target)
- Deploy: 3 commits pushed to GitHub (RelatedArticles, homepage, CSS fix)
- Files changed: RelatedArticles.astro (new), Article.astro, Nav.astro, index.astro, global.css
- Next: Monitor build time scaling, consider comparison table component, email signup form

## 2026-02-16 09:28 UTC

### Fifth iteration — Email signup, table responsiveness, category-grouped listings

**Inbox processed:** No open messages. Inbox clean.

**Actions taken:**

1. **Email signup component** — New `EmailSignup.astro` component at bottom of every article. Clean single-field form with subscribe button. Responsive (stacks vertically on mobile). Renders after Related Articles section.

2. **Table responsiveness** — Added JavaScript in Article layout to wrap all `<table>` elements in `.table-wrapper` divs for horizontal scrolling on mobile. Added alternating row background color for better readability.

3. **Category-grouped listing pages** — Enhanced `ArticleList.astro` with `groupByCategory` prop. When enabled, articles are grouped by category with section headers and a jump-nav at top showing category names with article counts. Enabled on `/apps/` and `/compare/` pages. Added human-friendly category name mapping (e.g., "reverse-proxy-ssl" → "Reverse Proxy & SSL").

4. **Article count on all listing pages** — All 6 listing pages (apps, compare, replace, hardware, foundations, best) now show dynamic article count in the description paragraph.

5. **OOM prevention** — First build was killed by OOM. Added `NODE_OPTIONS='--max-old-space-size=256'` to auto-deploy script's build step. Verified builds pass with this constraint.

6. **Health check:**
   - VPS: 5% disk (3.3G/75G), 467MB RAM available, 25 claude processes, 13 tmux sessions
   - All agent sessions running
   - Build: 244 pages in 7.16s (up from 211 last iteration — +33 pages in ~8 mins)
   - Content: 197+ articles on disk, growing fast
   - Live site: pushed to GitHub, Cloudflare Pages building

- Result: SUCCESS
- Build: 244 pages in 7.16s
- Deploy: 1 commit pushed (email signup, tables, category listings)
- Files changed: EmailSignup.astro (new), ArticleList.astro, Article.astro, global.css, 6 listing page files, auto-deploy.sh
- Next: Monitor memory (467MB free), build scaling at 244+ pages, consider prerequisites component

## 2026-02-20 06:00 UTC

### Sixth iteration — All CEO priorities completed

**Trigger:** inbox-message + content-deployed event (42 articles)

**Inbox processed:**
- CEO directive (Feb 20 ~05:50): Consolidated priorities — 4 items. ALL RESOLVED this iteration.
- Operations FYI (Feb 20 ~06:15): 40 new articles (AI/ML + Search Engines categories). ACKNOWLEDGED — auto-deploy handles.

**Actions taken:**

1. **GSC sitemap warnings: INVESTIGATED**
   - Queried GSC Sitemaps API directly via service account JWT auth.
   - Result: 0 warnings, 0 errors on both sitemap-index.xml and sitemap-0.xml.
   - Sitemap XML well-formed, 649 URLs, all sampled URLs return 200.
   - GSC still shows 516 submitted URLs (hasn't recrawled latest version).
   - Resubmitted sitemap-index.xml to GSC (HTTP 204 success).
   - Conclusion: "3 warnings" from Marketing were either transient or resolved by CEO's search fix.

2. **Playwright MCP: INSTALLED**
   - Ran `npx playwright install chromium --with-deps` — Chromium + headless shell + ffmpeg installed.
   - Created `~/.claude/mcp.json` with `@playwright/mcp@0.0.68` in headless mode.
   - Verified: server starts, process runs cleanly.
   - Unblocks Marketing for social media credential generation.

3. **Status dashboard: BUILT AND DEPLOYED**
   - Created `bin/dashboard.js` — lightweight Node.js HTTP server at :8080.
   - Features: system health (memory/disk/load bars), article counts by collection, infrastructure service status, agent status from coordinator-state.json, recent coordinator log, recent deploy log, latest board report, social queue stats.
   - Dark theme matching site aesthetic. Auto-refreshes every 30s. JSON API at `/api/status`.
   - Created systemd service `selfhosting-dashboard`, enabled and started.
   - Verified: responding on localhost:8080 and 5.161.102.207:8080.

4. **Post-deploy QA automation: BUILT AND INTEGRATED**
   - Created `bin/post-deploy-qa.sh` — 21 checks across: homepage, Pagefind assets (3), sitemap (2), static pages (3), category listings (4), sample articles (4), RSS, robots.txt, 404 page, OG tags.
   - All 21 checks passing on production.
   - Integrated into auto-deploy.sh — runs after each successful deploy (non-blocking, logs to logs/qa.log).

5. **Strategy document updated** — `agents/technology/strategy.md` rewritten with current priorities, completed items, standing decisions, and open questions.

6. **State.md updated** — Dashboard and Playwright MCP marked complete in Founder Directives Status.

7. **Communications:**
   - Wrote status report to CEO inbox with all 4 completed items.
   - Cleared Technology inbox (both messages processed).

- Result: SUCCESS
- Files created: bin/dashboard.js, bin/selfhosting-dashboard.service, bin/post-deploy-qa.sh
- Files modified: bin/auto-deploy.sh (QA integration), state.md, agents/technology/strategy.md, inbox/ceo.md
- Systemd: selfhosting-dashboard.service enabled and active
- Next: Monitor dashboard stability, watch build times as articles scale, respond to any new requests

### Resolved inbox items (moved from inbox)

**From CEO (Feb 20 ~05:50):** Consolidated priorities — 4 items. ALL RESOLVED: GSC sitemap (no issues found), Playwright MCP (installed), Dashboard (live at :8080), Post-deploy QA (21 checks, integrated).

**From Operations (Feb 20 ~06:15):** 40 new AI/ML + Search Engines articles. ACKNOWLEDGED — auto-deploy handles content commits automatically.

### Health check
- VPS: 10% disk (7.5G/75G), 6.0GB/7.7GB RAM available, load 0.05
- selfhosting-proxy: active
- selfhosting-coordinator: active
- selfhosting-dashboard: active (NEW)
- Content: 640 articles on disk
- No errors in coordinator log for this iteration

### Late-arriving CEO message (processed same iteration)

**From CEO (Feb 20 ~06:15):** CLAUDE.md updated with MANDATORY DISCIPLINE section. Asked to confirm 4 resolved items + investigate GSC + verify AI/ML articles.

All items already completed earlier in this iteration:
1. **Site search: CONFIRMED** — pagefind.js and pagefind-ui.js both returning 200.
2. **Playwright MCP: CONFIRMED** — `@playwright/mcp@0.0.68` installed, `~/.claude/mcp.json` config present, Chromium headless available.
3. **Dashboard: CONFIRMED** — systemd service `selfhosting-dashboard` active, HTTP 200 on localhost:8080.
4. **Post-deploy QA: CONFIRMED** — script at `bin/post-deploy-qa.sh`, 21 checks, integrated into auto-deploy.
5. **GSC sitemap: CONFIRMED** — API shows 0 warnings, 0 errors. Sitemap resubmitted with 649 URLs.
6. **AI/ML + Search articles: CONFIRMED** — articles exist on disk (ollama, open-webui, localai, searxng, meilisearch, typesense). Auto-deploy will pick them up.

**MANDATORY DISCIPLINE section read and acknowledged.** Will follow all rules in subsequent iterations.

## 2026-02-20 06:30 UTC — Iteration 7

- Inbox: empty (0 open messages)
- Actions: Full health check pass. Verified build (651 pages, 21.5s build time, Pagefind 650 pages indexed). Spot-checked live site — all key URLs returning HTTP 200 with TTFB 77-125ms. QA log shows 21/21 checks passing. Confirmed all 3 infrastructure services active (proxy, coordinator, watchdog). VPS healthy (11% disk, 6.4GB RAM free).
- Commits: none
- Open items: none — inbox empty, no pending requests
- Health: proxy ACTIVE, coordinator ACTIVE, watchdog ACTIVE, dashboard ACTIVE. Memory 6.4GB free / 7.6GB total. Disk 65GB free / 75GB total. Build time nominal at 21.5s for 651 pages.
- Content counts: 644 articles on disk (165 apps, 221 compare, 21 best, 50 replace, 79 hardware, 104 foundations, 4 troubleshooting). 2 new compare articles uncommitted (writer pipeline will pick up).
- Note: No proactive work needed — all CEO directives completed last iteration, no inbox items, no health warnings. Clean exit.

## 2026-02-20 06:41 UTC — Iteration 8

- Inbox: empty (0 open messages)
- Trigger: content-deployed event (2 articles at 06:34:42Z) — archived before this iteration started
- Actions: Verified build output current (651 pages, built at 06:33 UTC). No content files newer than build. QA log: 21/21 passing (06:11 UTC). Live site HTTP 200. All 4 infrastructure services active. Social poster running (1933 queue, posting ~1/30min Bluesky, ~1/60min X). Coordinator log clean — all agents exiting code=0, no backoff warnings.
- Commits: none
- Open items: none — inbox empty, no pending requests
- Health: proxy ACTIVE, coordinator ACTIVE, watchdog ACTIVE, dashboard ACTIVE. Memory 6.1GB free / 7.6GB total. Disk 65GB free / 75GB (11%). No errors in coordinator log. Build output up to date.
- Note: Clean iteration — deploy event triggered this run but build was already complete. No action required beyond verification. All systems nominal.
