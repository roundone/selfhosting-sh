# SEO Learnings

## 2026-02-21 — First clicks on Day 6: comparison articles convert first (BI & Finance, iteration 34)
- **Key finding:** First 5 GSC clicks arrived Feb 19 (Day 6 post-launch). 3 of 5 clicked pages are comparison articles. Hardware guides generate the most impressions but comparisons convert to clicks first.
- **Data:** proxmox-hardware-guide: 580 impressions, 2 clicks (CTR 0.34%). kavita-vs-calibre-web: 127 impressions, 1 click (CTR 0.79%). freshrss-vs-miniflux: 63 impressions, 1 click (CTR 1.59%). apps/nextcloud: 5 impressions, 1 click (CTR 20%).
- **CTR by content type:** Comparison pages have higher CTR at similar positions. freshrss-vs-miniflux (position 4.7, CTR 1.59%) outperforms proxmox-hardware-guide (position 5.8, CTR 0.34%) despite having far fewer impressions. Comparison titles ("X vs Y") likely match search intent better than broad guide titles.
- **Impression growth curve:** 0 → 24 → 494 → 1,324 (days 3-6). 2.68x daily multiplier on Feb 19. If sustained, Feb 20 ~3,500, Feb 21 ~9,400. This exponential growth is typical of new domains entering Google's active indexing phase.
- **Position 1-2 keywords appearing:** 9 keywords at position 1-2, ALL long-tail variants of syncthing/nextcloud and kavita/calibre comparisons. This is textbook topical authority building — Google is recognizing us as authoritative for these specific comparison topics.
- **Implication:** Comparison articles are the fastest path from impression to click. When writers resume, EVERY category should have its core comparison articles written first. Hardware content builds broad impression volume; comparison content converts.
- **Confidence:** High — based on direct GSC Search Analytics API data for Feb 15-19 (5 days post-launch).

## 2026-02-21 — Google Indexing API is SERVICE_DISABLED and not useful for regular web pages (CEO)
- **What:** Attempted to use Google's Indexing API (`indexing.googleapis.com`) to submit 20 URLs for immediate indexing. All 20 requests returned 403 SERVICE_DISABLED.
- **Why:** The Indexing API is not enabled on GCP project 13850483084. Requires a project owner/editor to enable it in the console.
- **Important caveat:** Even if enabled, the Indexing API is officially designed for `JobPosting` and `BroadcastEvent` structured data types only. Regular web pages may be rejected or ignored. Google's documentation explicitly states this.
- **Better approach:** Use the **URL Inspection API** (`searchconsole.googleapis.com/v1/urlInspection/index:inspect`) which we already have access to. This triggers Google to re-evaluate the URL. Combined with properly configured sitemaps with `<lastmod>`, this is the standard mechanism for requesting crawls.
- **Result:** URL Inspection API calls submitted for top 10 pages. 8 of 10 confirmed INDEXED. Homepage ("URL is unknown to Google") and getting-started ("Discovered - currently not indexed") had inspection requests submitted, which should trigger re-evaluation.

## 2026-02-21 — Homepage "unknown to Google" despite proper sitemap and canonical setup (CEO)
- **Finding:** GSC URL Inspection shows homepage at `https://selfhosting.sh/` as "URL is unknown to Google" on Day 6.
- **Not a technical issue:** Homepage IS in sitemap, returns HTTP 200, has correct canonical tag, no noindex, robots.txt allows it, www redirects properly.
- **Cause:** Normal for a 6-day-old domain with minimal external backlinks. Google prioritizes pages it discovers through external links first. Our inner pages (comparisons, hardware guides) got indexed because they appeared in search results via content signals, not because of homepage discovery.
- **Fix:** URL Inspection request submitted (triggers re-evaluation). External signal building (Dev.to, Hashnode, Mastodon with canonical URLs) is the primary accelerant.
- **Key insight:** On a new domain, Google may index deep pages before the homepage if those deep pages match active search queries. This is counterintuitive but normal.

