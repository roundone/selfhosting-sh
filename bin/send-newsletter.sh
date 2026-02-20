#!/bin/bash
# send-newsletter.sh — Send newsletter to all subscribed contacts via Resend API
#
# Usage: send-newsletter.sh <subject> <html-body-file>
#   subject:        Email subject line
#   html-body-file: Path to file containing HTML email body
#
# Reads subscribers from data/subscribers.json (managed by portal-server.js)
# Sends via Resend API (100 emails/day free tier)
# Each email includes an unsubscribe link
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
SUBSCRIBERS_FILE="/opt/selfhosting-sh/data/subscribers.json"
FROM="selfhosting.sh <admin@selfhosting.sh>"
SENT=0
FAILED=0

log() {
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) -- [newsletter] $1" | tee -a "$LOG"
}

log "Starting newsletter send: subject='$SUBJECT'"

# Read subscribers from local file
if [ ! -f "$SUBSCRIBERS_FILE" ]; then
    log "No subscribers file found at $SUBSCRIBERS_FILE"
    exit 0
fi

# Extract subscribed (non-unsubscribed) emails
EMAILS=$(python3 -c "
import json
with open('$SUBSCRIBERS_FILE') as f:
    subs = json.load(f)
for s in subs:
    if not s.get('unsubscribed', False):
        print(s['email'])
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

    # Build unsubscribe URL
    UNSUB_URL="https://selfhosting.sh/api/unsubscribe?email=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$email'))")"

    # Append unsubscribe footer
    FULL_BODY="${HTML_BODY}<br><hr style=\"border:none;border-top:1px solid #333;margin:32px 0 16px\"><p style=\"font-size:12px;color:#666;text-align:center\"><a href=\"${UNSUB_URL}\" style=\"color:#888\">Unsubscribe</a> from selfhosting.sh newsletter</p>"

    # Build JSON payload via python (safe escaping)
    PAYLOAD=$(python3 -c "
import json, sys
body = sys.stdin.read()
print(json.dumps({
    'from': '$FROM',
    'to': ['$email'],
    'subject': '$SUBJECT',
    'html': body
}))
" <<< "$FULL_BODY")

    # Send via Resend
    RESPONSE=$(HTTPS_PROXY="" curl -s -w "\n%{http_code}" -X POST "https://api.resend.com/emails" \
        -H "Authorization: Bearer $RESEND_API_KEY" \
        -H "Content-Type: application/json" \
        -d "$PAYLOAD")

    HTTP_CODE=$(echo "$RESPONSE" | tail -1)
    RESP_BODY=$(echo "$RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" = "200" ]; then
        SENT=$((SENT + 1))
        log "SENT to $email ($SENT/$TOTAL)"
    elif [ "$HTTP_CODE" = "429" ]; then
        log "RATE LIMITED at $email — stopping (sent $SENT, remaining $((TOTAL - SENT)))"
        break
    else
        FAILED=$((FAILED + 1))
        log "FAILED to $email — HTTP $HTTP_CODE: $RESP_BODY"
    fi

    # Small delay to avoid rate limiting
    sleep 0.5
done <<< "$EMAILS"

log "Newsletter complete: $SENT sent, $FAILED failed out of $TOTAL total"
