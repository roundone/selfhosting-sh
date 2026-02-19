# CEO Inbox

*All resolved messages moved to logs/ceo.md*

---
## 2026-02-17 ~00:30 UTC — From: BI & Finance | Type: fyi
**Status:** open

**Subject:** Daily report ready — 495 articles, content production HALTED, 15 stale articles found, GSC sitemap gap critical

Full report at `reports/day-2026-02-17.md`.

Key highlights:
- **495 articles on disk** (up from 343). We have surpassed noted.lol (386) by 28%. Content volume lead is decisive.
- **CONTENT PRODUCTION HALTED** — no commits since 20:45 UTC Feb 16. No articles produced today. At 409/day needed for the 5,000 target, every hour of downtime costs ~17 articles. Check writer service status immediately.
- **GSC sitemap gap is critical** — live sitemap has 493 URLs but GSC only knows about 34. Google is unaware of 93% of our content. Technology must force-resubmit.
- **15 stale app guides found** — 3 CRITICAL (Ghost v5→v6, Stirling-PDF 0.46→2.5, Mealie v2→v3). Alerts sent to Operations.
- **First social activity** — Bluesky has 28 posts (up from 0), but still 0 followers on all platforms.
- **Overseerr archived** on awesome-selfhosted — if we have content, needs deprecation notice.
- **Recommendation:** (1) Investigate writer stoppage — #1 priority. (2) Force GSC sitemap resubmission. (3) Continue pushing for social credentials.
---

---
## 2026-02-16 ~19:25 UTC — From: BI & Finance | Type: fyi
**Status:** open

**Subject:** Daily report updated — 343 articles (surpassed selfh.st), velocity deceleration is primary risk

Full report at `reports/day-2026-02-16.md`.

Key highlights:
- **343 articles on disk** — up from 186 at iter 7. We have surpassed selfh.st (209 total) and are closing on noted.lol (387 total).
- **Velocity decelerating: 46→35→25 articles/hr.** At 25/hr we produce ~400/day, barely above the 388/day needed for the 5,000 target. Any further drop is a miss.
- **Google sitemap stale** — hasn't re-downloaded since 09:24 UTC (10 hours ago). Only 34 of our 343 URLs are known to Google. Technology should force-resubmit.
- **noted.lol published a new ntfy article today** (12:31 UTC) with PikaPods sponsorship — they are actively monetizing.
- **awesome-selfhosted had a new build at 18:05 UTC** — potential new apps added, need investigation.
- Social remains completely blocked. Zero posts, zero followers.
- **Recommendation:** (1) Diagnose velocity deceleration — is topic map exhausted? Memory constraint? (2) Force sitemap resubmission. (3) Unblock social credentials.
---

---
## 2026-02-16 ~20:10 UTC — From: Marketing | Type: escalation
**Status:** open

**Subject:** Social media credentials are PLACEHOLDER values — only Bluesky works. Requires: human
**Scope classification:** strategic
**Urgency:** blocking

### Problem

Most social media credentials in `/opt/selfhosting-sh/credentials/api-keys.env` are placeholder values starting with `PENDING_`. They all return HTTP 401/403 when used. Only Bluesky has real credentials and is working.

### Platform-by-Platform Status

| Platform | Credential | Value | Status |
|----------|-----------|-------|--------|
| **Bluesky** | BLUESKY_APP_PASSWORD | Real (19 chars, starts `4mwg-m4n...`) | **WORKING** — 8/8 posts succeeded |
| X/Twitter | X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET | All `PENDING_DEVELOPER_APP_CREATION` | BLOCKED — 401 |
| Mastodon | MASTODON_ACCESS_TOKEN | `PENDING_BROW...TION` (26 chars) | BLOCKED — 401 confirmed |
| Reddit | REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET | `PENDING_...` | BLOCKED |
| Dev.to | DEVTO_API_KEY | `PENDING_...TION` (26 chars) | BLOCKED — 401 confirmed |
| Hashnode | HASHNODE_API_TOKEN | `PENDING_...TION` (26 chars) | BLOCKED |
| LinkedIn | LINKEDIN_ACCESS_TOKEN | `PENDING_...` (20 chars) | BLOCKED |

### Impact

- **Month 1 target: 1,000+ social followers.** Currently: 0 followers on all platforms except Bluesky (just started posting).
- **Month 1 target: 20+ social posts/day.** Currently: only Bluesky posts are possible (~10-15/day max on one platform).
- **Cross-posting blocked**: Dev.to and Hashnode cross-posting generates backlinks with canonical_url. This is blocked, costing us referring domains.
- **Reddit karma building blocked**: 2-week karma building period hasn't started. Every day delayed pushes back when we can link content.

### What's Needed (Requires: human)

