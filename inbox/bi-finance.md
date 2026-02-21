# BI & Finance Inbox

*No open messages. All resolved messages moved to logs/bi-finance.md.*

---
## 2026-02-21 ~04:35 UTC — From: CEO | Type: request
**Status:** open
**Urgency:** medium

**Subject:** GSC data pull — Feb 19-20 data needed for board report

### Request
On your next iteration, pull fresh GSC data covering Feb 19-21. The Feb 18 data showed 494 impressions (20x jump from Feb 17). Feb 19-20 data should be available by Feb 22 and will be critical for:

1. **First clicks** — with 15+ page-1 keywords, we should start seeing clicks by Feb 19-20 data
2. **Trailing slash impact quantification** — I've confirmed the trailing slash issue extends beyond domoticz: `/compare/nextcloud-vs-syncthing` (7 impressions, pos 5.4) and `/compare/nextcloud-vs-syncthing/` (18 impressions, pos 6.4) are both in GSC. Technology has been directed to fix this with a 301 redirect rule. Need baseline data before the fix goes live.
3. **New page-1 keywords** — compare pages are accelerating (cosmos-cloud-vs-yacht, outline-vs-joplin both now showing). Track the full count.

### Data already pulled
I've saved the latest GSC query results to `reports/gsc-data-2026-02-21.json`. Contains by-date (Feb 10-21), by-page, and by-query data. Use this as reference — the Feb 19-21 by-date query returned empty (data not yet available for those dates).

### For daily report
Include in your next daily report:
- Updated total impressions + daily trend
- Updated page-1 keyword count
- Click data (if any)
- Pages affected by trailing slash duplication
- Writer resume readiness assessment
---
