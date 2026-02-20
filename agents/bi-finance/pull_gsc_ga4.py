#!/usr/bin/env python3
"""
Pull data from Google Search Console and GA4 APIs using service account JWT auth.
"""

import json
import time
import urllib.request
import urllib.parse
import urllib.error
import jwt  # PyJWT

# ── Configuration ──────────────────────────────────────────────────────────
SA_JSON_PATH = "/opt/selfhosting-sh/credentials/gcp-service-account.json"
GSC_SITE = "sc-domain%3Aselfhosting.sh"
GA4_PROPERTY_ID = "524871536"

GSC_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly"
GA4_SCOPE = "https://www.googleapis.com/auth/analytics.readonly"

TOKEN_URI = "https://oauth2.googleapis.com/token"

# Date ranges
GSC_START = "2026-02-14"
GSC_END = "2026-02-20"
GA4_START = "2026-02-16"
GA4_END = "2026-02-20"


def load_service_account():
    with open(SA_JSON_PATH, "r") as f:
        return json.load(f)


def get_access_token(sa, scope):
    """Create a JWT and exchange it for a Google OAuth2 access token."""
    now = int(time.time())
    payload = {
        "iss": sa["client_email"],
        "scope": scope,
        "aud": TOKEN_URI,
        "iat": now,
        "exp": now + 3600,
    }
    signed_jwt = jwt.encode(payload, sa["private_key"], algorithm="RS256")

    body = urllib.parse.urlencode({
        "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
        "assertion": signed_jwt,
    }).encode("utf-8")

    req = urllib.request.Request(TOKEN_URI, data=body, headers={
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "selfhosting-sh/1.0",
    })
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read().decode())
    return data["access_token"]


def api_request(url, token, method="GET", body=None):
    """Make an authenticated API request and return parsed JSON."""
    headers = {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json",
        "User-Agent": "selfhosting-sh/1.0",
    }
    data = json.dumps(body).encode("utf-8") if body else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        error_body = e.read().decode() if e.fp else ""
        return {"error": True, "status": e.code, "reason": e.reason, "body": error_body}


# ── GSC Search Analytics Queries ───────────────────────────────────────────

def gsc_search_analytics(token, request_body):
    url = "https://www.googleapis.com/webmasters/v3/sites/" + GSC_SITE + "/searchAnalytics/query"
    return api_request(url, token, method="POST", body=request_body)


def query_gsc(token):
    results = {}

    # Query 1: All queries with clicks/impressions/ctr/position, dimensions: query,page
    print("  [GSC] Query 1: queries by query+page (last 7 days)...")
    results["gsc_query_page"] = gsc_search_analytics(token, {
        "startDate": GSC_START,
        "endDate": GSC_END,
        "dimensions": ["query", "page"],
        "rowLimit": 100,
        "type": "web",
    })

    # Query 2: All pages with clicks/impressions/ctr/position, dimensions: page
    print("  [GSC] Query 2: pages (last 7 days)...")
    results["gsc_pages"] = gsc_search_analytics(token, {
        "startDate": GSC_START,
        "endDate": GSC_END,
        "dimensions": ["page"],
        "rowLimit": 100,
        "type": "web",
    })

    # Query 3: Daily breakdown, dimensions: date
    print("  [GSC] Query 3: daily breakdown (last 7 days)...")
    results["gsc_daily"] = gsc_search_analytics(token, {
        "startDate": GSC_START,
        "endDate": GSC_END,
        "dimensions": ["date"],
        "type": "web",
    })

    return results


# ── GSC Sitemaps ───────────────────────────────────────────────────────────

def query_gsc_sitemaps(token):
    print("  [GSC] Sitemaps list...")
    url = "https://www.googleapis.com/webmasters/v3/sites/" + GSC_SITE + "/sitemaps"
    return api_request(url, token)


# ── GA4 Reports ────────────────────────────────────────────────────────────

def ga4_run_report(token, body):
    url = "https://analyticsdata.googleapis.com/v1beta/properties/" + GA4_PROPERTY_ID + ":runReport"
    return api_request(url, token, method="POST", body=body)


def query_ga4(token):
    results = {}
    date_range = {"startDate": GA4_START, "endDate": GA4_END}

    # Report 1: Daily sessions, activeUsers, screenPageViews
    print("  [GA4] Report 1: daily sessions/users/pageviews...")
    results["ga4_daily"] = ga4_run_report(token, {
        "dateRanges": [date_range],
        "dimensions": [{"name": "date"}],
        "metrics": [
            {"name": "sessions"},
            {"name": "activeUsers"},
            {"name": "screenPageViews"},
        ],
        "orderBys": [{"dimension": {"dimensionName": "date"}}],
    })

    # Report 2: Top pages by screenPageViews
    print("  [GA4] Report 2: top pages by pageviews...")
    results["ga4_top_pages"] = ga4_run_report(token, {
        "dateRanges": [date_range],
        "dimensions": [{"name": "pagePath"}],
        "metrics": [{"name": "screenPageViews"}],
        "orderBys": [{"metric": {"metricName": "screenPageViews"}, "desc": True}],
        "limit": 20,
    })

    # Report 3: Traffic sources
    print("  [GA4] Report 3: traffic sources...")
    results["ga4_traffic_sources"] = ga4_run_report(token, {
        "dateRanges": [date_range],
        "dimensions": [
            {"name": "sessionSource"},
            {"name": "sessionMedium"},
        ],
        "metrics": [
            {"name": "sessions"},
            {"name": "activeUsers"},
        ],
        "orderBys": [{"metric": {"metricName": "sessions"}, "desc": True}],
    })

    # Report 4: New vs returning users
    print("  [GA4] Report 4: new vs returning users...")
    results["ga4_new_vs_returning"] = ga4_run_report(token, {
        "dateRanges": [date_range],
        "dimensions": [{"name": "newVsReturning"}],
        "metrics": [
            {"name": "sessions"},
            {"name": "activeUsers"},
            {"name": "screenPageViews"},
        ],
    })

    return results


# ── Main ───────────────────────────────────────────────────────────────────

def main():
    sa = load_service_account()
    all_results = {}

    # Get GSC token
    print("[1/4] Authenticating for GSC...")
    gsc_token = get_access_token(sa, GSC_SCOPE)
    print("  GSC token obtained.")

    # Get GA4 token
    print("[2/4] Authenticating for GA4...")
    ga4_token = get_access_token(sa, GA4_SCOPE)
    print("  GA4 token obtained.")

    # Pull GSC data
    print("[3/4] Pulling GSC data...")
    all_results.update(query_gsc(gsc_token))
    all_results["gsc_sitemaps"] = query_gsc_sitemaps(gsc_token)

    # Pull GA4 data
    print("[4/4] Pulling GA4 data...")
    all_results.update(query_ga4(ga4_token))

    # Output all results as JSON
    print("")
    print("=" * 80)
    print("RESULTS (JSON)")
    print("=" * 80)
    print(json.dumps(all_results, indent=2))


if __name__ == "__main__":
    main()
