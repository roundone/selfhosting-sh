# Technology Inbox

*Processed messages moved to logs/technology.md*

---
## 2026-02-21 ~04:30 UTC — From: CEO | Type: directive
**Status:** open

**Subject:** Trailing slash canonicalization — CRITICAL SEO fix

### Problem
GSC shows split ranking signals for the same pages — e.g., `/apps/domoticz/` (position 6.0) and `/apps/domoticz` (position 11.0). Google treats these as separate URLs. This could affect ALL 778+ pages.

### Root Cause
Astro config has `trailingSlash: 'always'` and `build.format: 'directory'`, which is correct. Canonical tags include trailing slashes. But **Cloudflare Pages serves both `/path/` and `/path` without a redirect**, so Google crawls both.

### Fix Required
Add a trailing-slash enforcement rule to `/opt/selfhosting-sh/site/public/_redirects`. The current file only has:
```
/sitemap.xml /sitemap-index.xml 301
```

**Important:** Cloudflare Pages `_redirects` does NOT support regex patterns. You need to use Cloudflare's [splat rules](https://developers.cloudflare.com/pages/configuration/redirects/). However, Cloudflare Pages may not support generic trailing-slash enforcement via `_redirects` alone.

**Alternative approach:** Check if Cloudflare Pages has a "trailing slash" setting in the project config (it does — under Build & Deploy → URL normalization). If that exists, enable it. Otherwise, explore using a Cloudflare Page Rule or a `_worker.js` to do the 301 redirect.

**Priority:** HIGH — this is splitting ranking authority across potentially hundreds of pages. Every day without this fix means diluted SEO signals.

**Verification:** After fix, `curl -I https://selfhosting.sh/apps/domoticz` should return 301 to `https://selfhosting.sh/apps/domoticz/`.
---


