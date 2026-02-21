#!/usr/bin/env python3
"""
Request indexing for top 20 selfhosting.sh URLs via Google APIs.

Strategy:
1. Try the Indexing API (urlNotifications:publish) first.
2. Fall back to the Search Console URL Inspection API.
"""

import json
import time
import urllib.request
import urllib.error
import urllib.parse
import jwt
from datetime import datetime, timezone

SERVICE_ACCOUNT_FILE = "/opt/selfhosting-sh/credentials/gcp-service-account.json"
SITE_URL = "sc-domain:selfhosting.sh"
USER_AGENT = "selfhosting-sh/1.0"

URLS = [
    "https://selfhosting.sh/",
    "https://selfhosting.sh/apps/",
    "https://selfhosting.sh/compare/",
    "https://selfhosting.sh/hardware/proxmox-hardware-guide/",
    "https://selfhosting.sh/compare/freshrss-vs-miniflux/",
    "https://selfhosting.sh/compare/kavita-vs-calibre-web/",
    "https://selfhosting.sh/hardware/raspberry-pi-alternatives/",
    "https://selfhosting.sh/replace/google-dns/",
    "https://selfhosting.sh/foundations/reverse-proxy-explained/",
    "https://selfhosting.sh/compare/haproxy-vs-nginx/",
    "https://selfhosting.sh/compare/appflowy-vs-affine/",
    "https://selfhosting.sh/compare/nextcloud-vs-syncthing/",
    "https://selfhosting.sh/foundations/docker-compose-basics/",
    "https://selfhosting.sh/apps/immich/",
    "https://selfhosting.sh/apps/jellyfin/",
    "https://selfhosting.sh/best/home-automation/",
    "https://selfhosting.sh/compare/ollama-vs-localai/",
    "https://selfhosting.sh/compare/meilisearch-vs-typesense/",
    "https://selfhosting.sh/hardware/virtualization-hardware-compared/",
    "https://selfhosting.sh/apps/nextcloud/",
]

with open(SERVICE_ACCOUNT_FILE) as f:
    sa = json.load(f)

def get_access_token(scopes):
    now = int(time.time())
    payload = {
        "iss": sa["client_email"],
        "scope": " ".join(scopes),
        "aud": sa["token_uri"],
        "iat": now,
        "exp": now + 3600,
    }
    signed_jwt = jwt.encode(payload, sa["private_key"], algorithm="RS256")
    data = urllib.parse.urlencode({
        "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
        "assertion": signed_jwt,
    }).encode()
    req = urllib.request.Request(
        sa["token_uri"],
        data=data,
        headers={"User-Agent": USER_AGENT, "Content-Type": "application/x-www-form-urlencoded"},
    )
    with urllib.request.urlopen(req) as resp:
        token_data = json.loads(resp.read())
    return token_data["access_token"]

print("=" * 70)
print("Obtaining access token...")
try:
    access_token = get_access_token([
        "https://www.googleapis.com/auth/webmasters",
        "https://www.googleapis.com/auth/indexing",
    ])
    print("Access token obtained successfully.")
except Exception as e:
    print(f"FATAL: Could not obtain access token: {e}")
    raise

# Phase 1: Try Indexing API with first 2 URLs
print("\n" + "=" * 70)
print("PHASE 1: Attempting Google Indexing API (urlNotifications:publish)")
print("=" * 70)

indexing_api_works = False
indexing_results = {}

for i, url in enumerate(URLS[:2], 1):
    print(f"\n[{i}/2] Testing Indexing API with: {url}")
    body = json.dumps({"url": url, "type": "URL_UPDATED"}).encode()
    req = urllib.request.Request(
        "https://indexing.googleapis.com/v3/urlNotifications:publish",
        data=body,
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
            "User-Agent": USER_AGENT,
        },
    )
    try:
        with urllib.request.urlopen(req) as resp:
            result = json.loads(resp.read())
            print(f"  SUCCESS: {result}")
            indexing_results[url] = {"status": "success", "result": result}
            indexing_api_works = True
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        print(f"  FAILED ({e.code}): {error_body[:300]}")
        indexing_results[url] = {"status": "error", "code": e.code, "message": error_body[:300]}
        if e.code in (403, 401):
            print("  -> Indexing API not authorized (expected for non-JobPosting sites).")
            break
    except Exception as e:
        print(f"  FAILED: {e}")
        indexing_results[url] = {"status": "error", "message": str(e)}
        break
    time.sleep(0.5)

