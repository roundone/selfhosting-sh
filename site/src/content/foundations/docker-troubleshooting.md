---
title: "Docker Troubleshooting Guide"
description: "Fix common Docker and Docker Compose problems — container won't start, port conflicts, permission errors, networking issues, and more."
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

## Docker Troubleshooting Approach

When a Docker container misbehaves, diagnose systematically:

1. **Check container status** — is it running, restarting, or exited?
2. **Read the logs** — the answer is almost always in the logs
3. **Check resource constraints** — disk, memory, CPU
4. **Verify configuration** — environment variables, volumes, networks
5. **Test in isolation** — remove complexity to find the cause

## Prerequisites

- Docker and Docker Compose installed ([Docker Compose Basics](/foundations/docker-compose-basics/))
- SSH access to your server ([SSH Setup Guide](/foundations/ssh-setup/))

## Container Won't Start

### Check Status First

```bash
# See all containers (including stopped)
docker ps -a

# Check a specific Compose stack
docker compose ps
```

Status meanings:

| Status | Meaning |
|--------|---------|
| `Up X minutes` | Running normally |
| `Up X minutes (healthy)` | Running and health check passes |
| `Up X minutes (unhealthy)` | Running but health check fails |
| `Restarting (X) Y seconds ago` | Crash loop — starts and immediately crashes |
| `Exited (0)` | Stopped cleanly (manual stop or completed task) |
| `Exited (1)` | Crashed with error |
| `Exited (137)` | Killed (OOM or manual kill) |
| `Created` | Created but never started |

### Read the Logs

```bash
# Last 100 lines of logs
docker compose logs --tail=100 myservice

# Follow logs in real time
docker compose logs -f myservice

# Logs from a specific container (not Compose)
docker logs --tail=100 container_name

# Logs with timestamps
docker compose logs -t --tail=100 myservice
```

### Common Startup Errors

#### "port is already allocated"

```
Error: Bind for 0.0.0.0:8080 failed: port is already allocated
```

Another process is using that port.

```bash
# Find what's using the port
sudo ss -tlnp | grep :8080

# If it's another container
docker ps --format "{{.Names}} {{.Ports}}" | grep 8080

# Fix: change the host port in docker-compose.yml
ports:
  - "8081:8080"  # Use a different host port
```

#### "no space left on device"

```bash
# Check disk space
df -h

# Check Docker's disk usage
docker system df

# Clean up unused Docker objects
docker system prune -a
docker volume prune  # WARNING: removes unused volumes
```

#### "exec format error"

```
exec /usr/local/bin/docker-entrypoint.sh: exec format error
```

You're running an image built for a different CPU architecture (e.g., ARM image on x86 or vice versa).

```bash
# Check your architecture
uname -m
# x86_64 = amd64, aarch64 = arm64

# Check the image's architecture
docker inspect myimage | grep Architecture

# Fix: use an image that supports your architecture
# Most popular images support both amd64 and arm64
```

#### "OCI runtime create failed"

Usually a Docker daemon issue:

```bash
# Restart Docker
sudo systemctl restart docker

# Check Docker daemon logs
journalctl -u docker.service --since "10 minutes ago"
```

## Permission Denied Errors

The #1 issue in self-hosted Docker setups.

### Inside the Container

```
Error: EACCES: permission denied, open '/data/config.json'
```

The container process doesn't have permission to read/write the mounted volume.

```bash
# Check what user the container runs as
docker exec mycontainer id
# uid=1000(appuser) gid=1000(appuser)

# Check host directory ownership
ls -ln /opt/myapp/data/
# If UID doesn't match, fix it:
sudo chown -R 1000:1000 /opt/myapp/data/
```

For LinuxServer.io containers:
```yaml
environment:
  - PUID=1000
  - PGID=1000
```

See [Linux File Permissions](/foundations/linux-permissions/) for a deep dive.

### Docker Socket Permission Denied

```
Got permission denied while trying to connect to the Docker daemon socket
```

Your user isn't in the `docker` group:

```bash
sudo usermod -aG docker $USER
# Log out and back in for group change to take effect
```

## Networking Issues

### Container Can't Reach the Internet

```bash
# Test from inside the container
docker exec mycontainer ping -c 3 8.8.8.8     # IP connectivity
docker exec mycontainer ping -c 3 google.com   # DNS resolution

# If IP works but DNS doesn't — DNS issue
# Check Docker's DNS config
docker exec mycontainer cat /etc/resolv.conf
```

Fix DNS issues:

```yaml
# In docker-compose.yml — add custom DNS
services:
  myapp:
    dns:
      - 1.1.1.1
      - 8.8.8.8
```

Or fix at the Docker daemon level:

```json
// /etc/docker/daemon.json
{
  "dns": ["1.1.1.1", "8.8.8.8"]
}
```

```bash
sudo systemctl restart docker
```

### Container Can't Reach Another Container

Containers on the same Docker Compose network can reach each other by service name:

```yaml
services:
  app:
    image: myapp:v1.0
    environment:
      - DB_HOST=db    # Use the service name, not localhost
  db:
    image: postgres:16.2
```

If it doesn't work:

```bash
# Check they're on the same network
docker network inspect myapp_default

# Test DNS resolution between containers
docker exec app ping db

# Check the service is listening
docker exec db ss -tlnp
```

