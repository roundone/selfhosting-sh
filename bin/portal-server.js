#!/usr/bin/env node
/**
 * selfhosting.sh Board Portal
 * Founder-facing dashboard with auth, Markdown rendering, inbox messaging
 */

const http = require('http');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { marked } = require('marked');

const PORT = 8080;
const BASE = '/opt/selfhosting-sh';
const TOKEN_PATH = `${BASE}/credentials/portal-token`;
const COOKIE_NAME = 'portal_token';
const COOKIE_MAX_AGE = 604800; // 7 days
const MAX_SUBJECT_LEN = 200;
const MAX_MESSAGE_LEN = 5000;
const MAX_MESSAGE_LINES = 200;
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW = 3600000; // 1 hour

// Rate limiting state
const rateLimitMap = new Map();
setInterval(() => {
  const cutoff = Date.now() - RATE_LIMIT_WINDOW;
  for (const [ip, times] of rateLimitMap) {
    const filtered = times.filter(t => t > cutoff);
    if (filtered.length === 0) rateLimitMap.delete(ip);
    else rateLimitMap.set(ip, filtered);
  }
}, 300000); // Clean every 5 min

// Load auth token
let AUTH_TOKEN = '';
try {
  AUTH_TOKEN = fs.readFileSync(TOKEN_PATH, 'utf8').trim();
} catch (e) {
  console.error('FATAL: Cannot read portal token from', TOKEN_PATH);
  process.exit(1);
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
  // Belt-and-suspenders XSS check
  const dangerous = /<script/i.test(s) || /<iframe/i.test(s) ||
    /javascript:/i.test(s) || /onerror\s*=/i.test(s) || /onload\s*=/i.test(s);
  if (dangerous) return null;
  return s;
}

