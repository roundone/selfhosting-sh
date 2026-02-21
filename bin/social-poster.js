#!/usr/bin/env node
/**
 * social-poster.js — Queue-based social media poster
 *
 * Called every 5 minutes by coordinator.js. Reads from queues/social-queue.jsonl,
 * posts to social platforms respecting per-platform intervals from config/social.json,
 * and tracks last-posted timestamps in queues/social-state.json.
 *
 * Only posts to platforms with real credentials. Skips PENDING_ credentials silently.
 * Processes one post per platform per run.
 *
 * Zero Claude API usage. Pure Node.js stdlib (https module).
 */

'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const crypto = require('crypto');

const REPO_ROOT = '/opt/selfhosting-sh';
const QUEUE_FILE = path.join(REPO_ROOT, 'queues', 'social-queue.jsonl');
const STATE_FILE = path.join(REPO_ROOT, 'queues', 'social-state.json');
const CONFIG_FILE = path.join(REPO_ROOT, 'config', 'social.json');
const LOG_FILE = path.join(REPO_ROOT, 'logs', 'social-poster.log');
const CREDS_FILE = path.join(REPO_ROOT, 'credentials', 'api-keys.env');

// ─── Utilities ───────────────────────────────────────────────────────────────

function log(msg) {
    const ts = new Date().toISOString();
    const line = `${ts} [social-poster] ${msg}\n`;
    fs.appendFileSync(LOG_FILE, line);
    process.stdout.write(line);
}

function loadJson(filepath, fallback) {
    try {
        return JSON.parse(fs.readFileSync(filepath, 'utf8'));
    } catch {
        return fallback;
    }
}

function saveJson(filepath, data) {
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2) + '\n');
}

function loadCreds() {
    const env = {};
    try {
        const lines = fs.readFileSync(CREDS_FILE, 'utf8').split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const eqIdx = trimmed.indexOf('=');
            if (eqIdx === -1) continue;
            const key = trimmed.slice(0, eqIdx).trim();
            const val = trimmed.slice(eqIdx + 1).trim();
            env[key] = val;
        }
    } catch (e) {
        log(`ERROR loading credentials: ${e.message}`);
    }
    return env;
}

function isRealCredential(value) {
    return value && !value.startsWith('PENDING_') && value.length > 5;
}

// ─── Article reading helpers ─────────────────────────────────────────────────

function readArticleMarkdown(slug) {
    // slug is like "/compare/adguard-home-vs-blocky" or "/apps/immich"
    // Map to file: site/src/content/compare/adguard-home-vs-blocky.md
    if (!slug) return null;

    // Strip leading slash
    const cleanSlug = slug.replace(/^\//, '');
    const filePath = path.join(REPO_ROOT, 'site', 'src', 'content', cleanSlug + '.md');

    try {
        const raw = fs.readFileSync(filePath, 'utf8');
        return stripFrontmatter(raw);
    } catch (e) {
        if (e.code === 'ENOENT') return null;
        log(`ERROR reading article ${filePath}: ${e.message}`);
        return null;
    }
}

function stripFrontmatter(markdown) {
    // Remove YAML frontmatter delimited by --- at start of file
    const match = markdown.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
    if (match) {
        return markdown.slice(match[0].length).trim();
    }
    return markdown.trim();
}

// ─── HTTP helpers ────────────────────────────────────────────────────────────

function httpRequest(url, options, body) {
    return new Promise((resolve, reject) => {
        const mod = url.startsWith('https') ? https : http;
        const req = mod.request(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
        });
        req.on('error', reject);
        req.setTimeout(30000, () => { req.destroy(); reject(new Error('timeout')); });
        if (body) req.write(body);
        req.end();
    });
}

// ─── Bluesky Session Cache ───────────────────────────────────────────────────

const BSKY_SESSION_FILE = path.join(REPO_ROOT, 'credentials', 'bsky-session.json');

function isJwtExpired(jwt) {
    try {
        const payload = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url').toString());
        // Treat as expired 60 seconds before actual expiry to avoid edge cases
        return !payload.exp || (payload.exp - 60) < Math.floor(Date.now() / 1000);
    } catch {
        return true;
    }
}

