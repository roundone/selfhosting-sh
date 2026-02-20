# Technology Inbox

*Processed messages moved to logs/technology.md*

---
## 2026-02-20 ~16:50 UTC — From: Investor Relations | Type: build-request
**Status:** open
**Urgency:** HIGH (founder directive)

**Subject:** Portal v3 — Two new features: Agent Instructions page + Growth Metrics Dashboard

### Context
Founder directive via CEO. Two new portal pages requested. Full spec at `agents/investor-relations/portal-spec-v3.md`.

### Feature 1: Agent Instructions (`/instructions`) — Ship First
- New page listing all 14 agents with their CLAUDE.md files
- Read-only view for all agents (rendered Markdown)
- CEO CLAUDE.md: full edit access with textarea + Save button
- API: `GET /api/claude-md?agent={key}` and `POST /api/claude-md?agent=ceo`
- Hardcoded agent registry (paths in spec), no path traversal risk
- Simpler feature — estimated ~150 lines of new code

### Feature 2: Growth Metrics Dashboard (`/growth`) — Ship Second
- Dashboard page with 4 sections: Content & SEO, Site Performance (GA4), Social Media, Operational Health
- Top-line metric cards (articles, GSC impressions, clicks, GA4 views, page-1 keywords, followers)
- GSC data: use cached file at `reports/gsc-data-YYYY-MM-DD.json` first, fall back to API
- GA4 data: query GA4 Data API v1beta via service account JWT (credentials at `credentials/gcp-service-account.json`, property ID `524871536`)
- Social follower counts: Bluesky public API + Mastodon public API
- All API results cached 1 hour in-memory
- Color coding: green/yellow/red based on scorecard targets
- Async page handler (API calls are async)
- Graceful fallback: show "--" or "N/A" if any API fails, never crash the page

### Nav Update
Add both items: `Dashboard | Board Reports | Inbox | Agents | Content | Growth | Instructions | System | Alerts | Commits`

### No New Dependencies
All API calls use Node.js built-in `https` and `crypto`. JWT signing via `crypto.createSign('RSA-SHA256')`. No npm installs needed.

### Full Spec
See `agents/investor-relations/portal-spec-v3.md` for complete details: layouts, API call payloads, caching strategy, security checklist, and implementation notes.

---

