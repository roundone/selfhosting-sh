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
ERROR_BACKOFF=30  # Start at 30s, exponential up to 1800s (30 min)
MAX_BACKOFF=1800

# Route all HTTPS through the rate-limiting proxy to avoid 429s.
# The proxy queues over-limit requests (never drops them).
# If the proxy isn't running, connections will fail — start it first.
export HTTPS_PROXY=http://127.0.0.1:3128

# Ensure the agent directory exists
if [ ! -f "$AGENT_DIR/CLAUDE.md" ]; then
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) — FATAL: No CLAUDE.md found in $AGENT_DIR" >> "$LOG"
    exit 1
fi

while true; do
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) — Starting iteration in $AGENT_DIR" >> "$LOG"

    # Pull latest changes before each iteration (with lock to avoid concurrent rebase)
    LOCKFILE="$REPO_ROOT/.git/agent-git.lock"
    (
        flock -w 60 200 || { echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) — WARN: git lock timeout ($AGENT_DIR)" >> "$LOG"; }
        git -C "$REPO_ROOT" pull --rebase --autostash 2>> "$LOG" || true
    ) 200>"$LOCKFILE"

    # Run Claude from the agent directory so it picks up the agent's CLAUDE.md
    # DO NOT use --add-dir — it causes Claude to also read the root CLAUDE.md (CEO instructions),
    # which confuses the agent about its identity. Agents access shared repo files via relative paths (../../).
    cd "$AGENT_DIR" || exit 1
    # MUST use --foreground: without it, timeout creates a new process group,
    # which takes claude out of the terminal's foreground group. Node.js touches
    # the TTY during startup and receives SIGTTOU, putting the process in T (stopped) state.
    # This was the root cause of all agents getting stuck with 0:00 CPU time.
    timeout --foreground "$MAX_RUNTIME" claude -p \
        "Read CLAUDE.md. Execute your operating loop — do as much work as possible. Push hard toward the targets. When your context is getting full, write all state to files and exit cleanly so the next invocation can continue." \
        --dangerously-skip-permissions

    EXIT_CODE=$?

    if [ $EXIT_CODE -eq 124 ]; then
        echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) — TIMEOUT ($AGENT_DIR) after ${MAX_RUNTIME}s" >> "$LOG"
        ERROR_BACKOFF=30  # Reset backoff on timeout (iteration ran, just hit time limit)
    elif [ $EXIT_CODE -ne 0 ]; then
        echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) — ERROR ($AGENT_DIR) code=$EXIT_CODE, backoff=${ERROR_BACKOFF}s" >> "$LOG"
        sleep "$ERROR_BACKOFF"
        # Exponential backoff: 30s → 60s → 120s → 240s → 480s → 960s → 1800s (cap)
        ERROR_BACKOFF=$(( ERROR_BACKOFF * 2 ))
        if [ $ERROR_BACKOFF -gt $MAX_BACKOFF ]; then
            ERROR_BACKOFF=$MAX_BACKOFF
        fi
    else
        echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) — COMPLETED ($AGENT_DIR)" >> "$LOG"
        ERROR_BACKOFF=30  # Reset backoff on success
    fi

    # Commit and push any changes this iteration made (with lock to serialize git operations)
    cd "$REPO_ROOT" || exit 1
    if [ -n "$(git status --porcelain)" ]; then
        LOCKFILE="$REPO_ROOT/.git/agent-git.lock"
        (
            flock -w 120 200 || { echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) — WARN: git push lock timeout ($AGENT_DIR)" >> "$LOG"; }
            git add -A 2>> "$LOG"
            git commit -m "Auto-commit: $(basename "$AGENT_DIR") iteration $(date -u +%Y-%m-%dT%H:%M:%SZ)" 2>> "$LOG"
            git pull --rebase --autostash 2>> "$LOG" || true
            git push 2>> "$LOG" || true
        ) 200>"$LOCKFILE"
    fi

    sleep 10
done
