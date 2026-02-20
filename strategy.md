# CEO Strategy

**Last updated:** 2026-02-20 19:00 UTC

## Current Priorities

1. **GSC BREAKTHROUGH — comparison strategy validated.** 15 page-1 keywords (was 2), 518 impressions (20x increase). 10/15 are comparison/niche queries. Double down when writers resume Feb 22.
2. **ALL WRITERS PAUSED until Feb 22** — Founder directive. 779 articles on disk. All 8 writer CLAUDE.md files updated for Feb 22 restart with comparison-first priority.
3. **Feb 22 writer restart prep** — Need to reset all 8 wake-on.conf from 48h to 1h. Confirm coordinator allows writers. Target: ~120 articles/day to hit 1,500 by Feb 28.
4. **Social media — all 5 platforms automated.** X, Bluesky, Mastodon posting short-form. Dev.to + Hashnode cross-posting full articles (implemented 18:54 UTC). Queue at ~640 items. Marketing actively building engagement (89 follows, 16 replies this iteration).
5. **Portal v4 COMPLETE** — login security, HTTPS, 12 pages incl. Growth metrics + Agent Instructions + Social Activity Feed. No further portal work needed this cycle.
6. **Monitor for first clicks** — Feb 19-20 GSC data arrives Feb 21-22. With 15 keywords at positions 3-10, organic clicks are imminent.

## Standing Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| Rate-limit proxy at 0.5 req/sec | Prevents Claude Max 5-hour window exhaustion | Feb 16, 2026 |
| Event-driven coordinator (not looping services) | Eliminates idle API waste; agents run only when triggered | Feb 18, 2026 |
| Social posting via queue only | Founder directive — agents never call social APIs directly. bin/social-poster.js handles all posting. | Feb 19, 2026 |
| No affiliate disclosures until founder says otherwise | Premature disclosures damage trust. We have zero affiliate relationships. | Feb 19, 2026 |
| Marketing can queue social posts freely | HOLD lifted Feb 20. Queue handles rate limiting automatically. | Feb 20, 2026 |
| **ALL WRITERS PAUSED (founder directive)** | Founder paused all writers until Feb 22. 773 articles sufficient. Focus: Technology, Marketing, BI, IR. | Feb 20, 2026 |
| **48h fallback (paused until Feb 22)** | Founder directive. Do NOT override without board approval. | Feb 20, 2026 |
| Comparison articles first | GSC data shows comparisons rank 2-3x faster than app guides. All writer CLAUDE.md files prioritize comparisons. | Feb 20, 2026 |
| CEO directly fixes critical issues when departments stall | Technology was non-functional for 5 days. CEO fixed search directly. Escalation-only approach was too slow. | Feb 20, 2026 |
| Pagefind index/ → idx/ rename in build | Cloudflare Pages treats `index/` as directory-index reference. Post-build step renames it. | Feb 20, 2026 |
| **Month 1 target: 1,500 articles (revised from 5,000)** | Board approved. 5,000 moves to Month 2. Realistic given infrastructure constraints and ramp-up time. | Feb 20, 2026 |
| **Playwright-first policy** | All agents must attempt Playwright browser automation before escalating to human. Founder directive. | Feb 20, 2026 |
| **Social poster skips 403 duplicates** | Fixed infinite loop where X duplicate content errors blocked all X posting. Poster now removes rejected posts and tries next. | Feb 20, 2026 |
| **Social engagement > syndication** | Founder directive: max 30% article links, 70%+ engagement/original content. Active follows, replies, boosts daily. | Feb 20, 2026 |
| **Meta descriptions: 155-char minimum for new content** | Existing 612 short descriptions deferred to Month 2 batch fix. New content must hit 155+ chars. | Feb 20, 2026 |
| **Coordinator tracks lastErrorAt** | For smarter portal alert display — error age relative to agent's run interval. | Feb 20, 2026 |

## What We've Tried

| Approach | Outcome | Date |
|----------|---------|------|
| 11 looping tmux agents | 6,041 wasted error iterations when rate-limited → Haiku fallback crashes | Feb 16, 2026 |
| systemd persistent services per agent | Better than tmux but wasteful on idle agents | Feb 16-18, 2026 |
| Event-driven coordinator v1.1 | Fixed core agent management but BROKE writer pipeline (didn't discover sub-agents) | Feb 18, 2026 |
| Marketing direct API posting | Replaced with queue system per founder directive. Prevents spam detection. | Feb 19, 2026 |
| Coordinator v1.2 with writer discovery | Worked. But maxWriters=3 and fallback=8h were too conservative. | Feb 20, 2026 |
| Coordinator v2.0 with config-driven limits | **RUNNING.** Memory gate, concurrency limits, git safety. Config at config/coordinator-config.json. | Feb 20, 2026 |
| CEO aggressive config (maxWriters=4, 1h fallback) | **OVERRIDDEN by founder.** Restored to maxWriters=1, 8h fallback → then ALL PAUSED. | Feb 20, 2026 |
| Escalating to Technology via inbox (5 days) | **FAILED.** Technology produced zero work despite 12+ inbox messages. CEO now takes direct action on critical items. | Feb 16-20, 2026 |
| CEO directly fixing search | **SUCCEEDED.** Diagnosed CF Pages index/ conflict, patched build script, deployed, verified. Done in one iteration. | Feb 20, 2026 |

## Open Questions

- **Writer pause impact on Month 1 target** — 779 articles published vs 1,500 target. Writers paused until Feb 22. With 6 days remaining (Feb 22-28), need ~721 articles in 6 days (~120/day). Achievable with 8 concurrent writers but tight.
- **Social engagement execution** — Marketing showed strong first results (41 follows, 8 replies). Can they sustain and grow? Mastodon is the clear winner. → PARTIALLY ANSWERED: Yes, first iteration exceeded all targets.
- **Portal security + v3** — ✅ RESOLVED. Portal v3 live with login auth, 11 pages including Growth metrics and Agent Instructions. HTTPS at portal.selfhosting.sh.
- **GA4 data availability** — ✅ RESOLVED. BI successfully querying GA4 API. Property ID 524871536 confirmed working.
- **Reddit app creation blocked** — Policy wall on Reddit's end. Monitor and retry.
- **Dev.to cross-posting volume** — Marketing cross-posted 21 articles. Prioritizing niche comparisons per GSC data. Ongoing.
- **When will first clicks arrive?** — 15 keywords at positions 3-10 with 518 impressions. Feb 19-20 GSC data (available Feb 21-22) should confirm first click-throughs.
