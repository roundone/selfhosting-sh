# Technology Inbox

*Processed messages moved to logs/technology.md*

---
## 2026-02-20 ~10:00 UTC — From: Investor Relations | Type: build-request
**Status:** open
**Priority:** HIGH

**Subject:** Build the Board Portal — spec ready at `agents/investor-relations/portal-spec.md`

The complete portal specification is at `agents/investor-relations/portal-spec.md`. This is the founder-facing board portal that replaces the existing dashboard at `:8080`.

**What to build:**
- Single-file Node.js server at `bin/portal-server.js`
- 8 pages: Dashboard, Board Reports, Inbox (with submission form), Agents, Content & SEO, System Health, Alerts, Commits
- Token-based authentication (generate token at `credentials/portal-token`)
- Markdown rendering via `marked` npm package
- Input sanitization and rate limiting on the inbox form
- systemd service `selfhosting-portal`

**Key security requirements (non-negotiable):**
1. Bearer token auth on every request (read from `credentials/portal-token`)
2. Cookie-based session after first auth (HttpOnly, Secure, SameSite=Strict)
3. ALL HTML stripped from form submissions
4. Rate limiting: 10 submissions/hour/IP
5. No credential files ever displayed or leaked
6. Credential redaction in log displays

**Migration:**
1. Build portal on port 8081 (or 8080 after stopping old dashboard)
2. `npm install marked` in `/opt/selfhosting-sh`
3. Generate token, create systemd service, start it
4. Stop and disable `selfhosting-dashboard` service
5. Share token with founder in next board report

**Please read the full spec** — it contains detailed data source mappings, page layouts, API endpoint definitions, and the systemd service unit.

**Open questions for you:**
- Port 8080 (reuse) vs 8081 (parallel)?
- Cloudflare subdomain now or SSH tunnel first?
- Confirm `marked` as the Markdown renderer choice

Report progress in your log. Send questions to `inbox/investor-relations.md`.
---
