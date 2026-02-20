# Technology Activity Log

## 2026-02-20 16:40 UTC — Iteration 20
- Inbox: 1 open message (CEO directive — newsletter subscribe form broken, CRITICAL)
- Trigger: pending-trigger
- Actions:
  - **CRITICAL FIX: Newsletter subscribe/unsubscribe pipeline — IMPLEMENTED AND LIVE**
  - CEO directive: founder tested subscribe form, got 404 at `/api/subscribe`. Form was broken — no backend handler existed.
  - **Architecture:** Cloudflare Pages Functions proxy to VPS portal-server.js endpoints. Subscribers stored in `data/subscribers.json` on VPS.
    - Reason for VPS storage: Resend API key is send-only (can't manage contacts/audiences — returns 401). Cloudflare KV requires token permission update (current token lacks KV scope).
  - **Subscribe endpoint (`/api/subscribe`):**
    - CF Pages Function at `site/functions/api/subscribe.ts` — proxies POST to `https://portal.selfhosting.sh/api/newsletter/subscribe`
    - Portal handler: validates email, stores in JSON file, handles duplicates (idempotent), returns JSON or redirect
    - JS-enhanced form: fetch with inline success/error messages (no page reload)
    - Fallback for no-JS: form POST redirects to `/subscribed/` page
  - **Unsubscribe endpoint (`/api/unsubscribe`):**
    - CF Pages Function at `site/functions/api/unsubscribe.ts` — proxies GET to portal
    - Portal handler: marks subscriber as unsubscribed in JSON file, renders confirmation HTML
    - Always shows success (doesn't leak whether email exists — security best practice)
    - CAN-SPAM/GDPR compliant: every newsletter email will include unsubscribe link
  - **EmailSignup.astro updated:**
    - Form action changed from `https://selfhosting.sh/api/subscribe` to `/api/subscribe` (relative)
    - Added JS `fetch` handler with inline success/error state
    - Added `aria-live="polite"` message div for accessibility
    - Added CSS for disabled button, success, and error message states
  - **Subscribed confirmation page (`/subscribed/`):**
    - Astro page with success card
    - Handles `?error=` query param for error display
    - Matches site dark theme
  - **Newsletter sending script (`bin/send-newsletter.sh`):**
    - Reads subscribers from `data/subscribers.json`
    - Sends individual emails via Resend API with unsubscribe footer
    - Respects rate limits (100/day free tier), logs to `logs/newsletter.log`
  - **RESEND_API_KEY set as CF Pages secret** (via `wrangler pages secret put`)
  - **data/ and logs/newsletter.log added to .gitignore** (runtime data)
  - Tested end-to-end: subscribe, duplicate, invalid email, unsubscribe — all working on live `selfhosting.sh`
  - QA: 21/21 post-deploy checks passing
  - Responded to CEO via inbox
- Commits:
  - `[tech] Implement newsletter subscribe/unsubscribe pipeline` (239d4f4)
  - `[tech] Switch newsletter to VPS-backed subscriber storage` (951cbdc)
- Open items:
  - Resend API key needs upgrade for contacts/audiences access (escalated to CEO — currently send-only)
  - Cloudflare API token needs KV permissions if we want to move subscribers to CF KV in the future (escalated to CEO)
- Health: proxy ACTIVE, coordinator ACTIVE, portal ACTIVE. Memory 807MB used / 7.6GB (6.8GB available). Disk 7.6GB used / 75GB (11%). All healthy.

### Resolved inbox items (moved from inbox)

**From CEO (Feb 20 ~17:30):** CRITICAL founder directive — newsletter subscribe form broken. FIXED AND DEPLOYED. Full subscribe/unsubscribe pipeline live. Pages Functions proxy to VPS portal. Subscribers stored locally. Newsletter sending script ready. COMPLETED.

## 2026-02-20 16:14 UTC — Iteration 19
- Inbox: empty
- Trigger: pending-trigger (queued from inbox-message during previous iteration)
- Actions:
  - Full operating loop pass — read all state files, learnings, logs
  - Health check: proxy ACTIVE, coordinator ACTIVE, deploy timer ACTIVE (next fire in ~22 min)
  - QA failure investigation: `hardware/10gbe-networking` got HTTP 000 during post-deploy QA at 16:07 UTC. Verified page is serving HTTP 200 (110ms) — transient network timeout during CF Pages deploy propagation. Not a real issue.
  - Test build: 792 pages, 779 indexed by Pagefind, 0 warnings, 0 errors, ~8s build time. Clean.
  - No inbox items to process. Writers paused until Feb 22. All systems healthy.
- Commits: none
- Open items: none
- Health: proxy ACTIVE, coordinator ACTIVE, deploy timer ACTIVE. Memory 1.2GB used / 7.6GB (6.4GB available). Disk 7.6GB used / 75GB (11%). All healthy.

## 2026-02-20 17:00 UTC — Iteration 18
- Inbox: 1 open message (IR — Portal v3 build request, HIGH urgency / founder directive)
- Trigger: pending-trigger
- Actions:
  - **Portal v3: Agent Instructions + Growth Metrics Dashboard — BOTH SHIPPED**
  - **Feature 1: Agent Instructions (`/instructions`)**
    - 14-agent registry with hardcoded paths (no path traversal)
    - Tab-style agent buttons — click to load via `/api/claude-md?agent={key}` (JS fetch, no page reload)
    - CEO: Edit/View toggle with textarea + Save (POST `/api/claude-md?agent=ceo`)
    - All others: rendered Markdown, read-only
    - Validation: POST restricted to `agent=ceo`, content non-empty, max 500KB, must start with `#`
    - Credential redaction applied to all content via `redactCredentials()`
  - **Feature 2: Growth Metrics Dashboard (`/growth`)**
    - 6 top-line metric cards: Articles, GSC Impressions, GSC Clicks, GA4 Page Views, Page-1 Keywords, Social Followers
    - Content & SEO: GSC 7-day performance summary, daily impressions sparkline, top pages/queries tables, position bracket breakdown
    - GA4: daily page views sparkline, engagement metrics (bounce rate, avg session), top pages by views, traffic sources
    - Social: per-platform table (X, Bluesky, Mastodon, Reddit, Dev.to, Hashnode) with last post time, follower counts, status badges
    - Operational health: agent iteration table with status, system resource summary
    - Data sources: GSC cached file fallback → live API, GA4 live API, Bluesky/Mastodon public APIs
    - JWT auth: `crypto.createSign('RSA-SHA256')` for Google service account, token cached 55 min
    - All API results cached 1 hour in-memory via `getCachedAsync()`
    - Graceful fallback: "--" or "N/A" on any API failure, never crashes page
    - Async handler: `.then()` pattern for async page generation
    - Color coding: green/yellow/red based on scorecard targets
  - **Nav Update:** Added Growth + Instructions between Content and System
  - **No new dependencies** — all via Node.js built-in `https` and `crypto`
  - **HTTP helpers added:** `httpPost()`, `httpGet()` for external API calls with 15s timeout
  - Portal restarted, all verifications passed: Instructions HTTP 200, Growth HTTP 200 (20KB), API endpoints working, security checks passing
  - Responded to IR inbox with full delivery confirmation
- Commits: none (portal-server.js is VPS-local, not repo-tracked)
- Open items: none — inbox cleared
- Health: proxy ACTIVE, coordinator ACTIVE, portal ACTIVE. Memory 963MB used / 7.6GB (6.6GB available). Disk 7.6GB used / 75GB (11%). All healthy.

### Resolved inbox items (moved from inbox)

**From IR (Feb 20 ~16:50):** Portal v3 — Agent Instructions + Growth Metrics Dashboard build request. Both features shipped: /instructions (14 agents, CEO editable, API-driven), /growth (6 top-line cards, GSC+GA4+Social data, async, cached). Nav updated. Portal restarted. COMPLETED.

## 2026-02-20 16:00 UTC — Iteration 17
- Inbox: 1 open message (Marketing — homepage not indexed by Google, MEDIUM urgency)
- Trigger: inbox-missed
- Actions:
  - **Homepage indexing investigation (MEDIUM):** Marketing reported homepage "Discovered — currently not indexed" in GSC after 4+ days. Ran all 5 requested checks:
    1. robots.txt — Clean. `Allow: /`. No homepage blocking.
    2. Noindex meta — None. No `<meta name="robots">` tag, no `X-Robots-Tag` header.
    3. Canonical — Correctly self-referencing `https://selfhosting.sh/`.
    4. HTTP response — HTTP/2 200, no redirects, 12.8KB, proper content-type.
    5. Sitemap — Homepage is first entry in `sitemap-0.xml`.
  - **Conclusion:** Zero technical crawl blockers found. This is normal Google behavior for new domains — prioritizing content pages during initial discovery.
  - Responded to Marketing via `inbox/marketing.md` with full findings.
- Commits: none
- Open items: none — inbox cleared
- Health: proxy ACTIVE, coordinator ACTIVE. Memory 1.3GB used / 7.6GB (6.3GB available). Disk 7.6GB used / 75GB (11%). All healthy.

### Resolved inbox items (moved from inbox)

**From Marketing (Feb 20 ~16:30):** Homepage not indexed by Google — investigate crawl blockers. All 5 checks clean. No technical issues found. COMPLETED.

## 2026-02-20 15:30 UTC — Iteration 16
- Inbox: 1 open message (CEO directive — share buttons, page speed, marketing standing seat, HIGH urgency)
- Trigger: inbox-message
- Actions:
  - **ShareButtons.astro component (HIGH):** Built and integrated per CEO directive. 6 share targets: X/Twitter (@selfhostingsh via), Reddit, Hacker News, LinkedIn, Bluesky, Copy Link (clipboard). Pure HTML/CSS + inline SVG icons. Scoped styles matching dark theme. Added to Article.astro header after article-meta div.
  - **Page speed refinements (MEDIUM):** (1) `prefetch: true` in astro.config.mjs. (2) `<link rel="preconnect" href="https://www.googletagmanager.com">` in Base.astro head. (3) Pagefind CSS/JS made conditional via `pagefind` prop on Base.astro — only loaded when `pagefind={true}` (index.astro, search.astro, 404.astro). Article pages no longer load ~50KB of unused Pagefind assets.
  - **Marketing standing seat (PROCESS CHANGE):** Noted in strategy.md Standing Decisions table. Will brief Marketing before shipping user-facing features.
  - Acknowledged to CEO via inbox/ceo.md.
  - Updated strategy.md with completed work and new standing decisions.
- Commits: [tech] Add share buttons, page speed refinements, conditional Pagefind loading
- Open items: none — inbox cleared
- Health: proxy ACTIVE, coordinator ACTIVE. Memory 1.0GB used / 7.6GB (6.5GB available). Disk 7.6GB used / 75GB (11%). All healthy.

### Resolved inbox items (moved from inbox)

**From CEO (Feb 20 ~15:15):** Founder directive — share buttons, page speed, marketing standing seat. All 3 items implemented. Build verified (792 pages, 779 indexed). COMPLETED.

## 2026-02-20 14:45 UTC — Iteration 15
- Inbox: 1 open message (IR security bug-report — credential leakage in board portal, HIGH urgency)
- Trigger: pending-trigger
- Actions:
  - **SECURITY FIX (HIGH): Credential leakage in Board Reports page**
    - Problem: `getBoardReports()` listed ALL files in `board/` directory. `human-dependency-audit-2026-02-20.md` contains plaintext passwords (Mastodon, Dev.to, Reddit) and was rendered in the portal HTML.
    - Fix 1 (file exclusion): `getBoardReports()` now filters to `day-*.md` and `founding-report.md` only. Operational files excluded.
    - Fix 2 (defense-in-depth): `redactCredentials()` enhanced with 6 new patterns — Password/API Key/Token/Secret labels (backticked and plain), sed credential commands, Bluesky app password format (xxxx-xxxx-xxxx-xxxx). Applied to ALL `renderMarkdown()` calls and search `data-text` attributes.
    - Portal restarted. Verified: zero credentials in rendered HTML. Legitimate board reports still display.
  - Responded to IR inbox with fix confirmation.
- Commits: none (portal-server.js is VPS-local, not repo-tracked)
- Open items: none — inbox cleared
- Health: proxy ACTIVE, coordinator ACTIVE, portal ACTIVE. Memory 813MB used / 7.6GB (6.8GB available). Disk 7.6GB used / 75GB (11%). All healthy.

### Resolved inbox items (moved from inbox)

**From IR (Feb 20 ~14:30):** Credential leakage in Board Reports page — passwords from human-dependency-audit file rendered in HTML. FIXED with file exclusion + regex redaction defense-in-depth. Portal restarted and verified.

## 2026-02-20 13:15 UTC — Iteration 14

- Inbox: 1 open message (IR bug-report, 3 portal bugs — IMPORTANT)
- Trigger: inbox-message
- Actions:
  - **Bug 1 (HIGH): Latest board report detection** — `getLatestBoardReport()` now filters to files matching `day-*.md` pattern. `social-credentials-request.md` no longer selected as "latest." Board Reports listing page still shows all files.
  - **Bug 2 (LOW): Dynamic scorecard values** — New `parseScorecardFromReport()` function parses the `## Scorecard vs Target` table from the latest board report. Dashboard now shows actual values for Page 1 Keywords, Monthly Visits, and Revenue instead of hardcoded strings.
  - **Bug 3 (LOW): Paused writers showing active errors** — New `getAgentWakeConfig()` and `isAgentPaused()` functions check for "PAUSED" keyword in `wake-on.conf`. Paused agents: excluded from `isActiveError()` alert count, show "paused" status badge (grey), and display "(last error: Xh ago — paused)" instead of "active."
  - Portal restarted and verified: all 3 fixes confirmed working via functional tests.
  - Responded to IR inbox with fix summary.
- Commits: none (portal-server.js is VPS-local, not repo-tracked)
- Open items: none — inbox cleared
- Health: proxy ACTIVE, coordinator ACTIVE, portal ACTIVE. Memory 979MB used / 7.6GB (6.6GB available). Disk 7.6GB used / 75GB (11%).

### Resolved inbox items (moved from inbox)

**From IR (Feb 20 ~13:00):** Portal v2 — Three bugs found during QA review. All 3 fixed and deployed. COMPLETED.

## 2026-02-20 12:55 UTC — Iteration 13

- Inbox: 2 open messages (CEO directive HIGH + IR build-request CRITICAL/HIGH/MEDIUM)
- Trigger: inbox-message
- Actions:
  - **Portal v2: Full security + UI + alert logic overhaul** — implemented all items from IR portal-improvement-spec.md
  - **Security (CRITICAL):**
    - Login page at `/login` with username/password auth (admin + auto-generated 32-char password at `credentials/portal-password`)
    - Server-side sessions: 64-hex token in memory map, 24h expiry, `HttpOnly; SameSite=Strict; Secure` cookies
    - Brute force protection: 5 failed attempts per IP per 15 min → 429
    - Removed `?token=` URL auth entirely. Bearer token retained for `/api/status` backward compat.
    - Logout route `/logout` + logout link in header
  - **HTTPS (CRITICAL):**
    - Created Cloudflare DNS A record: `portal.selfhosting.sh` → `5.161.102.207` (proxied, orange cloud)
    - Generated self-signed SSL cert at `credentials/ssl/portal-{key,cert}.pem` (10-year validity)
    - Portal now listens on 3 ports: 8080 (direct), 80 (HTTP), 443 (HTTPS)
    - Added `AmbientCapabilities=CAP_NET_BIND_SERVICE` to systemd service
    - `https://portal.selfhosting.sh` verified working — Cloudflare SSL terminates at edge, connects to origin on 443 (Full mode)
  - **UI Polish (HIGH):**
    - Body font: 13→15px. Nav: 12→14px. Tables: 12→14px. Header: 16→18px. Cards: 12→13px. All 11px→12px min.
    - Markdown h1: 20→24px. h2: 16→18px. h3: 14→16px. Big metric: 22→28px. Pre: 11→13px.
    - Header shadow, card hover effects, alternating table rows, larger card padding (16→20px), content padding (20→24px)
    - Progress bars: 8→12px height with inner shadow. Form focus states (green glow). Button transitions. Search box focus.
    - Accordion: larger padding. Alert items: 4px left border. Border-radius bumped throughout.
    - Global: letter-spacing 0.01em, font-smoothing antialiased
  - **Alert Logic (MEDIUM):**
    - `isActiveError()` now takes agent name, reads `wake-on.conf` for dynamic interval detection
    - Falls back to: ops- writers 48h, IR 168h, dept heads 8h
    - Error is "active" only if within 1.5× expected interval
    - Agents page: shows "(last error: Xh ago — stale)" or "(last error: Xm ago — active)"
    - Alerts page: shows error age with active/stale classification
    - `getAlertCount()` passes agent name through
  - **Minor improvements:**
    - Auto-refresh indicator: "Auto-refreshes every 60s" shown in header
    - Mobile responsive: reduced content padding, stacked metrics, smaller table font on mobile
    - Logout link in header (right side, next to timestamp)
  - Acknowledged IR via inbox with full implementation summary
- Commits: none (portal-server.js is VPS-local, not repo-tracked)
- Open items: none — inbox cleared, all spec items implemented
- Health: proxy ACTIVE, coordinator ACTIVE, portal ACTIVE (3 ports). Memory 6.2GB free / 7.6GB. Disk 65GB free / 75GB (11%).

### Resolved inbox items (moved from inbox)

**From CEO (Feb 20 ~11:15):** FOUNDER DIRECTIVE — Portal improvements. DNS record created, full spec implemented. COMPLETED.
**From IR (Feb 20 ~12:30):** Portal Improvement Spec v2. All priorities implemented (security, UI, alerts, HTTPS, minor). COMPLETED.

## 2026-02-20 11:13 UTC — Iteration 12

- Inbox: empty (0 open messages)
- Trigger: `content-deployed` event (count=5) at 11:10 UTC
- Actions:
  - Verified deploy: 788 pages live, 153 new files uploaded at 11:06 UTC. QA: 21/21 passed.
  - Live site: HTTP 200, 0.29s response time.
  - Content on disk: 779 articles.
  - Deploy timer: ACTIVE, next run at 11:36 UTC.
  - Noted: coordinator triggered MODEL_FALLBACK at 11:11 UTC (ops-foundations-writer exit code 3 — wrong model served). ALL agents paused until 16:11 UTC. This is CEO/coordinator domain, not actionable by Technology.
- Commits: none
- Open items: none — inbox empty, deploy verified, no pending requests
- Health: proxy ACTIVE, coordinator ACTIVE, portal ACTIVE. Memory 6.4GB free / 7.6GB total. Disk 65GB free / 75GB (11%). Social poster working (1936 posts remaining, 3 platforms active). No agent backoff warnings (pre-pause). Deploy pipeline nominal.

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
