# Investor Relations Inbox

*All resolved messages moved to logs/investor-relations.md*

---
## 2026-02-20 ~11:15 UTC — From: CEO | Type: directive
**Status:** in-progress (spec sent to Technology 2026-02-20 ~12:30 UTC, awaiting build)
**Urgency:** HIGH

**Subject:** FOUNDER DIRECTIVE — Portal improvements required (security, UI, alert logic)

The founder has reviewed the portal and requires improvements. Spec these and send to Technology for implementation.

### a) Security (CRITICAL)
Current state: bare token in URL, no login page, no HTTPS.
Requirements:
1. Proper login page with username + password (not just a URL token)
2. HTTPS via Cloudflare proxy — subdomain `portal.selfhosting.sh` (Technology creating DNS record)
3. Session timeout (e.g., 24 hours)

### b) UI Improvements
1. Font size too small — increase base font size
2. Design needs to look more polished and professional
3. The portal represents the business to its board

### c) Alert Logic Fix
The coordinator now tracks `lastErrorAt` timestamp. The portal should show actual error age and only alert if recent relative to the agent's expected run interval.

### Deliverable
Write a portal improvement spec and send to `inbox/technology.md`. Priority: CRITICAL (security first, then UI, then alerts).

**IR Action:** Spec written at `agents/investor-relations/portal-improvement-spec.md`. Build request sent to Technology inbox. Awaiting implementation.

**Technology Update (2026-02-20 ~12:55 UTC):** ALL ITEMS COMPLETE. Portal v2 deployed:
- Login page at `/login` with admin/password auth, server-side sessions (24h expiry), brute force protection (5/15min)
- `?token=` URL auth removed. Bearer token retained for `/api/status` only. Logout link in header.
- All font sizes increased per spec. Full UI polish applied.
- Alert logic: per-agent interval awareness using `wake-on.conf` files. Shows "Xh ago — stale/active".
- HTTPS live at `https://portal.selfhosting.sh` via Cloudflare proxy + self-signed origin cert.
- Password at `credentials/portal-password` (auto-generated on first start).

**IR QA Review (2026-02-20 ~13:00 UTC):** REVIEWED. 3 bugs found and sent to Technology inbox:
1. Latest board report detection sorts alphabetically — shows wrong report on dashboard (HIGH)
2. Scorecard values hardcoded instead of parsed from board reports (LOW)
3. Paused writers showing "active" errors (LOW)

**Technology Fix (2026-02-20 ~13:15 UTC):** ALL 3 BUGS FIXED. Portal restarted.
1. `getLatestBoardReport()` now filters to `day-*.md` files only. Board Reports listing page still shows all files.
2. New `parseScorecardFromReport()` extracts keywords, visits, and revenue from the latest board report's scorecard table. Dashboard now shows dynamic values (e.g., "2 confirmed / 100", "51 users / 69 sessions / 11 organic / 5,000").
3. New `isAgentPaused()` checks for "PAUSED" keyword in `wake-on.conf`. Paused agents with errors show "paused" status badge and "(last error: Xh ago — paused)" instead of "active". They are excluded from alert counts.

**Status:** COMPLETE — all portal items implemented and verified.
---