## 2026-02-21 — Indexing investigation: 4 root causes found and fixed (CEO)
- **Problem:** 789 URLs submitted to GSC, 0 indexed per sitemap report. Homepage "Discovered - currently not indexed" after 6 days. Founder escalated as high priority.
- **Root cause 1: No `<lastmod>` in sitemap.** The Astro sitemap plugin was generating URLs without date information. Google uses `<lastmod>` to prioritize which pages to crawl first. Without it, Google treats all 789 URLs equally — no urgency signal. **Fix:** Added `lastmod: new Date()` to sitemap plugin config.
- **Root cause 2: 9,893 internal links missing trailing slashes.** Every internal markdown link like `](/apps/immich)` generated a 308 redirect to `]/apps/immich/)`. With 789 pages and ~12.5 internal links each, this meant Googlebot was hitting ~9,893 redirects during internal crawling — massively wasting crawl budget on a new domain that already has minimal crawl allocation. **Fix:** Batch sed replacement across all 780 content files.
- **Root cause 3: www not redirecting.** `www.selfhosting.sh` served content (HTTP 200) instead of redirecting to `selfhosting.sh`. Google was crawling both hostnames, splitting crawl budget and potentially causing canonical confusion. **Fix:** CF Pages middleware (`functions/_middleware.ts`) returning 301 redirect.
- **Root cause 4: 428 articles published on day 1.** A brand-new domain going from 0 to 790 pages in 5 days is a strong negative quality signal to Google. This likely triggered conservative indexing behavior. **Cannot be undone** but explains the "Discovered - currently not indexed" status.
- **Additional fix: RSS autodiscovery tag** added to `<head>`. Helps feed aggregators and crawlers discover content.
- **URL inspection revealed:** 13 of top 20 pages are already indexed (verdict PASS, crawled as mobile). 5 are "Discovered - currently not indexed." 2 are "unknown to Google." The sitemap's "0 indexed" counter lags behind actual indexing status.
- **Key insight for new domains:** The first 2 weeks are critical. Google's crawl budget for new domains is very limited. Every wasted redirect, every duplicate hostname, every missing signal compounds into slower indexing. On an established domain, 9,893 redirect chains are a minor issue. On a 6-day-old domain, they can be the difference between indexed and not indexed.
- **Expected impact:** These fixes should improve crawl efficiency significantly. Monitor GSC data Feb 22-26 for acceleration.
- **Confidence:** High — all root causes are well-documented SEO best practices. The trailing slash fix alone eliminates ~9,893 unnecessary HTTP requests per crawl cycle.

## 2026-02-20 — GSC impressions exploded: 24 → 494 in one day, 15 page-1 keywords (Marketing, iteration 13)
- **Total impressions (Feb 16-20): 518.** Up from ~24 in the previous pull. The jump happened on Feb 18 — impressions went from 24 (Feb 17) to 494 (Feb 18). Google is accelerating its crawl.
- **15 page-1 keywords** (position ≤ 10), up from 2 confirmed on Feb 19. Strongest: "calibre vs kavita" (3.0), "miniflux vs freshrss" (3.0), "selfhost sh" (3.0), "freshrss vs miniflux" (3.8).
- **22 pages with impressions** (up from 9 on Feb 19). 6 of the top 10 are comparison pages — the comparison strategy continues to dominate.
- **Hardware pages are impression magnets:** `/hardware/proxmox-hardware-guide/` has 181 impressions at position 6.2 — by far our highest-impression page. Hardware content generates broad impressions even at moderate positions.
- **Zero clicks still.** 518 impressions, 0 clicks. Expected for a 5-day-old domain — most impressions are likely at positions 6-10 where CTR is <3%. First clicks should appear within days.
- **3 near-page-1 keywords (positions 11-20):** "haproxy vs nginx performance comparison" (18.0), "haproxy vs nginx reverse proxy" (17.0), "self host dns server in browser" (18.0). These are optimization targets — strengthen content to push them to page 1.
- **Homepage still NOT indexed** — "Discovered - currently not indexed" after 4+ days. Other pages are being indexed and ranking. This is unusual but not critical — flagged to Technology for investigation.
- **Impression acceleration rate:** Day 1 (0) → Day 2 (24) → Day 3 (494). If this exponential-ish growth continues, we could see 2,000+ impressions/day by end of week. The 778 articles in the sitemap are being processed.
- **Confidence:** High — GSC Search Analytics API direct query. Data has 2-3 day lag, so Feb 19-20 data not yet available. The Feb 18 explosion is real and indicates Google's crawler has shifted from discovery to active indexing.
- **Implication:** The site is entering the rapid indexing phase. Every article we have on disk will likely show impressions within 1-2 weeks. When writers resume Feb 22, the content they produce will be indexing into a site with established topical authority signals.

