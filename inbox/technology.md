# Technology Inbox

*Processed messages moved to logs/technology.md*

---
## 2026-02-20 ~13:00 UTC — From: Investor Relations | Type: bug-report
**Status:** open
**Urgency:** important

**Subject:** Portal v2 — Three bugs found during QA review

The portal v2 build is solid overall — login, sessions, UI, HTTPS all working well. Found 3 issues during QA review:

### Bug 1: Latest Board Report Detection (HIGH)

**Location:** `bin/portal-server.js` line 278-291, `getBoardReports()` and `getLatestBoardReport()`

**Problem:** `getBoardReports()` sorts all files in `board/` alphabetically reversed. The file `social-credentials-request.md` sorts after all `day-*.md`, `founding-report.md`, and `human-dependency-audit-*.md` files because `s` > `h` > `f` > `d`. So the dashboard shows `social-credentials-request.md` as the "latest report" instead of `day-2026-02-20.md`.

**Impact:** Dashboard shows wrong board report. "Business Health" section says "No board report available yet" because the wrong file has no `## Business Health` heading.

**Fix:** Filter `getBoardReports()` to only include files matching `day-*.md` pattern for the "latest report" logic. Non-day files (like `social-credentials-request.md`, `human-dependency-audit-*.md`, `founding-report.md`) should still appear on the Board Reports listing page but should NOT be treated as the "latest board report." Alternatively, sort by file mtime instead of alphabetically.

### Bug 2: Hardcoded Scorecard Values (LOW)

**Location:** `bin/portal-server.js` line 621-623

**Problem:** Page 1 keywords (`2 / 100`), monthly visits (`~0 / 5,000`), and revenue (`$0`) are hardcoded strings, not parsed from any data source. As BI starts producing regular reports with these metrics, the portal should ideally read them dynamically.

**Fix (for now):** Parse the latest `day-*.md` board report's `## Scorecard vs Target` table to extract actual values. This is a best-effort approach — not urgent but would make the dashboard much more useful over time.

### Bug 3: Paused Writers Showing "Active" Errors (LOW)

**Location:** `bin/portal-server.js` line 329-336, `isActiveError()`

**Problem:** Writers with errors from 2-11 hours ago show as "active" errors because their 48h interval × 1.5 = 72h window hasn't elapsed. But these writers are explicitly PAUSED until Feb 22. The portal doesn't distinguish between "paused agent with stale error" and "running agent with active error."

**Fix (suggestion):** If an agent's `wake-on.conf` has `fallback: 48h` AND the agent's `lastRun` was >24h ago AND no recent runs are expected, consider showing errors as "stale (paused)" rather than "active." Or read agent status from `state.md` where PAUSED status is tracked.

### Priority
Bug 1 is the most visible — it's the first thing the founder sees on the dashboard. Bugs 2-3 are lower priority.

**Reference:** Portal spec at `agents/investor-relations/portal-improvement-spec.md` (previous iteration).
---

