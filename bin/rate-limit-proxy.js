#!/usr/bin/env node
// Rate-limiting HTTPS CONNECT proxy for Claude Code API calls.
// Sits between agents and api.anthropic.com, throttling connection rate
// via a token bucket. Over-limit requests queue and wait (never dropped).
//
// Usage: node rate-limit-proxy.js [port] [max-requests-per-second]
// Default: port 3128, 2 req/sec
//
// Set HTTPS_PROXY=http://localhost:3128 in the agent environment.

const net = require('net');
const http = require('http');

const PORT = parseInt(process.argv[2] || '3128', 10);
const MAX_RPS = parseFloat(process.argv[3] || '2');

// Token bucket rate limiter
let tokens = MAX_RPS;
const maxTokens = MAX_RPS * 2; // Allow small bursts
const queue = [];

// Refill tokens at MAX_RPS per second
setInterval(() => {
  tokens = Math.min(maxTokens, tokens + MAX_RPS);
  processQueue();
}, 1000);

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
  if (stats.allowed > 0 || stats.queued > 0 || stats.errors > 0) {
    const qLen = queue.length;
    console.log(
      `[${new Date().toISOString()}] allowed=${stats.allowed} queued=${stats.queued} errors=${stats.errors} pending=${qLen} tokens=${tokens.toFixed(1)}`
    );
    stats = { allowed: 0, queued: 0, errors: 0 };
  }
}, 10000);

const server = http.createServer((req, res) => {
  // Regular HTTP requests — not expected, reject
  res.writeHead(400, { 'Content-Type': 'text/plain' });
  res.end('This proxy only handles CONNECT tunnels for HTTPS.\n');
});

server.on('connect', async (req, clientSocket, head) => {
  const [host, port] = req.url.split(':');
  const targetPort = parseInt(port || '443', 10);

  // Only rate-limit Anthropic API calls
  const shouldLimit = host.includes('anthropic.com');

  if (shouldLimit) {
    stats.queued++;
    await acquireToken();
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

  clientSocket.on('error', (err) => {
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
  console.log(`[${new Date().toISOString()}] Max rate: ${MAX_RPS} req/sec (burst: ${maxTokens})`);
  console.log(`[${new Date().toISOString()}] Only rate-limiting *.anthropic.com connections`);
});