## 2026-02-20 — Mastodon is 50x more effective than Bluesky for self-hosting content (Marketing, iteration 11)
- **Mastodon:** 5 posts → 17 engagements (6 favs + 11 boosts) = **3.4 engagements/post**
- **Bluesky:** 82 posts → 6 engagements = **0.07 engagements/post**
- **X/Twitter:** 24 posts → 0 engagements = **0 engagements/post**
- **The self-hosting community is disproportionately active on the fediverse.** Mastodon users are FOSS enthusiasts who actively engage with self-hosting content. X's general audience doesn't engage with niche technical content from new accounts.
- **GA4 confirms:** 1 session from `infosec.exchange` (Mastodon/fediverse), 1 from `go.bsky.app` (Bluesky), 0 from X.
- **Implication for strategy:** Mastodon content quality and engagement should be #1 social priority. X should continue on autopilot but is unlikely to drive meaningful early growth. Bluesky is low-engagement but still worth maintaining for audience building.
- **Dev.to cross-posting launched** with 5 articles. Canonical_url set on all — generates backlinks and reaches technical audience without SEO penalty.
- **Confidence:** Medium-high. Small sample (5 Mastodon posts, 82 Bluesky, 24 X) but the engagement gap is enormous (50x). Will monitor as volume increases.

## 2026-02-20 — GA4 confirms organic search traffic is real (BI & Finance, iteration 20)
- **11 organic search sessions from Google** (Feb 16-20, GA4 Data API). This is higher than GSC's 0 clicks for the same period — expected because GA4 counts sessions from Google regardless of whether they appear in GSC's click data (GSC only shows data for verified queries, not all clicks).
- **1 session from Bing organic** — Bing is indexing us independently. We have not submitted a sitemap to Bing. Consider submitting to Bing Webmaster Tools for faster Bing indexing.
- **1 referral from ChatGPT** (chatgpt.com) — our content is being surfaced in ChatGPT responses. This is an unexpected traffic source worth monitoring. If this grows, it could become a meaningful channel.
- **GA4 vs GSC discrepancy is normal:** GA4 shows 11 organic sessions but GSC shows 0 clicks for Feb 18-20. GSC has a 2-3 day processing lag and filters out queries below a threshold. The organic traffic is real.
- **Returning users are extremely engaged:** 2 returning users averaged 454s session duration vs 5s for new users. This suggests content quality is excellent for users who find us — the challenge is getting discovered, not retaining visitors.
- **Desktop dominates:** 78% of sessions are desktop (53 of 68). Expected for a technical self-hosting audience. Mobile traffic (15 sessions) has very high bounce rate (80%) and low engagement (9.4s avg) — mobile experience may need optimization.
- **India is the #2 market:** 23 sessions (34%) with 61 pageviews — highest pages/session ratio. The self-hosting audience in India is significant and engaged.
- **GA4 property ID: 524871536** — use this for all future Data API calls. The measurement ID (G-DPDC7W5VET) is only for the tracking code, not APIs.
- **Confidence:** High — based on GA4 Data API v1beta direct query of property 524871536.

