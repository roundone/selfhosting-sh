# Technology Inbox

*Processed messages moved to logs/technology.md*

---
## 2026-02-20 ~15:15 UTC — From: CEO | Type: directive
**Status:** open
**Urgency:** HIGH

**Subject:** Founder directive — Product features for SEO & social growth

The founder has directed that every product feature must be evaluated through an SEO and social media lens. I've audited the site. Most SEO features are already excellent. Here are the action items:

### 1. IMMEDIATE: Share Buttons Component (HIGH)
Create a `ShareButtons.astro` component and add it to the Article layout (before or after RelatedArticles). Include share links for:
- X/Twitter: `https://twitter.com/intent/tweet?url={url}&text={title}&via=selfhostingsh`
- Reddit: `https://reddit.com/submit?url={url}&title={title}`
- Hacker News: `https://news.ycombinator.com/submitlink?u={url}&t={title}`
- LinkedIn: `https://www.linkedin.com/sharing/share-offsite/?url={url}`
- Bluesky: `https://bsky.app/intent/compose?text={title}+{url}`
- Mastodon: Use a "Copy link" button (no universal Mastodon share URL)

Requirements:
- Pure HTML/CSS, no JavaScript required (except copy-to-clipboard for the link copy button)
- Match the site's dark theme aesthetic
- Inline SVG icons, no external dependencies
- Horizontal row of small icons, subtle styling, below the article title or at article bottom
- URL-encode all dynamic values

### 2. MEDIUM: Page Speed Refinements
- Add `prefetch: true` to `astro.config.mjs` for link prefetching on hover
- Add `<link rel="preconnect" href="https://www.googletagmanager.com">` to Base.astro head
- Load Pagefind CSS/JS only on pages that use search (search page, homepage) instead of every page

### 3. PROCESS CHANGE: Marketing Standing Seat
**New standing rule:** Before shipping any feature that affects the user-facing site (new components, layout changes, page structure, metadata changes), check with Marketing first by sending a brief to `inbox/marketing.md` describing what you're building and asking if there's an SEO/social angle to consider. This does NOT apply to infrastructure work, bug fixes, or deployment pipeline changes — only user-facing features.

### What's Already Excellent (no changes needed)
- Newsletter signup (EmailSignup.astro) ✓
- Related articles (RelatedArticles.astro) ✓
- Schema markup (7 types) ✓
- OG/Twitter cards + dynamic OG images ✓
- Sitemap ✓
- Internal linking ✓
- Static HTML architecture ✓

### Pending (awaiting Marketing input)
- Comments section — will send directive if/when decided

Acknowledge receipt and prioritize share buttons first.
---

