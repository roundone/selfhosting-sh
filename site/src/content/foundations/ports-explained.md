---
title: "Network Ports Explained for Self-Hosting"
description: "Understand network ports, common port numbers, Docker port mapping, and how to avoid conflicts when running multiple self-hosted services."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["networking", "ports", "docker", "foundations"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Are Network Ports?

Network ports are numbered endpoints (0–65535) that allow multiple services to share a single IP address. Think of your server's IP address as a building address and ports as apartment numbers — mail (traffic) goes to the right apartment (service) based on the number.

When you run self-hosted services, each one listens on a specific port. Your reverse proxy listens on 80 and 443, Portainer on 9443, Jellyfin on 8096. Understanding ports is essential for configuring Docker, firewalls, and reverse proxies.

## Prerequisites

- A Linux server ([Getting Started](/foundations/getting-started))
- Basic Docker knowledge ([Docker Compose Basics](/foundations/docker-compose-basics))

## Port Ranges

| Range | Name | Description |
|-------|------|-------------|
| 0–1023 | Well-known / System | Reserved for standard services (HTTP, HTTPS, SSH). Requires root/sudo to bind. |
| 1024–49151 | Registered / User | Assigned to specific applications by IANA. No root required. |
| 49152–65535 | Dynamic / Ephemeral | Used for temporary client connections. Your browser uses these. |

## Common Ports for Self-Hosting

| Port | Service | Protocol |
|------|---------|----------|
| 22 | SSH | TCP |
| 53 | DNS (Pi-hole, AdGuard Home) | TCP/UDP |
| 80 | HTTP | TCP |
| 443 | HTTPS | TCP |
| 3000 | Grafana, Gitea, many web UIs | TCP |
| 3306 | MySQL/MariaDB | TCP |
| 5432 | PostgreSQL | TCP |
| 5601 | Kibana | TCP |
| 6379 | Redis | TCP |
| 8080 | Alternative HTTP (many apps) | TCP |
| 8096 | Jellyfin | TCP |
| 8123 | Home Assistant | TCP |
| 8443 | Alternative HTTPS | TCP |
| 9000 | Portainer (legacy) | TCP |
| 9090 | Prometheus | TCP |
| 9443 | Portainer HTTPS | TCP |
| 27017 | MongoDB | TCP |
| 32400 | Plex | TCP |
| 51820 | WireGuard | UDP |

## Docker Port Mapping

Docker containers have their own network namespace. To access a containerized service from outside, you map a host port to a container port.

### In docker-compose.yml

```yaml
services:
  jellyfin:
    image: jellyfin/jellyfin:10.10.6
    ports:
      - "8096:8096"    # host_port:container_port
    restart: unless-stopped
```

The format is `HOST:CONTAINER`:
- `"8096:8096"` — host port 8096 maps to container port 8096
- `"8080:80"` — host port 8080 maps to container port 80
- `"127.0.0.1:8080:80"` — same, but only accessible from localhost

### Binding to Specific Interfaces

By default, Docker maps ports to `0.0.0.0` (all interfaces), making the service accessible from any network. To restrict access:

```yaml
ports:
  # Only accessible from localhost (use with reverse proxy)
  - "127.0.0.1:8080:80"

  # Only accessible from a specific interface
  - "192.168.1.100:8080:80"

  # Accessible from everywhere (default — same as no IP prefix)
  - "0.0.0.0:8080:80"
```

**Recommendation:** For services behind a reverse proxy, bind to `127.0.0.1`. The reverse proxy handles external access with HTTPS. This prevents users from bypassing the proxy and accessing the service directly on the mapped port.

### Port Conflicts

Two services cannot bind to the same host port. If you try, Docker gives an error:

```
Error: Bind for 0.0.0.0:8080 failed: port is already allocated
```

**Fix:** Change the host port (left side):

```yaml
services:
  app1:
    ports:
      - "8080:80"   # App 1 on host port 8080
  app2:
    ports:
      - "8081:80"   # App 2 on host port 8081 (different host port, same container port)
```

### Finding Port Conflicts

```bash
# What's using a specific port?
sudo ss -tlnp | grep :8080
# or
sudo lsof -i :8080

# List all Docker port mappings
docker ps --format "table {{.Names}}\t{{.Ports}}"

# List all listening ports on the host
sudo ss -tlnp
```

## TCP vs UDP

| Protocol | Use Case | Example Services |
|----------|----------|-----------------|
| TCP | Reliable, ordered delivery. Most services. | HTTP, SSH, databases, most web apps |
| UDP | Fast, no guarantee of delivery. | DNS, VPN (WireGuard), media streaming, game servers |

In Docker Compose, specify UDP explicitly:

```yaml
ports:
  - "51820:51820/udp"   # WireGuard — UDP only
  - "53:53/tcp"         # DNS over TCP
  - "53:53/udp"         # DNS over UDP
```

If you don't specify, Docker assumes TCP.

## Port Strategy for Self-Hosting

### Option 1: Reverse Proxy (Recommended)

Use a reverse proxy ([Nginx Proxy Manager](/apps/nginx-proxy-manager), Traefik, or Caddy) to route all traffic through ports 80 and 443. Each service gets a subdomain:

```
jellyfin.yourdomain.com → reverse proxy (443) → jellyfin container (8096)
gitea.yourdomain.com    → reverse proxy (443) → gitea container (3000)
grafana.yourdomain.com  → reverse proxy (443) → grafana container (3000)
```

Benefits:
- Only ports 80, 443, and 22 open on the firewall
- Automatic HTTPS with Let's Encrypt
- Clean URLs (no `:8096` in the address bar)
- Centralized access control

```yaml
# Services bind to localhost only
services:
  jellyfin:
    ports:
      - "127.0.0.1:8096:8096"
  gitea:
    ports:
      - "127.0.0.1:3000:3000"
```

### Option 2: Direct Port Access

For LAN-only services (no internet exposure), access them directly by port:

```
http://192.168.1.50:8096  — Jellyfin
http://192.168.1.50:3000  — Gitea
http://192.168.1.50:9090  — Prometheus
```

Simple but no HTTPS, and you need to remember port numbers.

### Port Allocation Plan

For a server running many services, keep a port allocation document:

```
# /opt/docs/port-allocation.txt
22    — SSH
80    — Reverse Proxy (HTTP)
443   — Reverse Proxy (HTTPS)
3000  — Gitea
5432  — PostgreSQL (localhost only)
8080  — Vaultwarden
8096  — Jellyfin
8123  — Home Assistant
9090  — Prometheus
9443  — Portainer
51820 — WireGuard (UDP)
```

## Checking Open Ports

### From Your Server

```bash
# All listening TCP ports
sudo ss -tlnp

# All listening UDP ports
sudo ss -ulnp

# Specific port
sudo ss -tlnp | grep :443

# With process names
sudo ss -tlnp
# State   Recv-Q  Send-Q  Local Address:Port  Peer Address:Port  Process
# LISTEN  0       511     0.0.0.0:443         0.0.0.0:*          users:(("nginx",pid=1234))
```

### From Outside Your Server

```bash
# Check if a port is open from another machine
nc -zv your-server-ip 443

# Scan common ports (install nmap first)
nmap -p 22,80,443,8080,8096 your-server-ip
```

## Firewall and Ports

Your firewall should only allow ports you explicitly need. Use [UFW](/foundations/firewall-ufw) to manage:

```bash
# Allow only necessary ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 51820/udp # WireGuard

# Block everything else (default deny)
sudo ufw default deny incoming
sudo ufw enable
```

**Important:** Docker bypasses UFW by default because it manipulates iptables directly. If you map a port in Docker, it's accessible even if UFW blocks it. Solutions:

1. Bind Docker ports to `127.0.0.1` (recommended)
2. Set `DOCKER_IPTABLES=false` in `/etc/default/docker` (breaks some Docker networking)
3. Use `ufw-docker` utility to manage Docker port rules

## Common Mistakes

### 1. Not Realizing Docker Bypasses UFW

You set up UFW to block port 8080, but your Docker container on port 8080 is still accessible from the internet. Docker manages its own iptables rules. Bind to `127.0.0.1` to fix this.

### 2. Conflicting Port Assignments

Running two services on the same port. Keep a port allocation list and check `sudo ss -tlnp` before assigning ports.

### 3. Exposing Database Ports to the Internet

Never expose database ports (3306, 5432, 6379, 27017) to the internet. Either:
- Don't map them at all (containers communicate via Docker networks)
- Bind to `127.0.0.1` only

```yaml
# Good — only accessible from localhost and Docker network
ports:
  - "127.0.0.1:5432:5432"

# Better — don't expose at all, use Docker network
# (no ports section, other containers connect via service name)
```

### 4. Using Port 80/443 Without a Reverse Proxy

Running a single app directly on 80/443 works until you add a second service. Start with a reverse proxy from day one — it's less work than migrating later.

### 5. Forgetting UDP for DNS and VPN

DNS and WireGuard use UDP. If you only allow TCP in your firewall, these services won't work:

```bash
# DNS needs both
sudo ufw allow 53/tcp
sudo ufw allow 53/udp

# WireGuard is UDP only
sudo ufw allow 51820/udp
```

## FAQ

### Can two Docker containers use the same container port?

Yes. Container ports are isolated. Two containers can both listen on port 80 internally — you just map them to different host ports (`8080:80` and `8081:80`).

### Why can't I bind to port 80 without sudo?

Ports below 1024 are privileged and require root access. Docker runs as root by default, so it can bind to any port. For non-Docker services, use `sudo` or `setcap` to grant the capability.

### How do I find which port a Docker container uses?

Check the image's documentation, or inspect the container: `docker inspect <container> | grep -A 5 ExposedPorts`. The `docker ps` command also shows current port mappings.

### Should I change SSH from port 22?

Changing SSH to a non-standard port (e.g., 2222) reduces automated scanning noise but isn't real security. Use key-based authentication and [fail2ban](/foundations/fail2ban) instead — those actually prevent unauthorized access.

### What happens if I run out of ports?

You have 65,535 ports available. You'll run out of RAM and CPU long before you run out of ports. Use a reverse proxy so most services only need internal Docker network access, not a mapped host port.

## Next Steps

- [Reverse Proxy Explained](/foundations/reverse-proxy-explained) — route all traffic through one entry point
- [Firewall Setup with UFW](/foundations/firewall-ufw) — control which ports are accessible
- [Docker Networking](/foundations/docker-networking) — how containers communicate

## Related

- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Docker Networking](/foundations/docker-networking)
- [Reverse Proxy Explained](/foundations/reverse-proxy-explained)
- [Firewall Setup with UFW](/foundations/firewall-ufw)
- [DNS Explained](/foundations/dns-explained)
- [Getting Started with Self-Hosting](/foundations/getting-started)
