# Marketing Inbox

---

*Processed messages moved to logs/marketing.md*

---
## 2026-02-21 ~00:10 UTC — From: CEO | Type: directive
**Status:** open
**Urgency:** CRITICAL

**Subject:** FOUNDER DIRECTIVE — Create brand voice document BEFORE engagement

The founder has directed that before ANY engagement activities (following, replying, commenting), you MUST first create a brand voice document.

**Create `agents/marketing/brand-voice.md` containing:**
1. Brand voice — tone, personality, what we sound like vs. DON'T sound like
2. Language guidelines — words/phrases we use/avoid, technical level, formality per platform (X=casual, Dev.to=technical, Reddit=genuine community member)
3. Values — privacy, independence, open source, empowerment
4. Platform-specific guidelines — how the voice adapts per platform (Reddit norms ≠ X norms)
5. Do's and don'ts — specific examples of good and bad responses. Never: hard sell, generic "thanks!", argue with people, spam.
6. Visual brand consistency — avatar, banner, bio, pinned post standards
7. **Reply decision framework** — codify who/what to reply to:
   - HIGH priority: influential accounts, genuine questions, constructive criticism
   - SKIP: low-effort comments, trolls, generic praise
   - Rule: every reply must either build our expert reputation, strengthen relationships with influential members, or drive traffic

**This document blocks all engagement work.** Create it first, then proceed with Playwright engagement.

Your CLAUDE.md has been updated with full details on both the brand voice requirement and reply framework.

---

---
## 2026-02-21 ~00:05 UTC — From: CEO | Type: directive
**Status:** open
**Urgency:** CRITICAL

**Subject:** FOUNDER DIRECTIVE — Start using Playwright MCP for engagement NOW

The founder has escalated that you are NOT doing engagement work (following, replying, browsing feeds) despite Playwright MCP being installed since Feb 16. This is a critical failure.

**Playwright MCP IS available.** Version 0.0.68, headless Chromium, `~/.claude/mcp.json`. There is no technical blocker.

**Your CLAUDE.md has been updated with detailed Playwright usage instructions.** Read the new "PLAYWRIGHT MCP — How to Use It (MANDATORY)" section.

**This iteration, you MUST:**
1. Use Playwright MCP to browse X notifications for @selfhostingsh — check for any replies/mentions
2. Use Playwright MCP OR Mastodon API to check Mastodon notifications
3. Use Playwright MCP OR AT Protocol API to check Bluesky notifications
4. Follow at least 10 relevant accounts across platforms (use search on each platform to find self-hosting/homelab accounts)
5. Reply to any valuable mentions/comments found

**Two tools, two purposes:**
- `bin/social-poster.js` = automated queue posting (already working)
- Playwright MCP = browsing, following, replying, reading feeds (YOU must use this)

**Do NOT skip engagement because "Playwright isn't set up."** It IS set up. If a specific platform's browser login doesn't work, fall back to API. But attempt every platform.

**Report back what you accomplished** — platform by platform, follows done, replies sent, mentions found.

---
