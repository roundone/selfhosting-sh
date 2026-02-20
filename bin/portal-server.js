#!/usr/bin/env node
/**
 * selfhosting.sh Board Portal
 * Founder-facing dashboard with auth, Markdown rendering, inbox messaging
 */

const http = require('http');
const https = require('https');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { marked } = require('marked');

const PORT = 8080;
const PORT_HTTP = 80;
const PORT_HTTPS = 443;
const BASE = '/opt/selfhosting-sh';
const TOKEN_PATH = `${BASE}/credentials/portal-token`;
const PASSWORD_PATH = `${BASE}/credentials/portal-password`;
const CLAUDEMD_PASSWORD_PATH = `${BASE}/credentials/portal-claudemd-password`;
const SESSION_COOKIE = 'portal_session';
const CLAUDEMD_SESSION_COOKIE = 'portal_claudemd_session';
const SESSION_MAX_AGE = 86400; // 24 hours
const MAX_SUBJECT_LEN = 200;
const MAX_MESSAGE_LEN = 5000;
const MAX_MESSAGE_LINES = 200;
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW = 3600000; // 1 hour
const LOGIN_RATE_LIMIT_MAX = 5;
const LOGIN_RATE_LIMIT_WINDOW = 900000; // 15 minutes

// Agent CLAUDE.md registry for /instructions page
const AGENT_CLAUDE_MDS = [
  { name: 'CEO', key: 'ceo', path: `${BASE}/CLAUDE.md`, editable: true },
  { name: 'Technology', key: 'technology', path: `${BASE}/agents/technology/CLAUDE.md`, editable: false },
  { name: 'Marketing', key: 'marketing', path: `${BASE}/agents/marketing/CLAUDE.md`, editable: false },
  { name: 'Operations', key: 'operations', path: `${BASE}/agents/operations/CLAUDE.md`, editable: false },
  { name: 'BI & Finance', key: 'bi-finance', path: `${BASE}/agents/bi-finance/CLAUDE.md`, editable: false },
  { name: 'Investor Relations', key: 'investor-relations', path: `${BASE}/agents/investor-relations/CLAUDE.md`, editable: false },
  { name: 'Foundations Writer', key: 'foundations-writer', path: `${BASE}/agents/operations/writers/foundations-writer/CLAUDE.md`, editable: false },
  { name: 'Hardware Writer', key: 'hardware-writer', path: `${BASE}/agents/operations/writers/hardware-writer/CLAUDE.md`, editable: false },
  { name: 'Home Auto / Notes Writer', key: 'homeauto-notes-writer', path: `${BASE}/agents/operations/writers/homeauto-notes-writer/CLAUDE.md`, editable: false },
  { name: 'Password / Adblock Writer', key: 'password-adblock-writer', path: `${BASE}/agents/operations/writers/password-adblock-writer/CLAUDE.md`, editable: false },
  { name: 'Photo / Media Writer', key: 'photo-media-writer', path: `${BASE}/agents/operations/writers/photo-media-writer/CLAUDE.md`, editable: false },
  { name: 'Proxy / Docker Writer', key: 'proxy-docker-writer', path: `${BASE}/agents/operations/writers/proxy-docker-writer/CLAUDE.md`, editable: false },
  { name: 'Tier 2 Writer', key: 'tier2-writer', path: `${BASE}/agents/operations/writers/tier2-writer/CLAUDE.md`, editable: false },
  { name: 'VPN / Filesync Writer', key: 'vpn-filesync-writer', path: `${BASE}/agents/operations/writers/vpn-filesync-writer/CLAUDE.md`, editable: false },
];

// GA4 property ID
const GA4_PROPERTY_ID = '524871536';

// API cache for growth metrics
const apiCache = new Map();
const CACHE_TTL = 3600000; // 1 hour

async function getCachedAsync(key, fetchFn) {
  const cached = apiCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  try {
    const data = await fetchFn();
    apiCache.set(key, { data, timestamp: Date.now() });
    return data;
  } catch (err) {
    // Return stale cache if available, otherwise rethrow
    if (cached) return cached.data;
    throw err;
  }
}

// Google API JWT auth
let cachedGoogleToken = null;
let cachedGoogleTokenExpiry = 0;

function base64url(data) {
  return Buffer.from(data).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function getGoogleAccessToken() {
  if (cachedGoogleToken && Date.now() < cachedGoogleTokenExpiry) {
    return cachedGoogleToken;
  }
  const sa = JSON.parse(fs.readFileSync(`${BASE}/credentials/gcp-service-account.json`, 'utf8'));
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/webmasters.readonly https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  }));
  const signInput = `${header}.${payload}`;
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signInput);
  const signature = sign.sign(sa.private_key, 'base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const jwt = `${signInput}.${signature}`;

  // Exchange JWT for access token
  const tokenData = await httpPost('https://oauth2.googleapis.com/token',
    `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
    { 'Content-Type': 'application/x-www-form-urlencoded' });
  const tokenJson = JSON.parse(tokenData);
  if (!tokenJson.access_token) throw new Error('No access_token in response: ' + tokenData);
  cachedGoogleToken = tokenJson.access_token;
  cachedGoogleTokenExpiry = Date.now() + 55 * 60 * 1000; // 55 min
  return cachedGoogleToken;
}

// HTTP helper for API calls
function httpPost(url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const opts = {
      hostname: u.hostname,
      port: u.port || 443,
      path: u.pathname + u.search,
      method: 'POST',
      headers: { ...headers, 'Content-Length': Buffer.byteLength(body) }
    };
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        if (res.statusCode >= 400) reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 500)}`));
        else resolve(data);
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Request timeout')); });
    req.write(body);
    req.end();
  });
}

function httpGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const mod = u.protocol === 'https:' ? https : http;
    const opts = {
      hostname: u.hostname,
      port: u.port || (u.protocol === 'https:' ? 443 : 80),
      path: u.pathname + u.search,
      method: 'GET',
      headers: { ...headers, 'User-Agent': 'selfhosting-sh/1.0' }
    };
    const req = mod.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        if (res.statusCode >= 400) reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 500)}`));
        else resolve(data);
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Request timeout')); });
    req.end();
  });
}

// GSC data fetcher — uses cached file first, falls back to API
async function fetchGSCData() {
  // Try cached file first (today or yesterday)
  for (const daysAgo of [0, 1]) {
    const d = new Date(Date.now() - daysAgo * 86400000);
    const dateStr = d.toISOString().split('T')[0];
    const filePath = `${BASE}/reports/gsc-data-${dateStr}.json`;
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (data.pages && data.daily && data.queries_detailed) {
        return { data, source: 'file', date: dateStr };
      }
    } catch {}
  }

  // Fall back to live API
  try {
    const token = await getGoogleAccessToken();
    const endDate = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    const siteUrl = encodeURIComponent('sc-domain:selfhosting.sh');
    const apiBase = `https://www.googleapis.com/webmasters/v3/sites/${siteUrl}/searchAnalytics/query`;
    const authHeaders = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    const [dailyRaw, pagesRaw, queriesRaw] = await Promise.all([
      httpPost(apiBase, JSON.stringify({ startDate, endDate, dimensions: ['date'], rowLimit: 30 }), authHeaders),
      httpPost(apiBase, JSON.stringify({ startDate, endDate, dimensions: ['page'], rowLimit: 10 }), authHeaders),
      httpPost(apiBase, JSON.stringify({ startDate, endDate, dimensions: ['query'], rowLimit: 25000 }), authHeaders),
    ]);

    return {
      data: {
        daily: JSON.parse(dailyRaw),
        pages: JSON.parse(pagesRaw),
        queries_detailed: JSON.parse(queriesRaw),
      },
      source: 'api',
      date: endDate
    };
  } catch (err) {
    return { data: null, source: 'error', error: err.message };
  }
}

// GA4 data fetcher
async function fetchGA4Data() {
  const token = await getGoogleAccessToken();
  const apiUrl = `https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY_ID}:runReport`;
  const authHeaders = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const [dailyRaw, engagementRaw, topPagesRaw, sourcesRaw] = await Promise.all([
    httpPost(apiUrl, JSON.stringify({
      dateRanges: [{ startDate: '7daysAgo', endDate: 'yesterday' }],
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'activeUsers' }, { name: 'screenPageViews' }, { name: 'sessions' }]
    }), authHeaders),
    httpPost(apiUrl, JSON.stringify({
      dateRanges: [{ startDate: '7daysAgo', endDate: 'yesterday' }],
      metrics: [{ name: 'bounceRate' }, { name: 'averageSessionDuration' }, { name: 'activeUsers' }, { name: 'screenPageViews' }]
    }), authHeaders),
    httpPost(apiUrl, JSON.stringify({
      dateRanges: [{ startDate: '7daysAgo', endDate: 'yesterday' }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }],
      limit: 10,
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }]
    }), authHeaders),
    httpPost(apiUrl, JSON.stringify({
      dateRanges: [{ startDate: '7daysAgo', endDate: 'yesterday' }],
      dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }],
      metrics: [{ name: 'sessions' }],
      limit: 10,
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }]
    }), authHeaders),
  ]);

  return {
    daily: JSON.parse(dailyRaw),
    engagement: JSON.parse(engagementRaw),
    topPages: JSON.parse(topPagesRaw),
    sources: JSON.parse(sourcesRaw),
  };
}

// Social follower counts
async function fetchSocialFollowers() {
  const results = { bluesky: null, mastodon: null };

  try {
    const bskyRaw = await httpGet('https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=selfhostingsh.bsky.social');
    const bskyData = JSON.parse(bskyRaw);
    results.bluesky = bskyData.followersCount || 0;
  } catch {}

  try {
    const mastoRaw = await httpGet('https://mastodon.social/api/v1/accounts/lookup?acct=selfhostingsh');
    const mastoData = JSON.parse(mastoRaw);
    results.mastodon = mastoData.followers_count || 0;
  } catch {}

  return results;
}

// Rate limiting state
const rateLimitMap = new Map();
const loginRateLimitMap = new Map();
setInterval(() => {
  const cutoff = Date.now() - RATE_LIMIT_WINDOW;
  for (const [ip, times] of rateLimitMap) {
    const filtered = times.filter(t => t > cutoff);
    if (filtered.length === 0) rateLimitMap.delete(ip);
    else rateLimitMap.set(ip, filtered);
  }
  const loginCutoff = Date.now() - LOGIN_RATE_LIMIT_WINDOW;
  for (const [ip, times] of loginRateLimitMap) {
    const filtered = times.filter(t => t > loginCutoff);
    if (filtered.length === 0) loginRateLimitMap.delete(ip);
    else loginRateLimitMap.set(ip, filtered);
  }
}, 300000); // Clean every 5 min

// Session store: Map<sessionToken, { createdAt: number, ip: string }>
const sessionMap = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of sessionMap) {
    if (now - session.createdAt > SESSION_MAX_AGE * 1000) {
      sessionMap.delete(token);
    }
  }
}, 300000); // Clean expired sessions every 5 min

// Load API bearer token (for /api/status backward compat)
let AUTH_TOKEN = '';
try {
  AUTH_TOKEN = fs.readFileSync(TOKEN_PATH, 'utf8').trim();
} catch (e) {
  console.error('FATAL: Cannot read portal token from', TOKEN_PATH);
  process.exit(1);
}

// Load or generate portal password
let PORTAL_PASSWORD = '';
try {
  PORTAL_PASSWORD = fs.readFileSync(PASSWORD_PATH, 'utf8').trim();
} catch {
  // Generate a strong random password on first startup
  PORTAL_PASSWORD = crypto.randomBytes(24).toString('base64url');
  try {
    fs.writeFileSync(PASSWORD_PATH, PORTAL_PASSWORD + '\n', { mode: 0o600 });
    console.log('Generated new portal password at', PASSWORD_PATH);
  } catch (e) {
    console.error('FATAL: Cannot write portal password to', PASSWORD_PATH);
    process.exit(1);
  }
}

// Load CLAUDE.md section password
let CLAUDEMD_PASSWORD = '';
try {
  CLAUDEMD_PASSWORD = fs.readFileSync(CLAUDEMD_PASSWORD_PATH, 'utf8').trim();
} catch {
  CLAUDEMD_PASSWORD = crypto.randomBytes(24).toString('base64url');
  try {
    fs.writeFileSync(CLAUDEMD_PASSWORD_PATH, CLAUDEMD_PASSWORD + '\n', { mode: 0o600 });
    console.log('Generated new CLAUDE.md password at', CLAUDEMD_PASSWORD_PATH);
  } catch (e) {
    console.error('WARN: Cannot write CLAUDE.md password:', e.message);
  }
}

// CLAUDE.md session store (separate from main portal sessions)
const claudemdSessionMap = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of claudemdSessionMap) {
    if (now - session.createdAt > SESSION_MAX_AGE * 1000) {
      claudemdSessionMap.delete(token);
    }
  }
}, 300000);

function checkClaudemdSession(req) {
  const cookies = parseCookies(req);
  const sessionToken = cookies[CLAUDEMD_SESSION_COOKIE];
  if (!sessionToken) return false;
  const session = claudemdSessionMap.get(sessionToken);
  if (!session) return false;
  if (Date.now() - session.createdAt > SESSION_MAX_AGE * 1000) {
    claudemdSessionMap.delete(sessionToken);
    return false;
  }
  return true;
}

function createClaudemdSession(ip) {
  const token = crypto.randomBytes(32).toString('hex');
  claudemdSessionMap.set(token, { createdAt: Date.now(), ip });
  return token;
}

