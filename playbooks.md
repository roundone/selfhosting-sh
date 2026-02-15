# Operational Playbooks — selfhosting.sh

Referenced from the CEO CLAUDE.md. These playbooks contain detailed protocols, templates, and file formats used during specific operations.

---

## Execution Infrastructure

### The VPS

All agents run on a single VPS via a **headless iteration loop**. The VPS is the "home" of the business — it's where the agents live, work, and communicate.

**What runs on the VPS:**
- A git clone of the selfhosting.sh repo (the working directory for all agents)
- One agent runner process per department head (4 total) + one for the CEO
- Each agent runner is a bash wrapper that repeatedly invokes Claude Code in headless mode (`-p` flag)
- systemd supervises the runner scripts (restarts if the wrapper itself crashes)
- Sub-agent processes spawned by department heads as needed

**Why headless iterations, not persistent interactive sessions:**

A persistent Claude Code process can freeze — it asks a permission question, a clarification, or hits an auth prompt, and nobody responds. That department is dead until a human notices. The headless iteration model eliminates this:

- **No interactive prompts.** The `-p` flag runs Claude Code in headless mode. It cannot ask questions or wait for input.
- **`--allowedTools` pre-authorizes tools.** No permission prompts ever appear.
- **Fresh context every iteration.** No context overflow. Each run reads all state from files.
- **Timeout protection.** If a single iteration hangs for any reason, the timeout kills it and the loop continues.
- **Automatic recovery.** If Claude Code crashes or errors, the wrapper logs it, waits, and tries again. If the wrapper itself crashes, systemd restarts it.

All state lives in files (inbox, logs, learnings, state.md, topic-map). Nothing is lost between iterations. This is the key design guarantee — no agent carries state in memory that isn't also on disk.

**Agent runner script** (`/opt/selfhosting-sh/bin/run-agent.sh`):
```bash
#!/bin/bash
# Usage: run-agent.sh <agent-dir> [max-runtime-seconds]
# Example: run-agent.sh /opt/selfhosting-sh/agents/operations 3600

AGENT_DIR="${1:?Usage: run-agent.sh <agent-dir>}"
MAX_RUNTIME="${2:-3600}"  # Default: 1 hour max per iteration
LOG="/opt/selfhosting-sh/logs/supervisor.log"

cd "$AGENT_DIR" || exit 1

while true; do
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) — Starting iteration in $AGENT_DIR" >> "$LOG"

    timeout "$MAX_RUNTIME" claude -p \
        "Read CLAUDE.md. Execute your operating loop — do as much work as possible. Push hard toward the targets. When your context is getting full, write all state to files and exit cleanly so the next invocation can continue." \
        --dangerously-skip-permissions

    EXIT_CODE=$?

    if [ $EXIT_CODE -eq 124 ]; then
        echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) — TIMEOUT ($AGENT_DIR) after ${MAX_RUNTIME}s" >> "$LOG"
    elif [ $EXIT_CODE -ne 0 ]; then
        echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) — ERROR ($AGENT_DIR) code=$EXIT_CODE" >> "$LOG"
        sleep 30  # Longer pause on errors to avoid tight failure loops
    else
        echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) — COMPLETED ($AGENT_DIR)" >> "$LOG"
    fi

    sleep 10
done
```

**systemd service** (one per agent):
```ini
[Unit]
Description=selfhosting.sh - Head of Operations
After=network.target

[Service]
Type=simple
ExecStart=/opt/selfhosting-sh/bin/run-agent.sh /opt/selfhosting-sh/agents/operations 3600
Restart=always
RestartSec=30
User=selfhosting

[Install]
WantedBy=multi-user.target
```

**Health monitoring (CEO responsibility):**
The CEO's operating loop includes checking that all department head services are running and producing output. Specifically:
- Check systemd status of all 4 department services
- Check log file timestamps — if a department hasn't logged anything in 2+ hours during work periods, investigate
- If a service is stopped or stuck, restart it and log the incident
- If auth has expired (repeated error exits), escalate to board report as `Requires: human`

**Git workflow:**
- Agents work on local files in the repo clone
- Periodic git commit + push to GitHub (for backup, visibility, and history)
- Technology designs the commit strategy to prevent conflicts (e.g., agents only modify their own files, pull-before-push with auto-merge)
- The GitHub repo is the backup and visibility layer — the VPS working directory is the source of truth for running agents

**Sub-agent spawning:**
When a department head spawns a sub-agent, it:
1. Creates the sub-agent's CLAUDE.md (e.g., `agents/operations/writers/photo-management/CLAUDE.md`)
2. For permanent sub-agents: creates a runner script entry and systemd service (same pattern as department heads)
3. For project sub-agents: runs `claude -p "Read CLAUDE.md. Execute your scope fully — push hard, do maximum work. Write results to your parent's inbox when done." --dangerously-skip-permissions` — a single headless run that exits when scope is complete

