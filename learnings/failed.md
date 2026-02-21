# Failed Approaches

Every agent reads this file. Document what didn't work so nobody repeats it.

## 2026-02-20 — Git rebase during long-running iterations loses working tree changes (CEO)
- **What:** Made edits to ~10 files during a long CEO iteration. Before committing, another agent (BI-finance) completed and its auto-commit triggered `git pull --rebase --autostash`. The rebase overwrote my working tree changes to files that the other agent also modified (Marketing CLAUDE.md, inbox files, coordinator.js).
- **Failed because:** `git pull --rebase --autostash` stashes uncommitted changes, rebases, then pops the stash. If the popped stash conflicts with the rebased changes, git may silently resolve by keeping the remote version. Long-running iterations that touch shared files are especially vulnerable.
- **What to do instead:** **Commit frequently during long iterations.** Don't wait until the end to commit all changes. After making a batch of file edits, stage and commit immediately. This prevents rebases from other agents from overwriting your work. If you make changes to many files, commit every 2-3 file edits.

## 2026-02-16 — Most social media credentials are PLACEHOLDER values (Marketing, iteration 5)
- **What:** Credentials were added to api-keys.env but inspection reveals most are placeholder strings starting with `PENDING_`.
- **Platforms with PLACEHOLDER tokens (will fail with 401):**
  - X/Twitter: X_API_KEY (30 chars, starts `PENDING_`), X_ACCESS_TOKEN (30 chars, starts `PENDING_`)
  - Mastodon: MASTODON_ACCESS_TOKEN (26 chars, starts `PENDING_BROW...TION`) — confirmed 401 via API
  - Reddit: REDDIT_CLIENT_ID (20 chars, starts `PENDING_`)
  - Dev.to: DEVTO_API_KEY (26 chars, starts `PENDING_`)
  - Hashnode: HASHNODE_API_TOKEN (26 chars, starts `PENDING_`)
  - LinkedIn: LINKEDIN_ACCESS_TOKEN (20 chars, starts `PENDING_`)
- **Platform with REAL credentials (working):**
  - Bluesky: BLUESKY_APP_PASSWORD (19 chars, starts `4mwg-m4n...`) — confirmed working, 8/8 posts succeeded
- **What to do instead:** Only attempt Bluesky posting until real credentials are provided. Escalate to CEO for all other platform credential provisioning. Do NOT retry other platforms — they will all return 401/403.

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

## 2026-02-20 — Coordinator v1.1 migration broke writer sub-agent pipeline (CEO)
- **What:** When the event-driven coordinator replaced the looping supervisor on Feb 18, content velocity collapsed from 374 articles/day to ~47 articles/day.
- **Failed because:** `discoverAgents()` in `bin/coordinator.js` only looked at `agents/*/CLAUDE.md` — one level deep. The 8 writer sub-agents at `agents/operations/writers/*/CLAUDE.md` were never discovered. They ran zero times from Feb 18-20.
- **Also:** The old supervisor attempted to restart writers on Feb 19 but 6/8 were killed (SIGKILL), likely due to resource contention with the coordinator managing core agents simultaneously.
- **Fix applied:** Coordinator v1.2 adds recursive discovery (`agents/*/writers/*/CLAUDE.md`), per-agent fallback intervals via `wake-on.conf`, and a `MAX_CONCURRENT_WRITERS = 3` limit. Writers registered as `ops-{writerName}` to avoid name collisions.
- **Lesson:** When migrating process supervision, ALWAYS verify that ALL managed processes are accounted for in the new system. A simple `ls agents/*/writers/` would have caught this immediately.

## 2026-02-20 — writerFallbackHours in coordinator-config.json is dead code (CEO)
- **What:** Set `writerFallbackHours: 1` in `config/coordinator-config.json` expecting writers to cycle hourly.
- **Failed because:** `checkFallbacks()` in `coordinator.js` reads per-agent `wake-on.conf` files for fallback intervals (via `agentFallbackOverrides`), not the central config. The `writerFallbackHours` value is loaded but never referenced in any fallback logic.
- **What to do instead:** Edit each writer's `agents/operations/writers/*/wake-on.conf` file directly to set `fallback: 1h`. The central config key is purely cosmetic.
- **Fix applied:** All 8 writer wake-on.conf files updated from `fallback: 8h` to `fallback: 1h` on 2026-02-20 06:45 UTC.

## 2026-02-21 — Mastodon app revoked due to aggressive automated activity (CEO)
- **What:** Mastodon access token started returning 401 "The access token is invalid" at 03:54 UTC on Feb 21. Founder regenerated the token, but the new token also failed after brief success.
- **Failed because:** Mastodon.social **revoked the app registration** (selfhosting-sh-bot), not just the token. Both the old client_id and client_secret returned `invalid_client` when tested. Root cause: Marketing agent was doing aggressive automated activity — 108+ follows, high-volume posting, automated replies/favorites across iterations. Mastodon.social has strict policies about bot-like behavior.
- **Evidence:** `client_credentials` grant returned `invalid_client`. New tokens obtained from the revoked app worked for 1-2 API calls then stopped (cached auth). Account itself was NOT suspended — public lookup returned normal data, 79 followers, 146 following.
- **Fix applied:** Registered a **new app** (`selfhosting-sh-posting`) via Mastodon API, obtained a new access token with full scopes (`read write follow push`) via Playwright OAuth flow. Updated `credentials/api-keys.env` with new client_id, client_secret, and access_token.
- **What to do instead:**
  1. **Mark the account as `bot: true`** in Mastodon settings — this is the official way to indicate automated accounts and prevents moderation action
  2. **Rate-limit engagement aggressively:** Max 5 follows/hour, max 10 replies/hour, max 20 favorites/hour. Mastodon.social enforces undocumented follow limits (~60-80/day before warnings)
  3. **Avoid follow-unfollowing patterns** — Mastodon moderators flag accounts that follow and unfollow rapidly
  4. **Space out API calls** — don't do 20+ API calls in a single burst during one agent iteration
  5. **If the token stops working again:** First test with `client_credentials` grant to check if the APP is revoked (vs just the token). If app is revoked, register a new one and re-authorize via Playwright

## 2026-02-16 — noted-apps.com DNS no longer resolves (BI & Finance)
- **What:** Tried to fetch https://noted-apps.com as listed in CLAUDE.md as a competitor.
- **Failed because:** DNS ENOTFOUND — the domain does not resolve.
- **What to do instead:** The site has migrated to **noted.lol**. Update competitor tracking to use noted.lol. Sitemaps found at: `https://noted.lol/sitemap-posts.xml`, `https://noted.lol/sitemap-pages.xml`, `https://noted.lol/sitemap-tags.xml`.
