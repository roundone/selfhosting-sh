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
const SESSION_COOKIE = 'portal_session';
const SESSION_MAX_AGE = 86400; // 24 hours
const MAX_SUBJECT_LEN = 200;
const MAX_MESSAGE_LEN = 5000;
const MAX_MESSAGE_LINES = 200;
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW = 3600000; // 1 hour
const LOGIN_RATE_LIMIT_MAX = 5;
const LOGIN_RATE_LIMIT_WINDOW = 900000; // 15 minutes

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
  let out = text.replace(/(export\s+)?([A-Z_]{2,})\s*=\s*(\S+)/g, (match, exp, key, val) => {
    if (/key|token|secret|password|bearer/i.test(key)) {
      return `${exp || ''}${key}=[REDACTED]`;
    }
    return match;
  });
  out = out.replace(/(Bearer\s+)[A-Za-z0-9_\-]{20,}/gi, '$1[REDACTED]');
  return out;
}

function renderMarkdown(md) {
  return marked(md, { breaks: true, gfm: true });
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
    const files = fs.readdirSync(`${BASE}/board`).sort().reverse();
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
    ['/agents', 'Agents'], ['/content', 'Content & SEO'], ['/system', 'System'],
    ['/alerts', `Alerts ${alertBadge}`], ['/commits', 'Commits']
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
  const errorHtml = error ? '<p class="login-error">Invalid username or password</p>' : '';
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
    <label for="username">Username</label>
    <input type="text" id="username" name="username" placeholder="admin" autocomplete="username" required>
    <label for="password">Password</label>
    <input type="password" id="password" name="password" placeholder="Password" autocomplete="current-password" required>
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
  if (coordState && coordState.agents) {
    for (const [name, info] of Object.entries(coordState.agents)) {
      if (info.running) agentRunning++;
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
      body += `<details class="accordion report-item" data-text="${escapeHtml(r.content.toLowerCase())}"${openAttr}>
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
  if (coordState && coordState.agents) {
    for (const [name, info] of Object.entries(coordState.agents)) {
      if (info.running) running++;
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
      const status = info.running ? 'running' : paused ? 'paused' : hasActiveError ? 'backoff' : 'idle';
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

      body += `<tr>
<td>${escapeHtml(name)}</td>
<td>${statusBadge(status)}${errorDetail}</td>
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
  if (coordState && coordState.agents) {
    for (const [name, info] of Object.entries(coordState.agents)) {
      if (isActiveError(info, name)) {
        const errorTimestamp = info.lastErrorAt || info.lastRun;
        const errorAge = errorTimestamp ? Date.now() - new Date(errorTimestamp).getTime() : 0;
        agentErrors.push({ name, errors: info.consecutiveErrors, running: info.running, errorAge });
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

// -- Server --

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
    const username = (params.get('username') || '').trim();
    const password = (params.get('password') || '').trim();

    if (username === 'admin' && password === PORTAL_PASSWORD) {
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
