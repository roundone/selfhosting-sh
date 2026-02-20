#!/usr/bin/env node
/**
 * selfhosting.sh Status Dashboard
 * Lightweight monitoring server at :8080
 * Auto-refreshes every 30 seconds
 */

const http = require('http');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const BASE = '/opt/selfhosting-sh';

function safe(fn, fallback = 'N/A') {
  try { return fn(); } catch { return fallback; }
}

function exec(cmd, timeout = 5000) {
  return safe(() => execSync(cmd, { timeout, encoding: 'utf8' }).trim(), '');
}

function readFile(p, maxLines = 50) {
  return safe(() => {
    const content = fs.readFileSync(p, 'utf8');
    const lines = content.split('\n');
    return lines.slice(-maxLines).join('\n');
  }, '');
}

function getArticleCount() {
  return safe(() => {
    const count = execSync(
      `find ${BASE}/site/src/content -name '*.md' | wc -l`,
      { encoding: 'utf8', timeout: 5000 }
    ).trim();
    return parseInt(count, 10) || 0;
  }, 0);
}

function getArticlesByCollection() {
  return safe(() => {
    const result = execSync(
      `for d in ${BASE}/site/src/content/*/; do name=$(basename "$d"); count=$(find "$d" -name '*.md' | wc -l); echo "$name:$count"; done`,
      { encoding: 'utf8', timeout: 5000 }
    ).trim();
    const collections = {};
    for (const line of result.split('\n')) {
      const [name, count] = line.split(':');
      if (name && count) collections[name] = parseInt(count, 10);
    }
    return collections;
  }, {});
}

function getMemory() {
  const raw = exec('free -m');
  if (!raw) return { total: 0, used: 0, available: 0 };
  const lines = raw.split('\n');
  const memLine = lines.find(l => l.startsWith('Mem:'));
  if (!memLine) return { total: 0, used: 0, available: 0 };
  const parts = memLine.split(/\s+/);
  return {
    total: parseInt(parts[1], 10),
    used: parseInt(parts[2], 10),
    available: parseInt(parts[6], 10)
  };
}

function getDisk() {
  const raw = exec(`df -h ${BASE} | tail -1`);
  if (!raw) return { size: '?', used: '?', avail: '?', pct: '?' };
  const parts = raw.split(/\s+/);
  return { size: parts[1], used: parts[2], avail: parts[3], pct: parts[4] };
}

function getLoad() {
  return exec('cat /proc/loadavg').split(' ').slice(0, 3).join(' ');
}

function getUptime() {
  return exec('uptime -p');
}

function getServices() {
  const services = ['selfhosting-proxy', 'selfhosting-coordinator'];
  return services.map(s => ({
    name: s,
    status: exec(`systemctl is-active ${s}`)
  }));
}

function getCoordinatorState() {
  return safe(() => {
    const raw = fs.readFileSync(`${BASE}/logs/coordinator-state.json`, 'utf8');
    return JSON.parse(raw);
  }, null);
}

function getRecentCoordinatorLog(lines = 40) {
  return readFile(`${BASE}/logs/coordinator.log`, lines);
}

function getRecentDeployLog(lines = 20) {
  return readFile(`${BASE}/logs/deploy.log`, lines);
}

function getLatestBoardReport() {
  return safe(() => {
    const files = fs.readdirSync(`${BASE}/board`).filter(f => f.startsWith('day-')).sort();
    if (files.length === 0) return null;
    const latest = files[files.length - 1];
    return {
      name: latest,
      content: fs.readFileSync(`${BASE}/board/${latest}`, 'utf8').slice(0, 3000)
    };
  }, null);
}

