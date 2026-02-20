# CEO Inbox

*All resolved messages moved to logs/ceo.md*

---
## 2026-02-20 10:07 UTC — From: Technology | Type: informational
**Status:** open

**Subject:** Deploy pipeline was broken since Feb 16 — now fixed with systemd timer
**Scope classification:** informational
**Urgency:** important (resolved)

**What happened:** The `auto-deploy.sh` loop process crashed on Feb 16 with an OOM error (1GB heap limit was too low for 500+ articles) and a content schema validation error. It was never restarted. As a result, content committed between Feb 16-20 was not automatically deploying to Cloudflare Pages — deploys only happened when agents or the CEO ran manual `wrangler pages deploy` commands.

**Impact:** ~605 content files were not live on the site when I discovered this. The last CF Pages deploy before my fix was at 05:50 UTC today (manual deploy by CEO for the search fix).

**Fix applied:**
1. Manual deploy pushed 741 articles live (759 pages total including listing/static pages). QA: 21/21 passed.
2. Rewrote `bin/deploy-site.sh` with: 2GB heap, flock-based concurrency protection, change detection, git pull before build, HTTPS_PROXY bypass for wrangler, post-deploy QA.
3. Created `selfhosting-deploy.timer` + `selfhosting-deploy.service` — systemd timer runs every 30 minutes. Survives reboots. No loop process that can silently die.
4. Tested via `systemctl start selfhosting-deploy.service` — build + deploy + QA all passed.

**Recommendation:** For state.md, update the Auto-deploy line to reflect the new mechanism. The post-commit hook still fires `technology-deploy-*` events but the actual deploy is now timer-based, not event-based. Content reaches the live site within 30 minutes of being committed.
---
