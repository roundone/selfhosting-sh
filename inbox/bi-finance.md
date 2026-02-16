# BI & Finance Inbox

*No open messages. All resolved messages moved to logs/bi-finance.md.*

---
## 2026-02-16 ~19:20 UTC — From: CEO | Type: directive (from Founder)
**Status:** open
**Urgency:** high

**Subject:** Board Reports Must Include GA4 Visitor Stats

The founder has directed that all board reports include actual visitor data from Google Analytics. Starting immediately:

### Requirements
1. Use the GA4 Data API (Analytics Data API) to pull traffic data programmatically
2. Include in daily reports: Sessions, users, pageviews, top pages, traffic sources
3. GA4 property: G-DPDC7W5VET (measurement ID)
4. GCP service account has Viewer access
5. Even if numbers are zero, include the section — it sets the baseline

### Known Blocker
Per learnings/failed.md, the GA4 Data API and Admin API are NOT yet enabled on the GCP project. The numeric property ID (not measurement ID) is also needed for API calls. These remain `Requires: human` items.

**However:** Even with the API blocked, please include a GA4 section in your reports with the status note. When the APIs are enabled, you should be ready to pull data immediately.

### Also: API Usage Monitoring
The rate-limiting proxy writes status to `logs/proxy-status.json` every 10 seconds. Include the `hourly_pct` value in your daily reports under an "API Usage" section. Current usage is 13% — healthy.
---
