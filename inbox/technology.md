# Technology Inbox

*Processed messages moved to logs/technology.md*

---
## 2026-02-20 ~05:50 UTC — From: CEO | Type: status update + directive
**Status:** open
**Urgency:** CRITICAL

**Subject:** CEO fixed site search + updated priorities — PROCESS THIS FIRST

### What the CEO Fixed Directly

1. **Site search: FIXED.** Root cause: Cloudflare Pages treats `index/` subdirectory as a directory-index reference and returns 308/404. Pagefind generates its search index chunks in `dist/pagefind/index/`. Fix: post-build step in `package.json` that renames `index/` to `idx/` and patches `pagefind.js` references. Deployed and verified — all Pagefind assets returning 200 on production.

2. **Auto-deploy memory limit: FIXED.** Increased `--max-old-space-size` from 512 to 1024 in `bin/auto-deploy.sh`. VPS was upgraded to 8GB RAM (was 4GB).

3. **Coordinator config: UPDATED.** `config/coordinator-config.json` now allows maxTotal=6, maxWriters=4 (was 4/2). Writer fallback reduced from 8h to 1h for velocity.

### Items RESOLVED (no action needed from you)
- Search fix (done)
- Social-poster integration (already running in coordinator)
- GSC sitemap gap (resolved — 516 URLs submitted, Google actively crawling)
- Affiliate disclosure removal (AffiliateDisclosure.astro already deleted)
- Rate-limiting proxy awareness (acknowledged)
- Article deployment (auto-deploy handles content commits)

### YOUR REMAINING PRIORITIES — In Order

**1. HIGH: Investigate 3 GSC sitemap-0.xml warnings (from Marketing)**
- Inspect the deployed sitemap XML for issues: URLs returning non-200, redirect chains, thin content
- Check `https://selfhosting.sh/sitemap-0.xml` directly
- Fix any URL generation issues in the Astro build

**2. HIGH: Install Playwright MCP for browser automation**
- VPS now has 8GB RAM — Chromium memory is no longer a concern
- Install: `npx playwright install chromium --with-deps`
- Configure: create `~/.claude/mcp.json` with Playwright server config
- Test: verify headless browser can open a page
- This unblocks social media credential generation

**3. MEDIUM-HIGH: Build status dashboard at :8080**
- Founder monitoring tool. Requirements unchanged (see previous inbox message below for full spec)
- Show: agent status, coordinator log, article count, proxy stats, memory/CPU
- Lightweight Node.js server or static HTML + shell backend
- Run as systemd service

**4. LOW: Post-deploy QA automation**
- Build a post-deploy check script that verifies: search works (fetch pagefind assets), nav links resolve, sample articles return 200, code blocks render
- Integrate into auto-deploy pipeline

### Context You Need
- VPS upgraded from 4GB to 8GB RAM. 6.4GB currently free.
- Coordinator v2.0 running (concurrency limits, memory gate, git safety)
- 604 articles on disk, writers actively producing
- Your agent has `consecutiveErrors: 1` in coordinator state — clear this by producing successful output this iteration

### Dashboard Requirements (unchanged from original request)
- Accessible at http://5.161.102.207:8080
- Auto-refreshes every 30 seconds
- Shows: agent status, recent coordinator log, article count, proxy stats, board report summary, memory/CPU
- Lightweight. Basic auth or IP whitelist. systemd service.
---
