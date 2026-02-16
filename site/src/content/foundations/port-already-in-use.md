---
title: "Port Already In Use — How to Fix"
description: "Resolve port conflicts on your self-hosting server — find what's using a port, change Docker port mappings, and manage port allocation."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["networking", "ports", "troubleshooting", "docker", "foundations"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## The Port Conflict Problem

```
Error: Bind for 0.0.0.0:80 failed: port is already allocated
```

Two processes can't listen on the same port. When you start a new container and the port is already taken, Docker gives you this error. This guide shows you how to find what's using the port and resolve the conflict.

## Prerequisites

- Terminal access to your server ([SSH Setup](/foundations/ssh-setup))
- Docker installed ([Docker Compose Basics](/foundations/docker-compose-basics))

## Find What's Using the Port

### Method 1: ss (Recommended)

```bash
# Find what's listening on port 80
sudo ss -tlnp | grep :80

# Output example:
# LISTEN  0  511  0.0.0.0:80  0.0.0.0:*  users:(("nginx",pid=1234,fd=6))
```

The output shows the process name, PID, and bound address.

### Method 2: lsof

```bash
sudo lsof -i :80
```

### Method 3: Check Docker Specifically

```bash
# List all containers and their port mappings
docker ps --format "table {{.Names}}\t{{.Ports}}"

# Find which container uses a specific port
docker ps --format "{{.Names}}\t{{.Ports}}" | grep ":80"
```

## Resolving the Conflict

### Option 1: Change Your Port Mapping

The simplest fix. Change the **host** port (left side) — the container port (right side) stays the same.

```yaml
# Before — port 80 is taken
ports:
  - "80:80"

# After — use a different host port
ports:
  - "8080:80"
```

Access the service at `http://your-server:8080` instead.

### Option 2: Stop the Conflicting Process

If you don't need whatever is currently using the port:

```bash
# If it's a Docker container
docker stop container_name

# If it's a system service
sudo systemctl stop nginx  # or apache2, or whatever
sudo systemctl disable nginx  # Prevent it from starting on boot

# If it's a random process
sudo kill PID
```

### Option 3: Change the Conflicting Service's Port

If both services need to run, move the other one:

```bash
# Example: Move Apache from port 80 to port 8888
# Edit /etc/apache2/ports.conf
# Change: Listen 80 → Listen 8888
sudo systemctl restart apache2
```

## Common Port Conflicts

### Port 80 and 443

The most contested ports. These are HTTP and HTTPS defaults.

Common culprits:
- Apache2 or Nginx installed directly on the host
- Another reverse proxy container
- A CDN/tunnel agent (Cloudflare Tunnel)

**Best practice:** Only one reverse proxy should use ports 80 and 443. All other services go behind it.

```yaml
# Reverse proxy gets 80 and 443
services:
  npm:
    image: jc21/nginx-proxy-manager:2.11.1
    ports:
      - "80:80"
      - "443:443"
      - "81:81"

  # Other services don't publish to host ports
  nextcloud:
    expose:
      - "80"  # Only accessible on Docker network
```

### Port 53 (DNS)

If you run Pi-hole or AdGuard Home:

```bash
# systemd-resolved often uses port 53
sudo ss -tlnp | grep :53
# LISTEN  0  4096  127.0.0.53%lo:53  0.0.0.0:*  users:(("systemd-resolve",pid=xxx,fd=xx))
```

**Fix: Disable systemd-resolved's DNS stub listener:**

```bash
sudo tee /etc/systemd/resolved.conf.d/disable-stub.conf > /dev/null <<'EOF'
[Resolve]
DNSStubListener=no
EOF

sudo ln -sf /run/systemd/resolve/resolv.conf /etc/resolv.conf
sudo systemctl restart systemd-resolved
```

### Port 3000

Popular with many web apps (Grafana, Gitea, Ghost, etc.). If you run multiple apps that default to 3000:

```yaml
services:
  grafana:
    ports:
      - "3000:3000"
  gitea:
    ports:
      - "3001:3000"  # Different host port, same container port
  ghost:
    ports:
      - "3002:2368"  # Ghost uses 2368 internally
```

### Port 8080

Another common default. Portainer, Traefik dashboard, many Java apps use it.

```yaml
services:
  portainer:
    ports:
      - "9000:9000"
  traefik:
    ports:
      - "8080:8080"  # Dashboard
  myapp:
    ports:
      - "8081:8080"  # Remap to avoid conflict
```

### Port 5432 (PostgreSQL) and 3306 (MySQL)

Multiple apps often need their own database instance. You have two options:

**Option A: Share one database instance** (recommended when possible):

```yaml
services:
  db:
    image: postgres:16.2
    ports:
      - "5432:5432"
  app1:
    environment:
      DB_NAME: app1_db
  app2:
    environment:
      DB_NAME: app2_db
```

**Option B: Separate database instances with different host ports:**

```yaml
services:
  db-app1:
    image: postgres:16.2
    ports:
      - "5432:5432"
  db-app2:
    image: postgres:16.2
    ports:
      - "5433:5432"  # Different host port
```

## Port Mapping Quick Reference

```yaml
ports:
  # Standard mapping: HOST:CONTAINER
  - "8080:80"

  # Bind to specific interface only
  - "127.0.0.1:8080:80"    # Localhost only
  - "192.168.1.100:8080:80" # Specific interface

  # Random host port (Docker assigns one)
  - "80"  # Docker picks a free host port

  # UDP port
  - "53:53/udp"

  # Both TCP and UDP
  - "53:53/tcp"
  - "53:53/udp"
```

```yaml
# expose — no host port mapping, only Docker-internal
expose:
  - "8080"  # Accessible by other containers on the same network
```

## Port Planning Strategy

For a self-hosting server with many services, plan your ports:

| Port | Service | Protocol |
|------|---------|----------|
| 80 | Reverse proxy (HTTP) | TCP |
| 443 | Reverse proxy (HTTPS) | TCP |
| 53 | Pi-hole/AdGuard (DNS) | TCP/UDP |
| 81 | NPM admin UI | TCP |
| 51820 | WireGuard | UDP |
| 9090 | Portainer | TCP |

Everything else goes behind the reverse proxy — no public ports needed. The reverse proxy routes based on hostname:

```
app1.example.com → container:3000
app2.example.com → container:8080
app3.example.com → container:5000
```

This way, you only expose ports 80, 443, and a few non-HTTP services.

## FAQ

### Can I use the same port for TCP and UDP?

Yes. TCP and UDP are different protocols, so port 53/tcp and port 53/udp don't conflict. DNS (port 53) commonly uses both.

### I stopped the conflicting process but Docker still says the port is in use. Why?

The socket might be in `TIME_WAIT` state. Wait 60 seconds or use `SO_REUSEADDR`:

```bash
# Check for TIME_WAIT sockets
ss -tn | grep :8080

# Usually resolves itself within 60 seconds
```

Or Docker itself might still have the port bound from a previous container. Run `docker compose down` to fully release ports.

### Should I avoid using `host` network mode to prevent port conflicts?

`network_mode: host` makes the container share the host's network, so any port the container listens on directly conflicts with host services. Bridge networking (the default) avoids this because ports are only bound when explicitly mapped with `ports:`. Use bridge mode unless you have a specific reason for host networking.

### How do I see all ports in use on my server?

```bash
# All listening ports
sudo ss -tlnp    # TCP
sudo ss -ulnp    # UDP
sudo ss -tulnp   # Both
```

## Related

- [Ports Explained](/foundations/ports-explained)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Docker Networking](/foundations/docker-networking)
- [Docker Networking Issues](/foundations/docker-networking-issues)
- [Reverse Proxy Explained](/foundations/reverse-proxy-explained)
- [Firewall Setup](/foundations/firewall-ufw)
