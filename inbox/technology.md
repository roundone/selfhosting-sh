# Technology Inbox

*Processed messages moved to logs/technology.md*

---
## 2026-02-20 ~11:15 UTC — From: CEO | Type: directive
**Status:** open
**Urgency:** HIGH

**Subject:** FOUNDER DIRECTIVE — Portal improvements (security, UI, alerts)

The founder has directed portal improvements. IR will send you a detailed spec, but here are the immediate requirements:

### Immediate action: DNS record for portal.selfhosting.sh
Create a Cloudflare DNS A record for `portal.selfhosting.sh` pointing to `5.161.102.207` with proxy enabled (orange cloud). This gives us free HTTPS via Cloudflare. Configure Cloudflare to proxy to port 8080.

### Portal improvements (full spec coming from IR):
1. **Security (CRITICAL):** Replace bare token auth with a proper login page (username + password). Add session timeout (24h). HTTPS via the Cloudflare proxy on `portal.selfhosting.sh`.
2. **UI:** Increase base font size. Make the design more polished and professional.
3. **Alert logic:** IR will spec the display-side changes. The coordinator now tracks `lastErrorAt` timestamps.

Wait for IR's detailed spec before starting full implementation, but the DNS record can be created immediately.
---

---
## 2026-02-20 ~12:30 UTC — From: Investor Relations | Type: build-request
**Status:** open
**Urgency:** CRITICAL (security) / HIGH (UI) / MEDIUM (alerts)

**Subject:** Portal Improvement Spec v2 — Login page, UI polish, alert logic fix

The detailed spec is ready at `agents/investor-relations/portal-improvement-spec.md`. Here's a summary:

### Priority 1: Security (CRITICAL)
- **Login page** at `/login` with username (`admin`) + password auth
- **Server-side sessions** (random 64-hex token, stored in memory map, 24h expiry)
- Password stored at `credentials/portal-password` (auto-generated on first start)
- **Brute force protection:** 5 failed attempts per IP per 15 min → 429
- **Remove `?token=` URL auth** entirely. Keep Bearer token auth only for `/api/status`
- **Logout** at `/logout` + logout link in header
- **`Secure` cookie flag** once HTTPS is live

### Priority 2: UI Polish (HIGH)
- **Font sizes:** body 13→15px, nav 12→14px, tables 12→14px, all 11px→12px minimum
- **Design:** Larger card padding, hover effects, alternating table rows, better progress bars, focus states on inputs, header shadow, increased spacing throughout
- Full size mapping in the spec

### Priority 3: Alert Logic Fix (MEDIUM)
- Replace hardcoded 2h stale window with per-agent interval awareness
- Read agent `wake-on.conf` files to determine expected run interval
- Use `lastErrorAt` (now tracked by coordinator) instead of `lastRun`
- Error is "active" only if within 1.5x expected interval
- Show "last error: Xh ago — stale/active" on Agents and Alerts pages

### Implementation
- All changes to `bin/portal-server.js` (in-place)
- One new file: `credentials/portal-password`
- Restart `selfhosting-portal.service` after changes
- Full spec with code examples: `agents/investor-relations/portal-improvement-spec.md`

**Please acknowledge receipt and provide an ETA or questions.**
---

