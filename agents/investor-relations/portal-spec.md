# selfhosting.sh Board Portal — Specification

**Author:** Head of Investor Relations
**Date:** 2026-02-20
**Status:** Draft — awaiting Technology build
**Version:** 1.0

---

## Overview

The board portal is a web-based dashboard that gives the founder (Nishant) comprehensive visibility into every aspect of the selfhosting.sh business — without SSH access, log-grepping, or asking questions.

### Decision: Replace Existing Dashboard

The existing dashboard (`bin/dashboard.js` at `:8080`) is **replaced** by this portal. Rationale:
- No authentication — anyone with the IP can view operational data
- No input capability (no inbox submission form)
- No Markdown rendering (board reports shown as raw text)
- No alerts/escalations extraction
- Limited data sources (no GSC, no social details, no git history)

The new portal subsumes all existing dashboard functionality and adds the required features. Once live, the old `selfhosting-dashboard` systemd service should be stopped and disabled.

---

## Technology Stack

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Runtime | Node.js (already on VPS) | Zero new dependencies |
| HTTP framework | None — use `http` module | Minimal footprint, no npm installs needed |
| Markdown rendering | `marked` (npm) | Lightweight, well-maintained, renders board reports to HTML |
| HTML sanitization | `DOMPurify` via `jsdom` OR manual escaping | Prevent XSS from rendered Markdown |
| Templating | Inline template literals (same pattern as existing dashboard) | Simple, no build step |
| CSS | Inline `<style>` in HTML | Single-file deployment, no static assets to serve |
| Port | `8081` (or reuse `8080` after stopping old dashboard) | Avoids conflict during migration |
| systemd service | `selfhosting-portal.service` | Reliable process management |

**npm dependencies (minimal):**
- `marked` — Markdown to HTML
- No other dependencies. All file reading, shell execution, and HTTP serving use Node.js built-ins.

---

## Security

### Authentication

**Method:** Bearer token, checked on every request.

1. On first setup, generate a 64-character hex token:
   ```bash
   openssl rand -hex 32 > /opt/selfhosting-sh/credentials/portal-token
   chmod 600 /opt/selfhosting-sh/credentials/portal-token
   ```
2. The server reads this token at startup from `credentials/portal-token`.
3. Every request must include the token via ONE of:
   - Query parameter: `?token=<TOKEN>`
   - Header: `Authorization: Bearer <TOKEN>`
   - Cookie: `portal_token=<TOKEN>` (set after first successful auth via query param)
4. On successful auth via query param, set an HTTP-only cookie (`portal_token=<TOKEN>; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`) and redirect to the same URL without the token in the query string. This prevents the token from appearing in browser history and server logs after first use.
5. Invalid/missing token returns `401 Unauthorized` with a minimal "Access Denied" page.
6. The token MUST NOT appear in any log output, error messages, or HTML responses.

### HTTPS

The portal should be accessible via one of:
- **Option A (recommended):** Add a Cloudflare DNS record for `portal.selfhosting.sh` proxied through Cloudflare, pointing to the VPS. Cloudflare handles SSL termination. The portal listens on a local port, and the VPS nginx/caddy/direct connection handles the routing.
- **Option B (simpler):** Portal listens on `localhost:8081` only. Access via SSH tunnel (`ssh -L 8081:localhost:8081 selfhosting-vps`). No DNS changes needed.

Technology should implement **Option B first** (zero external dependencies), and set up Option A as a follow-up if the founder requests it.

### Input Sanitization (Inbox Submission Form)

- Strip ALL HTML tags from submitted messages. Use a strict allowlist: only plain text.
- Maximum message length: 5,000 characters. Reject longer submissions with 400 status.
- Maximum line count: 200 lines. Reject longer submissions.
- Reject any input containing `<script`, `<iframe`, `javascript:`, `onerror=`, `onload=`, or other common XSS vectors (belt-and-suspenders with the HTML stripping).
- Escape all output when rendering submitted content.

### Rate Limiting

