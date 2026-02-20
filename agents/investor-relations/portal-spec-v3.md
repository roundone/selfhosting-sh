# Portal v3 Spec — CLAUDE.md Viewer/Editor + Growth Metrics Dashboard

**Author:** Head of Investor Relations
**Date:** 2026-02-20
**Status:** Spec complete — awaiting Technology build
**Priority:** HIGH (founder directive via CEO)

---

## Overview

Two new portal features requested by the founder via CEO directive. Both add new pages to the existing portal at `bin/portal-server.js`.

**Feature 1: Agent Instructions (CLAUDE.md Viewer/Editor)** — simpler, ship first
**Feature 2: Growth Metrics Dashboard** — larger, may need iterations

Both pages follow the existing portal patterns: add routes in `handleRequest()`, add `page*()` functions, add nav links, use `layoutHtml()` wrapper.

---

## Feature 1: Agent Instructions Page

### Route

`/instructions` — new nav item "Instructions" in the portal header (add between "Alerts" and "Commits")

### Behavior

1. **Agent list** — sidebar or table listing all agents with their CLAUDE.md file paths
2. **View mode** — clicking an agent shows its CLAUDE.md contents in a monospace `<pre>` block (or rendered Markdown via `marked`)
3. **Edit mode (CEO only)** — the CEO agent's CLAUDE.md has a `<textarea>` with a "Save" button. All other agents are read-only.

### Agent Registry

Hardcode the agent list and paths:

```javascript
const AGENT_CLAUDE_MDS = [
  { name: 'CEO', key: 'ceo', path: `${BASE}/CLAUDE.md`, editable: true },
  { name: 'Technology', key: 'technology', path: `${BASE}/agents/technology/CLAUDE.md`, editable: false },
  { name: 'Marketing', key: 'marketing', path: `${BASE}/agents/marketing/CLAUDE.md`, editable: false },
  { name: 'Operations', key: 'operations', path: `${BASE}/agents/operations/CLAUDE.md`, editable: false },
  { name: 'BI & Finance', key: 'bi-finance', path: `${BASE}/agents/bi-finance/CLAUDE.md`, editable: false },
  { name: 'Investor Relations', key: 'investor-relations', path: `${BASE}/agents/investor-relations/CLAUDE.md`, editable: false },
  { name: 'Foundations Writer', key: 'foundations-writer', path: `${BASE}/agents/operations/writers/foundations-writer/CLAUDE.md`, editable: false },
  { name: 'Hardware Writer', key: 'hardware-writer', path: `${BASE}/agents/operations/writers/hardware-writer/CLAUDE.md`, editable: false },
  { name: 'Home Auto / Notes Writer', key: 'homeauto-notes-writer', path: `${BASE}/agents/operations/writers/homeauto-notes-writer/CLAUDE.md`, editable: false },
  { name: 'Password / Adblock Writer', key: 'password-adblock-writer', path: `${BASE}/agents/operations/writers/password-adblock-writer/CLAUDE.md`, editable: false },
  { name: 'Photo / Media Writer', key: 'photo-media-writer', path: `${BASE}/agents/operations/writers/photo-media-writer/CLAUDE.md`, editable: false },
  { name: 'Proxy / Docker Writer', key: 'proxy-docker-writer', path: `${BASE}/agents/operations/writers/proxy-docker-writer/CLAUDE.md`, editable: false },
  { name: 'Tier 2 Writer', key: 'tier2-writer', path: `${BASE}/agents/operations/writers/tier2-writer/CLAUDE.md`, editable: false },
  { name: 'VPN / Filesync Writer', key: 'vpn-filesync-writer', path: `${BASE}/agents/operations/writers/vpn-filesync-writer/CLAUDE.md`, editable: false },
];
```

### API Endpoints

#### `GET /api/claude-md?agent={key}`

