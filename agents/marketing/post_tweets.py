#!/usr/bin/env python3
"""Post a batch of tweets to X/Twitter using OAuth 1.0a and the v2 API."""

import json
import os
import time
from requests_oauthlib import OAuth1Session

# Load credentials from env file
env_file = "/opt/selfhosting-sh/credentials/api-keys.env"
with open(env_file) as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, _, value = line.partition("=")
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            os.environ[key] = value

consumer_key = os.environ["X_API_KEY"]
consumer_secret = os.environ["X_API_SECRET"]
access_token = os.environ["X_ACCESS_TOKEN"]
access_token_secret = os.environ["X_ACCESS_SECRET"]

# Create OAuth1 session
oauth = OAuth1Session(
    consumer_key,
    client_secret=consumer_secret,
    resource_owner_key=access_token,
    resource_owner_secret=access_token_secret,
)

TWEETS = [
    "We just launched selfhosting.sh \u2014 350+ guides covering every self-hosted app worth running. Docker Compose configs, comparisons, hardware recommendations. All free. https://selfhosting.sh #selfhosted #homelab",
    "Self-hosting Immich replaced Google Photos for me. Full Docker Compose setup, automatic backups, face recognition \u2014 and your photos never leave your network. Guide: https://selfhosting.sh/apps/immich/",
    "Jellyfin vs Plex in 2026: Jellyfin is fully open source with no subscription needed. Plex has better apps but locks features behind Plex Pass. Full breakdown: https://selfhosting.sh/compare/jellyfin-vs-plex/",
    "Quick Docker tip: Always add `restart: unless-stopped` to every service in your compose file. Your containers will survive reboots without you thinking about it.",
    "Pi-hole vs AdGuard Home \u2014 both block ads at the DNS level, but AdGuard Home has a cleaner UI and built-in HTTPS. Pi-hole has the larger community. Comparison: https://selfhosting.sh/compare/pi-hole-vs-adguard-home/",
    "Self-hosted alternatives to popular cloud services \u2014 we cover 98 apps across every category. Replace Google Photos, Notion, LastPass, Plex, and more. Browse by category: https://selfhosting.sh",
    "Setting up a reverse proxy is the #1 thing that makes self-hosting feel professional. Traefik vs Caddy vs Nginx Proxy Manager \u2014 each has its sweet spot. Start here: https://selfhosting.sh/foundations/reverse-proxy-explained/",
    "Vaultwarden is the best self-hosted password manager. Compatible with all Bitwarden clients, uses 10x less RAM, runs in a single Docker container. Guide: https://selfhosting.sh/apps/vaultwarden/ #selfhosted",
]

API_URL = "https://api.x.com/2/tweets"

results = []

for i, tweet_text in enumerate(TWEETS, 1):
    print(f"\n--- Tweet {i}/{len(TWEETS)} ---")
    print(f"Text: {tweet_text[:80]}...")

    try:
        response = oauth.post(API_URL, json={"text": tweet_text})
        status = response.status_code
        body = response.json() if response.text else {}

        if status in (200, 201):
            tweet_id = body.get("data", {}).get("id", "unknown")
            print(f"SUCCESS (HTTP {status}) -- Tweet ID: {tweet_id}")
            results.append({"tweet": i, "status": "SUCCESS", "id": tweet_id})
        else:
            print(f"FAILED (HTTP {status})")
            print(f"Response: {json.dumps(body, indent=2)}")
            results.append({"tweet": i, "status": "FAILED", "http_code": status, "error": body})
    except Exception as e:
        print(f"ERROR: {e}")
        results.append({"tweet": i, "status": "ERROR", "error": str(e)})

    # 2-second delay between tweets (skip after last one)
    if i < len(TWEETS):
        print("Waiting 2 seconds...")
        time.sleep(2)

# Summary
print("\n" + "=" * 60)
print("SUMMARY")
print("=" * 60)
succeeded = sum(1 for r in results if r["status"] == "SUCCESS")
failed = sum(1 for r in results if r["status"] != "SUCCESS")
print(f"Succeeded: {succeeded}/{len(TWEETS)}")
print(f"Failed: {failed}/{len(TWEETS)}")

for r in results:
    status_icon = "OK" if r["status"] == "SUCCESS" else "FAIL"
    extra = f" (ID: {r['id']})" if r.get("id") else f" (HTTP {r.get('http_code', 'N/A')})"
    print(f"  Tweet {r['tweet']}: [{status_icon}]{extra}")