## 2026-02-20 — Content performance audit: indexing speed patterns (BI & Finance, iteration 19)
- **Hardware guides index fastest: 3.0% impression rate** (3 of 100 articles showing impressions). Compare at 1.5% (4 of 268). Apps at 0% (0 of 208).
- **Niche topics outperform high-competition topics 10:1** on early indexing. The only 2 page-1 keywords are for "freshrss vs miniflux" (niche RSS reader comparison at positions 3.0 and 5.0). High-competition comparisons (Jellyfin vs Plex, Pi-hole vs AdGuard Home, Nextcloud vs ownCloud) have zero impressions despite excellent content quality.
- **Table density correlates with impressions.** Articles with impressions average 32.1 table rows. Articles without impressions (sample) average 24.8 table rows (when tables are present). 87.5% of impression-earning articles have tables vs 62.5% of non-impression articles.
- **Shorter articles can outperform longer articles on niche topics.** Articles with impressions average 1,416 words. Articles without impressions average 1,791 words. This does not mean shorter is better — it means adequate coverage of niche topics beats comprehensive coverage of over-saturated topics (at least in the first 5 days).
- **App guides face steepest competition.** Zero impressions from 208 app guides. Queries like "nextcloud docker setup" or "how to self-host immich" are dominated by official docs, established tech blogs, and Reddit threads with years of authority. App guides will rank eventually but are the slowest path to early visibility.
- **"Replace X" format shows promise.** 1 of 58 replace articles has impressions (google-dns at position 6.0). Replace queries target high-intent users seeking alternatives — often less competitive than generic "how to install" queries.
- **Confidence:** High — based on GSC data for 772 articles over 5 days (Feb 16-20, 2026). Sample size is small (9 pages with impressions) but patterns are consistent with new-domain indexing behavior (Google tests new sites on low-competition queries first).
- **Implication for content strategy:** Prioritize niche comparisons, hardware guides, and replace articles over mainstream app guides and best-of roundups. The data is unambiguous — hardware and niche comparisons are the path to early page-1 keywords.

## 2026-02-16 — Competitive SEO landscape baseline (BI & Finance)
- **Key finding:** No competitor has scaled editorial content production in the self-hosting niche. The largest competitor (noted.lol) has 622 articles. selfh.st has ~37 substantive articles. linuxserver.io has 300+ documentation pages but no editorial content and no sitemap.xml (returns 404).
- **linuxserver.io has no sitemap** — this is a significant SEO weakness for a site with 300+ pages. They are not optimizing for search.
- **noted.lol uses flat URL structure** — all posts at root level (e.g., `/vaultwarden/`, `/ollama/`). No category-based URL hierarchy. This may limit their ability to build topical authority through URL structure.
- **selfh.st content is mostly weekly digests** — 107/189 posts are weekly roundups. These are not individually keyword-targeted and are unlikely to rank for specific queries.
- **awesome-selfhosted has 89 categories** covering the full self-hosting taxonomy. This is more granular than our 34-category topic map. As we expand coverage, this taxonomy is a reference for gap identification.
- **Implication:** First-mover advantage on editorial content is available. Whoever publishes comprehensive, well-structured guides for the 500-700+ apps in the self-hosting space first will build topical authority fastest. Google favors breadth + depth for topical authority signals.
- **Confidence:** High — based on direct sitemap analysis and content audits of all 5 competitors on 2026-02-16.

## 2026-02-16 — Revised competitor content counts (BI & Finance, iteration 2)
- **noted.lol has 386 posts** (revised down from 622 in iteration 1 — previous count likely included tag/page URLs from multiple sitemaps). Verified via `sitemap-posts.xml` which lists 386 post URLs.
- **selfh.st has 209 total posts** (revised up from 189). Breakdown: 160 weekly digests, 32 blog posts, 5 alternatives guides, 6 podcast episodes, 3 surveys, 3 discussions. Only 37 pieces are original editorial content.
- **selfh.st publishes on a strict weekly cadence** — every Friday. Next expected: Feb 20, 2026.
- **noted.lol publishes 2-4 posts per week** with occasional multi-day gaps. Recent focus on niche/newer apps.
- **awesome-selfhosted lists 1,234 apps** (significantly higher than the 500-700 estimate from iteration 1). This is the definitive count from `grep -c "^- \[" README.md`.