---

## Spawning Protocol

This is the CEO's most important skill. Every agent created will operate autonomously — they'll read their CLAUDE.md and execute without further input. The quality of their CLAUDE.md determines the quality of their work.

### Step 1: Define the Outcome

Start with what success looks like, not what tasks to perform.

**Bad:** "Write 10 articles per day about self-hosting apps."
**Good:** "Every self-hosting app category has complete coverage: individual setup guides for all major apps, pairwise comparisons, a roundup page, and 'Replace [Service]' guides for all major cloud services the category replaces."

The agent should be able to look at the outcome and determine for themselves what work to do next.

### Step 2: Create the Agent's Folder and CLAUDE.md

```
agents/
└── [agent-name]/
    └── CLAUDE.md
```

### Step 3: Write the CLAUDE.md

Every agent CLAUDE.md must contain these sections, in this order:

```markdown
# [Agent Name]

## Your Role
[One paragraph. Who you are, what outcome you own, who your manager is.]

## Sacrosanct Directives
[Things this agent CANNOT change without escalating to its manager.
These cascade down — inherited from the CEO's sacrosanct list plus
any this manager adds.]

## Business Context
[Cascaded from the CEO. What selfhosting.sh is, who the audience is,
what the voice is. 10-15 lines max.]

## Your Outcome
[The specific outcome this agent owns. Measurable. Clear completion
criteria.]

## How You Work
[Detailed operational instructions. Templates, rules, strategies,
procedures. Be specific — the agent should never have to guess.]

## What You Read
[Exact files this agent reads. Paths relative to repo root.]

## What You Write
[Exact files this agent creates or modifies.]

## Scope Boundaries
[What this agent decides autonomously. What gets escalated.
What belongs to a peer department.]

## What You Can and Cannot Change
[Sacrosanct items (inherited + agent-specific) and what it can
freely modify. Must cascade this to any sub-agents.]

## Spawning Sub-Agents
[When to spawn, what context to give, constraints.
Or: "Do not spawn sub-agents."]

## Your Operating Loop
[The agent's continuous loop. Not "session protocol" — a persistent
daemon loop: work → check inbox → work → listen → repeat.]

## Operating Discipline
[Quality rules, error handling, learnings protocol — from the
Operating Discipline section below, plus agent-specific additions.]
```

### Step 4: Set Up Communication

Every agent communicates through shared files in the repo root.

```
state.md              — business state dashboard

inbox/                — per-agent message boxes
├── ceo.md
├── technology.md
├── marketing.md
├── operations.md
└── bi-finance.md

logs/                 — per-agent activity logs
├── ceo.md
├── technology.md
├── marketing.md
├── operations.md
└── bi-finance.md

learnings/            — domain-specific knowledge base
├── apps.md           — app config discoveries, deprecations, version changes
├── toolchain.md      — Astro, Cloudflare, Pagefind, git
├── seo.md            — what works/doesn't for rankings
├── content.md        — writing approaches, templates, formatting
└── failed.md         — failed approaches from any domain

topic-map/            — per-category content queues
├── _overview.md      — summary: all categories, completion %, priority order
├── photo-management.md
├── file-sync.md
├── media-servers.md
├── ...               — one file per category
├── hardware.md
└── foundations.md

reports/              — daily reports (BI & Finance writes, CEO reads)
board/                — board reports (CEO writes, Nishant reads)
```

### What Context to Cascade

| Context | Who Gets It |
|---------|-------------|
| Mission & goal | Everyone (verbatim) |
| Business overview (what, audience, voice) | Everyone (condensed) |
| Revenue model | Operations (affiliate rules), Technology (ad placement), BI & Finance |
| Brand identity | Technology (full detail), Marketing (voice only) |
| SEO strategy | Marketing (full detail), Operations (on-page rules only) |
| Content categories & templates | Operations (full detail) |
| Site architecture | Technology (full detail) |
| Social strategy | Marketing (full detail) |
| Metric definitions | BI & Finance (full detail), CEO (summary) |

**Rule of thumb:** Give each agent everything it needs to do its job independently, and nothing that would distract from its focus.

---

## Updating Agent Instructions

Creating agents is only half the CEO's job. Running agents need their instructions refined as the business learns and evolves.

### When to Update

- **Performance gap.** Agent output is below expectations — articles are low quality, rankings aren't improving, deploys keep failing.
- **Strategy shift.** CEO reprioritizes (e.g., focus on 5 categories instead of 30, change social media approach).
- **New learning.** Something discovered via `learnings/` or direct observation that should change how an agent works.
- **Scope change.** Agent needs new responsibilities or should shed existing ones.
- **Recurring issues.** Same problem keeps appearing in an agent's work — add a rule to prevent it.
- **Board directive.** Nishant approved or rejected something that affects an agent's instructions.

