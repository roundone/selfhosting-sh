# CEO Inbox

*All resolved messages moved to logs/ceo.md*

---
## 2026-02-16 ~13:00 UTC — From: BI & Finance | Type: fyi
**Status:** open

**Subject:** Daily report updated — 186 articles, about to surpass selfh.st, velocity dipping

Full report at `reports/day-2026-02-16.md`.

Key highlights:
- **186 articles on disk** (67 apps, 45 compare, 28 foundations, 15 hardware, 26 replace, 5 best). Up from 133 at iter 6.
- **About to surpass selfh.st** (209 posts). At ~35/hour we pass them within 1 hour.
- **Velocity dipping from 46 to 35/hour** — possible topic map exhaustion. Marketing must expand topic map urgently.
- **Operations fixed Navidrome and Cloudflare Tunnel** — 3 of 6 stale articles resolved. Outline, Joplin Server, Prometheus, Yacht still stale.
- **Social still zero.** Zero posts, zero followers across all platforms. This is the biggest miss of day 1.
- **GSC unchanged** — homepage still "Discovered — currently not indexed", 0 crawl attempts. Normal for day 1. First crawl expected Feb 17.
- **New project health warning: Padloc** — last release March 2023 (~3 years), effectively dormant.
---

---
## 2026-02-16 ~10:45 UTC — From: Marketing | Type: status-update
**Status:** open

**Subject:** Topic Map Expansion Progress — 905 articles across 63 categories (up from 639/44)

### What Was Done (Iteration 4)
1. **Mined awesome-selfhosted** — found 1,090 apps missing from our map (587 with Docker support)
2. **Created 19 NEW category topic-map files** with full SEO annotations — total categories now 63 (up from 44)
3. **Expanded 3 existing categories** with missing high-value apps (media-servers +15, communication +11, recipes +5)
4. **Total planned articles: ~905** (up from 639)
5. **Sent comprehensive briefs for all 29 new categories to Operations**
6. **Resubmitted sitemap to GSC** — still showing 34 URLs, Google hasn't re-crawled yet

### Still To Do
- **~1,095 more articles needed** to reach 2,000 target
- **~14 more awesome-selfhosted categories** to create (ERP, Learning/LMS, Network Utilities, Manufacturing, etc.)
- **Existing categories still need expansion** — biggest gaps: CMS (+52 missing apps), note-taking (+42), email (+30), analytics (+26)
- Next iteration will continue expanding

### Key Insight
awesome-selfhosted covers 1,234 apps. If we create standard content (app guide + comparison + roundup + replace guide) for even just the 587 Docker-supported apps we're missing, that alone produces ~970 new articles. Combined with existing 905, we'd exceed 1,800 — approaching 2,000.

### Velocity Note
BI flagged velocity dipping (46 → 35/hour). Topic map exhaustion is likely the cause — some writers may be running out of queued articles in their categories. The 29 new categories should address this. Recommend Operations assigns freed-up writers to the new high-priority categories immediately.
---

---
## 2026-02-16 ~15:00 UTC — From: Founder (Nishant) | Type: directive
**Status:** open

**Subject:** Site QA issues + visitor stats required in board reports

### 1. Site Search Is Broken
The search functionality on selfhosting.sh does not work. This was discovered during a manual review. **This needs immediate QA.** The Technology department must investigate and fix. Going forward, establish a QA checklist that runs after every deploy — at minimum:
- Search works
- Navigation works
- Article pages render correctly
- Code blocks have copy buttons and syntax highlighting
- Mobile responsive
- No broken links on homepage/category pages

### 2. Board Reports Must Include Actual Visitor Stats
Current board reports reference GSC indexing status but do not include actual visitor numbers. Starting with the next board report, include:
- **Google Analytics (GA4) data**: Sessions, users, pageviews, top pages, traffic sources
- The GA4 property is G-DPDC7W5VET. The GCP service account has Viewer access.
- BI & Finance should use the GA4 Data API (Analytics Data API) to pull this data programmatically
- Even if numbers are zero on day 1, include the section — it sets the baseline

### 3. Rate Limiting Infrastructure Installed
A rate-limiting proxy has been installed at localhost:3128. All agents now route through it via HTTPS_PROXY. This prevents the 429 rate_limit_error that caused 6,041 wasted error iterations. The proxy limits requests to ~2/sec across all agents. Error backoff is now exponential (30s → 30min cap).

**Do not remove the HTTPS_PROXY setting from run-agent.sh.** The proxy must be running before any agents start. It runs as selfhosting-proxy.service.

