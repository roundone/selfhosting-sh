#!/usr/bin/env node
/**
 * check-releases.js — ETag-based release and feed checker
 *
 * Called hourly by coordinator.js. Uses conditional HTTP requests (If-None-Match)
 * to check GitHub releases and RSS feeds. On 304 Not Modified: nothing happens.
 * On 200 with new data: writes an event to events/ for the coordinator to route.
 *
 * Zero Claude API usage. Pure Node.js stdlib. Runs fast (<5s on typical hour
 * with no changes).
 *
 * ETag cache: reports/etag-cache.json
 * Structure:
 * {
 *   "github_repos": {
 *     "immich-app/immich": {
 *       "etag": "\"abc123\"",
 *       "latestVersion": "v1.122.3",
 *       "lastChecked": "2026-02-18T10:00:00Z",
 *       "lastChanged": "2026-02-17T09:00:00Z"
 *     }
 *   },
 *   "rss_feeds": {
 *     "https://selfh.st/index.xml": {
 *       "etag": "\"def456\"",
 *       "lastChecked": "2026-02-18T10:00:00Z",
 *       "lastChanged": "..."
 *     }
 *   }
 * }
 *
 * BI writes new repos to this file when it discovers them by scanning content/.
 * This script just checks — it does not decide which repos to watch.
 *
 * Bootstrap: if github_repos is empty, scans site/src/content/ for GitHub URLs
 * to seed the cache with the apps we're already writing about.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');

const REPO_ROOT = '/opt/selfhosting-sh';
const EVENTS_DIR = path.join(REPO_ROOT, 'events');
const CACHE_FILE = path.join(REPO_ROOT, 'reports', 'etag-cache.json');
const CONTENT_DIR = path.join(REPO_ROOT, 'site', 'src', 'content');
const LOG_PREFIX = '[check-releases]';

// RSS feeds to monitor for competitor content changes
const RSS_FEEDS = [
    'https://selfh.st/index.xml',
    'https://noted.lol/rss',
];

// awesome-selfhosted README via GitHub Contents API (supports ETag)
const AWESOME_SELFHOSTED_API = 'https://api.github.com/repos/awesome-selfhosted/awesome-selfhosted/contents/README.md';

// ─── Utilities ───────────────────────────────────────────────────────────────

function log(msg) {
    console.log(`${new Date().toISOString()} ${LOG_PREFIX} ${msg}`);
}

function loadCache() {
    try {
        const raw = fs.readFileSync(CACHE_FILE, 'utf8');
        return JSON.parse(raw);
    } catch (_) {
        return { github_repos: {}, rss_feeds: {} };
    }
}

function saveCache(cache) {
    fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

function writeEvent(filename, data) {
    fs.mkdirSync(EVENTS_DIR, { recursive: true });
    fs.writeFileSync(path.join(EVENTS_DIR, filename), JSON.stringify(data, null, 2));
    log(`event written: ${filename}`);
}

function makeTimestamp() {
    return new Date().toISOString().replace(/[:.]/g, '').slice(0, 15) + 'Z';
}

// ─── HTTP with ETag support ───────────────────────────────────────────────────

function httpGet(url, options = {}) {
    return new Promise((resolve) => {
        const parsed = new URL(url);
        const headers = { 'User-Agent': 'selfhosting.sh-check-releases/1.0' };
        if (options.etag) headers['If-None-Match'] = options.etag;
        if (options.token) headers['Authorization'] = `Bearer ${options.token}`;

        const req = https.get({ hostname: parsed.hostname, path: parsed.pathname + parsed.search, headers }, (res) => {
            let body = '';
            res.on('data', d => body += d);
            res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
        });
        req.on('error', (e) => resolve({ status: 0, error: e.message }));
        req.setTimeout(10000, () => { req.destroy(); resolve({ status: 0, error: 'timeout' }); });
    });
}

// ─── Bootstrap: discover GitHub repos from content files ─────────────────────

function discoverReposFromContent() {
    const repos = new Set();
    if (!fs.existsSync(CONTENT_DIR)) return repos;

    // Regex to extract github.com/owner/repo from frontmatter or body
    const githubRe = /github\.com\/([a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+)/g;

    function scanDir(dir) {
        try {
            for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
                if (entry.isDirectory()) {
                    scanDir(path.join(dir, entry.name));
                } else if (entry.name.endsWith('.md') || entry.name.endsWith('.mdx')) {
                    try {
                        const content = fs.readFileSync(path.join(dir, entry.name), 'utf8');
                        // Only check first 3000 chars (frontmatter + intro) to stay fast
                        const sample = content.slice(0, 3000);
                        let match;
                        while ((match = githubRe.exec(sample)) !== null) {
                            // Filter out non-app repos (docs, wikis, etc.)
                            const repo = match[1].replace(/\.(git|md)$/, '');
                            if (!repo.includes('github.com') && repo.split('/').length === 2) {
                                repos.add(repo);
                            }
                        }
                        githubRe.lastIndex = 0; // reset regex state
                    } catch (_) { /* skip unreadable files */ }
                }
            }
        } catch (_) { /* skip unreadable dirs */ }
    }

    scanDir(CONTENT_DIR);
    return repos;
}

