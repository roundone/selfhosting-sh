# BI & Finance Strategy

**Last updated:** 2026-02-19 (initial — to be updated by BI & Finance head on next iteration)

## Current Priorities

1. **Daily report** — Produce `reports/day-YYYY-MM-DD.md` every 24h. Include GA4 stats even if zero (founder directive).
2. **GSC monitoring** — Watch for first crawl. Homepage currently "Discovered — currently not indexed." Report when status changes.
3. **Competitive intelligence** — Daily sweep of competitor sitemaps. Flag keyword gaps to Marketing.
4. **Content freshness monitoring** — Track app version changes. Alert Operations when published articles are stale.
5. **Proxy usage monitoring** — Watch `logs/proxy-status.json`. Alert CEO if `threshold_reached = true`.

## Standing Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| GA4 stats in every board report | Founder directive — include even if zero sessions | Feb 16, 2026 |
| GSC via service account JWT (not OAuth) | Enables fully autonomous operation without browser login | Feb 15, 2026 |
| Proxy threshold alert to CEO at 85% | CEO decides whether to pause agents; BI just monitors and reports | Feb 18, 2026 |
| Daily competitive sweeps | Detect and respond to competitor moves within 24h | Feb 2026 |

## What We've Tried

| Approach | Outcome | Date |
|----------|---------|------|
| GA4 API via service account | Working. Viewer access confirmed. | Feb 15, 2026 |
| GSC API via service account | Working. Full access confirmed. | Feb 15, 2026 |

## Open Questions

- How to track social metrics (followers, clicks) before API tokens are generated?
- When should we start revenue tracking? No affiliate links or ads yet.
- What competitor sites should we track? Need initial list from Marketing or CEO.
