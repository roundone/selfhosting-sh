#!/bin/bash
# Post-deploy QA checks for selfhosting.sh
# Verifies: search assets, navigation, sample articles, sitemap, code blocks
# Exit code: 0 = all passed, 1 = failures found
# Usage: post-deploy-qa.sh [--verbose]

set -o pipefail

SITE="https://selfhosting.sh"
FAILURES=0
CHECKS=0
VERBOSE=""
LOG="/opt/selfhosting-sh/logs/qa.log"

[[ "$1" == "--verbose" ]] && VERBOSE=1

log() {
    local msg="$(date -u +%Y-%m-%dT%H:%M:%SZ) -- [qa] $1"
    echo "$msg" >> "$LOG"
    [[ -n "$VERBOSE" ]] && echo "$msg"
}

check() {
    local name="$1"
    local url="$2"
    local expected_status="${3:-200}"
    local content_check="$4"

    CHECKS=$((CHECKS + 1))

    local response
    response=$(curl -s -o /tmp/qa-response.html -w "%{http_code}" --max-time 10 "$url" 2>/dev/null)

    if [[ "$response" != "$expected_status" ]]; then
        log "FAIL: $name — expected $expected_status, got $response — $url"
        FAILURES=$((FAILURES + 1))
        return 1
    fi

    if [[ -n "$content_check" ]]; then
        if ! grep -q "$content_check" /tmp/qa-response.html 2>/dev/null; then
            log "FAIL: $name — missing content '$content_check' — $url"
            FAILURES=$((FAILURES + 1))
            return 1
        fi
    fi

    [[ -n "$VERBOSE" ]] && log "PASS: $name ($url)"
    return 0
}

log "Starting post-deploy QA"

# 1. Homepage
check "Homepage loads" "$SITE/" 200 "selfhosting.sh"

# 2. Search assets (Pagefind)
check "Pagefind JS" "$SITE/pagefind/pagefind.js" 200
check "Pagefind UI JS" "$SITE/pagefind/pagefind-ui.js" 200
check "Pagefind UI CSS" "$SITE/pagefind/pagefind-ui.css" 200

# 3. Sitemap
check "Sitemap index" "$SITE/sitemap-index.xml" 200 "sitemapindex"
check "Sitemap 0" "$SITE/sitemap-0.xml" 200 "urlset"

# 4. Static pages
check "About page" "$SITE/about/" 200
check "Privacy page" "$SITE/privacy/" 200
check "Terms page" "$SITE/terms/" 200

# 5. Category listing pages
check "Apps listing" "$SITE/apps/" 200
check "Compare listing" "$SITE/compare/" 200
check "Foundations listing" "$SITE/foundations/" 200
check "Hardware listing" "$SITE/hardware/" 200

# 6. Sample articles (pick a few known stable ones)
CONTENT_DIR="/opt/selfhosting-sh/site/src/content"
SAMPLE_ARTICLES=()

# Get a few real articles from disk
for collection in apps compare foundations hardware; do
    article=$(ls "$CONTENT_DIR/$collection/"*.md 2>/dev/null | head -1 | xargs -r basename 2>/dev/null | sed 's/\.md$//')
    if [[ -n "$article" ]]; then
        SAMPLE_ARTICLES+=("$collection/$article")
    fi
done

for article_path in "${SAMPLE_ARTICLES[@]}"; do
    check "Article: $article_path" "$SITE/$article_path/" 200 "<article"
done

# 7. RSS feed
check "RSS feed" "$SITE/rss.xml" 200 "rss"

# 8. robots.txt
check "robots.txt" "$SITE/robots.txt" 200 "Sitemap"

# 9. 404 page
check "404 page" "$SITE/this-page-does-not-exist-qa-test/" 404

# 10. Check OG image meta tag on homepage
check "OG tags on homepage" "$SITE/" 200 'og:title'

# Summary
log "QA complete: $CHECKS checks, $FAILURES failures"

if [[ $FAILURES -gt 0 ]]; then
    log "QA FAILED — $FAILURES of $CHECKS checks failed"
    exit 1
else
    log "QA PASSED — all $CHECKS checks passed"
    exit 0
fi
