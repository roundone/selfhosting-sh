#!/bin/bash
# Deploy selfhosting.sh site to Cloudflare Pages
# Usage: deploy-site.sh
# Builds the site and deploys to Cloudflare Pages via wrangler direct upload

set -e

SITE_DIR="/opt/selfhosting-sh/site"
LOG="/opt/selfhosting-sh/logs/supervisor.log"

# Load credentials
export $(grep -v '^#' /opt/selfhosting-sh/credentials/api-keys.env | xargs)
export CLOUDFLARE_ACCOUNT_ID="a672341cf125e4fa55eced7e4c5eeee0"

echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) -- Starting site build and deploy" >> "$LOG"

# Build
cd "$SITE_DIR"
npm run build 2>&1
BUILD_EXIT=$?

if [ $BUILD_EXIT -ne 0 ]; then
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) -- BUILD FAILED (exit=$BUILD_EXIT)" >> "$LOG"
    exit 1
fi

echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) -- Build succeeded, deploying..." >> "$LOG"

# Deploy
npx wrangler pages deploy dist --project-name=selfhosting-sh --branch=main --commit-dirty=true 2>&1
DEPLOY_EXIT=$?

if [ $DEPLOY_EXIT -ne 0 ]; then
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) -- DEPLOY FAILED (exit=$DEPLOY_EXIT)" >> "$LOG"
    exit 1
fi

echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) -- Deploy succeeded" >> "$LOG"
