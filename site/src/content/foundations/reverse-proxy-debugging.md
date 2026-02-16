---
title: "Reverse Proxy Troubleshooting"
description: "Fix reverse proxy problems — 502 Bad Gateway, SSL errors, WebSocket failures, header issues, and routing misconfigurations in NPM, Traefik, and Caddy."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["reverse-proxy", "troubleshooting", "nginx", "traefik", "caddy", "foundations"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Reverse Proxy Problems

A reverse proxy sits between the internet and your self-hosted services. When it breaks, everything behind it breaks. The symptoms are usually generic HTTP errors (502, 504, 503) that don't tell you much. This guide helps you diagnose the actual cause.

## Prerequisites

- A reverse proxy set up ([Reverse Proxy Explained](/foundations/reverse-proxy-explained))
- Terminal access to your server ([SSH Setup](/foundations/ssh-setup))
- Basic understanding of HTTP and DNS ([DNS Explained](/foundations/dns-explained))

## The Debugging Flow

Work through this sequence for any reverse proxy issue:

```
1. Can you reach the reverse proxy at all? (DNS + port 80/443)
2. Is the reverse proxy running? (container status)
3. Is the backend service running? (container status)
4. Can the reverse proxy reach the backend? (network connectivity)
5. Is the backend returning a valid response? (direct access)
6. Are headers/WebSocket/SSL configured correctly? (protocol issues)
```

## 502 Bad Gateway

The most common reverse proxy error. It means: "I reached the reverse proxy, but it couldn't get a response from the backend."

### Check Backend Is Running

```bash
# Is the backend container running?
docker compose ps

# Check backend logs
docker compose logs --tail=50 myapp
```

### Check Network Connectivity

```bash
# Can the reverse proxy container reach the backend?
docker exec reverse-proxy curl -I http://myapp:8080

# Are they on the same Docker network?
docker network inspect mynetwork
```

### Common Causes

**Wrong backend port:**

```yaml
# The backend listens on 3000, not 8080
# Check the app's documentation for the correct port
docker exec myapp ss -tlnp
# LISTEN  0  128  *:3000  *:*
```

**Wrong backend hostname:**

```yaml
# In NPM or your proxy config, use the Docker service name
# NOT localhost, NOT 127.0.0.1, NOT the container name
# Use the service name from docker-compose.yml
upstream: http://myapp:3000
```

**Backend on a different Docker network:**

```yaml
# Both the proxy and backend must share a network
services:
  proxy:
    networks:
      - proxy-network
  myapp:
    networks:
      - proxy-network

networks:
  proxy-network:
    external: true
```

**Backend crashed during request:**

```bash
# Check if the backend is crash-looping
docker compose ps
# If status shows "Restarting", check logs
docker compose logs --tail=100 myapp
```

## 504 Gateway Timeout

The reverse proxy reached the backend, but the backend took too long to respond.

### Increase Timeout

**Nginx Proxy Manager:**

In Advanced tab of the proxy host, add:

```nginx
proxy_read_timeout 300s;
proxy_connect_timeout 300s;
proxy_send_timeout 300s;
```

**Traefik:**

```yaml
# In the service's labels
labels:
  - "traefik.http.middlewares.timeout.buffering.maxResponseBodyBytes=0"
  - "traefik.http.services.myapp.loadbalancer.responseforwarding.flushinterval=100ms"
```

**Caddy:**

```
reverse_proxy myapp:8080 {
  transport http {
    dial_timeout 30s
    response_header_timeout 300s
  }
}
```

### Common Causes

- Large file uploads (increase `client_max_body_size` in Nginx)
- Slow database queries on the backend
- Backend is overloaded (check CPU/memory with `docker stats`)

## 503 Service Unavailable

The reverse proxy is running but has no healthy backend to forward to.

```bash
# Check if the backend health check is failing
docker compose ps
# "(unhealthy)" next to the service = health check failure

# Check health check logs
docker inspect myapp --format='{{json .State.Health}}' | jq
```

## SSL/TLS Errors

### "SSL_ERROR_RX_RECORD_TOO_LONG"

Your reverse proxy is sending HTTP on a port that the client expects HTTPS on. The proxy isn't terminating SSL.

Check that SSL is actually configured for this proxy host. In NPM, verify the SSL certificate is assigned to the proxy host.

### "ERR_SSL_PROTOCOL_ERROR"

The connection is reaching a non-SSL service on the SSL port. Make sure:
- Port 443 is mapped to the reverse proxy, not directly to a backend
- The reverse proxy has a valid certificate for this domain

### Backend Expects HTTPS

Some apps serve HTTPS internally. If your proxy forwards HTTP but the backend only accepts HTTPS:

**NPM:** Set the scheme to `https` in the proxy host details.

**Caddy:**

```
reverse_proxy https://myapp:8443 {
  transport http {
    tls_insecure_skip_verify
  }
}
```

**Traefik:**

```yaml
labels:
  - "traefik.http.services.myapp.loadbalancer.server.scheme=https"
```

See [SSL Certificate Troubleshooting](/foundations/ssl-certificate-issues) for certificate-specific problems.

## WebSocket Issues

Many self-hosted apps (Nextcloud Talk, Home Assistant, Gitea, etc.) use WebSockets. Symptoms of broken WebSocket support: real-time features don't work, the app loads but feels "dead," repeated reconnection attempts in the browser console.

### Nginx Proxy Manager

WebSocket support is a checkbox in the proxy host settings. Enable it.

If that's not enough, add to the Advanced tab:

```nginx
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

### Traefik

WebSocket support works automatically in Traefik — no extra config needed. If it doesn't work, the issue is elsewhere.

### Caddy

Caddy supports WebSockets automatically. No configuration needed.

### General WebSocket Debugging

```bash
# Test WebSocket connectivity
# Install websocat: cargo install websocat
websocat wss://myapp.example.com/ws

# Check if the upgrade header is being forwarded
curl -v -H "Upgrade: websocket" -H "Connection: Upgrade" https://myapp.example.com/ws
```

## Header Issues

### Application Shows Wrong URL or Protocol

The app thinks it's being accessed via HTTP when users access it via HTTPS, or the app generates URLs with the wrong hostname.

Your reverse proxy must forward these headers:

```
X-Forwarded-For: client_ip
X-Forwarded-Proto: https
X-Forwarded-Host: myapp.example.com
X-Real-IP: client_ip
```

**NPM:** Sends these by default. If the app still misbehaves, configure the app's "trusted proxy" or "base URL" setting.

**Traefik:** Sends these by default via the `X-Forwarded-*` headers.

**Caddy:** Sends these by default.

**Application-side config examples:**

```yaml
# Nextcloud
environment:
  OVERWRITEPROTOCOL: https
  TRUSTED_PROXIES: "172.16.0.0/12"

# Gitea
environment:
  ROOT_URL: https://git.example.com

# Many apps
environment:
  BASE_URL: https://myapp.example.com
```

### Client IP Shows as Docker Network IP

All requests show `172.x.x.x` as the client IP instead of the real client IP.

The app needs to trust the reverse proxy's `X-Forwarded-For` header. Configure the app to trust your proxy network:

```yaml
# Common patterns
TRUSTED_PROXIES: "172.16.0.0/12"  # Docker default range
# or
TRUSTED_PROXIES: "10.0.0.0/8,172.16.0.0/12,192.168.0.0/16"
```

## Upload Size Limits

### "413 Request Entity Too Large"

The reverse proxy is rejecting large uploads.

**Nginx/NPM:**

In the proxy host Advanced tab:

```nginx
client_max_body_size 10G;
```

Or set it globally in the NPM container:

```yaml
environment:
  CLIENT_MAX_BODY_SIZE: 10G
```

**Traefik:**

```yaml
labels:
  - "traefik.http.middlewares.large-upload.buffering.maxRequestBodyBytes=10737418240"
```

**Caddy:**

```
request_body {
  max_size 10GB
}
```

## Routing Issues

### Wrong Service Gets the Request

If `app1.example.com` shows `app2`'s content, your routing rules are wrong.

```bash
# Test which backend responds
curl -H "Host: app1.example.com" http://localhost
curl -H "Host: app2.example.com" http://localhost
```

**NPM:** Check that each proxy host has the correct domain and forwards to the correct container:port.

**Traefik:** Check Host() rules in labels:

```yaml
labels:
  - "traefik.http.routers.app1.rule=Host(`app1.example.com`)"
  - "traefik.http.routers.app2.rule=Host(`app2.example.com`)"
```

**Caddy:** Check your Caddyfile site blocks.

### Subpath Routing Not Working

Running an app at `example.com/myapp` instead of `myapp.example.com`:

Many self-hosted apps don't support subpath routing cleanly. Use subdomains where possible. If you must use subpaths:

1. Check if the app supports a base path / prefix configuration
2. Configure the reverse proxy to strip or add the prefix as needed
3. Test thoroughly — JavaScript assets and API calls often break with subpaths

## Debugging Commands

```bash
# Check reverse proxy logs
docker compose logs --tail=100 proxy

# Test backend directly (bypass proxy)
docker exec proxy curl -I http://backend:port

# Test DNS resolution from proxy container
docker exec proxy nslookup backend-service

# Check what ports the backend listens on
docker exec backend ss -tlnp

# Check Docker networks
docker network ls
docker network inspect mynetwork

# Test with curl and see all headers
curl -vvv https://myapp.example.com 2>&1
```

## FAQ

### Should I use Nginx Proxy Manager, Traefik, or Caddy?

NPM for simplicity (GUI-based, quick setup). Traefik for Docker-native auto-discovery (add labels, it just works). Caddy for clean config files and automatic HTTPS. All three work well for self-hosting. See [NPM Setup](/foundations/nginx-proxy-manager-setup), [Traefik Setup](/foundations/traefik-setup), and [Caddy Setup](/foundations/caddy-setup).

### Can I run multiple reverse proxies?

You can, but you shouldn't. One reverse proxy should handle all incoming traffic on ports 80 and 443. Running multiple causes port conflicts and certificate management headaches.

### My app works on port 8080 directly but not through the reverse proxy. Why?

The app works when you bypass the proxy, which means the issue is in the proxy configuration. Check: correct backend host and port, same Docker network, no SSL mismatch, correct headers being forwarded, and WebSocket support if needed.

### Do I need to open ports on my firewall for every service?

No. Only open ports 80 and 443 for the reverse proxy. Backend services don't need public ports — the proxy reaches them via the internal Docker network.

## Related

- [Reverse Proxy Explained](/foundations/reverse-proxy-explained)
- [Nginx Proxy Manager Setup](/foundations/nginx-proxy-manager-setup)
- [Traefik Setup](/foundations/traefik-setup)
- [Caddy Setup](/foundations/caddy-setup)
- [SSL Certificate Troubleshooting](/foundations/ssl-certificate-issues)
- [Docker Networking](/foundations/docker-networking)
- [DNS Debugging](/foundations/dns-debugging)