## 2026-02-16 — Sitemap submission is critical for new sites (BI & Finance)
- **GSC URL Inspection confirms homepage is "unknown to Google"** — verdict: NEUTRAL, coverage state: "URL is unknown to Google." All other fields UNSPECIFIED.
- **No sitemap submitted to GSC** — the sitemaps API endpoint returns empty.
- **For a brand-new domain with no inbound links, sitemap submission is the primary discovery mechanism.** Without it, Google has no reason to crawl the site. Organic discovery via links won't happen because no one links to us yet.
- **Sitemap URL convention:** Astro's @astrojs/sitemap generates `/sitemap-index.xml`, not `/sitemap.xml`. The latter returns 404. Some tools and crawlers default to checking `/sitemap.xml`. Consider adding a redirect.
- **robots.txt correctly references the sitemap** but uses the custom domain URL (`https://selfhosting.sh/sitemap-index.xml`) which doesn't resolve yet. Crawlers following robots.txt will fail to find the sitemap.

## 2026-02-16 — GSC uses domain property format, not URL prefix (CEO)
- **GSC property is `sc-domain:selfhosting.sh`** (domain-level property), NOT `https://selfhosting.sh` (URL-prefix).
- **API calls must use `sc-domain:selfhosting.sh`** as the site identifier, URL-encoded as `sc-domain%3Aselfhosting.sh`.
- Using `https://selfhosting.sh` returns 404 "not a verified site" — this tripped up BI's initial API calls.
- Domain properties are better — they cover all protocols (http/https) and all subdomains automatically.
- **Sitemap successfully submitted** to GSC at 2026-02-16 07:10 UTC. Status: isPending, 0 errors, 0 warnings.

## 2026-02-16 — Custom domain DNS setup for Cloudflare Pages (CEO)
- **Cloudflare Pages custom domains need TWO things:** (1) DNS CNAME record pointing to `[project].pages.dev`, (2) Custom domain added to the Pages project via API/dashboard.
- **For root domains on Cloudflare:** Use a proxied CNAME record (Cloudflare auto-flattens CNAMEs at the zone apex).
- **SSL cert provisioning takes minutes to hours** after adding the custom domain to Pages. During this window, the domain resolves but HTTPS may not work.
- **To test before DNS propagates locally:** Use `curl --resolve "selfhosting.sh:443:IP" https://selfhosting.sh` to bypass local DNS cache.
- **CLOUDFLARE_ACCOUNT_ID is required** for Pages API calls but was missing from api-keys.env. Retrieved from zone info API: `GET /zones/{zone_id}` → `result.account.id`.

## 2026-02-16 — GSC sitemap processing and indexing timeline (BI & Finance, iteration 3)
- **Sitemap submitted at 07:10:31 UTC, Google downloaded it within 1 second** (07:10:32 UTC). Zero errors, zero warnings. `isPending: false`.
- **Homepage moved from "unknown to Google" → "Discovered — currently not indexed"** within ~1 hour of sitemap submission. This confirms Google is processing our sitemap.
- **"Discovered — currently not indexed" means:** Google found the URL (from sitemap) and has queued it for crawling, but hasn't fetched or indexed it yet. `robotsTxtState`, `indexingState`, `pageFetchState`, and `crawledAs` are all UNSPECIFIED — confirming no crawl attempt yet.
- **Expected timeline:** For a brand-new domain, initial crawling typically begins 24-72 hours after sitemap submission. First indexing: 3-7 days. First search impressions: 1-2 weeks. This is accelerated by DNS resolution + content quality signals.
- **Critical dependency:** All 21+ sitemap URLs point to `https://selfhosting.sh/`. Until DNS resolves, Googlebot will fail to fetch these URLs even though it has discovered them. DNS resolution is the gating factor for the entire indexing pipeline.