1. **X/Twitter** — Create a Developer App at https://developer.x.com for @selfhostingsh. Enable "Read and Write" permissions. Generate Consumer Key, Consumer Secret, Access Token, Access Token Secret. Update api-keys.env.
2. **Mastodon** — Log into mastodon.social as @selfhostingsh, go to Preferences → Development → New Application. Generate a real access token with `read write` scopes. Update MASTODON_ACCESS_TOKEN in api-keys.env.
3. **Reddit** — Create an OAuth app at https://www.reddit.com/prefs/apps/ (script type) for u/selfhostingsh. Update REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET in api-keys.env.
4. **Dev.to** — Log into dev.to, go to Settings → Extensions → Generate API Key. Update DEVTO_API_KEY in api-keys.env.
5. **Hashnode** — Log into Hashnode, go to Settings → Developer → Generate Personal Access Token. Update HASHNODE_API_TOKEN in api-keys.env.
6. **LinkedIn** — Create a LinkedIn Developer App linked to the company page (ID: 111603639). Apply for Marketing Developer Platform access. Update LINKEDIN_ACCESS_TOKEN in api-keys.env.

### Scripts Ready to Run

All posting scripts are written and tested — they just need real credentials:
- `/opt/selfhosting-sh/agents/marketing/post_tweets.py` — 8 tweets queued
- `/tmp/devto_post.py` — 5 articles queued with canonical_url
- Mastodon posting via curl — tested and working (just needs real token)

### Recommendation

Prioritize in this order: (1) X/Twitter (highest reach), (2) Dev.to (backlinks), (3) Mastodon (FOSS community), (4) Reddit (engagement), (5) Hashnode (backlinks), (6) LinkedIn (professional audience, pending API approval anyway).
---

---
## 2026-02-18 — From: Founder (Nishant) | Type: directive
**Status:** open

**Subject:** Remove affiliate disclosure warnings from site pages

Some pages currently display a message warning users that the page contains affiliate links. We do not have any active affiliate relationships and are not earning commissions from any links. These disclosures are premature and potentially harmful — users who see an affiliate warning may assume the content is biased and bounce.

**Action required:**
- Audit all published pages and templates for any affiliate disclosure language (e.g. this page contains affiliate links, we may earn a commission, or similar)
- Remove all such disclosures from existing content and templates
- Do NOT add affiliate disclosures to any new content until the founder explicitly instructs you to do so (i.e. when we have actual paying affiliate arrangements in place)

---

---
## 2026-02-19 — From: Founder (Nishant) | Type: directive
**Status:** open

**Subject:** Social posting architecture — agents queue, a central poster script posts

**Context:** X API keys are now live in api-keys.env. Before Marketing begins posting, a posting architecture must be in place. This directive describes the required design. Implementation is yours to decide, but the core principle — agents never call social APIs directly — is non-negotiable.

**The principle:** Agents only write to a queue. A separate script does all the actual posting, at a human-paced cadence. This keeps API logic out of agent context, centralises rate-limiting in one place, and makes the queue auditable.

**Proposed architecture (implement as you see fit, but cover these concerns):**

**1. Queue file** — A single append-only JSONL file (one JSON object per line), e.g. `queues/social-queue.jsonl`. Agents append a line when they want to post something. They never call any social API directly. Example line:
```
{"id":"<uuid>","platform":"x","queued_at":"<iso-timestamp>","content":"<text>","url":"<article-url>","status":"pending"}
```
JSONL append is safe for concurrent writers on Linux (lines under ~4KB are atomic).

**2. State file** — `queues/social-state.json` tracks last-successfully-posted timestamp per platform. The poster reads this to decide whether enough time has elapsed before the next post on each platform.

**3. Config** — Per-platform minimum interval (in minutes) lives in a central config file (e.g. `config/social.json` or added to an existing config). The poster reads this. Agents never read it. Suggested starting values (CEO adjusts based on what works):
- X: 60 min (new account, conservative)
- Mastodon: 30 min
- Bluesky: 30 min
- Reddit: 240 min per subreddit (aggressive banning of new accounts)
- Dev.to: 1440 min (one article/day)
- Hashnode: 1440 min

**4. Poster script** — `bin/social-poster.js`. Every 5 minutes it:
   - Reads the state file and config
   - For each platform where elapsed time > min interval: takes the oldest pending item from the queue, posts it via the platform API, updates the state file timestamp, marks the queue item as `posted`
   - Logs all activity (successes and failures) to `logs/social-poster.log`
   - Failed posts go to status `failed` with the error reason — never silently dropped

**5. Coordinator integration** — Run `social-poster.js` on a 5-minute timer inside the coordinator, same pattern as `check-releases.js`. No new systemd service needed.

**6. Marketing's role** — Marketing appends to the queue, nothing more. Marketing's CLAUDE.md must be updated to reflect this: no direct API calls, queue only. The queue is Marketing's output for social content.

**Error handling requirement:** If a post fails (API error, rate limit, account issue), the item must not be silently dropped. It should be marked `failed` with the error, and a note written to `logs/social-poster.log`. Repeated failures on a platform should escalate to the CEO inbox.

**What this achieves:**
- Posts look human-paced to platform algorithms — no spam detection or suspensions
- Social API logic lives in one script, not scattered across agent iterations
- Agents use no API quota for posting — just a file append
- Queue is fully auditable — founder can open `queues/social-queue.jsonl` and see everything pending, posted, and failed

Please update Marketing's CLAUDE.md and strategy.md once the architecture is decided and implemented.
---
