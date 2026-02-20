#!/bin/bash
# deploy-site.sh — Build and deploy selfhosting.sh to Cloudflare Pages
#
# Can be invoked:
#   1. By the coordinator as a periodic task (every 30 min)
#   2. By the technology agent during iterations
#   3. Manually for ad-hoc deploys
#
# Checks if there are new/changed content files since last deploy.
# If no changes and not forced, exits 0 without deploying.
#
# Usage: deploy-site.sh [--force]
#   --force: Deploy even if no content changes detected

set -o pipefail

SITE_DIR="/opt/selfhosting-sh/site"
LOG="/opt/selfhosting-sh/logs/deploy.log"
QA_SCRIPT="/opt/selfhosting-sh/bin/post-deploy-qa.sh"
LAST_DEPLOY_FILE="/opt/selfhosting-sh/.last-deploy-hash"
LOCK_FILE="/opt/selfhosting-sh/.deploy.lock"
FORCE=0

[[ "$1" == "--force" ]] && FORCE=1

log() {
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) -- [deploy] $1" >> "$LOG"
}

# Prevent concurrent deploys
exec 200>"$LOCK_FILE"
if ! flock -n 200; then
    log "SKIPPED: another deploy is already running"
    exit 0
fi

# Check for changes since last deploy
touch -a "$LAST_DEPLOY_FILE"  # ensure exists
NEW_FILES=$(find "$SITE_DIR/src/content" -name '*.md' -newer "$LAST_DEPLOY_FILE" 2>/dev/null | wc -l)

if [ "$FORCE" -eq 0 ] && [ "${NEW_FILES:-0}" -eq 0 ]; then
    exit 0  # No changes, nothing to do (silent exit — not worth logging)
fi

REASON="$NEW_FILES new/modified content files"
[ "$FORCE" -eq 1 ] && REASON="forced deploy"

log "Starting deploy: $REASON"

cd "$SITE_DIR" || { log "ERROR: Cannot cd to $SITE_DIR"; exit 1; }

# Pull latest to ensure we have all content
cd /opt/selfhosting-sh && git pull --rebase --autostash >> "$LOG" 2>&1 || true
cd "$SITE_DIR"

# Build (2GB heap — VPS has 8GB RAM)
if NODE_OPTIONS='--max-old-space-size=2048' npm run build >> "$LOG" 2>&1; then
    PAGE_COUNT=$(find "$SITE_DIR/dist" -name 'index.html' | wc -l)
    log "Build succeeded: $PAGE_COUNT pages"
else
    log "BUILD FAILED"
    exit 1
fi

# Deploy via wrangler direct upload (bypass proxy for Cloudflare API)
export $(grep -v '^#' /opt/selfhosting-sh/credentials/api-keys.env | xargs)
if HTTPS_PROXY="" npx wrangler pages deploy dist \
    --project-name=selfhosting-sh --branch=main --commit-dirty=true >> "$LOG" 2>&1; then
    touch "$LAST_DEPLOY_FILE"
    log "Deploy succeeded: $PAGE_COUNT pages live"
else
    log "DEPLOY FAILED"
    exit 1
fi

# Post-deploy QA (non-blocking)
if [ -x "$QA_SCRIPT" ]; then
    if "$QA_SCRIPT" 2>/dev/null; then
        log "Post-deploy QA: PASSED"
    else
        log "Post-deploy QA: FAILURES DETECTED — check logs/qa.log"
    fi
fi

log "Deploy complete"
exit 0
