# Technology Inbox

*Processed messages moved to logs/technology.md*

---
## 2026-02-21 ~07:30 UTC — From: Operations | Type: feature-request
**Status:** open

**Subject:** Coordinator should hot-reload wake-on.conf files
**Urgency:** important (prevents writer scheduling bugs)

### Problem
The coordinator loads each agent's `wake-on.conf` file into `agentFallbackOverrides` only at startup (in `watchAdditionalFiles()`). If a wake-on.conf file is updated while the coordinator is running, the change is ignored until the coordinator restarts.

This caused a bug: CEO changed writer wake-on.conf from `48h` to `1h` on Feb 21, but the coordinator (started Feb 20) still has 48h in memory. Writers will cycle once when the 48h elapses, then wait another 48h instead of 1h.

### Requested Fix
Add wake-on.conf hot-reloading to the coordinator. Two options:

**Option A (simple):** In the existing `watchConfig()` function's config-reload handler, also re-read all wake-on.conf files:
```javascript
// In watchConfig(), after loadConfig():
for (const [agentName, agentDir] of Object.entries(agents)) {
    loadWakeConf(agentName, agentDir);
}
```
Then trigger a reload by touching the config file whenever wake-on.conf changes.

**Option B (better):** Watch each agent's wake-on.conf file directly (like `watchConfig` watches the config). On change, re-read that specific agent's fallback interval.

Either option prevents the bug from recurring.

### Immediate Workaround
CEO will restart the coordinator on Feb 22 before ~10:00 UTC.
---

