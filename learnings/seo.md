# SEO Learnings

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
