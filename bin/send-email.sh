#!/bin/bash
# Usage: send-email.sh <to> <subject> <body-file>
# Example: send-email.sh nishant@daemonventures.com "Board Report" board/founding-report.md
#
# Reads Resend API key from credentials/api-keys.env

set -a
source /opt/selfhosting-sh/credentials/api-keys.env
set +a

TO="${1:?Usage: send-email.sh <to> <subject> <body-file>}"
SUBJECT="${2:?Missing subject}"
BODY_FILE="${3:?Missing body file}"

if [ ! -f "$BODY_FILE" ]; then
    echo "ERROR: File not found: $BODY_FILE" >&2
    exit 1
fi

python3 -c "
import json, urllib.request, sys, os

with open(sys.argv[1]) as f:
    body = f.read()

data = json.dumps({
    'from': os.environ['RESEND_FROM_EMAIL'],
    'to': [sys.argv[2]],
    'subject': sys.argv[3],
    'text': body
}).encode()

req = urllib.request.Request('https://api.resend.com/emails', data=data, headers={
    'Authorization': 'Bearer ' + os.environ['RESEND_API_KEY'],
    'Content-Type': 'application/json',
    'User-Agent': 'selfhosting-sh/1.0'
})
resp = urllib.request.urlopen(req)
print(resp.read().decode())
" "$BODY_FILE" "$TO" "$SUBJECT"
