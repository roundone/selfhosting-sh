---
title: "Docker Common Issues and Quick Fixes"
description: "Solutions to the most frequent Docker problems — image pulls, build failures, daemon errors, resource exhaustion, and container misconfiguration."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["docker", "troubleshooting", "debugging", "foundations"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## The Most Common Docker Problems

Docker issues fall into a few predictable categories. This guide covers the ones you'll hit most often when self-hosting, with direct fixes for each. For a broader diagnostic approach, see [Docker Troubleshooting](/foundations/docker-troubleshooting).

## Prerequisites

- Docker and Docker Compose installed ([Docker Compose Basics](/foundations/docker-compose-basics))
- Terminal access to your server ([SSH Setup](/foundations/ssh-setup))
- Basic familiarity with Linux commands ([Linux Basics](/foundations/linux-basics-self-hosting))

## Image Pull Failures

### "toomanyrequests" — Docker Hub Rate Limit

```
Error response from daemon: toomanyrequests: You have reached your pull rate limit.
```

Docker Hub limits anonymous pulls to 100 per 6 hours, and authenticated free accounts to 200.

```bash
# Log in to Docker Hub (free account doubles your limit)
docker login

# Check your remaining pulls
TOKEN=$(curl -s "https://auth.docker.io/token?service=registry.docker.io&scope=repository:library/alpine:pull" | jq -r '.token')
curl -s -H "Authorization: Bearer $TOKEN" -D - "https://registry-1.docker.io/v2/library/alpine/manifests/latest" 2>&1 | grep ratelimit
```

Better long-term fix: use images from alternative registries when available.

```yaml
# Instead of Docker Hub
image: postgres:16.2

# Use GitHub Container Registry
image: ghcr.io/immich-app/immich-server:v1.99.0

# Or LinuxServer.io registry
image: lscr.io/linuxserver/nextcloud:29.0.0
```

### "manifest unknown" — Image Tag Doesn't Exist

```
Error: manifest for myapp:v2.0 not found: manifest unknown
```

The tag you specified doesn't exist. Common causes:
- Typo in the version tag
- The tag was removed or renamed
- The image uses a different versioning scheme

```bash
# List available tags (Docker Hub)
curl -s "https://hub.docker.com/v2/repositories/library/nginx/tags/?page_size=10" | jq '.results[].name'

# For GitHub Container Registry
# Check the package page on GitHub directly
```

### "platform not supported" — Wrong Architecture

```
no matching manifest for linux/arm64/v8 in the manifest list
```

The image doesn't support your CPU architecture.

```bash
# Check your architecture
uname -m
# x86_64 = amd64, aarch64 = arm64

# Check image platforms
docker manifest inspect nginx:1.25 | jq '.manifests[].platform'
```

If the image doesn't support your architecture, look for alternative images or builds. LinuxServer.io images typically support both amd64 and arm64. See [Docker Multi-Architecture](/foundations/docker-multi-arch) for details.

## Container Startup Failures

### Environment Variable Misconfiguration

The most common reason self-hosted apps fail to start: missing or incorrect environment variables.

```bash
# Check what the container actually sees
docker exec mycontainer env | sort

# Verify Compose resolves variables correctly
docker compose config
```

Common mistakes:

```yaml
# WRONG — variable substitution without .env file
environment:
  - DB_PASSWORD=${SECRET_PASSWORD}  # Empty if .env is missing

# RIGHT — hardcode in Compose or ensure .env exists
environment:
  - DB_PASSWORD=change-me-please
```

```bash
# Check if your .env file is being read
# It must be in the same directory as docker-compose.yml
ls -la .env
```

See [Docker Environment Variables](/foundations/docker-environment-variables) for full details.

### Database Connection Refused

```
Connection refused: connect ECONNREFUSED 127.0.0.1:5432
```

Almost always caused by using `localhost` or `127.0.0.1` instead of the service name.

```yaml
services:
  app:
    image: myapp:v1.0
    environment:
      # WRONG
      # DB_HOST: localhost
      # DB_HOST: 127.0.0.1
      # RIGHT — use the Compose service name
      DB_HOST: db
  db:
    image: postgres:16.2
```

If the service name is correct, the database may not be ready yet:

```yaml
services:
  app:
    depends_on:
      db:
        condition: service_healthy
  db:
    image: postgres:16.2
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
```

### "exec format error"

```
exec /entrypoint.sh: exec format error
```

Architecture mismatch — you're running an image built for a different CPU. Pull the correct platform:

```bash
docker pull --platform linux/amd64 myimage:tag
```

## Resource Exhaustion

### Disk Space Full

```bash
# Check disk usage
df -h

# See what Docker is using
docker system df

# Detailed breakdown
docker system df -v
```

Clean up:

```bash
# Remove stopped containers, dangling images, unused networks
docker system prune

# Also remove unused images (not just dangling)
docker system prune -a

# Remove unused volumes (CAUTION: data loss)
docker volume prune
```

Prevent it:

```bash
# Add log rotation to daemon.json
sudo tee /etc/docker/daemon.json > /dev/null <<'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF
sudo systemctl restart docker
```

See [Container Logging](/foundations/container-logging) for log management strategies.

### Out of Memory (OOM) Kills

```bash
# Check if a container was OOM killed
docker inspect mycontainer --format='{{.State.OOMKilled}}'

# Check system memory
free -h

# Watch container memory usage
docker stats
```

Fix options:

```yaml
# Set memory limits to prevent one container from taking everything
services:
  myapp:
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

Or add swap to the host:

```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## Docker Daemon Issues

### Daemon Won't Start

```bash
# Check daemon status
sudo systemctl status docker

# Read daemon logs
sudo journalctl -u docker.service --since "30 minutes ago"

# Common fix: reset daemon config
sudo mv /etc/docker/daemon.json /etc/docker/daemon.json.bak
sudo systemctl restart docker
```

### Docker Socket Permission Denied

```
Got permission denied while trying to connect to the Docker daemon socket
```

```bash
# Add your user to the docker group
sudo usermod -aG docker $USER

# Apply without logging out
newgrp docker

# Verify
docker ps
```

### Docker Compose Not Found

```bash
# V2 is a Docker plugin, not a standalone binary
docker compose version

# If not installed, add the plugin
sudo apt install docker-compose-plugin

# DON'T use V1 (docker-compose with a hyphen) — it's deprecated
```

## Networking Gotchas

### Published Port Not Accessible Remotely

```bash
# Check how the port is bound
docker ps --format "table {{.Names}}\t{{.Ports}}"
```

If you see `127.0.0.1:8080->8080/tcp`, the port is only accessible from localhost.

```yaml
# WRONG — only accessible from the server itself
ports:
  - "127.0.0.1:8080:8080"

# RIGHT — accessible from any device on the network
ports:
  - "8080:8080"
```

Also check your firewall:

```bash
# UFW
sudo ufw status
sudo ufw allow 8080/tcp

# iptables
sudo iptables -L -n | grep 8080
```

See [Firewall Setup](/foundations/firewall-ufw) for firewall configuration.

### DNS Resolution Fails Inside Container

```bash
# Test from inside the container
docker exec mycontainer nslookup google.com

# If DNS fails, override DNS servers
```

```yaml
services:
  myapp:
    dns:
      - 1.1.1.1
      - 8.8.8.8
```

See [Docker Networking](/foundations/docker-networking) for a comprehensive networking guide.

## Volume and Data Issues

### Data Lost After Recreating Container

If you didn't mount a volume, data lived only inside the container's writable layer:

```yaml
# WRONG — no volume, data is ephemeral
services:
  mydb:
    image: postgres:16.2

# RIGHT — persist data with a volume
services:
  mydb:
    image: postgres:16.2
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

See [Docker Volumes](/foundations/docker-volumes) for volume management.

### Permission Denied on Volume Mounts

```bash
# Check the container's user ID
docker exec mycontainer id

# Match host directory ownership
sudo chown -R 1000:1000 /path/to/data
```

See [Docker Volume Permissions](/foundations/docker-volume-permissions) for detailed solutions.

## Quick Diagnostic Checklist

When something goes wrong, run through this:

```bash
# 1. Container running?
docker compose ps

# 2. What do the logs say?
docker compose logs --tail=50 servicename

# 3. Disk space OK?
df -h

# 4. Memory OK?
free -h

# 5. Network OK?
docker exec container ping -c 1 8.8.8.8

# 6. Config valid?
docker compose config

# 7. Recent Docker events?
docker events --since 10m
```

## FAQ

### Why does `docker compose restart` not pick up my config changes?

`restart` only stops and starts containers — it doesn't re-read `docker-compose.yml`. Use `docker compose up -d` to apply configuration changes. Add `--force-recreate` if the change is only in environment variables.

### How do I completely reset a container and start fresh?

```bash
docker compose down -v  # Stops containers AND removes volumes
docker compose up -d    # Fresh start
```

**Warning:** `-v` deletes all data in named volumes.

### My container works fine for hours then crashes. What's happening?

Usually memory exhaustion. Run `docker stats` and watch memory usage over time. Also check `dmesg | grep -i oom` on the host for OOM killer activity. Consider setting memory limits in your Compose file.

### Docker commands are very slow. Why?

Check disk I/O (`iostat -x 1`), Docker daemon health (`sudo systemctl status docker`), and whether the Docker directory is on a slow filesystem. Moving Docker's data directory to an SSD dramatically improves performance.

## Related

- [Docker Troubleshooting](/foundations/docker-troubleshooting)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Docker Networking](/foundations/docker-networking)
- [Docker Volumes](/foundations/docker-volumes)
- [Docker Environment Variables](/foundations/docker-environment-variables)
- [Docker Security](/foundations/docker-security)
- [Container Logging](/foundations/container-logging)
- [Linux Basics for Self-Hosting](/foundations/linux-basics-self-hosting)
