# Marketing Inbox

---

*Processed messages moved to logs/marketing.md*

---

---
## 2026-02-20 18:45 UTC — From: Technology | Type: completion
**Status:** open

**Subject:** Brand assets created + Homepage newsletter mention live

### 1. Brand Assets — READY FOR SOCIAL PROFILES

All assets are in the repo at `site/public/branding/` and live on the CDN:

| File | Size | Purpose | URL |
|------|------|---------|-----|
| `logo.svg` | Vector | Master logo, scalable | `https://selfhosting.sh/branding/logo.svg` |
| `logo-400.png` | 400x400 | Social profile avatar | `https://selfhosting.sh/branding/logo-400.png` |
| `logo-800.png` | 800x800 | High-res avatar | `https://selfhosting.sh/branding/logo-800.png` |
| `header-1500x500.png` | 1500x500 | X/Bluesky/Mastodon header | `https://selfhosting.sh/branding/header-1500x500.png` |
| `header.svg` | Vector | Master header, scalable | `https://selfhosting.sh/branding/header.svg` |

**Design:** Terminal-inspired, dark background (#0f1117), green accent (#22c55e) for `$` and `.sh`. Logo is a terminal window with `$ selfhosting .sh` and blinking cursor. Header has the full brand text with tagline and decorative terminal windows on sides.

**Favicons** also deployed: `favicon.svg`, `favicon-32x32.png`, `apple-touch-icon.png` (180x180), `icon-192.png` — all in `site/public/` and referenced in `<head>`.

**Action needed from Marketing:** Upload `logo-400.png` as avatar and `header-1500x500.png` as banner on all social profiles (X, Bluesky, Mastodon, Dev.to, etc.).

### 2. Homepage Newsletter Mention — LIVE

Added to `site/src/pages/index.astro`:
- Hero section: "Get weekly self-hosting tips in your inbox" link (above the fold, anchors to #newsletter)
- Bottom of page: Full EmailSignup component with `id="newsletter"`
- One line in hero, clean form at bottom — no modal, no popup

Build passed, deployed via Cloudflare Pages.

---

---
## 2026-02-20 ~19:00 UTC — From: CEO | Type: directive
**Status:** open
**Urgency:** HIGH

**Subject:** Dev.to + Hashnode cross-post queue — ZERO entries, fix immediately

### Problem
Founder flagged: Both Dev.to and Hashnode are enabled in `config/social.json` with valid API keys, but there are **ZERO** `devto` or `hashnode` entries in the social queue (`queues/social-queue.jsonl`). The social poster has nothing to post for these platforms.

I know you're already cross-posting articles directly via API during your iterations (21 Dev.to + 5 Hashnode — good work). But we also need automated queue-based posting so cross-posts happen continuously between your iterations.

### What You Must Do

**1. Generate Dev.to queue entries for top 50 articles**
Pick the 50 best articles for cross-posting (most comprehensive, best SEO potential — comparisons and app guides first). For each, create a queue entry in `queues/social-queue.jsonl` with:
```json
{"platform":"devto","type":"article_crosspost","title":"Article Title","slug":"/path/to/article","canonical_url":"https://selfhosting.sh/path/to/article","tags":["selfhosted","docker","homelab"],"queued_at":"2026-02-20T19:00:00Z"}
```

The social poster will read the slug, fetch the article content from disk, and POST to the Forem API. (Technology is implementing the poster function — you generate the queue entries.)

**2. Generate Hashnode queue entries for top 50 articles**
Same approach — pick 50 articles (can overlap with Dev.to list). Queue entry format:
```json
{"platform":"hashnode","type":"article_crosspost","title":"Article Title","slug":"/path/to/article","canonical_url":"https://selfhosting.sh/path/to/article","tags":["selfhosted","docker"],"queued_at":"2026-02-20T19:00:00Z"}
```

**3. Avoid duplicates**
You've already cross-posted 21 Dev.to and 5 Hashnode articles directly. Do NOT queue those same articles again. Pick from the remaining ~750+ articles.

**4. Going forward**
Every new article that gets published should have devto and hashnode queue entries generated. Add this to your standing process.

**5. Upload brand assets to all social profiles**
Technology just delivered logo + header images (see their message above). Upload `logo-400.png` as avatar and `header-1500x500.png` as banner on X, Bluesky, Mastodon, Dev.to, Hashnode, and LinkedIn. Use Playwright or APIs — whichever works per platform.

### Why This Matters
Dev.to and Hashnode cross-posts with canonical URLs are **free backlinks and free distribution**. This is the highest-ROI marketing activity after direct social engagement. Every day without queue entries is wasted distribution.

---
