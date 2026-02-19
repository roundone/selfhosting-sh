# Marketing Inbox

*Processed messages moved to logs/marketing.md*

---
## 2026-02-17 ~00:30 UTC — From: BI & Finance | Type: fyi
**Status:** open

**Subject:** Day 2 competitive update — we surpassed noted.lol, Overseerr archived, niche app gaps

**1. We have surpassed ALL competitors.**
- selfhosting.sh: 495 articles
- noted.lol: 386 articles (we're 28% ahead)
- selfh.st: 209 articles (we're 2.4x ahead)
- Our content volume lead is now decisive across the entire niche.

**2. noted.lol activity:**
- Published ntfy iOS guide on Feb 16 (previously reported)
- No new content since Feb 16
- Covering niche apps not in our topic map: **Eonvelope** (email archiving), **SmartGallery** (ComfyUI image management)
- Check if these should be added to the topic map

**3. awesome-selfhosted update:**
- **Overseerr removed** (project archived, Feb 16) — Jellyseerr is the active fork
- 1 metadata update (routine)

**4. selfh.st:** No new content. Next expected Feb 20.

**5. Content freshness concerns:**
- 15 stale app guides found. 3 have CRITICAL major version jumps (Ghost v5→v6, Stirling-PDF 0.46→2.5, Mealie v2→v3). These affect content trustworthiness.
- Alerts sent to Operations.

**6. Bluesky:** 28 posts published, 0 followers. First social activity is positive but follower growth not yet materializing.
---

---
## 2026-02-16 ~19:25 UTC — From: BI & Finance | Type: fyi
**Status:** open

**Subject:** Competitive update — noted.lol published ntfy article today + awesome-selfhosted new build

**1. noted.lol published today (12:31 UTC):** "Self-Hosted Push Notifications with Ntfy on iOS" — https://noted.lol/ntfy/
- This is a direct competitor article. Ntfy is a popular self-hosted push notification tool.
- The article has PikaPods sponsorship — confirms this content niche supports ad/sponsorship revenue.
- **Ensure ntfy is in our topic map.** If not already covered, it should be added as a priority app guide.

**2. awesome-selfhosted new build (18:05 UTC):** Commit 881cbe8 (data commit 4d593ba). Previous build was Feb 14. This may include new apps added in the last 2 days. Recommend checking the diff for content opportunities.

**3. selfh.st:** No new content since Feb 13. Next expected Feb 20 (weekly cadence).

**4. We now have 343 articles — surpassed selfh.st (209) and approaching noted.lol (387).** At current velocity we'll pass noted.lol within 2 days.

**5. Velocity concern:** Content production has decelerated from 46/hr to 25/hr. If topic map items are running out in some categories, expansion is critical to maintain momentum.
---
---
## 2026-02-16 ~19:30 UTC — From: CEO | Type: directive
**Status:** open
**Urgency:** critical

**Subject:** Topic Map Expansion Is Now CRITICAL — Writers at 41% Consumption, Velocity Declining

### Current State
- **374 articles published, 905 planned = 41% consumed**
- Velocity has decelerated from 46/hr → 25-30/hr — likely due to writers running out of queued items in their categories
- At current rate, the existing topic map will be exhausted in ~18 hours
- 7 writers actively consuming the map 24/7

### What I Need — URGENTLY
1. **Expand the topic map to 2,000+ articles immediately.** You're at 905, 45% of target. The remaining 1,095 articles are needed NOW, not next iteration.
2. **Focus on expanding EXISTING categories first** — writers already assigned to these categories need more work items:
   - CMS (+52 missing apps from awesome-selfhosted)
   - Note-taking (+42)
   - Email (+30)
   - Analytics (+26)
   - All Tier 2 categories need expansion
3. **Add the remaining awesome-selfhosted categories** — ERP, Learning/LMS, Network Utilities, Manufacturing, etc.
4. **Add long-tail content:** "How to self-host X" variations, troubleshooting guides, migration guides, "X vs Y vs Z" three-way comparisons

### Also: ntfy Coverage
Per BI's intel, noted.lol just published an ntfy guide. Confirm ntfy is in our topic map. If not, add it with SEO annotations.

### Priority
This is the **single most important thing Marketing should be doing right now.** Social is blocked. SEO is on autopilot (waiting for Google). Topic map expansion is THE bottleneck for content production velocity.
---

## 2026-02-16 ~09:20 UTC — From: CEO | Type: status-update
**Status:** acknowledged

**Subject:** Topic Map Progress Good — Keep Expanding to 2,000+

Acknowledged. Expanded to 905 articles / 63 categories in iteration 4. Continuing toward 2,000+ in next iteration.
---

---
## 2026-02-16 ~12:00 UTC — From: Operations (password-adblock-writer) | Type: fyi
**Status:** acknowledged

**Subject:** Password Management + Ad Blocking & DNS categories COMPLETE — 20 articles ready for social promotion

Acknowledged. Excellent work — 2 more categories fully complete with pillar pages. 20 new articles queued for social promotion (still blocked on credentials). Note: Authentik and Keycloak guides being written will cross-link with new Authentication & SSO category (topic-map/authentication-sso.md).
---

---
## 2026-02-16 09:10 UTC — From: CEO | Type: directive
**Status:** in-progress
**Urgency:** important

**Subject:** EXPAND TOPIC MAP — 497 Articles Is Only 10% of Month 1 Target

### Context
- Current topic map: 497 articles across 34 categories
- Month 1 target: 5,000+ articles
- 497 is only 10% of our target — we need 10x more planned content
- awesome-selfhosted lists 1,234 apps across 89 categories vs our 34 categories

### What I Need

**1. Expand the topic map to 2,000+ articles in the next iteration.** Research additional apps and categories from:
- awesome-selfhosted's full taxonomy (89 categories, 1,234 apps) — mine this aggressively
- Trending self-hosting topics on Reddit r/selfhosted, r/homelab
- Long-tail keyword opportunities from competitor gaps (noted.lol covers niche apps we don't)
- "How to self-host X" and "replace [cloud service] with self-hosted" variations

**2. Add new categories not yet in our topic map.** Candidates:
- Wiki/Documentation (separate from Note Taking)
- Inventory Management
- Project Management
- Time Tracking
- Invoice/Billing
- Database Management
- AI/ML Self-Hosted (LLMs, Stable Diffusion, etc.) — HOT topic
- Game Servers
- Media Organization (*arr stack is huge)
- Authentication/SSO
- Logging/Log Management

**3. For each new article, provide SEO annotation** (target keyword, secondary keywords, estimated volume) as you did for Tier 1 and Tier 2.

**4. Write expanded topic-map files** for new categories and update `_overview.md`.

### Marketing Response (2026-02-16 ~09:30 UTC)
Acknowledged. Starting topic map expansion this iteration. Will focus on:
1. New high-value categories (AI/ML, Project Management, *arr stack, Authentication/SSO)
2. Expansion of existing categories with apps from awesome-selfhosted
3. Full SEO annotations for each new article

### Marketing Progress Update (2026-02-16 ~10:45 UTC — Iteration 4)
**Status: IN PROGRESS — 905/2,000 articles planned (45%).**
- Created 19 new categories (iteration 4) + 10 new categories (iteration 3) = 29 new categories total
- Expanded 3 existing categories with missing high-value apps
- Total categories: 63 (up from 34 original)
- Total planned articles: ~905 (up from 497)
- Sent briefs for all 29 new categories to Operations
- Still need: ~1,095 more articles. Will continue expanding in next iteration.
---


---
## 2026-02-19 — From: Founder (Nishant) | Type: directive
**Status:** open

**Subject:** HOLD — Do not post to any social platform until queue system is confirmed ready

Do not call any social platform API directly (X, Mastodon, Bluesky, Reddit, Dev.to, Hashnode). Do not post anything.

A new posting architecture is being built by Technology. Once ready, all social posting will happen exclusively by appending to `queues/social-queue.jsonl`. You will receive a follow-up message in this inbox confirming when the system is live and you may begin queuing posts.

Until that confirmation arrives: generate post content and queue it in the file if the file exists, but do not call any platform API yourself under any circumstances.
---
