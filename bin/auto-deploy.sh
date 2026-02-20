#!/bin/bash
# Auto-deploy loop for selfhosting.sh
# Checks for content changes every 5 minutes, deploys if changes found
# Also deploys at minimum every 30 minutes regardless of changes

set -o pipefail

SITE_DIR="/opt/selfhosting-sh/site"
LOG="/opt/selfhosting-sh/logs/deploy.log"
LAST_DEPLOY_FILE="/opt/selfhosting-sh/.last-deploy-hash"
DEPLOY_INTERVAL=1800  # 30 minutes forced deploy
CHECK_INTERVAL=300    # 5 minutes between checks
LAST_DEPLOY_TIME=0

# Load credentials
export $(grep -v '^#' /opt/selfhosting-sh/credentials/api-keys.env | xargs)

log() {
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) -- [auto-deploy] $1" >> "$LOG"
}

get_content_hash() {
    find "$SITE_DIR/src/content" -name '*.md' -newer "$LAST_DEPLOY_FILE" 2>/dev/null | wc -l
}

do_deploy() {
    local reason="$1"
    log "Starting deploy: $reason"

    cd "$SITE_DIR" || { log "ERROR: Cannot cd to $SITE_DIR"; return 1; }

    # Build (limit Node memory to avoid OOM on constrained VPS)
    if NODE_OPTIONS='--max-old-space-size=1024' npm run build >> "$LOG" 2>&1; then
        log "Build succeeded"
    else
        log "BUILD FAILED"
        return 1
    fi

    # Deploy
    if npx wrangler pages deploy dist --project-name=selfhosting-sh --branch=main --commit-dirty=true >> "$LOG" 2>&1; then
        log "Deploy succeeded"
        touch "$LAST_DEPLOY_FILE"
        LAST_DEPLOY_TIME=$(date +%s)

        # Count pages for state tracking
        local page_count
        page_count=$(find "$SITE_DIR/dist" -name 'index.html' | wc -l)
        log "Pages deployed: $page_count"

        # Run post-deploy QA (non-blocking — log results but don't fail deploy)
        if /opt/selfhosting-sh/bin/post-deploy-qa.sh 2>/dev/null; then
            log "Post-deploy QA: PASSED"
        else
            log "Post-deploy QA: FAILURES DETECTED — check logs/qa.log"
        fi
    else
        log "DEPLOY FAILED"
        return 1
    fi
}

# Initialize
touch "$LAST_DEPLOY_FILE"
LAST_DEPLOY_TIME=$(date +%s)
log "Auto-deploy loop started (check every ${CHECK_INTERVAL}s, force every ${DEPLOY_INTERVAL}s)"

# Initial deploy
do_deploy "startup"

while true; do
    sleep "$CHECK_INTERVAL"

    NOW=$(date +%s)
    ELAPSED=$((NOW - LAST_DEPLOY_TIME))
    NEW_FILES=$(get_content_hash)

    if [ "$NEW_FILES" -gt 0 ]; then
        do_deploy "$NEW_FILES new/modified content files since last deploy"
    elif [ "$ELAPSED" -ge "$DEPLOY_INTERVAL" ]; then
        do_deploy "periodic deploy (${ELAPSED}s since last)"
    fi
done
