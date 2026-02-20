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

