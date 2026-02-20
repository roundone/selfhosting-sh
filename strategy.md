# CEO Strategy

**Last updated:** 2026-02-20 05:55 UTC

## Current Priorities

1. **Content velocity recovery** — Coordinator config updated: maxWriters=4 (was 2), writerFallback=1h (was 8h). VPS upgraded to 8GB allows more concurrency. Writers actively producing comparison articles in new categories. Target: 100-200 articles/day sustained.
2. **Technology accountability** — CEO directly fixed site search (founder directive #1). Technology inbox cleared and reprioritized. Remaining: Playwright MCP, status dashboard, GSC sitemap warnings. If Technology stalls again, CEO will take direct action.
3. **Month 1 target revision** — 5,000 articles by Feb 28 is unreachable. ~2,000 is achievable. Proposing to board.
4. **Social posting momentum** — Queue at 1,816 posts. X + Bluesky posting at rate limits. 5 platform credentials still pending.
5. **Google indexing momentum** — 9 pages with impressions on day 4. 2 page-1 keywords. Sitemap resubmitted with 604 articles. Comparison articles rank fastest — all writer assignments lead with comparisons.
6. **Writer category coverage** — 8 new categories assigned to writers. With maxWriters=4, more writers can run concurrently. 59/78 categories still need content.

## Standing Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| Rate-limit proxy at 0.5 req/sec | Prevents Claude Max 5-hour window exhaustion | Feb 16, 2026 |
| Event-driven coordinator (not looping services) | Eliminates idle API waste; agents run only when triggered | Feb 18, 2026 |
| Social posting via queue only | Founder directive — agents never call social APIs directly. bin/social-poster.js handles all posting. | Feb 19, 2026 |
| No affiliate disclosures until founder says otherwise | Premature disclosures damage trust. We have zero affiliate relationships. | Feb 19, 2026 |
| Marketing can queue social posts freely | HOLD lifted Feb 20. Queue handles rate limiting automatically. | Feb 20, 2026 |
| Max 4 concurrent writers (upgraded from 3) | VPS upgraded to 8GB. 4 writers + core agents fits comfortably. memoryMinFreeMb=1200 safety gate. | Feb 20, 2026 |
| Writers on 1-hour fallback (reduced from 8h) | Content velocity requires frequent writer iterations. | Feb 20, 2026 |
| Comparison articles first | GSC data shows comparisons rank 2-3x faster than app guides. All writer CLAUDE.md files prioritize comparisons. | Feb 20, 2026 |
| CEO directly fixes critical issues when departments stall | Technology was non-functional for 5 days. CEO fixed search directly. Escalation-only approach was too slow. | Feb 20, 2026 |
| Pagefind index/ → idx/ rename in build | Cloudflare Pages treats `index/` as directory-index reference. Post-build step renames it. | Feb 20, 2026 |

## What We've Tried

| Approach | Outcome | Date |
|----------|---------|------|
| 11 looping tmux agents | 6,041 wasted error iterations when rate-limited → Haiku fallback crashes | Feb 16, 2026 |
| systemd persistent services per agent | Better than tmux but wasteful on idle agents | Feb 16-18, 2026 |
| Event-driven coordinator v1.1 | Fixed core agent management but BROKE writer pipeline (didn't discover sub-agents) | Feb 18, 2026 |
| Marketing direct API posting | Replaced with queue system per founder directive. Prevents spam detection. | Feb 19, 2026 |
| Coordinator v1.2 with writer discovery | Worked. But maxWriters=3 and fallback=8h were too conservative. | Feb 20, 2026 |
| Coordinator v2.0 with config-driven limits | **RUNNING.** Memory gate, concurrency limits, git safety. Config at config/coordinator-config.json. | Feb 20, 2026 |
| Escalating to Technology via inbox (5 days) | **FAILED.** Technology produced zero work despite 12+ inbox messages. CEO now takes direct action on critical items. | Feb 16-20, 2026 |
| CEO directly fixing search | **SUCCEEDED.** Diagnosed CF Pages index/ conflict, patched build script, deployed, verified. Done in one iteration. | Feb 20, 2026 |

## Open Questions

- **Technology root cause** — Why has Technology produced zero work since Feb 16? Agent may have persistent CLAUDE.md issues, or rate limiting consistently kills iterations before meaningful work. Need to investigate its logs more deeply.
- **Month 1 target** — Proposing 2,000 articles (achievable) instead of 5,000 (not achievable). In Feb 20 board report.
- **When to request remaining social credentials again** — In every board report until resolved.
- **Operations crash rate** — 19/20 iterations failing with code=1. Lower priority since writers are the main production engine. Operations head should focus on coordination, not direct writing.
- **Topic map expansion** — Current map has 1,224 articles. With 604 published (49%), writers will exhaust their assigned articles within days. Marketing needs to continue expanding.
- **VPS upgrade cost** — Need to confirm the pricing impact of the 8GB upgrade and update expense tracking in next board report.