## 2026-02-16 — Sitemap resubmitted and URL inspection results (Marketing, iteration 2)
- **Sitemap resubmitted** at 2026-02-16 07:16:04 UTC. Google had already downloaded it at 07:10:32 UTC. Status: `isPending: true`, 29 URLs submitted, 0 indexed. Zero errors, zero warnings.
- **URL inspection of 8 priority pages**: All return verdict NEUTRAL. 7 of 8 show "Discovered — currently not indexed" (queued for crawl). 1 (`/apps/immich/`) shows "URL is unknown to Google" — likely a timing issue since Immich IS in the sitemap. Will re-inspect next iteration.
- **No crawl timestamps exist** for any page. Google has not attempted to fetch any URL yet. Expected: 24-72 hours from sitemap submission.
- **No search analytics data** — expected for a site with 0 indexed pages.
- **Google Web Search Indexing API is NOT enabled** on GCP project. Returns 403 SERVICE_DISABLED. This API is officially for JobPosting/BroadcastEvent schema but could help signal freshness. Not critical — regular sitemap submission is the primary discovery mechanism.
- **DNS is now confirmed working** by Technology. selfhosting.sh and www.selfhosting.sh both resolve and return HTTP 200. This unblocks the entire indexing pipeline — Google can now crawl our URLs.
- **Next check**: Re-inspect URLs in 24 hours. Expect first crawl attempts by Feb 17. First indexing by Feb 19-21. First search impressions by Feb 23-28.

## 2026-02-16 — GSC status at ~2 hours post-submission (Marketing, iteration 3)
- **Sitemap resubmitted** at 2026-02-16 09:07 UTC. Google last downloaded at 09:04 UTC. Still shows 34 URLs (old count — sitemap not yet redeployed with 86+ articles). Auto-deploy runs every 5 min, so next deploy will update the sitemap.
- **All 4 inspected URLs still "Discovered — currently not indexed"** — no change from iteration 2. Zero crawl attempts. Expected first crawl: Feb 17-18 (24-48 hours from now).
- **Zero search analytics data** — expected for 0 indexed pages. Search Console data also has 2-3 day processing delay even after indexing begins.
- **Conclusion:** Indexing timeline tracking as expected for a brand-new domain. No anomalies. Patience required.

## 2026-02-16 — Internal link audit findings (Marketing, iteration 3)
- **98 content files audited.** All meet minimum internal link counts — Operations' writers are following the link count rules.
- **6 orphan pages found** (zero inbound links): audiobookshelf, filebrowser, grafana, lazydocker, nginx, dhcp-static-ip. These are newer articles that haven't been cross-linked yet.
- **16 missing /best/ pillar pages** — this is a structural SEO issue. The pillar-cluster model requires these roundup pages to exist. Currently 12+ articles link to `/best/docker-management` which doesn't exist. Same for photo-management, vpn, media-servers, reverse-proxy.
- **6 inconsistent URL slugs** causing 26 broken link instances — writers used slightly different slugs (e.g., `/foundations/backup-strategy` instead of `/foundations/backup-3-2-1-rule`). Easy fix.
- **84 broken link targets total** — most are forward references to content not yet written. This is expected and will resolve as writers complete more articles.
- **Key insight for SEO:** The /best/ pillar pages should be created ASAP — they are the hub pages in the pillar-cluster model and Google uses internal link structure to understand topical authority. Without pillar pages, Google may not understand our content hierarchy.

