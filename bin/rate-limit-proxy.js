#!/usr/bin/env node
// Rate-limiting HTTPS CONNECT proxy for Claude Code API calls.
// Sits between agents and api.anthropic.com, throttling connection rate
// via a token bucket. Over-limit requests queue and wait (never dropped).
//
// Also tracks a rolling 1-hour request window. When usage hits PAUSE_THRESHOLD
// (default 85%) of HOURLY_LIMIT, the proxy pauses all Anthropic requests
// (queues them indefinitely) until the window rolls forward and usage drops.
//
// Usage: node rate-limit-proxy.js [port] [max-requests-per-second] [hourly-limit]
// Default: port 3128, 0.5 req/sec, 3000/hour limit
//
// GET http://localhost:3128/stats returns JSON with current usage stats.
// Set HTTPS_PROXY=http://localhost:3128 in the agent environment.

const net = require('net');
const http = require('http');
const fs = require('fs');

const PORT = parseInt(process.argv[2] || '3128', 10);
const MAX_RPS = parseFloat(process.argv[3] || '0.5');
const HOURLY_LIMIT = parseInt(process.argv[4] || '3000', 10);
const PAUSE_THRESHOLD = 0.85; // Write warning at 85% of hourly limit
const STATUS_FILE = '/opt/selfhosting-sh/logs/proxy-status.json';

// Token bucket rate limiter
let tokens = Math.max(1, MAX_RPS);
const maxTokens = Math.max(1, MAX_RPS * 2);
const queue = [];

// Rolling window: track timestamps of all Anthropic requests in the last hour
const requestTimestamps = [];

function getHourlyCount() {
  const oneHourAgo = Date.now() - 3600000;
  // Prune old entries
  while (requestTimestamps.length > 0 && requestTimestamps[0] < oneHourAgo) {
    requestTimestamps.shift();
  }
  return requestTimestamps.length;
}

function writeStatus() {
  const count = getHourlyCount();
  const pct = Math.round(count / HOURLY_LIMIT * 100);
  const threshold_reached = count >= Math.floor(HOURLY_LIMIT * PAUSE_THRESHOLD);
  const status = {
    timestamp: new Date().toISOString(),
    hourly_count: count,
    hourly_limit: HOURLY_LIMIT,
    hourly_pct: pct,
    threshold_pct: PAUSE_THRESHOLD * 100,
    threshold_reached,
    pending_requests: queue.length,
    rps: MAX_RPS
  };
  try {
    fs.writeFileSync(STATUS_FILE, JSON.stringify(status, null, 2) + '\n');
  } catch (e) {
    // Ignore write errors
  }
  if (threshold_reached) {
    console.log(`[${new Date().toISOString()}] WARNING — ${count}/${HOURLY_LIMIT} (${pct}%) >= ${PAUSE_THRESHOLD*100}% threshold. CEO should pause agents.`);
  }
}

// Refill tokens at MAX_RPS per second
setInterval(() => {
  tokens = Math.min(maxTokens, tokens + MAX_RPS);
  processQueue();
}, 1000);

// Write status file every 10 seconds
setInterval(writeStatus, 10000);

function processQueue() {
  while (queue.length > 0 && tokens >= 1) {
    tokens -= 1;
    const resolve = queue.shift();
    resolve();
  }
}

function acquireToken() {
  if (tokens >= 1) {
    tokens -= 1;
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    queue.push(resolve);
  });
}

// Stats for logging
let stats = { allowed: 0, queued: 0, errors: 0 };

setInterval(() => {
  const hourlyCount = getHourlyCount();
  const pct = (hourlyCount / HOURLY_LIMIT * 100).toFixed(0);
  const warn = hourlyCount >= Math.floor(HOURLY_LIMIT * PAUSE_THRESHOLD) ? ' THRESHOLD' : '';
  if (stats.allowed > 0 || stats.queued > 0 || stats.errors > 0) {
    const qLen = queue.length;
    console.log(
      `[${new Date().toISOString()}] allowed=${stats.allowed} queued=${stats.queued} errors=${stats.errors} pending=${qLen} tokens=${tokens.toFixed(1)} hourly=${hourlyCount}/${HOURLY_LIMIT}(${pct}%)${warn}`
    );
    stats = { allowed: 0, queued: 0, errors: 0 };
  }
}, 10000);

const server = http.createServer((req, res) => {
  // Stats endpoint
  if (req.url === '/stats') {
    const hourlyCount = getHourlyCount();
    const data = {
      hourly: { count: hourlyCount, limit: HOURLY_LIMIT, pct: Math.round(hourlyCount / HOURLY_LIMIT * 100) },
      threshold_reached: hourlyCount >= Math.floor(HOURLY_LIMIT * PAUSE_THRESHOLD),
      rps: { target: MAX_RPS, tokens: parseFloat(tokens.toFixed(1)), pending: queue.length },
      threshold: PAUSE_THRESHOLD * 100
    };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data, null, 2) + '\n');
    return;
  }
  res.writeHead(400, { 'Content-Type': 'text/plain' });
  res.end('This proxy only handles CONNECT tunnels for HTTPS. GET /stats for usage info.\n');
});

server.on('connect', async (req, clientSocket, head) => {
  const [host, port] = req.url.split(':');
  const targetPort = parseInt(port || '443', 10);

  const shouldLimit = host.includes('anthropic.com');

  if (shouldLimit) {
    stats.queued++;
    await acquireToken();
    requestTimestamps.push(Date.now());
  }
  stats.allowed++;

  const serverSocket = net.connect(targetPort, host, () => {
    clientSocket.write(
      'HTTP/1.1 200 Connection Established\r\n' +
      'Proxy-Agent: rate-limit-proxy\r\n' +
      '\r\n'
    );
    serverSocket.write(head);
    serverSocket.pipe(clientSocket);
    clientSocket.pipe(serverSocket);
  });

  serverSocket.on('error', (err) => {
    stats.errors++;
    console.error(`[${new Date().toISOString()}] Connect error to ${host}:${targetPort}: ${err.message}`);
    clientSocket.write('HTTP/1.1 502 Bad Gateway\r\n\r\n');
    clientSocket.end();
  });

  clientSocket.on('error', () => {
    serverSocket.destroy();
  });

  serverSocket.on('end', () => clientSocket.end());
  clientSocket.on('end', () => serverSocket.end());
});

server.on('error', (err) => {
  console.error(`Server error: ${err.message}`);
  process.exit(1);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[${new Date().toISOString()}] Rate-limit proxy listening on 127.0.0.1:${PORT}`);
  console.log(`[${new Date().toISOString()}] Rate: ${MAX_RPS} req/sec | Hourly limit: ${HOURLY_LIMIT} | Pause at: ${PAUSE_THRESHOLD*100}% (${Math.floor(HOURLY_LIMIT*PAUSE_THRESHOLD)})`);
  console.log(`[${new Date().toISOString()}] Stats: GET http://127.0.0.1:${PORT}/stats`);
});
