# Technology Strategy

**Last updated:** 2026-02-20 16:42 UTC

## Current Priorities

1. **Maintain deploy pipeline** — systemd timer `selfhosting-deploy.timer` runs every 30 min. 780+ articles on disk, 793 pages live.
2. **Monitor VPS health** — 8GB RAM VPS. Coordinator v2.0 managing 13 agents.
3. **Improve build performance** — As articles scale toward 5,000+, build times will grow. OG image caching in place. Watch for O(n²) issues in RelatedArticles.
4. **Support new content types** — If Operations or Marketing request new URL patterns or components, implement promptly.
5. **Portal maintenance** — Board portal v3 live at `https://portal.selfhosting.sh` with login auth. 11 pages + newsletter subscriber endpoints.
6. **Newsletter infrastructure** — Subscribe/unsubscribe pipeline live. Subscribers stored in `data/subscribers.json`. Newsletter sending via `bin/send-newsletter.sh`. Ready for weekly newsletter agent.
7. **Marketing standing seat** — Before shipping any user-facing feature, check with Marketing first via `inbox/marketing.md`.

## Completed This Iteration (Feb 20, ~16:42)

- **Newsletter subscribe/unsubscribe pipeline (CRITICAL — founder directive)**
  - CF Pages Functions at `site/functions/api/{subscribe,unsubscribe}.ts` proxy to VPS portal
  - Portal-server.js endpoints: `/api/newsletter/subscribe` (POST), `/api/newsletter/unsubscribe` (GET)
  - Subscribers stored in `data/subscribers.json`
  - EmailSignup.astro updated: JS-enhanced inline success/error, fallback form POST
  - `/subscribed/` confirmation page
  - `bin/send-newsletter.sh` — reads local JSON, sends via Resend API
  - RESEND_API_KEY set as CF Pages secret
  - Tested end-to-end on live site

## Completed Previous Iterations (Feb 20)

- Portal v3: Agent Instructions + Growth Metrics Dashboard
- ShareButtons.astro + Page speed refinements
- Portal v2: Security + UI + Alert Logic overhaul
- Security fix: Credential leakage in board portal
- Deploy pipeline fix (CRITICAL): systemd timer for 30-min deploys
- Board Portal v1: 8 pages + 2 API endpoints
- GSC sitemap resubmission, Playwright MCP, post-deploy QA

## Standing Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| Astro static site on Cloudflare Pages | Fast, cheap, scales to any traffic volume | Bootstrap, Feb 2026 |
| systemd timer deploys every 30 min (`selfhosting-deploy.timer`) | Resilient periodic deploy — survives reboots, no loop process to crash. | Feb 20, 2026 |
| HTTPS_PROXY=http://127.0.0.1:3128 for all agents | Rate-limiting proxy prevents Claude Max exhaustion and Haiku fallback | Feb 16, 2026 |
| systemd for all persistent processes (not tmux) | Survives reboots; systemd monitors and restarts automatically | Feb 18, 2026 |
| Agents pull before each iteration (--rebase --autostash) | Prevents git conflicts between concurrent writers | Feb 2026 |
| Playwright MCP for browser automation | Headless Chromium via `@playwright/mcp@0.0.68`, config in `~/.claude/mcp.json` | Feb 20, 2026 |
| Post-deploy QA in auto-deploy pipeline | Non-blocking QA after each deploy, logs to `logs/qa.log` | Feb 20, 2026 |
| Board Portal v3 at `https://portal.selfhosting.sh` | Login auth, sessions, HTTPS, 11 pages + newsletter API | Feb 20, 2026 |
| Newsletter subscribers on VPS (JSON file) | Resend API key is send-only; CF KV token lacks permission. VPS storage is simple and reliable. | Feb 20, 2026 |
| Marketing standing seat for user-facing features | Before shipping user-facing changes, brief Marketing via inbox. | Feb 20, 2026 |
| Pagefind CSS/JS loaded conditionally | Only on pages with search (index, search, 404). | Feb 20, 2026 |
| Astro prefetch enabled | `prefetch: true` — links prefetch on hover. | Feb 20, 2026 |

## What We've Tried

| Approach | Outcome | Date |
|----------|---------|------|
| Resend Contacts API for subscriber storage | API key is send-only (401 on contacts endpoints). Would need new key with full access. | Feb 20, 2026 |
| Cloudflare KV for subscriber storage | API token lacks KV permissions (authentication error). Would need token scope update. | Feb 20, 2026 |
| tmux for agent process management | Doesn't survive reboots; replaced by systemd | Feb 16-18, 2026 |
| Pagefind index/ directory on Cloudflare Pages | 308/404 due to CF treating index/ as directory listing. Fixed by renaming to idx/ | Feb 20, 2026 |
| auto-deploy.sh loop process | OOM crashed on Feb 16, replaced by systemd timer | Feb 16-20, 2026 |
| Token-in-URL portal auth | Insecure. Replaced by login page + session auth. | Feb 20, 2026 |

## Open Questions

- VPS upgraded to 8GB — is this sufficient for 13+ concurrent agents long-term?
- Should we implement incremental Astro builds for faster deploys at 5,000+ articles?
- When Resend key/CF token permissions are updated, migrate subscribers to KV or Resend?
