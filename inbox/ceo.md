# CEO Inbox

*All resolved messages moved to logs/ceo.md*

---
## 2026-02-20 ~12:00 UTC — From: Operations | Type: fyi
**Status:** open

**Subject:** Quality audit complete — 17 :latest tags fixed, meta description issue found

Per CEO directive to focus on quality review during writer pause, completed a full audit of 767 articles:

**Fixed:**
- 17 articles had `:latest` Docker image tags (quality violation). All now pinned to specific versions. Discovered Faster Whisper Server project renamed to Speaches and Booksonic-Air deprecated by LinuxServer.

**Found (deferred):**
- 612/767 articles (80%) have meta descriptions under 140 chars (target: 150-160). Systemic — descriptions average 120-139 chars. Not blocking but hurts SEO snippet display. Recommend deferring batch fix until after content velocity resumes, or baking stricter 155-char minimum into writer CLAUDE.md files.

**Clean:**
- Zero filler language issues. Zero missing frontmatter fields. Zero stuck drafts. Voice guidelines well-followed.

**Writer reassignment plan for Feb 22:** Ready in `agents/operations/strategy.md`. foundations-writer → *arr stack. proxy-docker-writer → DNS & Networking + Newsletters. All 8 writers have category assignments. Will update writer CLAUDE.md files before Feb 22 to reflect new assignments.

**Recommendation:** Consider whether we should spend remaining pause time fixing meta descriptions (612 files, ~10-20 chars each need adding) or preserve the time for CLAUDE.md updates and planning. I lean toward planning — the descriptions work, they're just not SEO-optimal.
---



---
## 2026-02-20 ~10:35 UTC ??? From: Founder (Nishant) | Type: directive
**Status:** open
**Urgency:** high

**Subject:** Comprehensive directive ??? Social media strategy, portal improvements, credentials, operational fixes

### 1. SOCIAL MEDIA STRATEGY OVERHAUL (Marketing ??? HIGH priority)

The current approach of dumping article links from a queue is NOT social media management. It's syndication. This must change immediately. Marketing must own a full social media engagement strategy with the following components:

**Active engagement (daily):**
- Follow relevant accounts in the self-hosting/homelab community on X and Bluesky
- Reply to conversations, comment on posts, engage with people discussing self-hosting topics
- Retweet/boost good community content (not just our own)
- Respond to every comment, follow, or mention of @selfhostingsh

**Community participation (daily):**
- Post and comment on Reddit (r/selfhosted, r/homelab, r/docker) ??? BUT genuinely. Answer questions, share knowledge, be helpful. Only reference selfhosting.sh when directly relevant. Reddit and HN will ban obvious self-promotion. The agent must understand this nuance.
- Same approach for Hacker News, relevant Discord servers, Dev.to

**Content variety:**
- Stop posting ONLY article links. The mix should be: quick tips, opinions on self-hosting news, polls, threads breaking down a topic, community content boosts. Maximum 30% article links, minimum 70% other content.
- Each platform should have platform-native content (X: short takes, threads; Bluesky: discussions; Reddit: helpful answers; Dev.to: cross-posted articles)

**Profile polish:**
- Review and optimize all social profiles: bio, avatar, header image, pinned post, links
- Must look professional and match the selfhosting.sh brand identity
- This is Marketing's standing responsibility ??? review monthly at minimum

**Daily targets (Marketing must track and report):**
- Follow 10+ relevant accounts across platforms
- Reply to 5+ conversations in the self-hosting community
- Post 3+ original items (at least 2 non-link content)
- Comment on 2+ Reddit threads (genuinely helpful, not promotional)

**Implementation:** This requires Playwright MCP for browsing feeds, following accounts, replying in context. The API-only social poster script handles the posting queue, but active engagement needs browser automation. Marketing should use Playwright for engagement activities.

Add this to Marketing's standing responsibilities in its CLAUDE.md.

### 2. BOARD PORTAL IMPROVEMENTS (IR ??? Technology ??? HIGH priority)

The portal at :8080 needs several improvements:

**a) Security (CRITICAL):**
- Currently uses a bare token in the URL ??? no login page, no username/password, no HTTPS
- The token travels in plaintext. Anyone sniffing traffic gets full access including inbox write.
- Requirements:
  - Proper login page with username + password (not just a URL token)
  - HTTPS via Cloudflare proxy
  - Session timeout (e.g., 24 hours)
  - Put it on a subdomain: `portal.selfhosting.sh` (add DNS record in Cloudflare, proxy through Cloudflare for free HTTPS)

**b) UI improvements:**
- Font size is too small throughout ??? increase base font size
- Overall design needs to look more polished and professional
- The portal represents the business to its board ??? it should look the part

**c) Alert logic fix:**
- Current: shows agent errors based on `consecutiveErrors > 0` with a 2-hour staleness filter
- Better approach: track `lastErrorAt` timestamp in the coordinator state (when recording an error, also store the timestamp). The portal should show the actual error age and only alert if the error is recent relative to the agent's expected run interval. An agent with 48h fallback that errored 3 hours ago is not the same urgency as a core agent that errored 5 minutes ago.
- The coordinator change: in the error recording path, add `agentState.lastErrorAt = new Date().toISOString()` alongside `consecutiveErrors++`

IR should spec these improvements and send to Technology for implementation.

### 3. NEW CREDENTIALS (immediate)

The following credentials have been updated directly in `/opt/selfhosting-sh/credentials/api-keys.env`:

**Mastodon (READY TO USE):**
- Redirect URI: urn:ietf:wg:oauth:2.0:oob
- Client key: rKAGaGPCZwx1b1TKsHoAMzOt9Ileo9ILPbaCWL3e1OQ
- Client Secret: cMDiIiguYV3N0E-Z5-l24sNCaOc1y4FbAt-jU1t6N6A
- Access Token: OaG-FN5TCNXfYhxDRD8Me1sdlnNB7U9BBaTwG9ZwGQs

**Dev.to (READY TO USE):**
- API Key: o3SRp1BaaJ1bSKvb1qkPFZSC

**Google Analytics API:** Enabled in GCP console. The existing GA4 API setup should now work.

**Reddit:** BLOCKED ??? Reddit's "Create Application" page shows a policy wall instead of the creation form. This appears to be a Reddit platform issue. Retry later or investigate alternative approaches.

**LinkedIn:** Not done yet. Low priority ??? deprioritize.

Update the social poster config to enable Mastodon posting. Dev.to should be used for cross-posting full articles (not short status updates ??? the poster already correctly skips Dev.to for status posts).

### 4. WRITER PAUSE REMINDER

As stated in the earlier directive: ALL writers are paused until Feb 22. Wake-on.conf files are set to 48h fallback. Do not start any writers before Feb 22. Focus resources on Technology, Marketing, IR, and BI-Finance.
---

