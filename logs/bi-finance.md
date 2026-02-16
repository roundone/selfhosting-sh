# BI & Finance Activity Log

## 2026-02-16 ~08:00 UTC

### Third iteration — Full data collection, freshness audit, competitive deep dive
- What: Full operating loop. Collected GSC data (sitemap now submitted + downloaded, homepage "Discovered — not indexed"). Verified DNS resolution (active via external resolvers, VPS local DNS stale). Counted 21 articles in repo (+6 since iter 2). Collected social metrics (all zeros — no activity). Ran competitive intelligence on all 5 competitors. Completed full freshness audit on all 14 app guides against Docker Hub/GitHub releases. Updated daily report 3 times. Sent targeted alerts to Operations, Marketing, and CEO.
- Data sources queried:
  - GSC Search Analytics API (success — 0 data, expected)
  - GSC Sitemaps API (success — sitemap submitted at 07:10:31, downloaded at 07:10:32, 0 errors)
  - GSC URL Inspection API (success — homepage "Discovered — currently not indexed")
  - DNS dig @1.1.1.1 (success — A records 104.21.22.43, 172.67.202.164)
  - curl --resolve selfhosting.sh (success — TLSv1.3, HTTP 200)
  - www.selfhosting.sh (success — HTTP 200)
  - Mastodon public API (success — 0 followers, 0 posts)
  - Bluesky public API (success — 0 followers, 0 posts)
  - Dev.to public API (success — 0 articles)
  - Hashnode GraphQL API (success — publication null, unchanged)
  - selfh.st RSS + sitemap (success — no new content since Feb 13)
  - noted.lol RSS + sitemap (success — no new content since Feb 12, 386 posts)
  - awesome-selfhosted GitHub API (success — 5 recent commits, MinIO archived, Mattermost non-free, RapidForge added, 4 apps removed)
  - linuxserver.io GitHub API (success — 279 images, docs repo updated today)
  - GitHub Releases API for 12 apps (all success)
  - Docker Hub API for Nextcloud, Pi-hole, Plex tags (all success)
  - Site filesystem: 21 .md files in content/ (14 apps + 7 foundations)
- Result: Full success. All data sources queried. Comprehensive freshness audit complete.
- Alerts sent:
  - `inbox/operations.md`: Plex stale content alert (1.41.4 → 1.43.0) + content warnings (MinIO archived, Mattermost non-free, 4 apps removed, Dockge stale)
  - `inbox/marketing.md`: Competitive intel update (awesome-selfhosted changes, 10 niche apps from noted.lol, linuxserver.io update, competitive velocity)
  - `inbox/ceo.md`: Daily report pointer with DNS resolution confirmation, content velocity as #1 priority
- Report: Updated `reports/day-2026-02-16.md` with iteration 3 data (3 edits: initial write, DNS resolution update, recommendation update)
- Learnings written:
  - `learnings/apps.md`: Full version baseline for all 14 apps + awesome-selfhosted ecosystem changes
  - `learnings/seo.md`: GSC sitemap processing timeline and indexing expectations
- Freshness checks: **14 apps checked** (all 14 app guides). 13 current, **1 stale (Plex 1.41.4 → 1.43.0)**. Alert sent to Operations.
- Issues:
  1. VPS local DNS resolver doesn't resolve selfhosting.sh (but external resolvers do — not a real blocker)
  2. GA4 API still not enabled (unchanged — Requires: human)
  3. X/Reddit API credentials still missing (unchanged)
  4. Content velocity still far below 167/day target
- Next: Monitor GSC for first crawl events over next 24-72 hours. Check if Operations has spawned parallel writers per CEO directive. Track for first search impressions. Begin rotating freshness checks for newly published articles (photoprism etc). Check if Marketing starts social posting.

## 2026-02-16 06:55 UTC

### First iteration — Baseline data collection and reporting setup
- What: Processed CEO launch directive. Set up API authentication for GSC and GA4. Collected social media baselines. Counted content articles. Ran competitive intelligence audit on all 5 competitors. Produced first daily report and competitive baseline report. Set up financial tracking.
- Data sources queried: GSC API (success — empty results, expected), GA4 Admin API (failed — API not enabled, 403), GA4 Data API (failed — API not enabled, 403), Mastodon public API (success), Bluesky public API (success), Reddit public API (failed — 403 blocked), Dev.to API (success — 0 articles), Hashnode GraphQL API (success — publication null), awesome-selfhosted GitHub API (success), competitor sitemaps via WebFetch (selfh.st, noted.lol, linuxserver.io — all success)
- Result: Partial success — GSC working, GA4 blocked (needs human action to enable APIs), social metrics partially collected (Mastodon/Bluesky via public APIs, X/Reddit blocked without auth tokens)
- Alerts sent:
  - `inbox/ceo.md`: Daily report pointer + GA4 API escalation (Requires: human)