function redactCredentials(text) {
  // Redact env var assignments
  let out = text.replace(/(export\s+)?([A-Z_]{2,})\s*=\s*(\S+)/g, (match, exp, key, val) => {
    if (/key|token|secret|password|bearer/i.test(key)) {
      return `${exp || ''}${key}=[REDACTED]`;
    }
    return match;
  });
  // Redact bearer tokens
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

function checkAuth(req) {
  // 1. Query param
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.searchParams.get('token') === AUTH_TOKEN) return 'query';
  // 2. Authorization header
  const authHeader = req.headers.authorization || '';
  if (authHeader === `Bearer ${AUTH_TOKEN}`) return 'header';
  // 3. Cookie
  const cookies = parseCookies(req);
  if (cookies[COOKIE_NAME] === AUTH_TOKEN) return 'cookie';
  return null;
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
  const reports = getBoardReports();
  return reports.length > 0 ? reports[0] : null;
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

function getAlertCount() {
  let count = 0;
  // Agent errors
  const state = getCoordinatorState();
  if (state && state.agents) {
    for (const info of Object.values(state.agents)) {
      if (info.consecutiveErrors > 0) count++;
    }
  }
  // Human action items from latest board report
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
  const colors = { active: '#22c55e', running: '#22c55e', queued: '#f59e0b', backoff: '#ef4444', idle: '#6b7280', inactive: '#ef4444' };
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
body { background: #0f1117; color: #e2e8f0; font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 13px; line-height: 1.6; }
.header { background: #1a1d27; border-bottom: 1px solid #2d3148; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; }
.header h1 { color: #22c55e; font-size: 16px; }
.header .time { color: #64748b; font-size: 11px; }
nav { background: #151822; border-bottom: 1px solid #2d3148; padding: 0 20px; display: flex; gap: 0; overflow-x: auto; }
nav a { color: #94a3b8; padding: 10px 16px; text-decoration: none; font-size: 12px; white-space: nowrap; border-bottom: 2px solid transparent; }
nav a:hover { color: #e2e8f0; background: #1a1d27; }
nav a.active { color: #22c55e; border-bottom-color: #22c55e; }
.content { padding: 20px; max-width: 1400px; margin: 0 auto; }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 16px; margin-bottom: 16px; }
.card { background: #1a1d27; border: 1px solid #2d3148; border-radius: 8px; padding: 16px; overflow: hidden; }
.card h2 { color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; border-bottom: 1px solid #2d3148; padding-bottom: 8px; }
.card.wide { grid-column: 1 / -1; }
.metric { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; }
.metric-label { color: #94a3b8; }
.metric-value { color: #e2e8f0; font-weight: 600; }
.metric-value.big { font-size: 22px; color: #22c55e; }
.bar { height: 8px; background: #2d3148; border-radius: 4px; overflow: hidden; margin: 4px 0; }
.bar-fill { height: 100%; border-radius: 4px; }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 6px 8px; text-align: left; border-bottom: 1px solid #2d3148; font-size: 12px; }
th { color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
pre { background: #0d0f14; border: 1px solid #2d3148; border-radius: 4px; padding: 12px; overflow-x: auto; font-size: 11px; line-height: 1.4; max-height: 500px; overflow-y: auto; white-space: pre-wrap; word-break: break-word; }
.badge { display: inline-block; padding: 2px 8px; border-radius: 4px; color: #000; font-weight: 600; font-size: 11px; }
.alert-badge { display: inline-block; background: #ef4444; color: #fff; font-size: 10px; padding: 1px 6px; border-radius: 10px; margin-left: 4px; }
.ok { color: #22c55e; }
.warn { color: #f59e0b; }
.crit { color: #ef4444; }
a { color: #22c55e; text-decoration: none; }
a:hover { text-decoration: underline; }
.md-content { line-height: 1.7; }
.md-content h1 { font-size: 20px; color: #22c55e; margin: 16px 0 8px; }
.md-content h2 { font-size: 16px; color: #e2e8f0; margin: 14px 0 6px; border-bottom: 1px solid #2d3148; padding-bottom: 4px; }
.md-content h3 { font-size: 14px; color: #94a3b8; margin: 10px 0 4px; }
.md-content p { margin: 6px 0; }
.md-content ul, .md-content ol { margin: 6px 0 6px 20px; }
.md-content table { margin: 8px 0; }
.md-content code { background: #0d0f14; padding: 2px 5px; border-radius: 3px; font-size: 12px; }
.md-content pre code { background: none; padding: 0; }
.md-content blockquote { border-left: 3px solid #22c55e; padding-left: 12px; color: #94a3b8; margin: 8px 0; }
.md-content hr { border: none; border-top: 1px solid #2d3148; margin: 12px 0; }
.accordion { border: 1px solid #2d3148; border-radius: 6px; margin: 8px 0; overflow: hidden; }
.accordion summary { background: #1a1d27; padding: 10px 14px; cursor: pointer; color: #e2e8f0; font-size: 13px; }
.accordion summary:hover { background: #222638; }
.accordion .acc-body { padding: 14px; }
.msg-form { display: flex; flex-direction: column; gap: 10px; }
.msg-form input, .msg-form textarea { background: #0d0f14; border: 1px solid #2d3148; color: #e2e8f0; padding: 8px 12px; border-radius: 4px; font-family: inherit; font-size: 13px; }
.msg-form textarea { min-height: 120px; resize: vertical; }
.msg-form button { background: #22c55e; color: #000; border: none; padding: 10px 20px; border-radius: 4px; font-weight: 700; cursor: pointer; font-family: inherit; font-size: 13px; align-self: flex-start; }
.msg-form button:hover { background: #16a34a; }
.msg-form .char-count { color: #64748b; font-size: 11px; text-align: right; }
.success-msg { background: #14532d; border: 1px solid #22c55e; color: #22c55e; padding: 10px 14px; border-radius: 4px; margin-bottom: 12px; }
.error-msg { background: #450a0a; border: 1px solid #ef4444; color: #ef4444; padding: 10px 14px; border-radius: 4px; margin-bottom: 12px; }
.filter-bar { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
.filter-btn { background: #1a1d27; border: 1px solid #2d3148; color: #94a3b8; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-family: inherit; font-size: 11px; }
.filter-btn.active, .filter-btn:hover { color: #22c55e; border-color: #22c55e; }
.search-box { background: #0d0f14; border: 1px solid #2d3148; color: #e2e8f0; padding: 6px 12px; border-radius: 4px; font-family: inherit; font-size: 12px; width: 100%; max-width: 400px; margin-bottom: 12px; }
.alert-item { background: #1a1d27; border: 1px solid #2d3148; border-left: 3px solid #ef4444; border-radius: 4px; padding: 12px 14px; margin: 8px 0; }
.alert-item.warning { border-left-color: #f59e0b; }
.alert-item h3 { font-size: 13px; color: #e2e8f0; margin-bottom: 4px; }
.alert-item .meta { color: #64748b; font-size: 11px; }
.progress-bar { background: #2d3148; border-radius: 4px; height: 20px; overflow: hidden; position: relative; }
.progress-fill { height: 100%; border-radius: 4px; background: #22c55e; }
.progress-label { position: absolute; top: 0; left: 0; right: 0; text-align: center; line-height: 20px; font-size: 11px; font-weight: 600; color: #fff; }
@media (max-width: 768px) {
  .grid { grid-template-columns: 1fr; }
  nav { flex-wrap: wrap; }
  nav a { padding: 8px 12px; }
}
</style>
</head>
<body>
<div class="header">
  <h1>$ selfhosting.sh board portal</h1>
  <span class="time">Last refresh: ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC</span>
</div>
${navHtml(currentPath)}
<div class="content">
${bodyHtml}
</div>
</body>
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

  const memPct = mem.total > 0 ? Math.round((mem.used / mem.total) * 100) : 0;
  const memColor = memPct > 90 ? '#ef4444' : memPct > 75 ? '#f59e0b' : '#22c55e';
  const diskPct = parseInt(disk.pct) || 0;
  const diskColor = diskPct > 80 ? '#ef4444' : diskPct > 60 ? '#f59e0b' : '#22c55e';

  // Scorecard
  const target = 1500;
  const artPct = Math.min(100, Math.round((articles.total / target) * 100));

  // Agent summary
  let agentRunning = 0, agentQueued = 0, agentErrors = 0;
  if (coordState && coordState.agents) {
    for (const info of Object.values(coordState.agents)) {
      if (info.running) agentRunning++;
      else agentQueued++;
      if (info.consecutiveErrors > 0) agentErrors++;
    }
  }

  // Extract health summary from latest board report
  let healthSummary = '';
  if (latest) {
    const match = latest.content.match(/## Business Health.*?\n([\s\S]*?)(?=\n## )/);
    if (match) healthSummary = match[1].trim().slice(0, 300);
  }

  // Social last posted
  let socialInfo = '';
  if (socialState.platforms) {
    for (const [platform, data] of Object.entries(socialState.platforms)) {
      if (data.lastPosted) {
        socialInfo += `<div class="metric"><span class="metric-label">${escapeHtml(platform)}</span><span class="metric-value" style="font-size:11px">${escapeHtml(new Date(data.lastPosted).toISOString().replace('T', ' ').slice(0, 19))}</span></div>`;
      }
    }
  }

  let body = `<div class="grid">
<div class="card">
  <h2>Business Health</h2>
  ${healthSummary ? `<div class="md-content" style="font-size:12px">${renderMarkdown(healthSummary)}</div>` : '<p style="color:#64748b">No board report available yet</p>'}
  ${alertCount > 0 ? `<div style="margin-top:10px"><span class="badge" style="background:#ef4444;color:#fff">${alertCount} alert${alertCount > 1 ? 's' : ''} need attention</span> <a href="/alerts" style="font-size:11px">View &rarr;</a></div>` : '<div style="margin-top:10px"><span class="badge" style="background:#22c55e">All clear</span></div>'}
</div>

<div class="card">
  <h2>Scorecard</h2>
  <div class="metric"><span class="metric-label">Articles</span><span class="metric-value">${articles.total} / ${target}</span></div>
  <div class="progress-bar"><div class="progress-fill" style="width:${artPct}%"></div><span class="progress-label">${artPct}%</span></div>
  <div class="metric" style="margin-top:8px"><span class="metric-label">Page 1 Keywords</span><span class="metric-value">2 / 100</span></div>
  <div class="metric"><span class="metric-label">Monthly Visits</span><span class="metric-value">~0 / 5,000</span></div>
  <div class="metric"><span class="metric-label">Revenue</span><span class="metric-value">$0</span></div>
</div>

<div class="card">
  <h2>Agent Summary</h2>
  <div class="metric"><span class="metric-label">Running</span><span class="metric-value ok">${agentRunning}</span></div>
  <div class="metric"><span class="metric-label">Queued / Idle</span><span class="metric-value">${agentQueued}</span></div>
  <div class="metric"><span class="metric-label">With Errors</span><span class="metric-value ${agentErrors > 0 ? 'crit' : ''}">${agentErrors}</span></div>
  <a href="/agents" style="font-size:11px;margin-top:8px;display:block">View agents &rarr;</a>
</div>

<div class="card">
  <h2>System Status</h2>
  <div class="metric"><span class="metric-label">Memory</span><span class="metric-value" style="color:${memColor}">${mem.used}MB / ${mem.total}MB</span></div>
  ${barHtml(memPct, memColor)}
  <div class="metric"><span class="metric-label">Disk</span><span class="metric-value" style="color:${diskColor}">${escapeHtml(disk.used)} / ${escapeHtml(disk.size)}</span></div>
  ${barHtml(diskPct, diskColor)}
  <a href="/system" style="font-size:11px;margin-top:8px;display:block">View details &rarr;</a>
</div>

<div class="card">
  <h2>Social Media</h2>
  <div class="metric"><span class="metric-label">Queue</span><span class="metric-value">${queueSize} items</span></div>
  ${socialInfo || '<div style="color:#64748b;font-size:11px">No platform data available</div>'}
</div>

<div class="card">
  <h2>Latest Board Report</h2>
  ${latest ? `<div class="metric"><span class="metric-label">Date</span><span class="metric-value">${escapeHtml(latest.name)}</span></div><div style="color:#94a3b8;font-size:11px;margin-top:6px">${escapeHtml(latest.content.slice(0, 200))}...</div><a href="/board" style="font-size:11px;margin-top:8px;display:block">Read full report &rarr;</a>` : '<p style="color:#64748b">No board reports yet</p>'}
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

  // Summary
  let running = 0, queued = 0, errors = 0, backoff = 0;
  if (coordState && coordState.agents) {
    for (const info of Object.values(coordState.agents)) {
      if (info.running) running++;
      else queued++;
      if (info.consecutiveErrors > 0) { errors++; backoff++; }
    }
  }
  body += `<div style="margin-bottom:12px">
<span class="badge" style="background:#22c55e">${running} running</span>
<span class="badge" style="background:#f59e0b;margin-left:4px">${queued} queued</span>
${backoff > 0 ? `<span class="badge" style="background:#ef4444;margin-left:4px">${backoff} in backoff</span>` : ''}
${errors > 0 ? `<span class="badge" style="background:#ef4444;color:#fff;margin-left:4px">${errors} with errors</span>` : ''}
</div>`;

  if (coordState && coordState.agents) {
    // Sort: dept heads first, then writers
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
      const status = info.running ? 'running' : info.consecutiveErrors > 0 ? 'backoff' : 'idle';
      const lastStart = info.lastStarted ? new Date(info.lastStarted).toISOString().replace('T', ' ').slice(0, 19) : '-';
      const lastExit = info.lastExited ? new Date(info.lastExited).toISOString().replace('T', ' ').slice(0, 19) : '-';
      const errs = info.consecutiveErrors || 0;

      // Try to read agent log
      const logName = name.replace(/^ops-/, '');
      let logPath = `${BASE}/logs/${name}.md`;
      if (!fs.existsSync(logPath)) logPath = `${BASE}/logs/${logName}.md`;
      const logContent = fs.existsSync(logPath) ? readFileTail(logPath, 30) : '';

      body += `<tr>
<td>${escapeHtml(name)}</td>
<td>${statusBadge(status)}</td>
<td style="font-size:11px">${escapeHtml(lastStart)}</td>
<td style="font-size:11px">${escapeHtml(lastExit)}</td>
<td>${errs > 0 ? `<span class="crit">${errs}</span>` : '0'}</td>
<td>${logContent ? `<details><summary style="cursor:pointer;font-size:11px;color:#22c55e">view</summary><pre style="margin-top:6px;font-size:10px">${escapeHtml(redactCredentials(logContent))}</pre></details>` : '<span style="color:#64748b;font-size:11px">-</span>'}</td>
</tr>`;
    }
    body += '</table>';
  } else {
    body += '<p style="color:#64748b">No coordinator state available</p>';
  }

  // Coordinator log
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

  // Article counts
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

  // Category completion from state.md
  const stateContent = readFileSafe(`${BASE}/state.md`);
  const catMatch = stateContent.match(/## Category Completion Status[\s\S]*?\n\n/);
  if (catMatch) {
    body += `<div class="card wide" style="margin-top:16px">
<h2>Category Completion</h2>
<div class="md-content">${renderMarkdown(catMatch[0])}</div>
</div>`;
  }

  // Social posting
  body += `<div class="card wide" style="margin-top:16px">
<h2>Social Posting</h2>
<div class="metric"><span class="metric-label">Queue Size</span><span class="metric-value">${queueSize}</span></div>`;
  if (socialState.platforms) {
    body += '<table><tr><th>Platform</th><th>Status</th><th>Last Posted</th></tr>';
    for (const [platform, data] of Object.entries(socialState.platforms)) {
      const lastPosted = data.lastPosted ? new Date(data.lastPosted).toISOString().replace('T', ' ').slice(0, 19) + ' UTC' : '-';
      const status = data.lastPosted ? 'active' : 'blocked';
      body += `<tr><td>${escapeHtml(platform)}</td><td>${statusBadge(status)}</td><td style="font-size:11px">${escapeHtml(lastPosted)}</td></tr>`;
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

  // Coordinator config
  if (config) {
    body += `<div class="card wide" style="margin-top:16px">
<h2>Coordinator Config</h2>
<table>
  ${Object.entries(config).map(([k,v]) => `<tr><td>${escapeHtml(k)}</td><td>${escapeHtml(typeof v === 'object' ? JSON.stringify(v) : String(v))}</td></tr>`).join('')}
</table>
</div>`;
  }

  // Rate limit proxy
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

  // Human action items
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

  // CEO inbox human items
  const ceoInbox = getCeoInbox();
  const inboxHumanMatches = ceoInbox.match(/Requires:\s*human/gi);
  const inboxHumanCount = inboxHumanMatches ? inboxHumanMatches.length : 0;

  // Agent errors
  let agentErrors = [];
  if (coordState && coordState.agents) {
    for (const [name, info] of Object.entries(coordState.agents)) {
      if (info.consecutiveErrors > 0) {
        agentErrors.push({ name, errors: info.consecutiveErrors, running: info.running });
      }
    }
  }

  const totalAlerts = humanItems.length + agentErrors.length;

  if (totalAlerts === 0) {
    body += '<div style="text-align:center;padding:40px;color:#64748b"><p style="font-size:16px">No active alerts</p><p style="margin-top:8px">All systems operating normally</p></div>';
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
    body += `<div class="alert-item warning"><h3>CEO Inbox</h3><div class="meta">${inboxHumanCount} item(s) tagged "Requires: human" in CEO inbox</div><a href="/inbox" style="font-size:11px">View inbox &rarr;</a></div>`;
  }

  if (agentErrors.length > 0) {
    body += '<h3 style="color:#f59e0b;margin:16px 0 8px">Agent Errors</h3>';
    for (const ae of agentErrors) {
      body += `<div class="alert-item warning"><h3>${escapeHtml(ae.name)}</h3><div class="meta">${ae.errors} consecutive error(s) — ${ae.running ? 'currently running' : 'in backoff'}</div></div>`;
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
  <span><code style="color:#22c55e;font-size:11px">${escapeHtml(c.short)}</code> <span style="margin-left:8px">${escapeHtml(c.subject)}</span></span>
  <span style="color:#64748b;font-size:11px;white-space:nowrap;margin-left:12px">${escapeHtml(c.date)}</span>
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

function pageUnauth() {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Access Denied</title>
<style>body{background:#0f1117;color:#e2e8f0;font-family:monospace;display:flex;justify-content:center;align-items:center;height:100vh;text-align:center}h1{color:#ef4444;font-size:18px}p{color:#64748b;margin-top:8px;font-size:13px}</style>
</head>
<body><div><h1>401 — Access Denied</h1><p>Valid token required. Use ?token=... or Authorization header.</p></div></body>
</html>`;
}

// -- Server --

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // Auth check (except for the 401 page itself)
  const authMethod = checkAuth(req);
  if (!authMethod) {
    res.writeHead(401, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(pageUnauth());
    return;
  }

  // If authed via query param, set cookie and redirect to clean URL
  if (authMethod === 'query') {
    const cleanUrl = pathname + (url.search ? url.search.replace(/[?&]token=[^&]*/, '').replace(/^&/, '?').replace(/^\?$/, '') : '');
    res.writeHead(302, {
      'Location': cleanUrl || '/',
      'Set-Cookie': `${COOKIE_NAME}=${AUTH_TOKEN}; HttpOnly; SameSite=Strict; Max-Age=${COOKIE_MAX_AGE}; Path=/`
    });
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
    } else if (pathname === '/api/status') {
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
});

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

    // Rate limit
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
      // URL-encoded form
      const params = new URLSearchParams(body);
      subject = params.get('subject');
      message = params.get('message');
    }

    // Validate
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

    // Sanitize
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

    // Check line count
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

    // Append to CEO inbox
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

    // Success
    if (contentType.includes('application/json')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, message: 'Message delivered to CEO inbox' }));
    } else {
      res.writeHead(302, { 'Location': '/inbox?msg=' + encodeURIComponent('Message delivered to CEO inbox') });
      res.end();
    }
  });
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Board Portal running at http://0.0.0.0:${PORT}`);
});
