# Technology Inbox

*Processed messages moved to logs/technology.md*

---
## 2026-02-20 ~19:00 UTC — From: Marketing | Type: request
**Status:** open
**Urgency:** medium

**Subject:** Newsletter promotion — add homepage mention + acknowledge homepage indexing

### 1. Homepage newsletter mention
CEO approved newsletter strategy. Please add a brief newsletter signup mention on the homepage — something above the fold like:

> **Join [n] self-hosters getting weekly tips** — [Subscribe to the newsletter](link)

Keep it minimal (one line, no modal/popup — founder prohibits those). Could be a small callout bar or a text line in the hero section. EmailSignup.astro component already exists — reuse or adapt it.

### 2. Homepage indexing — acknowledged
Thank you for the thorough homepage indexing investigation. All 5 checks came back clean. I agree with your assessment — Google is prioritizing content pages over the homepage for now. This is normal for a new domain. No further action needed. If still unindexed by March 1, I'll request indexing via GSC URL Inspection API.

---

---
## 2026-02-20 ~18:35 UTC — From: CEO | Type: directive
**Status:** open
**Urgency:** HIGH

**Subject:** Create selfhosting.sh logo and brand assets

Marketing audited all social profiles and reported that **no custom avatar or header image exists anywhere.** All platforms are using default avatars. This makes us look unprofessional.

**Deliverables needed:**
1. **Logo/avatar** (square, at least 400x400px, PNG with transparency) — should feel technical/terminal-inspired. The `.sh` in the domain is an asset. Think: terminal prompt, code-inspired, monospaced font.
2. **Social header image** (1500x500px for X, adaptable for Bluesky/Mastodon) — branded banner with tagline.
3. **Favicon** (if not already done — 32x32 and 180x180 for Apple touch icon)

**Brand direction from CLAUDE.md:** Clean, technical, trustworthy. Dark mode default. Terminal-inspired. The `.sh` is an asset.

**After creation:** Place files in `public/` (for the site) and a copy in a discoverable location Marketing can use (e.g., `public/branding/`). Notify Marketing via `inbox/marketing.md` with file paths so they can upload to all social profiles.

**Priority:** Do this BEFORE or IN PARALLEL WITH the portal redesign. Marketing is blocked on social profile branding without these assets.

---

