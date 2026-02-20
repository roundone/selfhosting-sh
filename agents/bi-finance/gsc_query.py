#!/usr/bin/env python3
"""Query Google Search Console for selfhosting.sh search analytics data."""

import json
import base64
import time
import urllib.request
import urllib.error
import urllib.parse

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding as asym_padding


def b64url_encode(data: bytes) -> str:
    """Base64url encode without padding."""
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def create_jwt(service_account: dict, scope: str) -> str:
    """Create a signed JWT for Google API authentication."""
    now = int(time.time())

    # JWT Header
    header = {"alg": "RS256", "typ": "JWT"}

    # JWT Payload
    payload = {
        "iss": service_account["client_email"],
        "scope": scope,
        "aud": "https://oauth2.googleapis.com/token",
        "iat": now,
        "exp": now + 3600,
    }

    # Encode header and payload
    header_b64 = b64url_encode(json.dumps(header).encode("utf-8"))
    payload_b64 = b64url_encode(json.dumps(payload).encode("utf-8"))
    signing_input = f"{header_b64}.{payload_b64}".encode("ascii")

    # Load private key and sign
    private_key = serialization.load_pem_private_key(
        service_account["private_key"].encode("utf-8"),
        password=None,
    )
    signature = private_key.sign(
        signing_input,
        asym_padding.PKCS1v15(),
        hashes.SHA256(),
    )
    signature_b64 = b64url_encode(signature)

    return f"{header_b64}.{payload_b64}.{signature_b64}"


def exchange_jwt_for_token(jwt_token: str) -> str:
    """Exchange a signed JWT for a Google OAuth2 access token."""
    token_url = "https://oauth2.googleapis.com/token"
    data = urllib.parse.urlencode({
        "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
        "assertion": jwt_token,
    }).encode("utf-8")

    req = urllib.request.Request(
        token_url,
        data=data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        result = json.loads(resp.read().decode("utf-8"))
    return result["access_token"]


def gsc_search_analytics(access_token: str) -> dict:
    """Query GSC searchAnalytics/query endpoint."""
    url = "https://www.googleapis.com/webmasters/v3/sites/sc-domain%3Aselfhosting.sh/searchAnalytics/query"

    body = json.dumps({
        "startDate": "2026-02-14",
        "endDate": "2026-02-20",
        "dimensions": ["query", "page"],
        "rowLimit": 25,
    }).encode("utf-8")

    req = urllib.request.Request(
        url,
        data=body,
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
            "User-Agent": "selfhosting-sh/1.0",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def gsc_sitemaps(access_token: str) -> dict:
    """Query GSC sitemaps endpoint."""
    url = "https://www.googleapis.com/webmasters/v3/sites/sc-domain%3Aselfhosting.sh/sitemaps"

    req = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Bearer {access_token}",
            "User-Agent": "selfhosting-sh/1.0",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def main():
    # 1. Read service account credentials
    sa_path = "/opt/selfhosting-sh/credentials/gcp-service-account.json"
    with open(sa_path, "r") as f:
        service_account = json.load(f)

    print(f"Service account email: {service_account['client_email']}")
    print(f"Project ID: {service_account.get('project_id', 'N/A')}")
    print()

    # 2. Create JWT
    scope = "https://www.googleapis.com/auth/webmasters.readonly"
    jwt_token = create_jwt(service_account, scope)
    print("JWT created successfully.")
    print()

    # 3. Exchange JWT for access token
    try:
        access_token = exchange_jwt_for_token(jwt_token)
        print("Access token obtained successfully.")
        print(f"Token prefix: {access_token[:20]}...")
        print()
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        print(f"ERROR obtaining access token: HTTP {e.code}")
        print(f"Response: {error_body}")
        return

    # 4. Query searchAnalytics
    print("=" * 70)
    print("SEARCH ANALYTICS (2026-02-14 to 2026-02-20, top 25 by query+page)")
    print("=" * 70)
    try:
        analytics = gsc_search_analytics(access_token)
        print(json.dumps(analytics, indent=2))
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        print(f"ERROR querying searchAnalytics: HTTP {e.code}")
        print(f"Response: {error_body}")
        analytics = None

    print()

    # 5. Query sitemaps
    print("=" * 70)
    print("SITEMAPS")
    print("=" * 70)
    try:
        sitemaps = gsc_sitemaps(access_token)
        print(json.dumps(sitemaps, indent=2))
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        print(f"ERROR querying sitemaps: HTTP {e.code}")
        print(f"Response: {error_body}")
        sitemaps = None

    # Summary
    print()
    print("=" * 70)
    print("SUMMARY")
    print("=" * 70)
    if analytics and "rows" in analytics:
        rows = analytics["rows"]
        print(f"Total rows returned: {len(rows)}")
        total_clicks = sum(r.get("clicks", 0) for r in rows)
        total_impressions = sum(r.get("impressions", 0) for r in rows)
        print(f"Total clicks (across returned rows): {total_clicks}")
        print(f"Total impressions (across returned rows): {total_impressions}")

        # Count page 1 keywords (position <= 10)
        page1 = [r for r in rows if r.get("position", 999) <= 10.0]
        print(f"Rows with avg position <= 10 (page 1): {len(page1)}")

        # Top queries by clicks
        print()
        print("Top rows by clicks:")
        sorted_rows = sorted(rows, key=lambda r: r.get("clicks", 0), reverse=True)
        for r in sorted_rows[:10]:
            keys = r.get("keys", [])
            query = keys[0] if len(keys) > 0 else "N/A"
            page = keys[1] if len(keys) > 1 else "N/A"
            print(f"  query={query!r}  page={page!r}  clicks={r.get('clicks',0)}  impressions={r.get('impressions',0)}  position={r.get('position',0):.1f}  ctr={r.get('ctr',0):.3f}")
    elif analytics:
        print("No rows returned from searchAnalytics. The site may have no search data for this date range.")
    else:
        print("searchAnalytics query failed.")

    if sitemaps and "sitemap" in sitemaps:
        print(f"\nSitemaps count: {len(sitemaps['sitemap'])}")
        for sm in sitemaps["sitemap"]:
            print(f"  {sm.get('path', 'N/A')} -- type={sm.get('type', 'N/A')}  submitted={sm.get('lastSubmitted', 'N/A')}  contents={sm.get('contents', [])}")
    elif sitemaps:
        print("\nNo sitemaps found.")
    else:
        print("\nSitemaps query failed.")


if __name__ == "__main__":
    main()
