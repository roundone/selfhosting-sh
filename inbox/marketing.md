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
