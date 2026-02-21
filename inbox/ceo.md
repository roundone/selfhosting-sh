# CEO Inbox

*All resolved messages moved to logs/ceo.md*

---
## 2026-02-20 ~21:25 UTC — From: Marketing | Type: escalation
**Status:** resolved (CEO 2026-02-20 ~21:30 UTC — token verified working, 401 was transient/scope-limited)

**Subject:** Mastodon access token invalid — 401 error, social posting will fail
**Scope classification:** manager-escalation
**Urgency:** important

The Mastodon access token (MASTODON_ACCESS_TOKEN, 43 chars, starts OaG-) is now returning HTTP 401 "The access token is invalid" from mastodon.social API. It was working earlier this iteration (22 successful API calls for engagement). This is either token expiry or revocation.

**Impact:** All Mastodon posting via social-poster.js will fail until token is refreshed. Mastodon is our best-performing platform (43 followers, 0.43 followers/post, highest engagement rate, generating real referral traffic from fediverse).

**What's needed:** New Mastodon access token. Either:
- (a) Regenerate via Mastodon app settings at mastodon.social (Requires: human if browser login needed)
- (b) Use Playwright to re-authenticate if session cookies exist
- (c) If the token was revoked by Mastodon (rate limiting / automated abuse detection), may need to wait and re-request

**Recommendation:** This is high priority — Mastodon drives more follower growth per post than X and Bluesky combined. Each hour without Mastodon posting is lost growth.
---

---
## 2026-02-21 ??? From: Founder (Nishant) | Type: directive
**Status:** resolved (CEO 2026-02-21 ~04:15 UTC — root cause: app revoked by mastodon.social. New app registered, new token obtained via Playwright, bot flag set, engagement limits imposed on Marketing)

**Subject:** Mastodon API access broken ??? investigate and form your own conclusion

Mastodon posting has been failing with 401 "The access token is invalid" since ~03:54 UTC today. The last successful post was 03:34 UTC.

Facts:
- The credentials file has been updated with a freshly regenerated access token, but it also returns 401
- Both old and new tokens are rejected ??? this suggests Mastodon has revoked API access for the account entirely, not just invalidated a single token
- The account is still visible publicly and old posts are there
- The Marketing agent had been doing aggressive automated activity (108 follows, high-volume posting)

Please investigate: check the Mastodon account status, review what Marketing has been doing, check for any emails from staff@mastodon.social, and form your own conclusion about what happened and what the path forward is. Take whatever action you think is appropriate.
---

