#!/bin/bash
# run-agent-once.sh <agent-dir> [max-runtime-seconds]
#
# Single-iteration agent runner. Called by coordinator.js when a wake condition is met.
# Replaces the while-loop in run-agent.sh — the coordinator now owns scheduling.
#
# Responsibilities:
#   1. Git pull (get latest state from other agents)
#   2. Run claude -p for one iteration
#   3. Git commit + push any changes this iteration produced
#   4. Exit with appropriate code (coordinator uses this for backoff decisions)
#
# Exit codes:
#   0   = clean completion
#   124 = timeout (iteration hit the time limit — not an error, coordinator resets backoff)
#   1   = claude error
#   2   = setup error (agent dir missing, proxy down)
#
# Environment variables (set by coordinator):
#   TRIGGER_EVENT  = path to the event JSON file that caused this agent to start (optional)
#   TRIGGER_REASON = human-readable reason string if no event file (e.g. "24h-fallback")
#   HTTPS_PROXY    = set here, required for all API calls to route through rate-limiter

AGENT_DIR="${1:?Usage: run-agent-once.sh <agent-dir>}"
MAX_RUNTIME="${2:-3600}"
LOG="/opt/selfhosting-sh/logs/supervisor.log"
REPO_ROOT="/opt/selfhosting-sh"
EVENTS_DIR="$REPO_ROOT/events"

# All Anthropic API traffic through the rate-limiting proxy (prevents 429s and Haiku fallback)
export HTTPS_PROXY=http://127.0.0.1:3128

# --- Sanity checks ---
if [ ! -f "$AGENT_DIR/CLAUDE.md" ]; then
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) — FATAL: No CLAUDE.md in $AGENT_DIR" >> "$LOG"
    exit 2
fi

if ! curl -s --max-time 3 http://127.0.0.1:3128/stats > /dev/null 2>&1; then
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) — FATAL: Rate-limit proxy not running ($AGENT_DIR)" >> "$LOG"
    exit 2
fi

# --- Git pull (get latest from other agents) ---
LOCKFILE="$REPO_ROOT/.git/agent-git.lock"
(
    flock -w 60 200 || {
        echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) — WARN: git pull lock timeout ($AGENT_DIR)" >> "$LOG"
    }
    git -C "$REPO_ROOT" pull --rebase --autostash 2>> "$LOG" || true
) 200>"$LOCKFILE"

# --- Build the prompt, incorporating trigger context ---
TRIGGER_CONTEXT=""
if [ -n "$TRIGGER_EVENT" ] && [ -f "$TRIGGER_EVENT" ]; then
    # Parse the event type for a human-readable summary in the prompt
    EVENT_TYPE=$(python3 -c "import sys,json; d=json.load(open('$TRIGGER_EVENT')); print(d.get('type','unknown'))" 2>/dev/null || echo "unknown")
    TRIGGER_CONTEXT=" You were started by an event: type=$EVENT_TYPE (full details in $TRIGGER_EVENT)."
elif [ -n "$TRIGGER_REASON" ]; then
    TRIGGER_CONTEXT=" Trigger reason: $TRIGGER_REASON."
fi

EVENTS_CONTEXT=" Before executing your loop, check the events/ directory for any files starting with your agent name prefix — these are queued events addressed specifically to you."

FULL_PROMPT="Read CLAUDE.md and execute your operating loop.${TRIGGER_CONTEXT}${EVENTS_CONTEXT} Exit cleanly when your iteration is complete — the coordinator will start your next iteration when needed."

# --- Run Claude (single iteration) ---
echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) — STARTING ($AGENT_DIR)$([ -n "$TRIGGER_CONTEXT" ] && echo " [$EVENT_TYPE]")" >> "$LOG"

cd "$AGENT_DIR" || exit 2

# MUST use --foreground: without it, timeout creates a new process group. Node.js touches
# the TTY during startup and receives SIGTTOU in a background group → process stops immediately.
timeout --foreground "$MAX_RUNTIME" claude -p "$FULL_PROMPT" \
    --dangerously-skip-permissions

EXIT_CODE=$?

# --- Log outcome ---
if [ $EXIT_CODE -eq 124 ]; then
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) — TIMEOUT ($AGENT_DIR) after ${MAX_RUNTIME}s" >> "$LOG"
elif [ $EXIT_CODE -ne 0 ]; then
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) — ERROR ($AGENT_DIR) code=$EXIT_CODE" >> "$LOG"
else
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) — COMPLETED ($AGENT_DIR)" >> "$LOG"
fi

# --- Git commit + push any changes this iteration produced ---
cd "$REPO_ROOT" || exit $EXIT_CODE
if [ -n "$(git status --porcelain)" ]; then
    (
        flock -w 120 200 || {
            echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) — WARN: git push lock timeout ($AGENT_DIR)" >> "$LOG"
        }
        AGENT_NAME=$(basename "$AGENT_DIR")
        git add -A 2>> "$LOG"
        git commit -m "Auto-commit: $AGENT_NAME $(date -u +%Y-%m-%dT%H:%M:%SZ)" 2>> "$LOG"
        git pull --rebase --autostash 2>> "$LOG" || true
        git push 2>> "$LOG" || true
    ) 200>"$LOCKFILE"
fi

exit $EXIT_CODE