function claudemdSessionCookieHeader(token) {
  return `${CLAUDEMD_SESSION_COOKIE}=${token}; HttpOnly; SameSite=Strict; Secure; Max-Age=${SESSION_MAX_AGE}; Path=/`;
}

// -- Helpers --

function safe(fn, fallback = 'N/A') {
  try { return fn(); } catch { return fallback; }
}

function exec(cmd, timeout = 5000) {
  return safe(() => execSync(cmd, { timeout, encoding: 'utf8' }).trim(), '');
}

function readFileSafe(p) {
  return safe(() => fs.readFileSync(p, 'utf8'), '');
}

function readFileTail(p, maxLines = 50) {
  return safe(() => {
    const content = fs.readFileSync(p, 'utf8');
    const lines = content.split('\n');
    return lines.slice(-maxLines).join('\n');
  }, '');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function stripHtml(str) {
  return String(str).replace(/<[^>]*>/g, '');
}

function sanitizeInput(str) {
  let s = stripHtml(str);
  const dangerous = /<script/i.test(s) || /<iframe/i.test(s) ||
    /javascript:/i.test(s) || /onerror\s*=/i.test(s) || /onload\s*=/i.test(s);
  if (dangerous) return null;
  return s;
}

function redactCredentials(text) {
  let out = text;
  // Redact env-var style: SOME_KEY=value, SOME_TOKEN=value
  out = out.replace(/(export\s+)?([A-Z_]{2,})\s*=\s*(\S+)/g, (match, exp, key, val) => {
    if (/key|token|secret|password|bearer/i.test(key)) {
      return `${exp || ''}${key}=[REDACTED]`;
    }
    return match;
  });
  // Redact Bearer tokens
  out = out.replace(/(Bearer\s+)[A-Za-z0-9_\-]{20,}/gi, '$1[REDACTED]');
  // Redact "Password: `...`" or "Password: ..." patterns (inline code or plain)
  out = out.replace(/(password\s*[:=]\s*)`[^`]+`/gi, '$1`[REDACTED]`');
  out = out.replace(/(password\s*[:=]\s*)(?!`|\[REDACTED\])(\S+)/gi, '$1[REDACTED]');
  // Redact "API Key: `...`" / "Token: `...`" / "Secret: `...`" patterns
  out = out.replace(/((?:api[_ ]?key|access[_ ]?token|token|secret|app[_ ]?password)\s*[:=]\s*)`[^`]+`/gi, '$1`[REDACTED]`');
  out = out.replace(/((?:api[_ ]?key|access[_ ]?token|token|secret|app[_ ]?password)\s*[:=]\s*)(?!`|\[REDACTED\])(\S+)/gi, '$1[REDACTED]');
  // Redact sed commands that replace credentials (sed -i 's/OLD/NEW/')
  out = out.replace(/sed\s+-i\s+'s\/[^']*(?:TOKEN|KEY|PASSWORD|SECRET)[^']*'/gi, 'sed -i [REDACTED]');
  // Redact Bluesky app passwords (pattern: xxxx-xxxx-xxxx-xxxx)
  out = out.replace(/\b[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}\b/g, '[REDACTED]');
  return out;
}

function renderMarkdown(md) {
  return marked(redactCredentials(md), { breaks: true, gfm: true });
}

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || '0.0.0.0';
}

function parseCookies(req) {
  const cookies = {};
  const header = req.headers.cookie || '';
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k) cookies[k] = v.join('=');
  }
  return cookies;
}

// -- Auth --

function checkSession(req) {
  const cookies = parseCookies(req);
  const sessionToken = cookies[SESSION_COOKIE];
  if (!sessionToken) return false;
  const session = sessionMap.get(sessionToken);
  if (!session) return false;
  if (Date.now() - session.createdAt > SESSION_MAX_AGE * 1000) {
    sessionMap.delete(sessionToken);
    return false;
  }
  return true;
}

function checkBearerAuth(req) {
  const authHeader = req.headers.authorization || '';
  return authHeader === `Bearer ${AUTH_TOKEN}`;
}

function checkLoginRateLimit(ip) {
  const now = Date.now();
  const cutoff = now - LOGIN_RATE_LIMIT_WINDOW;
  const times = (loginRateLimitMap.get(ip) || []).filter(t => t > cutoff);
  if (times.length >= LOGIN_RATE_LIMIT_MAX) return false;
  return true;
}

function recordLoginFailure(ip) {
  const now = Date.now();
  const times = loginRateLimitMap.get(ip) || [];
  times.push(now);
  loginRateLimitMap.set(ip, times);
}

function createSession(ip) {
  const token = crypto.randomBytes(32).toString('hex');
  sessionMap.set(token, { createdAt: Date.now(), ip });
  return token;
}

function destroySession(req) {
  const cookies = parseCookies(req);
  const sessionToken = cookies[SESSION_COOKIE];
  if (sessionToken) sessionMap.delete(sessionToken);
}

function checkRateLimit(ip) {
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_WINDOW;
  const times = (rateLimitMap.get(ip) || []).filter(t => t > cutoff);
  if (times.length >= RATE_LIMIT_MAX) return false;
  times.push(now);
  rateLimitMap.set(ip, times);
  return true;
}

function sessionCookieHeader(token) {
  return `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Strict; Secure; Max-Age=${SESSION_MAX_AGE}; Path=/`;
}

function clearSessionCookieHeader() {
  return `${SESSION_COOKIE}=; HttpOnly; SameSite=Strict; Secure; Max-Age=0; Path=/`;
}

// -- Data helpers --

function getMemory() {
  const raw = exec('free -m');
  if (!raw) return { total: 0, used: 0, available: 0 };
  const memLine = raw.split('\n').find(l => l.startsWith('Mem:'));
  if (!memLine) return { total: 0, used: 0, available: 0 };
  const p = memLine.split(/\s+/);
  return { total: parseInt(p[1], 10), used: parseInt(p[2], 10), available: parseInt(p[6], 10) };
}

function getDisk() {
  const raw = exec(`df -h ${BASE} | tail -1`);
  if (!raw) return { size: '?', used: '?', avail: '?', pct: '?' };
  const p = raw.split(/\s+/);
  return { size: p[1], used: p[2], avail: p[3], pct: p[4] };
}

function getLoad() {
  return safe(() => fs.readFileSync('/proc/loadavg', 'utf8').trim().split(' ').slice(0, 3).join(' '), '?');
}

function getUptime() {
  return exec('uptime -p');
}

function getServices() {
  const names = ['selfhosting-coordinator', 'selfhosting-proxy', 'selfhosting-watchdog', 'selfhosting-portal'];
  return names.map(s => ({ name: s, status: exec(`systemctl is-active ${s}`) }));
}

function getCoordinatorState() {
  return safe(() => JSON.parse(fs.readFileSync(`${BASE}/logs/coordinator-state.json`, 'utf8')), null);
}

function getCoordinatorConfig() {
  return safe(() => JSON.parse(fs.readFileSync(`${BASE}/config/coordinator-config.json`, 'utf8')), null);
}

function getArticleCounts() {
  return safe(() => {
    const result = exec(`for d in ${BASE}/site/src/content/*/; do name=$(basename "$d"); count=$(find "$d" -name '*.md' | wc -l); echo "$name:$count"; done`, 10000);
    const collections = {};
    let total = 0;
    for (const line of result.split('\n')) {
      const [name, count] = line.split(':');
      if (name && count) {
        const n = parseInt(count, 10);
        collections[name] = n;
        total += n;
      }
    }
    return { total, collections };
  }, { total: 0, collections: {} });
}

function getBoardReports() {
  return safe(() => {
    const files = fs.readdirSync(`${BASE}/board`)
      .filter(f => /^day-\d{4}-\d{2}-\d{2}\.md$/.test(f) || f === 'founding-report.md')
      .sort().reverse();
    return files.map(f => ({
      name: f,
      content: fs.readFileSync(`${BASE}/board/${f}`, 'utf8')
    }));
  }, []);
}

function getLatestBoardReport() {
  const reports = getBoardReports().filter(r => /^day-\d{4}-\d{2}-\d{2}\.md$/.test(r.name));
  return reports.length > 0 ? reports[0] : null;
}

