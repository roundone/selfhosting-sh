---
title: "How to Self-Host HAProxy with Docker Compose"
description: "Deploy HAProxy with Docker Compose as a reverse proxy and load balancer. Includes config, stats dashboard, SSL termination, and troubleshooting."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "reverse-proxy"
apps:
  - haproxy
tags:
  - docker
  - reverse-proxy
  - haproxy
  - load-balancer
  - ssl
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is HAProxy?

[HAProxy](https://www.haproxy.org) is a high-performance TCP/HTTP load balancer and reverse proxy. It is the go-to choice for production load balancing — used by GitHub, Reddit, Stack Overflow, and most large-scale web infrastructure. For self-hosting, HAProxy excels at TCP-level proxying, advanced health checks, and high-availability setups. It is overkill for most homelabs but unmatched when you need production-grade traffic management.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 64 MB of free RAM
- Ports 80 and 443 available
- Basic understanding of frontend/backend proxy concepts ([guide](/foundations/reverse-proxy-explained))

## Docker Compose Configuration

Create a directory for HAProxy:

```bash
mkdir -p ~/haproxy && cd ~/haproxy
```

Create a `haproxy.cfg` configuration file. This example sets up HTTP reverse proxying with a stats dashboard:

```cfg
global
    maxconn 4096
    log stdout format raw local0
    # Run as non-root (default in Docker image)
    # user haproxy
    # group haproxy

defaults
    mode http
    log global
    option httplog
    option dontlognull
    option forwardfor        # Add X-Forwarded-For header
    timeout connect 5s
    timeout client 50s
    timeout server 50s
    timeout http-request 10s

# Stats dashboard — accessible at http://your-server:8404/stats
frontend stats
    bind *:8404
    stats enable
    stats uri /stats
    stats refresh 10s
    stats admin if LOCALHOST    # Only allow admin actions from localhost

# HTTP frontend — receives all incoming traffic
frontend http_front
    bind *:80
    # Route based on hostname
    acl host_app1 hdr(host) -i app1.example.com
    acl host_app2 hdr(host) -i app2.example.com

    use_backend app1_backend if host_app1
    use_backend app2_backend if host_app2
    default_backend default_backend

# Backend definitions
backend app1_backend
    balance roundrobin
    option httpchk GET /
    http-check expect status 200
    server app1 app1:8080 check inter 10s fall 3 rise 2

backend app2_backend
    balance roundrobin
    option httpchk GET /
    server app2 app2:8080 check inter 10s fall 3 rise 2

backend default_backend
    http-request deny deny_status 403
```

Create a `docker-compose.yml`:

```yaml
services:
  haproxy:
    image: haproxy:3.3.3
    container_name: haproxy
    restart: unless-stopped
    ports:
      - "80:80"        # HTTP traffic
      - "443:443"      # HTTPS traffic (if configured)
      - "8404:8404"    # Stats dashboard
    volumes:
      - ./haproxy.cfg:/usr/local/etc/haproxy/haproxy.cfg:ro
    sysctls:
      - net.ipv4.ip_unprivileged_port_start=0   # Allow non-root to bind port 80/443
    healthcheck:
      test: ["CMD", "haproxy", "-c", "-f", "/usr/local/etc/haproxy/haproxy.cfg"]
      interval: 30s
      timeout: 5s
      retries: 3

volumes: {}
```

Start HAProxy:

```bash
docker compose up -d
```

## Initial Setup

After starting, verify HAProxy is running:

```bash
docker compose logs haproxy
```

Open the stats dashboard at `http://your-server:8404/stats`. This shows real-time connection counts, server health, response times, and error rates for all frontends and backends.

Test proxying:

```bash
curl -H "Host: app1.example.com" http://localhost
```

## Configuration

### Config File Structure

HAProxy's configuration uses four main sections:

| Section | Purpose |
|---------|---------|
| `global` | Process-wide settings: logging, max connections, security |
| `defaults` | Inherited by all frontends/backends: mode, timeouts |
| `frontend` | Client-facing listeners: bind address, ACLs, routing rules |
| `backend` | Server pools: load balancing algorithm, health checks, servers |

You can also use `listen` blocks as a shorthand for combined frontend + backend.

### Adding a New Service

Add ACL rules to the `http_front` frontend and a new backend:

```cfg
# In frontend http_front, add:
    acl host_nextcloud hdr(host) -i nextcloud.example.com
    use_backend nextcloud_backend if host_nextcloud

# New backend:
backend nextcloud_backend
    balance roundrobin
    option httpchk GET /status.php
    http-check expect status 200
    server nextcloud nextcloud:80 check inter 30s
```

Validate and reload:

```bash
# Validate config
docker exec haproxy haproxy -c -f /usr/local/etc/haproxy/haproxy.cfg

# Graceful reload
docker kill -s HUP haproxy
```

### Load Balancing Algorithms

| Algorithm | Use Case |
|-----------|----------|
| `roundrobin` | Default, equal distribution across servers |
| `leastconn` | Routes to server with fewest active connections |
| `source` | Sticky sessions based on client IP |
| `uri` | Routes based on request URI (for caching) |

### Health Checks

HAProxy's health checks are far more advanced than most reverse proxies:

```cfg
backend web_servers
    option httpchk GET /health
    http-check expect status 200
    http-check expect header content-type contains application/json

    # Server goes down after 3 failed checks, up after 2 successful
    server web1 app1:8080 check inter 10s fall 3 rise 2
    server web2 app2:8080 check inter 10s fall 3 rise 2 backup  # Only used if web1 is down
```

## Advanced Configuration (Optional)

### SSL Termination

HAProxy can terminate SSL. Combine your certificate and key into a single PEM file:

```bash
cat fullchain.pem privkey.pem > /path/to/certs/app.example.com.pem
```

Update the frontend:

```cfg
frontend https_front
    bind *:443 ssl crt /usr/local/etc/haproxy/certs/
    http-request set-header X-Forwarded-Proto https

    # Redirect HTTP to HTTPS
    # (add this to the http_front frontend)
    # http-request redirect scheme https unless { ssl_fc }

    use_backend app1_backend if { hdr(host) -i app1.example.com }
    default_backend default_backend
```

Update Docker Compose to mount certificates:

```yaml
volumes:
  - ./haproxy.cfg:/usr/local/etc/haproxy/haproxy.cfg:ro
  - ./certs:/usr/local/etc/haproxy/certs:ro
```

HAProxy does not provision certificates automatically. Use Certbot or another ACME client externally.

### TCP Mode Proxying

For non-HTTP protocols (databases, MQTT, game servers):

```cfg
frontend tcp_postgres
    mode tcp
    bind *:5432
    default_backend postgres_servers

backend postgres_servers
    mode tcp
    balance roundrobin
    server pg1 postgres1:5432 check
    server pg2 postgres2:5432 check backup
```

### Rate Limiting

```cfg
frontend http_front
    # Stick table: track request rate per IP
    stick-table type ip size 100k expire 30s store http_req_rate(10s)
    http-request track-sc0 src
    http-request deny deny_status 429 if { sc_http_req_rate(0) gt 100 }
```

## Reverse Proxy

HAProxy IS the reverse proxy. For typical self-hosting setups, consider whether you actually need HAProxy's advanced features. [Caddy](/apps/caddy) and [Nginx Proxy Manager](/apps/nginx-proxy-manager) are simpler for basic reverse proxying with automatic HTTPS.

## Backup

Back up these files:

- `haproxy.cfg` — your entire configuration
- `certs/` — SSL certificates and keys (if using SSL termination)

HAProxy is stateless — there is no database to back up. Your config file is the only critical artifact. See [Backup Strategy](/foundations/backup-3-2-1-rule).

## Troubleshooting

### Container Fails to Start

**Symptom:** HAProxy exits immediately after starting.
**Fix:** HAProxy ships with no default config — you must provide `haproxy.cfg`. Validate your config: `docker run --rm -v ./haproxy.cfg:/usr/local/etc/haproxy/haproxy.cfg:ro haproxy:3.3.3 haproxy -c -f /usr/local/etc/haproxy/haproxy.cfg`

### No Logs Visible

**Symptom:** `docker compose logs` shows nothing from HAProxy.
**Fix:** HAProxy logs via syslog by default, which does not exist in the container. Add `log stdout format raw local0` to the `global` section. This requires HAProxy 1.9+ (not an issue with 3.3.x).

### 503 Service Unavailable

**Symptom:** HAProxy returns 503 for a backend.
**Fix:** All servers in the backend are marked as down. Check health checks — open the stats dashboard at `:8404/stats` to see server status. Verify the backend containers are running and reachable on the expected port.

### Permission Denied Binding Port 80

**Symptom:** HAProxy cannot bind to ports below 1024.
**Fix:** The Docker image runs as non-root user `haproxy`. Add `sysctls: [net.ipv4.ip_unprivileged_port_start=0]` to your Compose file, or use `cap_add: [NET_BIND_SERVICE]`.

### Real Client IP Not Visible

**Symptom:** Backend services see Docker's bridge IP instead of the real client IP.
**Fix:** Add `option forwardfor` to the `defaults` or `frontend` section. Your backend must read the `X-Forwarded-For` header. Alternatively, use `network_mode: host` (loses Docker network isolation).

## Resource Requirements

- **RAM:** 15-30 MB idle, 50-100 MB under moderate load
- **CPU:** Very low — HAProxy is extremely efficient
- **Disk:** ~100 MB for the Docker image, negligible for config

## Verdict

HAProxy is the most capable load balancer you can self-host. Its health checks, stick tables, rate limiting, and TCP proxying are best-in-class. But for most self-hosters running 5-20 services on a single server, **HAProxy is overkill.** The config syntax has a learning curve, there is no automatic HTTPS, and adding a new service requires editing config files and reloading.

Use HAProxy if you need production-grade load balancing, TCP proxying, or advanced traffic management. For standard HTTP reverse proxying with HTTPS, [Caddy](/apps/caddy) or [Nginx Proxy Manager](/apps/nginx-proxy-manager) are better choices. If you want config-as-code with Docker auto-discovery, [Traefik](/apps/traefik) is the closer competitor.

## FAQ

### How does HAProxy compare to Nginx for reverse proxying?

Both are production-grade. HAProxy has better load balancing, health checks, and TCP proxying. Nginx has better static file serving, caching, and HTTP feature support. For pure reverse proxying and load balancing, HAProxy is technically superior. For web serving plus proxying, Nginx is more versatile. See [Traefik vs HAProxy](/compare/traefik-vs-haproxy) for a modern comparison.

### Can HAProxy get Let's Encrypt certificates automatically?

Not natively. HAProxy can terminate SSL but does not provision certificates. Use Certbot or an ACME client externally and mount the certificates into the container.

### Is the stats dashboard secure?

By default, the stats frontend is accessible to anyone who can reach the port. In production, restrict access with `stats auth admin:password` or bind it only to localhost/internal networks.

## Related

- [How to Self-Host Nginx Proxy Manager](/apps/nginx-proxy-manager)
- [How to Self-Host Traefik with Docker](/apps/traefik)
- [How to Self-Host Caddy with Docker](/apps/caddy)
- [Traefik vs HAProxy](/compare/traefik-vs-haproxy)
- [Best Self-Hosted Reverse Proxy](/best/reverse-proxy)
- [Reverse Proxy Explained](/foundations/reverse-proxy-explained)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Docker Networking](/foundations/docker-networking)
- [Backup Strategy](/foundations/backup-3-2-1-rule)
