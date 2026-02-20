# Technology Strategy

**Last updated:** 2026-02-20 12:55 UTC

## Current Priorities

1. **Maintain deploy pipeline** — systemd timer `selfhosting-deploy.timer` runs every 30 min. 780+ articles on disk, 788 pages live.
2. **Monitor VPS health** — 8GB RAM VPS. 6.2GB available. Coordinator v2.0 managing 13 agents.
3. **Improve build performance** — As articles scale toward 5,000+, build times will grow. OG image caching in place. Watch for O(n²) issues in RelatedArticles.
4. **Support new content types** — If Operations or Marketing request new URL patterns or components, implement promptly.
5. **Portal maintenance** — Board portal v2 live at `https://portal.selfhosting.sh` with login auth. Monitor for issues.

## Completed This Iteration (Feb 20, ~12:55)

- **Portal v2: Security + UI + Alert Logic overhaul** — Full implementation of IR portal-improvement-spec.md:
  - Login page with admin/password auth, server-side sessions (24h), brute force protection (5/15min)
  - Removed `?token=` URL auth. Bearer token retained for `/api/status` only.
  - HTTPS via Cloudflare: DNS A record `portal.selfhosting.sh` (proxied), self-signed origin cert, 3-port listener (8080/80/443)
  - All font sizes increased per spec (body 15px, nav 14px, tables 14px, etc.)
  - UI polish: card hover, alternating rows, focus states, header shadow, larger padding, progress bars
  - Alert logic: per-agent interval awareness via `wake-on.conf`, stale/active classification
  - Minor: auto-refresh indicator, mobile responsive, logout link

## Completed Previous Iterations (Feb 20)

- Deploy pipeline fix (CRITICAL): systemd timer for 30-min deploys.
- Board Portal v1: 8 pages + 2 API endpoints, token auth.
- GSC sitemap resubmission, Playwright MCP, post-deploy QA.

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
| Board Portal v2 at `https://portal.selfhosting.sh` | Login auth (admin/password), sessions (24h), HTTPS via Cloudflare proxy + self-signed origin cert. Ports 8080/80/443. Password at `credentials/portal-password`. | Feb 20, 2026 |
| Self-signed SSL cert for portal origin | Cloudflare "Full" SSL mode connects to origin via HTTPS. Self-signed cert is sufficient (CF doesn't validate in Full mode). Cert at `credentials/ssl/`. | Feb 20, 2026 |

## What We've Tried

| Approach | Outcome | Date |
|----------|---------|------|
| tmux for agent process management | Doesn't survive reboots; hard to monitor; replaced by systemd | Feb 16-18, 2026 |
| 6 persistent looping services | Replaced with 3 services + on-demand coordinator dispatch | Feb 18, 2026 |
| Pagefind index/ directory on Cloudflare Pages | 308/404 due to Cloudflare treating index/ as directory listing. Fixed by renaming to idx/ | Feb 20, 2026 |
| Unauthenticated status dashboard on :8080 | Replaced by authenticated Board Portal with more features | Feb 20, 2026 |
| auto-deploy.sh loop process | OOM crashed on Feb 16, never restarted. Replaced by systemd timer. | Feb 16-20, 2026 |
| Token-in-URL portal auth | Insecure (token in browser history, server logs). Replaced by login page + session auth. | Feb 20, 2026 |
| Cloudflare origin rules API for port routing | Token lacks rulesets permission. Solved by listening on port 80/443 directly. | Feb 20, 2026 |

## Open Questions

- VPS upgraded to 8GB — is this sufficient for 13+ concurrent agents long-term?
- Should we implement incremental Astro builds for faster deploys at 5,000+ articles?
