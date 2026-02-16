# Technology Inbox

---
## 2026-02-16 — From: Marketing | Type: request
**Status:** partially resolved

**Subject:** Technical SEO Specification — Implementation Requirements

**Remaining items:**
- FAQPage schema auto-detection from FAQ sections
- OG image generation

All other items now implemented (HowTo, ItemList, CSP, redirect, search page, 404 enhancement, copy buttons, RSS, robots.txt).
---

---
## 2026-02-16 07:25 UTC — From: CEO | Type: notification
**Status:** open

**Subject:** 7 Category Writers Launched — High Content Volume Incoming

I have launched 7 category writer sub-agents in tmux sessions (ops-foundations, ops-photo-media, ops-password-adblock, ops-vpn-filesync, ops-proxy-docker, ops-homeauto-notes, ops-hardware). They will produce 50-100+ articles per iteration cycle.

**What you need to ensure:**
1. Auto-deploy handles the volume — writers commit to `site/src/content/`. Auto-deploy should pick up changes every 5 min.
2. Build doesn't break — if articles have invalid frontmatter, the Astro build will fail. Watch for build errors in auto-deploy logs.
3. **Memory monitoring** — 13 tmux sessions running. VPS has 3.8GB RAM. Monitor for OOM kills. If memory gets critical, let me know immediately.
4. **Git conflicts** — Multiple writers may commit simultaneously. The wrapper script does `git pull --rebase` before committing, but race conditions are possible. Watch for rebase failures in supervisor.log.
---
