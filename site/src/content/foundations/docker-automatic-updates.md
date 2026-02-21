---
title: "Automatic Docker Container Updates"
description: "Set up automatic Docker container updates with DIUN, What's Up Docker, and alternatives — update strategies, rollback plans, and safe automation."
date: 2026-02-16
dateUpdated: 2026-02-21
category: "foundations"
apps: []
tags: ["docker", "updates", "watchtower", "automation", "foundations"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## The Container Update Problem

Docker containers don't update themselves. When the maintainer publishes a new image, your running container stays on the old version. You need to manually pull the new image and recreate the container. For one or two services, that's manageable. For 20+, it's a maintenance burden.

This guide covers automatic update solutions, when to use them, and when not to.

## Prerequisites

- Docker and Docker Compose installed ([Docker Compose Basics](/foundations/docker-compose-basics/))
- Understanding of Docker images and tags ([Docker Image Management](/foundations/docker-image-management/))
- Terminal access to your server ([SSH Setup](/foundations/ssh-setup/))

## Should You Auto-Update?

Automatic updates are convenient but come with risk. A broken update at 3 AM with no one watching can take down services.

**Good candidates for auto-update:**
- Non-critical services (dashboard, link pages, speedtest)
- Services that follow semantic versioning and rarely break
- Services where you pin to a major version tag (e.g., `postgres:16`)

**Bad candidates for auto-update:**
- Databases (PostgreSQL, MariaDB) — major version updates require migration
- Services with complex configs that break between versions
- Business-critical services where downtime matters

**Recommended approach:** Auto-update most services, but exclude databases and critical services. Monitor notifications so you know what changed.

## Watchtower

> **Watchtower is deprecated.** The `containrrr/watchtower` repository is archived and no longer maintained. For new setups, use [DIUN](/apps/diun/) (notify-only, never touches containers) or [What's Up Docker](https://github.com/fmartinou/whats-up-docker) (actively maintained, supports manual approval). The configuration below is kept for reference if you have an existing Watchtower installation.

Watchtower was the most popular automatic update tool for Docker containers. It monitors running containers, checks for new image versions, pulls them, and recreates containers with the same configuration.

### Basic Setup

```yaml
services:
  watchtower:
    image: containrrr/watchtower:1.7.1
    container_name: watchtower
    restart: unless-stopped
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      WATCHTOWER_CLEANUP: "true"          # Remove old images
      WATCHTOWER_SCHEDULE: "0 0 4 * * *"  # Run at 4 AM daily
      WATCHTOWER_TIMEOUT: 30s
```

### Monitor Only (No Automatic Updates)

If you want notifications without automatic updates:

```yaml
services:
  watchtower:
    image: containrrr/watchtower:1.7.1
    container_name: watchtower
    restart: unless-stopped
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      WATCHTOWER_MONITOR_ONLY: "true"
      WATCHTOWER_SCHEDULE: "0 0 4 * * *"
      WATCHTOWER_NOTIFICATIONS: email
      WATCHTOWER_NOTIFICATION_EMAIL_FROM: admin@example.com
      WATCHTOWER_NOTIFICATION_EMAIL_TO: you@example.com
      WATCHTOWER_NOTIFICATION_EMAIL_SERVER: smtp.example.com
      WATCHTOWER_NOTIFICATION_EMAIL_SERVER_PORT: "587"
      WATCHTOWER_NOTIFICATION_EMAIL_SERVER_USER: admin@example.com
      WATCHTOWER_NOTIFICATION_EMAIL_SERVER_PASSWORD: your-smtp-password
```

### Exclude Specific Containers

Label containers you don't want updated:

```yaml
services:
  postgres:
    image: postgres:16.2
    labels:
      - "com.centurylinklabs.watchtower.enable=false"
```

### Include Only Specific Containers

Alternatively, only update explicitly labeled containers:

```yaml
services:
  watchtower:
    image: containrrr/watchtower:1.7.1
    environment:
      WATCHTOWER_LABEL_ENABLE: "true"  # Only update labeled containers

  # This container WILL be updated
  nextcloud:
    image: nextcloud:29.0.0
    labels:
      - "com.centurylinklabs.watchtower.enable=true"

  # This container will NOT be updated (no label)
  postgres:
    image: postgres:16.2
```

### Notification Options

Watchtower supports multiple notification channels:

```yaml
environment:
  # Email
  WATCHTOWER_NOTIFICATIONS: email

  # Slack
  WATCHTOWER_NOTIFICATIONS: slack
  WATCHTOWER_NOTIFICATION_SLACK_HOOK_URL: "https://hooks.slack.com/services/xxx"

  # Gotify (self-hosted)
  WATCHTOWER_NOTIFICATIONS: gotify
  WATCHTOWER_NOTIFICATION_GOTIFY_URL: "http://gotify:80"
  WATCHTOWER_NOTIFICATION_GOTIFY_TOKEN: "your-token"

  # Generic webhook
  WATCHTOWER_NOTIFICATIONS: shoutrrr
  WATCHTOWER_NOTIFICATION_URL: "discord://token@channel"
```

## Manual Update Workflow

When you don't use auto-updates, here's the efficient manual process:

```bash
# Pull latest images for all services
docker compose pull

# Check what changed
docker compose ps  # Note current image IDs
docker images      # See newly pulled images

# Recreate containers with new images
docker compose up -d

# Verify everything is working
docker compose ps
docker compose logs --tail=20
```

### Update Script

```bash
#!/bin/bash
# update.sh — Update all Docker Compose stacks

COMPOSE_DIRS=(
  "/opt/reverse-proxy"
  "/opt/nextcloud"
  "/opt/jellyfin"
  "/opt/monitoring"
)

for dir in "${COMPOSE_DIRS[@]}"; do
  echo "=== Updating $dir ==="
  cd "$dir" || continue
  docker compose pull
  docker compose up -d
  echo ""
done

# Clean up old images
docker image prune -f

echo "=== Update complete ==="
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
```

See [Docker Updating](/foundations/docker-updating/) for the complete manual update process.

## Rollback Strategy

Before updating, know how to roll back.

### With Pinned Tags

If you pin version tags (recommended), rolling back is straightforward:

```yaml
# Before update
image: nextcloud:28.0.0

# After update (change the tag)
image: nextcloud:29.0.0

# To rollback (change back)
image: nextcloud:28.0.0
```

```bash
docker compose up -d  # Recreate with the old version
```

### Without Pinned Tags

If you used a floating tag like `:latest`, the old image may have been deleted during cleanup. This is why pinning versions matters.

```bash
# Check if the old image still exists
docker images myapp

# If gone, you can't easily roll back
# This is why you should always pin versions
```

### Database Rollbacks

Database rollbacks are more complex because data may have been migrated.

```bash
# BEFORE updating a database, create a backup
docker exec postgres pg_dumpall -U postgres > /backup/db-$(date +%Y%m%d).sql

# If the update breaks things, restore
docker compose down
docker volume rm myproject_postgres_data
docker compose up -d postgres
docker exec -i postgres psql -U postgres < /backup/db-YYYYMMDD.sql
```

See [Backup Docker Volumes](/foundations/backup-docker-volumes/) for backup strategies.

## Update Schedule Recommendations

| Category | Update Frequency | Method |
|----------|-----------------|--------|
| Security-critical (reverse proxy, auth) | Weekly | Manual or auto with notifications |
| Standard web apps | Weekly to monthly | Auto with [DIUN](/apps/diun/) notifications or [What's Up Docker](https://github.com/fmartinou/whats-up-docker) |
| Databases | Monthly, after backup | Manual only |
| Monitoring tools | Monthly | Auto with [DIUN](/apps/diun/) notifications or [What's Up Docker](https://github.com/fmartinou/whats-up-docker) |
| Media servers | Monthly | Auto or manual |

### Cron-Based Manual Updates

If you prefer manual updates on a schedule:

```bash
# /etc/cron.d/docker-updates
# Check for updates every Sunday at 3 AM, send email with results
0 3 * * 0 root /opt/scripts/check-updates.sh | mail -s "Docker Update Report" admin@example.com
```

```bash
#!/bin/bash
# check-updates.sh — Check for available updates (don't apply)
echo "Docker Image Update Check — $(date)"
echo "================================"

for dir in /opt/*/docker-compose.yml; do
  dir=$(dirname "$dir")
  cd "$dir" || continue
  echo -e "\n--- $dir ---"
  docker compose pull --dry-run 2>&1 || docker compose pull 2>&1 | grep -v "up to date"
done
```

## FAQ

### Is Watchtower safe to use in production?

Watchtower is now deprecated — the `containrrr/watchtower` repository has been archived. It was widely used but carried inherent risk, as any automatic update can break things. For new setups, use [DIUN](/apps/diun/) (notify-only) or [What's Up Docker](https://github.com/fmartinou/whats-up-docker) (actively maintained with manual approval support). If you have an existing Watchtower installation, it will continue to function but will not receive updates or security patches.

### Why shouldn't I use `:latest` tags with auto-updates?

`:latest` is a moving target. Watchtower will pull whatever `:latest` points to, which could be a major version bump with breaking changes. With pinned tags like `nextcloud:29`, Watchtower only updates within that version (patch releases), which are usually safe.

### Can Watchtower update itself?

Yes. Watchtower monitors its own container by default. You can disable this with `WATCHTOWER_INCLUDE_STOPPED=false` or by labeling it with `com.centurylinklabs.watchtower.enable=false`.

### What about Docker Compose file changes?

Watchtower only updates images — it doesn't modify your `docker-compose.yml`. If a new version requires new environment variables or volume mounts, Watchtower will pull the image but the container may fail with the old config. For these cases, manual updates with config changes are required.

## Related

- [Docker Updating](/foundations/docker-updating/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Docker Image Management](/foundations/docker-image-management/)
- [Backup Docker Volumes](/foundations/backup-docker-volumes/)
- [Docker Common Issues](/foundations/docker-common-issues/)
- [Monitoring Basics](/foundations/monitoring-basics/)
