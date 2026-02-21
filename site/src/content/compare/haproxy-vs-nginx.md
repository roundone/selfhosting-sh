---
title: "HAProxy vs Nginx: Which Reverse Proxy?"
description: "HAProxy vs Nginx compared — performance benchmarks, reverse proxy features, load balancing algorithms, health checks, WebSocket support, and TLS overhead."
date: 2026-02-16
dateUpdated: 2026-02-20
category: "reverse-proxy"
apps:
  - haproxy
  - nginx
tags:
  - comparison
  - haproxy
  - nginx
  - reverse-proxy
  - self-hosted
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Quick Verdict

**Nginx is the better choice for most self-hosters.** It is both a web server and a reverse proxy, has simpler initial configuration, and virtually every self-hosting tutorial on the internet uses it. HAProxy is the superior pure load balancer — better health checking, more load balancing algorithms, and higher connection concurrency — but it cannot serve static files and has a steeper learning curve. Pick Nginx unless you specifically need advanced load balancing.

## Overview

[Nginx](https://nginx.org) (v1.28) is the most widely deployed web server on the internet. It doubles as a reverse proxy, load balancer, and static file server. Nginx uses a block-based configuration syntax (`nginx.conf`) and ships with a working default config in its Docker image. Its C-based event-driven architecture is extremely efficient.

[HAProxy](https://www.haproxy.org) (v3.3) is a dedicated high-performance load balancer and reverse proxy. It is not a web server — it cannot serve files from disk. HAProxy is purpose-built for connection handling, health checking, and traffic distribution. Its configuration (`haproxy.cfg`) uses a frontend/backend model that maps directly to how traffic flows. HAProxy ships no default config in Docker — you write one from scratch.

The core tradeoff: Nginx does more things (web serving, proxying, caching, static files). HAProxy does one thing better (proxying and load balancing at scale).

## Feature Comparison

| Feature | Nginx (v1.28) | HAProxy (v3.3) |
|---------|--------------|----------------|
| Primary function | Web server + reverse proxy | Load balancer + reverse proxy |
| Static file serving | Yes — excellent | No |
| Reverse proxying | Yes | Yes — purpose-built |
| Load balancing algorithms | Round-robin, least connections, IP hash, random | Round-robin, least connections, source hash, URI hash, random, first available, custom via stick-tables |
| Health checks | Basic (TCP, limited HTTP) | Advanced (HTTP checks with expected status/body, inter/fall/rise, agent checks) |
| SSL/TLS termination | Yes | Yes |
| HTTP/2 support | Yes — backend and frontend | Yes — frontend and backend (h2) |
| HTTP/3 (QUIC) | Experimental | No |
| WebSocket support | Manual — requires header config | Native — `option http-server-close` handles upgrade |
| Configuration format | `nginx.conf` — block-based | `haproxy.cfg` — frontend/backend sections |
| Hot reload | `nginx -s reload` (graceful) | `kill -USR2` or master-worker mode reload |
| Built-in caching | Yes — `proxy_cache` (production-grade) | No |
| Connection handling | Event-driven, worker processes | Event-driven, single/multi-threaded, stick-tables for session persistence |
| TCP/UDP proxying | Yes — stream module | Yes — native TCP mode (`mode tcp`) |
| Stats/monitoring | Stub status module, Plus dashboard (paid) | Built-in stats page with real-time metrics (free) |
| Rate limiting | Built-in (`limit_req`, `limit_conn`) | Via stick-tables and ACLs |
| Scripting | Lua (via OpenResty/njs) | HAProxy Lua API, SPOE |
| License | BSD 2-Clause | GPL v2 (community), commercial license available |

## Installation Complexity

**Nginx** ships a working default config. Drop it into Docker, mount your custom config, and it serves traffic immediately:

```yaml
services:
  nginx:
    image: nginx:1.28.2
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./conf.d:/etc/nginx/conf.d:ro
      - certs:/etc/letsencrypt
    networks:
      - proxy

volumes:
  certs:

networks:
  proxy:
    name: proxy
```

A basic reverse proxy `conf.d/app.conf`:

```nginx
server {
    listen 80;
    server_name app.example.com;

    location / {
        proxy_pass http://myapp:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**HAProxy** ships no default config. You must create `haproxy.cfg` from scratch before the container will start:

```yaml
services:
  haproxy:
    image: haproxy:3.3.3
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
      - "8404:8404"  # Stats page
    volumes:
      - ./haproxy.cfg:/usr/local/etc/haproxy/haproxy.cfg:ro
    command: haproxy -W -db -f /usr/local/etc/haproxy/haproxy.cfg
    networks:
      - proxy

networks:
  proxy:
    name: proxy
```

A basic reverse proxy `haproxy.cfg`:

```
global
    log stdout format raw local0
    maxconn 4096

defaults
    mode http
    log global
    option httplog
    timeout connect 5s
    timeout client 30s
    timeout server 30s

frontend http_front
    bind *:80
    default_backend app_back

    # Route by hostname
    acl host_app hdr(host) -i app.example.com
    use_backend app_back if host_app

backend app_back
    server app1 myapp:8080 check
```

HAProxy's frontend/backend model is explicit about traffic flow, which makes complex routing clearer. But for a simple reverse proxy, Nginx gets you there faster with less syntax. HAProxy also requires the `-W -db` flags for proper Docker operation (master-worker mode, no backgrounding) and explicit stdout logging since it defaults to syslog.

**Winner: Nginx.** Less boilerplate, ships a working default, and the Docker image works out of the box. HAProxy requires understanding its config model before you can proxy a single request.

## Performance Benchmarks

Both HAProxy and Nginx are written in C with event-driven architectures. In production benchmarks, the raw performance gap is narrower than most comparisons suggest — but the differences matter at scale.

### Throughput and Latency

| Metric | Nginx (v1.28) | HAProxy (v3.3) | Winner |
|--------|--------------|----------------|--------|
| HTTP requests/sec (single core, keep-alive) | ~90,000–120,000 | ~100,000–150,000 | HAProxy |
| HTTP requests/sec (8 cores, keep-alive) | ~600,000–800,000 | ~700,000–1,000,000 | HAProxy |
| Median latency (1,000 concurrent) | ~0.5–1.0 ms | ~0.3–0.7 ms | HAProxy |
| P99 latency (1,000 concurrent) | ~2–5 ms | ~1–3 ms | HAProxy |
| Static file serving throughput | ~1.5 GB/s | N/A (cannot serve files) | Nginx |
| HTTP/2 multiplexed streams | ~500 concurrent | ~500 concurrent | Tie |

*Benchmarks vary significantly by hardware, kernel tuning, and workload. These ranges reflect commonly reported results from tools like wrk, h2load, and hey on modern x86 hardware.*

HAProxy consistently edges out Nginx for pure proxying throughput because it was purpose-built for that single task. The difference is most visible under sustained high concurrency (10,000+ connections) where HAProxy's per-connection memory footprint is smaller.

### Connection Handling

| Capability | Nginx | HAProxy |
|-----------|-------|---------|
| Max concurrent connections | ~100,000+ per worker (tunable via `worker_connections`) | ~100,000+ per process (tunable via `maxconn`) |
| Connection queueing | No — excess connections get 502 | Yes — `maxqueue` holds connections until a backend slot opens |
| Connection draining | Graceful reload (`nginx -s reload`) — new connections go to new workers, old ones finish | Graceful drain via `set server [backend]/[server] state drain` — no new connections, existing ones complete |
| Connection reuse (keep-alive to backend) | `keepalive` directive in upstream block | `http-reuse` (safe, aggressive, or always modes) |
| Idle connection timeout | Configurable per location | Configurable per frontend/backend, plus `timeout tunnel` for WebSockets |
| Backpressure handling | Worker processes queue internally | Explicit `fullconn` and `maxqueue` per backend with configurable overflow behavior |

HAProxy's explicit connection queueing is a genuine advantage. When a backend is overloaded, HAProxy queues incoming connections and serves them in order as backend capacity frees up. Nginx returns 502 errors when upstreams are unavailable — there is no built-in queue.

### TLS Handshake Performance

| TLS Metric | Nginx | HAProxy |
|-----------|-------|---------|
| RSA 2048-bit handshakes/sec (single core) | ~3,000–4,000 | ~3,500–5,000 |
| ECDSA P-256 handshakes/sec (single core) | ~15,000–20,000 | ~18,000–25,000 |
| TLS 1.3 0-RTT support | Yes | Yes (since v2.2) |
| TLS session resumption | Session cache + tickets | Session cache + tickets |
| OCSP stapling | Yes | Yes (since v2.4) |
| Certificate hot-reload | Requires full reload | Runtime SSL cert update via Runtime API |

Both use OpenSSL (or optionally BoringSSL/LibreSSL) under the hood, so raw crypto performance is similar. HAProxy's slight edge comes from fewer memory copies in its TLS path and its ability to update certificates at runtime without any reload — useful in environments with frequent cert rotation.

For self-hosting with Let's Encrypt certificates, the TLS performance difference is imperceptible. It matters in CDN-scale deployments handling millions of new TLS sessions per hour.

## As a Reverse Proxy

Since "haproxy vs nginx reverse proxy" is one of the most common comparison queries, here is a detailed breakdown of how each handles core reverse proxy responsibilities.

### Header Handling

| Feature | Nginx | HAProxy |
|---------|-------|---------|
| `X-Forwarded-For` injection | Manual: `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;` | Automatic: `option forwardfor` (one line) |
| `X-Real-IP` injection | Manual: `proxy_set_header X-Real-IP $remote_addr;` | Via `http-request set-header X-Real-IP %[src]` |
| Custom header manipulation | `proxy_set_header`, `add_header`, `more_set_headers` (module) | `http-request set-header`, `http-response set-header`, `http-request del-header` — all native |
| Host header forwarding | `proxy_set_header Host $host;` (must add manually) | Forwards `Host` by default in HTTP mode |
| `X-Forwarded-Proto` | Manual: `proxy_set_header X-Forwarded-Proto $scheme;` | Via `http-request set-header X-Forwarded-Proto https if { ssl_fc }` |

Nginx requires you to explicitly set every proxy header — forgetting `X-Forwarded-For` or `Host` is one of the most common reverse proxy mistakes. HAProxy's `option forwardfor` handles the most critical header in a single directive, and it passes the `Host` header by default.

### WebSocket Support

| Feature | Nginx | HAProxy |
|---------|-------|---------|
| WebSocket proxying | Requires explicit config per location | Native — works automatically in HTTP mode |
| Config required | `proxy_set_header Upgrade $http_upgrade;` + `proxy_set_header Connection "upgrade";` | `option http-server-close` (or nothing in newer versions) |
| Timeout handling | `proxy_read_timeout` (default 60s — kills idle WebSockets) | `timeout tunnel` (set independently from HTTP timeouts) |
| Mixed HTTP + WebSocket on same port | Supported with correct headers | Supported natively |

WebSocket proxying is a common pain point with Nginx. You must add the `Upgrade` and `Connection` headers to every location block that serves WebSockets, and you must increase `proxy_read_timeout` or idle connections get closed after 60 seconds. HAProxy handles WebSocket upgrades automatically — no extra config required.

### Health Checks

| Capability | Nginx | HAProxy |
|-----------|-------|---------|
| TCP check (port open) | Yes (default) | Yes |
| HTTP check (status code) | Limited — `max_fails` + `fail_timeout` react to real traffic errors, not active probes | Full — `option httpchk GET /health` with expected status codes |
| HTTP check with body match | No (requires Nginx Plus) | Yes — `http-check expect string "ok"` |
| Check interval | Based on real traffic (passive) | Configurable: `inter 5s fall 3 rise 2` |
| Gradual server drain | No native support | `set server state drain` via Runtime API or `on-marked-down shutdown-sessions` |
| Agent health checks | No | Yes — external agent reports server health via TCP |
| Slow start | No (requires Nginx Plus) | Yes — `slowstart 30s` gradually increases traffic to a recovered server |

This is HAProxy's strongest advantage as a reverse proxy. Nginx's health checking is passive — it only detects problems when real user requests fail. HAProxy actively probes backends on a configurable interval, can check HTTP response bodies, and gradually reintroduces recovered servers. If backend reliability matters, HAProxy is significantly better.

### Load Balancing Algorithms

| Algorithm | Nginx | HAProxy |
|-----------|-------|---------|
| Round-robin | Yes (default) | Yes (default) |
| Least connections | Yes (`least_conn`) | Yes (`leastconn`) |
| IP hash (sticky sessions) | Yes (`ip_hash`) | Yes (`balance source`) |
| URI hash | Yes (`hash $request_uri`) | Yes (`balance uri`) |
| Random | Yes (`random`) | Yes (`balance random`) |
| First available | No | Yes (`balance first`) |
| Custom hash | Yes (`hash $variable`) | Yes (`balance hdr(X-Custom)`) |
| Weighted backends | Yes (`weight`) | Yes (`weight`) |
| Consistent hashing | Yes (`hash ... consistent`) | Yes (`hash-type consistent`) |

Both cover the common algorithms. HAProxy's `balance first` (fill the first server before moving to the next) is unique and useful for saving power in environments where you want to consolidate load onto fewer servers.

### Reverse Proxy Verdict

**For a simple self-hosting reverse proxy** (5–30 services, one backend per service, no load balancing): **Nginx wins.** More tutorials, simpler `location` blocks, and the ability to serve static error pages or landing pages from the same instance.

**For a reverse proxy where backend health matters** (multiple replicas, services that crash, gradual rollouts): **HAProxy wins.** Its active health checks, connection queueing, slow-start, and runtime API make it a fundamentally better tool for managing unreliable backends.

## Performance and Resource Usage

| Metric | Nginx (v1.28) | HAProxy (v3.3) |
|--------|--------------|----------------|
| Idle RAM | ~10-30 MB | ~10-20 MB |
| Under load RAM | ~30-80 MB | ~20-50 MB |
| Concurrent connections | Excellent | Outstanding |
| CPU efficiency | Excellent (C, event-driven) | Excellent (C, event-driven) |
| Max connections per worker | Tunable (worker_connections) | Tunable (maxconn) |
| Docker image size | ~60 MB (Debian), ~10 MB (Alpine) | ~100 MB (Debian), ~10 MB (Alpine) |
| Startup time | < 1 second | < 1 second |

Both are written in C with event-driven architectures. Both handle massive connection counts with minimal resources. The key differences:

- **HAProxy is marginally more efficient for pure proxying.** It was designed from the ground up as a proxy, and its connection handling is optimized specifically for that. At very high concurrency (tens of thousands of simultaneous connections), HAProxy uses less memory per connection.
- **Nginx uses less memory when serving static content** alongside proxying, because it handles both in the same process rather than needing a separate web server.
- **HAProxy's stick-tables** allow connection tracking and rate limiting without external tools, with lower overhead than Nginx's shared memory zones.

For self-hosting, the performance difference is irrelevant. Both handle homelab traffic effortlessly. Your backend services will bottleneck long before either proxy does.

## Community and Support

| Metric | Nginx | HAProxy |
|--------|-------|---------|
| First release | 2004 | 2001 |
| Web server market share | ~34% of all sites | N/A (not a web server) |
| GitHub stars | 26K+ (nginx/nginx) | 5K+ (haproxy/haproxy) |
| Documentation | Comprehensive, well-organized | Thorough but dense |
| Third-party tutorials | Massive — 20+ years of content | Moderate — mostly enterprise/DevOps focused |
| Self-hosting tutorials | Very common | Rare |
| Enterprise version | Nginx Plus (F5) | HAProxy Enterprise (HAProxy Technologies) |
| Configuration examples | Everywhere | Harder to find for homelab use |

Nginx dominates the self-hosting tutorial ecosystem. Almost every Docker self-hosting guide includes an Nginx reverse proxy example. If you search for "reverse proxy [app name]," you will find Nginx configs. HAProxy configs for homelab apps are uncommon — most HAProxy content targets enterprise deployments and Kubernetes ingress.

This matters. When something breaks at 2 AM and you need a Stack Overflow answer, Nginx has 10x more results.

## Use Cases

### Choose Nginx If...

- You need a web server AND a reverse proxy (most self-hosters)
- You want the most tutorial-compatible option
- You need built-in caching for your proxied services
- You want to serve static sites alongside your proxy config
- You prefer a config format with abundant community examples
- You need rate limiting without external tools
- You are new to reverse proxies

### Choose HAProxy If...

- You need advanced health checking (HTTP checks with expected responses, gradual server drain, agent checks)
- You are load balancing across multiple backend servers for the same service
- You need session persistence with stick-tables
- You want a built-in, real-time stats dashboard (free, no paid tier required)
- You need TCP proxying for non-HTTP protocols (databases, mail, game servers)
- You are running high-concurrency workloads (10,000+ simultaneous connections)
- You have enterprise or DevOps experience and prefer explicit frontend/backend routing

## FAQ

### Can HAProxy serve static files?

No. HAProxy is not a web server. If you need to serve static files (a documentation site, a landing page, file downloads), you need Nginx, Caddy, or another web server alongside HAProxy.

### Can I use both together?

Yes, and this is common in production. HAProxy handles load balancing and health checking at the edge, then forwards to Nginx instances that serve static content or further proxy to application backends. For a homelab, this is overkill — pick one.

### Which has better SSL/TLS performance?

Both handle SSL termination well. HAProxy added native SSL support in version 1.5 and it is now mature. Nginx has had SSL support for its entire history. Neither requires external tools for SSL termination, but both require you to manage certificate provisioning separately (via Certbot, acme.sh, or similar). Neither has automatic HTTPS like Caddy.

### Is HAProxy's stats page worth it?

Yes. HAProxy's built-in stats page shows real-time connection counts, response times, server health status, and error rates per backend — all without installing Grafana or Prometheus. Add this to your `haproxy.cfg`:

```
frontend stats
    bind *:8404
    stats enable
    stats uri /stats
    stats refresh 10s
```

Nginx's equivalent (stub_status) only shows basic connection counts. Full metrics require Nginx Plus (paid) or Prometheus exporters.

### Which is easier to debug?

Nginx. Its error log format is straightforward, and you can test configs with `nginx -t` before reloading. HAProxy's logs are more detailed but harder to parse without syslog experience. In Docker, HAProxy needs explicit `log stdout format raw local0` to output logs to `docker logs`, while Nginx writes to stdout by default.

## Final Verdict

**Nginx is the right choice for most self-hosters.** It is a web server, reverse proxy, and load balancer in one package. Configuration examples are everywhere. Every self-hosted app tutorial includes Nginx configs. The learning curve is moderate, and the Docker image works out of the box with a sensible default config.

**HAProxy is the right choice if load balancing is your primary need.** Its health checking is genuinely superior — you can check HTTP status codes, response bodies, and gradually drain servers. Its stick-tables provide session persistence and rate limiting without external dependencies. Its free stats page gives you real-time visibility that Nginx locks behind a paid tier.

For a typical homelab running 5-30 services behind a reverse proxy, Nginx (or better yet, [Caddy](/apps/caddy/) or [Nginx Proxy Manager](/apps/nginx-proxy-manager/)) gets you there faster. Reach for HAProxy when you are running multiple replicas of a service and need intelligent traffic distribution.

## Related

- [How to Self-Host Nginx with Docker](/apps/nginx/)
- [How to Self-Host HAProxy with Docker](/apps/haproxy/)
- [Best Self-Hosted Reverse Proxies](/best/reverse-proxy/)
- [Traefik vs HAProxy](/compare/traefik-vs-haproxy/)
- [Caddy vs Nginx](/compare/caddy-vs-nginx/)
- [Nginx Proxy Manager vs Traefik](/compare/nginx-proxy-manager-vs-traefik/)
- [Reverse Proxy Explained](/foundations/reverse-proxy-explained/)
