#!/bin/bash
# run-agent-once.sh <agent-dir> [max-runtime-seconds]
#
# Single-iteration agent runner. Called by coordinator.js when a wake condition is met.
# Replaces the while-loop in run-agent.sh ??? the coordinator now owns scheduling.
#
# Responsibilities:
#   1. Git pull (get latest state from other agents)
#   2. Run claude -p for one iteration
#   3. Git commit + push any changes this iteration produced
#   4. Exit with appropriate code (coordinator uses this for backoff decisions)
#
# Exit codes:
#   0   = clean completion
#   124 = timeout (iteration hit the time limit ??? not an error, coordinator resets backoff)
#   1   = claude error
#   2   = setup error (agent dir missing, proxy down)
#   3   = model fallback detected (Haiku/Sonnet served instead of Opus ??? coordinator should pause all agents)
#
# Environment variables (set by coordinator):
#   TRIGGER_EVENT  = path to the event JSON file that caused this agent to start (optional)
#   TRIGGER_REASON = human-readable reason string if no event file (e.g. "24h-fallback")
#   HTTPS_PROXY    = set here, required for all API calls to route through rate-limiter
#   ANTHROPIC_MODEL = set here, explicitly request Opus

AGENT_DIR="${1:?Usage: run-agent-once.sh <agent-dir>}"
MAX_RUNTIME="${2:-3600}"
LOG="/opt/selfhosting-sh/logs/supervisor.log"
REPO_ROOT="/opt/selfhosting-sh"
EVENTS_DIR="$REPO_ROOT/events"
DEBUG_DIR="/home/selfhosting/.claude/debug"

# All Anthropic API traffic through the rate-limiting proxy (prevents 429s and Haiku fallback)
export HTTPS_PROXY=http://127.0.0.1:3128

# Explicitly request Opus. The server can still override when rate-limited,
# but this ensures we never default to a weaker model voluntarily.
export ANTHROPIC_MODEL=opus

# --- Sanity checks ---
if [ ! -f "$AGENT_DIR/CLAUDE.md" ]; then
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) ??? FATAL: No CLAUDE.md in $AGENT_DIR" >> "$LOG"
    exit 2
fi

if ! curl -s --max-time 3 http://127.0.0.1:3128/stats > /dev/null 2>&1; then
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) ??? FATAL: Rate-limit proxy not running ($AGENT_DIR)" >> "$LOG"
    exit 2
fi

# --- Git pull (get latest from other agents) ---
LOCKFILE="$REPO_ROOT/.git/agent-git.lock"
(
    flock -w 60 200 || {
        echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) ??? WARN: git pull lock timeout ($AGENT_DIR)" >> "$LOG"
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

EVENTS_CONTEXT=" Before executing your loop, check the events/ directory for any files starting with your agent name prefix ??? these are queued events addressed specifically to you."

FULL_PROMPT="Read CLAUDE.md and execute your operating loop.${TRIGGER_CONTEXT}${EVENTS_CONTEXT} Exit cleanly when your iteration is complete ??? the coordinator will start your next iteration when needed."

# --- Snapshot debug log state (to detect new entries from this iteration) ---
LATEST_DEBUG_BEFORE=$(readlink -f "$DEBUG_DIR/latest" 2>/dev/null || echo "")

# --- Run Claude (single iteration) ---
echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) ??? STARTING ($AGENT_DIR)$([ -n "$TRIGGER_CONTEXT" ] && echo " [$EVENT_TYPE]")" >> "$LOG"

cd "$AGENT_DIR" || exit 2

# MUST use --foreground: without it, timeout creates a new process group. Node.js touches
# the TTY during startup and receives SIGTTOU in a background group ??? process stops immediately.
timeout --foreground "$MAX_RUNTIME" claude -p "$FULL_PROMPT" \
    --model opus \
    --dangerously-skip-permissions

EXIT_CODE=$?