- Looks up agent `key` in the registry
- Returns `{ ok: true, name: "CEO", content: "...", editable: true/false }`
- If agent not found: `{ ok: false, error: "Unknown agent" }` with 404
- Content: raw file contents read via `fs.readFileSync(path, 'utf8')`
- Apply credential redaction (same `redactCredentials()` function used elsewhere)

#### `POST /api/claude-md?agent=ceo`

- **Only accepts `agent=ceo`**. Reject all others with `{ ok: false, error: "Read-only" }` and 403.
- Request body: `{ "content": "..." }` (JSON, max 500KB)
- Validation:
  - Content must be non-empty string
  - Max size: 500,000 characters (CLAUDE.md is large)
  - Must start with `#` (basic sanity check that it's Markdown)
- On save: `fs.writeFileSync(path, content, 'utf8')`
- Returns `{ ok: true, message: "Saved" }`
- **No HTML sanitization needed** — this is a Markdown file written to disk, not rendered back as HTML. The founder is the only user.

### Page Layout

```
+------------------------------------------------------------------+
| AGENT INSTRUCTIONS                                                |
+------------------------------------------------------------------+
| Agents:                                                           |
| [CEO] [Technology] [Marketing] [Operations] [BI & Finance]       |
| [IR] [Foundations] [Hardware] [HomeAuto] [PwdAdblk]               |
| [Photo] [Proxy] [Tier2] [VPN]                                    |
+------------------------------------------------------------------+
| CEO — CLAUDE.md                                    [Edit] [Save]  |
+------------------------------------------------------------------+
| [textarea or rendered content showing CLAUDE.md]                  |
| ...                                                               |
+------------------------------------------------------------------+
```

- Default: show CEO CLAUDE.md on page load
- Agent buttons are styled tabs/pills — clicking one fetches that agent's file via `/api/claude-md?agent={key}`
- For CEO: show a toggle between "View" (rendered Markdown) and "Edit" (textarea with Save button)
- For all others: show rendered Markdown only, no textarea
- Use client-side JavaScript (fetch API) to load content without full page reload
- Textarea: full-width, min-height 600px, monospace font (`font-family: monospace`), dark background matching portal theme
- Save button: POST to `/api/claude-md?agent=ceo`, show success/error toast

### Security

- Same session auth as all portal pages
- POST endpoint restricted to `agent=ceo` — hardcoded check, not configurable
- No path traversal: agent key looked up in hardcoded registry, never used as a file path directly
- Content written as-is (no execution risk — it's a text file)

---

## Feature 2: Growth Metrics Dashboard

### Route

`/growth` — new nav item "Growth" in the portal header (add after "Content")

### Overview

A data-dense dashboard showing whether the business is growing. Four sections: Content & SEO, Site Performance (GA4), Social Media, Operational Health. Most important metrics displayed as large number cards at the top, detailed tables below.

### Data Architecture

Three data source types:
1. **Local files** — read from disk on each request (fast, always fresh)
2. **GSC API** — query Google Search Console via service account JWT. Cache results for 1 hour.
3. **GA4 API** — query Google Analytics Data API via service account JWT. Cache results for 1 hour.
4. **Social APIs** — query Bluesky + Mastodon for follower counts. Cache for 1 hour.

### Google API Authentication

Both GSC and GA4 use the same Google service account at `credentials/gcp-service-account.json`. Auth flow:

```javascript
// 1. Read service account JSON
const sa = JSON.parse(fs.readFileSync(`${BASE}/credentials/gcp-service-account.json`));

// 2. Create JWT
const header = { alg: 'RS256', typ: 'JWT' };
const now = Math.floor(Date.now() / 1000);
const payload = {
  iss: sa.client_email,
  scope: 'https://www.googleapis.com/auth/webmasters.readonly https://www.googleapis.com/auth/analytics.readonly',
  aud: 'https://oauth2.googleapis.com/token',
  iat: now,
  exp: now + 3600
};

// 3. Sign JWT and exchange for access token
// POST https://oauth2.googleapis.com/token
// grant_type=urn:ietf:params:oauth:grant_type:jwt-bearer&assertion=<signed_jwt>

// 4. Use access token for API calls
```

Use Node.js `crypto.createSign('RSA-SHA256')` for JWT signing. No external libraries needed.

Cache the access token for 55 minutes (5 min safety margin before 1h expiry).

### Page Layout

```
+------------------------------------------------------------------+
| GROWTH METRICS                                     Last: HH:MM   |
+------------------------------------------------------------------+
| TOP-LINE METRICS (large number cards)                             |
+----------+----------+----------+----------+----------+----------+
| ARTICLES | GSC IMP  | GSC CLK  | GA4 VIEWS| PAGE-1   | SOCIAL   |
|   779    | 24 (7d)  |  0 (7d)  | --       | KWs: 2   | F: --    |
| +59 today| trend    | trend    | trend    | /100 tgt | 3 plat   |
+----------+----------+----------+----------+----------+----------+
|                                                                   |
| CONTENT & SEO                                                     |
+------------------------------------------------------------------+
| GSC Performance (last 7 days)                                     |
| Impressions: 24 | Clicks: 0 | CTR: 0% | Avg Position: 6.3       |
+------------------------------------------------------------------+
| Daily Impressions (sparkline/bar chart)                            |
| Feb 14: 0 | Feb 15: 0 | Feb 16: 0 | Feb 17: 24                   |
+------------------------------------------------------------------+
| Top Pages by Impressions                                          |
| Page                              | Impr | Clicks | Pos          |
| /hardware/proxmox-hardware-guide  |    8 |      0 |  6.9         |
| /compare/freshrss-vs-miniflux     |    4 |      0 |  4.5         |
| /foundations/reverse-proxy...     |    4 |      0 |  7.3         |
| ...                               |      |        |              |
+------------------------------------------------------------------+
| Top Queries by Impressions                                        |
| Query                    | Impr | Clicks | CTR | Pos             |
| freshrss vs miniflux     |    1 |      0 |  0% | 5.0             |
| miniflux vs freshrss     |    1 |      0 |  0% | 3.0             |
| ...                      |      |        |     |                 |
+------------------------------------------------------------------+
| Indexing Status                                                   |
| Submitted to sitemap: 516 | Indexed: -- | Gap: --                 |
+------------------------------------------------------------------+
| Keywords by Position Bracket                                      |
| Page 1 (pos 1-10): 2 | Page 2 (11-20): -- | Page 3 (21-30): --   |
+------------------------------------------------------------------+
|                                                                   |
| SITE PERFORMANCE (GA4)                                            |
+------------------------------------------------------------------+
| Daily Visitors (last 7d)  | Page Views (last 7d)                  |
| [daily breakdown]         | [daily breakdown]                     |
+------------------------------------------------------------------+
| Bounce Rate: --% | Avg Session: --s                               |
+------------------------------------------------------------------+
| Top Pages by Views                  | Top Traffic Sources          |
| (table)                             | (table)                      |
+------------------------------------------------------------------+
|                                                                   |
| SOCIAL MEDIA                                                      |
+------------------------------------------------------------------+
| Platform   | Last Post        | Followers | Posts Today            |
| X          | 15:30 UTC        | --        | --                    |
| Bluesky    | 15:25 UTC        | [API]     | --                    |
| Mastodon   | 15:20 UTC        | [API]     | --                    |
| Reddit     | INACTIVE         | --        | 0                     |
| Dev.to     | INACTIVE         | --        | 0                     |
| Hashnode   | INACTIVE         | --        | 0                     |
+------------------------------------------------------------------+
| Queue: [n] items remaining                                        |
+------------------------------------------------------------------+
|                                                                   |
| OPERATIONAL HEALTH                                                |
+------------------------------------------------------------------+
| Agent Iterations (last 24h)                                       |
| Agent              | Runs | Errors | Last Run     | Status       |
| ceo                |   5  |    1   | 15:26 UTC    | backoff      |
| technology         |   8  |    0   | 15:29 UTC    | idle         |
| marketing          |   6  |    0   | 15:36 UTC    | idle         |
| ...                |      |        |              |              |
+------------------------------------------------------------------+
| System: Mem 27% | Disk 11% | Load 1.23                            |
| Last deploy: [timestamp]                                          |
+------------------------------------------------------------------+
```

### Data Sources — Detailed Mapping

#### Top-Line Cards

| Card | Data Source | How |
|------|-----------|-----|
| Articles | `find site/src/content/ -name '*.md' \| wc -l` | Same as existing `getArticleCounts()` |
| GSC Impressions (7d) | GSC API: `searchanalytics.query` with date range = last 7 days | Sum impressions |
| GSC Clicks (7d) | Same query | Sum clicks |
| GA4 Page Views (7d) | GA4 Data API: `runReport` with `screenPageViews` metric | Sum |
| Page-1 Keywords | GSC API: query with `position <= 10` | Count distinct queries |
| Social Followers | Bluesky API + Mastodon API | Sum followers |

#### GSC API Calls

All calls go to `https://www.googleapis.com/webmasters/v3/sites/sc-domain:selfhosting.sh/searchAnalytics/query` (POST).

**Call 1: Overall performance (last 7 days)**
```json
{
  "startDate": "YYYY-MM-DD (7 days ago)",
  "endDate": "YYYY-MM-DD (yesterday)",
  "dimensions": [],
  "rowLimit": 1
}
```
Returns: total impressions, clicks, CTR, position for the period.

**Call 2: Daily breakdown**
```json
{
  "startDate": "YYYY-MM-DD (7 days ago)",
  "endDate": "YYYY-MM-DD (yesterday)",
  "dimensions": ["date"],
  "rowLimit": 30
}
```
Returns: per-day impressions/clicks for sparkline chart.

**Call 3: Top pages**
```json
{
  "startDate": "YYYY-MM-DD (7 days ago)",
  "endDate": "YYYY-MM-DD (yesterday)",
  "dimensions": ["page"],
  "rowLimit": 10
}
```
Returns: top 10 pages by clicks (or impressions as secondary sort).

**Call 4: Top queries**
```json
{
  "startDate": "YYYY-MM-DD (7 days ago)",
  "endDate": "YYYY-MM-DD (yesterday)",
  "dimensions": ["query"],
  "rowLimit": 10
}
```
Returns: top 10 search queries.

**Call 5: Keywords by position bracket**
```json
{
  "startDate": "YYYY-MM-DD (7 days ago)",
  "endDate": "YYYY-MM-DD (yesterday)",
  "dimensions": ["query"],
  "rowLimit": 25000
}
```
Count queries where `position <= 10` (page 1), `10 < position <= 20` (page 2), `20 < position <= 30` (page 3).

**Alternative approach:** Read the cached GSC data file at `reports/gsc-data-YYYY-MM-DD.json` if it exists and is less than 24h old. This file already contains `queries_detailed`, `pages`, `daily`, and `sitemaps` data. The BI agent writes this file daily. **Recommendation: Use the cached file as primary source, only call API directly if file is stale (>24h old) or missing.**

#### GA4 API Calls

Use the GA4 Data API (v1beta): `https://analyticsdata.googleapis.com/v1beta/properties/{GA4_PROPERTY_ID}:runReport`

**GA4 Property ID:** `524871536` (from `credentials/api-keys.env`)

**Call 1: Daily visitors + page views (last 7d)**
```json
{
  "dateRanges": [{ "startDate": "7daysAgo", "endDate": "yesterday" }],
  "dimensions": [{ "name": "date" }],
  "metrics": [
    { "name": "activeUsers" },
    { "name": "screenPageViews" },
    { "name": "sessions" }
  ]
}
```

**Call 2: Engagement metrics**
```json
{
  "dateRanges": [{ "startDate": "7daysAgo", "endDate": "yesterday" }],
  "metrics": [
    { "name": "bounceRate" },
    { "name": "averageSessionDuration" },
    { "name": "activeUsers" },
    { "name": "screenPageViews" }
  ]
}
```

**Call 3: Top pages by views**
```json
{
  "dateRanges": [{ "startDate": "7daysAgo", "endDate": "yesterday" }],
  "dimensions": [{ "name": "pagePath" }],
  "metrics": [{ "name": "screenPageViews" }],
  "limit": 10,
  "orderBys": [{ "metric": { "metricName": "screenPageViews" }, "desc": true }]
}
```

**Call 4: Top traffic sources**
```json
{
  "dateRanges": [{ "startDate": "7daysAgo", "endDate": "yesterday" }],
  "dimensions": [{ "name": "sessionSource" }, { "name": "sessionMedium" }],
  "metrics": [{ "name": "sessions" }],
  "limit": 10,
  "orderBys": [{ "metric": { "metricName": "sessions" }, "desc": true }]
}
```

#### Social APIs

**Bluesky follower count:**
```
GET https://bsky.social/xrpc/app.bsky.actor.getProfile?actor=selfhostingsh.bsky.social
```
Response field: `followersCount`. No auth required for public profiles.

**Mastodon follower count:**
```
GET https://mastodon.social/api/v1/accounts/lookup?acct=selfhostingsh
```
Response field: `followers_count`. No auth required.

**X/Twitter:** No API access for follower counts (pay-per-use plan doesn't include this). Show "N/A".

#### Social Posts Today

Parse `logs/social-poster.log` for lines matching today's date with "Posted to" or similar pattern. Count per platform.

Alternatively, count entries in `queues/social-state.json` — the `last_posted` timestamps indicate activity but not daily counts.

**Recommended:** Just show last posted time per platform from `social-state.json` (already available). Daily post counts require log parsing which is fragile.

#### Operational Health

- **Agent iterations:** Parse `logs/coordinator-state.json` (already used by `/agents` page)
- **System metrics:** Reuse existing `getMemory()`, `getDisk()`, `getLoad()` functions
- **Last deploy:** Parse `logs/coordinator.log` for most recent "technology" completion with deploy-related message

### Caching Strategy

Add a simple in-memory cache for API results:

```javascript
const apiCache = new Map();
const CACHE_TTL = 3600000; // 1 hour

function getCached(key, fetchFn) {
  const cached = apiCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  const data = fetchFn();
  apiCache.set(key, { data, timestamp: Date.now() });
  return data;
}
```

Since API calls are async (HTTP requests), use async/await:

```javascript
async function getCachedAsync(key, fetchFn) {
  const cached = apiCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  const data = await fetchFn();
  apiCache.set(key, { data, timestamp: Date.now() });
  return data;
}
```

**Important:** The page handler for `/growth` needs to be async. The request handler should support this:
```javascript
} else if (pathname === '/growth') {
  pageGrowth().then(html => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  }).catch(err => {
    console.error('Growth page error:', err.message);
    res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(layoutHtml('Error', '', '<h2>Error loading growth metrics</h2><p>' + escapeHtml(err.message) + '</p>'));
  });
  return; // important: return immediately, response sent in .then()
}
```

### Color Coding

Apply color coding to metrics based on scorecard targets:

| Metric | Green | Yellow | Red |
|--------|-------|--------|-----|
| Articles | >= month target | >= 50% of target | < 50% |
| Page-1 keywords | >= target | >= 50% | < 50% |
| Monthly visits | >= target | >= 50% | < 50% |
| Monthly revenue | >= target | >= 50% | < 50% |
| Agent errors | 0 | 1-2 | 3+ |

Use CSS classes: `.metric-green { color: #22c55e; }`, `.metric-yellow { color: #eab308; }`, `.metric-red { color: #ef4444; }`.

### Fallback Handling

Any API call might fail (network, auth, rate limit). Every section must gracefully degrade:
- Show "N/A" or "--" for unavailable metrics
- Show "API error: [message]" in a subtle warning box if an API fails
- Never let one failed API call crash the whole page
- Log API errors to console for debugging

### GSC Data File Fallback

Before making live API calls, check for `reports/gsc-data-YYYY-MM-DD.json` (today or yesterday). If the file exists and has all required fields, use it instead of calling the API. This reduces API calls and leverages BI's daily data collection.

```javascript
function getGSCDataFromFile() {
  // Try today, then yesterday
  for (const daysAgo of [0, 1]) {
    const d = new Date(Date.now() - daysAgo * 86400000);
    const dateStr = d.toISOString().split('T')[0];
    const filePath = `${BASE}/reports/gsc-data-${dateStr}.json`;
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (data.pages && data.daily && data.queries_detailed) {
        return { data, source: 'file', date: dateStr };
      }
    } catch {}
  }
  return null; // fall through to API
}
```

---

## Navigation Update

Add two new nav items to the portal header. Updated nav order:

```
Dashboard | Board Reports | Inbox | Agents | Content | Growth | Instructions | System | Alerts | Commits
```

The `Growth` and `Instructions` items should be added to the existing nav array/template in `layoutHtml()`.

---

## Implementation Notes for Technology

### Priority Order

1. **Ship Feature 1 first** (Agent Instructions) — it's simpler, ~150 lines of code, no external API calls
2. **Ship Feature 2 second** (Growth Metrics) — larger, requires JWT auth + API integration + caching

### Estimated Code Changes

**Feature 1:**
- Add `AGENT_CLAUDE_MDS` constant (~20 lines)
- Add `GET /api/claude-md` handler (~30 lines)
- Add `POST /api/claude-md` handler (~30 lines)
- Add `pageInstructions()` function (~60 lines HTML + JS)
- Add route in `handleRequest()` (~5 lines)
- Update nav in `layoutHtml()` (~2 lines)

**Feature 2:**
- Add JWT signing function (~40 lines)
- Add Google token exchange function (~30 lines)
- Add GSC query functions (5 calls, ~80 lines)
- Add GA4 query functions (4 calls, ~60 lines)
- Add social API functions (Bluesky + Mastodon, ~30 lines)
- Add caching layer (~20 lines)
- Add `pageGrowth()` function (~200 lines HTML)
- Add route + async handler (~10 lines)
- Update nav (~2 lines)

### Dependencies

No new npm packages required. All API calls use Node.js built-in `https` module. JWT signing uses `crypto.createSign()`. JSON parsing uses built-in `JSON.parse()`.

### Testing

After implementation:
1. Verify `/instructions` loads and shows CEO CLAUDE.md by default
2. Verify clicking each agent loads the correct file
3. Verify CEO edit mode: change text, save, verify file on disk changed
4. Verify non-CEO agents have no edit button
5. Verify `/growth` loads without errors
6. Verify GSC data appears (either from file or API)
7. Verify GA4 data appears (or graceful "N/A" if no data yet)
8. Verify social follower counts load
9. Verify caching works (second page load should be instant)
10. Verify API errors don't crash the page

---

## Security Checklist

- [ ] `/api/claude-md` POST only accepts `agent=ceo` — hardcoded check
- [ ] Agent key lookup uses registry, not file path construction
- [ ] No credential redaction needed for CLAUDE.md content (but apply it anyway as defense-in-depth)
- [ ] GA4/GSC API tokens never displayed in HTML
- [ ] API credentials read from `credentials/` at startup, never exposed to client
- [ ] All HTML output escaped via `escapeHtml()` / `marked` with sanitization
- [ ] CLAUDE.md content in textarea is HTML-escaped to prevent XSS
