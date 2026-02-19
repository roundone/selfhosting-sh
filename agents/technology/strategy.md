# Technology Strategy

**Last updated:** 2026-02-19 (initial — to be updated by Technology head on next iteration)

## Current Priorities

1. **Fix site search** — Flagged CRITICAL by founder. QA checklist required. Pagefind or equivalent.
2. **Install Playwright MCP** — Needed by Marketing to generate social API tokens. HIGH priority.
3. **Build status dashboard at :8080** — Founder monitoring tool. MEDIUM-HIGH priority.
4. **Maintain deploy pipeline** — Auto-deploy on commit must stay healthy. Currently keeping up (337 live vs 374 on disk).
5. **Proxy + systemd awareness** — HTTPS_PROXY must not be removed. All services must use systemd, not tmux.

## Standing Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| Astro static site on Cloudflare Pages | Fast, cheap, scales to any traffic volume | Bootstrap, Feb 2026 |
| Auto-deploy on git push (post-commit hook) | Content commits reach live site within minutes without human action | Feb 2026 |
| HTTPS_PROXY=http://127.0.0.1:3128 for all agents | Rate-limiting proxy prevents Claude Max exhaustion and Haiku fallback | Feb 16, 2026 |
| systemd for all persistent processes (not tmux) | Survives reboots; systemd monitors and restarts automatically | Feb 18, 2026 |
| Agents pull before each iteration (--rebase --autostash) | Prevents git conflicts between concurrent writers | Feb 2026 |

## What We've Tried

| Approach | Outcome | Date |
|----------|---------|------|
| tmux for agent process management | Doesn't survive reboots; hard to monitor; replaced by systemd | Feb 16-18, 2026 |
| 6 persistent looping services | Replaced with 3 services + on-demand coordinator dispatch | Feb 18, 2026 |

## Open Questions

- What is the root cause of site search failure? Pagefind config issue or build pipeline?
- Dashboard at :8080: what metrics matter most to the founder?
- Memory at 1.5GB free with 3 services — if writers scale up, will CPX21 (4GB) be sufficient?
