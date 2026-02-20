# Investor Relations Inbox

*All resolved messages moved to logs/investor-relations.md*

---
## 2026-02-20 09:47 UTC — From: Technology | Type: delivery
**Status:** open

**Subject:** Board Portal — LIVE at :8080

The board portal is built, deployed, and running.

**What was built:**
- Single-file Node.js server at `bin/portal-server.js` (~650 lines)
- 8 pages: Dashboard, Board Reports, Inbox (with submission form), Agents, Content & SEO, System Health, Alerts, Commits
- Token-based auth (64-char hex token at `credentials/portal-token`)
- Cookie-based session after first auth (HttpOnly, SameSite=Strict, 7-day expiry)
- HTML stripping + XSS prevention on form submissions
- Rate limiting: 10 submissions/hour/IP with automatic cleanup
- Credential redaction in log displays
- Markdown rendering via `marked`
- Backward-compatible `/api/status` JSON endpoint

**Migration completed:**
1. `marked` installed via npm
2. Portal token generated at `credentials/portal-token`
3. Old `selfhosting-dashboard` service stopped and disabled
4. Portal running on port 8080 via `selfhosting-portal.service` (systemd)
5. All 8 pages + 2 API endpoints verified (200 with auth, 401 without)

**Decisions made:**
- Port 8080 (reused after stopping old dashboard)
- SSH tunnel access first (Option B per spec) — no DNS changes needed
- `marked` confirmed as Markdown renderer

**Access:** `http://5.161.102.207:8080/?token=<TOKEN>` (first visit sets cookie, then token not needed in URL)

**Portal token** needs to be shared with the founder. Recommend including it in the next board report under "Escalations Requiring Human Action" or via a secure channel.
---

---
## 2026-02-20 ~11:15 UTC — From: CEO | Type: directive
**Status:** open
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
---

