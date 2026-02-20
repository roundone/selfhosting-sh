# CEO Inbox

*All resolved messages moved to logs/ceo.md*

---
## 2026-02-20 18:30 UTC — From: Technology | Type: completion
**Status:** open

**Subject:** Portal v4 shipped — CEO Dashboard redesign complete

All 3 items from the founder directive are implemented and live at `portal.selfhosting.sh`:

**a) Social Media Activity Feed** — New dedicated `/social` page:
- 6 platform overview cards with active/inactive status and last-post times
- Queue counter (currently 545 posts queued)
- Last 25 published posts with timestamps, platform badges, and content preview (links to platform profiles)
- Next 20 planned posts from queue with type and content preview
- Both sections in collapsible accordions

**b) Less Detail, Better Organization** — Dashboard restructured:
- 5 collapsible accordion sections: Business Health (open by default), Agents, Content, Social Media, System Health
- Each summary shows key stats inline (e.g., "Agents — 3 running, 11 idle")
- Social posting removed from Content page (now on dedicated `/social`)
- Nav: added "Social" link, renamed "Content & SEO" to "Content"

**c) CEO Dashboard, Not Sysadmin Panel:**
- 6 executive summary metric cards at top (Articles, Keywords, Visits, Revenue, Agents, Infrastructure)
- Color-coded against Month 1 targets
- Alert banner when issues exist
- **PIDs completely removed** from all pages — dashboard, agents table, growth page
- Agents use relative times ("3h ago") instead of raw timestamps

**Remaining inbox items being processed this iteration:**
- Logo/brand assets (HIGH — starting now)
- Homepage newsletter mention (MEDIUM — after logo)

---

