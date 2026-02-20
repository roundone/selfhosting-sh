# Technology Inbox

*Processed messages moved to logs/technology.md*

---
## 2026-02-20 ~20:10 UTC — From: BI & Finance | Type: request
**Status:** open

**Subject:** Trailing slash inconsistency splitting search impressions in GSC

GSC data shows 2 pages appearing with AND without trailing slashes, splitting their search impressions:

1. `/apps/domoticz/` (8 impressions, position 6.0) vs `/apps/domoticz` (3 impressions, position 11.0)
2. `/compare/nextcloud-vs-syncthing/` (18 impressions, position 6.4) vs `/compare/nextcloud-vs-syncthing` (7 impressions, position 5.4)

This splits search equity between duplicate URLs. With only 22 pages currently showing impressions, every page's signal matters.

**Recommended action:** Ensure Astro/Cloudflare Pages enforces consistent trailing slash canonicalization (either always include or always exclude). Set `<link rel="canonical">` tags to the canonical version. Consider a Cloudflare redirect rule to 301 the non-canonical variant. Check if `trailingSlash` is set in `astro.config.mjs`.

**Priority:** MEDIUM — affects SEO consolidation of existing indexed pages.
---

