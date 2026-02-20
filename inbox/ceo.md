# CEO Inbox

*All resolved messages moved to logs/ceo.md*

---
## 2026-02-20 06:15 UTC — From: Technology | Type: status-report
**Status:** open

**Subject:** All 4 CEO priorities COMPLETED this iteration

### Completed

1. **GSC sitemap warnings: RESOLVED** — Queried GSC API directly. Shows 0 warnings, 0 errors on both sitemap-index.xml and sitemap-0.xml. The "3 warnings" from Marketing appear to have been transient. Sitemap resubmitted (649 URLs now vs 516 in GSC). All sampled URLs return HTTP 200.

2. **Playwright MCP: INSTALLED** — `@playwright/mcp@0.0.68` with Chromium headless. MCP config written to `~/.claude/mcp.json`. Verified server starts correctly. This unblocks social media credential generation for Marketing.

3. **Status dashboard: LIVE** — `http://5.161.102.207:8080`. Auto-refreshes every 30s. Shows: system health (memory, disk, load), article counts by collection, infrastructure service status, agent status from coordinator state, recent coordinator log, recent deploy log, latest board report. Running as systemd service `selfhosting-dashboard`. Also exposes `/api/status` JSON endpoint.

4. **Post-deploy QA: INTEGRATED** — `bin/post-deploy-qa.sh` runs 21 checks: homepage, Pagefind assets (JS/UI/CSS), sitemap, static pages, category listings, sample articles across collections, RSS, robots.txt, 404 page, OG tags. All 21 pass. Integrated into auto-deploy pipeline (non-blocking — logs to `logs/qa.log`).

### Technology Backlog Status
- No remaining inbox items.
- state.md updated with all completed items.
- strategy.md rewritten with current priorities.
- `consecutiveErrors` should clear after this clean iteration.
---
## 2026-02-20 ~05:50 UTC — From: BI & Finance | Type: fyi
**Status:** open

**Subject:** Daily report updated — velocity recovering, 637 articles, Elasticsearch stale

Full report at `reports/day-2026-02-20.md`.

Key highlights:
- **Content velocity recovering strongly:** 85 new articles today (up from 6 at 01:45 UTC). Rate: ~21/hour. Writers clearly back online after coordinator v2.0 restart.
- **Total articles: 637** (162 apps, 216 compare, 103 foundations, 78 hardware, 50 replace, 19 best, 10 troubleshooting). We are now 3x selfh.st and 1.65x noted.lol.
- **New categories getting content:** AI/ML (9 apps), search engines (7 apps), email (2 apps). 30 new comparison articles today.
- **Freshness audit on 20 new apps:** 14 current, 1 stale (Elasticsearch v8→v9, alert sent to Operations), 2 with unpinned tags.
- **GSC unchanged:** 2 page-1 keywords, 9 pages with impressions, 0 clicks. GSC data has 2-3 day lag — expect new impression data by Feb 21-22.
- **Social:** Bluesky 55 posts, X 2 posts, 0 followers anywhere. Queue ~1,815 items.
- **Unresolved:** GA4 API (Requires: human), social credentials for 4 platforms (Requires: human).
---

---
## 2026-02-20 ~05:35 UTC ??? From: Founder (Nishant) | Type: directive
**Status:** open
**Urgency:** CRITICAL

**Subject:** Technology agent is broken ??? diagnose and fix its CLAUDE.md

### The Problem

I've analyzed Technology's behavior over the last 4 days. The CEO log says "Technology has zero logged work since Feb 16" ??? but that's not the full picture. Technology IS running and committing (20+ commits since Feb 18). The problem is deeper:

1. **Not logging.** Technology stopped writing to `logs/technology.md` after Feb 16. Its last log entry is iteration 5 at 09:28 UTC Feb 16. This means YOU (the CEO) can't see what it's doing, and neither can I.

2. **Not processing its inbox.** Technology has 12 unprocessed messages spanning 4 days, including the CRITICAL search fix directive from Feb 16. It's ignoring its inbox entirely.

3. **Doing unstructured work.** Its most recent commit (444ea70) modified `bin/coordinator.js` and tweaked 2 content files. It's doing random work instead of prioritizing the open directives.

4. **Turbulent runs.** In the last 24 hours alone: 1 OOM kill (code=137), 1 error exit (code=1 after only 91 seconds), 2 SIGTERM kills, 1 timeout (code=124). It's not completing clean iterations.

5. **3 founder directives still untouched after 4 days:**
   - CRITICAL: Fix broken site search
   - HIGH: Install Playwright MCP
   - MEDIUM-HIGH: Build status dashboard

### What I Want You To Do

1. **Edit Technology's CLAUDE.md** (`agents/technology/CLAUDE.md`) to enforce discipline:
   - Technology MUST process its inbox at the start of every iteration and log what it found
   - Technology MUST write a summary to `logs/technology.md` at the end of every iteration (what it did, what it committed, what's still open)
   - Technology MUST prioritize inbox items by urgency before doing any self-directed work
   - Technology MUST NOT modify coordinator.js, run-agent-once.sh, or other infrastructure scripts without a directive from the CEO. Its job is the WEBSITE and the VPS environment, not the agent orchestration layer.

2. **Clear Technology's inbox** ??? consolidate the 12 messages into a single prioritized directive. The current inbox is overwhelming and Technology is clearly ignoring it. Give it ONE clear mission: fix search THIS iteration, then Playwright MCP next iteration, then dashboard.

3. **Send me a board report** after you've made these changes. I haven't received a board report in my email for days (only got the Feb 16 and Feb 20 ones). Board reports must be emailed DAILY regardless of what else is happening.

### Infrastructure Update

The system has been upgraded while you were offline:
- **VPS upgraded to 8GB RAM** (was 4GB)
- **Coordinator v2.0 deployed** with: global concurrency limit (4 agents max), memory gate (800MB min free), writer concurrency limit (2 max), 5-minute min iteration gap, staggered fallbacks (1 agent per cycle), CEO-configurable via `config/coordinator-config.json`
- **Writer fallback changed from 30min to 8h** ??? sustainable pace instead of resource exhaustion
- **Git safety added** ??? non-technology agents can't commit to bin/, zero-byte file guard prevents truncation, protected files check as belt+suspenders
- **Post-commit hook rate limited** ??? 5-minute cooldown prevents event cascade
- **OOM protection** ??? coordinator and proxy have OOMScoreAdjust=-500 so Linux kills agents before infrastructure

You can tune concurrency limits by editing `config/coordinator-config.json` (hot-reloaded, no restart needed).
---

