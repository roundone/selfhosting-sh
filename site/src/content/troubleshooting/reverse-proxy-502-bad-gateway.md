---
title: "Reverse Proxy 502 Bad Gateway: Causes and Fixes"
description: "Diagnose and fix 502 Bad Gateway errors when using Nginx Proxy Manager, Traefik, Caddy, or HAProxy with Docker containers."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "reverse-proxy"
apps:
  - nginx-proxy-manager
  - traefik
  - caddy
tags: ["troubleshooting", "reverse-proxy", "502", "bad-gateway", "nginx"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## The Problem

You have set up a reverse proxy — Nginx Proxy Manager, Traefik, or Caddy — in front of your self-hosted application. When you visit your domain, you get a `502 Bad Gateway` error instead of your application.

A 502 means the reverse proxy reached your server successfully but failed to get a valid response from the backend application. The proxy is working. The problem is the connection **between** the proxy and your application container.

This guide covers every common cause and the exact fix for each, across all major reverse proxies.

---

## Quick Diagnostic Checklist

Run through these checks in order. Most 502 errors are caused by the first three items.

```bash
# 1. Is the backend container actually running?
docker ps | grep <container_name>

# 2. Can you reach the container directly (bypassing the proxy)?
curl -v http://localhost:<host_port>

# 3. Are the proxy and backend on the same Docker network?
docker network inspect <network_name>

# 4. What does the proxy's error log say?
docker compose logs <proxy_service> | tail -50

# 5. What does the backend's log say?
docker compose logs <backend_service> | tail -50
```

The logs are the single most important diagnostic tool. Read them before changing anything.

---

## Cause 1: Backend Container Not Running

### Symptom

The proxy returns 502 immediately — no delay, no loading. Backend container shows `Exited` status.

### Diagnosis

```bash
docker ps -a | grep <container_name>
```

If the container is not listed or shows `Exited`:

```bash
docker compose logs <service_name> | tail -30
```

### Fix

Start the container:

```bash
docker compose up -d <service_name>
```

If it exits immediately, the application is crashing on startup. Check the logs for the root cause — missing environment variables, database connection failures, or permission errors are the usual culprits. See [Docker Compose Common Errors](/troubleshooting/docker-compose-common-errors) for detailed fixes.

Add `restart: unless-stopped` to every service so containers recover from transient failures:

```yaml
services:
  myapp:
    image: someapp:v1.2.3
    restart: unless-stopped
```

---

## Cause 2: Wrong Target Port

This is the most common cause of 502 errors. The reverse proxy is connecting to the wrong port inside the container.

### Symptom

The proxy returns 502 after a brief connection attempt. Backend container is running and healthy.

### The Mistake

You configure the proxy to forward traffic to port `8080`, but the application inside the container listens on port `3000`. Or you use the **host** port mapping instead of the **container** port.

```yaml
services:
  myapp:
    image: someapp:v1.2.3
    ports:
      - "9090:3000"   # Host port 9090 maps to container port 3000
```

If your reverse proxy runs inside Docker on the same network as the backend, it must connect to the **container port** (3000), not the host port (9090). The host port is only relevant when accessing the container from outside Docker.

### Fix for Nginx Proxy Manager

In the proxy host configuration:
- **Forward Hostname / IP:** Use the container name (e.g., `myapp`) or the service name from the Compose file
- **Forward Port:** Use the **container port** (3000 in the example above, not 9090)

### Fix for Traefik

```yaml
services:
  myapp:
    image: someapp:v1.2.3
    labels:
      - "traefik.http.services.myapp.loadbalancer.server.port=3000"
    # The port label must match the port the application listens on INSIDE the container
```

Traefik auto-detects ports in some cases, but when a container exposes multiple ports or uses a non-standard port, you must specify it explicitly with the label above.

### Fix for Caddy

In your Caddyfile:

```
myapp.example.com {
    reverse_proxy myapp:3000
}
```

Use the container name and the **container port**.

### How to Find the Correct Port

Check the application's documentation or Dockerfile:

```bash
# Check what ports the container exposes
docker inspect <container_name> | grep -A 5 "ExposedPorts"

# Check what port the application is actually listening on inside the container
docker exec <container_name> ss -tlnp
```

---

## Cause 3: Docker Network Mismatch

### Symptom

The proxy returns 502. Both containers are running. Curl from the proxy container to the backend fails with `connection refused` or `could not resolve host`.

### The Cause

The reverse proxy container and the backend container are on different Docker networks. Containers can only communicate with each other if they share at least one network.

By default, each `docker compose up` creates its own isolated network named `<project>_default`. If your proxy and your application are in separate Compose files, they are on separate networks and cannot see each other.

### Diagnosis

```bash
# Check what networks the proxy is on
docker inspect <proxy_container> --format '{{range $k, $v := .NetworkSettings.Networks}}{{$k}} {{end}}'

# Check what networks the backend is on
docker inspect <backend_container> --format '{{range $k, $v := .NetworkSettings.Networks}}{{$k}} {{end}}'
```

If they do not share any network name, that is the problem.

### Fix

Create a shared external network and connect both stacks to it.

**Step 1: Create the network.**

```bash
docker network create proxy_network
```

**Step 2: Add it to your reverse proxy Compose file.**

```yaml
# proxy/docker-compose.yml
services:
  nginx-proxy-manager:
    image: jc21/nginx-proxy-manager:2.11.3
    networks:
      - proxy_network
      - default

networks:
  proxy_network:
    external: true
```

**Step 3: Add it to your application Compose file.**

```yaml
# myapp/docker-compose.yml
services:
  myapp:
    image: someapp:v1.2.3
    networks:
      - proxy_network
      - default

networks:
  proxy_network:
    external: true
```

Both containers are now on `proxy_network` and can communicate using their service names as hostnames.

**Important:** Keep `default` in the networks list alongside `proxy_network`. Internal services like databases should stay on the default network only (not exposed to the proxy network). Only the service that needs proxy access should be on `proxy_network`.

For a full explanation of Docker networking concepts, see [Docker Networking](/foundations/docker-networking).

---

## Cause 4: Container Using Host Networking vs Bridge

### Symptom

The proxy works for some containers but not for one that uses `network_mode: host`.

### The Cause

A container using `network_mode: host` bypasses Docker's network stack entirely. It listens directly on the host's network interfaces. This means:

- It is NOT on any Docker network
- Other containers cannot reach it by container name
- The proxy must connect to it via the **host's IP address**, not a container name

### Fix

**Option A (recommended): Stop using host networking.** Remove `network_mode: host` and use normal bridge networking. This is almost always the right approach.

**Option B: Point the proxy to the host IP.** If the application requires host networking (rare, but some apps like Pi-hole or Home Assistant benefit from it), configure the proxy to connect to the Docker host IP:

For Nginx Proxy Manager:
- Forward Hostname: `172.17.0.1` (default Docker host IP) or your server's LAN IP
- Forward Port: The port the application listens on

For Traefik or Caddy, use the same host IP instead of a container name.

Find the Docker host IP from inside a container:

```bash
docker exec <proxy_container> getent hosts host.docker.internal
```

If `host.docker.internal` does not resolve (it is not available on all Linux setups), use:

```bash
ip -4 addr show docker0 | grep inet | awk '{print $2}' | cut -d/ -f1
```

This is typically `172.17.0.1`.

---

## Cause 5: SSL/TLS Mismatch

### Symptom

The proxy returns 502. Logs show SSL-related errors such as:

**Nginx/NPM:**
```
upstream prematurely closed connection while reading response header from upstream
```
or
```
SSL_do_handshake() failed
```

**Traefik:**
```
502 Bad Gateway: dial tcp <ip>:<port>: connect: connection refused
```

**Caddy:**
```
dial tcp <ip>:443: connect: connection refused
```

### The Cause

The proxy is sending HTTPS to a backend that only speaks HTTP, or vice versa. Most Docker applications listen on plain HTTP internally — SSL termination happens at the proxy layer.

### Fix for Nginx Proxy Manager

In the proxy host configuration, under the **Details** tab:
- If the backend serves HTTP (the default for most apps), make sure **"Scheme"** is set to `http`, not `https`
- Only set it to `https` if the application explicitly provides its own TLS certificate and listens on HTTPS

### Fix for Traefik

By default, Traefik connects to backends over HTTP. If your backend serves HTTPS:

```yaml
labels:
  - "traefik.http.services.myapp.loadbalancer.server.scheme=https"
  - "traefik.http.serversTransports.myapp.insecureSkipVerify=true"  # If using self-signed cert
```

But the correct fix is almost always to configure the backend to serve plain HTTP and let Traefik handle TLS.

### Fix for Caddy

```
myapp.example.com {
    reverse_proxy http://myapp:3000
}
```

Explicitly specify `http://` if the backend serves plain HTTP. Caddy may try HTTPS by default for some configurations.

If the backend does serve HTTPS with a self-signed certificate:

```
myapp.example.com {
    reverse_proxy https://myapp:443 {
        transport http {
            tls_insecure_skip_verify
        }
    }
}
```

---

## Cause 6: Backend Timeout

### Symptom

The proxy returns 502 after a delay (10-60 seconds). The backend is doing something slow — large file uploads, database migrations, heavy computation.

**Nginx/NPM logs:**
```
upstream timed out (110: Connection timed out) while reading response header from upstream
```

**Traefik logs:**
```
502 Bad Gateway: context deadline exceeded
```

### The Cause

The proxy has a timeout for how long it waits for a response from the backend. If the backend takes longer than this timeout, the proxy gives up and returns 502.

### Fix for Nginx Proxy Manager

NPM uses Nginx underneath. Add custom Nginx configuration via the **Advanced** tab of the proxy host:

```nginx
proxy_connect_timeout 300;
proxy_send_timeout 300;
proxy_read_timeout 300;
send_timeout 300;
```

This sets all timeouts to 300 seconds (5 minutes). Adjust as needed.

### Fix for Traefik

Add timeout configuration to your Traefik static configuration:

```yaml
# traefik.yml
entryPoints:
  web:
    address: ":80"
    transport:
      respondingTimeouts:
        readTimeout: 300s
        writeTimeout: 300s
        idleTimeout: 180s
```

Or per-service via labels:

```yaml
labels:
  - "traefik.http.middlewares.timeout.buffering.maxResponseBodyBytes=0"
```

### Fix for Caddy

```
myapp.example.com {
    reverse_proxy myapp:3000 {
        transport http {
            read_timeout 300s
            write_timeout 300s
        }
    }
}
```

---

## Cause 7: DNS Resolution Failure

### Symptom

The proxy returns 502. Logs show the container name could not be resolved:

**Nginx/NPM:**
```
no resolver defined to resolve myapp
```
or
```
host not found in upstream "myapp"
```

**Traefik:**
```
dial tcp: lookup myapp: no such host
```

### The Cause

The proxy cannot resolve the backend container's hostname. This happens when:

1. The containers are not on the same Docker network (see Cause 3)
2. The container name or service name is misspelled
3. Nginx cached a stale DNS entry (Nginx resolves DNS at startup and caches it)

### Fix

**For network issues:** Ensure both containers share a Docker network (see Cause 3).

**For typos:** Verify the exact service name. Docker Compose uses the service name as the DNS hostname, not the `container_name`:

```yaml
services:
  my-cool-app:           # THIS is the DNS hostname
    image: someapp:v1.2.3
    container_name: app   # This is NOT the DNS hostname for other containers
```

Use `my-cool-app` in your proxy configuration, not `app`.

**For Nginx DNS caching:** Add a resolver directive. In NPM, add to the Advanced tab:

```nginx
resolver 127.0.0.11 valid=10s;
set $upstream myapp;
proxy_pass http://$upstream:3000;
```

`127.0.0.11` is Docker's embedded DNS server. The `valid=10s` parameter forces re-resolution every 10 seconds, preventing stale entries when containers restart with new IPs.

---

## Cause 8: Application Not Listening on 0.0.0.0

### Symptom

The proxy returns 502. The application is running and you can access it via `curl http://localhost:<port>` from inside the container. But other containers (including the proxy) cannot connect.

### The Cause

The application is binding to `127.0.0.1` (localhost only) instead of `0.0.0.0` (all interfaces). When bound to localhost, the application only accepts connections originating from inside the same container. Connections from other containers — including your reverse proxy — are refused because they arrive on the container's network interface, not the loopback interface.

### Diagnosis

```bash
# Check what address the application is listening on
docker exec <container_name> ss -tlnp
```

Look at the local address column:

```
State  Recv-Q Send-Q Local Address:Port  Peer Address:Port
LISTEN 0      128    127.0.0.1:3000      0.0.0.0:*          # BAD — localhost only
LISTEN 0      128    0.0.0.0:3000        0.0.0.0:*          # GOOD — all interfaces
```

### Fix

Configure the application to listen on `0.0.0.0` instead of `127.0.0.1`. This is usually an environment variable or config option:

```yaml
services:
  myapp:
    image: someapp:v1.2.3
    environment:
      - HOST=0.0.0.0        # Common variable names
      # or
      - BIND_ADDRESS=0.0.0.0
      # or
      - LISTEN_ADDR=0.0.0.0
```

Check the application's documentation for the specific variable name. Common patterns:

| Application | Variable | Value |
|-------------|----------|-------|
| Node.js apps | `HOST` | `0.0.0.0` |
| Go apps | `LISTEN_ADDR` or `BIND` | `0.0.0.0:PORT` |
| Python/Flask | `FLASK_RUN_HOST` | `0.0.0.0` |
| Rails | `BINDING` | `0.0.0.0` |
| Vaultwarden | `ROCKET_ADDRESS` | `0.0.0.0` |

---

## Proxy-Specific Debugging

### Nginx Proxy Manager

**Check logs:**

```bash
docker compose logs nginx-proxy-manager | grep -i error | tail -20
```

**Verify proxy host configuration:**

Log in to the NPM web UI (default port 81). Go to **Proxy Hosts** and check:
- Scheme matches backend (http vs https)
- Forward Hostname is the **Docker service name**, not `localhost`
- Forward Port is the **container port**, not the host port

**Test connectivity from inside the NPM container:**

```bash
docker exec -it <npm_container> bash
curl -v http://myapp:3000
```

If this returns the application's response, the problem is in NPM's configuration. If it fails, the problem is networking.

### Traefik

**Check logs:**

```bash
docker compose logs traefik | grep -i "502\|error\|myapp" | tail -20
```

**Verify Traefik sees the service:**

Open the Traefik dashboard (default port 8080) and check:
- Your service appears under **HTTP Services**
- The server URL and port are correct
- The service shows as healthy

**Common Traefik label issues:**

```yaml
labels:
  # WRONG — missing the router definition
  - "traefik.http.services.myapp.loadbalancer.server.port=3000"

  # CORRECT — need both router and service
  - "traefik.enable=true"
  - "traefik.http.routers.myapp.rule=Host(`myapp.example.com`)"
  - "traefik.http.routers.myapp.entrypoints=websecure"
  - "traefik.http.routers.myapp.tls.certresolver=letsencrypt"
  - "traefik.http.services.myapp.loadbalancer.server.port=3000"
```

### Caddy

**Check logs:**

```bash
docker compose logs caddy | grep -i "502\|error\|myapp" | tail -20
```

**Test Caddy configuration:**

```bash
docker exec <caddy_container> caddy validate --config /etc/caddy/Caddyfile
```

**Common Caddyfile issues:**

```
# WRONG — using localhost (which is Caddy's own localhost, not the backend)
myapp.example.com {
    reverse_proxy localhost:3000
}

# CORRECT — use the Docker service name
myapp.example.com {
    reverse_proxy myapp:3000
}
```

---

## Prevention

1. **Use a shared Docker network from the start.** Create a `proxy_network` before deploying anything, and connect all proxied services to it. This eliminates the most common 502 cause.

2. **Always use container ports in proxy config.** Never reference host port mappings. If using a reverse proxy, you often do not even need `ports:` in your application's Compose file.

3. **Add health checks.** Configure health checks on your backend services so the proxy (especially Traefik, which supports this natively) knows when a backend is ready.

4. **Increase timeouts proactively.** The default 60-second timeout is too short for many self-hosted apps, especially during initial setup or migration imports. Set 300 seconds as a starting point.

5. **Check logs first, change config second.** The error log tells you exactly what went wrong. Changing proxy settings without reading the log is guessing.

## Related

- [Reverse Proxy Setup](/foundations/reverse-proxy)
- [Docker Networking](/foundations/docker-networking)
- [Docker Compose Common Errors](/troubleshooting/docker-compose-common-errors)
- [How to Self-Host Nginx Proxy Manager](/apps/nginx-proxy-manager)
- [How to Self-Host Traefik](/apps/traefik)
- [How to Self-Host Caddy](/apps/caddy)
- [Getting Started with Self-Hosting](/foundations/getting-started)