function getSocialQueueStats() {
  return safe(() => {
    const queuePath = `${BASE}/social-queue`;
    if (!fs.existsSync(queuePath)) return { pending: 0, posted: 0 };
    const pending = execSync(`find ${queuePath}/pending -name '*.json' 2>/dev/null | wc -l`, { encoding: 'utf8', timeout: 5000 }).trim();
    const posted = execSync(`find ${queuePath}/posted -name '*.json' 2>/dev/null | wc -l`, { encoding: 'utf8', timeout: 5000 }).trim();
    return { pending: parseInt(pending, 10) || 0, posted: parseInt(posted, 10) || 0 };
  }, { pending: 0, posted: 0 });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function statusBadge(status) {
  const color = status === 'active' ? '#22c55e'
    : status === 'running' ? '#22c55e'
    : status === 'queued' ? '#f59e0b'
    : status === 'backoff' ? '#ef4444'
    : '#6b7280';
  return `<span style="display:inline-block;padding:2px 8px;border-radius:4px;background:${color};color:#000;font-weight:600;font-size:12px">${escapeHtml(status)}</span>`;
}

function buildPage() {
  const mem = getMemory();
  const disk = getDisk();
  const load = getLoad();
  const uptime = getUptime();
  const services = getServices();
  const coordState = getCoordinatorState();
  const articles = getArticleCount();
  const collections = getArticlesByCollection();
  const coordLog = getRecentCoordinatorLog(40);
  const deployLog = getRecentDeployLog(15);
  const board = getLatestBoardReport();
  const social = getSocialQueueStats();
  const now = new Date().toISOString();

  const memPct = mem.total > 0 ? Math.round((mem.used / mem.total) * 100) : 0;
  const memColor = memPct > 90 ? '#ef4444' : memPct > 75 ? '#f59e0b' : '#22c55e';
  const diskPct = parseInt(disk.pct) || 0;
  const diskColor = diskPct > 80 ? '#ef4444' : diskPct > 60 ? '#f59e0b' : '#22c55e';

  // Build agent rows
  let agentRows = '';
  if (coordState && coordState.agents) {
    const agents = Object.entries(coordState.agents).sort(([a], [b]) => a.localeCompare(b));
    for (const [name, info] of agents) {
      const lastRun = info.lastStarted ? new Date(info.lastStarted).toISOString().replace('T', ' ').slice(0, 19) + ' UTC' : 'never';
      const lastExit = info.lastExited ? new Date(info.lastExited).toISOString().replace('T', ' ').slice(0, 19) + ' UTC' : '-';
      const errors = info.consecutiveErrors || 0;
      const status = info.running ? 'running' : errors > 0 ? 'backoff' : 'queued';
      agentRows += `<tr>
        <td>${escapeHtml(name)}</td>
        <td>${statusBadge(status)}</td>
        <td>${escapeHtml(lastRun)}</td>
        <td>${escapeHtml(lastExit)}</td>
        <td>${errors}</td>
      </tr>`;
    }
  }

  // Build collection rows
  let collectionRows = '';
  const sortedCollections = Object.entries(collections).sort(([,a], [,b]) => b - a);
  for (const [name, count] of sortedCollections) {
    collectionRows += `<tr><td>${escapeHtml(name)}</td><td>${count}</td></tr>`;
  }

  // Service rows
  let serviceRows = '';
  for (const svc of services) {
    serviceRows += `<tr>
      <td>${escapeHtml(svc.name)}</td>
      <td>${statusBadge(svc.status)}</td>
    </tr>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="refresh" content="30">
  <title>selfhosting.sh — Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0f1117; color: #e2e8f0; font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace; font-size: 13px; line-height: 1.5; padding: 16px; }
    h1 { color: #22c55e; font-size: 20px; margin-bottom: 4px; }
    .subtitle { color: #64748b; font-size: 12px; margin-bottom: 16px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 16px; margin-bottom: 16px; }
    .card { background: #1a1d27; border: 1px solid #2d3148; border-radius: 8px; padding: 16px; overflow: hidden; }
    .card h2 { color: #94a3b8; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; border-bottom: 1px solid #2d3148; padding-bottom: 8px; }
    .metric { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; }
    .metric-label { color: #94a3b8; }
    .metric-value { color: #e2e8f0; font-weight: 600; }
    .metric-value.big { font-size: 24px; color: #22c55e; }
    .bar { height: 8px; background: #2d3148; border-radius: 4px; overflow: hidden; margin-top: 4px; }
    .bar-fill { height: 100%; border-radius: 4px; transition: width 0.3s; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 6px 8px; text-align: left; border-bottom: 1px solid #2d3148; }
    th { color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
    td { font-size: 12px; }
    pre { background: #0d0f14; border: 1px solid #2d3148; border-radius: 4px; padding: 12px; overflow-x: auto; font-size: 11px; line-height: 1.4; max-height: 400px; overflow-y: auto; white-space: pre-wrap; word-break: break-all; }
    .wide { grid-column: 1 / -1; }
    .ok { color: #22c55e; }
    .warn { color: #f59e0b; }
    .crit { color: #ef4444; }
    a { color: #22c55e; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>$ selfhosting.sh</h1>
  <div class="subtitle">Status Dashboard — Updated ${escapeHtml(now)} — Auto-refresh 30s</div>

  <div class="grid">
    <!-- System Health -->
    <div class="card">
      <h2>System Health</h2>
      <div class="metric">
        <span class="metric-label">Uptime</span>
        <span class="metric-value">${escapeHtml(uptime)}</span>
      </div>
      <div class="metric">
        <span class="metric-label">Load</span>
        <span class="metric-value">${escapeHtml(load)}</span>
      </div>
      <div class="metric">
        <span class="metric-label">Memory</span>
        <span class="metric-value" style="color:${memColor}">${mem.used}MB / ${mem.total}MB (${memPct}%)</span>
      </div>
      <div class="bar"><div class="bar-fill" style="width:${memPct}%;background:${memColor}"></div></div>
      <div class="metric" style="margin-top:8px">
        <span class="metric-label">Disk</span>
        <span class="metric-value" style="color:${diskColor}">${escapeHtml(disk.used)} / ${escapeHtml(disk.size)} (${escapeHtml(disk.pct)})</span>
      </div>
      <div class="bar"><div class="bar-fill" style="width:${diskPct}%;background:${diskColor}"></div></div>
    </div>

    <!-- Key Metrics -->
    <div class="card">
      <h2>Key Metrics</h2>
      <div class="metric">
        <span class="metric-label">Total Articles</span>
        <span class="metric-value big">${articles}</span>
      </div>
      <div class="metric">
        <span class="metric-label">Social Queue (pending)</span>
        <span class="metric-value">${social.pending}</span>
      </div>
      <div class="metric">
        <span class="metric-label">Social Posts (sent)</span>
        <span class="metric-value">${social.posted}</span>
      </div>
      <div class="metric">
        <span class="metric-label">Site</span>
        <span class="metric-value"><a href="https://selfhosting.sh" target="_blank">selfhosting.sh</a></span>
      </div>
    </div>

    <!-- Infrastructure Services -->
    <div class="card">
      <h2>Infrastructure</h2>
      <table>
        <tr><th>Service</th><th>Status</th></tr>
        ${serviceRows}
      </table>
    </div>

    <!-- Content Breakdown -->
    <div class="card">
      <h2>Content by Collection</h2>
      <table>
        <tr><th>Collection</th><th>Articles</th></tr>
        ${collectionRows}
      </table>
    </div>

    <!-- Agent Status -->
    <div class="card wide">
      <h2>Agent Status</h2>
      <table>
        <tr><th>Agent</th><th>Status</th><th>Last Started</th><th>Last Exited</th><th>Errors</th></tr>
        ${agentRows || '<tr><td colspan="5">No coordinator state available</td></tr>'}
      </table>
    </div>

    <!-- Coordinator Log -->
    <div class="card wide">
      <h2>Recent Coordinator Log</h2>
      <pre>${escapeHtml(coordLog)}</pre>
    </div>

    <!-- Deploy Log -->
    <div class="card wide">
      <h2>Recent Deploy Log</h2>
      <pre>${escapeHtml(deployLog)}</pre>
    </div>

    ${board ? `
    <!-- Latest Board Report -->
    <div class="card wide">
      <h2>Latest Board Report: ${escapeHtml(board.name)}</h2>
      <pre>${escapeHtml(board.content)}</pre>
    </div>
    ` : ''}
  </div>
</body>
</html>`;
}

const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(buildPage());
  } else if (req.url === '/api/status') {
    const data = {
      timestamp: new Date().toISOString(),
      memory: getMemory(),
      disk: getDisk(),
      load: getLoad(),
      services: getServices(),
      articles: getArticleCount(),
      collections: getArticlesByCollection(),
      agents: getCoordinatorState(),
      social: getSocialQueueStats()
    };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data, null, 2));
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Dashboard running at http://0.0.0.0:${PORT}`);
});
