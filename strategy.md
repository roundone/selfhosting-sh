# CEO Strategy

**Last updated:** 2026-02-20 09:55 UTC

## Current Priorities

1. **Content velocity under founder constraints** — Founder overrode config to maxWriters=1, writerFallback=8h. 740 articles published, need ~760 more by Feb 28 (~95/day for 8 days). With 1 writer at a time, each writer iteration must produce high volume. This is the primary constraint. Hardware writer now active.
2. **Social poster fix** — DONE. X (Twitter) duplicate content loop fixed at 09:10 UTC. Confirmed working at 09:18 UTC — X successfully posted after skipping duplicate.
3. **Investor Relations portal** — Department created per founder directive. IR agent has CLAUDE.md, inbox, and welcome directive. Will spec the board portal and send to Technology for build.
4. **Playwright-first policy** — DONE. Cascaded to all 5 department CLAUDE.md files as sacrosanct directive.
5. **Google indexing momentum** — 9 pages with impressions on day 5. 2 page-1 keywords. Comparison articles rank fastest.
6. **Social credentials** — 5 platforms still blocked. Human dependency audit emailed to founder at `board/human-dependency-audit-2026-02-20.md`.
7. **Writer category coverage** — 8 writers assigned across categories. 1 currently running (hardware-writer). Foundations-writer COMPLETE (24 articles: container-orch + automation). Others queued via 8h coordinator fallback.

## Standing Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| Rate-limit proxy at 0.5 req/sec | Prevents Claude Max 5-hour window exhaustion | Feb 16, 2026 |
| Event-driven coordinator (not looping services) | Eliminates idle API waste; agents run only when triggered | Feb 18, 2026 |
| Social posting via queue only | Founder directive — agents never call social APIs directly. bin/social-poster.js handles all posting. | Feb 19, 2026 |
| No affiliate disclosures until founder says otherwise | Premature disclosures damage trust. We have zero affiliate relationships. | Feb 19, 2026 |
| Marketing can queue social posts freely | HOLD lifted Feb 20. Queue handles rate limiting automatically. | Feb 20, 2026 |
| ~~Max 4 concurrent writers~~ → **Max 1 writer (founder override)** | Founder overrode CEO's aggressive config. Commit b882734. CEO respects this. | Feb 20, 2026 |
| ~~Writers on 1-hour fallback~~ → **Writers on 8-hour fallback (founder override)** | Founder restored conservative fallback. CEO respects this. | Feb 20, 2026 |
| Comparison articles first | GSC data shows comparisons rank 2-3x faster than app guides. All writer CLAUDE.md files prioritize comparisons. | Feb 20, 2026 |
| CEO directly fixes critical issues when departments stall | Technology was non-functional for 5 days. CEO fixed search directly. Escalation-only approach was too slow. | Feb 20, 2026 |
| Pagefind index/ → idx/ rename in build | Cloudflare Pages treats `index/` as directory-index reference. Post-build step renames it. | Feb 20, 2026 |
| **Month 1 target: 1,500 articles (revised from 5,000)** | Board approved. 5,000 moves to Month 2. Realistic given infrastructure constraints and ramp-up time. | Feb 20, 2026 |
| **Playwright-first policy** | All agents must attempt Playwright browser automation before escalating to human. Founder directive. | Feb 20, 2026 |
| **Social poster skips 403 duplicates** | Fixed infinite loop where X duplicate content errors blocked all X posting. Poster now removes rejected posts and tries next. | Feb 20, 2026 |

## What We've Tried

| Approach | Outcome | Date |
|----------|---------|------|
| 11 looping tmux agents | 6,041 wasted error iterations when rate-limited → Haiku fallback crashes | Feb 16, 2026 |
| systemd persistent services per agent | Better than tmux but wasteful on idle agents | Feb 16-18, 2026 |
| Event-driven coordinator v1.1 | Fixed core agent management but BROKE writer pipeline (didn't discover sub-agents) | Feb 18, 2026 |
| Marketing direct API posting | Replaced with queue system per founder directive. Prevents spam detection. | Feb 19, 2026 |
| Coordinator v1.2 with writer discovery | Worked. But maxWriters=3 and fallback=8h were too conservative. | Feb 20, 2026 |
| Coordinator v2.0 with config-driven limits | **RUNNING.** Memory gate, concurrency limits, git safety. Config at config/coordinator-config.json. | Feb 20, 2026 |
| CEO aggressive config (maxWriters=4, 1h fallback) | **OVERRIDDEN by founder.** Restored to maxWriters=1, 8h fallback. Founder prefers conservative approach. | Feb 20, 2026 |
| Escalating to Technology via inbox (5 days) | **FAILED.** Technology produced zero work despite 12+ inbox messages. CEO now takes direct action on critical items. | Feb 16-20, 2026 |
| CEO directly fixing search | **SUCCEEDED.** Diagnosed CF Pages index/ conflict, patched build script, deployed, verified. Done in one iteration. | Feb 20, 2026 |

## Open Questions

- **Technology reliability** — Discipline rules added to CLAUDE.md. Monitoring compliance this iteration. Strategy.md shows recent work completed but needs consistent logging.
- **When to request remaining social credentials again** — Human dependency audit delivered. In every board report until resolved.
- **Operations crash rate** — 19/20 iterations failing with code=1. Lower priority since writers are the main production engine. Operations head should focus on coordination, not direct writing.
- **Topic map expansion** — Current map has 1,224 articles. With 740 published (60%), writers will exhaust their assigned articles within days. Marketing needs to continue expanding.
- **IR portal timeline** — IR department created. First iteration should produce a portal spec. Technology builds. Estimated: portal live within 2-3 days.
