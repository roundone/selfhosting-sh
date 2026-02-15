#!/bin/bash
# Usage: run-agent.sh <agent-dir> [max-runtime-seconds]
# Example: run-agent.sh /opt/selfhosting-sh/agents/operations 3600
#
# Wrapper script that repeatedly invokes Claude Code in headless mode.
# Each iteration starts fresh, reads all state from files, does work, exits.
# This script loops forever — systemd (or tmux) supervises it.

AGENT_DIR="${1:?Usage: run-agent.sh <agent-dir>}"
MAX_RUNTIME="${2:-3600}"  # Default: 1 hour max per iteration
LOG="/opt/selfhosting-sh/logs/supervisor.log"
REPO_ROOT="/opt/selfhosting-sh"

# Ensure the agent directory exists
if [ ! -f "$AGENT_DIR/CLAUDE.md" ]; then
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) — FATAL: No CLAUDE.md found in $AGENT_DIR" >> "$LOG"
    exit 1
fi

while true; do
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) — Starting iteration in $AGENT_DIR" >> "$LOG"

    # Pull latest changes before each iteration
    git -C "$REPO_ROOT" pull --rebase --autostash 2>> "$LOG" || true

    # Run Claude from the agent directory so it picks up the agent's CLAUDE.md
    # Use --add-dir to grant access to the full repo for shared files
    cd "$AGENT_DIR" || exit 1
    timeout "$MAX_RUNTIME" claude -p \
        "Read CLAUDE.md. Execute your operating loop — do as much work as possible. Push hard toward the targets. When your context is getting full, write all state to files and exit cleanly so the next invocation can continue." \
        --dangerously-skip-permissions \
        --add-dir "$REPO_ROOT"

    EXIT_CODE=$?

    if [ $EXIT_CODE -eq 124 ]; then
        echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) — TIMEOUT ($AGENT_DIR) after ${MAX_RUNTIME}s" >> "$LOG"
    elif [ $EXIT_CODE -ne 0 ]; then
        echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) — ERROR ($AGENT_DIR) code=$EXIT_CODE" >> "$LOG"
        sleep 30  # Longer pause on errors to avoid tight failure loops
    else
        echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) — COMPLETED ($AGENT_DIR)" >> "$LOG"
    fi

    # Commit and push any changes this iteration made
    cd "$REPO_ROOT" || exit 1
    if [ -n "$(git status --porcelain)" ]; then
        git add -A 2>> "$LOG"
        git commit -m "Auto-commit: $(basename "$AGENT_DIR") iteration $(date -u +%Y-%m-%dT%H:%M:%SZ)" 2>> "$LOG"
        git push 2>> "$LOG" || true
    fi

    sleep 10
done
