---
title: "Docker Healthchecks Explained"
description: "Configure Docker healthchecks to detect and auto-restart unresponsive containers. Keep your self-hosted services running reliably."
date: "2026-02-17"
dateUpdated: "2026-02-17"
category: "foundations"
apps: []
tags: ["docker", "healthcheck", "monitoring", "reliability"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Are Docker Healthchecks?

A Docker healthcheck is a command that runs periodically inside a container to verify the service is actually working. Without healthchecks, Docker only knows if the container process is running — not whether it's responding to requests. A container can be "Up" for days while the application inside is deadlocked, out of memory, or returning 500 errors.

Healthchecks add a third status beyond "running" and "stopped": **healthy** or **unhealthy**. Combined with `restart: unless-stopped`, Docker automatically restarts unhealthy containers.

## Prerequisites

- Docker Engine 20.10+ with Docker Compose ([Docker Compose Basics](/foundations/docker-compose-basics/))
- A running self-hosted service to add healthchecks to

## How Healthchecks Work

1. Docker runs the healthcheck command inside the container at a specified interval
2. Exit code 0 = healthy, exit code 1 = unhealthy
3. After a configurable number of consecutive failures, the container is marked **unhealthy**
4. If `restart: unless-stopped` is set, Docker restarts unhealthy containers

```
Container starts → "starting" status
  ↓ (healthcheck passes)
"healthy" status
  ↓ (healthcheck fails 3 times in a row)
"unhealthy" status
  ↓ (Docker restarts the container)
Container restarts → "starting" status → ...
```

## Adding Healthchecks in Docker Compose

### Basic Syntax

```yaml
services:
  myapp:
    image: myapp:1.0
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    restart: unless-stopped
```

| Parameter | What It Does | Recommended Value |
|-----------|-------------|-------------------|
| `test` | Command to run inside the container | Depends on the service |
| `interval` | Time between healthcheck runs | 30s for most services |
| `timeout` | Maximum time a single check can take | 10s |
| `retries` | Consecutive failures before "unhealthy" | 3 |
| `start_period` | Grace period after container start (failures don't count) | 30-60s for apps with slow startup |

### Test Command Formats

```yaml
# Shell form (runs through /bin/sh)
test: curl -f http://localhost:8080/health || exit 1

# Exec form (no shell, more reliable)
test: ["CMD", "curl", "-f", "http://localhost:8080/health"]

# Exec form with shell
test: ["CMD-SHELL", "curl -f http://localhost:8080/health || exit 1"]
```

Use `CMD-SHELL` when you need shell features (pipes, `||`, variable expansion). Use `CMD` for simple commands without shell processing.

## Healthcheck Patterns by Service Type

### Web Applications

Most self-hosted web apps expose an HTTP endpoint:

```yaml
services:
  nextcloud:
    image: nextcloud:29.0
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/status.php"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    restart: unless-stopped
```

If `curl` isn't installed in the container, use `wget`:

```yaml
healthcheck:
  test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:8080"]
  interval: 30s
  timeout: 10s
  retries: 3
```

### PostgreSQL

```yaml
services:
  postgres:
    image: postgres:16.2
    environment:
      POSTGRES_PASSWORD: change-me
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    restart: unless-stopped
```

`pg_isready` is a PostgreSQL utility that checks if the server is accepting connections. It's always available inside the official PostgreSQL image.

### MariaDB / MySQL

```yaml
services:
  mariadb:
    image: mariadb:11.3
    environment:
      MARIADB_ROOT_PASSWORD: change-me
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    restart: unless-stopped
```

The official MariaDB image includes `healthcheck.sh`. For MySQL, use:

```yaml
healthcheck:
  test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
```

### Redis

```yaml
services:
  redis:
    image: redis:7.2
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3
    restart: unless-stopped
```

`redis-cli ping` returns "PONG" (exit code 0) if Redis is responsive.

### Services Without curl or wget

Some minimal container images don't include HTTP clients. Use `/dev/tcp` through the shell:

```yaml
healthcheck:
  test: ["CMD-SHELL", "echo > /dev/tcp/localhost/8080 || exit 1"]
  interval: 30s
  timeout: 10s
  retries: 3
```

This only checks that the port is open — not that the application is responding correctly. It's better than nothing.

## Healthcheck-Dependent Startup

Use `depends_on` with `condition` to ensure dependent services are healthy before starting:

```yaml
services:
  postgres:
    image: postgres:16.2
    environment:
      POSTGRES_PASSWORD: change-me
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    restart: unless-stopped

  nextcloud:
    image: nextcloud:29.0
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      POSTGRES_HOST: postgres
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/status.php"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    restart: unless-stopped
```

With `condition: service_healthy`, Nextcloud won't start until PostgreSQL's healthcheck passes. Without this, Nextcloud might start before the database is ready and crash.

## Checking Container Health

```bash
# View health status in docker ps
docker ps
# CONTAINER ID   IMAGE          STATUS
# abc123         nextcloud:29   Up 5m (healthy)
# def456         postgres:16    Up 5m (healthy)
# ghi789         myapp:1.0      Up 2m (unhealthy)

# Detailed health info
docker inspect --format='{{json .State.Health}}' container_name | jq .

# Just the status
docker inspect --format='{{.State.Health.Status}}' container_name

# View healthcheck logs (last 5 checks)
docker inspect --format='{{json .State.Health.Log}}' container_name | jq .
```

## Complete Example: Full Stack with Healthchecks

```yaml
services:
  db:
    image: postgres:16.2
    environment:
      POSTGRES_DB: app
      POSTGRES_USER: appuser
      POSTGRES_PASSWORD: secure-password-here
    volumes:
      - db_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U appuser -d app"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    restart: unless-stopped

  redis:
    image: redis:7.2
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3
    restart: unless-stopped

  app:
    image: myapp:2.1.0
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      DATABASE_URL: postgres://appuser:secure-password-here@db:5432/app
      REDIS_URL: redis://redis:6379
    ports:
      - "8080:8080"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 45s
    restart: unless-stopped

volumes:
  db_data:
  redis_data:
```

## Common Mistakes

### Healthchecks That Always Pass

A healthcheck that only tests "is the port open?" doesn't catch application-level failures. Test the actual application endpoint, not just network connectivity.

```yaml
# Bad: only checks if port is open
test: ["CMD-SHELL", "echo > /dev/tcp/localhost/8080"]

# Good: checks if the app responds correctly
test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
```

### Too Aggressive Intervals

Checking every 5 seconds with 1 retry causes frequent false-positive restarts during temporary load spikes. Use 30-second intervals with 3 retries as a baseline.

### Missing start_period

Applications that take 30+ seconds to start will be flagged unhealthy before they're ready, triggering a restart loop. Set `start_period` to at least the application's typical startup time.

### Healthcheck Tool Not in Container

If your healthcheck command (`curl`, `wget`) isn't installed in the container image, the healthcheck silently fails. Check with `docker exec container_name which curl`. If not available, use `/dev/tcp` or a language-specific check.

## Next Steps

- Set up external monitoring with [Monitoring Basics](/foundations/monitoring-basics/)
- Learn about [Docker Resource Limits](/foundations/docker-resource-limits/) to prevent resource exhaustion
- Handle startup ordering with [Docker Compose Basics](/foundations/docker-compose-basics/)
- Debug container issues with [Docker Troubleshooting](/foundations/docker-troubleshooting/)

## FAQ

### Do all Docker images include healthchecks?

No. Most images don't define a default healthcheck. You need to add them in your Docker Compose file. Some images (like the official MariaDB image) include healthcheck utilities but don't enable them by default.

### Does Docker automatically restart unhealthy containers?

Only if `restart: unless-stopped` or `restart: always` is set. The unhealthy status alone doesn't trigger a restart — it's the combination of the unhealthy state and the restart policy.

### What's the difference between healthcheck and depends_on?

`depends_on` controls startup order — it ensures services start in the right sequence. `healthcheck` monitors ongoing health. Together with `condition: service_healthy`, they ensure a service doesn't start until its dependency is actually ready, not just running.

### Can healthchecks cause performance issues?

A simple `curl -f http://localhost/health` every 30 seconds has negligible overhead. Avoid healthchecks that query large database tables or trigger expensive computations. The check should be lightweight.

### How do I disable a healthcheck defined in the image?

```yaml
healthcheck:
  disable: true
```

This disables any healthcheck defined in the Dockerfile. Useful for debugging but don't leave it disabled in production.

## Related

- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Docker Troubleshooting](/foundations/docker-troubleshooting/)
- [Docker Resource Limits](/foundations/docker-resource-limits/)
- [Monitoring Basics](/foundations/monitoring-basics/)
- [Docker Container Not Starting](/foundations/docker-container-not-starting/)
- [Docker Performance Tuning](/foundations/docker-performance-tuning/)
