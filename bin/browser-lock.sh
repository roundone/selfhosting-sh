#!/bin/bash
# browser-lock.sh — File-based browser lock for single-agent Chromium access
# Usage:
#   browser-lock.sh acquire <agent-name> [timeout_seconds]  — acquire lock (blocks until available or timeout)
#   browser-lock.sh release <agent-name>                     — release lock
#   browser-lock.sh status                                   — show lock status
#   browser-lock.sh force-release                            — force release (use only if stuck)
#
# Lock file: /opt/selfhosting-sh/.browser-lock
# On a 4GB VPS, only one Chromium instance should run at a time (~200-400MB).

LOCK_FILE="/opt/selfhosting-sh/.browser-lock"
LOCK_DIR="/opt/selfhosting-sh/.browser-lock.d"

acquire_lock() {
    local agent="${1:?Usage: browser-lock.sh acquire <agent-name> [timeout_seconds]}"
    local timeout="${2:-120}"
    local start_time=$(date +%s)

    while true; do
        # Try to atomically create the lock directory (mkdir is atomic on Linux)
        if mkdir "$LOCK_DIR" 2>/dev/null; then
            # Got the lock — write metadata
            echo "{\"agent\": \"$agent\", \"pid\": $$, \"acquired\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" > "$LOCK_FILE"
            echo "ACQUIRED by $agent at $(date -u +%Y-%m-%dT%H:%M:%SZ)"
            return 0
        fi

        # Check if the lock holder's process is still alive
        if [ -f "$LOCK_FILE" ]; then
            local holder_pid=$(python3 -c "import json; print(json.load(open('$LOCK_FILE')).get('pid',''))" 2>/dev/null)
            if [ -n "$holder_pid" ] && ! kill -0 "$holder_pid" 2>/dev/null; then
                # Lock holder is dead — force release and retry
                echo "STALE lock detected (pid $holder_pid is dead). Releasing."
                rm -rf "$LOCK_DIR" 2>/dev/null
                rm -f "$LOCK_FILE" 2>/dev/null
                continue
            fi
        fi

        # Check timeout
        local elapsed=$(( $(date +%s) - start_time ))
        if [ "$elapsed" -ge "$timeout" ]; then
            local holder="unknown"
            if [ -f "$LOCK_FILE" ]; then
                holder=$(python3 -c "import json; d=json.load(open('$LOCK_FILE')); print(f\"{d.get('agent','?')} (pid {d.get('pid','?')}, since {d.get('acquired','?')})\")" 2>/dev/null)
            fi
            echo "TIMEOUT after ${timeout}s. Lock held by: $holder"
            return 1
        fi

        # Wait and retry
        sleep 2
    done
}

release_lock() {
    local agent="${1:?Usage: browser-lock.sh release <agent-name>}"

    if [ ! -d "$LOCK_DIR" ]; then
        echo "NO lock to release."
        return 0
    fi

    if [ -f "$LOCK_FILE" ]; then
        local holder=$(python3 -c "import json; print(json.load(open('$LOCK_FILE')).get('agent',''))" 2>/dev/null)
        if [ "$holder" != "$agent" ]; then
            echo "WARNING: Lock held by '$holder', not '$agent'. Releasing anyway."
        fi
    fi

    rm -f "$LOCK_FILE" 2>/dev/null
    rm -rf "$LOCK_DIR" 2>/dev/null
    echo "RELEASED by $agent at $(date -u +%Y-%m-%dT%H:%M:%SZ)"
    return 0
}

show_status() {
    if [ -d "$LOCK_DIR" ] && [ -f "$LOCK_FILE" ]; then
        echo "LOCKED"
        cat "$LOCK_FILE"
    else
        echo "UNLOCKED"
    fi
}

force_release() {
    rm -f "$LOCK_FILE" 2>/dev/null
    rm -rf "$LOCK_DIR" 2>/dev/null
    echo "FORCE RELEASED at $(date -u +%Y-%m-%dT%H:%M:%SZ)"
}

case "${1:-}" in
    acquire)  acquire_lock "$2" "${3:-120}" ;;
    release)  release_lock "$2" ;;
    status)   show_status ;;
    force-release) force_release ;;
    *)
        echo "Usage: browser-lock.sh {acquire|release|status|force-release} [agent-name] [timeout]"
        exit 1
        ;;
esac
