---
title: "Docker Container Logging Guide"
description: "Manage Docker container logs effectively — view logs, configure rotation, centralize with Loki, and debug issues in your self-hosted services."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["docker", "logging", "debugging", "foundations"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Why Container Logging Matters

Docker container logs are your primary debugging tool. When a service crashes, won't start, or behaves unexpectedly, the logs tell you why. Without log management, logs grow unbounded until they fill your disk — a common cause of homelab outages.

## Prerequisites

- Docker and Docker Compose installed ([Docker Compose Basics](/foundations/docker-compose-basics))
- Basic command line skills ([Linux Basics](/foundations/linux-basics-self-hosting))

## Viewing Container Logs

### Docker Compose Logs

```bash
# All services in the stack
docker compose logs

# Specific service
docker compose logs nextcloud

# Last 50 lines
docker compose logs --tail=50 nextcloud

# Follow in real time (like tail -f)
docker compose logs -f nextcloud

# Follow with limited history
docker compose logs -f --tail=50 nextcloud

# Show timestamps
docker compose logs -t nextcloud

# Since a specific time
docker compose logs --since="2026-02-16T10:00:00" nextcloud

# Last 30 minutes
docker compose logs --since=30m nextcloud
```

### Docker CLI Logs

```bash
# By container name
docker logs mycontainer

# Same options as Compose
docker logs --tail=50 -f mycontainer
docker logs --since=1h mycontainer
docker logs -t mycontainer
```

### Searching Logs

```bash
# Search for errors
docker compose logs nextcloud 2>&1 | grep -i error

# Search for a specific pattern
docker compose logs nextcloud 2>&1 | grep "database"

# Count occurrences
docker compose logs nextcloud 2>&1 | grep -c "ERROR"
```

## Log Rotation (Critical)

By default, Docker stores logs as JSON files with **no size limit**. A busy container can generate gigabytes of logs and fill your disk.

### Configure Log Rotation Globally

Add to `/etc/docker/daemon.json`:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

```bash
sudo systemctl restart docker
```

This limits each container to 3 log files of 10 MB each (30 MB max per container). Adjust based on your disk space and how verbose your containers are.

**Recommendation:** `10m` and `3` files is a good default. For verbose apps (databases, web servers with access logs), consider `50m` and `5` files.

### Configure Per-Container

Override global settings for specific containers:

```yaml
services:
  verbose-app:
    image: myapp:v1.0
    logging:
      driver: json-file
      options:
        max-size: "50m"
        max-file: "5"
    restart: unless-stopped

  quiet-app:
    image: utility:v1.0
    logging:
      driver: json-file
      options:
        max-size: "5m"
        max-file: "2"
    restart: unless-stopped
```

### Check Current Log Sizes

```bash
# Find all container log files and their sizes
sudo find /var/lib/docker/containers -name "*.log" -exec ls -lh {} \;

# Total Docker log disk usage
sudo du -sh /var/lib/docker/containers/*/

# Clean logs for a specific container (nuclear option)
sudo truncate -s 0 /var/lib/docker/containers/<container-id>/<container-id>-json.log
```

## Log Levels

Most applications output logs at different severity levels:

| Level | Meaning | Action |
|-------|---------|--------|
| DEBUG | Detailed internal state | Ignore unless debugging a specific issue |
| INFO | Normal operation events | Monitor for patterns |
| WARN | Potential issues | Investigate if recurring |
| ERROR | Something failed | Fix the underlying cause |
| FATAL/CRITICAL | Service can't continue | Immediate attention required |

Many apps let you configure the log level via environment variables:

```yaml
environment:
  - LOG_LEVEL=warn     # Only warnings and above
  # or
  - LOG_LEVEL=info     # Default for most apps
  # or
  - LOG_LEVEL=debug    # Verbose — use only for debugging
```

**Recommendation:** Use `info` or `warn` for production. Switch to `debug` temporarily when troubleshooting, then switch back.

## Structured Logging

### JSON Logs

Some containers output structured JSON logs instead of plain text:

```json
{"time":"2026-02-16T10:00:00Z","level":"error","msg":"database connection failed","host":"db","port":5432}
```

Parse JSON logs with `jq`:

```bash
docker logs mycontainer 2>&1 | jq 'select(.level == "error")'
docker logs mycontainer 2>&1 | jq '{time: .time, msg: .msg}'
```

### Access Logs vs Application Logs

Web apps typically produce two types of logs:

- **Access logs:** Every HTTP request (who, what, when)
- **Application logs:** Business logic, errors, warnings

These may be on stdout (mixed) or in separate files inside the container:

```bash
# Access logs from Nginx
docker exec nginx cat /var/log/nginx/access.log

# Application logs from Nextcloud
docker exec nextcloud cat /var/www/html/data/nextcloud.log
```

## Centralized Logging with Loki

For servers running 10+ containers, scrolling through individual container logs is impractical. Loki + Grafana provides a centralized, searchable log interface.

```yaml
services:
  loki:
    image: grafana/loki:3.3.2
    command: -config.file=/etc/loki/local-config.yaml
    ports:
      - "127.0.0.1:3100:3100"
    volumes:
      - loki-data:/loki
    restart: unless-stopped

  promtail:
    image: grafana/promtail:3.3.2
    volumes:
      - /var/log:/var/log:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - ./promtail-config.yml:/etc/promtail/config.yml:ro
    restart: unless-stopped

  grafana:
    image: grafana/grafana:11.4.0
    ports:
      - "127.0.0.1:3000:3000"
    volumes:
      - grafana-data:/var/lib/grafana
    restart: unless-stopped

volumes:
  loki-data:
  grafana-data:
```

Basic Promtail configuration to collect Docker logs:

```yaml
# promtail-config.yml
server:
  http_listen_port: 9080

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: docker
    static_configs:
      - targets:
          - localhost
        labels:
          job: docker
          __path__: /var/lib/docker/containers/*/*-json.log
    pipeline_stages:
      - docker: {}
```

**When to add Loki:** When you have 10+ containers and spend significant time grep-ing through logs. For smaller setups, `docker compose logs` is sufficient.

## Practical Debugging Workflow

When a container has issues:

```bash
# 1. Check status
docker compose ps
# Is it running? Restarting? Exited?

# 2. Check recent logs
docker compose logs --tail=100 myservice

# 3. Look for errors
docker compose logs myservice 2>&1 | grep -i "error\|fatal\|panic\|exception"

# 4. Check health
docker inspect myservice --format='{{.State.Health.Status}}'

# 5. If restarting — check the last exit
docker inspect myservice --format='Exit: {{.State.ExitCode}}, OOMKilled: {{.State.OOMKilled}}'

# 6. Enable debug logging temporarily
# Edit docker-compose.yml: LOG_LEVEL=debug
docker compose up -d myservice
docker compose logs -f --tail=50 myservice
# After debugging, set back to LOG_LEVEL=info
```

## Common Mistakes

### 1. Not Configuring Log Rotation

The single most common logging mistake. A database container generating access logs at 100 MB/day fills a 20 GB disk in months. Always configure rotation in `/etc/docker/daemon.json`.

### 2. Truncating Logs Instead of Fixing the Root Cause

If you're constantly truncating logs because they're too big, either configure rotation or fix whatever is generating excessive log output (often DEBUG level logging left on).

### 3. Using docker logs on Long-Running Containers Without --tail

`docker logs mycontainer` dumps ALL logs from container start. For a container running for months, this can be millions of lines. Always use `--tail=N`.

### 4. Ignoring WARNING-Level Logs

Warnings often predict imminent failures — disk space running low, certificate expiring, deprecated config option. Review warnings weekly.

### 5. Logging Sensitive Data

Some apps log request bodies, passwords in connection strings, or API keys. Check your containers' logs for leaked secrets and configure the app to redact sensitive fields.

## FAQ

### Where are Docker logs stored on disk?

In `/var/lib/docker/containers/<container-id>/<container-id>-json.log`. Don't edit these files directly — use Docker commands to manage logs.

### How do I clear all logs for a container?

```bash
sudo truncate -s 0 $(docker inspect --format='{{.LogPath}}' mycontainer)
```

Or better: configure log rotation so this happens automatically.

### Do Docker logs survive container recreation?

No. When you `docker compose down` and `up`, logs from the old container are gone. For persistent logs, write to a mounted volume or use centralized logging.

### Should I log to files inside containers or to stdout?

Stdout. Docker captures stdout/stderr automatically. Logging to files inside the container requires mounting a volume and managing rotation separately. The Docker ecosystem (and most container best practices) expects logs on stdout.

### How much disk space should I budget for logs?

With default rotation (10 MB × 3 files per container), each container uses up to 30 MB. 20 containers = 600 MB max. Budget 1 GB for logs on a small setup, 5 GB for a large one.

## Next Steps

- [Docker Troubleshooting](/foundations/docker-troubleshooting) — fix common container issues
- [Monitoring Your Home Server](/foundations/monitoring-basics) — track service health
- [Docker Compose Basics](/foundations/docker-compose-basics) — container management fundamentals

## Related

- [Docker Troubleshooting Guide](/foundations/docker-troubleshooting)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Monitoring Your Home Server](/foundations/monitoring-basics)
- [Linux Basics for Self-Hosting](/foundations/linux-basics-self-hosting)
- [Docker Environment Variables](/foundations/docker-environment-variables)
- [Getting Started with Self-Hosting](/foundations/getting-started)