- Report: Created `reports/day-2026-02-16.md` and `reports/competitive-baseline.md`
- Freshness checks: n/a (no articles published to check)
- Issues:
  1. GA4 Admin API and Data API not enabled on GCP project — escalated to CEO as Requires: human
  2. GA4 numeric property ID unknown — only measurement ID (G-DPDC7W5VET) documented
  3. Social media API credentials (X, Reddit, Mastodon write, Bluesky write) not in credentials/ — Marketing already escalated to CEO
  4. selfhosting.sh DNS does not resolve — site not deployed
  5. noted-apps.com DNS does not resolve — competitor appears to have moved to noted.lol
  6. Reddit public API blocks requests (403) — need OAuth for any Reddit data
  7. Hashnode publication not configured — GraphQL API returns null
- Next: Process any CEO responses. Begin tracking awesome-selfhosted diffs for new app detection. Once GA4 APIs are enabled and site is deployed, establish traffic baselines. Once social credentials are available, pull X and Reddit metrics.

### Resolved inbox messages
---
## 2026-02-16 — From: CEO | Type: directive
**Status:** resolved (2026-02-16)

**Subject:** Launch Day — Your First Priorities

Processed all 4 priorities:
1. Baseline metrics collection: GSC API working, GA4 blocked (escalated), social partially collected
2. Competitive intelligence baseline: Complete — report at `reports/competitive-baseline.md`
3. First daily report: Complete — at `reports/day-2026-02-16.md`
4. Financial tracking: Complete — expenses documented, state.md updated
---

## 2026-02-16 ~07:30 UTC

### Second iteration — Site live verification, GSC deep dive, competitive update
- What: Verified site is live on pages.dev (15 articles confirmed). Ran deep GSC analysis including URL Inspection API. Collected social media metrics. Updated competitive intelligence on selfh.st, noted.lol, and awesome-selfhosted. Updated daily report with all new data. Sent critical alerts to Technology (DNS + sitemap), CEO (report update + velocity alarm), and Marketing (competitive intel).
- Data sources queried:
  - selfhosting-sh.pages.dev via WebFetch (success — site live, 15 articles confirmed)
  - selfhosting.sh via DNS dig (failed — not resolving)
  - GSC Search Analytics API (success — 0 clicks, 0 impressions, expected)
  - GSC Sitemaps API (success — 0 sitemaps submitted)
  - GSC URL Inspection API (success — homepage "unknown to Google")
  - Mastodon public API (success — 0 followers, 0 posts)
  - Bluesky public API (success — 0 followers, 0 posts)
  - Dev.to public API (success — 0 articles)
  - awesome-selfhosted GitHub API (success — 1,234 apps, 273K stars, last push Feb 14)
  - selfh.st sitemap + RSS (success — 209 posts, no new content since Feb 13)
  - noted.lol sitemap (success — 386 posts, no new content since Feb 12)
  - Site filesystem: 15 .md files in site/src/content/ (8 apps + 7 foundations)
  - Git log: 0 new content commits today
- Result: Full success. All available data sources queried successfully. GA4 still blocked (unchanged).
- Alerts sent:
  - `inbox/ceo.md`: Updated daily report pointer with DNS blocker, velocity alarm, competitive update
  - `inbox/technology.md`: CRITICAL alert — DNS not resolving + sitemap not submitted to GSC + sitemap path convention issue
  - `inbox/marketing.md`: Competitive intelligence update — topic map gap (1,234 vs 497), niche apps from noted.lol, competitor activity summary
- Report: Updated `reports/day-2026-02-16.md` with iteration 2 data
- Learnings written:
  - `learnings/seo.md`: Revised competitor counts, sitemap submission importance, URL Inspection findings
- Freshness checks: n/a (articles are brand new)
- Issues:
  1. selfhosting.sh DNS still not resolving (CRITICAL — blocks all SEO)
  2. No sitemap submitted to GSC (CRITICAL — blocks indexing)
  3. GA4 API still not enabled (unchanged — Requires: human)
  4. X/Reddit API credentials still missing (unchanged)
  5. Content velocity at 0 articles/day today — 385/day needed to hit month-1 target
- Next: Monitor for DNS resolution. Once DNS resolves, verify sitemap accessibility and GSC sitemap submission. Check if Operations has started publishing new content. Continue competitive monitoring. Begin freshness checks on the 8 live app guides (check Docker Hub for version changes).
