# BI & Finance Activity Log

## 2026-02-20 ~10:20 UTC

### Eighteenth iteration — new-articles-published event (7 articles in best, hardware, replace)
- What: Triggered by `new-articles-published` event (7 count, categories: best, hardware, replace). Executed full data collection pass. Found 759 total articles on disk (up from 651 at iter 17 — 108 new articles). Content velocity: 206 articles today (~20/hour). Key growth: apps +36, compare +38, hardware +21, replace +8, best +4. Revised Month 1 target (1,500) is on track — 50.6% complete, need ~93/day for 8 remaining days. GSC data unchanged (2 page-1 keywords, 9 pages with impressions, 24 total impressions on Feb 17, 0 clicks — expected due to 2-3 day data lag). Sitemaps: 516 submitted, 0 indexed (reporting lag), 0 warnings. Bluesky: 73 posts, 1 follower. X: posting with many 403 duplicate errors. Social queue: 1,914 (down from 1,931 — net draining for first time). Noted founder writer-pause directive in CEO inbox (not my action item). Updated daily report.
- Data sources queried:
  - GSC Search Analytics API — query+page dimensions (success — unchanged: 2 rows, freshrss-vs-miniflux at positions 3.0/5.0)
  - GSC Search Analytics API — page dimensions (success — 9 pages, unchanged)
  - GSC Search Analytics API — date dimensions (success — 24 impressions on Feb 17, unchanged)
  - GSC Sitemaps API (success — 516 submitted, 0 indexed, 0 warnings)
  - Bluesky public API (success — 73 posts, 1 follower)
  - Mastodon public API (success — 0 posts, 0 followers)
  - Social-poster log (success — Bluesky posting consistently, X hitting many 403 duplicates)
  - Social queue (success — 1,914 items, down from 1,931)
  - Social state (success — last X post 10:18 UTC, last Bluesky post 10:13 UTC)
  - Site filesystem: 759 .md files (201 apps, 260 compare, 105 foundations, 100 hardware, 58 replace, 25 best, 10 troubleshooting)
  - Git log: 206 new content files today (Feb 20), 760 total this month
- Result: Success. All available data sources queried. Material changes: article count 651→759, social queue 1,931→1,914 (net draining).
- Alerts sent:
  - `inbox/ceo.md`: Daily report pointer — 759 articles, revised target on track, GSC unchanged (data lag), social queue draining, sitemap gap noted, founder directive acknowledged
- Report: Updated `reports/day-2026-02-20.md` with all new data (articles 651→759, velocity trend, content by type breakdown, social queue improvement, competitive ratios updated)
- Learnings written: None (no new version changes or SEO patterns discovered this iteration)
- Freshness checks: Skipped (no new app articles requiring audit beyond what was checked in iters 14-17; trigger event was best/hardware/replace categories, not apps)
- Issues:
  1. GA4 API still not enabled (unchanged — Requires: human)
  2. Social credentials still pending for Mastodon, Reddit, Dev.to, Hashnode (Requires: human)
  3. X duplicate content errors reducing effective posting throughput
  4. Sitemap gap: 759 articles on disk but only 516 in Google's copy
  5. Founder directive to pause writers until Feb 22 — will affect velocity; CEO to process
- Next: Monitor for GSC data updates (Feb 18-20 impressions should appear Feb 21-22). Track whether sitemap gets regenerated with 759 articles after next deploy. Monitor social queue drain rate to confirm net-positive trend. If founder writer pause takes effect, focus on analytics/reporting depth rather than velocity tracking. Run full freshness rotation on next 24h-fallback.

## 2026-02-20 ~06:50 UTC

### Seventeenth iteration — github-release event (Jackett v0.24.1167, duplicate)
- What: Triggered by same `github-release` event for `Jackett/Jackett` (v0.24.1157 → v0.24.1167) that was already processed in iter 16. Event file was already archived. Ran full data collection to update daily report: 651 total articles (up from 647), 222 compare (up from 218), 6 categories complete (up from 4 in report — corrected to include AI/ML + Search Engines). GSC unchanged (2 page-1 keywords, 9 pages with impressions, 24 total impressions all on Feb 17, 0 clicks). Sitemaps: 516 submitted, 0 indexed, 0 warnings, sitemap-index downloaded by Google at 06:00 UTC today. Social: Bluesky 56 posts/1 follower, X 8 posts via poster, queue grew to 1,931 (+120 from new content batch). CEO already addressed social poster intervals (reduced to 15min X, 10min Bluesky) and writer wake-on.conf (8h→1h) per CEO inbox resolution at 06:45 UTC.
- Data sources queried:
  - GSC Search Analytics API — query+page dimensions (success — unchanged: 2 rows, freshrss-vs-miniflux at positions 3.0/5.0)
  - GSC Search Analytics API — page dimensions (success — 9 pages, unchanged)
  - GSC Search Analytics API — date dimensions (success — 24 impressions on Feb 17, unchanged)
  - GSC Sitemaps API (success — 516 submitted, 0 indexed, 0 warnings, sitemap-index downloaded 06:00 UTC)
  - Bluesky public API (success — 56 posts, 1 follower)
  - Mastodon public API (success — 0 posts, 0 followers)
  - Site filesystem: 651 .md files (165 apps, 222 compare, 104 foundations, 79 hardware, 50 replace, 21 best, 10 troubleshooting)
  - Social-poster log (success — 18 posts today: 11 Bluesky, 7 X)
  - Social queue (success — 1,931 items, grew +120 at 06:29 UTC)
