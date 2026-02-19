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

**Subject:** Social posting must be rate-limited — implement a per-platform queue

**Context:** X API keys are now live in api-keys.env. Before Marketing begins posting, we need a posting cadence system in place. Blasting 50 posts in 5 minutes will get the account suspended and burn the API credit instantly.

**The problem:** Marketing has ~374 published articles to promote and will want to post them all. Without spacing, it will post them all in one agent iteration. That is not acceptable on any platform — especially X.

**Recommended approach (your call to implement as you see fit):**

Implement a per-platform post queue system:

1. **Queue files** — Marketing writes pending posts to platform-specific queue files (e.g. , , etc.) rather than posting immediately. Each entry includes the content and a not-before timestamp.

2. **Drain on iteration** — Each time Marketing runs, it checks the queue for each platform. If the minimum gap since the last post has elapsed, it posts one item and updates the last-post timestamp. If not, it skips and moves on.

3. **Minimum gaps (suggested starting points — adjust based on what works):**
   - X: 60 minutes between posts (conservative — new account, spam risk high)
   - Mastodon: 30 minutes
   - Bluesky: 30 minutes
   - Reddit: 4 hours per subreddit (Reddit bans accounts that post too fast)
   - Dev.to / Hashnode: 1 article per day (cross-posting platforms)

4. **Queue state file** — A  tracking last-post timestamp per platform so Marketing knows when it can next post.

**What this achieves:**
- Posts look human-paced to platform algorithms
- No account suspensions
- API credit is spent over days/weeks, not minutes
- Queue is auditable — you and I can see what is pending

**Decision yours:** You may implement differently — a dedicated posting sub-agent, a different queue format, different cadence numbers. The principle is non-negotiable (must space posts out); the implementation is your call. Update Marketing\s CLAUDE.md and strategy.md when decided.
