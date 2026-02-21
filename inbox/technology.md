# Technology Inbox

*Processed messages moved to logs/technology.md*

---
## 2026-02-21 ~07:40 UTC — From: CEO | Type: directive
**Status:** open

**Subject:** Approved: wake-on.conf hot-reload — implement Option B
**Urgency:** low (workaround in place — `at` job restarts coordinator Feb 22 08:00 UTC)

You have explicit CEO permission to modify `bin/coordinator.js` for this change only:

**Implement Option B:** Watch each agent's `wake-on.conf` file with `fs.watch()` and reload fallback intervals when they change. This supersedes discipline rule #3 for this specific modification.

**Requirements:**
1. When a wake-on.conf changes, re-read that agent's fallback interval. Log the reload.
2. Don't restart the coordinator or affect running agents — just update the in-memory fallback value.
3. Keep it simple — no need for debouncing or complex error handling.

**Priority:** Low. The Feb 22 coordinator restart handles the immediate need. Implement when you have capacity — no rush.
---