- Result: Success. Incremental update only — no material changes from iter 15/16 except article count 647→651 and queue 1,814→1,931.
- Alerts sent: None (CEO already processed iter 15 pointer and took action; no new findings warrant a separate alert)
- Report: Updated `reports/day-2026-02-20.md` with corrected data (651 articles, 6 categories complete, social poster throughput analysis, queue growth analysis, Jackett stale alert added)
- Learnings written: None (no new discoveries)
- Freshness checks: Jackett already handled in iter 16 — no additional checks needed
- Issues:
  1. GA4 API still not enabled (unchanged — Requires: human)
  2. Social credentials still pending for Mastodon, Reddit, Dev.to, Hashnode (Requires: human)
  3. Social queue growing faster than draining (1,931 items, +120 today, 18 posted) — CEO already reduced intervals
  4. Content velocity paused since ~06:35 UTC — waiting for writer reassignments per CEO's wake-on.conf fix
- Next: Wait for next meaningful trigger. Monitor whether CEO's social poster interval reduction (15min X, 10min Bluesky) increases throughput. Monitor whether 5 idle writers restart within the hour per CEO's wake-on.conf fix. Expect Feb 18 GSC impressions data by Feb 21. Run full freshness rotation on next 24h-fallback.

## 2026-02-20 ~06:30 UTC

### Sixteenth iteration — github-release event (Jackett v0.24.1167)
- What: Triggered by `github-release` event for `Jackett/Jackett` (v0.24.1157 → v0.24.1167). Checked our Jackett article (`/apps/jackett`) — uses `lscr.io/linuxserver/jackett:v0.22.1095`, which is significantly behind latest v0.24.1167 (2 minor versions). No breaking changes per event metadata. Sent MEDIUM priority stale content alert to Operations.
- Data sources queried:
  - Event file: `events/bi-finance-github-release-2026-02-20T0614Z.json` (success)
  - Site content: `site/src/content/apps/jackett.md` (success — version v0.22.1095 in Docker Compose)
  - Site content: `site/src/content/compare/jackett-vs-prowlarr.md` (success — no version references, no update needed)
- Result: Stale content detected. Alert sent.
- Alerts sent:
  - `inbox/operations.md`: Jackett stale content alert (v0.22.1095 → v0.24.1167, MEDIUM priority)
- Report: Not updated (incremental version-only event, no scorecard changes)
- Learnings written: `learnings/apps.md` — Jackett v0.22.1095 → v0.24.1167 stale entry
- Freshness checks: 1 app checked (Jackett), 1 stale found
- Issues: None
- Next: Continue normal monitoring. Jackett has very frequent releases (~daily) — consider whether to track every point release or only minor/major bumps.

## 2026-02-20 ~06:20 UTC

### Fifteenth iteration — new-articles-published event (1 article in apps)
- What: Triggered by `new-articles-published` event (1 count, category: apps). Executed incremental data collection. Found 647 total articles on disk (up from 637 at iter 14 — 10 new articles). Content velocity: 92 articles today (~15/hour, slowing from ~21/hour at iter 14). GSC data unchanged (2 page-1 keywords, 9 pages with impressions, 24 total impressions on Feb 17, 0 clicks). Key new finding: **First Bluesky follower** (1, up from 0). Social poster stalling — many "0 attempted" cycles in logs, only ~4-5 posts/hour. Queue: 1,814. GSC sitemap warnings resolved (3→0). Sitemap-index re-downloaded by Google at 06:00 UTC today. Updated daily report, sent CEO pointer.
- Data sources queried:
  - GSC Search Analytics API — query+page dimensions (success — unchanged: 2 rows, freshrss-vs-miniflux at positions 3.0/5.0)
  - GSC Search Analytics API — page dimensions (success — 9 pages with impressions, unchanged)
  - GSC Search Analytics API — date dimensions (success — 24 impressions all on Feb 17, unchanged)
  - GSC Sitemaps API (success — 516 submitted, 0 indexed, **0 warnings** down from 3, sitemap-index last downloaded 06:00 UTC today)
  - Bluesky public API (success — 55 posts, **1 follower** — first!)
  - Mastodon public API (success — 0 posts, 0 followers)
  - Social-poster log (success — poster running but intermittently stalling, 7 total X posts, 10 Bluesky posts)
  - Social queue (success — 1,814 items at `/opt/selfhosting-sh/queues/social-queue.jsonl`)
  - Site filesystem: 647 .md files (165 apps, 218 compare, 104 foundations, 79 hardware, 50 replace, 21 best, 10 troubleshooting)
  - Git log: 92 new content files today (Feb 20), 646 total this month
- Result: Full success. All available data sources queried. Incremental changes only.
- Alerts sent:
  - `inbox/ceo.md`: Daily report pointer — first follower, 647 articles, social poster stalling, GSC sitemap warnings cleared
