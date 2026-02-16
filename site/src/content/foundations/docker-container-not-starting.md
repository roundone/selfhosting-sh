---
title: "Docker Container Won't Start — Fixes"
description: "Diagnose why your Docker container won't start — exit codes, missing images, config errors, resource limits, and dependency failures explained."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["docker", "troubleshooting", "containers", "foundations"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Container Won't Start

Your container is stuck in `Exited`, `Created`, or `Restarting` status. The fix depends on why it's failing. This guide walks through every common cause, organized by the exit code and error message you'll see.

## Prerequisites

- Docker and Docker Compose installed ([Docker Compose Basics](/foundations/docker-compose-basics))
- Terminal access to your server ([SSH Setup](/foundations/ssh-setup))

## Step 1: Check Status and Logs

Always start here:

```bash
# Check container status
docker compose ps

# Read the logs — the answer is almost always here
docker compose logs --tail=100 servicename

# If the container exited, check the exit code
docker inspect servicename --format='{{.State.ExitCode}}'
```

## Exit Code 1 — Application Error

The application crashed during startup. This is the most common exit code.

### Missing or Wrong Environment Variables

```bash
# Check what the container sees
docker compose config | grep -A 20 servicename
```

The fix depends on the app. Common patterns:

```yaml
# Database URL not set or wrong format
DATABASE_URL: postgres://user:pass@db:5432/myapp

# Secret key not set (many web apps require this)
SECRET_KEY: generate-a-random-string-here

# Admin password missing
ADMIN_PASSWORD: changeme
```

Read the app's documentation or GitHub README for required environment variables. Check for an `.env.example` file in the app's repository.

### Database Not Ready

The app container starts before the database is ready to accept connections.

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

For MySQL/MariaDB:

```yaml
db:
  image: mariadb:11.3
  healthcheck:
    test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
    interval: 5s
    timeout: 5s
    retries: 5
```

For Redis:

```yaml
redis:
  image: redis:7.2
  healthcheck:
    test: ["CMD", "redis-cli", "ping"]
    interval: 5s
    timeout: 5s
    retries: 5
```

### Configuration File Errors

```bash
# Enter the container to check config files
docker compose run --rm --entrypoint sh servicename

# Inside the container, check if config files exist and are valid
ls -la /etc/myapp/
cat /etc/myapp/config.yml
```

If you're mounting a config file, verify:
- The host file exists
- The path inside the container is correct
- The file has the right syntax (YAML indentation, JSON brackets, etc.)
- File permissions allow the container user to read it

## Exit Code 126 — Permission Denied on Entrypoint

The entrypoint script exists but isn't executable.

```bash
# Check the entrypoint file permissions
ls -la /path/to/entrypoint.sh

# Fix: make it executable
chmod +x /path/to/entrypoint.sh
```

If the entrypoint is inside the image (not mounted), the image may be corrupted. Re-pull it:

```bash
docker compose pull servicename
docker compose up -d servicename
```

## Exit Code 127 — Command Not Found

The entrypoint or command path doesn't exist in the image.

```bash
# Check what the entrypoint is
docker inspect servicename --format='{{json .Config.Entrypoint}}'
docker inspect servicename --format='{{json .Config.Cmd}}'
```

Common causes:
- Override `command:` in docker-compose.yml with a binary that doesn't exist in the image
- Image was built for a different base (Alpine vs Debian — different binary paths)
- Typo in the command

## Exit Code 137 — Out of Memory (OOM Kill)

The Linux kernel killed the container for using too much memory.

```bash
# Confirm OOM kill
docker inspect servicename --format='{{.State.OOMKilled}}'
# true = OOM killed

# Check system memory
free -h

# Check container memory usage
docker stats --no-stream
```

Fixes:

```bash
# Add swap if you don't have any
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

Or limit other containers so this one has enough memory:

```yaml
services:
  myapp:
    deploy:
      resources:
        limits:
          memory: 1G
```

Or reduce the app's memory usage (e.g., set Java heap size, reduce PHP worker count, limit database cache).

## Exit Code 139 — Segfault

A segmentation fault. Usually means:
- Corrupted image — re-pull with `docker compose pull`
- Architecture mismatch — check `uname -m` vs image platform
- Bad host kernel interaction (rare)

```bash
# Check dmesg for the segfault
dmesg | grep -i segfault

# Re-pull the image
docker compose pull servicename
docker compose up -d servicename
```

## Container Stuck in "Created" Status

The container was created but never started. Usually means Docker couldn't set up its environment.

```bash
# Check Docker daemon logs
sudo journalctl -u docker.service --since "10 minutes ago"

# Common cause: network conflict
docker network prune

# Common cause: volume mount path doesn't exist
ls -la /path/to/your/volume
```

## Container in Restart Loop

The container starts, crashes, restarts, crashes — infinitely.

```bash
# Check restart count
docker inspect servicename --format='{{.RestartCount}}'

# Stop the loop to investigate
docker compose stop servicename

# Read logs from the last crash
docker compose logs --tail=50 servicename

# Run interactively with a shell (bypass entrypoint)
docker compose run --rm --entrypoint sh servicename
```

Inside the shell, you can:
- Check if config files are present and readable
- Check if the data directory has correct permissions
- Try running the application command manually to see the error

## Port Conflicts

```
Error: Bind for 0.0.0.0:8080 failed: port is already allocated
```

```bash
# Find what's using the port
sudo ss -tlnp | grep :8080

# If it's another Docker container
docker ps --format "{{.Names}}\t{{.Ports}}" | grep 8080

# Fix: use a different host port
ports:
  - "8081:8080"  # Map to 8081 on the host instead
```

See [Port Already In Use](/foundations/port-already-in-use) for detailed solutions.

## Image Pull Issues

### Image Doesn't Exist

```
Error: manifest for myapp:v999 not found
```

The tag doesn't exist. Check the correct tag on Docker Hub, GitHub Container Registry, or the app's documentation.

### Architecture Mismatch

```
exec format error
```

```bash
# Your architecture
uname -m

# Pull for a specific platform
docker pull --platform linux/amd64 myimage:tag
```

See [Docker Multi-Architecture](/foundations/docker-multi-arch) for details.

## Dependency Service Failures

If the app depends on a database, cache, or other service that isn't starting, fix the dependency first.

```bash
# Check ALL services
docker compose ps

# If the database won't start, fix that first
docker compose logs --tail=50 db
```

Common database startup issues:
- **Wrong password format:** Some characters break YAML. Quote passwords: `'p@$$w0rd!'`
- **Data directory permissions:** `sudo chown -R 999:999 /data/postgres` (PostgreSQL runs as UID 999)
- **Data directory not empty:** First-time initialization fails if the volume already has files from a different database version

## Comprehensive Diagnostic Script

Run this to get a quick overview:

```bash
#!/bin/bash
echo "=== Container Status ==="
docker compose ps

echo -e "\n=== Recent Logs ==="
docker compose logs --tail=20

echo -e "\n=== Disk Space ==="
df -h /

echo -e "\n=== Memory ==="
free -h

echo -e "\n=== Docker Disk Usage ==="
docker system df

echo -e "\n=== Recent Docker Events ==="
docker events --since 5m --until 0s 2>/dev/null || true
```

## FAQ

### My container starts fine manually with `docker run` but fails with `docker compose up`. Why?

Compare the two configurations. Common differences: environment variable handling (Compose uses `.env` files), volume mount paths, network mode, and user/group settings. Run `docker compose config` to see the resolved Compose configuration.

### The container starts but immediately exits with code 0. Is that an error?

Exit code 0 means clean exit. Some containers are designed to run a task and exit (database migrations, backup scripts). If it's supposed to stay running, check if the main process is configured as a foreground process, not a daemon that forks and exits.

### How do I access a container that keeps crashing before I can exec into it?

Override the entrypoint: `docker compose run --rm --entrypoint sh servicename`. This starts the container with a shell instead of the normal startup command.

### My container worked yesterday but won't start today. Nothing changed.

Something always changed. Check: disk space full (`df -h`), Docker auto-updated an image (if using `:latest`), host rebooted and volumes aren't mounted, TLS certificate expired, external API the app depends on is down. Check host logs: `journalctl --since yesterday`.

## Related

- [Docker Troubleshooting](/foundations/docker-troubleshooting)
- [Docker Common Issues](/foundations/docker-common-issues)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Docker Volumes](/foundations/docker-volumes)
- [Docker Environment Variables](/foundations/docker-environment-variables)
- [Docker Networking](/foundations/docker-networking)
- [Container Logging](/foundations/container-logging)
