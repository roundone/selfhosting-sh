# CEO Inbox

*All resolved messages moved to logs/ceo.md*

---
## 2026-02-20 ~05:35 UTC ??? From: Founder (Nishant) | Type: directive
**Status:** open
**Urgency:** CRITICAL

**Subject:** Technology agent is broken ??? diagnose and fix its CLAUDE.md

### The Problem

I've analyzed Technology's behavior over the last 4 days. The CEO log says "Technology has zero logged work since Feb 16" ??? but that's not the full picture. Technology IS running and committing (20+ commits since Feb 18). The problem is deeper:

1. **Not logging.** Technology stopped writing to `logs/technology.md` after Feb 16. Its last log entry is iteration 5 at 09:28 UTC Feb 16. This means YOU (the CEO) can't see what it's doing, and neither can I.

2. **Not processing its inbox.** Technology has 12 unprocessed messages spanning 4 days, including the CRITICAL search fix directive from Feb 16. It's ignoring its inbox entirely.

3. **Doing unstructured work.** Its most recent commit (444ea70) modified `bin/coordinator.js` and tweaked 2 content files. It's doing random work instead of prioritizing the open directives.

4. **Turbulent runs.** In the last 24 hours alone: 1 OOM kill (code=137), 1 error exit (code=1 after only 91 seconds), 2 SIGTERM kills, 1 timeout (code=124). It's not completing clean iterations.

5. **3 founder directives still untouched after 4 days:**
   - CRITICAL: Fix broken site search
   - HIGH: Install Playwright MCP
   - MEDIUM-HIGH: Build status dashboard

### What I Want You To Do

1. **Edit Technology's CLAUDE.md** (`agents/technology/CLAUDE.md`) to enforce discipline:
   - Technology MUST process its inbox at the start of every iteration and log what it found
   - Technology MUST write a summary to `logs/technology.md` at the end of every iteration (what it did, what it committed, what's still open)
   - Technology MUST prioritize inbox items by urgency before doing any self-directed work
   - Technology MUST NOT modify coordinator.js, run-agent-once.sh, or other infrastructure scripts without a directive from the CEO. Its job is the WEBSITE and the VPS environment, not the agent orchestration layer.

2. **Clear Technology's inbox** ??? consolidate the 12 messages into a single prioritized directive. The current inbox is overwhelming and Technology is clearly ignoring it. Give it ONE clear mission: fix search THIS iteration, then Playwright MCP next iteration, then dashboard.

3. **Send me a board report** after you've made these changes. I haven't received a board report in my email for days (only got the Feb 16 and Feb 20 ones). Board reports must be emailed DAILY regardless of what else is happening.

### Infrastructure Update

The system has been upgraded while you were offline:
- **VPS upgraded to 8GB RAM** (was 4GB)
- **Coordinator v2.0 deployed** with: global concurrency limit (4 agents max), memory gate (800MB min free), writer concurrency limit (2 max), 5-minute min iteration gap, staggered fallbacks (1 agent per cycle), CEO-configurable via `config/coordinator-config.json`
- **Writer fallback changed from 30min to 8h** ??? sustainable pace instead of resource exhaustion
- **Git safety added** ??? non-technology agents can't commit to bin/, zero-byte file guard prevents truncation, protected files check as belt+suspenders
- **Post-commit hook rate limited** ??? 5-minute cooldown prevents event cascade
- **OOM protection** ??? coordinator and proxy have OOMScoreAdjust=-500 so Linux kills agents before infrastructure

You can tune concurrency limits by editing `config/coordinator-config.json` (hot-reloaded, no restart needed).
---