// ─── GitHub release checking ──────────────────────────────────────────────────

async function checkGithubRepo(owner_repo, cached, token) {
    const url = `https://api.github.com/repos/${owner_repo}/releases/latest`;
    const res = await httpGet(url, { etag: cached.etag, token });

    if (res.status === 304) {
        log(`  ${owner_repo} → 304 unchanged`);
        return { changed: false, etag: cached.etag };
    }

    if (res.status === 200) {
        const etag = res.headers['etag'] || null;
        let latestVersion = null;
        let releaseUrl = null;
        let hasBreakingChanges = false;
        try {
            const data = JSON.parse(res.body);
            latestVersion = data.tag_name;
            releaseUrl = data.html_url;
            const body = (data.body || '').toLowerCase();
            hasBreakingChanges = body.includes('breaking') || body.includes('migration');
        } catch (_) { /* malformed JSON — treat as unchanged */ }

        if (latestVersion && latestVersion !== cached.latestVersion) {
            log(`  ${owner_repo} → NEW RELEASE ${cached.latestVersion || 'none'} → ${latestVersion}`);
            return {
                changed: true, etag,
                latestVersion, releaseUrl, hasBreakingChanges,
                previousVersion: cached.latestVersion || null,
            };
        }
        log(`  ${owner_repo} → 200 but same version (${latestVersion})`);
        return { changed: false, etag };
    }

    if (res.status === 404) {
        log(`  ${owner_repo} → 404 (no releases or repo not found)`);
    } else {
        log(`  ${owner_repo} → HTTP ${res.status} ${res.error || ''}`);
    }
    return { changed: false, etag: cached.etag };
}

// ─── RSS / feed checking ─────────────────────────────────────────────────────