## 2026-02-16 — GSC status at ~3 hours post-submission (Marketing, iteration 4)
- **Sitemap still shows 34 URLs submitted, 0 indexed** — Google has not yet re-crawled the sitemap to pick up our 146+ URLs. Sitemap resubmitted again (HTTP 204 success).
- **URL inspection of 4 pages:**
  - `/` — "Discovered - currently not indexed" (in sitemap, not crawled)
  - `/apps/jellyfin/` — "Discovered - currently not indexed" (in sitemap, not crawled)
  - `/apps/immich/` — "URL is unknown to Google" (likely not in Google's copy of sitemap yet)
  - `/best/home-automation/` — "URL is unknown to Google" (new page, not yet in Google's sitemap snapshot)
- **Zero search analytics** — no impressions, no clicks. Expected for a site with 0 indexed pages.
- **Conclusion:** Same as iteration 3. No crawl attempts yet. On track for first crawl Feb 17-18.

## 2026-02-16 — Topic map expansion via awesome-selfhosted (Marketing, iteration 4)
- **awesome-selfhosted has 1,234 apps across 89 categories** — our topic map now covers 63 categories with ~905 planned articles.
- **1,090 apps found missing from our topic map** (587 with Docker support).
- **33 potential new category areas identified** — 19 created this iteration, ~14 remaining.
- **Biggest gaps in existing categories:** media-servers (61 missing apps), communication (51 missing), CMS (52 missing), note-taking (42 missing), personal-finance (32 missing), analytics (26 missing), email (30 missing).
- **Key apps to prioritize** (very popular, not yet in our map): Discourse, Lemmy, Frigate, Listmonk, ONLYOFFICE, Stirling-PDF, PocketBase, code-server, Cal.com, Planka, AppFlowy, ntfy, Tube Archivist, Invidious.
- **Projected article count if fully expanded:** ~1,600-2,000+ (adding Docker-supported apps with standard content types: app guides + comparisons + roundups + replace guides).

## 2026-02-16 — Competitor revenue model confirmation (BI & Finance, iteration 8)
- **noted.lol uses PikaPods as a sponsor** — their ntfy article (Feb 16, 12:31 UTC) has a PikaPods banner ad. PikaPods offers managed hosting for self-hosted apps.
- **This confirms the self-hosting content niche supports sponsorship revenue.** PikaPods is an ideal sponsor prospect for selfhosting.sh once we have traffic (they sell managed hosting for the same apps we write about).
- **noted.lol is monetizing with sponsored content** rather than (or in addition to) affiliate links. This is relevant to our Phase 2 revenue plan (month 4-6: sponsorships).
- **noted.lol publishing cadence observed:** Published on a Monday (Feb 16). Last post before that was Feb 12 (Wednesday). Cadence appears to be ~2-3 posts/week, not daily.

## 2026-02-16 — Content velocity deceleration analysis (BI & Finance, iteration 8)
- **Velocity trend: 2 → 41 → 46 → 35 → 25 articles/hour** over 8 iterations.
- **Peak velocity was 46/hr at iter 6 (~11:30 UTC).** Since then, steady decline.
- **Possible causes:** (1) Topic map exhaustion — 343/905 = 37.9% complete, writers in early categories may have finished their queues. (2) Remaining articles are more complex (compare/hardware articles take longer than app guides). (3) VPS memory constraints limiting parallel writer throughput. (4) Content types shifting — compare articles (96) have nearly caught up with app guides (98), suggesting writers are working on comparison articles which may be slower to produce.
- **At 25/hr sustained:** ~400 articles/day. Barely meets the 388/day needed for 5,000 by Feb 28. Zero margin for further deceleration.
- **Key metric to watch:** If velocity drops below 20/hr, the 5,000 target is unreachable without scaling up (more writers, more VPS memory, or expanded topic map).

## 2026-02-20 — GSC deep analysis confirms comparison articles index fastest (Marketing, iteration 7)
- **URL inspection confirms only 1 page is FULLY INDEXED:** `/compare/freshrss-vs-miniflux/` — crawled 2026-02-17T19:13:54Z as MOBILE, verdict PASS, canonical matches, Breadcrumbs rich results detected.
- **Homepage (`/`) is NOT indexed** — still "Discovered - currently not indexed" after 4 days. No crawl attempt yet. This is concerning but not uncommon for brand-new domains.
- **`/apps/immich/` and `/best/home-automation/` also NOT indexed** — same "Discovered but not crawled" state.
- **Key implication:** Despite 9 pages showing search impressions, only 1 is formally indexed per URL inspection. The other 8 pages likely have cached/soft-indexed status that shows impressions but hasn't been formally confirmed by URL inspection yet.
- **Comparison articles are unambiguously our fastest-ranking content type.** The only indexed page is a comparison. Comparisons also have the best positions (3.0, 4.5). Hardware guides show more impressions (8) but at worse positions (6.9). This validates the "comparisons first, app guides second" strategy.
- **Sitemap status:** sitemap-0.xml has 3 warnings (details not exposed via API). sitemap-index.xml has 0 warnings. Both show 516 URLs submitted, 0 "indexed" (GSC reporting lag — we know at least 1 is indexed from URL inspection).
- **Search analytics shows only 2 queries** this pull (vs 9 pages with impressions). This is likely due to GSC's 2-3 day data processing delay and aggregation thresholds.
- **Action taken:** Sent CRITICAL priority brief to Operations for 25+ comparison articles across 7 high-priority uncovered categories (AI/ML, Search Engines, Social Networks, Task Management, Video Surveillance, Music & Audio, Container Orchestration).

## 2026-02-21 — Mastodon: reduced posting frequency IMPROVES follower efficiency (BI & Finance, iteration 30)
- **Key finding:** After reducing Mastodon posting interval from 15 min to 45 min (3x reduction), follower efficiency IMPROVED from 0.41 followers/post (Feb 20) to 0.62 followers/post (Feb 21).
- **Data:** 93 followers from 150 posts at 45-min interval vs 34 followers from 83 posts at 15-min interval (Feb 20). The rate improved despite the app revocation incident.
- **Why:** The fediverse community (especially #selfhosted) values authentic, spaced-out content over high-volume posting. The bot flag also helps — it signals transparency about automated posting, which the community respects.
- **Implication:** For Mastodon, quality > quantity. Do NOT increase posting frequency. 45-min interval is optimal. The 0.62 followers/post rate at scale could yield 200+ followers within 2 weeks at current pace. This is counter-intuitive for growth hacking — less truly is more on the fediverse.
- **Contrast with Bluesky:** Bluesky has no such community norms. 215 posts, 13 followers (0.06 followers/post). Volume has not hurt, but hasn't helped either. Different growth levers needed (follow-for-follow, engagement replies).
- **Confidence:** Medium-high. Small absolute numbers (93 followers) but the trend is consistent across 3 data points (0.41 → 0.58 → 0.62 as frequency decreased).

## 2026-02-21 — Google organic users are high-repeat visitors (BI & Finance, iteration 30)
- **Key finding:** 16 Google organic sessions from only 4 users = **4 sessions per organic user**. Users who discover us through search come back repeatedly.
- **Data:** GA4 Feb 15-21: Google/organic source shows 16 sessions, 4 active users, 22 pageviews. These 4 users average 5.5 pageviews per session.
- **Returning user engagement is extraordinary:** 2 returning users generated 38% of all pageviews with 500s+ average session duration (8+ minutes).
- **Implication:** Each new page-1 ranking doesn't just bring one visit — it creates a returning reader. The flywheel: more indexed pages → more first-time organic visitors → a percentage become returning users → engagement metrics improve → Google promotes more pages → cycle repeats. This validates aggressive content production over gradual quality iteration.
- **Confidence:** Medium. Only 4 organic users so far — sample is tiny. But the repeat visit pattern is a strong signal worth monitoring as organic traffic grows.

## 2026-02-19 — First Google search impressions (Marketing, iteration 5)
- **9 pages showing impressions in GSC** as of 2026-02-19. Zero clicks. This is day 4 post-launch.
- **Fastest-indexed content types:** Hardware guides and comparison articles are indexing faster than app guides. `/hardware/proxmox-hardware-guide/` leads with 8 impressions at position 6.9.
- **Comparison keywords indexing quickly:** "miniflux vs freshrss" / "freshrss vs miniflux" showing at positions 3.0 and 5.0 respectively. Comparison content is inherently high-intent and low-competition — confirms our heavy comparison strategy is correct.
- **Position data is encouraging:** 3 pages already at position <5.0 (effectively page 1). For a 4-day-old domain, this is excellent.
- **Pages with impressions:** proxmox-hardware-guide (8), freshrss-vs-miniflux (4), reverse-proxy-explained (4), compare index (2), replace/google-dns (2), appflowy-vs-affine (1), cosmos-cloud-vs-yacht (1), raspberry-pi-alternatives (1), virtualization-hardware-compared (1).
- **Implication for strategy:** Comparison articles and hardware guides are our fastest path to page 1 keywords. Prioritize more comparison content in underserved categories. "vs" queries have lower volume individually but rank fast and collectively drive significant traffic.
- **Sitemap now shows 516 URLs** (up from 34). Google downloaded sitemap-0.xml on Feb 19. 3 warnings on the sitemap need investigation.
- **Expected trajectory:** At day 4, 9 pages indexed with impressions. By day 14, expect 50-100+ pages with impressions based on typical new-domain crawl acceleration patterns. First clicks should appear within days.
