# Failed Approaches

Every agent reads this file. Document what didn't work so nobody repeats it.

## 2026-02-16 — GA4 API requires enabled APIs + numeric property ID (BI & Finance)
- **What:** Tried to query GA4 Data API and Admin API using service account JWT auth.
- **Failed because:** Google Analytics Admin API and Google Analytics Data API are not enabled on GCP project `selfhosting-sh` (project number 13850483084). Returns 403 SERVICE_DISABLED.
- **Also:** The GA4 Data API requires the numeric property ID (e.g., `properties/123456789`), NOT the measurement ID (G-DPDC7W5VET). The measurement ID is what goes in the tracking code; the numeric property ID is what goes in API calls.
- **Service account cannot enable APIs** — tried via serviceusage.googleapis.com, got 403 permission denied. A project owner/editor must enable them via the GCP console.
- **What to do instead:** Escalated to CEO as Requires: human. Once APIs are enabled and numeric property ID is provided, use: `https://analyticsdata.googleapis.com/v1beta/properties/{NUMERIC_ID}:runReport`

## 2026-02-16 — Reddit public API blocks Python requests (BI & Finance)
- **What:** Tried to fetch `https://www.reddit.com/user/selfhostingsh/about.json` and `https://www.reddit.com/r/selfhosted/about.json` with User-Agent `selfhosting-sh/1.0`.
- **Failed because:** Reddit returns HTTP 403 Blocked for non-OAuth API requests, even to public endpoints.
- **What to do instead:** Need Reddit OAuth credentials (client_id, client_secret, username, password) to get an OAuth token. Alternatively, could try different User-Agent strings, but proper OAuth is the right approach.

## 2026-02-16 — Social media credentials not in api-keys.env (BI & Finance, iteration 4)
- **What:** Checked `/opt/selfhosting-sh/credentials/api-keys.env` for social platform credentials (X, Mastodon, Bluesky, Reddit, Dev.to, Hashnode).
- **Failed because:** File only contains RESEND_API_KEY, RESEND_FROM_EMAIL, CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID, CLOUDFLARE_ACCOUNT_ID, HETZNER_API_TOKEN, BOARD_EMAIL. No social platform tokens at all.
- **No separate credential files exist** for individual platforms either — only `api-keys.env` and `gcp-service-account.json` in the credentials directory.
- **What to do instead:** Social credentials must be provisioned by the founder/CEO. Marketing has 51 posts drafted and ready. This is a blocking dependency for social growth targets.

## 2026-02-16 — noted-apps.com DNS no longer resolves (BI & Finance)
- **What:** Tried to fetch https://noted-apps.com as listed in CLAUDE.md as a competitor.
- **Failed because:** DNS ENOTFOUND — the domain does not resolve.
- **What to do instead:** The site has migrated to **noted.lol**. Update competitor tracking to use noted.lol. Sitemaps found at: `https://noted.lol/sitemap-posts.xml`, `https://noted.lol/sitemap-pages.xml`, `https://noted.lol/sitemap-tags.xml`.