# --- Check for model fallback (Haiku/Sonnet served instead of Opus) ---
# When rate-limited, the server silently serves a weaker model. Detect this from debug logs.
# If detected, exit with code 3 so the coordinator pauses all agents.
if [ $EXIT_CODE -ne 0 ] && [ $EXIT_CODE -ne 124 ]; then
    LATEST_DEBUG_AFTER=$(readlink -f "$DEBUG_DIR/latest" 2>/dev/null || echo "")
    MODEL_FALLBACK=false

    # Check all debug files written during this iteration
    for dbg in "$DEBUG_DIR"/*.txt; do
        [ -f "$dbg" ] || continue
        # Only check files newer than our start snapshot
        if [ "$dbg" = "$LATEST_DEBUG_BEFORE" ]; then continue; fi
        if [ -n "$LATEST_DEBUG_BEFORE" ] && [ "$dbg" -ot "$LATEST_DEBUG_BEFORE" ]; then continue; fi

        # Look for the telltale signs of model fallback
        if grep -q "model does not support tool_reference" "$dbg" 2>/dev/null; then
            MODEL_FALLBACK=true
            FALLBACK_MODEL=$(grep -o "model '[^']*'" "$dbg" 2>/dev/null | head -1 || echo "unknown")
            break
        fi
        if grep -q "claude-haiku" "$dbg" 2>/dev/null; then
            MODEL_FALLBACK=true
            FALLBACK_MODEL="haiku"
            break
        fi
    done

    if [ "$MODEL_FALLBACK" = true ]; then
        echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) ??? MODEL_FALLBACK ($AGENT_DIR) ??? server served $FALLBACK_MODEL instead of Opus. Exiting with code 3 to trigger global pause." >> "$LOG"
        # Clean up any changes from the failed iteration (don't commit garbage)
        cd "$REPO_ROOT" && git checkout -- . 2>/dev/null
        exit 3
    fi
fi

# --- Log outcome ---
if [ $EXIT_CODE -eq 124 ]; then
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) ??? TIMEOUT ($AGENT_DIR) after ${MAX_RUNTIME}s" >> "$LOG"
elif [ $EXIT_CODE -ne 0 ]; then
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) ??? ERROR ($AGENT_DIR) code=$EXIT_CODE" >> "$LOG"
else
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) ??? COMPLETED ($AGENT_DIR)" >> "$LOG"
fi

# --- Git commit + push any changes this iteration produced ---
cd "$REPO_ROOT" || exit $EXIT_CODE

# Determine agent name for scoped git operations
AGENT_NAME=$(basename "$AGENT_DIR")

if [ -n "$(git status --porcelain)" ]; then
    (
        flock -w 120 200 || {
            echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) ??? WARN: git push lock timeout ($AGENT_DIR)" >> "$LOG"
        }

        # Layer 1: Agent-scoped git add
        # Only the technology agent may modify bin/ (infrastructure scripts)
        if [ "$AGENT_NAME" = "technology" ]; then
            git add -A 2>> "$LOG"
        else
            git add -A -- ':!bin/' 2>> "$LOG"
        fi

        # Layer 2: Zero-byte file guard ??? catch truncated files before committing
        for file in $(git diff --cached --name-only 2>/dev/null); do
            if [ -f "$file" ] && [ ! -s "$file" ]; then
                OLD_SIZE=$(git cat-file -s HEAD:"$file" 2>/dev/null || echo 0)
                if [ "$OLD_SIZE" -gt 0 ]; then
                    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) ??? GIT_SAFETY: $file truncated to 0 bytes (was ${OLD_SIZE}B), restoring from HEAD ($AGENT_DIR)" >> "$LOG"
                    git reset HEAD -- "$file" 2>> "$LOG"
                    git checkout HEAD -- "$file" 2>> "$LOG"
                fi
            fi
        done

        # Layer 3: Protected files check ??? belt + suspenders with Layer 1
        if [ "$AGENT_NAME" != "technology" ]; then
            PROTECTED=$(git diff --cached --name-only 2>/dev/null | grep '^bin/' || true)
            if [ -n "$PROTECTED" ]; then
                echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) ??? GIT_SAFETY: $AGENT_NAME tried to commit bin/ files: $PROTECTED ??? unstaging ($AGENT_DIR)" >> "$LOG"
                echo "$PROTECTED" | xargs git reset HEAD -- 2>> "$LOG"
            fi
        fi

        # Layer 4: Founder-locked files ??? NO agent may modify these
        # These files are controlled exclusively by the founder. The chattr +i flag
        # prevents runtime modification, and this layer prevents git commits.
        FOUNDER_LOCKED="config/coordinator-config.json"
        for locked_file in $FOUNDER_LOCKED; do
            if git diff --cached --name-only 2>/dev/null | grep -qx "$locked_file"; then
                echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) ??? GIT_SAFETY: $AGENT_NAME tried to modify founder-locked file: $locked_file ??? unstaging and restoring ($AGENT_DIR)" >> "$LOG"
                git reset HEAD -- "$locked_file" 2>> "$LOG"
                git checkout HEAD -- "$locked_file" 2>> "$LOG"
            fi
        done

        # Only commit if there are still staged changes after safety checks
        if git diff --cached --quiet 2>/dev/null; then
            echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) ??? GIT_SAFETY: All staged changes removed by safety checks, skipping commit ($AGENT_DIR)" >> "$LOG"
        else
            git commit -m "Auto-commit: $AGENT_NAME $(date -u +%Y-%m-%dT%H:%M:%SZ)" 2>> "$LOG"
            git pull --rebase --autostash 2>> "$LOG" || true
            git push 2>> "$LOG" || true
        fi
    ) 200>"$LOCKFILE"
fi

exit $EXIT_CODE