### How to Update

1. **Read the agent's current CLAUDE.md in full.** Understand what's there before changing anything.
2. **Review the department spec** in `departments.md`. Make sure your change is consistent with the overall department design.
3. **Identify the minimum change.** Don't rewrite the whole file when adjusting one rule. Surgical edits are safer.
4. **Preserve sacrosanct sections.** Never remove or weaken inherited sacrosanct items.
5. **Make the edit.**
6. **Write to the agent's inbox** explaining what changed and why:
   ```markdown
   ---
   ## [Date] — From: CEO | Type: directive
   **Status:** open

   **Subject:** CLAUDE.md updated — [summary of change]

   Your instructions have been updated. Key changes:
   - [Change 1]: [what changed and why]
   - [Change 2]: [what changed and why]

   These changes take effect immediately (you are a persistent process — re-read your CLAUDE.md now).
   ---
   ```
7. **Log the change** in `logs/ceo.md` — which agent, what changed, why, expected impact.
8. **Monitor.** Review the agent's log after the change to confirm it took effect.

### What to NEVER Do

- **Don't remove inherited sacrosanct items.** If the Board protects "voice", the CEO cannot remove that protection from any agent's CLAUDE.md.
- **Don't change multiple agents simultaneously without considering interdependencies.** If you expand Marketing's scope, does Operations need to know? Think through ripple effects.
- **Don't change an agent's outcome without updating health indicators.** If Operations' outcome shifts, the CEO's health indicator thresholds may need adjustment.

### Cascading Updates

When the CEO updates a department head's CLAUDE.md, and that department head has active sub-agents:

- **If the change affects sub-agents** (e.g., new quality rules, new sacrosanct items): Note in the inbox message that the department head must cascade the change to sub-agents.
- **If the change doesn't affect sub-agents** (e.g., reporting format change): No cascade needed.
- **Rule:** Department heads follow the same update protocol for their sub-agents.

---

## Daily Report Format

BI & Finance produces a daily report in `reports/day-YYYY-MM-DD.md`. This business operates on AI timelines — daily reports ensure course corrections happen fast enough to matter.

```markdown
# Daily Report — [date]

## Scorecard
[Current metrics vs targets from the Mission scorecard]

## Content
- Articles published today: [n]
- Articles published this month: [n]
- Total articles: [n]
- Categories fully covered: [n] / [total]
- Articles with quality issues flagged: [n]

## SEO
- New page 1 keywords (24h): [n]
- Total page 1 keywords: [n]
- Organic traffic today: [n]
- Top performing articles: [list]
- Biggest ranking drops: [list]

## Social
- Posts published today: [n] (by platform)
- New followers today: [n] (by platform)
- Total followers: [n]
- Click-throughs to site: [n]
- Top performing posts: [list]

## Revenue & Finance
- Affiliate revenue today: $[n]
- Ad revenue today: $[n]
- Total revenue this month: $[n]
- Total expenses this month: $[n]
- P&L this month: $[n]

## Competitive Intelligence
- Notable competitor moves: [list]
- Keywords lost to competitors: [list]
- Content gaps identified: [list]

## Stale Content Alerts
- Articles needing update (version changes detected): [list with details]

## Issues & Escalations
[Any open escalations or unresolved issues]

## Recommendation
[What should the CEO focus on today?]
```

---

## Communication & Shared State

All shared files live in the repo root. They're split by purpose and by agent to prevent bottlenecks and concurrent write conflicts.

### state.md

The CEO's dashboard. CEO owns the structure; each department updates only its own section.

```markdown
## Current Phase: [Bootstrap | Awaiting Founding Approval | Launch | Operate]
## Last Updated: [date]

## Content
- Categories complete: [n] / [total]
- Articles published: [n]
- In progress: [list]

## Site
- Status: [building | live | maintenance]
- Last deploy: [date]
- Issues: [list or "none"]

## SEO & Marketing
- Last audit: [date]
- Page 1 keywords: [n]
- Priority gaps: [list]
- X followers: [n]

## Revenue & Finance
- Monthly revenue: $[n]
- Active revenue sources: [list]
- Monthly expenses: $[n]

## Budget — [Month]
- API spend: covered by DV allocation
- Tools/services:
  - [Tool 1]: $[amount]/month — approved [date]
  - Total: $[amount] / $200

## Execution Environment
- VPS status: [healthy | degraded | down]
- Agent processes: [4/4 running | list any down]
- Last git push: [date/time]

## Blockers
- [Anything preventing progress, tagged to responsible department]
```

### inbox/ — Communication Protocol

Each agent has its own inbox file. All non-board communication uses this.

**Sending:** Write to the recipient's inbox file.
**Receiving:** Read your own inbox on every loop iteration. Process before proactive work.
**Routing:** Upward (worker → dept head → CEO), downward (CEO → dept head → worker), and lateral (dept head → dept head) all use the same mechanism.

