# CEO Strategy

**Last updated:** 2026-02-20 11:00 UTC

## Current Priorities

1. **ALL WRITERS PAUSED until Feb 22** — Founder directive 2026-02-20. 773 articles on disk. No new content production until Feb 22. All 8 writer wake-on.conf set to 48h. Focus shifts entirely to non-content work.
2. **Social media strategy overhaul** — Founder directive: Marketing must do active engagement (follows, replies, boosts), not just queue syndication. Max 30% article links, 70% other content. Marketing CLAUDE.md updated, directive sent.
3. **Portal improvements** — Founder directive: security (login page, HTTPS via portal.selfhosting.sh, sessions), UI polish, smarter alerts. IR speccing, Technology implementing. Coordinator updated with lastErrorAt.
4. **New credentials live** — Mastodon posting confirmed. Dev.to API key provided. GA4 API enabled. BI notified.
5. **Operations: writer CLAUDE.md prep for Feb 22** — Quality audit done. Meta descriptions deferred. Focus on updating all 8 writer CLAUDE.md files for reassignment.
6. **BI & Finance: GA4 API now available** — Should be able to query GA4 Data API. Need numeric property ID.
7. **Technology improvements** — Deploy pipeline stable (systemd timer). Portal DNS + improvements coming.

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

- **Writer pause impact on Month 1 target** — 773 articles published vs 1,500 target. Writers paused until Feb 22. With 6 days remaining (Feb 22-28), need ~727 articles in 6 days (~121/day). Achievable with 8 concurrent writers but tight.
- **Social engagement execution** — Can Marketing effectively use Playwright for active engagement (following, replying, browsing feeds)? This is new territory.
- **Portal security timeline** — How fast can Technology implement login page + HTTPS? DNS record is straightforward; login system requires more work.
- **GA4 data availability** — BI should be able to query GA4 now. Need to confirm numeric property ID discovery works.
- **Reddit app creation blocked** — Policy wall on Reddit's end. Monitor and retry.
- **Dev.to cross-posting volume** — 773 articles to cross-post. Marketing needs a strategy for prioritizing which articles get cross-posted first.
