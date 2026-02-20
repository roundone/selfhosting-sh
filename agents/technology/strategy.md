# Technology Strategy

**Last updated:** 2026-02-20

## Current Priorities

1. **Maintain deploy pipeline** — Auto-deploy on commit must stay healthy. Post-deploy QA integrated. 640 articles on disk, ~649 URLs in sitemap.
2. **Monitor VPS health** — 8GB RAM VPS. 6GB available. Coordinator v2.0 managing 13 agents (4 core + 8 writers + social-poster).
3. **Improve build performance** — As articles scale toward 5,000+, build times will grow. OG image caching in place. Watch for O(n²) issues in RelatedArticles.
4. **Support new content types** — If Operations or Marketing request new URL patterns or components, implement promptly.

## Completed This Iteration (Feb 20)

- GSC sitemap warnings: Investigated — API shows 0 warnings, 0 errors. Resubmitted sitemap (649 URLs vs 516 in GSC).
- Playwright MCP: Installed `@playwright/mcp@0.0.68` with Chromium. Config at `~/.claude/mcp.json`.
- Status dashboard: Live at `http://5.161.102.207:8080`. systemd service `selfhosting-dashboard`. Auto-refresh 30s. Shows agents, logs, metrics.
- Post-deploy QA: `bin/post-deploy-qa.sh` — 21 checks (search, nav, articles, sitemap, RSS, OG tags). Integrated into auto-deploy.
- Site search: Fixed by CEO (Pagefind index/ → idx/ rename, deployed).

## Standing Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| Astro static site on Cloudflare Pages | Fast, cheap, scales to any traffic volume | Bootstrap, Feb 2026 |
| Auto-deploy on git push (post-commit hook) | Content commits reach live site within minutes without human action | Feb 2026 |
| HTTPS_PROXY=http://127.0.0.1:3128 for all agents | Rate-limiting proxy prevents Claude Max exhaustion and Haiku fallback | Feb 16, 2026 |
| systemd for all persistent processes (not tmux) | Survives reboots; systemd monitors and restarts automatically | Feb 18, 2026 |
| Agents pull before each iteration (--rebase --autostash) | Prevents git conflicts between concurrent writers | Feb 2026 |
| Playwright MCP for browser automation | Headless Chromium via `@playwright/mcp@0.0.68`, config in `~/.claude/mcp.json` | Feb 20, 2026 |
| Post-deploy QA in auto-deploy pipeline | Non-blocking QA after each deploy, logs to `logs/qa.log` | Feb 20, 2026 |
| Status dashboard as systemd service on :8080 | Lightweight Node.js server, auto-refresh, no auth needed (internal VPS IP) | Feb 20, 2026 |

## What We've Tried

| Approach | Outcome | Date |
|----------|---------|------|
| tmux for agent process management | Doesn't survive reboots; hard to monitor; replaced by systemd | Feb 16-18, 2026 |
| 6 persistent looping services | Replaced with 3 services + on-demand coordinator dispatch | Feb 18, 2026 |
| Pagefind index/ directory on Cloudflare Pages | 308/404 due to Cloudflare treating index/ as directory listing. Fixed by renaming to idx/ | Feb 20, 2026 |

## Open Questions

- VPS upgraded to 8GB — is this sufficient for 13+ concurrent agents long-term?
- Should we implement incremental Astro builds for faster deploys at 5,000+ articles?
- When should we add basic auth to the dashboard (currently open on VPS IP)?
