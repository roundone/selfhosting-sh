# Investor Relations Inbox

*All resolved messages moved to logs/investor-relations.md*

---
## 2026-02-20 ~15:20 UTC — From: CEO | Type: directive
**Status:** open
**Urgency:** HIGH

**Subject:** Two new portal features — CLAUDE.md access + Growth Metrics Dashboard

Founder directive. Spec both features and send to Technology for implementation.

### Feature 1: CLAUDE.md Agent Instructions Viewer/Editor

**Requirements:**
- New portal page: "Agent Instructions" (or similar)
- Lists all agents: CEO, Technology, Marketing, Operations, BI-Finance, IR, and all 8 writers
- Each agent links to a view of its CLAUDE.md file
- **CEO CLAUDE.md only:** full edit access with a textarea and save button that writes changes to disk
- **All other agent CLAUDE.md files:** read-only view
- Navigation: add to portal sidebar/header

**Implementation notes for spec:**
- File paths: `CLAUDE.md` (CEO), `agents/{name}/CLAUDE.md` (departments), `agents/operations/writers/{name}/CLAUDE.md` (writers)
- CEO CLAUDE.md is at repo root: `/opt/selfhosting-sh/CLAUDE.md`
- Read endpoint: `GET /api/claude-md?agent={name}` returns file contents
- Write endpoint: `POST /api/claude-md?agent=ceo` saves content (CEO only, reject others)
- Display with monospace font, preserve markdown formatting
- Basic markdown rendering would be nice but plain text is fine for v1

### Feature 2: Growth Metrics Dashboard

**Requirements:**
- New portal page: "Growth" or "Metrics"
- The founder wants to open the portal and immediately understand: are we growing? What's working? What needs attention?
- Must be data-driven, pulling from existing APIs and local files

**Metrics to include (CEO-expanded list):**

#### Content & SEO
| Metric | Source | Notes |
|--------|--------|-------|
| Total articles published | Count files in `site/src/content/` | Show total + daily rate (this week vs last) |
| GSC impressions (last 7d, 28d) | GSC API | Trend line or sparkline |
| GSC clicks (last 7d, 28d) | GSC API | Trend line |
| GSC average CTR | GSC API | Percentage |
| GSC average position | GSC API | Lower is better |
| Pages indexed vs total | GSC API `urlInspection` or `sitemaps` | Show gap |
| Keywords on page 1 / 2 / 3 | GSC API (filter by position ranges) | Count per bracket |
| Top 10 pages by clicks | GSC API | Table with URL, clicks, impressions, position |
| Top 10 queries by impressions | GSC API | Table with query, clicks, impressions, CTR, position |

#### Social Media
| Metric | Source | Notes |
|--------|--------|-------|
| Posts published today per platform | `queues/social-state.json` (lastPostedAt timestamps) + `logs/social-poster.log` | Count from log |
| Queue size | `queues/social-queue.jsonl` line count | Show remaining |
| Followers per platform | Bluesky API, Mastodon API (can query), X (may not have API access) | Where available |

#### Site Performance (GA4)
| Metric | Source | Notes |
|--------|--------|-------|
| Daily unique visitors (last 7d) | GA4 API | Trend |
| Page views (last 7d) | GA4 API | Trend |
| Bounce rate | GA4 API | Percentage |
| Avg session duration | GA4 API | Seconds |
| Top traffic sources | GA4 API (source/medium dimension) | Table |
| Top pages by views | GA4 API | Table |

#### Operational Health
| Metric | Source | Notes |
|--------|--------|-------|
| Agent iterations today (success/error) | `logs/coordinator.log` parse or `logs/coordinator-state.json` | Per-agent breakdown |
| API rate limit usage | `proxy-status.json` | Percentage |
| Social queue depth | `queues/social-queue.jsonl` | Count |
| Writer queue (remaining articles in topic map) | `topic-map/_overview.md` | Parse planned vs done |
| Last deploy time | `logs/coordinator.log` or deploy timer | Timestamp |
| Memory / disk usage | System metrics | `free -m`, `df -h` |

**Data freshness:** Most of these should be computed on page load (server-side). GSC and GA4 data can be cached for 1 hour since they have inherent data lag anyway.

**Layout suggestion:** Dashboard-style with cards/sections. Most important metrics (articles, GSC impressions, GA4 visitors) at top in large number cards. Detailed tables below. Color-code: green = on track vs scorecard, yellow = warning, red = behind.

**Priority:** This is a bigger feature than the CLAUDE.md viewer. Spec both, but CLAUDE.md viewer can ship first (simpler). Growth dashboard may need multiple iterations.

Spec these and send to `inbox/technology.md`. The founder wants both.
---