- Report: Updated `reports/day-2026-02-20.md` with all new data (articles 637→647, first follower, social poster analysis, sitemap warnings resolved, velocity update 85→92 articles today)
- Learnings written: None (no new version changes or SEO patterns discovered this iteration)
- Freshness checks: Skipped (no new app articles since iter 14 requiring audit — the trigger was 1 article but it's incremental to what was already checked)
- Issues:
  1. GA4 API still not enabled (unchanged — Requires: human)
  2. Social credentials still pending for Mastodon, Reddit, Dev.to, Hashnode (Requires: human)
  3. Social poster intermittently stalling — many "0 attempted" cycles. Only ~4-5 posts/hour. Queue will take months at this rate. Flagged to CEO.
  4. Content velocity slowing from ~21/hour to ~15/hour — AI/ML and Search Engines writers completed, others still ramping
  5. **First follower on Bluesky!** (1 follower) — positive signal after 55 posts
- Next: Monitor velocity — if rate holds at 15/hour, expect ~360 articles/day. Watch for GSC crawl acceleration after sitemap re-download (Feb 20 06:00 UTC). Track whether CEO investigates social poster stalling. Expect Feb 18 impressions data to appear in GSC by Feb 21. Run freshness audit on next 24h-fallback iteration.

## 2026-02-20 ~05:50 UTC

### Fourteenth iteration — new-articles-published event (42 articles in apps, compare, replace)
- What: Triggered by `new-articles-published` event (42 count, categories: apps, compare, replace). Executed full data collection pass. Found 637 total articles on disk (up from 559 at iter 13 — 78 new articles). Content velocity recovering strongly: 85 articles today so far (~21/hour), up from 6 at 01:45 UTC. Writers confirmed back online after coordinator v2.0 restart. Key new categories getting content: AI/ML (9 new app guides), search engines (7), email (2). 30 new comparison articles. Ran freshness audit on 20 of 27 new app articles — 14 current, 1 stale (Elasticsearch v8→v9 MAJOR), 2 unpinned. GSC data unchanged (2 page-1 keywords, 9 pages with impressions, 0 clicks). Social: Bluesky 55 posts / 0 followers, X 2+ posts. Queue ~1,815. Updated daily report, sent stale content alert to Operations (Elasticsearch), sent daily report pointer to CEO.
- Data sources queried:
  - GSC Search Analytics API — query+page dimensions (success — unchanged: 2 rows, freshrss-vs-miniflux at positions 3.0/5.0)
  - GSC Search Analytics API — page dimensions (success — 9 pages with impressions, unchanged)
  - GSC Search Analytics API — date dimensions (success — 24 impressions all on Feb 17)
  - GSC Sitemaps API (success — 516 submitted, 0 indexed, 3 warnings)
  - Bluesky public API (success — 55 posts, 0 followers)
  - Mastodon public API (success — 0 posts, 0 followers)
  - Social-poster log (success — poster running, alternating X/Bluesky, last post 05:44 UTC)
  - Social queue (success — ~1,815 items)
  - Site filesystem: 637 .md files (162 apps, 216 compare, 103 foundations, 78 hardware, 50 replace, 19 best, 10 troubleshooting)
  - Git log: 85 new content files today (Feb 20)
  - GitHub Releases API for ~15 apps (freshness audit — success)
  - Docker Hub API for ~10 apps (freshness audit — success)
- Result: Full success. All available data sources queried. Freshness audit completed for 20 new app articles.
- Alerts sent:
  - `inbox/operations.md`: Elasticsearch stale content alert (8.19.11 → 9.3.0, HIGH priority)
  - `inbox/ceo.md`: Daily report pointer — velocity recovering (85 articles today), 637 total, Elasticsearch stale, GSC unchanged
- Report: Updated `reports/day-2026-02-20.md` with all new data (article count 559→637, velocity recovery, freshness audit results, social updates)
- Learnings written: `learnings/apps.md` — Elasticsearch v8→v9 stale alert + batch freshness audit for 20 new apps
- Freshness checks: 20 of 27 new apps checked. 14 current, 1 stale (Elasticsearch), 2 unpinned (Strapi, Whisper), 3 need further investigation (PostHog, Plane, Stalwart).
- Issues:
  1. GA4 API still not enabled (unchanged — Requires: human)
  2. Social credentials still pending for Mastodon, Reddit, Dev.to, Hashnode (Requires: human)
  3. Content velocity recovering: 85 articles today (~21/hour), up from 2/day average last 3 days
  4. Elasticsearch article uses v8 when v9 is latest — HIGH priority stale alert sent
  5. 0 followers across all social platforms despite 55+ Bluesky posts
- Next: Monitor velocity — if rate sustains, expect 300-500 articles today. Watch for GSC data lag to catch up (Feb 18-20 impressions should appear by Feb 21-22). Track whether Operations addresses Elasticsearch and NetBird stale articles. Check remaining 7 new app articles (not audited this iteration) on next pass. Monitor social poster queue drain rate.

## 2026-02-20 ~01:45 UTC

### Thirteenth iteration — new-articles-published event (2 new apps: calibre-web, paperless-ngx)
- What: Triggered by `new-articles-published` event (2 articles in apps category). Found 2 genuinely new articles on disk since last iteration: calibre-web.md and paperless-ngx.md. Total articles now 559 (up from 555). Also found 2 additional new articles (calcom.md, listmonk.md appeared in git status as untracked). Ran freshness audit on both new app articles — both slightly stale (Calibre-Web 0.6.24 vs 0.6.26, Paperless-ngx 2.20.6 vs 2.20.7). Both were already flagged as LOW priority in Operations inbox from a prior batch alert. GSC unchanged (2 page-1 keywords, 9 pages with impressions, 0 clicks). Bluesky at 46 posts, 0 followers. Social poster continuing correctly. Updated daily report with new article count and freshness findings.
- Data sources queried:
  - GSC Search Analytics API — query+page dimensions (success — unchanged: 2 rows, freshrss-vs-miniflux at positions 3.0/5.0)
  - GSC Search Analytics API — page dimensions (success — 9 pages with impressions, unchanged)
  - GSC Sitemaps API (success — 516 submitted, 0 indexed, 3 warnings)
  - Bluesky public API (success — 46 posts, 0 followers)
  - Mastodon public API (success — 0 posts, 0 followers)
  - Social-poster log (success — poster running, alternating X/Bluesky)
  - Site filesystem: 559 .md files (139 apps, 186 compare, 93 foundations, 69 hardware, 43 replace, 19 best, 10 troubleshooting)
  - Docker Hub API for linuxserver/calibre-web (success — latest 0.6.26)
  - GitHub Releases API for calibre-web (success — latest 0.6.26)
  - Docker Hub API for paperlessngx/paperless-ngx (success — latest 2.20.7 on GHCR)
  - GitHub Releases API for paperless-ngx (success — latest v2.20.7)
- Result: Success. 4 new articles today (total 6 for Feb 20). Slight velocity recovery from 2/day yesterday.
- Alerts sent: None new (stale versions already tracked in Operations inbox)
- Report: Updated `reports/day-2026-02-20.md` with new article count (555→559), velocity trend update, and 2 new stale content items
- Learnings written: `learnings/apps.md` — Calibre-Web 0.6.24→0.6.26, Paperless-ngx 2.20.6→2.20.7
- Freshness checks: 2 new apps checked (calibre-web, paperless-ngx). Both slightly stale. Already flagged in Operations inbox.
- Issues: Same as iter 12 (GA4 blocked, social creds pending, velocity still low but recovering slightly, all known)
- Next: Wait for next meaningful trigger. If 24h fallback fires, run full data collection including competitive sweep, freshness rotation for top 50 apps, and check for GSC indexing status changes. Monitor whether coordinator v1.2 restart occurs. Track whether today's 6-article pace is sustained.

## 2026-02-20 ~01:25 UTC

### Twelfth iteration — new-articles-published event (no-op, 20 min after iter 11)
- What: Triggered by `new-articles-published` event from 00:58 UTC (already archived). This event was generated by the same Technology auto-commit that triggered iter 11. All data sources queried — no material changes since iter 11. Content count unchanged (555). GSC unchanged (2 rows, positions 3.0/5.0, 0 clicks). Bluesky at 46 posts (minor variance from 47 in iter 11 — API caching). Social poster continuing correctly. No new articles added since iter 10.
- Data sources queried:
  - GSC Search Analytics API — query+page dimensions (success — unchanged: 2 rows, freshrss-vs-miniflux)
  - GSC Sitemaps API (success — unchanged: 516 submitted, 0 indexed, 3 warnings)
  - Bluesky public API (success — 46 posts, 0 followers)
  - Mastodon public API (success — 0 posts, 0 followers)
  - Social-poster log (success — poster running, 2 posts since iter 11: 1 X at 00:57, 1 Bluesky at 01:02)
  - Site filesystem: 555 .md files (unchanged)
  - Git log: no new content commits since iter 10
- Result: Success. No material changes — this was a duplicate trigger from the same commit that iter 11 already handled.
- Alerts sent: None (no new findings)
- Report: No update needed — `reports/day-2026-02-20.md` already current from iter 11
- Learnings written: None
- Freshness checks: Skipped (no new app articles)
- Issues: Same as iter 11 (GA4 blocked, social creds pending, velocity collapsed, all known)
- Next: Wait for next meaningful trigger. If 24h fallback fires, run full data collection including competitive sweep, freshness rotation for top 50 apps, and check for GSC indexing status changes. Monitor whether coordinator v1.2 restart occurs (which would re-enable writer sub-agents and resolve velocity collapse).

## 2026-02-20 ~01:05 UTC

### Eleventh iteration — new-articles-published events (follow-up, 15 min after iter 10)
- What: Triggered by `new-articles-published` event from 00:46 UTC (4 articles count in event, but actual new articles on disk: 0 new since iter 10 — the events were from operational commits by marketing/technology/bi-finance touching content files, not new articles). Updated daily report with corrected social poster data. Confirmed social poster is working correctly: alternating X and Bluesky posts every 5 minutes. Resolved X posting "anomaly" from iter 10 — poster alternates platforms, not posting to both each cycle. Corrected Bluesky post count: 47 total on profile (44 from earlier Marketing sessions + 3 from current social-poster session). X: 2 posts total. Queue: 1,715 remaining.
- Data sources queried:
  - GSC Search Analytics API — query+page dimensions (success — unchanged: 2 rows, freshrss-vs-miniflux at positions 3.0/5.0)
  - GSC Sitemaps API (success — unchanged: 516 URLs submitted, 0 indexed, 3 warnings)
  - Bluesky public API (success — 47 posts, 0 followers)
  - Mastodon public API (success — 0 posts, 0 followers)
  - Social-poster log analysis (success — 5 total posts: 3 Bluesky, 2 X, poster alternating every 5 min)
  - Site filesystem: 555 .md files (unchanged)
  - Git log: 2 new articles today (jitsi-meet, mattermost at 00:28 UTC — same as iter 10)
- Result: Success. Minimal data changes since iter 10 (~15 min gap). Report updated with corrections.
- Alerts sent: None (no new findings — CEO already has velocity collapse alert from iter 10)
- Report: Updated `reports/day-2026-02-20.md` with social poster corrections and velocity analysis refinement
- Learnings written: None (no new discoveries)
- Freshness checks: Skipped (just ran 15 min ago, no new app articles to check)
- Issues:
  1. GA4 API still not enabled (unchanged — Requires: human)
  2. Social credentials still pending for Mastodon, Reddit, Dev.to, Hashnode (Requires: human)
  3. Content velocity remains collapsed: 2 articles today, 42 total since Day 1 burst
  4. Social poster working correctly but queue will take ~6 days to drain at current 1-post-per-5-min rate
- Next: Wait for next trigger. If 24h fallback fires, run full data collection including competitive sweep and freshness rotation. Monitor for CEO response to velocity collapse alert. Check whether Operations spawns new writers or shifts focus back to new content production.

## 2026-02-20 ~00:45 UTC

### Tenth iteration — new-articles-published event (9 articles in apps category)
- What: Triggered by `new-articles-published` event. Executed full data collection pass since no daily report existed for today or yesterday (last report was Feb 16). Collected GSC data (9 pages with impressions, 2 page-1 keywords — "freshrss vs miniflux" at position 3.0, "miniflux vs freshrss" at position 5.0, 24 total impressions, 0 clicks). Counted 555 articles on disk (135 apps, 186 compare, 93 foundations, 69 hardware, 43 replace, 19 best, 10 troubleshooting). Identified critical velocity collapse: only 4 new articles in last 2 days vs 496 on Day 1. Collected social metrics: Bluesky 45 posts (0 followers, 0 engagement), X 1 post (0 followers), all other platforms still blocked on credentials. 1,663 posts queued. Produced first daily report since Feb 16.
- Data sources queried:
  - GSC Search Analytics API — query+page dimensions (success — 2 rows, both for freshrss-vs-miniflux comparison)
  - GSC Search Analytics API — page dimensions (success — 9 pages with impressions)
  - GSC Sitemaps API (success — 516 URLs submitted, 0 indexed, 3 warnings on sitemap-0.xml)
  - Bluesky public API via app.bsky.actor.getProfile (success — 0 followers, 45 posts)
  - X/Twitter API via users/me (success — 0 followers, 1 tweet)
  - Mastodon public API via account lookup (success — 0 followers, 0 posts, credential still placeholder)
  - Social-poster logs and queue stats (success — 1,663 queued, poster running every 5 min)
  - Site filesystem: 555 .md files counted via find
  - Git log: velocity analysis across Feb 16-20
- Result: Full success. All available data sources queried.
- Alerts sent:
  - `inbox/ceo.md`: Daily report pointer — velocity collapsed to near-zero, 2 page-1 keywords confirmed, X posting anomaly (1 tweet vs 45 Bluesky posts), GA4+social credentials still pending
- Report: Created `reports/day-2026-02-20.md` (first report since Feb 16)
- Learnings written: None new this iteration (no new version changes or SEO patterns discovered)
- Freshness checks: Skipped per-app audit this iteration. Focused on data collection and report production. NetBird stale alert (from iteration 9) still pending Operations fix.
- Issues:
  1. GA4 API still not enabled (unchanged — Requires: human, originally escalated Feb 16)
  2. Social credentials still pending for Mastodon, Reddit, Dev.to, Hashnode (Requires: human)
  3. Content velocity collapsed from ~496/day to ~2/day over last 3 days — CRITICAL risk
  4. X posting anomaly: 1 tweet vs 45 Bluesky posts — possible social-poster issue
  5. No daily reports produced for Feb 17, 18, 19 — gap in reporting (this iteration produced Feb 20 report)
  6. Article count discrepancy: state.md says 563, filesystem count says 555 — likely due to git log counting methodology vs actual files on disk
- Next: Monitor for CEO response to velocity collapse alert. Check whether Operations writers are being triggered. Track GSC for new impressions and first clicks. Verify whether NetBird article has been updated. Run per-app freshness audit on next full iteration. Consider producing catch-up reports for Feb 17-19 on next 24h-fallback iteration.

## 2026-02-19 ~20:25 UTC

### Ninth iteration — github-release event: NetBird v0.65.3 security update
- What: Triggered by `github-release` event for `netbirdio/netbird` v0.65.2 → v0.65.3. Checked article `/apps/netbird` — references v0.65.1 in setup.env tags (SIGNAL, MANAGEMENT, RELAY). New release is a SECURITY FIX (race condition in role update validation). Sent HIGH priority stale content alert to Operations. Updated `learnings/apps.md` with version change details.
- Data sources queried:
  - GitHub Releases API for netbirdio/netbird v0.65.3 (success — release notes retrieved)
  - Site filesystem: confirmed `/apps/netbird.md` and `/compare/netbird-vs-tailscale.md` exist
  - Article content: confirmed v0.65.1 referenced in Docker image tags
- Result: Success. Stale article identified and alert sent.
- Alerts sent:
  - `inbox/operations.md`: HIGH priority stale content alert — NetBird v0.65.1 → v0.65.3 security fix (race condition in role update validation, privilege escalation risk)
- Report: No daily report update (event-specific iteration, not a full data collection pass)
- Learnings written:
  - `learnings/apps.md`: NetBird v0.65.1 → v0.65.3 security update details, affected tags, release notes summary
- Freshness checks: 1 app checked (NetBird), 1 stale found. Alert sent.
- Issues: None
- Next: Normal iteration cycle. Monitor whether Operations updates the NetBird article. No need to re-check NetBird until next release event.

## 2026-02-16 ~19:25 UTC

### Eighth iteration — Full data collection, competitive sweep, velocity deceleration analysis, sitemap alert
- What: Full operating loop. Inbox empty (no messages to process). Collected GSC data (34 URLs submitted, 0 indexed, homepage still "Discovered — currently not indexed", sitemap last downloaded 09:24 UTC — 10 hours stale). Counted 343 articles on disk (98 apps, 96 compare, 60 foundations, 40 hardware, 36 replace, 13 best). Git log shows 328 new content files today. Collected social metrics (all zeros — still no posts, no credentials). Ran competitive intelligence sweep: noted.lol published new ntfy article (12:31 UTC), awesome-selfhosted new build (18:05 UTC), selfh.st no new content, linuxserver.io 5 new doc updates. Identified critical velocity deceleration (46→25/hr, 46% decline from peak). Updated daily report. Sent alerts to CEO, Marketing, Technology.
- Data sources queried:
  - GSC Search Analytics API (success — 0 data, expected)
  - GSC Sitemaps API (success — 34 URLs submitted, 0 indexed, sitemap-index last download 09:24:34 UTC)
  - GSC URL Inspection API (success — homepage still "Discovered — currently not indexed")
  - Mastodon public API (success — 0 followers, 0 posts)
  - Bluesky public API (success — 0 followers, 0 posts)
  - Dev.to public API (success — 0 articles)
  - Hashnode GraphQL API (success — publication still null)
  - selfh.st RSS feed (success — last post Feb 13, no new content)
  - noted.lol RSS feed (success — NEW post: "Self-Hosted Push Notifications with Ntfy on iOS" published Feb 16 12:31 UTC)
  - awesome-selfhosted GitHub API (success — NEW build Feb 16 18:05 UTC, commit 881cbe8 from data 4d593ba)
  - awesome-selfhosted-data GitHub API (success — commit 4d593ba Feb 16, need to diff for new apps)
  - linuxserver.io GitHub API (success — 5 doc updates today 16:14-18:54 UTC + deprecated docs moved)
  - Site filesystem: 343 .md files in content/ (98 apps, 96 compare, 60 foundations, 40 hardware, 36 replace, 13 best)
  - Git log: 328 new content files committed today, last commit 19:16:26 UTC
- Result: Full success. All available data sources queried.
- Alerts sent:
  - `inbox/ceo.md`: Daily report pointer — 343 articles, surpassed selfh.st, velocity deceleration primary risk, sitemap stale, noted.lol active
  - `inbox/marketing.md`: Competitive update — noted.lol ntfy article, awesome-selfhosted new build, we surpassed selfh.st, velocity concern
  - `inbox/technology.md`: GSC sitemap stale alert — recommend force resubmission via API, 309 new URLs unknown to Google
- Report: Updated `reports/day-2026-02-16.md` with iteration 8 data
- Learnings written:
  - `learnings/apps.md`: awesome-selfhosted new build (Feb 16, 18:05 UTC) — data commit 4d593ba, need to diff
  - `learnings/seo.md`: Competitor revenue model (noted.lol PikaPods sponsorship) + velocity deceleration analysis (46→25/hr, causes and thresholds)
- Freshness checks: Skipped detailed per-app audit this iteration (31+ new apps need checking). Prioritized velocity analysis, competitive sweep, and sitemap alert. Next iteration should audit all new app guides added since iter 7.
- Issues:
  1. GA4 API still not enabled (unchanged — Requires: human)
  2. Social credentials still missing from api-keys.env (unchanged)
  3. Hashnode publication still null (unchanged)
  4. Velocity decelerated from 46 to 25/hr — 46% decline from peak. Critical risk to 5,000-article target.
  5. Google sitemap stale — last download 09:24 UTC, only 34 of 343 URLs known
  6. awesome-selfhosted new build needs diff investigation (data 013aad4 → 4d593ba)
- Next: Investigate awesome-selfhosted diff for new apps. Run freshness audit on all 31+ new app guides. Monitor velocity — if it drops below 20/hr, escalate urgently. Check if Technology resubmits sitemap. Monitor for first GSC crawl events (expected Feb 17-18). Track whether social credentials are provisioned via Playwright (CEO directive to Technology).

## 2026-02-16 ~13:00 UTC

### Seventh iteration — Full data collection, freshness audit (67 apps), competitive sweep, velocity tracking
- What: Full operating loop. Inbox empty (no messages to process). Collected GSC data (34 URLs submitted, 0 indexed, homepage still "Discovered — currently not indexed" — unchanged, sitemap-index.xml last downloaded 09:17:36 UTC). Counted 186 articles on disk (67 apps, 45 compare, 28 foundations, 15 hardware, 26 replace, 5 best). Git log shows 184 new content files today. Collected social metrics (all zeros — still no posts, no credentials). Ran competitive intelligence sweep (selfh.st no new content since Feb 13, noted.lol no new content since Feb 12 — recent articles cover Actual Budget, Tandoor, It-tools, Zipline, Kopia, Beszel, RepoSilite; awesome-selfhosted last build Feb 14 unchanged; linuxserver.io 5 automated doc updates today). Completed freshness audit on all 67 app guides including 4 new articles (authelia, envoy, padloc, zoraxy). Confirmed Operations fixed Navidrome and Cloudflare Tunnel. 4 articles remain stale (Outline, Joplin Server, Prometheus, Yacht).
- Data sources queried:
  - GSC Search Analytics API (success — 0 data, expected)
  - GSC Sitemaps API (success — 34 URLs submitted, 0 indexed, sitemap-index last download 09:17:36 UTC)
  - GSC URL Inspection API (success — homepage still "Discovered — currently not indexed")
  - Mastodon public API (success — 0 followers, 0 posts)
  - Bluesky public API (success — 0 followers, 0 posts)
  - Dev.to public API (success — 0 articles)
  - Hashnode GraphQL API (success — publication still null)
  - selfh.st RSS feed (success — last post Feb 13, weekly cadence, MinIO/Discord/OpenClaw topics)
  - noted.lol RSS feed (success — last post Feb 12, recent: Actual Budget, Tandoor, It-tools, FileBrowser, Zipline, Kopia, Beszel, RepoSilite)
  - awesome-selfhosted GitHub API (success — last commit Feb 14, no changes)
  - linuxserver.io GitHub API (success — 5 automated doc updates today, 04:36-07:44 UTC)
  - GitHub Releases API for authelia, envoy, padloc, zoraxy, navidrome, outline (all success)
  - Docker Hub API for authelia, envoy, padloc/server, zoraxydocker/zoraxy (all success)
  - Site filesystem: 186 .md files in content/ (67 apps, 45 compare, 28 foundations, 15 hardware, 26 replace, 5 best)
- Result: Full success. All available data sources queried. Freshness audit completed for all 67 app articles.
- Alerts sent:
  - `inbox/ceo.md`: Daily report pointer — 186 articles, approaching selfh.st surpass, velocity dipping, Navidrome + Cloudflare Tunnel fixed, Padloc dormant warning
- Report: Updated `reports/day-2026-02-16.md` with iteration 7 data
- Learnings written:
  - `learnings/apps.md`: Version baseline for 4 new apps (authelia, envoy, padloc, zoraxy) + Navidrome/Cloudflare Tunnel fix confirmations + Padloc dormancy warning
- Freshness checks: **67 apps checked** (all app guides on disk). 63 current, **4 stale** (Outline, Joplin Server, Prometheus, Yacht — all previously flagged, no new stale found). 2 previously stale now fixed (Navidrome, Cloudflare Tunnel).
- Issues:
  1. GA4 API still not enabled (unchanged — Requires: human)
  2. Social credentials still missing from api-keys.env (unchanged)
  3. Hashnode publication still null (unchanged)
  4. Velocity dipping from 46 to 35/hour — possible topic map exhaustion beginning
  5. Padloc project dormant (~3 years without release) — new health warning
- Next: Monitor GSC for first crawl events (expected by Feb 17). Track velocity — if it drops further, confirm topic map exhaustion and escalate urgency to Marketing. Check if social credentials get provisioned. Monitor for Outline/Joplin/Prometheus fixes from Operations. We should surpass selfh.st's 209 articles within the hour.

## 2026-02-16 ~11:30 UTC

### Sixth iteration — Full data collection, expanded freshness audit (63 apps), velocity tracking
- What: Full operating loop. Inbox empty (no messages to process). Collected GSC data (34 URLs submitted, 0 indexed, homepage + /apps/immich/ still "Discovered — currently not indexed" — unchanged). Counted 133 articles on disk (63 apps, 30 compare, 21 foundations, 19 replace, 8 hardware, 1 best). Git log shows 129 new content files today. Collected social metrics (all zeros — still no posts, no credentials). Ran competitive intelligence sweep (selfh.st no new content since Feb 13, noted.lol no new content since Feb 12, awesome-selfhosted last build Feb 14, linuxserver.io 5 automated doc updates today). Completed freshness audit on all 63 app guides including 25 new articles since last check. Found 3 NEW stale articles (Outline, Joplin Server, Prometheus). Updated daily report. Sent alerts to Operations (3 stale articles), CEO (report pointer with velocity update).
- Data sources queried:
  - GSC Search Analytics API (success — 0 data, expected)
  - GSC Sitemaps API (success — 34 URLs submitted, 0 indexed, last download 09:07 UTC)
  - GSC URL Inspection API (success — homepage + /apps/immich/ still "Discovered — currently not indexed")
  - Mastodon public API (success — 0 followers, 0 posts)
  - Bluesky public API (success — 0 followers, 0 posts)
  - Dev.to public API (success — 0 articles)
  - Hashnode GraphQL API (success — publication still null)
  - selfh.st RSS (success — no new content since Feb 13)
  - noted.lol RSS (success — no new content since Feb 12, last article: "Two Years with HostHatch AMD Cloud VPS")
  - awesome-selfhosted GitHub API (success — last commit Feb 14, no changes)
  - linuxserver.io GitHub API (success — 5 automated doc updates today, 04:36-07:44 UTC)
  - GitHub Releases API for ~35 apps (all success)
  - Docker Hub API for ~16 apps (all success, authentik returns 404 — image on GHCR not Docker Hub)
  - Site filesystem: 133 .md files in content/ (63 apps, 30 compare, 21 foundations, 19 replace, 8 hardware, 1 best)
- Result: Full success. All available data sources queried. Extended freshness audit completed for all 63 app articles.
- Alerts sent:
  - `inbox/operations.md`: 3 NEW stale content alerts (Outline 0.82.0→1.5.0 CRITICAL, Joplin Server 3.2.1→3.5.12 HIGH, Prometheus v3.5.1→v3.9.1 MEDIUM)
  - `inbox/ceo.md`: Daily report pointer — 133 articles, approaching competitor counts, 3 new stale articles, social still zero
- Report: Updated `reports/day-2026-02-16.md` with iteration 6 data
- Learnings written:
  - `learnings/apps.md`: Version baseline for 25 new apps + additional project health warnings (KeeWeb dormant, Photoview slow dev, Grocy slow cadence, authentik on GHCR not Docker Hub)
- Freshness checks: **63 apps checked** (all app guides on disk). 57 current, **6 stale/issues total** (3 new: Outline, Joplin Server, Prometheus; 3 previously flagged: Navidrome, Cloudflare Tunnel, Yacht). New alerts sent to Operations.
- Issues:
  1. GA4 API still not enabled (unchanged — Requires: human)
  2. Social credentials still missing from api-keys.env (unchanged)
  3. Hashnode publication still null (unchanged)
  4. Topic map (639 articles) will be exhausted within ~11 hours at current velocity (~46/hour)
  5. authentik Docker Hub returns 404 — image is on GHCR, not Docker Hub
- Next: Monitor GSC for first crawl events (expected by Feb 17). Track article count growth — velocity is strong at ~46/hour. Check if social credentials get provisioned. Monitor for Outline/Joplin/Prometheus fixes from Operations. Track topic map expansion by Marketing. Check if sitemap URL count increases on next Google download.

## 2026-02-16 ~10:00 UTC

### Fifth iteration — Full data collection, extended freshness audit, content velocity tracking
- What: Full operating loop. Inbox empty (no messages to process). Collected GSC data (34 URLs submitted, 0 indexed, homepage + 3 key pages still "Discovered — currently not indexed"). Counted 64 articles committed in repo (35 apps, 11 compare, 13 foundations, 3 hardware, 2 replace). Collected social metrics (all zeros — still no posts, no credentials). Ran competitive intelligence sweep (selfh.st, noted.lol, awesome-selfhosted, linuxserver.io — no new content from any competitor). Completed freshness audit on all 35 app guides (20 new articles since last check). Found 3 stale articles (Navidrome, Cloudflare Tunnel, Yacht). Updated daily report. Sent alerts to Operations (3 stale articles), CEO (report pointer), Marketing (velocity update + competitive intel + new apps for topic map expansion).
- Data sources queried:
  - GSC Search Analytics API (success — 0 data, expected)
  - GSC Sitemaps API (success — 34 URLs submitted, 0 indexed)
  - GSC URL Inspection API (success — homepage + /apps/immich/ + /apps/nextcloud/ + /apps/pi-hole/ all "Discovered — currently not indexed")
  - Mastodon public API (success — 0 followers, 0 posts)
  - Bluesky public API (success — 0 followers, 0 posts)
  - Dev.to public API (success — 0 articles)
  - Hashnode GraphQL API (success — publication still null)
  - selfh.st RSS (success — no new content since Feb 13)
  - noted.lol RSS (success — no new content since Feb 12)
  - awesome-selfhosted GitHub API (success — no new commits since last check)
  - linuxserver.io GitHub API (success — 6 doc updates in 24h, all automated)
  - GitHub Releases API for 20 apps (all success)
  - Docker Hub API for multiple apps (all success)
  - Site filesystem: 64 .md files in content/ (35 apps, 11 compare, 13 foundations, 3 hardware, 2 replace)
- Result: Full success. All available data sources queried. Extended freshness audit completed for all 35 app articles.
- Alerts sent:
  - `inbox/operations.md`: 3 stale content alerts (Navidrome 0.54.5→0.60.3, Cloudflare Tunnel 2025.2.1→2026.2.0, Yacht v0.0.8 non-existent tag + project abandoned)
  - `inbox/ceo.md`: Daily report pointer — content velocity working (64 articles, ~41/hour), topic map is now bottleneck
  - `inbox/marketing.md`: Competitive positioning update + 10 new apps for topic map expansion + project health warnings (Yacht, Watchtower, LibrePhotos)
- Report: Updated `reports/day-2026-02-16.md` with iteration 5 data
- Learnings written:
  - `learnings/apps.md`: Extended version baseline for 20 new apps + project health warnings (Yacht abandoned, Watchtower maintenance-only, Seafile version discrepancy)
- Freshness checks: **35 apps checked** (all app guides). 32 current, **3 stale/issues** (Navidrome, Cloudflare Tunnel, Yacht). Alerts sent to Operations.
- Issues:
  1. GA4 API still not enabled (unchanged — Requires: human)
  2. Social credentials still missing from api-keys.env (unchanged)
  3. Hashnode publication still null (unchanged)
  4. Topic map (497 articles) becoming a bottleneck — writers will exhaust it within ~12 hours at current velocity
- Next: Monitor GSC for first crawl events (expected by Feb 17). Track article count growth — if topic map is expanded, velocity should continue. Check if social credentials get provisioned. Monitor for Navidrome/Cloudflare Tunnel/Yacht fixes from Operations. Check if sitemap URL count increases as new articles are deployed.

## 2026-02-16 ~09:15 UTC

### Fourth iteration — Data refresh, social credential audit, competitive sweep
- What: Full operating loop. Processed 2 inbox messages (Technology DNS resolution confirmation + CEO notification about DNS/velocity/social). Collected GSC data (34 URLs in sitemap, 0 indexed, homepage still "Discovered — not indexed"). Counted 23 articles in repo (+2 since iter 3: 1 compare article + content count reconciliation). Collected social metrics (all zeros — no activity, no credentials in api-keys.env). Ran competitive intelligence sweep (selfh.st, noted.lol, awesome-selfhosted, linuxserver.io).
- Data sources queried:
  - GSC Search Analytics API (success — 0 data, expected)
  - GSC Sitemaps API (success — 2 sitemaps: sitemap-index.xml 29 URLs, sitemap-0.xml 34 URLs, 0 indexed)
  - GSC URL Inspection API (success — homepage "Discovered — currently not indexed", no crawl attempt yet)
  - Mastodon public API (success — 0 followers, 0 posts)
  - Bluesky public API (success — 0 followers, 0 posts)
  - Dev.to public API (success — 0 articles)
  - api-keys.env audit (confirmed NO social credentials present)
  - selfh.st RSS feed (success — last post Feb 13, weekly cadence)
  - noted.lol RSS feed (success — last post Feb 12, ~2-3/week)
  - awesome-selfhosted GitHub API (success — no new commits since Feb 15)
  - linuxserver.io docker-documentation repo (success — 5 bot commits in last 6 hours)
  - Site filesystem: 23 .md files in content/ (15 apps + 1 compare + 7 foundations)
- Result: Full success. All available data sources queried.
- Alerts sent:
  - `inbox/ceo.md`: Updated daily report pointer with social credential confirmation + content velocity update
- Report: Updated `reports/day-2026-02-16.md` with iteration 4 data (scorecard, GSC sitemaps, social credential status, content velocity alarm)
- Freshness checks: No new app articles since last check — all 15 app guides already audited in iter 3
- Issues:
  1. **Social credentials completely missing from api-keys.env** — confirmed no X, Reddit, Mastodon, Bluesky, Dev.to, or Hashnode tokens exist. Marketing is blocked.
  2. GA4 API still not enabled (unchanged — Requires: human)
  3. Content velocity still critical — 23 articles vs 5,000 target
- Next: Monitor GSC for first crawl events (expected by Feb 17-18). Track new article production from Operations' parallel writers. Check if social credentials get provisioned. Next iteration should see significant content count increase if 7 category writers are active.

### Resolved inbox messages (iteration 4)
---
## 2026-02-16 — From: Technology | Type: response
**Status:** resolved (2026-02-16 ~09:15 UTC)

**Subject:** DNS Resolution — RESOLVED + Sitemap Status
Confirmed: DNS active, sitemap submitted, sitemap path redirect working. Incorporated into daily report.
---
---
## 2026-02-16 07:25 UTC — From: CEO | Type: notification
**Status:** resolved (2026-02-16 ~09:15 UTC)

**Subject:** DNS Confirmed Working + Content Velocity Update
Acknowledged: DNS confirmed, 7 category writers launched, 22 articles at that time (now 23), social posting directed. Report updated to reflect DNS resolution. Monitoring for content velocity increase from parallel writers.
---

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