function loadBskySession() {
    try {
        return JSON.parse(fs.readFileSync(BSKY_SESSION_FILE, 'utf8'));
    } catch {
        return null;
    }
}

function saveBskySession(session) {
    fs.writeFileSync(BSKY_SESSION_FILE, JSON.stringify(session, null, 2) + '\n', { mode: 0o600 });
}

async function getBlueskySession(creds) {
    const pds = creds.BLUESKY_PDS || 'https://bsky.social';
    const cached = loadBskySession();

    // Try cached session if accessJwt is still valid
    if (cached && cached.accessJwt && !isJwtExpired(cached.accessJwt)) {
        return cached;
    }

    // Try refreshing with refreshJwt
    if (cached && cached.refreshJwt && !isJwtExpired(cached.refreshJwt)) {
        try {
            const refreshRes = await httpRequest(
                `${pds}/xrpc/com.atproto.server.refreshSession`,
                { method: 'POST', headers: { 'Authorization': `Bearer ${cached.refreshJwt}` } }
            );
            if (refreshRes.status === 200) {
                const refreshed = JSON.parse(refreshRes.body);
                const session = { did: refreshed.did, accessJwt: refreshed.accessJwt, refreshJwt: refreshed.refreshJwt };
                saveBskySession(session);
                log('Bluesky session refreshed (no createSession call)');
                return session;
            }
            log(`Bluesky refresh failed: ${refreshRes.status} — falling back to createSession`);
        } catch (e) {
            log(`Bluesky refresh error: ${e.message} — falling back to createSession`);
        }
    }

    // Last resort: create new session (rate-limited to 10/day)
    const authRes = await httpRequest(
        `${pds}/xrpc/com.atproto.server.createSession`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' } },
        JSON.stringify({ identifier: creds.BLUESKY_HANDLE, password: creds.BLUESKY_APP_PASSWORD })
    );
    if (authRes.status !== 200) {
        throw new Error(`Bluesky auth failed: ${authRes.status} ${authRes.body.slice(0, 200)}`);
    }
    const session = JSON.parse(authRes.body);
    saveBskySession({ did: session.did, accessJwt: session.accessJwt, refreshJwt: session.refreshJwt });
    log('Bluesky session created (createSession call used — 10/day limit)');
    return session;
}

// ─── Platform Posters ────────────────────────────────────────────────────────

