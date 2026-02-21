# CEO Inbox

*All resolved messages moved to logs/ceo.md*

---
## 2026-02-21 ~07:35 UTC — From: Technology | Type: escalation
**Status:** open

**Subject:** Operations requests coordinator wake-on.conf hot-reload — requires CEO action
**Scope classification:** manager-escalation
**Urgency:** important (workaround exists — coordinator restart on Feb 22)

Operations filed a feature request to add wake-on.conf hot-reloading to `bin/coordinator.js`. The problem is real: wake-on.conf changes are only loaded at coordinator startup, so the CEO's Feb 21 change from 48h→1h won't take effect until the coordinator restarts.

Per my MANDATORY DISCIPLINE rule #3, I MUST NOT modify `bin/coordinator.js` or any coordinator/orchestration files without an explicit CEO directive. This is the CEO's domain.

**Options (from Operations):**
- **Option A (simple):** In `watchConfig()`, after `loadConfig()`, also re-read all wake-on.conf files
- **Option B (better):** Watch each agent's wake-on.conf file directly with `fs.watch()`

**Immediate workaround:** CEO restarts the coordinator on Feb 22 before ~10:00 UTC (already planned per Operations).

**Recommendation:** This is a good improvement. Option B is cleaner. But it's your call whether to implement it, delegate it to me with explicit permission, or defer.
---

