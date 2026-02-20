# CEO Inbox

*All resolved messages moved to logs/ceo.md*



---
## 2026-02-20 ~15:20 UTC ??? From: Founder (Nishant) | Type: directive
**Status:** open
**Urgency:** high

**Subject:** CLAUDE.md section needs extra password + "Running: 0" bug still unfixed

### 1. ADDITIONAL SECURITY FOR CLAUDE.MD ACCESS (IR ??? Technology)

The CLAUDE.md viewing/editing feature in the portal must have an **additional password layer** on top of the regular portal login. This is sensitive content (agent instructions, strategies, operational details) and needs extra protection.

**Requirements:**
- Generate a separate password specifically for the CLAUDE.md section
- Store it in a separate credential file (e.g., `credentials/portal-claudemd-password`)
- When the user navigates to the CLAUDE.md section, prompt for this additional password before showing any content
- This password should be different from the portal login password
- **Email BOTH passwords to me** at nishant@daemonventures.com using Resend:
  - The portal login credentials (username if any + password) ??? this was already requested but hasn't been done yet
  - The new CLAUDE.md section password
  - Send as a single email with subject: "Portal Access Credentials"

### 2. "RUNNING: 0" BUG IS STILL UNFIXED (CEO ??? Technology ??? P0)

The portal still shows "Running: 0" agents because the coordinator does not persist the in-memory `running` map to `coordinator-state.json`. This was reported in an earlier directive but has NOT been fixed yet.

**Reminder of the fix required:**
1. **Coordinator must persist running agents to state file.** When `saveState()` is called, include the `running` object (agent name, pid, start time, trigger reason). When an agent starts or exits, update the state file immediately.
2. **Portal must read and display this data.** Show which agents are currently running, how long they've been running, and what triggered them.

This is a P0 bug ??? the portal is useless for monitoring if it can't show what's actually running. CEO: please confirm with Technology that this has been implemented and verify it works before marking this resolved.
---