Common causes:
- Using `localhost` instead of the service name (containers have separate network namespaces)
- Containers on different Docker networks
- Service hasn't finished starting yet (add `depends_on` with health checks)

### Can't Access Service from Host Browser

```bash
# Check the port mapping
docker ps --format "{{.Names}} {{.Ports}}"

# If bound to 127.0.0.1, only accessible from localhost
# 127.0.0.1:8080->8080/tcp  — only from server itself
# 0.0.0.0:8080->8080/tcp    — from any device on the network

# Check the service is actually listening inside the container
docker exec mycontainer ss -tlnp
```

## Container Keeps Restarting

```bash
# Check restart count and last exit code
docker inspect mycontainer --format='{{.RestartCount}} restarts, last exit: {{.State.ExitCode}}'

# Check logs from the latest crash
docker compose logs --tail=50 myservice

# Stop the restart loop temporarily to investigate
docker compose stop myservice

# Run interactively to see the error
docker compose run --rm myservice sh
```

### Exit Code Reference

| Code | Meaning | Common Cause |
|------|---------|-------------|
| 0 | Clean exit | Normal shutdown, one-shot task completed |
| 1 | Application error | Config error, missing dependency |
| 2 | Shell misuse | Wrong command syntax |
| 126 | Not executable | Permission issue on entrypoint |
| 127 | Command not found | Wrong entrypoint/cmd path |
| 137 | Killed (SIGKILL) | Out of memory (OOM killed) |
| 139 | Segfault (SIGSEGV) | Application crash, bad memory access |
| 143 | Terminated (SIGTERM) | Normal stop signal |

### Exit Code 137: Out of Memory

```bash
# Check if Docker killed it for using too much memory
docker inspect mycontainer --format='{{.State.OOMKilled}}'
# true = container was OOM killed

# Check system memory
free -h

# Check container memory usage before it crashes
docker stats mycontainer

# Fix: increase memory or add swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## Docker Compose Issues

### "service 'x' depends on 'y' which is undefined"

Check for typos in service names. Service names in `depends_on` must match exactly.

### "yaml: line X: did not find expected key"

YAML syntax error. Common causes:
- Tabs instead of spaces (YAML requires spaces)
- Inconsistent indentation
- Missing quotes around special characters

```bash
# Validate your Compose file
docker compose config
```

### Environment Variables Not Working

```bash
# Check what values Docker Compose resolves
docker compose config

# If ${VAR} shows as empty, check your .env file
cat .env

# Verify the variable is set inside the container
docker exec mycontainer env | grep MY_VAR
```

Remember: `docker compose restart` does NOT re-read environment variables. Use `docker compose up -d --force-recreate`.

## Image Issues

### Can't Pull Image

```bash
# Rate limited by Docker Hub
# Error: toomanyrequests: You have reached your pull rate limit

# Fix: log in to Docker Hub (free account gets more pulls)
docker login

# Or use an alternative registry
# GitHub Container Registry: ghcr.io/
# LinuxServer.io: lscr.io/
```

### Wrong Image Architecture

```bash
# Check available platforms for an image
docker manifest inspect --verbose myimage:tag | grep architecture

# Pull for a specific platform
docker pull --platform linux/amd64 myimage:tag
```

## Diagnostic Commands Cheat Sheet

```bash
# Container status
docker ps -a
docker compose ps

# Logs
docker compose logs --tail=100 service
docker compose logs -f service

# Resource usage
docker stats
docker system df

# Network inspection
docker network ls
docker network inspect bridge

# Container inspection
docker inspect container_name
docker exec container_name env
docker exec container_name id

# Compose validation
docker compose config

# Enter a container shell
docker exec -it container_name sh
docker exec -it container_name bash

# Clean up
docker system prune -a
docker volume prune
```

## FAQ

### My container works with docker run but not docker compose. Why?

Check for differences in: port mappings, volume mounts, environment variables, and network mode. Run `docker compose config` to see the resolved configuration and compare it to your `docker run` command.

### How do I access a container that keeps crashing?

Override the entrypoint to get a shell: `docker compose run --rm --entrypoint sh myservice`. This starts the container without running the normal startup command, so you can investigate.

### Why does my container lose data when recreated?

Data is only persisted in volumes. If you're using anonymous volumes or writing to the container filesystem (not a mounted volume), data is lost on recreate. See [Docker Volumes](/foundations/docker-volumes/).

### How do I reset a container to a fresh state?

```bash
docker compose down -v  # -v removes named volumes (DATA LOSS)
docker compose up -d
```

**Warning:** `-v` deletes all data in named volumes. Only use this if you want a fresh start.

### Docker Compose V1 vs V2 — which am I using?

```bash
docker compose version  # V2 (current, built into Docker)
docker-compose version  # V1 (legacy, separate binary)
```

Use V2 (`docker compose` with a space). V1 (`docker-compose` with a hyphen) is deprecated.

## Next Steps

- [Docker Compose Basics](/foundations/docker-compose-basics/) — review fundamentals
- [Docker Networking](/foundations/docker-networking/) — understand container networking
- [Docker Volumes](/foundations/docker-volumes/) — persistent storage

## Related

- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Docker Networking](/foundations/docker-networking/)
- [Docker Volumes](/foundations/docker-volumes/)
- [Docker Environment Variables](/foundations/docker-environment-variables/)
- [Linux File Permissions](/foundations/linux-permissions/)
- [Getting Started with Self-Hosting](/foundations/getting-started/)
