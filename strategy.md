# CEO Strategy

**Last updated:** 2026-02-20 10:25 UTC

## Current Priorities

1. **ALL WRITERS PAUSED until Feb 22** — Founder directive 2026-02-20. 759 articles on disk. No new content production until Feb 22. All 8 writer wake-on.conf set to 48h. Focus shifts entirely to non-content work.
2. **Technology improvements** — Deploy pipeline fixed (systemd timer). Focus: site quality, SEO, portal, search improvements.
3. **Marketing & social growth** — Social poster working (X + Bluesky). 1,916 posts in queue. 5 platforms still blocked pending credentials. Push for social credentials from founder.
4. **Investor Relations portal** — IR department created. Portal spec in progress. Technology to build.
5. **BI & Finance analytics** — GA4 API still blocked. GSC data available. 9 pages with impressions, 2 page-1 keywords.
6. **Operations coordination (NOT writing)** — Operations head should focus on content quality review, topic map planning, and preparing for Feb 22 writer restart.
7. **Social credentials** — 5 platforms still blocked. Human dependency audit emailed to founder.

## Standing Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| Rate-limit proxy at 0.5 req/sec | Prevents Claude Max 5-hour window exhaustion | Feb 16, 2026 |
| Event-driven coordinator (not looping services) | Eliminates idle API waste; agents run only when triggered | Feb 18, 2026 |
| Social posting via queue only | Founder directive — agents never call social APIs directly. bin/social-poster.js handles all posting. | Feb 19, 2026 |
| No affiliate disclosures until founder says otherwise | Premature disclosures damage trust. We have zero affiliate relationships. | Feb 19, 2026 |
| Marketing can queue social posts freely | HOLD lifted Feb 20. Queue handles rate limiting automatically. | Feb 20, 2026 |
| ~~Max 4 concurrent writers~~ → ~~Max 1 writer~~ → **ALL WRITERS PAUSED (founder directive)** | Founder paused all writers until Feb 22. 759 articles sufficient. Focus: Technology, Marketing, BI, IR. | Feb 20, 2026 |
| ~~Writers on 1-hour fallback~~ → ~~8-hour fallback~~ → **48h fallback (paused until Feb 22)** | Founder directive. Do NOT override without board approval. | Feb 20, 2026 |
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

- **Writer pause impact on Month 1 target** — 759 articles published vs 1,500 target. Writers paused until Feb 22 (2 days lost). With 6 days remaining after resume (Feb 22-28), need ~741 articles in 6 days (~124/day). Founder is aware of this tradeoff.
- **Technology reliability** — Deploy fix shows Technology is now productive. Discipline rules in CLAUDE.md. Continue monitoring.
- **When to request remaining social credentials again** — Human dependency audit delivered. In every board report until resolved.
- **Operations role during pause** — Should focus on content quality review, topic map optimization, and preparing for Feb 22 writer restart.
- **IR portal timeline** — IR department created. Portal spec in progress. Technology builds.
- **Deploy pipeline now stable** — systemd timer replaces crash-prone loop. 30-minute deploy cycle confirmed working.
