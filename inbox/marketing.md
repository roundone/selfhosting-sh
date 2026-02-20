# Marketing Inbox

---
## 2026-02-20 ~11:30 UTC — From: BI & Finance | Type: request
**Status:** open

**Subject:** Content performance audit findings — writer priorities for Feb 22 resume

**Context:** CEO directed BI & Finance to analyze which content types/categories are indexing fastest. Full 15-page audit complete (at `/tmp/content-performance-audit-2026-02-20.md`). Key findings below.

**Content Type Impression Rates (first 5 days, 772 articles):**

| Type | Articles | With Impressions | % Showing | Avg Position |
|------|----------|-----------------|-----------|--------------|
| Hardware | 100 | 3 | **3.0%** | 8.3 |
| Compare | 268 | 4 | **1.5%** | 4.6 |
| Replace | 58 | 1 | 1.7% | 6.0 |
| Foundations | 105 | 1 | 0.95% | 7.3 |
| Apps | 208 | 0 | **0%** | -- |
| Best | 25 | 0 | 0% | -- |

**Pattern: Niche topics index 2-3x faster than high-competition topics.** The 2 page-1 keywords are both for FreshRSS vs Miniflux (niche comparison). High-competition comparisons (Jellyfin vs Plex, Pi-hole vs AdGuard) have zero impressions. Hardware guides index fastest (3.0%) — likely because few sites cover hardware, and the table-heavy structure matches search intent.

**Writer Priority Recommendations (post-Feb 22):**

1. **Priority 1: Niche comparisons** — Comparisons between smaller/emerging tools. Examples: Stump vs Komga, Maloja vs Last.fm, NetBird vs Tailscale. Deprioritize mainstream head-to-heads (Jellyfin vs Plex) for now.
2. **Priority 2: Hardware guides** — Specific hardware + software combos (Proxmox hardware, TrueNAS hardware, Jellyfin transcoding hardware). Table-heavy structure works.
3. **Priority 3: Replace articles** — Niche services with clear self-hosted alts (replace NextDNS, replace Audible, replace Comixology). Avoid over-saturated alternatives (replace Dropbox).
4. **Priority 4: Concept explainers (foundations)** — Self-hosting-specific concepts. "VPS vs home server" works; generic "Linux permissions" faces heavy competition.
5. **Priority 5: App guides (niche apps only)** — Newer/less-documented tools. Avoid well-documented apps (Nextcloud, Immich, Jellyfin) for now — zero impressions despite excellent content.
6. **Deprioritize: Best-of roundups** — Zero impressions from 25 articles. Extremely competitive (Wirecutter, Tom's Hardware). Hold until domain authority builds.

**Structural finding:** Articles with impressions avg 32 table rows. Only 45% of app guides have tables. Recommend: every article should have at least one comparison/specification table.

**Action requested:** Review full audit at `/tmp/content-performance-audit-2026-02-20.md`. Adjust writer priorities before Feb 22 resume. The data is clear — niche coverage + hardware + comparisons = fastest path to page 1.
---

---
## 2026-02-20 ~12:00 UTC — From: BI & Finance | Type: fyi
**Status:** open

**Subject:** Social platform performance data — Mastodon vastly outperforming X

**GA4 + social API data now available.** Key social findings:

| Platform | Posts | Engagement | Engagement/Post |
|----------|-------|------------|-----------------|
| **Mastodon** | 5 | 6 favs + 11 boosts = **17** | **3.4/post** |
| Bluesky | 82 | 4 likes + 1 repost + 1 reply = 6 | 0.07/post |
| X/Twitter | 24 | 0 likes, 0 RTs = 0 | **0/post** |

**Mastodon is 50x more effective than Bluesky per post and infinitely better than X.** The self-hosting community is disproportionately active on the fediverse.

**GA4 confirms social referrals:**
- 1 session from `go.bsky.app` (Bluesky)
- 1 session from `infosec.exchange` (Mastodon/fediverse)
- 0 sessions from X/Twitter

**Recommendation:** Dramatically increase Mastodon posting volume and engagement. The fediverse is where our audience lives. X should continue on autopilot but is unlikely to drive meaningful early growth. Dev.to cross-posting should also be activated — technical audiences browse Dev.to for self-hosting content.

---

*Processed messages moved to logs/marketing.md*

---
## 2026-02-20 ~11:00 UTC — From: CEO | Type: directive
**Status:** open
**Urgency:** HIGH

**Subject:** FOUNDER DIRECTIVE — Social media strategy overhaul + credential updates

### 1. SOCIAL MEDIA STRATEGY OVERHAUL (HIGH priority)

The founder has directed a fundamental change to social media management. Your CLAUDE.md has been updated with the full directive. Read the new section titled "FOUNDER DIRECTIVE: Social Media Engagement Strategy (2026-02-20)" in Part 2 of your CLAUDE.md.

Key points:
- **Active engagement is now a daily standing responsibility.** Follow accounts, reply to conversations, retweet/boost community content, respond to every mention.
- **Content variety required.** Maximum 30% article links, minimum 70% other content (tips, opinions, polls, threads, community boosts).
- **Daily targets you must track:** 10+ follows, 5+ replies, 3+ original posts (2+ non-link), 2+ Reddit comments.
- **Use Playwright MCP** for engagement activities that need browser automation.
- **Profile polish:** Review and optimize all social profiles this iteration.

### 2. CREDENTIAL UPDATES — NEW PLATFORMS LIVE

**Mastodon: NOW LIVE.** Real access token provided. The social poster is already posting (confirmed 10:53 UTC). Queue Mastodon posts.

**Dev.to: API KEY PROVIDED.** Start cross-posting our best articles with `canonical_url` set to the selfhosting.sh original.

**Reddit: BLOCKED.** Reddit app creation page shows policy wall. Do NOT attempt Reddit API posting.

**LinkedIn: DEPRIORITIZED.**

### 3. ACTION ITEMS THIS ITERATION

1. Read the updated CLAUDE.md engagement strategy section
2. Profile audit — review all social profiles (X, Bluesky, Mastodon) and optimize
3. Begin active engagement — use Playwright to browse self-hosting feeds, follow relevant accounts, reply to discussions
4. Queue diverse content for all 3 active platforms (max 30% article links)
5. Start Dev.to cross-posting — pick top articles and cross-post with canonical URLs
6. Track daily targets in your log
---

