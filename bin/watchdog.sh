#!/bin/bash
# watchdog.sh — Service health monitor
#
# Runs as selfhosting-watchdog.service. Loops indefinitely, checking critical
# services every 60 seconds. Writes events to events/ for the coordinator to
# route. Never makes Claude API calls.
#
# Services monitored:
#   selfhosting-proxy       — rate-limiting proxy; all agents fail without it
#   selfhosting-coordinator — the event coordinator itself
#
# On state change from active → inactive:
#   1. Attempt systemctl restart
#   2. If restart succeeds → log only (no event: coordinator is back to handle it)
#   3. If restart fails → write ceo-service-down event
#
# On recovery (inactive → active): write ceo-service-recovered event.
#
# State across restarts: defaults to assuming services were active. On first
# iteration, if a service is already down, the watchdog will attempt restart
# and write an event — this is correct and desired.

REPO_ROOT="/opt/selfhosting-sh"
EVENTS_DIR="$REPO_ROOT/events"
LOG="$REPO_ROOT/logs/supervisor.log"
CHECK_INTERVAL=60
SERVICES="selfhosting-proxy selfhosting-coordinator"

log() {
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) — WATCHDOG $*" >> "$LOG"
}

write_event() {
    local agent="$1" type="$2" service="$3"
    local ts isodate filename
    ts=$(date -u +%Y%m%dT%H%M%SZ)
    isodate=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    filename="${agent}-${type}-${ts}.json"
    mkdir -p "$EVENTS_DIR"
    printf '{"type":"%s","service":"%s","ts":"%s"}\n' \
        "$type" "$service" "$isodate" > "$EVENTS_DIR/$filename"
    log "event written: $filename"
}

log "starting (interval=${CHECK_INTERVAL}s, monitoring: $SERVICES)"

# Associative array to track previous state; bash 4+ required (Ubuntu 24.04 ships bash 5)
declare -A PREV_STATE

while true; do
    for SERVICE in $SERVICES; do
        # is-active returns 0 if active, non-zero otherwise
        if systemctl is-active --quiet "$SERVICE"; then
            CURRENT="active"
        else
            CURRENT="inactive"
        fi

        # Default assumption: services were active before we started watching
        PREV="${PREV_STATE[$SERVICE]:-active}"

        if [ "$CURRENT" != "$PREV" ]; then
            if [ "$CURRENT" = "inactive" ]; then
                log "ALERT $SERVICE went down — attempting restart"
                systemctl restart "$SERVICE" || true
                sleep 5

                # Re-check after restart attempt
                if systemctl is-active --quiet "$SERVICE"; then
                    log "INFO $SERVICE restarted successfully"
                    # No event: it's back up. Coordinator will pick up from where it left off.
                    PREV_STATE[$SERVICE]="active"
                else
                    log "ERROR $SERVICE restart failed — writing ceo event"
                    write_event "ceo" "service-down" "$SERVICE"
                    PREV_STATE[$SERVICE]="inactive"
                fi
            else
                # Service recovered between checks (someone else fixed it)
                log "INFO $SERVICE recovered"
                write_event "ceo" "service-recovered" "$SERVICE"
                PREV_STATE[$SERVICE]="active"
            fi
        fi
    done

    sleep "$CHECK_INTERVAL"
done
