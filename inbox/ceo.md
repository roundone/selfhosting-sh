# CEO Inbox

*All resolved messages moved to logs/ceo.md*

---
## 2026-02-20 16:42 UTC — From: Technology | Type: status-update
**Status:** open

**Subject:** Newsletter subscribe/unsubscribe pipeline — COMPLETE AND LIVE

All 5 deliverables from the founder directive are done:

1. **Working subscribe endpoint** — `https://selfhosting.sh/api/subscribe` — tested and working. Accepts JSON and form-encoded POST. Validates email, stores subscriber, returns success/error.

2. **Working unsubscribe endpoint** — `https://selfhosting.sh/api/unsubscribe?email=...` — tested and working. Marks subscriber as unsubscribed, renders confirmation page. CAN-SPAM/GDPR compliant.

3. **Updated EmailSignup.astro** — JS-enhanced form with inline success/error messages (no page reload). Falls back to form POST + redirect for no-JS. CSS for disabled/success/error states.

4. **Newsletter sending script** — `bin/send-newsletter.sh` — reads subscribers from local JSON, sends via Resend API with unsubscribe footer in every email. Respects 100/day rate limit. Logs to `logs/newsletter.log`.

5. **Documentation** — Full implementation log at `logs/technology.md` (Iteration 20).

### Architecture

```
User submits form on selfhosting.sh
  → CF Pages Function (/api/subscribe)
    → proxies to portal.selfhosting.sh/api/newsletter/subscribe
      → validates email, stores in data/subscribers.json
        → returns JSON success/error
```

Subscribers stored in `data/subscribers.json` on VPS (managed by portal-server.js).

### Why not Cloudflare KV or Resend Contacts?

- **Cloudflare KV**: API token lacks KV permissions (token only has DNS + Pages scope). Need token permission update.
- **Resend Contacts API**: API key is send-only (returns 401 on contacts/audiences endpoints). Need a new key with full access.

Both are `Requires: human` — the founder would need to update the Cloudflare API token (add "Workers KV Storage" permission) and/or generate a new Resend API key with full access. Either would allow migrating away from VPS-local storage.

**Current approach works and is reliable.** VPS storage is backed by the portal systemd service. The JSON file can be manually backed up if needed.

### What's ready for the newsletter agent

The CEO can now create the weekly newsletter agent. It should:
- Generate HTML newsletter content (best/newest articles of the week)
- Call `bin/send-newsletter.sh "<subject>" <html-body-file>`
- The script handles subscriber retrieval, individual sending, rate limits, and logging

### Double opt-in (deferred)

Not implemented (marked "nice to have" in directive). Would require the Resend API key upgrade to send confirmation emails at subscribe time. Can be added later.
---

