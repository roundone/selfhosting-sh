#!/bin/bash
# send-newsletter.sh — Send newsletter to all subscribed contacts via Resend API
#
# Usage: send-newsletter.sh <subject> <html-body-file>
#   subject:        Email subject line
#   html-body-file: Path to file containing HTML email body
#
# The script:
#   1. Fetches all contacts from Resend API
#   2. Filters to subscribed contacts only
#   3. Sends email to each contact individually (includes unsubscribe link)
#   4. Respects Resend free tier (100 emails/day) — stops if limit hit
#   5. Logs results
#
# Example:
#   bin/send-newsletter.sh "Weekly Self-Hosting Digest — Feb 20" /tmp/newsletter.html

set -euo pipefail

SUBJECT="${1:?Usage: send-newsletter.sh <subject> <html-body-file>}"
BODY_FILE="${2:?Usage: send-newsletter.sh <subject> <html-body-file>}"

if [ ! -f "$BODY_FILE" ]; then
    echo "ERROR: Body file not found: $BODY_FILE"
    exit 1
fi

source /opt/selfhosting-sh/credentials/api-keys.env

if [ -z "${RESEND_API_KEY:-}" ]; then
    echo "ERROR: RESEND_API_KEY not set"
    exit 1
fi

LOG="/opt/selfhosting-sh/logs/newsletter.log"
FROM="selfhosting.sh <admin@selfhosting.sh>"
SENT=0
FAILED=0
SKIPPED=0

log() {
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) -- [newsletter] $1" | tee -a "$LOG"
}

log "Starting newsletter send: subject='$SUBJECT'"

# Fetch all contacts from Resend
CONTACTS_JSON=$(HTTPS_PROXY="" curl -s "https://api.resend.com/contacts" \
    -H "Authorization: Bearer $RESEND_API_KEY" \
    -H "Content-Type: application/json")

if ! echo "$CONTACTS_JSON" | python3 -c "import sys,json; json.load(sys.stdin)" 2>/dev/null; then
    log "ERROR: Failed to fetch contacts — invalid JSON response"
    exit 1
fi

# Extract subscribed emails
EMAILS=$(echo "$CONTACTS_JSON" | python3 -c "
import sys, json
data = json.load(sys.stdin)
contacts = data.get('data', [])
for c in contacts:
    if not c.get('unsubscribed', False):
        print(c['email'])
")

TOTAL=$(echo "$EMAILS" | grep -c . || echo 0)
log "Found $TOTAL subscribed contacts"

if [ "$TOTAL" -eq 0 ]; then
    log "No subscribers — nothing to send"
    exit 0
fi

# Read HTML body
HTML_BODY=$(cat "$BODY_FILE")

# Send to each subscriber
while IFS= read -r email; do
    [ -z "$email" ] && continue

    # Add unsubscribe link to body
    UNSUB_URL="https://selfhosting.sh/api/unsubscribe?email=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$email'))")"
    FULL_BODY="${HTML_BODY}<br><hr style=\"border:none;border-top:1px solid #333;margin:32px 0 16px\"><p style=\"font-size:12px;color:#666;text-align:center\"><a href=\"${UNSUB_URL}\" style=\"color:#888\">Unsubscribe</a> from selfhosting.sh newsletter</p>"

    # Send via Resend
    RESPONSE=$(HTTPS_PROXY="" curl -s -w "\n%{http_code}" -X POST "https://api.resend.com/emails" \
        -H "Authorization: Bearer $RESEND_API_KEY" \
        -H "Content-Type: application/json" \
        -d "$(python3 -c "
import json, sys
print(json.dumps({
    'from': '$FROM',
    'to': ['$email'],
    'subject': '''$SUBJECT''',
    'html': sys.stdin.read()
}))
" <<< "$FULL_BODY")")

    HTTP_CODE=$(echo "$RESPONSE" | tail -1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" = "200" ]; then
        SENT=$((SENT + 1))
        log "SENT to $email (total: $SENT/$TOTAL)"
    elif [ "$HTTP_CODE" = "429" ]; then
        log "RATE LIMITED at $email — stopping (sent $SENT, remaining $((TOTAL - SENT - SKIPPED)))"
        break
    else
        FAILED=$((FAILED + 1))
        log "FAILED to $email — HTTP $HTTP_CODE: $BODY"
    fi

    # Small delay to avoid rate limiting
    sleep 0.5
done <<< "$EMAILS"

log "Newsletter complete: $SENT sent, $FAILED failed, $SKIPPED skipped out of $TOTAL total"