# If Indexing API works, submit all remaining URLs
if indexing_api_works:
    print("\nIndexing API works! Submitting remaining URLs...")
    for i, url in enumerate(URLS[2:], 3):
        print(f"\n[{i}/{len(URLS)}] Submitting: {url}")
        body = json.dumps({"url": url, "type": "URL_UPDATED"}).encode()
        req = urllib.request.Request(
            "https://indexing.googleapis.com/v3/urlNotifications:publish",
            data=body,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
                "User-Agent": USER_AGENT,
            },
        )
        try:
            with urllib.request.urlopen(req) as resp:
                result = json.loads(resp.read())
                print(f"  SUCCESS: {result}")
                indexing_results[url] = {"status": "success", "result": result}
        except urllib.error.HTTPError as e:
            error_body = e.read().decode()
            print(f"  FAILED ({e.code}): {error_body[:300]}")
            indexing_results[url] = {"status": "error", "code": e.code, "message": error_body[:300]}
        except Exception as e:
            print(f"  FAILED: {e}")
            indexing_results[url] = {"status": "error", "message": str(e)}
        time.sleep(0.5)

# Phase 2: URL Inspection API
print("\n" + "=" * 70)
print("PHASE 2: Using Search Console URL Inspection API")
print("=" * 70)

inspection_results = {}
success_count = 0
fail_count = 0

for i, url in enumerate(URLS, 1):
    print(f"\n[{i}/{len(URLS)}] Inspecting: {url}")
    body = json.dumps({
        "inspectionUrl": url,
        "siteUrl": SITE_URL,
    }).encode()
    req = urllib.request.Request(
        "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect",
        data=body,
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
            "User-Agent": USER_AGENT,
        },
    )
    try:
        with urllib.request.urlopen(req) as resp:
            result = json.loads(resp.read())
        inspection = result.get("inspectionResult", {})
        index_status = inspection.get("indexStatusResult", {})
        verdict = index_status.get("verdict", "UNKNOWN")
        coverage_state = index_status.get("coverageState", "UNKNOWN")
        crawled_as = index_status.get("crawledAs", "UNKNOWN")
        last_crawl = index_status.get("lastCrawlTime", "never")
        robots_txt = index_status.get("robotsTxtState", "UNKNOWN")
        indexing_state = index_status.get("indexingState", "UNKNOWN")
        page_fetch = index_status.get("pageFetchState", "UNKNOWN")

        print(f"  Verdict:        {verdict}")
        print(f"  Coverage:       {coverage_state}")
        print(f"  Indexing State: {indexing_state}")
        print(f"  Crawled As:     {crawled_as}")
        print(f"  Last Crawl:     {last_crawl}")
        print(f"  Robots.txt:     {robots_txt}")
        print(f"  Page Fetch:     {page_fetch}")

        inspection_results[url] = {
            "status": "success",
            "verdict": verdict,
            "coverage": coverage_state,
            "indexing_state": indexing_state,
            "last_crawl": last_crawl,
            "crawled_as": crawled_as,
            "robots_txt": robots_txt,
            "page_fetch": page_fetch,
        }
        success_count += 1
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        print(f"  FAILED ({e.code}): {error_body[:500]}")
        inspection_results[url] = {
            "status": "error",
            "code": e.code,
            "message": error_body[:500],
        }
        fail_count += 1
    except Exception as e:
        print(f"  FAILED: {e}")
        inspection_results[url] = {"status": "error", "message": str(e)}
        fail_count += 1
    time.sleep(1.0)

# Summary
print("\n" + "=" * 70)
print("SUMMARY")
print("=" * 70)
print(f"\nIndexing API (Phase 1): {'WORKS' if indexing_api_works else 'NOT AVAILABLE (expected for non-JobPosting sites)'}")
if indexing_api_works:
    idx_ok = sum(1 for r in indexing_results.values() if r.get("status") == "success")
    idx_fail = sum(1 for r in indexing_results.values() if r.get("status") == "error")
    print(f"  Succeeded: {idx_ok}/{len(indexing_results)}")
    print(f"  Failed:    {idx_fail}/{len(indexing_results)}")

print(f"\nURL Inspection API (Phase 2):")
print(f"  Succeeded: {success_count}/{len(URLS)}")
print(f"  Failed:    {fail_count}/{len(URLS)}")

print("\nDetailed Inspection Results:")
print("-" * 70)
for url in URLS:
    r = inspection_results.get(url, {})
    if r.get("status") == "success":
        print(f"  OK   {url}")
        print(f"       verdict={r['verdict']}  coverage={r['coverage']}  last_crawl={r['last_crawl']}")
    else:
        code = r.get("code", "?")
        msg = r.get("message", "unknown error")[:120]
        print(f"  FAIL {url}")
        print(f"       code={code}  msg={msg}")

output_file = "/opt/selfhosting-sh/reports/indexing-request-2026-02-21.json"
with open(output_file, "w") as f:
    json.dump({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "indexing_api_results": indexing_results,
        "inspection_results": inspection_results,
        "summary": {
            "indexing_api_available": indexing_api_works,
            "inspection_succeeded": success_count,
            "inspection_failed": fail_count,
            "total_urls": len(URLS),
        },
    }, f, indent=2)
print(f"\nResults saved to: {output_file}")