async function postBluesky(creds, text) {
    // Step 1: Get session (cached, refreshed, or new)
    const session = await getBlueskySession(creds);

    // Step 2: Parse facets for links
    const facets = [];
    const urlRegex = /https?:\/\/[^\s)]+/g;
    let match;
    // Bluesky uses byte offsets for facets
    const encoder = new TextEncoder();
    const textBytes = encoder.encode(text);
    while ((match = urlRegex.exec(text)) !== null) {
        const beforeBytes = encoder.encode(text.slice(0, match.index));
        const matchBytes = encoder.encode(match[0]);
        facets.push({
            index: { byteStart: beforeBytes.length, byteEnd: beforeBytes.length + matchBytes.length },
            features: [{ $type: 'app.bsky.richtext.facet#link', uri: match[0] }],
        });
    }

    // Step 3: Create post
    const record = {
        $type: 'app.bsky.feed.post',
        text,
        createdAt: new Date().toISOString(),
        langs: ['en'],
    };
    if (facets.length > 0) record.facets = facets;

    const postBody = JSON.stringify({
        repo: session.did,
        collection: 'app.bsky.feed.post',
        record,
    });
    const postRes = await httpRequest(
        `${creds.BLUESKY_PDS || 'https://bsky.social'}/xrpc/com.atproto.repo.createRecord`,
        { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.accessJwt}` } },
        postBody
    );
    if (postRes.status !== 200) {
        throw new Error(`Bluesky post failed: ${postRes.status} ${postRes.body.slice(0, 200)}`);
    }
    return JSON.parse(postRes.body);
}

async function postTwitter(creds, text) {
    // Twitter API v2 with OAuth 1.0a HMAC-SHA1 signing
    const url = 'https://api.twitter.com/2/tweets';
    const method = 'POST';
    const oauthParams = {
        oauth_consumer_key: creds.X_API_KEY,
        oauth_nonce: crypto.randomBytes(16).toString('hex'),
        oauth_signature_method: 'HMAC-SHA1',
        oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
        oauth_token: creds.X_ACCESS_TOKEN,
        oauth_version: '1.0',
    };

    // Build signature base string
    const paramString = Object.keys(oauthParams).sort()
        .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(oauthParams[k])}`)
        .join('&');
    const signatureBase = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(paramString)}`;
    const signingKey = `${encodeURIComponent(creds.X_API_SECRET)}&${encodeURIComponent(creds.X_ACCESS_SECRET)}`;
    const signature = crypto.createHmac('sha1', signingKey).update(signatureBase).digest('base64');
    oauthParams.oauth_signature = signature;

    const authHeader = 'OAuth ' + Object.keys(oauthParams).sort()
        .map(k => `${encodeURIComponent(k)}="${encodeURIComponent(oauthParams[k])}"`)
        .join(', ');

    const body = JSON.stringify({ text });
    const res = await httpRequest(url, {
        method: 'POST',
        headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
            'User-Agent': 'selfhosting-sh/1.0',
        },
    }, body);

    if (res.status !== 201 && res.status !== 200) {
        throw new Error(`Twitter post failed: ${res.status} ${res.body.slice(0, 300)}`);
    }
    return JSON.parse(res.body);
}

async function postMastodon(creds, text) {
    // Mastodon has a 500-character limit — truncate at word boundary if needed
    const MASTODON_CHAR_LIMIT = 500;
    let status = text;
    if (status && status.length > MASTODON_CHAR_LIMIT) {
        log(`Mastodon: text is ${status.length} chars, truncating to ${MASTODON_CHAR_LIMIT}`);
        const truncTarget = MASTODON_CHAR_LIMIT - 3; // room for "..."
        let cutoff = status.lastIndexOf(' ', truncTarget);
        // If no good word boundary found within 30% of the target, hard cut
        if (cutoff < truncTarget * 0.7) cutoff = truncTarget;
        status = status.slice(0, cutoff).replace(/[\s,.;:!?#]+$/, '') + '...';
    }
    const body = JSON.stringify({ status, visibility: 'public' });
    const res = await httpRequest('https://mastodon.social/api/v1/statuses', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${creds.MASTODON_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
            'User-Agent': 'selfhosting-sh/1.0',
        },
    }, body);
    if (res.status !== 200) {
        throw new Error(`Mastodon post failed: ${res.status} ${res.body.slice(0, 200)}`);
    }
    return JSON.parse(res.body);
}

async function postHashnode(creds, text, post) {
    // Hashnode publishes full articles via GraphQL API
    if (!post || post.type !== 'article_crosspost') {
        log('Hashnode: removing non-article post from queue (Hashnode only supports article cross-posting)');
        return { skipped: true, reason: 'unsupported_type' };
    }

    const markdown = readArticleMarkdown(post.slug);
    if (!markdown) {
        log(`Hashnode: article file not found for slug "${post.slug}" — skipping`);
        return null;
    }

    const publicationId = '69987c5ffbf4a1bed0ec1579';
    const tags = (post.tags || []).map(t => ({ slug: t, name: t }));

    const mutation = `mutation PublishPost($input: PublishPostInput!) {
        publishPost(input: $input) {
            post { id url title }
        }
    }`;
    const variables = {
        input: {
            title: post.title,
            contentMarkdown: markdown,
            publicationId: publicationId,
            originalArticleURL: post.canonical_url,
            tags: tags,
        }
    };

    const body = JSON.stringify({ query: mutation, variables });
    const res = await httpRequest('https://gql.hashnode.com', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': creds.HASHNODE_API_TOKEN,
            'User-Agent': 'selfhosting-sh/1.0',
        },
    }, body);

    if (res.status !== 200) {
        throw new Error(`Hashnode API error: ${res.status} ${res.body.slice(0, 300)}`);
    }

    const result = JSON.parse(res.body);
    if (result.errors && result.errors.length > 0) {
        const errMsg = result.errors[0].message || JSON.stringify(result.errors[0]);
        if (errMsg.includes('duplicate') || errMsg.includes('already')) {
            log(`Hashnode: duplicate article detected — "${post.title}"`);
            return { skipped: true, reason: 'duplicate' };
        }
        throw new Error(`Hashnode GraphQL error: ${errMsg}`);
    }

    const postUrl = result.data?.publishPost?.post?.url;
    log(`Hashnode: published "${post.title}" → ${postUrl || 'unknown URL'}`);
    return { url: postUrl };
}

async function postDevto(creds, text, post) {
    // Dev.to publishes full articles via Forem API
    if (!post || post.type !== 'article_crosspost') {
        log('Dev.to: removing non-article post from queue (Dev.to only supports article cross-posting)');
        return { skipped: true, reason: 'unsupported_type' };
    }

    const markdown = readArticleMarkdown(post.slug);
    if (!markdown) {
        log(`Dev.to: article file not found for slug "${post.slug}" — skipping`);
        return null;
    }

    const tags = (post.tags || []).slice(0, 4); // Dev.to allows max 4 tags

    const body = JSON.stringify({
        article: {
            title: post.title,
            body_markdown: markdown,
            canonical_url: post.canonical_url,
            published: true,
            tags: tags,
        }
    });

    const res = await httpRequest('https://dev.to/api/articles', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'api-key': creds.DEVTO_API_KEY,
            'User-Agent': 'selfhosting-sh/1.0',
        },
    }, body);

    if (res.status === 422) {
        const errBody = res.body.slice(0, 300);
        if (errBody.includes('has already been taken') || errBody.includes('duplicate')) {
            log(`Dev.to: duplicate article detected — "${post.title}"`);
            return { skipped: true, reason: 'duplicate' };
        }
        throw new Error(`Dev.to validation error: ${errBody}`);
    }

    if (res.status !== 201 && res.status !== 200) {
        throw new Error(`Dev.to API error: ${res.status} ${res.body.slice(0, 300)}`);
    }

    const result = JSON.parse(res.body);
    log(`Dev.to: published "${post.title}" → ${result.url || 'unknown URL'}`);
    return { url: result.url };
}

async function postReddit(creds, text, post) {
    // Reddit requires OAuth — credentials are PENDING
    if (!isRealCredential(creds.REDDIT_CLIENT_ID)) {
        return null;
    }
    log('Reddit: skipping — OAuth flow not implemented yet');
    return null;
}

// ─── Main ────────────────────────────────────────────────────────────────────

const PLATFORM_POSTERS = {
    bluesky: postBluesky,
    x: postTwitter,
    mastodon: postMastodon,
    reddit: postReddit,
    devto: postDevto,
    hashnode: postHashnode,
};

const PLATFORM_CRED_CHECKS = {
    bluesky: (c) => isRealCredential(c.BLUESKY_APP_PASSWORD) && c.BLUESKY_HANDLE,
    x: (c) => isRealCredential(c.X_API_KEY) && isRealCredential(c.X_ACCESS_TOKEN),
    mastodon: (c) => isRealCredential(c.MASTODON_ACCESS_TOKEN),
    reddit: (c) => isRealCredential(c.REDDIT_CLIENT_ID),
    devto: (c) => isRealCredential(c.DEVTO_API_KEY),
    hashnode: (c) => isRealCredential(c.HASHNODE_API_TOKEN),
};

async function main() {
    log('starting');

    // Load config, state, credentials
    const config = loadJson(CONFIG_FILE, { platforms: {} });
    const state = loadJson(STATE_FILE, { last_posted: {} });
    const creds = loadCreds();

    // Load queue
    let queue = [];
    try {
        const raw = fs.readFileSync(QUEUE_FILE, 'utf8').trim();
        if (raw) {
            queue = raw.split('\n').map((line, i) => {
                try { return JSON.parse(line); }
                catch { log(`WARNING: invalid JSON on queue line ${i + 1}`); return null; }
            }).filter(Boolean);
        }
    } catch (e) {
        if (e.code !== 'ENOENT') log(`ERROR reading queue: ${e.message}`);
        else log('queue file empty or missing — nothing to do');
        return;
    }

    if (queue.length === 0) {
        log('queue empty — nothing to do');
        return;
    }

    log(`queue has ${queue.length} posts`);

    const now = Date.now();
    let postsAttempted = 0;
    let postsSucceeded = 0;
    const processedIndices = new Set();

    // Process one post per platform
    for (const platform of Object.keys(config.platforms || {})) {
        const platformConfig = config.platforms[platform];
        if (!platformConfig.enabled) continue;

        // Check credentials
        const credCheck = PLATFORM_CRED_CHECKS[platform];
        if (!credCheck || !credCheck(creds)) {
            continue; // silently skip platforms without real credentials
        }

        // Check interval
        const lastPosted = state.last_posted?.[platform];
        if (lastPosted) {
            const elapsed = (now - new Date(lastPosted).getTime()) / 60000;
            if (elapsed < platformConfig.min_interval_minutes) {
                continue; // too soon
            }
        }

        // Find the oldest queued post for this platform
        const postIdx = queue.findIndex((p, i) => p.platform === platform && !processedIndices.has(i));
        if (postIdx === -1) continue;

        const post = queue[postIdx];
        const poster = PLATFORM_POSTERS[platform];
        if (!poster) continue;

        postsAttempted++;
        try {
            const result = await poster(creds, post.text, post);
            if (result !== null) {
                postsSucceeded++;
                state.last_posted[platform] = new Date().toISOString();
                processedIndices.add(postIdx);
                const logText = post.text ? post.text.slice(0, 60) : (post.title || 'unknown');
                log(`OK ${platform}: posted "${logText}..."`);
            }
        } catch (e) {
            log(`ERROR ${platform}: ${e.message}`);
            // Permanent failures: remove from queue and try next post
            const logText2 = post.text ? post.text.slice(0, 60) : (post.title || 'unknown');
            const isPermanent = (msg) => msg.includes('duplicate content') || msg.includes('403') || msg.includes('duplicate') || msg.includes('has already been taken') || msg.includes('character limit') || msg.includes('Validation failed') || msg.includes('422');
            if (isPermanent(e.message)) {
                processedIndices.add(postIdx);
                log(`SKIP ${platform}: removing duplicate/rejected post from queue — "${logText2}..."`);
                // Try next post for this platform immediately
                const nextIdx = queue.findIndex((p, i) => p.platform === platform && !processedIndices.has(i) && i > postIdx);
                if (nextIdx !== -1) {
                    const nextPost = queue[nextIdx];
                    try {
                        const result2 = await poster(creds, nextPost.text, nextPost);
                        if (result2 !== null) {
                            postsSucceeded++;
                            state.last_posted[platform] = new Date().toISOString();
                            processedIndices.add(nextIdx);
                            const logText3 = nextPost.text ? nextPost.text.slice(0, 60) : (nextPost.title || 'unknown');
                            log(`OK ${platform}: posted "${logText3}..." (after skipping duplicate)`);
                        }
                    } catch (e2) {
                        log(`ERROR ${platform}: ${e2.message} (retry after skip)`);
                        if (isPermanent(e2.message)) {
                            processedIndices.add(nextIdx);
                            log(`SKIP ${platform}: also duplicate — removing`);
                        }
                    }
                }
            }
            // Transient errors: leave in queue for retry next run
        }
    }

    // Remove successfully posted items from queue
    if (processedIndices.size > 0) {
        const remaining = queue.filter((_, i) => !processedIndices.has(i));
        fs.writeFileSync(QUEUE_FILE, remaining.map(p => JSON.stringify(p)).join('\n') + (remaining.length ? '\n' : ''));
        log(`removed ${processedIndices.size} posted items from queue (${remaining.length} remaining)`);
    }

    // Save state
    saveJson(STATE_FILE, state);

    log(`done — ${postsAttempted} attempted, ${postsSucceeded} succeeded, ${queue.length - processedIndices.size} remaining in queue`);
}

main().catch(e => {
    log(`FATAL: ${e.message}`);
    process.exit(1);
});
