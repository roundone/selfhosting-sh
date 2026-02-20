# CEO Inbox

*All resolved messages moved to logs/ceo.md*

---
## 2026-02-20 06:20 UTC — From: BI & Finance | Type: fyi
**Status:** resolved (CEO processed 06:45 UTC)

**Subject:** Daily report updated (iter 15) — first follower, social poster stalling, 647 articles

Full report at `reports/day-2026-02-20.md`.

**CEO actions taken:**
- Social poster intervals reduced (X: 60→15 min, Bluesky: 30→10 min) — expected 4x throughput increase
- Writer wake-on.conf files fixed (8h→1h) — 5 idle writers will restart within the hour
- Board report updated with latest data
---


---
## 2026-02-20 ~07:00 UTC ??? From: Founder (Nishant) | Type: directive
**Status:** open
**Urgency:** high

**Subject:** Month 1 target revision + human dependency audit + Playwright-first policy

### 1. Month 1 Article Target: Revised to 1,500

The board approves a downward revision of the Month 1 article target from 5,000 to **1,500**. Update the scorecard, strategy docs, and all agent CLAUDE.md files that reference this target. The 5,000 target moves to Month 2.

### 2. Human/Board Dependency Audit

I need a complete list of everything that is currently blocked on human action. For each item:
- What is needed
- Why it's needed (what it unblocks)
- **Exact step-by-step instructions** for what the human needs to do (assume I'm sitting at my computer ready to do it ??? give me URLs to click, buttons to press, fields to fill in, values to paste)

Don't just say "enable GA4 API" ??? tell me exactly which URL to go to, which project to select, which API to enable, what to click. Make it copy-paste ready.

### 3. Playwright-First Policy

Before escalating anything to a human, you must first determine whether it can be done via Playwright browser automation. If Playwright MCP is installed and working, USE IT. Only escalate to the founder if:
- The task requires credentials/passwords the system doesn't have
- The task requires payment or legal authorization
- The task requires physical-world action
- Playwright was attempted and failed (explain why)

This applies to all agents. Update any relevant CLAUDE.md files with this policy.
---


---
## 2026-02-20 ~07:10 UTC ??? From: Founder (Nishant) | Type: directive
**Status:** open
**Urgency:** high

**Subject:** Create new department ??? Investor Relations / Board Portal

### What I Want

Create a new department called **Investor Relations** (or "Board Relations" ??? you decide the best name). This department's sole purpose is to serve the board/founder by maintaining a **web portal** that gives me everything I need to monitor the business at a glance, without having to SSH into the VPS or ask you questions.

### Department Structure

Set this up exactly like your other departments:
- Create `agents/investor-relations/CLAUDE.md` with full operating instructions
- Create `inbox/investor-relations.md`
- The coordinator will auto-discover it (it finds any `agents/*/CLAUDE.md`)
- Reports to the CEO, just like Technology, Marketing, Operations, BI-Finance

### What the Portal Should Include

Think about what I, as the sole board member and founder, need to see. At minimum:

1. **Board reports** ??? all past board reports, newest first, rendered nicely
2. **CEO inbox** ??? current contents, plus a mechanism to submit new messages (a form that appends to the inbox file)
3. **Agent activity** ??? which agents are running, when they last ran, their recent log entries, error counts
4. **Key metrics dashboard** ??? article count, Google impressions, social followers, articles by category, velocity (articles/day), uptime
5. **Recent commits** ??? what's been happening in the repo
6. **System health** ??? memory, disk, proxy stats, coordinator status
7. **Alerts/escalations** ??? anything requiring human action, prominently displayed

### How This Department Works

1. **Phase 1 (now):** The IR department designs the portal ??? what pages, what data, what layout. It writes a detailed spec and sends it to Technology's inbox as a build request. Technology builds it. IR reviews, iterates, sends feedback. This may take several iterations.

2. **Phase 2 (steady state):** Once the portal is built and working, the IR department switches to a **weekly cadence** (set its wake-on.conf fallback to something like 168h / 1 week). Each week it reviews: has the business changed? Are there new metrics to surface? New report types? Should the portal layout change? It sends incremental update requests to Technology as needed.

3. **Ongoing:** The IR department also monitors whether board reports are actually being delivered (email delivery confirmation), whether the portal data is fresh, and whether any escalations have been sitting unacknowledged.

### Security Requirements

**This is critical.** The portal exposes operational data and has write access (inbox submission). It MUST have:
- Authentication (at minimum: HTTP basic auth with a strong password, or better: token-based auth)
- HTTPS (or at least only accessible via SSH tunnel / specific IP whitelist)
- The inbox submission form must sanitize input (no injection attacks)
- No sensitive credentials (API keys, passwords) should ever be displayed on the portal
- Rate limiting on the submission form

The IR department should specify security requirements in its spec to Technology. Don't cut corners on this ??? I'd rather have a delayed portal than an insecure one.

### Important Notes

- The IR department should think creatively about what I need. Don't just build what I listed above ??? think about what a founder/investor would want to see. Anticipate my questions.
- The portal replaces the need for me to SSH in and grep logs. It should be THAT comprehensive.
- The existing Technology-built dashboard (if any) at :8080 can be folded into this or replaced ??? up to you and IR to decide.
- The IR department's CLAUDE.md should explicitly state that it does NOT build anything itself ??? it specs, reviews, and iterates. Technology builds.
---

