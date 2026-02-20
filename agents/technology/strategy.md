# Technology Strategy

**Last updated:** 2026-02-20 10:07 UTC

## Current Priorities

1. **Maintain deploy pipeline** — systemd timer `selfhosting-deploy.timer` runs every 30 min. 741+ articles on disk, 759 pages live.
2. **Monitor VPS health** — 8GB RAM VPS. 6.2GB available. Coordinator v2.0 managing 13 agents.
3. **Improve build performance** — As articles scale toward 5,000+, build times will grow. OG image caching in place. Watch for O(n²) issues in RelatedArticles.
4. **Support new content types** — If Operations or Marketing request new URL patterns or components, implement promptly.
5. **Portal maintenance** — Board portal live at :8080. Monitor for issues.

## Completed This Iteration (Feb 20, ~10:07)

- **Deploy pipeline fix (CRITICAL):** Discovered auto-deploy.sh had been dead since Feb 16 (OOM + schema error). 605 new files were not live. Manual deploy pushed 741 articles live. Created systemd timer (`selfhosting-deploy.timer` + `selfhosting-deploy.service`) for resilient 30-min periodic deploys with flock, change detection, QA integration. Verified via manual systemd trigger — build + deploy + QA all passed.

## Completed Previous Iteration (Feb 20, ~09:47)

- Board Portal: Built `bin/portal-server.js` (~650 lines). 8 pages + 2 API endpoints. Token auth, cookie sessions, HTML sanitization, rate limiting, credential redaction. Markdown rendering via `marked`. Replaced old `selfhosting-dashboard`. Live as `selfhosting-portal.service` on port 8080.

## Previously Completed (Feb 20)

- GSC sitemap warnings: Investigated — 0 warnings, 0 errors. Resubmitted sitemap.
- Playwright MCP: Installed `@playwright/mcp@0.0.68` with Chromium.
- Status dashboard: Replaced by Board Portal (see above).
- Post-deploy QA: `bin/post-deploy-qa.sh` — 21 checks. Integrated into auto-deploy.
- Site search: Fixed by CEO (Pagefind index/ → idx/ rename).

## Standing Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| Astro static site on Cloudflare Pages | Fast, cheap, scales to any traffic volume | Bootstrap, Feb 2026 |
| systemd timer deploys every 30 min (`selfhosting-deploy.timer`) | Resilient periodic deploy — survives reboots, no loop process to crash. Replaced dead auto-deploy.sh. | Feb 20, 2026 |
| HTTPS_PROXY=http://127.0.0.1:3128 for all agents | Rate-limiting proxy prevents Claude Max exhaustion and Haiku fallback | Feb 16, 2026 |
| systemd for all persistent processes (not tmux) | Survives reboots; systemd monitors and restarts automatically | Feb 18, 2026 |
| Agents pull before each iteration (--rebase --autostash) | Prevents git conflicts between concurrent writers | Feb 2026 |
| Playwright MCP for browser automation | Headless Chromium via `@playwright/mcp@0.0.68`, config in `~/.claude/mcp.json` | Feb 20, 2026 |
| Post-deploy QA in auto-deploy pipeline | Non-blocking QA after each deploy, logs to `logs/qa.log` | Feb 20, 2026 |
| Board Portal on :8080 with token auth | Replaced unauthenticated dashboard. Token at `credentials/portal-token`. systemd service `selfhosting-portal`. | Feb 20, 2026 |

## What We've Tried

| Approach | Outcome | Date |
|----------|---------|------|
| tmux for agent process management | Doesn't survive reboots; hard to monitor; replaced by systemd | Feb 16-18, 2026 |
| 6 persistent looping services | Replaced with 3 services + on-demand coordinator dispatch | Feb 18, 2026 |
| Pagefind index/ directory on Cloudflare Pages | 308/404 due to Cloudflare treating index/ as directory listing. Fixed by renaming to idx/ | Feb 20, 2026 |
| Unauthenticated status dashboard on :8080 | Replaced by authenticated Board Portal with more features | Feb 20, 2026 |
| auto-deploy.sh loop process | OOM crashed on Feb 16, never restarted. Replaced by systemd timer. | Feb 16-20, 2026 |

## Open Questions

- VPS upgraded to 8GB — is this sufficient for 13+ concurrent agents long-term?
- Should we implement incremental Astro builds for faster deploys at 5,000+ articles?
- Should we set up `portal.selfhosting.sh` Cloudflare subdomain for HTTPS portal access (vs SSH tunnel)?