**Message format:**

```markdown
---
## [Date] — From: [Agent] | Type: [escalation|request|fyi|directive|purchase-request]
**Status:** open

**Subject:** [one line]

[Message body — context, detail, what you need from the recipient]

### Response — [Date] — [Recipient]
[Response content]
**Status:** resolved
---
```

**Inbox hygiene:** Move resolved messages to your log file at regular intervals. Inbox = open items only.

**Sub-agent inboxes:** Workers use the department head's inbox for escalations by default. If a worker's scope warrants its own inbox, the department head creates one.

### logs/ — Per-Agent Activity Logs

Each agent writes only to its own log file.

**Format:**

```markdown
## [Date]

### [Action taken]
- What: [description]
- Result: [outcome]
- Files changed: [list]
- Next: [what follows]
```

### learnings/ — Domain-Specific Knowledge Base

Split by topic, not by agent.

**Who reads what:**

| Agent | Reads |
|-------|-------|
| Operations + content writers | `apps.md`, `content.md`, `failed.md` |
| Technology | `toolchain.md`, `failed.md` |
| Marketing | `seo.md`, `apps.md`, `failed.md` |
| BI & Finance | `seo.md`, `failed.md` |
| CEO | All of them |

**Entry format:**

```markdown
### [Topic] — [date] — [agent that discovered it]
[Specific finding. Include version numbers, config keys, error messages, URLs.]
```

**Rules:**
- Write learnings immediately when discovered.
- Be specific. Bad: "Immich config is tricky." Good: "Immich v1.99+ requires `UPLOAD_LOCATION` to be an absolute path — relative paths silently fail."
- Check relevant learnings files before doing related work.
- `failed.md` is the most important file. Everyone reads it.

### topic-map/ — Per-Category Content Queues

One file per category, plus an overview.

**_overview.md format:**

```markdown
## Category Priority Order

1. [Category] — [n]/[total] complete — **Priority: high**
2. [Category] — [n]/[total] complete — **Priority: high**
3. [Category] — [n]/[total] complete — **Priority: medium**
...

## Summary
- Total articles planned: [n]
- Total articles published: [n]
- Categories fully complete: [n] / [total]
```

**Per-category file format:**

```markdown
# Photo & Video Management [3/12 complete]
**Priority:** high
**SEO notes:** [annotations from Marketing]

## Apps
- [x] /apps/immich — published 2026-03-01
- [x] /apps/photoprism — published 2026-03-02
- [ ] /apps/librephotos — queued
- [ ] /apps/lychee — queued

## Comparisons
- [x] /compare/immich-vs-photoprism — published 2026-03-03
- [ ] /compare/immich-vs-librephotos — queued

## Roundup
- [ ] /best/photo-management — queued (write after all app guides done)

## Replace Guides
- [ ] /replace/google-photos — queued
- [ ] /replace/icloud-photos — queued
```

**Ownership:** Operations owns the structure and execution. Marketing annotates with SEO priorities. CEO reviews `_overview.md` for progress tracking.

---

## Operating Discipline (Universal)

These rules apply to EVERY agent. Include them (or the relevant subset) in every agent's CLAUDE.md.

### Logging

- **Every loop iteration with significant work gets logged** in your log file (`logs/[your-agent].md`).
- **Every failure gets logged.** Even if you fix it immediately.
- **Never silently skip a failure.**

### Communication

- **Read your inbox** on every loop iteration. Process all open messages before proactive work.
- **Write to the recipient's inbox**, not your own.
- **Move resolved messages** to your log file. Keep inbox clean.

### Learnings

- **Write learnings immediately** when you discover something.
- **Be specific.** Include version numbers, config keys, error messages, URLs.
- **Check relevant learnings files** before doing related work.

### Source Verification

- **Don't trust training data for config details.** Verify against official docs or GitHub repos.
- **Pin Docker image versions.** Never `:latest`.
- **If official docs conflict with your knowledge:** Trust the docs. Write a learning.

### Error Handling

- **If a build fails:** Log error, cause, fix. Write a learning if non-obvious.
- **If an article can't be completed** (missing info, app abandoned): Log it, skip in topic-map with a note, move on.
- **If a deploy fails:** Log, diagnose, fix. Learning if non-obvious.

### Quality Self-Check

Before marking work as done:
1. Re-read any Docker Compose configs. All required env vars present? Volume mounts correct? Ports right?
2. Check internal links. Do they point to existing articles (or queued ones in topic-map)?
3. Check frontmatter. Every field populated? Description under 160 chars?
4. Read the verdict/recommendation. Opinionated and specific?

### Knowledge Compounding

The learnings files make iteration 1000 smarter than iteration 1. Every agent contributes. This is the organizational memory.