- Track submissions per IP in memory (Map of IP -> timestamps).
- Max 10 submissions per hour per IP.
- Return `429 Too Many Requests` with a "Please wait" message if exceeded.
- Clean up entries older than 1 hour periodically (every 5 minutes).

### Credential Protection

- NEVER read or display contents of `credentials/` directory (except the portal token for auth).
- When displaying log files, apply a regex filter to redact strings matching common credential patterns:
  - API keys: any string matching `[A-Za-z0-9_-]{20,}` adjacent to keywords like `key`, `token`, `secret`, `password`, `bearer`
  - Environment variable values: lines matching `export.*=.*` or `[A-Z_]+=` should have the value portion replaced with `[REDACTED]`
- When displaying `coordinator-config.json`, this is safe (no credentials).

### CORS

- Set `Access-Control-Allow-Origin` to same-origin only (don't set the header at all — browsers default to same-origin).
- Do not serve any `Access-Control-Allow-*` headers.

---

## Pages & Layout

### Global Layout

```
+------------------------------------------------------------------+
| selfhosting.sh Board Portal              [Last refresh: HH:MM:SS]|
+------------------------------------------------------------------+
| [Nav] Dashboard | Board Reports | Inbox | Agents | Content |     |
|        System | Alerts | Commits                                 |
+------------------------------------------------------------------+
| [Page content]                                                    |
+------------------------------------------------------------------+
```

- Dark background (`#0f1117`), monospace font, green accent (`#22c55e`) — matching existing dashboard aesthetic
- Nav bar at top with tab-style links
- Auto-refresh every 60 seconds (configurable via `<meta http-equiv="refresh">`)
- Mobile-responsive: stack cards vertically on small screens

### Routing

All pages served from the same Node.js server. URL routes:

| Path | Page |
|------|------|
| `/` | Dashboard (home) |
| `/board` | Board Reports |
| `/inbox` | CEO Inbox & Messaging |
| `/agents` | Agent Activity |
| `/content` | Content & SEO |
| `/system` | System Health |
| `/alerts` | Alerts & Escalations |
| `/commits` | Recent Commits |
| `/api/status` | JSON API (backward-compatible with existing dashboard) |
| `/api/submit-message` | POST endpoint for inbox form |

---

## Page Specifications

### 1. Dashboard (Home) — `/`

The executive summary. Everything the founder needs in 30 seconds.

#### Layout

```
+---------------------------+---------------------------+
| BUSINESS HEALTH           | SCORECARD                 |
| [traffic light: G/Y/R]    | Metric | Target | Actual  |
| 2-3 sentence summary      | -----  | ------ | ------  |
| from latest board report   | Arts   | 1,500  | 720     |
+---------------------------+ Keys   | 100    | 2       |
|                           | Visits | 5,000  | ~0      |
|                           | Rev    | $0-100 | $0      |
+---------------------------+---------------------------+
| ALERTS (if any)           | CONTENT VELOCITY          |
| [count] items need action | [articles/day this week]  |
| [link to /alerts]         | Daily counts: sparkline   |
+---------------------------+---------------------------+
| AGENT STATUS (summary)    | SYSTEM STATUS (summary)   |
| [n] running, [n] queued   | Memory: [bar]             |
| [n] errors                | Disk: [bar]               |
| [link to /agents]         | Services: [n]/[n] up      |
+---------------------------+---------------------------+
| SOCIAL MEDIA              | LAST BOARD REPORT         |
| Queue: [n] items          | Date: [YYYY-MM-DD]        |
| X: [last post time]       | [first 200 chars]         |
| Bluesky: [last post time] | [link to /board]          |
+---------------------------+---------------------------+
```

#### Data Sources

| Section | Source | How to Read |
|---------|--------|-------------|
| Business Health | `board/day-*.md` (latest) | Parse "Business Health" H2 section. Traffic light: Green if "on track", Yellow if "behind" on any metric, Red if 2+ metrics behind or critical escalations exist. |
| Scorecard | `state.md` | Parse the "Content", "SEO & Marketing", "Revenue & Finance" sections for numbers. Compare against hardcoded targets from CLAUDE.md scorecard. |
| Alerts | `board/day-*.md` + `inbox/ceo.md` | Count items under "Escalations Requiring Human Action" in latest board report + open items in CEO inbox marked `Requires: human`. |
| Content Velocity | `git log` | Count commits with "Auto-commit:" prefix per day for last 7 days. Each auto-commit represents a writer batch. |
| Agent Status | `logs/coordinator-state.json` | Parse agents object: count running, queued, errors. |
| System Status | `free -m`, `df -h`, `systemctl is-active` | Same as existing dashboard. |
| Social Media | `queues/social-state.json` + `queues/social-queue.jsonl` | Parse last posted times and count remaining queue items. |
| Last Board Report | `board/day-*.md` (latest) | Show date and first paragraph. |

### 2. Board Reports — `/board`

All board reports, rendered from Markdown to HTML.

#### Layout

```
+------------------------------------------------------------------+
| BOARD REPORTS                                                     |
+------------------------------------------------------------------+
| [Search: _________________ ]                                      |
+------------------------------------------------------------------+
| > day-2026-02-20.md (latest)                    Feb 20, 2026     |
|   [Full rendered Markdown content]                                |
+------------------------------------------------------------------+
| > day-2026-02-16.md                             Feb 16, 2026     |
|   [Collapsed — click to expand]                                   |
+------------------------------------------------------------------+
| > founding-report.md                            Feb 15, 2026     |
|   [Collapsed — click to expand]                                   |
+------------------------------------------------------------------+
```

#### Behavior

- List all files in `board/` sorted by date (newest first)
- Latest report is expanded by default; others collapsed
- Markdown rendered to HTML via `marked`
- Search: client-side text search (filter reports by keyword). Simple `<input>` with JavaScript that hides non-matching reports.
- Include non-day files (e.g., `founding-report.md`, `human-dependency-audit-*.md`)

#### Data Source

- Directory listing: `fs.readdirSync('board/')` → sort by filename descending
- Content: `fs.readFileSync('board/<file>')` → render with `marked`

### 3. CEO Inbox & Messaging — `/inbox`

View the CEO inbox and submit messages.

#### Layout

```
+------------------------------------------------------------------+
| CEO INBOX                                                         |
+------------------------------------------------------------------+
| SEND MESSAGE TO CEO                                               |
| Subject: [________________________]                               |
| Message:                                                          |
| [                                                                ]|
| [                                                                ]|
| [                                                                ]|
| [Submit]                              [chars: 0/5000]             |
+------------------------------------------------------------------+
| CURRENT INBOX CONTENTS                                            |
+------------------------------------------------------------------+
| [Rendered Markdown of inbox/ceo.md]                               |
+------------------------------------------------------------------+
```

#### Submission Form

- `POST /api/submit-message`
- Fields: `subject` (required, max 200 chars), `message` (required, max 5,000 chars)
- Server-side processing:
  1. Validate: non-empty, within length limits, sanitize (strip HTML)
  2. Check rate limit (10/hour/IP)
  3. Append to `inbox/ceo.md` in the standard message format:
     ```markdown
     ---
     ## [ISO date] — From: Founder (via portal) | Type: directive
     **Status:** open

     **Subject:** [sanitized subject]

     [sanitized message]
     ---
     ```
  4. Return 200 with success confirmation
  5. The coordinator watches `inbox/ceo.md` for changes and will trigger the CEO agent

#### Display

- Read `inbox/ceo.md` and render via `marked`
- Each message block (delimited by `---`) displayed as a card
- Status badges: `open` = yellow, `resolved` = green

### 4. Agent Activity — `/agents`

#### Layout

```
+------------------------------------------------------------------+
| AGENT ACTIVITY                                                    |
+------------------------------------------------------------------+
| Summary: [n] running | [n] queued | [n] in backoff | [n] errors  |
+------------------------------------------------------------------+
| Agent            | Status  | Last Run        | Errors | Details  |
| ceo              | [badge] | 2026-02-20 09:35| 1      | [expand] |
| operations       | [badge] | 2026-02-20 07:27| 1      | [expand] |
| technology       | [badge] | 2026-02-20 06:47| 0      | [expand] |
| ...              |         |                 |        |          |
+------------------------------------------------------------------+
| [Expanded: Recent log entries for selected agent]                 |
+------------------------------------------------------------------+
```

#### Data Sources

| Data | Source |
|------|--------|
| Agent list, status, last run, errors | `logs/coordinator-state.json` |
| Agent log entries | `logs/<agent-name>.md` (last 50 lines) |
| Coordinator events | `logs/coordinator.log` (filter by agent name) |

#### Behavior

- Table of all agents from `coordinator-state.json`
- Status badges: `running` (green), `queued` (amber), `backoff` (red), `idle` (gray)
- Error count > 0 shows red badge
- Click "expand" to show last 50 lines of that agent's log file
- Sort: department heads first (ceo, operations, technology, marketing, bi-finance, investor-relations), then writers alphabetically

### 5. Content & SEO — `/content`

#### Layout

```
+------------------------------------------------------------------+
| CONTENT & SEO                                                     |
+------------------------------------------------------------------+
| ARTICLE COUNTS                                                    |
| Total: 720 | Target: 1,500 (Month 1)                             |
| [progress bar: 48%]                                               |
+------------------------------------------------------------------+
| BY TYPE                          | BY CATEGORY (top 20)          |
| apps: 187                        | Home Automation: 13/13 100%   |
| compare: 260                     | Foundations: 103/81 127%      |
| foundations: 104                  | Docker Mgmt: 13/13 100%      |
| hardware: 90                     | ...                           |
| replace: 51                      |                               |
| best: 21                         |                               |
| troubleshooting: 7               |                               |
+------------------------------------------------------------------+
| GOOGLE SEARCH CONSOLE                                             |
| Total impressions: 24 | Clicks: 0 | Page-1 keywords: 2          |
| Top pages by impressions:                                         |
| /hardware/proxmox-hardware-guide/ — 8 imp, pos 6.9               |
| /compare/freshrss-vs-miniflux/ — 4 imp, pos 4.5                  |
| ...                                                               |
+------------------------------------------------------------------+
| SOCIAL POSTING                                                    |
| Queue size: 1,920 | Drain rate: ~240/day                         |
| X: last post [time] | Bluesky: last post [time]                  |
| Mastodon: BLOCKED | Reddit: BLOCKED | Dev.to: BLOCKED            |
+------------------------------------------------------------------+
```

#### Data Sources

| Data | Source |
|------|--------|
| Article counts by type | `find site/src/content/<type> -name '*.md' | wc -l` for each type |
| Category completion | `state.md` "Category Completion Status" table OR `topic-map/_overview.md` |
| GSC data | `reports/gsc-data-*.json` (latest) — contains impressions, clicks, page data |
| Social posting | `queues/social-state.json` (last posted times), `queues/social-queue.jsonl` (line count = queue size) |

### 6. System Health — `/system`

#### Layout

```
+------------------------------------------------------------------+
| SYSTEM HEALTH                                                     |
+------------------------------------------------------------------+
| VPS                               | SERVICES                      |
| Memory: 2.1GB / 7.7GB (27%)      | coordinator: [active]         |
| [===========                    ] | proxy: [active]               |
| Disk: 4.2GB / 38GB (11%)         | watchdog: [active]            |
| [====                           ] | dashboard: [active]           |
| Load: 1.23 0.89 0.54             | portal: [active]              |
| Uptime: up 5 hours               |                               |
+------------------------------------------------------------------+
| COORDINATOR CONFIG                                                |
| maxTotalConcurrent: 4 (founder override)                         |
| maxWriterConcurrent: 1 (founder override)                        |
| writerFallbackHours: 8                                           |
| deptFallbackHours: 8                                             |
| memoryMinFreeMb: 1200                                            |
| minIterationGapMinutes: 5                                        |
+------------------------------------------------------------------+
| RATE LIMIT PROXY                                                  |
| Status: ACTIVE at localhost:3128                                 |
| Usage: [from proxy logs if available]                            |
+------------------------------------------------------------------+
```

#### Data Sources

| Data | Source |
|------|--------|
| Memory | `free -m` |
| Disk | `df -h /opt/selfhosting-sh` |
| Load | `/proc/loadavg` |
| Uptime | `uptime -p` |
| Services | `systemctl is-active <service>` for each |
| Coordinator config | `config/coordinator-config.json` |

### 7. Alerts & Escalations — `/alerts`

**This is the most important page.** If there are open alerts, a red badge appears on the nav bar next to "Alerts" on every page.

#### Layout

```
+------------------------------------------------------------------+
| ALERTS & ESCALATIONS                              [3 open items]  |
+------------------------------------------------------------------+
| REQUIRES HUMAN ACTION                                             |
+------------------------------------------------------------------+
| [!] Social Media Credentials — 5 Platforms Blocked               |
|     Source: board/day-2026-02-20.md                               |
|     Status: AWAITING RESPONSE (since Feb 16)                      |
|     Platforms: Mastodon, Dev.to, Reddit, Hashnode, LinkedIn       |
+------------------------------------------------------------------+
| [!] GA4 API Access                                                |
|     Source: board/day-2026-02-20.md                               |
|     Status: AWAITING RESPONSE (since Feb 16)                      |
+------------------------------------------------------------------+
| [!] Amazon Associates Signup                                      |
|     Source: board/day-2026-02-20.md                               |
|     Status: Not yet started                                       |
+------------------------------------------------------------------+
| AGENT ERRORS                                                      |
+------------------------------------------------------------------+
| [x] hardware-writer: 3 consecutive errors (in backoff)           |
| [x] homeauto-notes-writer: 2 consecutive errors (in backoff)     |
| [x] password-adblock-writer: 2 consecutive errors (in backoff)   |
+------------------------------------------------------------------+
```

#### Data Sources & Parsing

1. **Human action items:** Parse latest board report (`board/day-*.md`) for the section "Escalations Requiring Human Action". Extract each sub-section as an alert item.
2. **CEO inbox escalations:** Parse `inbox/ceo.md` for entries with `Requires: human` or `Type: escalation`.
3. **Agent errors:** From `logs/coordinator-state.json`, list any agent with `consecutiveErrors > 0`.

#### Alert Count Badge

- Count = (human action items) + (agents with errors > 0)
- Badge color: Red if count > 0, gray if 0
- Display badge in nav bar on ALL pages

### 8. Recent Commits — `/commits`

#### Layout

```
+------------------------------------------------------------------+
| RECENT COMMITS                                                    |
+------------------------------------------------------------------+
| Filter: [All] [Content] [Infrastructure] [Agents]                |
+------------------------------------------------------------------+
| 8572cf2 | CEO iteration: process 4 founder directives...         |
|         | 2026-02-20 09:15 UTC                                    |
+------------------------------------------------------------------+
| 0c8b11a | Add Layer 4: founder-locked files protection...         |
|         | 2026-02-20 09:00 UTC                                    |
+------------------------------------------------------------------+
| b882734 | Founder override: conservative config...                 |
|         | 2026-02-20 08:45 UTC                                    |
+------------------------------------------------------------------+
| ... (last 50 commits)                                             |
+------------------------------------------------------------------+
```

#### Data Source

- `git log --oneline --format="%H|%h|%s|%ai|%an" -50` — provides hash, short hash, subject, date, author
- Filters are client-side JavaScript:
  - **Content:** commits with paths matching `site/src/content/*`
  - **Infrastructure:** commits with paths matching `bin/*`, `config/*`, `agents/*`
  - **Agents:** commits with paths matching `agents/*`, `inbox/*`, `logs/*`
- To get paths per commit: `git diff-tree --no-commit-id --name-only -r <hash>` (can be cached server-side, run once per page load for the 50 commits)

---

## API Endpoints

### `GET /api/status`

Backward-compatible JSON API (same as existing dashboard). Returns:
```json
{
  "timestamp": "2026-02-20T10:00:00Z",
  "memory": { "total": 7700, "used": 2100, "available": 5600 },
  "disk": { "size": "38G", "used": "4.2G", "avail": "33G", "pct": "11%" },
  "load": "1.23 0.89 0.54",
  "services": [
    { "name": "selfhosting-coordinator", "status": "active" },
    { "name": "selfhosting-proxy", "status": "active" }
  ],
  "articles": 720,
  "collections": { "apps": 187, "compare": 260, "foundations": 104, ... },
  "agents": { ... },
  "social": { "queueSize": 1920, "lastPosted": { ... } }
}
```

### `POST /api/submit-message`

Submit a message to the CEO inbox.

**Request:**
```
Content-Type: application/json

{
  "subject": "string (required, max 200 chars)",
  "message": "string (required, max 5000 chars)"
}
```

**Response (success):**
```json
{ "ok": true, "message": "Message delivered to CEO inbox" }
```

**Response (error):**
```json
{ "ok": false, "error": "Rate limit exceeded. Max 10 messages per hour." }
```

**Validation:**
1. Check auth token (same as all requests)
2. Parse JSON body
3. Validate subject: non-empty, <= 200 chars, strip HTML
4. Validate message: non-empty, <= 5,000 chars, <= 200 lines, strip HTML
5. Check rate limit (10/hour/IP)
6. Append formatted message to `inbox/ceo.md`
7. Return success

---

## Data Refresh Strategy

- **HTML pages:** Auto-refresh via `<meta http-equiv="refresh" content="60">`. Every 60 seconds the page reloads with fresh data.
- **All data is read from disk on each request.** No caching layer. File reads are fast (SSD, small files). This ensures data is always current.
- **Shell commands** (`free`, `df`, `git log`, `systemctl`) are executed on each request with a 5-second timeout. These are lightweight and complete in milliseconds.
- **No WebSocket or polling.** The meta-refresh approach is simpler and sufficient for a single-user portal.

---

## File Structure

```
bin/portal-server.js          — Main server (single file, ~600-800 lines)
credentials/portal-token      — Auth token (generated on first setup)
```

The portal is a single Node.js file. No build step, no bundling, no static assets directory.

---

## systemd Service

```ini
[Unit]
Description=selfhosting.sh Board Portal
After=network.target

[Service]
Type=simple
User=selfhosting
WorkingDirectory=/opt/selfhosting-sh
ExecStart=/usr/bin/node bin/portal-server.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

---

## Migration Plan

1. Build `bin/portal-server.js`
2. Generate portal token: `openssl rand -hex 32 > credentials/portal-token && chmod 600 credentials/portal-token`
3. Install `marked`: `cd /opt/selfhosting-sh && npm install marked`
4. Create systemd service file at `/etc/systemd/system/selfhosting-portal.service`
5. `systemctl daemon-reload && systemctl enable --now selfhosting-portal`
6. Verify portal works at `localhost:8081`
7. Stop old dashboard: `systemctl stop selfhosting-dashboard && systemctl disable selfhosting-dashboard`
8. Share the portal token with the founder via board report (under "Escalations Requiring Human Action" — one-time setup)

---

## Open Questions for Technology

1. **Port choice:** Should we reuse `:8080` (after stopping old dashboard) or use `:8081`? Reusing 8080 avoids firewall changes but requires stopping the old service first.
2. **Cloudflare subdomain:** Should we set up `portal.selfhosting.sh` now (requires DNS record) or defer to SSH tunnel access?
3. **npm install scope:** Is `marked` the right choice? Alternatives: parse Markdown manually (worse quality), use a CDN-loaded client-side library (security concern).

---

## Success Criteria

The portal is "done" when:
1. The founder can access it from a browser (via SSH tunnel or subdomain)
2. All 8 pages render correctly with live data
3. The inbox submission form works and messages appear in `inbox/ceo.md`
4. Authentication prevents unauthorized access
5. No credentials are visible anywhere in the portal
6. The founder confirms it meets their needs (via inbox message or board report response)
