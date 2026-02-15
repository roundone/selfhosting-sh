# Bootstrap Procedure — selfhosting.sh

This file is the one-time startup procedure. The CEO reads this file ONLY during initial bootstrap. Once the business is operational, this file is archived reference.

**When to read this file:** Check `state.md`. If it says "Bootstrap", "Awaiting Founding Approval", or doesn't exist — follow this procedure.

---

## Prerequisites

Before bootstrap can begin, the founder (Nishant) must have completed:

1. ~~**Domain registration:** selfhosting.sh registered and DNS pointed to Cloudflare~~ **DONE** (Cloudflare, Feb 15)
2. ~~**GitHub repo:** Created (private), CEO has push access via deploy key or token~~ **DONE** (github.com/roundone/selfhosting-sh, Feb 15)
3. ~~**VPS provisioned:** Ubuntu VPS running, SSH access configured~~ **DONE** (Hetzner CPX21, 5.161.102.207, Ashburn VA, Feb 15)
4. ~~**VPS software installed:**~~ **DONE** (Feb 15)
   - ~~Node.js (LTS)~~ v22.22.0
   - ~~Git~~ v2.43.0
   - ~~Claude Code CLI (`npm install -g @anthropic-ai/claude-code`)~~ v2.1.42
   - ~~Process supervisor (systemd or pm2)~~ systemd (pre-installed)
   - ~~tmux (for manual debugging/monitoring)~~ v3.4
5. ~~**Claude Code auth:** Run `claude login` on the VPS~~ **DONE** (nishant.s.mathur@gmail.com, Claude Max, Opus 4.6, Feb 15)
6. ~~**Repo cloned:** `git clone` into `/opt/selfhosting-sh/`~~ **DONE** (Feb 15, deploy key with write access)

These prerequisites require human action. The CEO should verify them before proceeding. If any are missing, write to `board/bootstrap-blockers.md` listing what's needed and stop.

---

## Phase A: Plan & Organize

This phase happens in the CEO's first run. No agents are started. No content is written. No site is built. The CEO plans the entire business and presents it to the founder for approval.

### Step 1: Create Shared Infrastructure

Create the following directory structure and files in the repo root:

```
state.md

inbox/
├── ceo.md
├── technology.md
├── marketing.md
├── operations.md
└── bi-finance.md

logs/
├── ceo.md
├── technology.md
├── marketing.md
├── operations.md
└── bi-finance.md

learnings/
├── apps.md
├── toolchain.md
├── seo.md
├── content.md
└── failed.md

topic-map/
└── _overview.md

reports/

board/
```

Initialize `state.md` with: `Current Phase: Bootstrap`

All inbox, log, and learnings files start empty (with just a header).

### Step 2: Generate the Topic Map

Create the complete content plan:

1. Create one file per category in `topic-map/` (30+ categories from `departments.md` → Operations → App categories table)
2. For each category, list every article to be written:
   - App guides for every major app
   - Pairwise comparisons for every meaningful combination
   - One roundup ("Best Self-Hosted [Category]")
   - One "Replace [Service]" guide per cloud service the category replaces
3. Add hardware topics to `topic-map/hardware.md`
4. Add foundation topics to `topic-map/foundations.md`
5. Create `topic-map/_overview.md` with:
   - Priority order (which categories first and why)
   - Total article count
   - Projected timeline to 1,000 articles

This is the content plan that Operations will execute against, prioritized by Marketing's SEO analysis.

### Step 3: Create Department Head CLAUDE.md Files

For each department, create the agent folder and CLAUDE.md:

1. **`agents/technology/CLAUDE.md`** — using the Technology spec from `departments.md` and the CLAUDE.md template from `playbooks.md` → "Spawning Protocol"
2. **`agents/marketing/CLAUDE.md`** — using the Marketing spec from `departments.md`
3. **`agents/operations/CLAUDE.md`** — using the Operations spec from `departments.md`
4. **`agents/bi-finance/CLAUDE.md`** — using the BI & Finance spec from `departments.md`

