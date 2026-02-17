#!/usr/bin/env python3
"""Batch post to Bluesky for selfhosting.sh"""

import json
import re
import sys
import time
import urllib.request
import urllib.error
from datetime import datetime, timezone

DID = sys.argv[1]
JWT = sys.argv[2]
PDS = sys.argv[3]

POSTS = [
    "496 self-hosting guides and counting. From Docker Compose configs to hardware recommendations \u2014 we're building the most comprehensive self-hosting resource on the internet. https://selfhosting.sh",
    "Replaced Google Photos with Immich running on a $200 mini PC. Same auto-upload, same face detection, zero cloud subscription fees. Full setup guide: https://selfhosting.sh/apps/immich/",
    "Jellyfin vs Plex in 2026: One is fully open source with no artificial limits. The other locks hardware transcoding behind a paywall. Our detailed breakdown: https://selfhosting.sh/compare/jellyfin-vs-plex/",
    "Docker tip: always use named volumes instead of bind mounts for database containers. Named volumes handle permissions correctly and survive container recreation without uid/gid headaches.",
    "Pi-hole vs AdGuard Home \u2014 both block ads at the DNS level, but their approaches differ significantly. We compared them head to head: https://selfhosting.sh/compare/pi-hole-vs-adguard-home/",
    "Self-hosting your own VPN with WireGuard takes about 10 minutes and costs $0/month after the initial server setup. No more trusting a VPN provider with your traffic. https://selfhosting.sh/apps/wireguard/",
    "If you're new to self-hosting, start here: Docker Compose basics, reverse proxy setup, SSL certificates, and the 3-2-1 backup rule. All the foundations in one place. https://selfhosting.sh/foundations/getting-started/",
    "Vaultwarden runs the full Bitwarden experience on 50MB of RAM. All the browser extensions and mobile apps work. No reason to pay for cloud password management. https://selfhosting.sh/apps/vaultwarden/",
    "The *arr stack (Sonarr + Radarr + Prowlarr + Bazarr) automates your entire media library. Pair it with Jellyfin and you've replaced multiple streaming subscriptions.",
    "Nextcloud 32 self-hosted with Docker \u2014 the complete guide. Files, calendar, contacts, office docs, and 400+ apps. Your own cloud, your rules. https://selfhosting.sh/apps/nextcloud/",
    "Quick Docker Compose tip: add restart: unless-stopped to every service. Your containers will survive reboots automatically. Only stops if you explicitly docker compose down.",
    "Best self-hosted home automation platforms compared: Home Assistant vs OpenHAB vs Domoticz. Full breakdown with Docker configs: https://selfhosting.sh/best/home-automation/",
    "Traefik vs Nginx Proxy Manager: automatic SSL and Docker label-based routing vs a clean web UI. Different philosophies, both excellent. https://selfhosting.sh/compare/nginx-proxy-manager-vs-traefik/",
    "PhotoPrism needs 4GB of swap minimum or it will get killed during photo indexing. The #1 cause of 'PhotoPrism crashed during import' \u2014 always check your swap settings first.",
    "Self-hosted analytics that actually respect privacy. Plausible, Umami, and Matomo \u2014 all open source, all GDPR-compliant, all running on your hardware. https://selfhosting.sh/best/analytics/",
]

URL_PATTERN = re.compile(r'https?://[^\s)}\]]+')


def compute_facets(text):
    facets = []
    for match in URL_PATTERN.finditer(text):
        url = match.group(0)
        while url and url[-1] in '.,;:!?)':
            url = url[:-1]
        start_char = match.start()
        byte_start = len(text[:start_char].encode('utf-8'))
        byte_end = byte_start + len(url.encode('utf-8'))
        facets.append({
            "index": {"byteStart": byte_start, "byteEnd": byte_end},
            "features": [{"$type": "app.bsky.richtext.facet#link", "uri": url}]
        })
    return facets


def post_to_bluesky(text, post_num):
    now = datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
    record = {
        "$type": "app.bsky.feed.post",
        "text": text,
        "createdAt": now,
    }
    facets = compute_facets(text)
    if facets:
        record["facets"] = facets

    payload = {
        "repo": DID,
        "collection": "app.bsky.feed.post",
        "record": record
    }

    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        f"{PDS}/xrpc/com.atproto.repo.createRecord",
        data=data,
        headers={
            "Authorization": f"Bearer {JWT}",
            "Content-Type": "application/json",
            "User-Agent": "selfhosting-sh/1.0"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req) as resp:
            result = json.loads(resp.read().decode())
            uri = result.get("uri", "unknown")
            print(f"[OK] Post {post_num}/15: {text[:70]}... -> {uri}")
            return True
    except urllib.error.HTTPError as e:
        body = e.read().decode() if e.fp else "no body"
        print(f"[FAIL] Post {post_num}/15: HTTP {e.code} - {body}")
        print(f"  Text: {text[:70]}...")
        return False
    except Exception as e:
        print(f"[FAIL] Post {post_num}/15: {e}")
        print(f"  Text: {text[:70]}...")
        return False


def main():
    success = 0
    fail = 0
    for i, text in enumerate(POSTS, 1):
        ok = post_to_bluesky(text, i)
        if ok:
            success += 1
        else:
            fail += 1
        if i < len(POSTS):
            time.sleep(3)

    print(f"\n=== RESULTS ===")
    print(f"Total: {len(POSTS)}")
    print(f"Success: {success}")
    print(f"Failed: {fail}")


if __name__ == "__main__":
    main()