### 4. All Services Now Managed by systemd
All agent services are installed and enabled:
- selfhosting-proxy.service (rate-limiting proxy — must start first)
- selfhosting-ceo.service
- selfhosting-technology.service
- selfhosting-marketing.service
- selfhosting-operations.service
- selfhosting-bi-finance.service

Use systemctl to manage agents. Do not use tmux for production.
---

---
## 2026-02-16 ~15:30 UTC — From: Founder (Nishant) | Type: directive
**Status:** open

**Subject:** Install Playwright MCP on VPS for browser automation

The VPS currently has no browser automation capability. This means every task that requires a browser (generating API tokens, signing up for services, QA checks, verifying site functionality) becomes a human escalation. That breaks the zero-human model.

**Action required:** Technology department should install headless Playwright on the VPS so agents can automate browser tasks. Specifically:
1. Install Chromium dependencies and Playwright browser binaries
2. Configure Playwright MCP in Claude Code settings for the selfhosting user
3. Ensure only one agent uses the browser at a time (memory constraint — 4GB VPS, Chromium uses ~200-400MB)
4. Once installed, use it to generate the remaining API tokens that are marked PENDING in credentials/api-keys.env (Mastodon access token, Dev.to API key, Hashnode PAT, X developer app, Reddit app)

**Memory note:** If Chromium causes OOM issues, escalate a VPS upgrade request (CPX31 8GB, ~5/mo) via the board report.
---

---
## 2026-02-16 ~15:35 UTC — From: Founder (Nishant) | Type: directive
**Status:** open

**Subject:** Build a web-based status dashboard for the founder

I need a simple way to see what is happening on the VPS from my browser. Technology department should build a lightweight status dashboard:

**Requirements:**
- Accessible at http://5.161.102.207:8080 (or a subdomain of selfhosting.sh)
- Auto-refreshes every 30 seconds
- Shows at a glance:
  - Agent status (running/stopped/errored) for all 6 services
  - Recent supervisor log entries (last 20-30 lines)
  - Article count and recent commits
  - Rate limit proxy stats (if available)
  - Last board report summary
  - Memory/CPU usage
- Lightweight — Node.js or static HTML with shell script backend. No frameworks.
- Runs as a systemd service
- Basic auth or IP whitelist for security (this is operational data, not public)

**This is a founder-facing tool, not a public page.** Keep it simple but informative. Think of it as a terminal dashboard rendered in HTML.
---

---
## 2026-02-16 ~16:10 UTC — From: Founder (Nishant) | Type: directive
**Status:** open

**Subject:** Monitor API usage and gracefully pause agents at 85% threshold

A status file is written every 10 seconds by the rate-limiting proxy:
**File:** /opt/selfhosting-sh/logs/proxy-status.json

Example contents:


**Your responsibility (add to HEALTH CHECK phase of operating loop):**
1. Read  on every iteration
2. If  is  (usage >= 85% of hourly limit):
   - Tell all department heads via their inboxes to finish their current task and stop
   - Do NOT spawn new sub-agents
   - Log the event in logs/ceo.md
   - Wait for usage to drop below threshold before resuming
3. If  > 70%, log a warning but continue operating
4. Include  in every board report under a new API Usage section

**Do NOT ignore this file.** Running out of API quota causes fallback to Haiku which crashes agents. Graceful pausing prevents wasted iterations.

You can also check usage via: 
---

---
## 2026-02-16 ~16:10 UTC — From: Founder (Nishant) | Type: directive
**Status:** open

**Subject:** Monitor API usage and gracefully pause agents at 85% threshold

A status file is written every 10 seconds by the rate-limiting proxy:
**File:** logs/proxy-status.json

It contains JSON with fields: timestamp, hourly_count, hourly_limit, hourly_pct, threshold_pct (85), threshold_reached (boolean), pending_requests, rps.

**Your responsibility (add to HEALTH CHECK phase of operating loop):**
1. Read logs/proxy-status.json on every iteration
2. If threshold_reached is true (usage >= 85% of hourly limit):
   - Tell all department heads via their inboxes to finish their current task and stop
   - Do NOT spawn new sub-agents
   - Log the event in logs/ceo.md
   - Wait for usage to drop below threshold before resuming
3. If hourly_pct > 70%, log a warning but continue operating
4. Include hourly_pct in every board report under a new "API Usage" section

**Do NOT ignore this file.** Running out of API quota causes fallback to Haiku which crashes agents. Graceful pausing prevents wasted iterations.

You can also check usage via: curl -s http://127.0.0.1:3128/stats
---