Each CLAUDE.md must include:
- The agent's role and outcome (from `departments.md`)
- Cascaded business context (from CEO's CLAUDE.md → The Business, condensed)
- Sacrosanct directives (inherited from CEO + any department-specific additions)
- Full operational instructions (from `departments.md`)
- What files to read and write
- Scope boundaries and escalation rules
- Spawning rules (if applicable)
- The agent's operating loop (continuous daemon loop, not session-based)
- Operating discipline rules (from `playbooks.md`)

### Step 4: Set Up Process Supervision

Create systemd service files (or pm2 config) for each department head:

```
/etc/systemd/system/
├── selfhosting-ceo.service
├── selfhosting-technology.service
├── selfhosting-marketing.service
├── selfhosting-operations.service
└── selfhosting-bi-finance.service
```

DO NOT enable or start them yet. They are created during Phase A but only activated in Phase B.

### Step 5: Write the Founding Board Report

Write to `board/founding-report.md`:

```markdown
# Founding Board Report — selfhosting.sh

## Executive Summary
[3-5 sentences. What we're building, for whom, how we'll win, and
the plan to hit $5K/month by Oct 1, 2026.]

## Content Plan
- Total articles planned: [n]
- Categories: [n] (list them with article counts)
- Priority order: [which categories first and why]
- Projected publishing rate: [articles/week]
- Projected timeline to 1,000 articles: [date]

## Technology Plan
- Tech stack: [summary]
- Design direction: [summary]
- Hosting & deployment: [summary]
- VPS & execution environment: [summary]
- Estimated time to site live: [date]

## Marketing Plan
- Primary keyword categories: [list]
- Interlinking approach: [summary]
- Social platforms: [list]
- Launch timeline: [dates]
- Expected time to first page 1 rankings: [estimate]

## Organization
- Departments: [list with one-line outcome for each]
- Agent model: persistent daemons on VPS
- Communication: inbox-based, file-driven
- Sub-agent strategy: [summary]

## Projected Timeline

| Milestone | Target Date |
|-----------|-------------|
| Site live (empty, designed) | [date] |
| First 100 articles published | [date] |
| First 500 articles published | [date] |
| 1,000 articles published | [date] |
| First page 1 ranking | [date] |
| 100 page 1 keywords | [date] |
| 50K monthly visits | [date] |
| First revenue ($1) | [date] |
| $1K/month revenue | [date] |
| $5K/month revenue | Oct 1, 2026 |

## Budget & Resources
- VPS costs: [estimate]
- API costs: covered by DV allocation
- Tool costs: [estimate] / $200 monthly budget
- Domain: [status]
- Accounts needing human setup: [list]

## Key Risks
[Top 3-5 risks and mitigation plans]

## Key Assumptions
[What must be true for this plan to work. Be honest.]

## Approval Requested
The CEO requests approval to proceed with execution as described above.
- **→ APPROVED** — proceed as planned
- **→ APPROVED WITH MODIFICATIONS** — [specify changes]
- **→ REJECTED** — [specify concerns, CEO will revise]
```

This is the founder's opportunity to pressure-test the plan before resources are spent. Present your best thinking — not a rubber-stamp formality.

### Step 6: Finalize Phase A

1. Update `state.md` to: `Current Phase: Awaiting Founding Approval`
2. Email the founding board report to nishant@daemonventures.com with subject `[selfhosting.sh] Founding Board Report — Requesting Approval`
3. Commit all files to the repo and push to GitHub
4. Log everything in `logs/ceo.md`
5. **STOP.** Do not start any agents. Do not build the site. Do not write content. Wait for founder approval.

---

## Phase B: Launch

Once Nishant approves the founding board report:

### Step 1: Incorporate Feedback

1. Read the approved (and possibly annotated) `board/founding-report.md`
2. Incorporate any modifications the founder requested
3. Update department head CLAUDE.md files if needed (per `playbooks.md` → "Updating Agent Instructions")

### Step 2: Activate Agents

1. Update `state.md` to: `Current Phase: Launch`
2. Enable and start the systemd services (or pm2 processes) for all 4 department heads:
   ```bash
   sudo systemctl enable --now selfhosting-technology.service
   sudo systemctl enable --now selfhosting-marketing.service
   sudo systemctl enable --now selfhosting-operations.service
   sudo systemctl enable --now selfhosting-bi-finance.service
   ```
3. Verify all 4 processes started successfully
4. Check that each agent read its CLAUDE.md and began its operating loop (check logs)

### Step 3: Enter Operational Mode

1. The CEO enters its own continuous operating loop (see CLAUDE.md → "Your Operating Loop")
2. Monitor the first few hours closely — check logs frequently
3. Write to each department head's inbox with an initial "Welcome — here are your first priorities" message
4. Log the launch in `logs/ceo.md`
5. The business is now running.

---

## If Bootstrap Is Interrupted

If the CEO process is interrupted during bootstrap:

1. Check `state.md` for current phase
2. Check `logs/ceo.md` for what was completed
3. Resume from where you left off — don't redo completed steps
4. All bootstrap work should be committed to git incrementally so nothing is lost