async function checkFeed(feedUrl, cached) {
    const res = await httpGet(feedUrl, { etag: cached.etag });
    const etag = res.headers?.['etag'] || res.headers?.['last-modified'] || null;

    if (res.status === 304) {
        log(`  ${feedUrl} → 304 unchanged`);
        return { changed: false, etag: cached.etag };
    }
    if (res.status === 200) {
        if (etag && etag !== cached.etag) {
            log(`  ${feedUrl} → CHANGED`);
            return { changed: true, etag };
        }
        log(`  ${feedUrl} → 200 but no ETag change (feed may not support ETags)`);
        return { changed: false, etag };
    }
    log(`  ${feedUrl} → HTTP ${res.status} ${res.error || ''}`);
    return { changed: false, etag: cached.etag };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    log('starting');
    const cache = loadCache();
    const now = new Date().toISOString();
    let githubEventsWritten = 0;
    let feedEventsWritten = 0;

    // Read GitHub token from env or credentials file (optional — improves rate limit from 60 to 5000/hr)
    let githubToken = process.env.GITHUB_TOKEN || null;
    if (!githubToken) {
        try {
            const creds = fs.readFileSync(path.join(REPO_ROOT, 'credentials', 'api-keys.env'), 'utf8');
            const match = creds.match(/^GITHUB_TOKEN=(.+)$/m);
            if (match) githubToken = match[1].trim();
        } catch (_) { /* no token — use unauthenticated (60/hr limit) */ }
    }

    // Bootstrap: seed cache with repos from content if empty
    if (Object.keys(cache.github_repos).length === 0) {
        log('cache is empty — bootstrapping from content directory');
        const discovered = discoverReposFromContent();
        log(`  discovered ${discovered.size} GitHub repos from content`);
        for (const repo of discovered) {
            cache.github_repos[repo] = { etag: null, latestVersion: null, lastChecked: null, lastChanged: null };
        }
        // Also add awesome-selfhosted as a special RSS-style feed via GitHub API
        if (!(AWESOME_SELFHOSTED_API in (cache.rss_feeds || {}))) {
            cache.rss_feeds = cache.rss_feeds || {};
            cache.rss_feeds[AWESOME_SELFHOSTED_API] = { etag: null, lastChecked: null, lastChanged: null };
        }
    }

    // Ensure RSS feeds list is initialized
    cache.rss_feeds = cache.rss_feeds || {};
    for (const feed of RSS_FEEDS) {
        if (!cache.rss_feeds[feed]) {
            cache.rss_feeds[feed] = { etag: null, lastChecked: null, lastChanged: null };
        }
    }

    // ── Check GitHub repos ─────────────────────────────────────────────────
    const repos = Object.entries(cache.github_repos);
    log(`checking ${repos.length} GitHub repos`);

    for (const [repo, cached] of repos) {
        try {
            const result = await checkGithubRepo(repo, cached, githubToken);
            cache.github_repos[repo].etag = result.etag;
            cache.github_repos[repo].lastChecked = now;
            if (result.changed) {
                cache.github_repos[repo].latestVersion = result.latestVersion;
                cache.github_repos[repo].lastChanged = now;
                const ts = makeTimestamp();
                writeEvent(`bi-finance-github-release-${ts}.json`, {
                    type: 'github-release',
                    repo,
                    latestVersion: result.latestVersion,
                    previousVersion: result.previousVersion,
                    releaseUrl: result.releaseUrl,
                    hasBreakingChanges: result.hasBreakingChanges,
                    ts: now,
                });
                githubEventsWritten++;
            }
        } catch (e) {
            log(`  ERROR checking ${repo}: ${e.message}`);
        }
        // Respect GitHub rate limits: 60 unauthenticated/hr = 1/min max.
        // We check hourly so all repos run in one batch; pace at 500ms/request.
        await new Promise(r => setTimeout(r, 500));
    }

    // ── Check RSS feeds ────────────────────────────────────────────────────
    log(`checking ${Object.keys(cache.rss_feeds).length} feeds`);

    for (const [feedUrl, cached] of Object.entries(cache.rss_feeds)) {
        try {
            const result = await checkFeed(feedUrl, cached);
            cache.rss_feeds[feedUrl].etag = result.etag;
            cache.rss_feeds[feedUrl].lastChecked = now;
            if (result.changed) {
                cache.rss_feeds[feedUrl].lastChanged = now;
                const ts = makeTimestamp();
                // awesome-selfhosted changes go only to BI; competitor feeds go to both BI and Marketing
                const isAwesome = feedUrl.includes('awesome-selfhosted');
                const recipient = isAwesome ? 'bi-finance' : 'bi-finance';
                writeEvent(`${recipient}-feed-updated-${ts}.json`, {
                    type: 'feed-updated',
                    feedUrl,
                    ts: now,
                });
                feedEventsWritten++;
            }
        } catch (e) {
            log(`  ERROR checking ${feedUrl}: ${e.message}`);
        }
        await new Promise(r => setTimeout(r, 200));
    }

    saveCache(cache);
    log(`done — ${githubEventsWritten} release event(s), ${feedEventsWritten} feed event(s) written`);
}

main().catch(e => {
    console.error(`${LOG_PREFIX} FATAL: ${e.message}`);
    process.exit(1);
});
