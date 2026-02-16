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

const PORT = parseInt(process.argv[2] || '3128', 10);
const MAX_RPS = parseFloat(process.argv[3] || '0.5');
const HOURLY_LIMIT = parseInt(process.argv[4] || '3000', 10);
const PAUSE_THRESHOLD = 0.85; // Pause at 85% of hourly limit

// Token bucket rate limiter
let tokens = Math.max(1, MAX_RPS);
const maxTokens = Math.max(1, MAX_RPS * 2);
const queue = [];

// Rolling window: track timestamps of all Anthropic requests in the last hour
const requestTimestamps = [];
let paused = false;

function getHourlyCount() {
  const oneHourAgo = Date.now() - 3600000;
  // Prune old entries
  while (requestTimestamps.length > 0 && requestTimestamps[0] < oneHourAgo) {
    requestTimestamps.shift();
  }
  return requestTimestamps.length;
}

function checkPause() {
  const count = getHourlyCount();
  const threshold = Math.floor(HOURLY_LIMIT * PAUSE_THRESHOLD);
  const wasPaused = paused;
  paused = count >= threshold;

  if (paused && !wasPaused) {
    console.log(`[${new Date().toISOString()}] PAUSED — ${count}/${HOURLY_LIMIT} requests in last hour (${(count/HOURLY_LIMIT*100).toFixed(0)}% >= ${PAUSE_THRESHOLD*100}% threshold)`);
  } else if (!paused && wasPaused) {
    console.log(`[${new Date().toISOString()}] RESUMED — ${count}/${HOURLY_LIMIT} requests in last hour (${(count/HOURLY_LIMIT*100).toFixed(0)}% < ${PAUSE_THRESHOLD*100}% threshold)`);
    processQueue(); // Drain queued requests
  }
}

// Refill tokens at MAX_RPS per second
setInterval(() => {
  tokens = Math.min(maxTokens, tokens + MAX_RPS);
  if (!paused) {
    processQueue();
  }
}, 1000);

// Check pause status every 10 seconds
setInterval(checkPause, 10000);

function processQueue() {
  while (queue.length > 0 && tokens >= 1 && !paused) {
    tokens -= 1;
    const resolve = queue.shift();
    resolve();
  }
}

function acquireToken() {
  if (!paused && tokens >= 1) {
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
  if (stats.allowed > 0 || stats.queued > 0 || stats.errors > 0 || paused) {
    const qLen = queue.length;
    console.log(
      `[${new Date().toISOString()}] allowed=${stats.allowed} queued=${stats.queued} errors=${stats.errors} pending=${qLen} tokens=${tokens.toFixed(1)} hourly=${hourlyCount}/${HOURLY_LIMIT}(${pct}%)${paused ? ' PAUSED' : ''}`
    );
    stats = { allowed: 0, queued: 0, errors: 0 };
  }
}, 10000);

const server = http.createServer((req, res) => {
  // Stats endpoint
  if (req.url === '/stats') {
    const hourlyCount = getHourlyCount();
    const data = {
      paused,
      hourly: { count: hourlyCount, limit: HOURLY_LIMIT, pct: Math.round(hourlyCount / HOURLY_LIMIT * 100) },
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