function parseScorecardFromReport(report) {
  if (!report) return {};
  const tableMatch = report.content.match(/## Scorecard vs Target[\s\S]*?\n\|.*\|[\s\S]*?(?=\n(?:## |\n[^|]))/);
  if (!tableMatch) return {};
  const rows = tableMatch[0].split('\n').filter(r => r.startsWith('|') && !r.match(/^\|[\s-]+\|/));
  const result = {};
  for (const row of rows) {
    const cells = row.split('|').map(c => c.trim()).filter(Boolean);
    if (cells.length < 3) continue;
    const metric = cells[0].replace(/\*+/g, '').trim().toLowerCase();
    const actual = cells[2].replace(/\*+/g, '').trim();
    if (metric.includes('keyword')) result.keywords = actual;
    else if (metric.includes('visit')) result.visits = actual;
    else if (metric.includes('revenue')) result.revenue = actual;
    else if (metric.includes('referring')) result.referrers = actual;
    else if (metric.includes('social') || metric.includes('follower')) result.followers = actual;
  }
  return result;
}

function getCeoInbox() {
  return readFileSafe(`${BASE}/inbox/ceo.md`);
}

function getSocialState() {
  return safe(() => JSON.parse(fs.readFileSync(`${BASE}/queues/social-state.json`, 'utf8')), {});
}

function getSocialQueueSize() {
  return safe(() => {
    const count = exec(`wc -l < ${BASE}/queues/social-queue.jsonl`);
    return parseInt(count, 10) || 0;
  }, 0);
}

// -- Alert logic with per-agent interval awareness --

function getAgentWakeConfig(agentName) {
  const possiblePaths = [
    `${BASE}/agents/${agentName}/wake-on.conf`,
    `${BASE}/agents/operations/writers/${agentName.replace(/^ops-/, '')}/wake-on.conf`
  ];
  for (const confPath of possiblePaths) {
    try {
      const content = fs.readFileSync(confPath, 'utf8');
      const match = content.match(/fallback:\s*(\d+)h/);
      const paused = /PAUSED/i.test(content);
      const intervalMs = match ? parseInt(match[1], 10) * 60 * 60 * 1000 : null;
      return { intervalMs, paused };
    } catch {}
  }
  return { intervalMs: null, paused: false };
}

function getExpectedIntervalMs(agentName) {
  const config = getAgentWakeConfig(agentName);
  if (config.intervalMs) return config.intervalMs;
  if (agentName.startsWith('ops-')) return 48 * 60 * 60 * 1000;
  if (agentName === 'investor-relations') return 168 * 60 * 60 * 1000;
  return 8 * 60 * 60 * 1000;
}

function isAgentPaused(agentName) {
  return getAgentWakeConfig(agentName).paused;
}

function isActiveError(info, agentName) {
  if (!info.consecutiveErrors || info.consecutiveErrors <= 0) return false;
  if (isAgentPaused(agentName || '')) return false;
  const errorTimestamp = info.lastErrorAt || info.lastRun;
  if (!errorTimestamp) return false;
  const errorAge = Date.now() - new Date(errorTimestamp).getTime();
  const expectedInterval = getExpectedIntervalMs(agentName || '');
  return errorAge < (expectedInterval * 1.5);
}

function formatTimeAgo(ms) {
  if (ms < 60000) return `${Math.round(ms / 1000)}s ago`;
  if (ms < 3600000) return `${Math.round(ms / 60000)}m ago`;
  if (ms < 86400000) return `${Math.round(ms / 3600000)}h ago`;
  return `${Math.round(ms / 86400000)}d ago`;
}

function getAlertCount() {
  let count = 0;
  const state = getCoordinatorState();
  if (state && state.agents) {
    for (const [name, info] of Object.entries(state.agents)) {
      if (isActiveError(info, name)) count++;
    }
  }
  const latest = getLatestBoardReport();
  if (latest) {
    const humanSection = latest.content.match(/## Escalations Requiring Human Action[\s\S]*?(?=\n## |\n---|\Z)/);
    if (humanSection) {
      const items = humanSection[0].match(/^\*\*|^- \*\*|^\d+\./gm);
      if (items) count += items.length;
    }
  }
  return count;
}

function getRecentCommits(n = 50) {
  return safe(() => {
    const raw = exec(`cd ${BASE} && git log --format="%H|%h|%s|%ai" -${n}`, 10000);
    return raw.split('\n').filter(Boolean).map(line => {
      const [hash, short, subject, date] = line.split('|');
      return { hash, short, subject, date };
    });
  }, []);
}

// -- Page rendering --

function statusBadge(status) {
  const colors = { active: '#22c55e', running: '#22c55e', queued: '#f59e0b', backoff: '#ef4444', idle: '#6b7280', inactive: '#ef4444', paused: '#64748b' };
  const color = colors[status] || '#6b7280';
  return `<span class="badge" style="background:${color}">${escapeHtml(status)}</span>`;
}

function barHtml(pct, color) {
  return `<div class="bar"><div class="bar-fill" style="width:${pct}%;background:${color}"></div></div>`;
}

function navHtml(currentPath) {
  const alertCount = getAlertCount();
  const alertBadge = alertCount > 0 ? `<span class="alert-badge">${alertCount}</span>` : '';
  const links = [
    ['/', 'Dashboard'], ['/board', 'Board Reports'], ['/inbox', 'Inbox'],
    ['/agents', 'Agents'], ['/content', 'Content & SEO'], ['/growth', 'Growth'],
    ['/instructions', 'Instructions'], ['/system', 'System'],
    ['/alerts', `Alerts ${alertBadge}`], ['/commits', 'Commits'], ['/claudemd', 'CLAUDE.md']
  ];
  const items = links.map(([href, label]) => {
    const active = currentPath === href ? ' class="active"' : '';
    return `<a href="${href}"${active}>${label}</a>`;
  }).join('');
  return `<nav>${items}</nav>`;
}

function layoutHtml(title, currentPath, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="refresh" content="60">
<title>${escapeHtml(title)} — selfhosting.sh Portal</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: #0f1117; color: #e2e8f0; font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 15px; line-height: 1.6; letter-spacing: 0.01em; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
.header { background: #1a1d27; border-bottom: 1px solid #2d3148; padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3); }
.header h1 { color: #22c55e; font-size: 18px; }
.header .right { display: flex; align-items: center; gap: 16px; }
.header .time { color: #64748b; font-size: 12px; }
.header .refresh-note { color: #475569; font-size: 11px; }
.header .logout-link { color: #94a3b8; font-size: 12px; text-decoration: none; }
.header .logout-link:hover { color: #ef4444; }
nav { background: #151822; border-bottom: 1px solid #2d3148; padding: 0 24px; display: flex; gap: 0; overflow-x: auto; }
nav a { color: #94a3b8; padding: 12px 20px; text-decoration: none; font-size: 14px; white-space: nowrap; border-bottom: 2px solid transparent; transition: background 0.2s; }
nav a:hover { color: #e2e8f0; background: #1a1d27; }
nav a.active { color: #22c55e; border-bottom-color: #22c55e; }
.content { padding: 24px; max-width: 1440px; margin: 0 auto; }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 16px; margin-bottom: 16px; }
.card { background: #1a1d27; border: 1px solid #2d3148; border-radius: 10px; padding: 20px; overflow: hidden; transition: border-color 0.2s; }
.card:hover { border-color: #3d4168; }
.card h2 { color: #94a3b8; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; border-bottom: 1px solid #2d3148; padding-bottom: 8px; }
.card.wide { grid-column: 1 / -1; }
.metric { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; }
.metric-label { color: #94a3b8; }
.metric-value { color: #e2e8f0; font-weight: 600; }
.metric-value.big { font-size: 28px; color: #22c55e; }
.bar { height: 12px; background: #2d3148; border-radius: 6px; overflow: hidden; margin: 4px 0; box-shadow: inset 0 1px 3px rgba(0,0,0,0.3); }
.bar-fill { height: 100%; border-radius: 6px; }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #2d3148; font-size: 14px; }
tr:nth-child(even) { background: rgba(26, 29, 39, 0.5); }
th { color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
pre { background: #0d0f14; border: 1px solid #2d3148; border-radius: 6px; padding: 14px; overflow-x: auto; font-size: 13px; line-height: 1.4; max-height: 500px; overflow-y: auto; white-space: pre-wrap; word-break: break-word; }
.badge { display: inline-block; padding: 2px 8px; border-radius: 4px; color: #000; font-weight: 600; font-size: 12px; }
.alert-badge { display: inline-block; background: #ef4444; color: #fff; font-size: 11px; padding: 1px 6px; border-radius: 10px; margin-left: 4px; }
.ok { color: #22c55e; }
.warn { color: #f59e0b; }
.crit { color: #ef4444; }
.stale { color: #64748b; }
a { color: #22c55e; text-decoration: none; }
a:hover { text-decoration: underline; }
.md-content { line-height: 1.7; }
.md-content h1 { font-size: 24px; color: #22c55e; margin: 16px 0 8px; }
.md-content h2 { font-size: 18px; color: #e2e8f0; margin: 14px 0 6px; border-bottom: 1px solid #2d3148; padding-bottom: 4px; }
.md-content h3 { font-size: 16px; color: #94a3b8; margin: 10px 0 4px; }
.md-content p { margin: 6px 0; }
.md-content ul, .md-content ol { margin: 6px 0 6px 20px; }
.md-content table { margin: 8px 0; }
.md-content code { background: #0d0f14; padding: 2px 5px; border-radius: 3px; font-size: 13px; }
.md-content pre code { background: none; padding: 0; }
.md-content blockquote { border-left: 3px solid #22c55e; padding-left: 12px; color: #94a3b8; margin: 8px 0; }
.md-content hr { border: none; border-top: 1px solid #2d3148; margin: 12px 0; }
.accordion { border: 1px solid #2d3148; border-radius: 8px; margin: 8px 0; overflow: hidden; }
.accordion summary { background: #1a1d27; padding: 12px 16px; cursor: pointer; color: #e2e8f0; font-size: 14px; }
.accordion summary:hover { background: #222638; }
.accordion .acc-body { padding: 16px; }
.msg-form { display: flex; flex-direction: column; gap: 10px; }
.msg-form input, .msg-form textarea { background: #0d0f14; border: 1px solid #2d3148; color: #e2e8f0; padding: 10px 14px; border-radius: 6px; font-family: inherit; font-size: 15px; transition: border-color 0.2s, box-shadow 0.2s; }
.msg-form input:focus, .msg-form textarea:focus { border-color: #22c55e; outline: none; box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2); }
.msg-form textarea { min-height: 120px; resize: vertical; }
.msg-form button { background: #22c55e; color: #000; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 700; cursor: pointer; font-family: inherit; font-size: 15px; align-self: flex-start; transition: background 0.2s; }
.msg-form button:hover { background: #16a34a; }
.msg-form .char-count { color: #64748b; font-size: 12px; text-align: right; }
.success-msg { background: #14532d; border: 1px solid #22c55e; color: #22c55e; padding: 10px 14px; border-radius: 6px; margin-bottom: 12px; }
.error-msg { background: #450a0a; border: 1px solid #ef4444; color: #ef4444; padding: 10px 14px; border-radius: 6px; margin-bottom: 12px; }
.filter-bar { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
.filter-btn { background: #1a1d27; border: 1px solid #2d3148; color: #94a3b8; padding: 4px 12px; border-radius: 6px; cursor: pointer; font-family: inherit; font-size: 12px; transition: border-color 0.2s, color 0.2s; }
.filter-btn.active, .filter-btn:hover { color: #22c55e; border-color: #22c55e; }
.search-box { background: #0d0f14; border: 1px solid #2d3148; color: #e2e8f0; padding: 8px 14px; border-radius: 6px; font-family: inherit; font-size: 14px; width: 100%; max-width: 400px; margin-bottom: 12px; transition: border-color 0.2s, box-shadow 0.2s; }
.search-box:focus { border-color: #22c55e; outline: none; box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2); }
.alert-item { background: #1a1d27; border: 1px solid #2d3148; border-left: 4px solid #ef4444; border-radius: 6px; padding: 16px 18px; margin: 8px 0; }
.alert-item.warning { border-left-color: #f59e0b; }
.alert-item h3 { font-size: 14px; color: #e2e8f0; margin-bottom: 4px; }
.alert-item .meta { color: #64748b; font-size: 12px; }
.progress-bar { background: #2d3148; border-radius: 6px; height: 20px; overflow: hidden; position: relative; }
.progress-fill { height: 100%; border-radius: 6px; background: #22c55e; }
.progress-label { position: absolute; top: 0; left: 0; right: 0; text-align: center; line-height: 20px; font-size: 12px; font-weight: 600; color: #fff; }
@media (max-width: 768px) {
  .grid { grid-template-columns: 1fr; }
  nav { flex-wrap: wrap; }
  nav a { padding: 8px 12px; font-size: 13px; }
  .content { padding: 12px; }
  th, td { font-size: 13px; padding: 8px 6px; }
  .metric { flex-direction: column; align-items: flex-start; gap: 2px; }
}
</style>
</head>
<body>
<div class="header">
  <h1>$ selfhosting.sh board portal</h1>
  <div class="right">
    <span class="refresh-note">Auto-refreshes every 60s</span>
    <span class="time">Last refresh: ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC</span>
    <a href="/logout" class="logout-link">Logout</a>
  </div>
</div>
${navHtml(currentPath)}
<div class="content">
${bodyHtml}
</div>
</body>
</html>`;
}

// -- Login page --

function pageLogin(error) {
  const errorHtml = error ? '<p class="login-error">Invalid password</p>' : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Login — selfhosting.sh Portal</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: #0f1117; color: #e2e8f0; font-family: 'JetBrains Mono', 'Fira Code', monospace; display: flex; justify-content: center; align-items: center; min-height: 100vh; -webkit-font-smoothing: antialiased; }
.login-card { background: #1a1d27; border: 1px solid #2d3148; border-radius: 12px; padding: 40px; width: 100%; max-width: 400px; }
.login-header { text-align: center; margin-bottom: 32px; }
.login-header h1 { color: #22c55e; font-size: 20px; font-family: 'JetBrains Mono', 'Fira Code', monospace; }
.login-header p { color: #94a3b8; font-size: 14px; margin-top: 6px; }
.login-form { display: flex; flex-direction: column; gap: 16px; }
.login-form label { color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: -8px; }
.login-form input { background: #0d0f14; border: 1px solid #2d3148; border-radius: 6px; color: #e2e8f0; padding: 12px 14px; font-family: inherit; font-size: 14px; transition: border-color 0.2s, box-shadow 0.2s; }
.login-form input:focus { border-color: #22c55e; outline: none; box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2); }
.login-form button { background: #22c55e; color: #000; border: none; padding: 12px; border-radius: 6px; font-weight: 700; font-size: 14px; cursor: pointer; font-family: inherit; transition: background 0.2s; margin-top: 8px; }
.login-form button:hover { background: #16a34a; }
.login-error { color: #ef4444; font-size: 13px; text-align: center; margin-top: 4px; }
</style>
</head>
<body>
<div class="login-card">
  <div class="login-header">
    <h1>selfhosting.sh</h1>
    <p>Board Portal</p>
  </div>
  <form class="login-form" method="POST" action="/login">
    <label for="password">Password</label>
    <input type="password" id="password" name="password" placeholder="Password" autocomplete="current-password" required autofocus>
    <button type="submit">Sign in</button>
    ${errorHtml}
  </form>
</div>
</body>
</html>`;
}

function pageRateLimited() {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Rate Limited</title>
<style>body{background:#0f1117;color:#e2e8f0;font-family:monospace;display:flex;justify-content:center;align-items:center;height:100vh;text-align:center}h1{color:#f59e0b;font-size:18px}p{color:#64748b;margin-top:8px;font-size:14px}</style>
</head>
<body><div><h1>429 — Too Many Attempts</h1><p>Too many failed login attempts. Please try again in 15 minutes.</p></div></body>
</html>`;
}

// -- Page builders --

function pageDashboard() {
  const mem = getMemory();
  const disk = getDisk();
  const articles = getArticleCounts();
  const coordState = getCoordinatorState();
  const socialState = getSocialState();
  const queueSize = getSocialQueueSize();
  const latest = getLatestBoardReport();
  const alertCount = getAlertCount();
  const scorecard = parseScorecardFromReport(latest);

  const memPct = mem.total > 0 ? Math.round((mem.used / mem.total) * 100) : 0;
  const memColor = memPct > 90 ? '#ef4444' : memPct > 75 ? '#f59e0b' : '#22c55e';
  const diskPct = parseInt(disk.pct) || 0;
  const diskColor = diskPct > 80 ? '#ef4444' : diskPct > 60 ? '#f59e0b' : '#22c55e';

  const target = 1500;
  const artPct = Math.min(100, Math.round((articles.total / target) * 100));

  let agentRunning = 0, agentQueued = 0, agentErrors = 0;
  const runningAgents = (coordState && coordState.running) ? coordState.running : {};
  const runningSet = new Set(Object.keys(runningAgents));
  if (coordState && coordState.agents) {
    for (const [name, info] of Object.entries(coordState.agents)) {
      if (runningSet.has(name)) agentRunning++;
      else agentQueued++;
      if (isActiveError(info, name)) agentErrors++;
    }
  }

  let healthSummary = '';
  if (latest) {
    const match = latest.content.match(/## Business Health.*?\n([\s\S]*?)(?=\n## )/);
    if (match) healthSummary = match[1].trim().slice(0, 300);
  }

  let socialInfo = '';
  if (socialState.platforms) {
    for (const [platform, data] of Object.entries(socialState.platforms)) {
      if (data.lastPosted) {
        socialInfo += `<div class="metric"><span class="metric-label">${escapeHtml(platform)}</span><span class="metric-value" style="font-size:12px">${escapeHtml(new Date(data.lastPosted).toISOString().replace('T', ' ').slice(0, 19))}</span></div>`;
      }
    }
  }

  let body = `<div class="grid">
<div class="card">
  <h2>Business Health</h2>
  ${healthSummary ? `<div class="md-content" style="font-size:13px">${renderMarkdown(healthSummary)}</div>` : '<p style="color:#64748b">No board report available yet</p>'}
  ${alertCount > 0 ? `<div style="margin-top:10px"><span class="badge" style="background:#ef4444;color:#fff">${alertCount} alert${alertCount > 1 ? 's' : ''} need attention</span> <a href="/alerts" style="font-size:12px">View &rarr;</a></div>` : '<div style="margin-top:10px"><span class="badge" style="background:#22c55e">All clear</span></div>'}
</div>

<div class="card">
  <h2>Scorecard</h2>
  <div class="metric"><span class="metric-label">Articles</span><span class="metric-value">${articles.total} / ${target}</span></div>
  <div class="progress-bar"><div class="progress-fill" style="width:${artPct}%"></div><span class="progress-label">${artPct}%</span></div>
  <div class="metric" style="margin-top:8px"><span class="metric-label">Page 1 Keywords</span><span class="metric-value">${escapeHtml(scorecard.keywords || 'N/A')} / 100</span></div>
  <div class="metric"><span class="metric-label">Monthly Visits</span><span class="metric-value">${escapeHtml(scorecard.visits || 'N/A')} / 5,000</span></div>
  <div class="metric"><span class="metric-label">Revenue</span><span class="metric-value">${escapeHtml(scorecard.revenue || '$0')}</span></div>
</div>

<div class="card">
  <h2>Agent Summary</h2>
  <div class="metric"><span class="metric-label">Running</span><span class="metric-value ok">${agentRunning}</span></div>
  <div class="metric"><span class="metric-label">Queued / Idle</span><span class="metric-value">${agentQueued}</span></div>
  <div class="metric"><span class="metric-label">With Errors</span><span class="metric-value ${agentErrors > 0 ? 'crit' : ''}">${agentErrors}</span></div>
  <a href="/agents" style="font-size:12px;margin-top:8px;display:block">View agents &rarr;</a>
</div>

<div class="card">
  <h2>System Status</h2>
  <div class="metric"><span class="metric-label">Memory</span><span class="metric-value" style="color:${memColor}">${mem.used}MB / ${mem.total}MB</span></div>
  ${barHtml(memPct, memColor)}
  <div class="metric"><span class="metric-label">Disk</span><span class="metric-value" style="color:${diskColor}">${escapeHtml(disk.used)} / ${escapeHtml(disk.size)}</span></div>
  ${barHtml(diskPct, diskColor)}
  <a href="/system" style="font-size:12px;margin-top:8px;display:block">View details &rarr;</a>
</div>

<div class="card">
  <h2>Social Media</h2>
  <div class="metric"><span class="metric-label">Queue</span><span class="metric-value">${queueSize} items</span></div>
  ${socialInfo || '<div style="color:#64748b;font-size:12px">No platform data available</div>'}
</div>

<div class="card">
  <h2>Latest Board Report</h2>
  ${latest ? `<div class="metric"><span class="metric-label">Date</span><span class="metric-value">${escapeHtml(latest.name)}</span></div><div style="color:#94a3b8;font-size:12px;margin-top:6px">${escapeHtml(latest.content.slice(0, 200))}...</div><a href="/board" style="font-size:12px;margin-top:8px;display:block">Read full report &rarr;</a>` : '<p style="color:#64748b">No board reports yet</p>'}
</div>
</div>`;

  return layoutHtml('Dashboard', '/', body);
}

function pageBoard() {
  const reports = getBoardReports();
  let body = '<h2 style="margin-bottom:12px">Board Reports</h2>';
  body += '<input type="text" class="search-box" id="boardSearch" placeholder="Search reports..." oninput="filterReports()">';

  if (reports.length === 0) {
    body += '<p style="color:#64748b">No board reports found</p>';
  } else {
    for (let i = 0; i < reports.length; i++) {
      const r = reports[i];
      const openAttr = i === 0 ? ' open' : '';
      body += `<details class="accordion report-item" data-text="${escapeHtml(redactCredentials(r.content).toLowerCase())}"${openAttr}>
  <summary>${escapeHtml(r.name)}</summary>
  <div class="acc-body md-content">${renderMarkdown(r.content)}</div>
</details>`;
    }
  }

  body += `<script>
function filterReports() {
  const q = document.getElementById('boardSearch').value.toLowerCase();
  document.querySelectorAll('.report-item').forEach(el => {
    el.style.display = el.dataset.text.includes(q) ? '' : 'none';
  });
}
</script>`;

  return layoutHtml('Board Reports', '/board', body);
}

function pageInbox(successMsg, errorMsg) {
  const inbox = getCeoInbox();
  let body = '<h2 style="margin-bottom:12px">CEO Inbox & Messaging</h2>';

  if (successMsg) body += `<div class="success-msg">${escapeHtml(successMsg)}</div>`;
  if (errorMsg) body += `<div class="error-msg">${escapeHtml(errorMsg)}</div>`;

  body += `<div class="card" style="margin-bottom:16px">
<h2>Send Message to CEO</h2>
<form class="msg-form" method="POST" action="/api/submit-message">
  <input type="text" name="subject" placeholder="Subject (required)" maxlength="${MAX_SUBJECT_LEN}" required>
  <textarea name="message" placeholder="Message (required, max ${MAX_MESSAGE_LEN} chars)" maxlength="${MAX_MESSAGE_LEN}" required oninput="document.getElementById('charCount').textContent=this.value.length+'/${MAX_MESSAGE_LEN}'"></textarea>
  <div class="char-count" id="charCount">0/${MAX_MESSAGE_LEN}</div>
  <button type="submit">Submit Message</button>
</form>
</div>`;

  body += `<div class="card">
<h2>Current Inbox Contents</h2>
<div class="md-content">${inbox ? renderMarkdown(inbox) : '<p style="color:#64748b">Inbox is empty</p>'}</div>
</div>`;

  return layoutHtml('Inbox', '/inbox', body);
}

function pageAgents() {
  const coordState = getCoordinatorState();
  let body = '<h2 style="margin-bottom:12px">Agent Activity</h2>';

  let running = 0, queued = 0, errors = 0, backoff = 0;
  const runningAgentsMap = (coordState && coordState.running) ? coordState.running : {};
  const agentRunningSet = new Set(Object.keys(runningAgentsMap));
  if (coordState && coordState.agents) {
    for (const [name, info] of Object.entries(coordState.agents)) {
      if (agentRunningSet.has(name)) running++;
      else queued++;
      if (isActiveError(info, name)) { errors++; backoff++; }
    }
  }
  body += `<div style="margin-bottom:12px">
<span class="badge" style="background:#22c55e">${running} running</span>
<span class="badge" style="background:#f59e0b;margin-left:4px">${queued} queued</span>
${backoff > 0 ? `<span class="badge" style="background:#ef4444;margin-left:4px">${backoff} in backoff</span>` : ''}
${errors > 0 ? `<span class="badge" style="background:#ef4444;color:#fff;margin-left:4px">${errors} with errors</span>` : ''}
</div>`;

  if (coordState && coordState.agents) {
    const deptOrder = ['ceo', 'operations', 'technology', 'marketing', 'bi-finance', 'investor-relations'];
    const sorted = Object.entries(coordState.agents).sort(([a], [b]) => {
      const ai = deptOrder.indexOf(a);
      const bi = deptOrder.indexOf(b);
      if (ai >= 0 && bi >= 0) return ai - bi;
      if (ai >= 0) return -1;
      if (bi >= 0) return 1;
      return a.localeCompare(b);
    });

    body += '<table><tr><th>Agent</th><th>Status</th><th>Last Start</th><th>Last Exit</th><th>Errors</th><th>Log</th></tr>';
    for (const [name, info] of sorted) {
      const paused = isAgentPaused(name);
      const hasActiveError = isActiveError(info, name);
      const isRunning = agentRunningSet.has(name);
      const status = isRunning ? 'running' : paused ? 'paused' : hasActiveError ? 'backoff' : 'idle';
      const runInfo = isRunning ? runningAgentsMap[name] : null;
      const lastStart = info.lastStarted ? new Date(info.lastStarted).toISOString().replace('T', ' ').slice(0, 19) : '-';
      const lastExit = info.lastExited ? new Date(info.lastExited).toISOString().replace('T', ' ').slice(0, 19) : '-';
      const errs = info.consecutiveErrors || 0;

      // Error age display
      let errorDetail = '';
      if (errs > 0) {
        const errorTimestamp = info.lastErrorAt || info.lastRun;
        if (errorTimestamp) {
          const errorAge = Date.now() - new Date(errorTimestamp).getTime();
          const ageStr = formatTimeAgo(errorAge);
          if (paused) {
            errorDetail = ` <span class="stale" style="font-size:12px">(last error: ${ageStr} — paused)</span>`;
          } else {
            const expectedInterval = getExpectedIntervalMs(name);
            const isStale = errorAge >= (expectedInterval * 1.5);
            if (isStale) {
              errorDetail = ` <span class="stale" style="font-size:12px">(last error: ${ageStr} — stale)</span>`;
            } else {
              errorDetail = ` <span class="crit" style="font-size:12px">(last error: ${ageStr} — active)</span>`;
            }
          }
        }
      }

      const logName = name.replace(/^ops-/, '');
      let logPath = `${BASE}/logs/${name}.md`;
      if (!fs.existsSync(logPath)) logPath = `${BASE}/logs/${logName}.md`;
      const logContent = fs.existsSync(logPath) ? readFileTail(logPath, 30) : '';

      let runningDetail = '';
      if (isRunning && runInfo) {
        const durMs = Date.now() - new Date(runInfo.startTime).getTime();
        const durStr = formatTimeAgo(durMs);
        runningDetail = ` <span style="font-size:12px;color:#22c55e">(${durStr}, pid ${runInfo.pid}, ${escapeHtml(runInfo.trigger || '')})</span>`;
      }

      body += `<tr>
<td>${escapeHtml(name)}</td>
<td>${statusBadge(status)}${runningDetail}${errorDetail}</td>
<td style="font-size:12px">${escapeHtml(lastStart)}</td>
<td style="font-size:12px">${escapeHtml(lastExit)}</td>
<td>${errs > 0 ? `<span class="crit">${errs}</span>` : '0'}</td>
<td>${logContent ? `<details><summary style="cursor:pointer;font-size:12px;color:#22c55e">view</summary><pre style="margin-top:6px;font-size:12px">${escapeHtml(redactCredentials(logContent))}</pre></details>` : '<span style="color:#64748b;font-size:12px">-</span>'}</td>
</tr>`;
    }
    body += '</table>';
  } else {
    body += '<p style="color:#64748b">No coordinator state available</p>';
  }

  const coordLog = readFileTail(`${BASE}/logs/coordinator.log`, 50);
  body += `<div class="card wide" style="margin-top:16px">
<h2>Recent Coordinator Log</h2>
<pre>${escapeHtml(redactCredentials(coordLog))}</pre>
</div>`;

  return layoutHtml('Agents', '/agents', body);
}

function pageContent() {
  const articles = getArticleCounts();
  const target = 1500;
  const artPct = Math.min(100, Math.round((articles.total / target) * 100));
  const queueSize = getSocialQueueSize();
  const socialState = getSocialState();

  let body = '<h2 style="margin-bottom:12px">Content & SEO</h2>';

  body += `<div class="grid">
<div class="card">
  <h2>Article Progress</h2>
  <div class="metric"><span class="metric-label">Total Articles</span><span class="metric-value big">${articles.total}</span></div>
  <div class="metric"><span class="metric-label">Month 1 Target</span><span class="metric-value">${target}</span></div>
  <div class="progress-bar" style="margin-top:8px"><div class="progress-fill" style="width:${artPct}%"></div><span class="progress-label">${artPct}%</span></div>
</div>

<div class="card">
  <h2>By Content Type</h2>
  <table>
    <tr><th>Type</th><th>Count</th></tr>
    ${Object.entries(articles.collections).sort(([,a],[,b]) => b - a).map(([k,v]) => `<tr><td>${escapeHtml(k)}</td><td>${v}</td></tr>`).join('')}
  </table>
</div>
</div>`;

  const stateContent = readFileSafe(`${BASE}/state.md`);
  const catMatch = stateContent.match(/## Category Completion Status[\s\S]*?\n\n/);
  if (catMatch) {
    body += `<div class="card wide" style="margin-top:16px">
<h2>Category Completion</h2>
<div class="md-content">${renderMarkdown(catMatch[0])}</div>
</div>`;
  }

  body += `<div class="card wide" style="margin-top:16px">
<h2>Social Posting</h2>
<div class="metric"><span class="metric-label">Queue Size</span><span class="metric-value">${queueSize}</span></div>`;
  if (socialState.platforms) {
    body += '<table><tr><th>Platform</th><th>Status</th><th>Last Posted</th></tr>';
    for (const [platform, data] of Object.entries(socialState.platforms)) {
      const lastPosted = data.lastPosted ? new Date(data.lastPosted).toISOString().replace('T', ' ').slice(0, 19) + ' UTC' : '-';
      const status = data.lastPosted ? 'active' : 'blocked';
      body += `<tr><td>${escapeHtml(platform)}</td><td>${statusBadge(status)}</td><td style="font-size:12px">${escapeHtml(lastPosted)}</td></tr>`;
    }
    body += '</table>';
  }
  body += '</div>';

  return layoutHtml('Content & SEO', '/content', body);
}

function pageSystem() {
  const mem = getMemory();
  const disk = getDisk();
  const load = getLoad();
  const uptime = getUptime();
  const services = getServices();
  const config = getCoordinatorConfig();

  const memPct = mem.total > 0 ? Math.round((mem.used / mem.total) * 100) : 0;
  const memColor = memPct > 90 ? '#ef4444' : memPct > 75 ? '#f59e0b' : '#22c55e';
  const diskPct = parseInt(disk.pct) || 0;
  const diskColor = diskPct > 80 ? '#ef4444' : diskPct > 60 ? '#f59e0b' : '#22c55e';

  let body = '<h2 style="margin-bottom:12px">System Health</h2>';

  body += `<div class="grid">
<div class="card">
  <h2>VPS Resources</h2>
  <div class="metric"><span class="metric-label">Uptime</span><span class="metric-value">${escapeHtml(uptime)}</span></div>
  <div class="metric"><span class="metric-label">Load</span><span class="metric-value">${escapeHtml(load)}</span></div>
  <div class="metric" style="margin-top:8px"><span class="metric-label">Memory</span><span class="metric-value" style="color:${memColor}">${mem.used}MB / ${mem.total}MB (${memPct}%)</span></div>
  ${barHtml(memPct, memColor)}
  <div class="metric" style="margin-top:8px"><span class="metric-label">Disk</span><span class="metric-value" style="color:${diskColor}">${escapeHtml(disk.used)} / ${escapeHtml(disk.size)} (${escapeHtml(disk.pct)})</span></div>
  ${barHtml(diskPct, diskColor)}
</div>

<div class="card">
  <h2>Services</h2>
  <table>
    <tr><th>Service</th><th>Status</th></tr>
    ${services.map(s => `<tr><td>${escapeHtml(s.name)}</td><td>${statusBadge(s.status)}</td></tr>`).join('')}
  </table>
</div>
</div>`;

  if (config) {
    body += `<div class="card wide" style="margin-top:16px">
<h2>Coordinator Config</h2>
<table>
  ${Object.entries(config).map(([k,v]) => `<tr><td>${escapeHtml(k)}</td><td>${escapeHtml(typeof v === 'object' ? JSON.stringify(v) : String(v))}</td></tr>`).join('')}
</table>
</div>`;
  }

  body += `<div class="card wide" style="margin-top:16px">
<h2>Rate Limit Proxy</h2>
<div class="metric"><span class="metric-label">Status</span><span class="metric-value">${exec('systemctl is-active selfhosting-proxy') === 'active' ? '<span class="ok">ACTIVE</span>' : '<span class="crit">INACTIVE</span>'}</span></div>
<div class="metric"><span class="metric-label">Endpoint</span><span class="metric-value">localhost:3128</span></div>
</div>`;

  return layoutHtml('System Health', '/system', body);
}

function pageAlerts() {
  const coordState = getCoordinatorState();
  const latest = getLatestBoardReport();

  let body = '<h2 style="margin-bottom:12px">Alerts & Escalations</h2>';

  let humanItems = [];
  if (latest) {
    const humanMatch = latest.content.match(/## Escalations Requiring Human Action([\s\S]*?)(?=\n## |$)/);
    if (humanMatch) {
      const lines = humanMatch[1].trim().split('\n').filter(l => l.trim());
      let current = null;
      for (const line of lines) {
        if (line.match(/^[-*]\s+\*\*/) || line.match(/^\d+\.\s+\*\*/)) {
          if (current) humanItems.push(current);
          current = line.replace(/^[-*\d.]+\s*/, '').trim();
        } else if (current) {
          current += '\n' + line.trim();
        }
      }
      if (current) humanItems.push(current);
    }
  }

  const ceoInbox = getCeoInbox();
  const inboxHumanMatches = ceoInbox.match(/Requires:\s*human/gi);
  const inboxHumanCount = inboxHumanMatches ? inboxHumanMatches.length : 0;

  let agentErrors = [];
  const alertRunningSet = new Set(Object.keys((coordState && coordState.running) ? coordState.running : {}));
  if (coordState && coordState.agents) {
    for (const [name, info] of Object.entries(coordState.agents)) {
      if (isActiveError(info, name)) {
        const errorTimestamp = info.lastErrorAt || info.lastRun;
        const errorAge = errorTimestamp ? Date.now() - new Date(errorTimestamp).getTime() : 0;
        agentErrors.push({ name, errors: info.consecutiveErrors, running: alertRunningSet.has(name), errorAge });
      }
    }
  }

  const totalAlerts = humanItems.length + agentErrors.length;

  if (totalAlerts === 0) {
    body += '<div style="text-align:center;padding:40px;color:#64748b"><p style="font-size:18px">No active alerts</p><p style="margin-top:8px">All systems operating normally</p></div>';
  } else {
    body += `<p style="margin-bottom:12px;color:#94a3b8">${totalAlerts} item${totalAlerts > 1 ? 's' : ''} need attention</p>`;
  }

  if (humanItems.length > 0) {
    body += '<h3 style="color:#ef4444;margin:16px 0 8px">Requires Human Action</h3>';
    for (const item of humanItems) {
      body += `<div class="alert-item"><div class="md-content">${renderMarkdown(item)}</div></div>`;
    }
  }

  if (inboxHumanCount > 0) {
    body += `<div class="alert-item warning"><h3>CEO Inbox</h3><div class="meta">${inboxHumanCount} item(s) tagged "Requires: human" in CEO inbox</div><a href="/inbox" style="font-size:12px">View inbox &rarr;</a></div>`;
  }

  if (agentErrors.length > 0) {
    body += '<h3 style="color:#f59e0b;margin:16px 0 8px">Agent Errors</h3>';
    for (const ae of agentErrors) {
      const ageStr = ae.errorAge ? formatTimeAgo(ae.errorAge) : 'unknown';
      body += `<div class="alert-item warning"><h3>${escapeHtml(ae.name)}</h3><div class="meta">${ae.errors} consecutive error(s) — ${ae.running ? 'currently running' : 'in backoff'} — last error: ${ageStr} — <span class="crit">active</span></div></div>`;
    }
  }

  return layoutHtml('Alerts', '/alerts', body);
}

function pageCommits() {
  const commits = getRecentCommits(50);
  let body = '<h2 style="margin-bottom:12px">Recent Commits</h2>';

  body += `<div class="filter-bar">
<button class="filter-btn active" onclick="filterCommits('all')">All</button>
<button class="filter-btn" onclick="filterCommits('content')">Content</button>
<button class="filter-btn" onclick="filterCommits('infra')">Infrastructure</button>
<button class="filter-btn" onclick="filterCommits('agents')">Agents</button>
</div>`;

  body += '<div id="commitList">';
  for (const c of commits) {
    const isContent = /\[ops\]|auto-commit|content/i.test(c.subject);
    const isInfra = /\[tech\]|bin\/|config\/|systemd|deploy/i.test(c.subject);
    const isAgent = /\[ceo\]|agent|inbox|CLAUDE\.md|strategy/i.test(c.subject);
    const tags = [];
    if (isContent) tags.push('content');
    if (isInfra) tags.push('infra');
    if (isAgent) tags.push('agents');
    if (tags.length === 0) tags.push('other');

    body += `<div class="commit-item" data-tags="${tags.join(',')}" style="border-bottom:1px solid #2d3148;padding:8px 0">
<div style="display:flex;justify-content:space-between;align-items:baseline">
  <span><code style="color:#22c55e;font-size:12px">${escapeHtml(c.short)}</code> <span style="margin-left:8px">${escapeHtml(c.subject)}</span></span>
  <span style="color:#64748b;font-size:12px;white-space:nowrap;margin-left:12px">${escapeHtml(c.date)}</span>
</div>
</div>`;
  }
  body += '</div>';

  body += `<script>
function filterCommits(tag) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  document.querySelectorAll('.commit-item').forEach(el => {
    if (tag === 'all') { el.style.display = ''; return; }
    el.style.display = el.dataset.tags.includes(tag) ? '' : 'none';
  });
}
</script>`;

  return layoutHtml('Commits', '/commits', body);
}

// -- CLAUDE.md pages --

function getClaudemdFiles() {
  const files = [];
  // CEO CLAUDE.md
  const ceoPath = `${BASE}/CLAUDE.md`;
  if (fs.existsSync(ceoPath)) {
    files.push({ name: 'CEO (CLAUDE.md)', path: ceoPath, key: 'ceo', editable: true });
  }
  // Department heads
  const agentsDir = `${BASE}/agents`;
  if (fs.existsSync(agentsDir)) {
    for (const name of fs.readdirSync(agentsDir).sort()) {
      const agentPath = path.join(agentsDir, name, 'CLAUDE.md');
      if (fs.existsSync(agentPath)) {
        files.push({ name: `${name}`, path: agentPath, key: name, editable: false });
      }
      // Writers
      const writersDir = path.join(agentsDir, name, 'writers');
      if (fs.existsSync(writersDir)) {
        for (const wName of fs.readdirSync(writersDir).sort()) {
          const wPath = path.join(writersDir, wName, 'CLAUDE.md');
          if (fs.existsSync(wPath)) {
            files.push({ name: `${name}/${wName}`, path: wPath, key: `${name}-${wName}`, editable: false });
          }
        }
      }
    }
  }
  return files;
}

function pageClaudemdAuth(error) {
  const errorHtml = error ? '<p class="login-error">Invalid password</p>' : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>CLAUDE.md Access — selfhosting.sh Portal</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: #0f1117; color: #e2e8f0; font-family: 'JetBrains Mono', 'Fira Code', monospace; display: flex; justify-content: center; align-items: center; min-height: 100vh; -webkit-font-smoothing: antialiased; }
.login-card { background: #1a1d27; border: 1px solid #2d3148; border-radius: 12px; padding: 40px; width: 100%; max-width: 400px; }
.login-header { text-align: center; margin-bottom: 32px; }
.login-header h1 { color: #f59e0b; font-size: 18px; font-family: 'JetBrains Mono', 'Fira Code', monospace; }
.login-header p { color: #94a3b8; font-size: 13px; margin-top: 6px; }
.login-form { display: flex; flex-direction: column; gap: 16px; }
.login-form label { color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: -8px; }
.login-form input { background: #0d0f14; border: 1px solid #2d3148; border-radius: 6px; color: #e2e8f0; padding: 12px 14px; font-family: inherit; font-size: 14px; transition: border-color 0.2s, box-shadow 0.2s; }
.login-form input:focus { border-color: #f59e0b; outline: none; box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.2); }
.login-form button { background: #f59e0b; color: #000; border: none; padding: 12px; border-radius: 6px; font-weight: 700; font-size: 14px; cursor: pointer; font-family: inherit; transition: background 0.2s; margin-top: 8px; }
.login-form button:hover { background: #d97706; }
.login-error { color: #ef4444; font-size: 13px; text-align: center; margin-top: 4px; }
.back-link { text-align: center; margin-top: 16px; }
.back-link a { color: #64748b; font-size: 12px; text-decoration: none; }
.back-link a:hover { color: #94a3b8; }
</style>
</head>
<body>
<div class="login-card">
  <div class="login-header">
    <h1>CLAUDE.md — Restricted Access</h1>
    <p>Agent instructions contain sensitive operational details.<br>Enter the CLAUDE.md password to continue.</p>
  </div>
  <form class="login-form" method="POST" action="/claudemd/auth">
    <label for="claudemd_password">CLAUDE.md Password</label>
    <input type="password" id="claudemd_password" name="password" placeholder="Password" autocomplete="off" required autofocus>
    <button type="submit">Unlock</button>
    ${errorHtml}
  </form>
  <div class="back-link"><a href="/">&larr; Back to Dashboard</a></div>
</div>
</body>
</html>`;
}

function pageClaudemdViewer(selectedKey, saveMsg, saveErr) {
  const files = getClaudemdFiles();
  let body = '<h2 style="margin-bottom:12px">Agent CLAUDE.md Files</h2>';
  body += '<p style="color:#64748b;font-size:12px;margin-bottom:16px">Sensitive — extra authentication required. CEO CLAUDE.md is editable; all others are read-only.</p>';

  if (saveMsg) body += `<div class="success-msg">${escapeHtml(saveMsg)}</div>`;
  if (saveErr) body += `<div class="error-msg">${escapeHtml(saveErr)}</div>`;

  // File selector sidebar + content
  body += '<div style="display:flex;gap:16px;flex-wrap:wrap">';

  // Sidebar
  body += '<div style="min-width:200px;max-width:280px">';
  body += '<div class="card"><h2>Files</h2>';
  for (const f of files) {
    const active = f.key === selectedKey;
    const style = active ? 'color:#22c55e;font-weight:700' : 'color:#94a3b8';
    const icon = f.editable ? '&#9998; ' : '&#128274; ';
    body += `<div style="padding:6px 0;border-bottom:1px solid #2d3148"><a href="/claudemd?file=${encodeURIComponent(f.key)}" style="${style};font-size:13px;text-decoration:none">${icon}${escapeHtml(f.name)}</a></div>`;
  }
  body += '</div></div>';

  // Content area
  body += '<div style="flex:1;min-width:0">';
  const selected = files.find(f => f.key === selectedKey) || files[0];
  if (selected) {
    const content = readFileSafe(selected.path);
    const lines = content.split('\n').length;
    body += `<div class="card"><h2>${escapeHtml(selected.name)} <span style="font-size:11px;color:#64748b;font-weight:400">(${lines} lines, ${(content.length / 1024).toFixed(1)}KB)</span></h2>`;

    if (selected.editable) {
      body += `<form method="POST" action="/claudemd/save">
<input type="hidden" name="key" value="${escapeHtml(selected.key)}">
<textarea name="content" style="width:100%;min-height:600px;background:#0d0f14;border:1px solid #2d3148;color:#e2e8f0;padding:14px;border-radius:6px;font-family:'JetBrains Mono','Fira Code',monospace;font-size:13px;line-height:1.5;resize:vertical;tab-size:2">${escapeHtml(content)}</textarea>
<div style="margin-top:8px;display:flex;gap:8px;align-items:center">
<button type="submit" style="background:#22c55e;color:#000;border:none;padding:8px 20px;border-radius:6px;font-weight:700;cursor:pointer;font-family:inherit;font-size:14px">Save Changes</button>
<span style="color:#64748b;font-size:12px">Only CEO CLAUDE.md can be edited from the portal</span>
</div>
</form>`;
    } else {
      body += `<div class="md-content">${renderMarkdown(content)}</div>`;
    }
    body += '</div>';
  }
  body += '</div></div>';

  return layoutHtml('CLAUDE.md', '/claudemd', body);
}

// -- Instructions page --

function pageInstructions() {
  const defaultKey = 'ceo';
  const agentButtons = AGENT_CLAUDE_MDS.map(a => {
    const shortName = a.name.length > 16 ? a.name.slice(0, 14) + '..' : a.name;
    return `<button class="agent-btn" data-key="${escapeHtml(a.key)}" onclick="loadAgent('${escapeHtml(a.key)}')">${escapeHtml(shortName)}</button>`;
  }).join('\n    ');

  let body = `<h2 style="margin-bottom:12px">Agent Instructions</h2>
<p style="color:#64748b;font-size:12px;margin-bottom:16px">${AGENT_CLAUDE_MDS.length} agents. CEO CLAUDE.md is editable; all others are read-only.</p>

<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px" id="agentButtons">
    ${agentButtons}
</div>

<div id="agentHeader" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
  <div>
    <span id="agentTitle" style="font-size:16px;color:#22c55e;font-weight:700">CEO</span>
    <span id="agentMeta" style="font-size:12px;color:#64748b;margin-left:8px"></span>
  </div>
  <div id="editControls" style="display:none;gap:8px">
    <button id="toggleEditBtn" onclick="toggleEdit()" style="background:#1a1d27;border:1px solid #2d3148;color:#94a3b8;padding:4px 12px;border-radius:6px;cursor:pointer;font-family:inherit;font-size:12px">Edit</button>
    <button id="saveBtn" onclick="saveContent()" style="background:#22c55e;color:#000;border:none;padding:4px 12px;border-radius:6px;cursor:pointer;font-family:inherit;font-size:12px;font-weight:700;display:none">Save</button>
  </div>
</div>

<div id="viewContainer" class="card" style="max-height:80vh;overflow-y:auto">
  <div id="mdContent" class="md-content" style="font-size:14px">Loading...</div>
</div>

<div id="editContainer" style="display:none">
  <textarea id="editArea" style="width:100%;min-height:600px;background:#0d0f14;border:1px solid #2d3148;color:#e2e8f0;padding:14px;border-radius:6px;font-family:'JetBrains Mono','Fira Code',monospace;font-size:13px;line-height:1.5;resize:vertical;tab-size:2"></textarea>
</div>

<div id="toast" style="display:none;position:fixed;bottom:24px;right:24px;padding:10px 20px;border-radius:6px;font-size:13px;font-weight:600;z-index:1000"></div>

<style>
.agent-btn { background:#1a1d27; border:1px solid #2d3148; color:#94a3b8; padding:6px 12px; border-radius:6px; cursor:pointer; font-family:inherit; font-size:12px; transition:border-color 0.2s,color 0.2s; }
.agent-btn:hover { color:#e2e8f0; border-color:#3d4168; }
.agent-btn.active { color:#22c55e; border-color:#22c55e; background:#0d0f14; }
</style>

<script>
let currentAgent = '${defaultKey}';
let isEditing = false;
let currentContent = '';

function showToast(msg, isError) {
  const toast = document.getElementById('toast');
  toast.style.background = isError ? '#450a0a' : '#14532d';
  toast.style.color = isError ? '#ef4444' : '#22c55e';
  toast.style.border = '1px solid ' + (isError ? '#ef4444' : '#22c55e');
  toast.textContent = msg;
  toast.style.display = 'block';
  setTimeout(() => toast.style.display = 'none', 3000);
}

async function loadAgent(key) {
  currentAgent = key;
  isEditing = false;
  document.getElementById('editContainer').style.display = 'none';
  document.getElementById('viewContainer').style.display = '';
  document.getElementById('mdContent').innerHTML = '<span style="color:#64748b">Loading...</span>';

  // Update active button
  document.querySelectorAll('.agent-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.key === key);
  });

  try {
    const resp = await fetch('/api/claude-md?agent=' + encodeURIComponent(key));
    const data = await resp.json();
    if (!data.ok) {
      document.getElementById('mdContent').innerHTML = '<span style="color:#ef4444">Error: ' + (data.error || 'Unknown') + '</span>';
      document.getElementById('editControls').style.display = 'none';
      return;
    }

    document.getElementById('agentTitle').textContent = data.name;
    const lines = data.content.split('\\n').length;
    const sizeKb = (data.content.length / 1024).toFixed(1);
    document.getElementById('agentMeta').textContent = '(' + lines + ' lines, ' + sizeKb + 'KB)';
    document.getElementById('mdContent').innerHTML = data.html;
    currentContent = data.content;

    if (data.editable) {
      document.getElementById('editControls').style.display = 'flex';
      document.getElementById('toggleEditBtn').style.display = '';
      document.getElementById('saveBtn').style.display = 'none';
    } else {
      document.getElementById('editControls').style.display = 'none';
    }
  } catch (err) {
    document.getElementById('mdContent').innerHTML = '<span style="color:#ef4444">Failed to load: ' + err.message + '</span>';
  }
}

function toggleEdit() {
  isEditing = !isEditing;
  if (isEditing) {
    document.getElementById('viewContainer').style.display = 'none';
    document.getElementById('editContainer').style.display = '';
    document.getElementById('editArea').value = currentContent;
    document.getElementById('toggleEditBtn').textContent = 'View';
    document.getElementById('saveBtn').style.display = '';
  } else {
    document.getElementById('editContainer').style.display = 'none';
    document.getElementById('viewContainer').style.display = '';
    document.getElementById('toggleEditBtn').textContent = 'Edit';
    document.getElementById('saveBtn').style.display = 'none';
  }
}

async function saveContent() {
  const content = document.getElementById('editArea').value;
  if (!content || !content.startsWith('#')) {
    showToast('Content must start with # (Markdown heading)', true);
    return;
  }
  try {
    const resp = await fetch('/api/claude-md?agent=ceo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
    const data = await resp.json();
    if (data.ok) {
      showToast('Saved successfully');
      currentContent = content;
      // Reload to update rendered view
      await loadAgent('ceo');
      isEditing = false;
      document.getElementById('editContainer').style.display = 'none';
      document.getElementById('viewContainer').style.display = '';
      document.getElementById('toggleEditBtn').textContent = 'Edit';
      document.getElementById('saveBtn').style.display = 'none';
    } else {
      showToast('Error: ' + (data.error || 'Save failed'), true);
    }
  } catch (err) {
    showToast('Network error: ' + err.message, true);
  }
}

// Load default agent on page load
document.addEventListener('DOMContentLoaded', () => loadAgent('${defaultKey}'));
</script>`;

  return layoutHtml('Instructions', '/instructions', body);
}

// -- Growth Metrics Dashboard --

async function pageGrowth() {
  const articles = getArticleCounts();
  const target = 1500;
  const socialState = getSocialState();
  const queueSize = getSocialQueueSize();

  // Fetch all data sources in parallel with graceful fallbacks
  let gscResult = { data: null, source: 'pending' };
  let ga4Data = null;
  let socialFollowers = { bluesky: null, mastodon: null };

  try {
    [gscResult, ga4Data, socialFollowers] = await Promise.all([
      getCachedAsync('gsc', fetchGSCData),
      getCachedAsync('ga4', fetchGA4Data).catch(e => { console.error('GA4 error:', e.message); return null; }),
      getCachedAsync('social-followers', fetchSocialFollowers).catch(e => { console.error('Social error:', e.message); return { bluesky: null, mastodon: null }; }),
    ]);
  } catch (err) {
    console.error('Growth data fetch error:', err.message);
  }

  // Parse GSC metrics
  let gscImpressions = '--', gscClicks = '--', gscCtr = '--', gscPosition = '--';
  let gscDailyRows = [], gscPageRows = [], gscQueryRows = [];
  let page1Keywords = 0, page2Keywords = 0, page3Keywords = 0;
  let gscSource = gscResult.source || 'none';

  if (gscResult.data) {
    const gd = gscResult.data;

    // Daily data
    if (gd.daily && gd.daily.rows) {
      gscDailyRows = gd.daily.rows;
      let totalImp = 0, totalClk = 0;
      for (const row of gd.daily.rows) {
        totalImp += row.impressions || 0;
        totalClk += row.clicks || 0;
      }
      gscImpressions = totalImp;
      gscClicks = totalClk;
      gscCtr = totalImp > 0 ? ((totalClk / totalImp) * 100).toFixed(1) + '%' : '0%';
    }

    // Pages data
    if (gd.pages && gd.pages.rows) {
      gscPageRows = gd.pages.rows;
      let totalPos = 0, posCount = 0;
      for (const row of gd.pages.rows) {
        if (row.position) { totalPos += row.position; posCount++; }
      }
      gscPosition = posCount > 0 ? (totalPos / posCount).toFixed(1) : '--';
    }

    // Query data — count keywords by position bracket
    if (gd.queries_detailed && gd.queries_detailed.rows) {
      gscQueryRows = gd.queries_detailed.rows;
      for (const row of gd.queries_detailed.rows) {
        const pos = row.position || 100;
        if (pos <= 10) page1Keywords++;
        else if (pos <= 20) page2Keywords++;
        else if (pos <= 30) page3Keywords++;
      }
    }
  }

  // Parse GA4 metrics
  let ga4Views = '--', ga4Users = '--', ga4Sessions = '--';
  let ga4BounceRate = '--', ga4AvgDuration = '--';
  let ga4DailyRows = [], ga4TopPages = [], ga4Sources = [];

  if (ga4Data) {
    // Daily
    if (ga4Data.daily && ga4Data.daily.rows) {
      ga4DailyRows = ga4Data.daily.rows;
      let totalViews = 0, totalUsers = 0, totalSessions = 0;
      for (const row of ga4Data.daily.rows) {
        const vals = row.metricValues || [];
        totalUsers += parseInt(vals[0]?.value || '0', 10);
        totalViews += parseInt(vals[1]?.value || '0', 10);
        totalSessions += parseInt(vals[2]?.value || '0', 10);
      }
      ga4Views = totalViews;
      ga4Users = totalUsers;
      ga4Sessions = totalSessions;
    }

    // Engagement
    if (ga4Data.engagement && ga4Data.engagement.rows && ga4Data.engagement.rows[0]) {
      const vals = ga4Data.engagement.rows[0].metricValues || [];
      const bounce = parseFloat(vals[0]?.value || '0');
      ga4BounceRate = (bounce * 100).toFixed(1) + '%';
      const avgDur = parseFloat(vals[1]?.value || '0');
      ga4AvgDuration = avgDur.toFixed(0) + 's';
    }

    // Top pages
    if (ga4Data.topPages && ga4Data.topPages.rows) {
      ga4TopPages = ga4Data.topPages.rows.map(r => ({
        path: (r.dimensionValues || [])[0]?.value || '/',
        views: parseInt((r.metricValues || [])[0]?.value || '0', 10)
      }));
    }

    // Sources
    if (ga4Data.sources && ga4Data.sources.rows) {
      ga4Sources = ga4Data.sources.rows.map(r => ({
        source: (r.dimensionValues || [])[0]?.value || '(none)',
        medium: (r.dimensionValues || [])[1]?.value || '(none)',
        sessions: parseInt((r.metricValues || [])[0]?.value || '0', 10)
      }));
    }
  }

  // Social follower total
  const bskyFollowers = socialFollowers.bluesky;
  const mastoFollowers = socialFollowers.mastodon;
  const totalFollowers = (bskyFollowers || 0) + (mastoFollowers || 0);
  const followerStr = totalFollowers > 0 ? String(totalFollowers) : '--';

  // Color coding helpers
  function metricColor(actual, target) {
    if (typeof actual !== 'number' || isNaN(actual)) return '';
    if (actual >= target) return 'metric-green';
    if (actual >= target * 0.5) return 'metric-yellow';
    return 'metric-red';
  }

  // Build page
  let body = `<style>
.metric-green { color: #22c55e; }
.metric-yellow { color: #eab308; }
.metric-red { color: #ef4444; }
.top-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 20px; }
.top-card { background: #1a1d27; border: 1px solid #2d3148; border-radius: 10px; padding: 16px; text-align: center; }
.top-card .label { color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
.top-card .value { font-size: 28px; font-weight: 700; color: #22c55e; }
.top-card .sub { color: #94a3b8; font-size: 11px; margin-top: 4px; }
.sparkline { display: flex; align-items: flex-end; gap: 2px; height: 40px; }
.sparkline .bar { background: #22c55e; border-radius: 2px; min-width: 8px; flex: 1; }
</style>`;

  body += `<h2 style="margin-bottom:4px">Growth Metrics</h2>
<p style="color:#64748b;font-size:12px;margin-bottom:16px">Data source: ${escapeHtml(gscSource)} | Last refresh: ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC</p>`;

  // Top-line metric cards
  body += `<div class="top-cards">
  <div class="top-card">
    <div class="label">Articles</div>
    <div class="value ${metricColor(articles.total, target)}">${articles.total}</div>
    <div class="sub">/ ${target} target</div>
  </div>
  <div class="top-card">
    <div class="label">GSC Impressions</div>
    <div class="value">${gscImpressions}</div>
    <div class="sub">7-day total</div>
  </div>
  <div class="top-card">
    <div class="label">GSC Clicks</div>
    <div class="value">${gscClicks}</div>
    <div class="sub">7-day total</div>
  </div>
  <div class="top-card">
    <div class="label">GA4 Page Views</div>
    <div class="value">${ga4Views}</div>
    <div class="sub">7-day total</div>
  </div>
  <div class="top-card">
    <div class="label">Page-1 Keywords</div>
    <div class="value ${metricColor(page1Keywords, 100)}">${page1Keywords}</div>
    <div class="sub">/ 100 target</div>
  </div>
  <div class="top-card">
    <div class="label">Social Followers</div>
    <div class="value">${followerStr}</div>
    <div class="sub">${bskyFollowers !== null ? 'BS:' + bskyFollowers : ''} ${mastoFollowers !== null ? 'M:' + mastoFollowers : ''}</div>
  </div>
</div>`;

  // Content & SEO section
  body += `<div class="card wide" style="margin-bottom:16px">
<h2>Content & SEO — GSC Performance (7 days)</h2>
<div style="display:flex;gap:24px;flex-wrap:wrap;margin-bottom:12px">
  <div><span style="color:#64748b">Impressions:</span> <strong>${gscImpressions}</strong></div>
  <div><span style="color:#64748b">Clicks:</span> <strong>${gscClicks}</strong></div>
  <div><span style="color:#64748b">CTR:</span> <strong>${gscCtr}</strong></div>
  <div><span style="color:#64748b">Avg Position:</span> <strong>${gscPosition}</strong></div>
</div>`;

  // Daily impressions sparkline
  if (gscDailyRows.length > 0) {
    const maxImp = Math.max(...gscDailyRows.map(r => r.impressions || 0), 1);
    body += `<div style="margin-bottom:12px"><div style="color:#64748b;font-size:12px;margin-bottom:4px">Daily Impressions</div><div class="sparkline">`;
    for (const row of gscDailyRows) {
      const imp = row.impressions || 0;
      const height = Math.max(2, Math.round((imp / maxImp) * 40));
      const date = (row.keys && row.keys[0]) || '';
      const shortDate = date.slice(5);
      body += `<div class="bar" style="height:${height}px" title="${escapeHtml(shortDate)}: ${imp}"></div>`;
    }
    body += `</div><div style="display:flex;justify-content:space-between;font-size:10px;color:#475569">`;
    if (gscDailyRows.length > 0) {
      body += `<span>${escapeHtml((gscDailyRows[0].keys && gscDailyRows[0].keys[0]) || '').slice(5)}</span>`;
      body += `<span>${escapeHtml((gscDailyRows[gscDailyRows.length - 1].keys && gscDailyRows[gscDailyRows.length - 1].keys[0]) || '').slice(5)}</span>`;
    }
    body += `</div></div>`;
  }

  // Top pages table
  if (gscPageRows.length > 0) {
    body += `<div style="margin-bottom:12px"><div style="color:#64748b;font-size:12px;margin-bottom:4px">Top Pages by Impressions</div>
<table><tr><th>Page</th><th>Impressions</th><th>Clicks</th><th>Position</th></tr>`;
    for (const row of gscPageRows) {
      const page = ((row.keys && row.keys[0]) || '').replace('https://selfhosting.sh', '');
      body += `<tr><td style="font-size:12px;max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(page)}</td><td>${row.impressions || 0}</td><td>${row.clicks || 0}</td><td>${(row.position || 0).toFixed(1)}</td></tr>`;
    }
    body += '</table></div>';
  }

  // Top queries table
  if (gscQueryRows.length > 0) {
    const displayQueries = gscQueryRows.slice(0, 10);
    body += `<div style="margin-bottom:12px"><div style="color:#64748b;font-size:12px;margin-bottom:4px">Top Queries by Impressions</div>
<table><tr><th>Query</th><th>Impressions</th><th>Clicks</th><th>CTR</th><th>Position</th></tr>`;
    for (const row of displayQueries) {
      const query = (row.keys && row.keys[0]) || '';
      const ctr = row.impressions > 0 ? ((row.clicks / row.impressions) * 100).toFixed(0) + '%' : '0%';
      body += `<tr><td>${escapeHtml(query)}</td><td>${row.impressions || 0}</td><td>${row.clicks || 0}</td><td>${ctr}</td><td>${(row.position || 0).toFixed(1)}</td></tr>`;
    }
    body += '</table></div>';
  }

  // Keywords by position bracket
  body += `<div style="margin-bottom:8px"><div style="color:#64748b;font-size:12px;margin-bottom:4px">Keywords by Position Bracket</div>
<div style="display:flex;gap:16px">
  <div>Page 1 (pos 1-10): <strong class="${metricColor(page1Keywords, 100)}">${page1Keywords}</strong></div>
  <div>Page 2 (11-20): <strong>${page2Keywords}</strong></div>
  <div>Page 3 (21-30): <strong>${page3Keywords}</strong></div>
</div></div>`;

  body += '</div>'; // Close Content & SEO card

  // GA4 section
  body += `<div class="card wide" style="margin-bottom:16px">
<h2>Site Performance — GA4 (7 days)</h2>`;

  if (ga4Data) {
    body += `<div style="display:flex;gap:24px;flex-wrap:wrap;margin-bottom:12px">
  <div><span style="color:#64748b">Users:</span> <strong>${ga4Users}</strong></div>
  <div><span style="color:#64748b">Sessions:</span> <strong>${ga4Sessions}</strong></div>
  <div><span style="color:#64748b">Page Views:</span> <strong>${ga4Views}</strong></div>
  <div><span style="color:#64748b">Bounce Rate:</span> <strong>${ga4BounceRate}</strong></div>
  <div><span style="color:#64748b">Avg Session:</span> <strong>${ga4AvgDuration}</strong></div>
</div>`;

    // GA4 daily sparkline
    if (ga4DailyRows.length > 0) {
      const maxViews = Math.max(...ga4DailyRows.map(r => parseInt((r.metricValues || [])[1]?.value || '0', 10)), 1);
      body += `<div style="margin-bottom:12px"><div style="color:#64748b;font-size:12px;margin-bottom:4px">Daily Page Views</div><div class="sparkline">`;
      for (const row of ga4DailyRows) {
        const views = parseInt((row.metricValues || [])[1]?.value || '0', 10);
        const height = Math.max(2, Math.round((views / maxViews) * 40));
        const date = (row.dimensionValues || [])[0]?.value || '';
        body += `<div class="bar" style="height:${height}px;background:#3b82f6" title="${escapeHtml(date)}: ${views} views"></div>`;
      }
      body += '</div></div>';
    }

    // Top pages
    if (ga4TopPages.length > 0) {
      body += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">';
      body += `<div><div style="color:#64748b;font-size:12px;margin-bottom:4px">Top Pages by Views</div>
<table><tr><th>Page</th><th>Views</th></tr>`;
      for (const p of ga4TopPages) {
        body += `<tr><td style="font-size:12px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(p.path)}</td><td>${p.views}</td></tr>`;
      }
      body += '</table></div>';

      // Sources
      if (ga4Sources.length > 0) {
        body += `<div><div style="color:#64748b;font-size:12px;margin-bottom:4px">Top Traffic Sources</div>
<table><tr><th>Source / Medium</th><th>Sessions</th></tr>`;
        for (const s of ga4Sources) {
          body += `<tr><td style="font-size:12px">${escapeHtml(s.source)} / ${escapeHtml(s.medium)}</td><td>${s.sessions}</td></tr>`;
        }
        body += '</table></div>';
      }
      body += '</div>';
    }
  } else {
    body += '<p style="color:#64748b">GA4 data unavailable. API may be unreachable or returning errors.</p>';
  }

  body += '</div>'; // Close GA4 card

  // Social Media section
  body += `<div class="card wide" style="margin-bottom:16px">
<h2>Social Media</h2>
<table><tr><th>Platform</th><th>Last Post</th><th>Followers</th><th>Status</th></tr>`;

  const socialPlatforms = [
    { name: 'X (Twitter)', key: 'x', followers: 'N/A' },
    { name: 'Bluesky', key: 'bluesky', followers: bskyFollowers !== null ? String(bskyFollowers) : '--' },
    { name: 'Mastodon', key: 'mastodon', followers: mastoFollowers !== null ? String(mastoFollowers) : '--' },
    { name: 'Reddit', key: 'reddit', followers: '--' },
    { name: 'Dev.to', key: 'devto', followers: '--' },
    { name: 'Hashnode', key: 'hashnode', followers: '--' },
  ];

  const lastPosted = (socialState && socialState.last_posted) || {};
  for (const p of socialPlatforms) {
    const lp = lastPosted[p.key];
    const lastTime = lp ? new Date(lp).toISOString().replace('T', ' ').slice(0, 16) + ' UTC' : '--';
    const status = lp ? 'active' : (p.key === 'reddit' || p.key === 'hashnode') ? 'blocked' : 'inactive';
    body += `<tr><td>${escapeHtml(p.name)}</td><td style="font-size:12px">${escapeHtml(lastTime)}</td><td>${escapeHtml(p.followers)}</td><td>${statusBadge(status)}</td></tr>`;
  }
  body += `</table>
<div class="metric" style="margin-top:8px"><span class="metric-label">Queue</span><span class="metric-value">${queueSize} items remaining</span></div>
</div>`;

  // Operational Health section
  body += `<div class="card wide" style="margin-bottom:16px">
<h2>Operational Health</h2>`;

  const coordState = getCoordinatorState();
  const mem = getMemory();
  const disk = getDisk();
  const load = getLoad();

  if (coordState && coordState.agents) {
    const deptOrder = ['ceo', 'operations', 'technology', 'marketing', 'bi-finance', 'investor-relations'];
    const sorted = Object.entries(coordState.agents).sort(([a], [b]) => {
      const ai = deptOrder.indexOf(a);
      const bi = deptOrder.indexOf(b);
      if (ai >= 0 && bi >= 0) return ai - bi;
      if (ai >= 0) return -1;
      if (bi >= 0) return 1;
      return a.localeCompare(b);
    });
    const runMap = (coordState.running) || {};

    body += '<table><tr><th>Agent</th><th>Runs (24h)</th><th>Errors</th><th>Last Run</th><th>Status</th></tr>';
    for (const [name, info] of sorted) {
      const paused = isAgentPaused(name);
      const hasErr = isActiveError(info, name);
      const isRunning = !!runMap[name];
      const status = isRunning ? 'running' : paused ? 'paused' : hasErr ? 'backoff' : 'idle';
      const lastRun = info.lastStarted ? new Date(info.lastStarted).toISOString().replace('T', ' ').slice(0, 16) + ' UTC' : '--';
      const errs = info.consecutiveErrors || 0;
      body += `<tr><td>${escapeHtml(name)}</td><td>--</td><td>${errs > 0 ? '<span class="crit">' + errs + '</span>' : '0'}</td><td style="font-size:12px">${escapeHtml(lastRun)}</td><td>${statusBadge(status)}</td></tr>`;
    }
    body += '</table>';
  }

  const memPct = mem.total > 0 ? Math.round((mem.used / mem.total) * 100) : 0;
  const diskPct = parseInt(disk.pct) || 0;
  body += `<div style="display:flex;gap:24px;flex-wrap:wrap;margin-top:12px">
  <div><span style="color:#64748b">System:</span> Mem ${memPct}% | Disk ${diskPct}% | Load ${escapeHtml(load)}</div>
</div>`;

  body += '</div>'; // Close Operational Health card

  return layoutHtml('Growth', '/growth', body);
}

// -- Server --

function unsubscribeHtml(message, isError = false) {
  const color = isError ? '#ef4444' : '#22c55e';
  const icon = isError ? '&#10007;' : '&#10003;';
  const title = isError ? 'Something went wrong' : 'Unsubscribed';
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} | selfhosting.sh</title><style>body{background:#0f1117;color:#e0e0e0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}.card{background:#1a1d27;border:1px solid #2a2d37;border-radius:12px;padding:48px;max-width:480px;text-align:center}.icon{font-size:48px;color:${color};margin-bottom:16px}h1{font-size:20px;margin:0 0 12px}p{color:#a0a0a0;margin:0 0 24px;line-height:1.6}a{color:#22c55e;text-decoration:none}a:hover{text-decoration:underline}</style></head><body><div class="card"><div class="icon">${icon}</div><h1>${title}</h1><p>${message}</p><a href="https://selfhosting.sh">Back to selfhosting.sh</a></div></body></html>`;
}

function handleRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // Public routes: login, logout
  if (pathname === '/login' && req.method === 'GET') {
    const error = url.searchParams.get('error');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(pageLogin(error));
    return;
  }

  if (pathname === '/login' && req.method === 'POST') {
    handleLogin(req, res);
    return;
  }

  if (pathname === '/logout') {
    destroySession(req);
    res.writeHead(302, {
      'Location': '/login',
      'Set-Cookie': clearSessionCookieHeader()
    });
    res.end();
    return;
  }

  // /api/status allows Bearer token auth (backward compat)
  if (pathname === '/api/status') {
    if (!checkSession(req) && !checkBearerAuth(req)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }
    const data = {
      timestamp: new Date().toISOString(),
      memory: getMemory(),
      disk: getDisk(),
      load: getLoad(),
      services: getServices(),
      articles: getArticleCounts(),
      agents: getCoordinatorState(),
      social: { queueSize: getSocialQueueSize(), state: getSocialState() }
    };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data, null, 2));
    return;
  }

  // -- Newsletter subscriber endpoints (public, CORS-enabled) --
  const SUBSCRIBERS_FILE = `${BASE}/data/subscribers.json`;
  const CORS = {
    'Access-Control-Allow-Origin': 'https://selfhosting.sh',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (pathname === '/api/newsletter/subscribe' && req.method === 'OPTIONS') {
    res.writeHead(204, CORS);
    res.end();
    return;
  }

  if (pathname === '/api/newsletter/subscribe' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        let email = '';
        const ct = req.headers['content-type'] || '';
        if (ct.includes('application/json')) {
          const parsed = JSON.parse(body);
          email = (parsed.email || '').trim().toLowerCase();
        } else {
          const params = new URLSearchParams(body);
          email = (params.get('email') || '').trim().toLowerCase();
        }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
          res.writeHead(400, { 'Content-Type': 'application/json', ...CORS });
          res.end(JSON.stringify({ error: 'Please enter a valid email address.' }));
          return;
        }
        // Load existing subscribers
        let subscribers = [];
        try { subscribers = JSON.parse(fs.readFileSync(SUBSCRIBERS_FILE, 'utf8')); } catch {}
        // Check for duplicate
        const existing = subscribers.find(s => s.email === email);
        if (existing) {
          if (existing.unsubscribed) {
            existing.unsubscribed = false;
            existing.resubscribed_at = new Date().toISOString();
          }
          // Already subscribed — return success (idempotent)
        } else {
          subscribers.push({ email, subscribed_at: new Date().toISOString(), unsubscribed: false });
        }
        // Ensure data directory exists
        const dataDir = path.dirname(SUBSCRIBERS_FILE);
        if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
        fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(subscribers, null, 2));
        // Return success
        const accept = req.headers['accept'] || '';
        if (accept.includes('application/json')) {
          res.writeHead(200, { 'Content-Type': 'application/json', ...CORS });
          res.end(JSON.stringify({ success: true, message: "Subscribed! Check your inbox." }));
        } else {
          res.writeHead(303, { 'Location': 'https://selfhosting.sh/subscribed/', ...CORS });
          res.end();
        }
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json', ...CORS });
        res.end(JSON.stringify({ error: 'Something went wrong. Please try again.' }));
      }
    });
    return;
  }

  if (pathname === '/api/newsletter/unsubscribe' && req.method === 'GET') {
    const email = (url.searchParams.get('email') || '').trim().toLowerCase();
    if (!email) {
      res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(unsubscribeHtml('No email address provided. Please use the unsubscribe link from your email.', true));
      return;
    }
    try {
      let subscribers = [];
      try { subscribers = JSON.parse(fs.readFileSync(SUBSCRIBERS_FILE, 'utf8')); } catch {}
      const sub = subscribers.find(s => s.email === email);
      if (sub) {
        sub.unsubscribed = true;
        sub.unsubscribed_at = new Date().toISOString();
        fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(subscribers, null, 2));
      }
      // Always show success (don't leak whether email exists)
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(unsubscribeHtml("You've been unsubscribed from the selfhosting.sh newsletter. You won't receive any more emails from us."));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(unsubscribeHtml("We couldn't process your request. Please email admin@selfhosting.sh for help.", true));
    }
    return;
  }

  // All other routes require session auth
  if (!checkSession(req)) {
    res.writeHead(302, { 'Location': '/login' });
    res.end();
    return;
  }

  // Route
  try {
    if (pathname === '/' || pathname === '/index.html') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(pageDashboard());
    } else if (pathname === '/board') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(pageBoard());
    } else if (pathname === '/inbox') {
      const msg = url.searchParams.get('msg');
      const err = url.searchParams.get('err');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(pageInbox(msg, err));
    } else if (pathname === '/agents') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(pageAgents());
    } else if (pathname === '/content') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(pageContent());
    } else if (pathname === '/system') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(pageSystem());
    } else if (pathname === '/alerts') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(pageAlerts());
    } else if (pathname === '/commits') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(pageCommits());
    } else if (pathname === '/instructions') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(pageInstructions());
    } else if (pathname === '/growth') {
      pageGrowth().then(html => {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
      }).catch(err => {
        console.error('Growth page error:', err.message);
        res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(layoutHtml('Error', '', '<h2>Error loading growth metrics</h2><p>' + escapeHtml(err.message) + '</p>'));
      });
      return;
    } else if (pathname === '/api/claude-md' && req.method === 'GET') {
      const agentKey = url.searchParams.get('agent');
      const agent = AGENT_CLAUDE_MDS.find(a => a.key === agentKey);
      if (!agent) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Unknown agent' }));
        return;
      }
      try {
        const content = fs.readFileSync(agent.path, 'utf8');
        const redacted = redactCredentials(content);
        const html = renderMarkdown(content);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, name: agent.name, content: redacted, html, editable: agent.editable }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Failed to read file: ' + err.message }));
      }
      return;
    } else if (pathname === '/api/claude-md' && req.method === 'POST') {
      const agentKey = url.searchParams.get('agent');
      if (agentKey !== 'ceo') {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Read-only' }));
        return;
      }
      let body = '';
      req.on('data', chunk => {
        body += chunk;
        if (body.length > 500000) req.destroy();
      });
      req.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          const content = parsed.content;
          if (!content || typeof content !== 'string') {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: 'Content must be a non-empty string' }));
            return;
          }
          if (content.length > 500000) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: 'Content too large (max 500KB)' }));
            return;
          }
          if (!content.startsWith('#')) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: 'Content must start with # (Markdown heading)' }));
            return;
          }
          const ceoAgent = AGENT_CLAUDE_MDS.find(a => a.key === 'ceo');
          fs.writeFileSync(ceoAgent.path, content);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, message: 'Saved' }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: 'Invalid JSON: ' + err.message }));
        }
      });
      return;
    } else if (pathname === '/claudemd') {
      // Extra password gate for CLAUDE.md section
      if (!checkClaudemdSession(req)) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(pageClaudemdAuth(false));
        return;
      }
      const fileKey = url.searchParams.get('file') || 'ceo';
      const msg = url.searchParams.get('msg');
      const err = url.searchParams.get('err');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(pageClaudemdViewer(fileKey, msg, err));
    } else if (pathname === '/claudemd/auth' && req.method === 'POST') {
      handleClaudemdAuth(req, res);
    } else if (pathname === '/claudemd/save' && req.method === 'POST') {
      if (!checkClaudemdSession(req)) {
        res.writeHead(302, { 'Location': '/claudemd' });
        res.end();
        return;
      }
      handleClaudemdSave(req, res);
    } else if (pathname === '/api/submit-message' && req.method === 'POST') {
      handleSubmitMessage(req, res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(layoutHtml('Not Found', '', '<h2>404 — Page not found</h2>'));
    }
  } catch (err) {
    console.error('Error handling request:', err.message);
    res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(layoutHtml('Error', '', '<h2>500 — Internal Server Error</h2>'));
  }
}

function handleLogin(req, res) {
  let body = '';
  req.on('data', chunk => {
    body += chunk;
    if (body.length > 10000) req.destroy();
  });
  req.on('end', () => {
    const ip = getClientIp(req);

    // Brute force protection
    if (!checkLoginRateLimit(ip)) {
      res.writeHead(429, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(pageRateLimited());
      return;
    }

    const params = new URLSearchParams(body);
    const password = (params.get('password') || '').trim();

    if (password === PORTAL_PASSWORD) {
      const sessionToken = createSession(ip);
      res.writeHead(302, {
        'Location': '/',
        'Set-Cookie': sessionCookieHeader(sessionToken)
      });
      res.end();
    } else {
      recordLoginFailure(ip);
      res.writeHead(302, { 'Location': '/login?error=1' });
      res.end();
    }
  });
}

function handleSubmitMessage(req, res) {
  let body = '';
  req.on('data', chunk => {
    body += chunk;
    if (body.length > 10000) {
      req.destroy();
    }
  });
  req.on('end', () => {
    const ip = getClientIp(req);

    if (!checkRateLimit(ip)) {
      if (req.headers['content-type']?.includes('application/json')) {
        res.writeHead(429, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Rate limit exceeded. Max 10 messages per hour.' }));
      } else {
        res.writeHead(302, { 'Location': '/inbox?err=' + encodeURIComponent('Rate limit exceeded. Max 10 messages per hour.') });
        res.end();
      }
      return;
    }

    let subject, message;
    const contentType = req.headers['content-type'] || '';

    if (contentType.includes('application/json')) {
      try {
        const parsed = JSON.parse(body);
        subject = parsed.subject;
        message = parsed.message;
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Invalid JSON' }));
        return;
      }
    } else {
      const params = new URLSearchParams(body);
      subject = params.get('subject');
      message = params.get('message');
    }

    if (!subject || !message) {
      const err = 'Subject and message are required.';
      if (contentType.includes('application/json')) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err }));
      } else {
        res.writeHead(302, { 'Location': '/inbox?err=' + encodeURIComponent(err) });
        res.end();
      }
      return;
    }

    subject = sanitizeInput(subject.slice(0, MAX_SUBJECT_LEN));
    message = sanitizeInput(message.slice(0, MAX_MESSAGE_LEN));

    if (!subject || !message) {
      const err = 'Message contains prohibited content.';
      if (contentType.includes('application/json')) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err }));
      } else {
        res.writeHead(302, { 'Location': '/inbox?err=' + encodeURIComponent(err) });
        res.end();
      }
      return;
    }

    if (message.split('\n').length > MAX_MESSAGE_LINES) {
      const err = `Message exceeds ${MAX_MESSAGE_LINES} line limit.`;
      if (contentType.includes('application/json')) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err }));
      } else {
        res.writeHead(302, { 'Location': '/inbox?err=' + encodeURIComponent(err) });
        res.end();
      }
      return;
    }

    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
    const entry = `\n---\n## ${timestamp} — From: Founder (via portal) | Type: directive\n**Status:** open\n\n**Subject:** ${subject}\n\n${message}\n---\n`;

    try {
      fs.appendFileSync(`${BASE}/inbox/ceo.md`, entry);
    } catch (err) {
      console.error('Failed to write to CEO inbox:', err.message);
      if (contentType.includes('application/json')) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Failed to deliver message' }));
      } else {
        res.writeHead(302, { 'Location': '/inbox?err=' + encodeURIComponent('Failed to deliver message') });
        res.end();
      }
      return;
    }

    if (contentType.includes('application/json')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, message: 'Message delivered to CEO inbox' }));
    } else {
      res.writeHead(302, { 'Location': '/inbox?msg=' + encodeURIComponent('Message delivered to CEO inbox') });
      res.end();
    }
  });
}

function handleClaudemdAuth(req, res) {
  let body = '';
  req.on('data', chunk => {
    body += chunk;
    if (body.length > 10000) req.destroy();
  });
  req.on('end', () => {
    const ip = getClientIp(req);
    if (!checkLoginRateLimit(ip)) {
      res.writeHead(429, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(pageRateLimited());
      return;
    }
    const params = new URLSearchParams(body);
    const password = (params.get('password') || '').trim();
    if (password === CLAUDEMD_PASSWORD) {
      const sessionToken = createClaudemdSession(ip);
      res.writeHead(302, {
        'Location': '/claudemd',
        'Set-Cookie': claudemdSessionCookieHeader(sessionToken)
      });
      res.end();
    } else {
      recordLoginFailure(ip);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(pageClaudemdAuth(true));
    }
  });
}

function handleClaudemdSave(req, res) {
  let body = '';
  req.on('data', chunk => {
    body += chunk;
    if (body.length > 500000) req.destroy(); // CLAUDE.md files can be large
  });
  req.on('end', () => {
    const params = new URLSearchParams(body);
    const key = params.get('key');
    const content = params.get('content');

    // Only CEO CLAUDE.md is editable
    if (key !== 'ceo') {
      res.writeHead(302, { 'Location': '/claudemd?file=' + encodeURIComponent(key) + '&err=' + encodeURIComponent('This file is read-only') });
      res.end();
      return;
    }

    if (!content) {
      res.writeHead(302, { 'Location': '/claudemd?file=ceo&err=' + encodeURIComponent('Content cannot be empty') });
      res.end();
      return;
    }

    try {
      fs.writeFileSync(`${BASE}/CLAUDE.md`, content);
      res.writeHead(302, { 'Location': '/claudemd?file=ceo&msg=' + encodeURIComponent('CLAUDE.md saved successfully') });
      res.end();
    } catch (err) {
      console.error('Failed to save CLAUDE.md:', err.message);
      res.writeHead(302, { 'Location': '/claudemd?file=ceo&err=' + encodeURIComponent('Failed to save: ' + err.message) });
      res.end();
    }
  });
}

// Start servers on both ports
const server = http.createServer(handleRequest);
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Board Portal running at http://0.0.0.0:${PORT}`);
});

// Also listen on port 80 for Cloudflare proxy (Flexible SSL mode)
const serverHttp = http.createServer(handleRequest);
serverHttp.listen(PORT_HTTP, '0.0.0.0', () => {
  console.log(`Board Portal (HTTP) running at http://0.0.0.0:${PORT_HTTP}`);
}).on('error', (err) => {
  console.warn(`Could not listen on port ${PORT_HTTP}: ${err.message}.`);
});

// Also listen on port 443 for Cloudflare proxy (Full/Full Strict SSL mode)
const SSL_KEY = `${BASE}/credentials/ssl/portal-key.pem`;
const SSL_CERT = `${BASE}/credentials/ssl/portal-cert.pem`;
try {
  const sslOpts = {
    key: fs.readFileSync(SSL_KEY),
    cert: fs.readFileSync(SSL_CERT)
  };
  const serverHttps = https.createServer(sslOpts, handleRequest);
  serverHttps.listen(PORT_HTTPS, '0.0.0.0', () => {
    console.log(`Board Portal (HTTPS) running at https://0.0.0.0:${PORT_HTTPS}`);
  }).on('error', (err) => {
    console.warn(`Could not listen on port ${PORT_HTTPS}: ${err.message}.`);
  });
} catch (err) {
  console.warn(`SSL certs not found. HTTPS listener disabled.`);
}
